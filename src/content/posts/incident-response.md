---
title: "应急响应"
published: 2026-10-07T23:06:00+08:00
description: "Windows 与 Linux 的入侵排查路径，含账号、进程、启动项、日志与 Webshell 查杀。"
image: ""
tags:
  - 安全笔记
  - 应急响应
category: 技术文章
draft: false
lang: zh-CN
pinned: false
comment: true
---

## 一、应急响应概述

### 1.1 什么是应急响应？

当企业发生黑客入侵、系统崩溃或其它影响业务正常运行的安全事件时，第一时间进行处理，使系统在最短时间内恢复正常，进一步查找入侵来源，还原入侵事故过程，给出解决方案与防范措施。

### 1.2 入侵排查总体思路

| 排查方向     | 检查内容                     |
| ------------ | ---------------------------- |
| **账号安全** | 可疑账号、隐藏账号、克隆账号 |
| **异常连接** | 可疑端口、外连IP、定期回连   |
| **异常进程** | CPU/IO过高、无签名、无描述   |
| **启动项**   | 开机自启、计划任务、服务     |
| **系统信息** | 补丁、可疑文件、文件时间     |
| **日志分析** | 安全日志、Web日志            |

## 二、Windows 入侵排查

### 2.1 检查系统账号安全

#### 查看账号

```plain
# 查看本地用户和组
lusrmgr.msc

# 检查管理员组是否有新增账户
net localgroup administrators
```

#### 检查隐藏账号/克隆账号

**注册表路径：**

```plain
HKEY_LOCAL_MACHINE\SAM\SAM
```

⚠️ 需要给 Administrator 用户赋予 SAM 完全控制和读取权限

**操作步骤：**

1. 导出隐藏账号对应的注册表项（两个 `.reg` 文件）
2. 删除可疑用户：`net user hacker* /del`
3. 导入之前导出的 `.reg` 文件恢复

**工具：** D盾_Web查杀（集成克隆账号检测功能）

#### 查看登录日志

```plain
eventvwr.msc
```

### 2.2 检查异常连接和进程

#### 网络连接

```plain
# 查看所有网络连接
netstat -ano

# 查找特定端口
netstat -ano | findstr "4444"

# 根据 PID 定位进程
tasklist | findstr "PID"
```

#### 检查进程

**方法：**

- 运行 `msinfo32` → 软件环境 → 正在运行任务（查看进程路径、PID、创建日期、启动时间）
- 使用 `resmon`（资源监视器）
- 使用 **Process Explorer**（微软官方工具）
- 使用 **D盾_Web查杀** 查看无签名进程

**可疑进程特征：**

- CPU/IO 占用过高
- 无签名验证信息
- 无描述信息
- 路径异常
- 属主异常

### 2.3 检查启动项、计划任务、服务

#### 启动项

```plain
# 运行 msconfig，查看启动项（老版本）
msconfig

# 注册表启动项位置
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\Run
HKEY_LOCAL_MACHINE\Software\Microsoft\Windows\CurrentVersion\RunOnce

# 启动目录
C:\Users\用户名\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

**推荐工具：** Autoruns（微软 Sysinternals 工具集）

#### 计划任务

```plain
# 查看计划任务
schtasks
# 或
at
```

**路径：** 控制面板 → 任务计划

#### 服务

```plain
services.msc
```

检查服务状态和启动类型，注意异常服务。

### 2.4 Windows 关键安全事件 ID

| 事件ID   | 安全级别 | 类别   | 说明                           |
| -------- | -------- | ------ | ------------------------------ |
| **4624** | 高       | 登录   | 登录成功（需结合登录类型分析） |
| **4625** | 高       | 登录   | 登录失败（暴力破解检测）       |
| **4672** | 高       | 权限   | 特权登录（管理员权限）         |
| **4688** | 高       | 进程   | 进程创建（需开启命令行审计）   |
| **4104** | 高       | 脚本   | PowerShell 脚本块记录          |
| **1102** | 严重     | 防御   | 安全日志被清除（告警！）       |
| **7045** | 高       | 持久化 | 新服务安装                     |
| **4698** | 高       | 持久化 | 计划任务创建                   |
| **4720** | 中       | 账户   | 用户账户创建                   |
| **4726** | 中       | 账户   | 用户账户删除                   |
| **4732** | 中       | 权限   | 成员添加到本地组               |
| **4719** | 高       | 策略   | 系统审计策略变更               |
| **5140** | 中       | 横向   | 网络共享访问                   |

#### 登录类型

| 类型   | 说明                             |
| ------ | -------------------------------- |
| **2**  | 交互式登录（本地登录）           |
| **3**  | 网络登录（共享文件夹、远程桌面） |
| **4**  | 批处理（计划任务启动）           |
| **5**  | 服务启动                         |
| **7**  | 解锁（屏保解锁）                 |
| **8**  | 网络明文（FTP 等）               |
| **9**  | 新凭证（RUNAS /netonly）         |
| **10** | 远程交互（RDP）                  |
| **11** | 缓存交互（无域控时）             |

#### 日志筛选方式

```plain
# 常规：事件查看器图形界面
eventvwr.msc

