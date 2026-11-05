---
title: "基线检查及安全加固"
published: 2026-10-13T23:08:00+08:00
description: "PHP、Windows、Linux、Apache、Nginx、Tomcat、MySQL 七大对象的基线检查与安全加固清单。"
image: ""
tags:
  - 安全笔记
  - 主机安全
category: 技术文章
draft: false
lang: zh-CN
pinned: false
comment: true
---

## 一、基本概念

### 1.1 核心概念速记

| 缩写     | 全称                       | 说明                                                        |
| -------- | -------------------------- | ----------------------------------------------------------- |
| **OS**   | Operation System           | 操作系统                                                    |
| **DBMS** | Database Management System | 数据库管理系统（Oracle、MySQL、SQL Server、达梦、人大金仓） |
| **FW**   | Firewall                   | 防火墙                                                      |
| **WAF**  | Web Application Firewall   | Web应用防火墙                                               |
| **RT**   | Router                     | 路由器（网关）                                              |
| **SW**   | Switch                     | 交换机                                                      |

**存储单位：**

- 1b（bit）= 1个二进制位
- 1B（Byte）= 8bit
- 1KB = 1024B
- 1MB = 1024KB

### 1.2 什么是基线检查？

检查系统/应用的基本安全配置是否符合标准。

### 1.3 常见问答

| 问题                                         | 答案                                     |
| -------------------------------------------- | ---------------------------------------- |
| 基线检查和安全检测有何区别？                 | 几乎没有区别                             |
| 做完一次基线检查和安全加固后就不用再做了吗？ | **不行**，需定期持续进行                 |
| 什么时候做基线检查？                         | 客户/合同要求时、系统部署后、上线前      |
| 一般对哪些系统做安检加固？                   | OS、DBMS、中间件、网络设备、网络安全设备 |

### 1.4 配置途径

| 途径                       | 使用场景              |
| -------------------------- | --------------------- |
| **命令**                   | cmd/powershell 中执行 |
| **注册表（regedit）**      | Windows 系统配置      |
| **组策略（gpedit.msc）**   | Windows 批量策略配置  |
| **安全策略（secpol.msc）** | Windows 安全配置      |
| **控制面板（control）**    | Windows 图形界面      |
| **配置文件**               | Linux/开源软件        |

------

## 二、PHP 安全加固

### 2.1 PHP 配置文件位置

```bash
# 查找 php.ini
find /etc -name php.ini
# 常见位置：
# /etc/php/7.4/fpm/php.ini
# /etc/php/7.4/cli/php.ini

# 查看已安装 PHP
sudo apt list --installed | grep php
which php
```

### 2.2 PHP 核心加固配置

| 配置项              | 说明                               | 推荐值                                    |
| ------------------- | ---------------------------------- | ----------------------------------------- |
| `open_basedir`      | 限制 PHP 可访问的目录              | `/var/www/html:/tmp`                      |
| `disable_functions` | 禁用危险函数                       | `system,exec,passthru,shell_exec,phpinfo` |
| `expose_php`        | 隐藏 PHP 版本信息                  | `Off`                                     |
| `display_errors`    | 关闭错误显示                       | `Off`                                     |
| `log_errors`        | 开启错误日志                       | `On`                                      |
| `error_log`         | 错误日志路径                       | `/var/log/php_error.log`                  |
| `register_globals`  | 关闭全局变量注册（PHP 5.3 已废弃） | `Off`                                     |
| `magic_quotes_gpc`  | SQL注入防护（PHP 5.4 已废弃）      | `On`                                      |

### 2.3 控制 PHP 访问目录

```properties
# Linux：冒号分隔
open_basedir = "/var/www/html:/tmp"

# Windows：分号分隔
open_basedir = "C:/www;C:/tmp"
```

### 2.4 禁用危险函数

