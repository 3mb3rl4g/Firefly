---
title: 如何注册一个自己的域名
published: 2026-11-04
description: 从挑名字、选注册商到付款完成，把喜欢的域名一步步拿到手。
image: ""
tags:
  - 教程
  - 域名
category: 技术文章
draft: false
lang: zh-CN
pinned: false
comment: true
---

## 什么是域名

域名就是网站在互联网上的门牌号。让人记住 `emberlag.com`，总比记住一串 IP 地址容易得多；而且有了域名，以后换服务器、换托管平台都不用再改对外地址。

所以动手之前先把名字想清楚——域名买完再改，成本会比想象中高。

## 在哪里注册

域名只能通过 **注册商** 注册。常见的有 Cloudflare Registrar、Namecheap、Porkbun、Spaceship 等，各家的价格和续费策略差别不小。

这里以 [Spaceship](https://www.spaceship.com/zh/) 为例：它对国内用户比较友好，支持支付宝付款。

## 如何注册

1. 先在注册商那里注册一个账号（本文以 Spaceship 为例）。
2. 登录后在搜索框里输入想要的域名。注意要买的是**根域名**，也就是 `xxxx.com` 这种形式，**不要带 `www.`**——`www` 只是根域名下的一个子域名，不需要单独购买。

![image.png](https://img.emberlag.com/file/1793805644787_image.png)

3. 如果还没被人注册，直接加入购物车；如果已被占用，就换个后缀或换个拼写再试。

![image.png](https://img.emberlag.com/file/1793805673267_image.png)

4. 绑定支付方式。Spaceship 支持支付宝，选它最省事。

![image.png](https://img.emberlag.com/file/1793805709668_image.png)

5. 付款完成后，域名就属于你了。接下来去 DNS 里把解析指向你的服务器或托管平台即可。

> 顺手把「自动续费」打开，或者给自己设个到期提醒。域名过期后虽然还有赎回期，但赎回价格通常高得离谱。

## Tips

- **别只看首年价格，重点看续费价格。** 不少注册商首年白菜价、续费翻好几倍。
- 冷门后缀往往便宜很多，比如 `.xyz`、`.space`、`.cfd`；`.com` / `.cn` 更贵，但也更"正统"。
- 打算放在国内服务器上建站，域名一般还要**实名认证**和 **ICP 备案**；如果只是挂在 Cloudflare 这类境外平台上，通常不需要备案。
- 建议同时开启 **WHOIS 隐私保护**，免得手机号和邮箱被爬虫抓走。