# XML 筛选
# 例：筛选 EventID=4625 且 LogonType=3

# 命令筛选
wevtutil qe Security /q:"*[System[(EventID=4625)]] and *[EventData[(Data[@Name='LogonType']=3)]]"
```

### 2.5 工具推荐

| 工具                 | 用途                     |
| -------------------- | ------------------------ |
| **Process Explorer** | 进程排查                 |
| **Process Monitor**  | 进程监控                 |
| **Autoruns**         | 启动项排查               |
| **D盾_Web查杀**      | 进程、克隆账号、Webshell |
| **火绒**             | 病毒查杀                 |
| **卡巴斯基 KVRT**    | 绿色版病毒查杀           |
| **大蜘蛛**           | 扫描快                   |

## 三、Linux 入侵排查

### 3.1 账号安全

#### 用户信息文件

```bash
# 用户信息 /etc/passwd
# 格式：用户名:密码:UID:GID:描述:家目录:Shell

# 查看特权用户（UID=0，只有 root 应为 0）
awk -F: '($3==0){print $1}' /etc/passwd

# 查看空密码用户
awk -F: '($2==""){print $1}' /etc/shadow

# 查看可远程登录的用户
awk '/\$1|\$6/{print $1}' /etc/shadow

# 查看有 sudo 权限的普通用户
more /etc/sudoers | grep -v "^#" | grep -v "^$" | grep "ALL=(ALL"

# 禁用/删除用户
usermod -L user      # 禁用账号（shadow 第二栏为 !）
userdel user         # 删除用户
userdel -r user      # 删除用户及家目录
```

**shadow 密码加密类型：**

| 类型   | 加密算法 |
| ------ | -------- |
| `$1$`  | MD5      |
| `$2a$` | Blowfish |
| `$5$`  | SHA-256  |
| `$6$`  | SHA-512  |

### 3.2 历史命令

```bash
# 查看历史命令
history

# 查看用户历史命令文件
cat /home/用户名/.bash_history

# 清除历史（仅清除内存，需手动删除文件）
history -c
```

**增强历史记录（记录时间/登录IP）：**
在 `/etc/profile` 添加：

```bash
USER_IP=`who -u am i 2>/dev/null | awk '{print $NF}' | sed -e 's/[()]//g'`
if [ "$USER_IP" = "" ]; then
    USER_IP=`hostname`
fi
export HISTTIMEFORMAT="%F %T $USER_IP `whoami` "
export PROMPT_COMMAND="history -a"
```

### 3.3 检查网络连接

```bash
# 查看连接状态
netstat -antlp | more
ss -antlp | more

# 查看进程路径
ls -l /proc/<PID>/exe
file /proc/<PID>/exe
cat /proc/<PID>/cmdline
```

### 3.4 检查进程

```bash
ps aux | grep <PID>
ps -elf | grep <PID>
```

### 3.5 检查启动项

| 路径/文件              | 说明             |
| ---------------------- | ---------------- |
| `~/.profile`           | 用户级配置       |
| `~/.bashrc`            | 用户级 bash 配置 |
| `/etc/profile`         | 系统级配置       |
| `/etc/rc.local`        | 开机自启脚本     |
| `/etc/rc.d/rc[0~6].d/` | 运行级别启动目录 |
| `/etc/cron*`           | 定时任务目录     |

**运行级别：**

| 级别 | 说明                  |
| ---- | --------------------- |
| 0    | 关机                  |
| 1    | 单用户模式（修复）    |
| 2    | 不完全命令行（无NFS） |
| 3    | 完全命令行            |
| 4    | 保留                  |
| 5    | 图形模式              |
| 6    | 重启                  |

### 3.6 检查定时任务

```bash
# 查看当前用户定时任务
crontab -l

# 查看 root 定时任务
crontab -l -u root