```properties
# 禁用命令执行函数
disable_functions = system,passthru,exec,shell_exec,popen,pcntl_exec,proc_open,proc_close,dl

# 额外禁用文件操作函数
disable_functions = chdir,chroot,dir,getcwd,opendir,readdir,scandir,unlink,delete,copy,mkdir,rmdir,rename,file,file_get_contents,fputs,fwrite,chgrp,chmod,chown

# 禁用信息泄露
disable_functions = phpinfo
```

### 2.5 隐藏版本信息

```properties
expose_php = Off
```

### 2.6 错误日志配置

```properties
display_errors = Off
log_errors = On
error_log = /usr/local/apache2/logs/php_error.log
```

------

## 三、Windows 安全加固

### 3.1 账户管理与认证授权

| 加固项               | 操作                                                         | 说明           |
| -------------------- | ------------------------------------------------------------ | -------------- |
| **禁用 Guest 账户**  | 计算机管理 → 本地用户和组 → Guest → 禁用                     | 防止未授权访问 |
| **删除无用账户**     | 禁用→观察→确认无影响后删除                                   | 减少攻击面     |
| **权限分离**         | 按业务创建不同用户组                                         | 最小权限原则   |
| **不显示最后用户名** | secpol.msc → 本地策略 → 安全选项 → 交互式登录：不显示最后的用户名 → 启用 | 防止信息泄露   |

### 3.2 密码策略

**路径：** secpol.msc → 账户策略 → 密码策略

| 策略                   | 推荐值                                    |
| ---------------------- | ----------------------------------------- |
| 密码必须符合复杂性要求 | **启用**（大写+小写+数字+特殊字符 ≥ 2种） |
| 密码长度最小值         | **≥ 8 字符**                              |
| 密码最长使用期限       | **≤ 90 天**                               |

### 3.3 账户锁定策略

**路径：** secpol.msc → 账户策略 → 账户锁定策略

| 策略         | 推荐值                      |
| ------------ | --------------------------- |
| 账户锁定阈值 | **≤ 10 次**（连续失败锁定） |

### 3.4 用户权限指派

**路径：** secpol.msc → 本地策略 → 用户权限分配

| 策略               | 推荐值               |
| ------------------ | -------------------- |
| 从远端系统强制关机 | 仅 Administrators 组 |
| 关闭系统           | 仅 Administrators 组 |
| 取得文件所有权     | 仅 Administrators 组 |
| 允许本地登录       | 指定授权用户         |
| 从网络访问此计算机 | 指定授权用户         |

### 3.5 日志配置

**路径：** secpol.msc → 本地策略 → 审核策略

| 审核项       | 推荐配置           |
| ------------ | ------------------ |
| 审核登录事件 | 成功+失败          |
| 审核账户管理 | 成功+失败          |
| 审核进程追踪 | 仅失败（谨慎开启） |

**日志大小：** eventvwr.msc → Windows 日志

| 日志类型 | 推荐大小 |
| -------- | -------- |
| 应用日志 | ≥ 8192KB |
| 系统日志 | ≥ 8192KB |
| 安全日志 | ≥ 8192KB |

### 3.6 IP 协议安全（SYN 攻击防护）

**路径：** 注册表 `HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\`

| 注册表项                | 推荐值 | 说明                   |
| ----------------------- | ------ | ---------------------- |
| `SynAttackProtect`      | 2      | 启用 SYN 攻击保护      |
| `TcpMaxHalfOpen`        | 500    | SYN_RCVD 状态连接阈值  |
| `TcpMaxHalfOpenRetried` | 400    | 重传 SYN_RCVD 连接阈值 |

### 3.7 文件共享安全

| 加固项       | 操作                                                         |
| ------------ | ------------------------------------------------------------ |
| 关闭默认共享 | 计算机管理 → 共享文件夹 → 停止 C$、IPC$ 两个共享 |
| 共享权限限制 | 不设置 Everyone 权限，仅授权用户                             |

### 3.8 安全选项

**路径：** secpol.msc → 本地策略 → 安全选项

| 策略                                     | 推荐值      |
| ---------------------------------------- | ----------- |
| 关机：允许系统在未登录前关机             | **禁用**    |
| Microsoft 网络服务器：暂停会话前空闲时间 | **15 分钟** |

### 3.9 其他配置

| 加固项     | 操作                                          |
| ---------- | --------------------------------------------- |
| 防病毒软件 | 安装企业级防病毒，开启病毒库更新              |
| 屏幕保护   | 设置等待 5 分钟，恢复时需要密码               |
| 补丁管理   | 安装最新 Hotfix，先兼容性测试，**勿自动安装** |
| 防火墙     | 启用防火墙（firewall.cpl）                    |

------

## 四、Linux 安全加固

### 4.1 账号和口令

#### 删除/锁定无用账号

```bash
# 删除账号
userdel <用户名>

# 锁定账号
passwd -l <用户名>

# 解锁账号
passwd -u <用户名>
```

#### 检查空口令和 root 权限账号

```bash
# 查看空口令账号
awk -F: '($2 == "")' /etc/shadow

# 查看 UID=0 的账号（应只有 root）
awk -F: '($3 == 0)' /etc/passwd

# 为空口令账号设置密码
passwd <用户名>
```

#### 密码策略（/etc/login.defs）

```bash
PASS_MAX_DAYS   90    # 密码最长使用天数
PASS_MIN_DAYS   0     # 密码最短使用天数
PASS_WARN_AGE   7     # 密码到期前提醒天数
```

#### 使用 chage 修改用户密码策略

```bash
chage -m 0 -M 30 -E 2000-01-01 -W 7 <用户名>
```

#### 账户锁定策略（PAM）

```bash
# /etc/pam.d/common-auth 添加
auth required pam_tally.so onerr=fail deny=3 unlock_time=300
```

#### 限制 su 用户

```bash
# /etc/pam.d/su 添加
auth required pam_wheel.so group=test   # 仅 test 组可 su
```

#### 禁止 root 直接 SSH 登录

```bash
# /etc/ssh/sshd_config
PermitRootLogin no

# 重启 SSH 服务
service sshd restart
```

### 4.2 服务安全

```bash
# 查看所有服务
sudo systemctl list-units --type=service

# 停止服务
sudo systemctl stop <服务名>

# 禁用服务（禁止自启动）
sudo systemctl disable <服务名>
```

#### SSH 服务加固

```bash
# /etc/ssh/sshd_config
PermitRootLogin no          # 禁止 root 直接登录
Protocol 2                   # 使用 SSHv2
```

### 4.3 文件系统

#### 设置 umask

```bash
# /etc/profile 添加
umask 026
# 即新文件：属主 rwx，同组 r，其他无
# 666-026=640

# 立即生效
source /etc/profile
```

#### 设置登录超时

```bash
# /etc/profile 设置
TMOUT=180    # 3 分钟超时
```

### 4.4 日志配置

```bash
# /etc/rsyslog.d/50-default.conf
*.info;mail.none;authpriv.none;cron.none /var/log/messages

# 重启 rsyslog
sudo systemctl restart rsyslog
```

#### 记录所有用户操作日志

```bash
# /etc/profile 添加
USER=`whoami`
USER_IP=`who -u am i 2>/dev/null | awk '{print $NF}' | sed -e 's/[()]//g'`
if [ "$USER_IP" = "" ]; then
  USER_IP=`hostname`
fi
if [ ! -d /var/log/history ]; then
  mkdir /var/log/history
  chmod 777 /var/log/history
fi
if [ ! -d /var/log/history/${LOGNAME} ]; then
  mkdir /var/log/history/${LOGNAME}
  chmod 300 /var/log/history/${LOGNAME}