# 定时任务文件位置
/var/spool/cron/*           # 用户定时任务
/etc/crontab                 # 系统定时任务
/etc/cron.d/*                # 额外定时任务
/etc/cron.daily/*            # 每日任务
/etc/cron.hourly/*           # 每小时任务
/etc/cron.monthly/*          # 每月任务
/etc/cron.weekly/*           # 每周任务
/etc/anacrontab              # 异步定时任务
/var/spool/anacron/*         # anacron 数据
```

### 3.7 检查服务

```bash
# systemd（新系统）
systemctl list-units --type=service          # 列出所有服务
systemctl list-units --type=service --state=running   # 运行中服务
systemctl list-unit-files --type=service --state=enabled   # 已启用服务

# sysvinit（老系统）
chkconfig --list          # 查看服务自启动状态
chkconfig --level 2345 httpd on   # 设置自启动
```

### 3.8 检查异常文件

```bash
# 查找最近修改的文件
find / -type f -newermt "2024-05-19" ! -newermt "2024-05-22"

# 查找一天前访问过的文件
find / -iname "*" -mtime 1 -type f

# 查看文件状态（创建/修改/访问时间）
stat <文件名>

# 查看敏感目录
ls -la /tmp
ls -la /var/tmp
```

### 3.9 Linux 系统日志

| 日志文件                                                 | 说明                                |
| -------------------------------------------------------- | ----------------------------------- |
| `/var/log/messages`                                      | 系统重要日志（优先检查）            |
| `/var/log/auth.log` (Debian) 或 `/var/log/secure` (RHEL) | 认证日志（SSH、su、sudo）           |
| `/var/log/cron`                                          | 定时任务日志                        |
| `/var/log/btmp`                                          | 错误登录日志（`lastb` 查看）        |
| `/var/log/lastlog`                                       | 最后登录时间（`lastlog` 查看）      |
| `/var/log/wtmp`                                          | 所有登录/注销记录（`last` 查看）    |
| `/var/log/utmp`                                          | 当前登录用户（`w`、`who`、`users`） |

**注意：** 二进制日志文件需用专用命令查看：`lastb`、`lastlog`、`last`、`w`、`who`、`users`

#### 日志分析命令

```bash
# 查看爆破 root 的 IP
grep "Failed password for root" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr | more

# 查看所有爆破 IP
grep "Failed password" /var/log/auth.log | grep -E -o "([0-9]{1,3}\.){3}[0-9]{1,3}" | uniq -c | sort -nr

# 查看登录成功的 IP
grep "Accepted " /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr | more

# 查看添加用户记录
grep "useradd" /var/log/auth.log

# 查看删除用户记录
grep "userdel" /var/log/auth.log

# 查看 su 切换
grep "su" /var/log/auth.log

# 查看 sudo 授权执行
grep "sudo" /var/log/auth.log
```

### 3.10 Rootkit 查杀

**chkrootkit：**

```bash
wget ftp://ftp.pangeia.com.br/pub/seg/pac/chkrootkit.tar.gz
tar zxvf chkrootkit.tar.gz
cd chkrootkit-0.52
make sense
./chkrootkit
```

**rkhunter：**

```bash
wget https://nchc.dl.sourceforge.net/project/rkhunter/rkhunter/1.4.4/rkhunter-1.4.4.tar.gz
tar -zxvf rkhunter-1.4.4.tar.gz
cd rkhunter-1.4.4
./installer.sh --install
rkhunter -c
```

### 3.11 病毒查杀

**ClamAV：**

```bash
# 更新病毒库
freshclam

# 扫描目录
clamscan -r /etc --max-dir-recursion=5 -l /root/etcclamav.log
clamscan -r /bin -l /root/binclamav.log

# 扫描并清除
clamscan -r --remove /usr/bin/bsd-port
```

### 3.12 Linux 安全检查脚本

| 项目              | 地址                             |
| ----------------- | -------------------------------- |
| GSCan             | https://github.com/graydda/GSCan |
| linux安全检查脚本 | https://github.com/T0xst/linux   |

## 四、Webshell 查杀

| 工具                   | 地址                       |
| ---------------------- | -------------------------- |
| **D盾_Web查杀**        | http://www.d99net.net      |
| **河马 webshell 查杀** | http://www.shellpub.com    |
| **VirusTotal**         | https://www.virustotal.com |

### 无工具手工排查

```bash
# Linux：使用 diff 对比
diff -r 正常目录 可疑目录

# Windows：使用文件搜索功能（F3）
# 查找最近修改的文件
# 查找 .php/.asp/.jsp 等脚本文件中的可疑代码
```

## 📌 快速命令卡片

```bash
# Linux 快速排查
awk -F: '($3==0){print $1}' /etc/passwd              # 特权用户
awk -F: '($2==""){print $1}' /etc/shadow             # 空密码用户
grep "Failed password" /var/log/auth.log | wc -l     # 爆破次数
grep "Accepted" /var/log/auth.log                    # 登录成功
netstat -antlp | grep ESTABLISHED                    # 异常连接
ps aux --sort=-%cpu | head -20                       # CPU占用前20
crontab -l                                          # 定时任务
ls -la /tmp                                          # 临时目录
find / -newermt "2024-01-01" ! -newermt "2024-01-02" # 指定时间文件
# Windows 快速排查
lusrmgr.msc
eventvwr.msc
netstat -ano
tasklist | findstr "PID"
msinfo32
regedit
msconfig
services.msc
```