fi
export HISTSIZE=4096
DT=`date +"%Y%m%d_%H:%M:%S"`
export HISTFILE="/var/log/history/${LOGNAME}/${USER}@${USER_IP}_$DT"
chmod 600 /var/log/history/${LOGNAME}/* 2>/dev/null
```

------

## 五、Apache 安全加固

### 5.1 低权限账号运行

```bash
# 创建 Apache 用户
groupadd apache
useradd apache -g apache

# httpd.conf 配置
User www-data
Group www-data
```

### 5.2 授权设置

```bash
# 配置文件权限
chmod 600 /etc/httpd/conf/httpd.conf

# 日志文件权限
chmod 644 /var/log/httpd/*.log
```

### 5.3 日志设置

```plain
# 错误日志
LogLevel notice
ErrorLog logs/error_log

# 访问日志格式
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Accept}i\" \"%{Referer}i\" \"%{User-Agent}i\"" combined
CustomLog logs/access.log combined
```

### 5.4 禁止访问外部文件和目录列出

```plain
# 禁止访问 Web 目录之外的文件
<Directory />
    Order Deny,Allow
    Deny from all
</Directory>
# 禁止目录列出（删除 Indexes）
Options FollowSymLinks
```

### 5.5 隐藏版本信息

```plain
ServerSignature Off
ServerTokens Prod
```

### 5.6 关闭 TRACE

```plain
TraceEnable off
```

------

## 六、Nginx 安全加固

### 6.1 日志配置

```nginx
http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
}

server {
    access_log logs/host.access.log main;
}
```

### 6.2 禁止目录浏览和限制执行权限

```nginx
# 禁止目录浏览
autoindex off;

# 限制目录执行权限
location ~ /(attachments|upload)/.*\.(php|php5)?$ {
    deny all;
}
```

### 6.3 隐藏版本信息

```nginx
server_tokens off;
```

### 6.4 限制 HTTP 请求方法和 IP 访问

```nginx
# 限制请求方法
if ($request_method !~ ^(GET|HEAD|POST)$) {
    return 403;
}

# 限制 IP 访问
location / {
    allow 192.168.1.0/24;
    deny all;
}
```

### 6.5 Nginx 降权

```nginx
user www-data;
# 或
user www www;
```

------

## 七、Tomcat 安全加固

| 加固项           | 操作                                             |
| ---------------- | ------------------------------------------------ |
| **管理后台防护** | 删除或重命名 `/webapps/manager`、`/host-manager` |
| **强口令**       | `conf/tomcat-users.xml` 配置复杂密码             |
| **修改默认端口** | `conf/server.xml` 修改 8080                      |
| **访问日志**     | 取消 `AccessLogValve` 注释                       |
| **禁止目录列出** | `conf/web.xml` 设置 `listings=false`             |
| **删除示例文件** | 删除 `webapps/docs`、`examples`                  |

------

## 八、MySQL 安全加固

| 加固项           | 操作                                               |
| ---------------- | -------------------------------------------------- |
| **低权限运行**   | 创建 `myUser`，以普通用户运行 MySQL                |
| **禁止共享账号** | 每个应用使用独立数据库账号                         |
| **禁用无关账号** | `DROP USER test;`                                  |
| **强口令策略**   | 长度 ≥ 8，含大小写+数字+特殊字符（≥2种），90天更换 |
| **最小权限授权** | `GRANT` 仅授予必要权限，`REVOKE` 回收多余权限      |
| **启用日志审计** | `my.cnf` 配置 `log-error`、`log-bin` 等            |
| **禁止远程访问** | 绑定 `127.0.0.1` 或白名单 IP                       |
| **连接数限制**   | `max_connections = 1000`                           |
| **安装最新版本** | 持续更新补丁                                       |

## 📌 快速参考卡片

### Windows 命令

```plain
regedit              # 注册表
gpedit.msc           # 组策略编辑器
secpol.msc           # 本地安全策略
eventvwr.msc         # 事件查看器
control              # 控制面板
services.msc         # 服务管理
firewall.cpl         # 防火墙
```

### Linux 命令

```bash
find /etc -name php.ini           # 找 PHP 配置
sudo nginx -t                     # 测试 Nginx 配置
systemctl restart php7.4-fpm      # 重启 PHP-FPM
```

### 加固优先级

```plain
1. 账号/口令管理 → 2. 日志审计 → 3. 权限控制 → 4. 隐藏版本信息 → 5. 关闭危险功能
```
