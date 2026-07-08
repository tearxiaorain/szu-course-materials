# SQLab使用手册
## 首页

登录SQLab平台后，您将被无缝引导至直观的主页界面。在此，一系列精心编撰的产品文档触手可及，助您迅速掌握SQLab的使用精髓。主页还配备了智能搜索功能，让您能够通过关键词迅速定位到社区内的SQL学习精华笔记，高效汲取知识。此外，直接链接至崖山智能问答系统的入口，为您的崖山数据库产品疑问提供即时解答，确保学习之旅畅通无阻，专业成长快人一步。

   ![home-page](https://sqlab.yashandb.com/static/docs/images/home-page.png)

## 崖山实验室

SQLab会为每一个登录的用户分配一个后台数据库。您可以在工作台中通过执行SQL在数据库中创建表对象，插入数据等，也可在我的对象界面查看数据库中已有的表，约束，索引等对象。

### 我的工作台
在工作台中，可以执行SQL语句，在后台数据库中进行增删改查。

1. 在SQL编辑框中输入要执行的SQL语句，多条SQL语句之间用分号分隔

2. 点击运行，即可在后台数据库中执行输入的SQL语句，在下方Console可以看到语句的执行结果

3. 点击清除，可以清除SQL编辑框中的SQL语句

4. 点击清空结果，可以清除Console中的SQL执行结果

5. 点击重置环境，会将后台数据库恢复到初始状态，同时清除编辑框中的SQL语句。

   ![execute-sql](https://sqlab.yashandb.com/static/docs/images/execute-sql.png)

> 两次重置环境的时间间隔至少是1分钟。
>
> 重置环境后首次执行SQL可能会响应较慢，这是因为后台在执行数据库初始化动作，请稍等片刻再执行。

### 我的对象

1. 在我的对象界面可以查看SQLAB和EXAMPLE两个schema下的所有对象。EXAMPLE下的对象是只读的，在工作台中执行SQL创建的对象会出现在SQLAB这个schema下

   ![my-objects](https://sqlab.yashandb.com/static/docs/images/my-objects.png)

2. 点击每个对象，可以查看该对象的详细信息。如表对象可以查看表名，状态，列信息，表上的索引，触发器，约束等。

   ![object-detail](https://sqlab.yashandb.com/static/docs/images/object-detail.png)



## 历史SQL

历史SQL中可以查看当前环境中已经执行的SQL语句及其执行结果，也可以查看已归档的历史环境，还可以根据历史环境快速恢复数据库。

### 当前环境

1. 在当前环境页面可以看到在当前数据库中已经执行过的SQL语句及其结果

   ![current-env](https://sqlab.yashandb.com/static/docs/images/current-env.png)

2. 可以选择将已经执行过的SQL导出为SQL脚本保存到本地

   ![save-as-script](https://sqlab.yashandb.com/static/docs/images/save-as-script.png)

3. 也可以将SQL记录和执行结果保存为我的笔记

   ![save-as-note](https://sqlab.yashandb.com/static/docs/images/save-as-note.png)

### 历史环境

1. 在历史环境界面可以查看并管理已经归档的会话

   ![history-env](https://sqlab.yashandb.com/static/docs/images/history-env.png)

2. 点击查看，可以查看某一会话中执行过的SQL及结果

   ![history-sql-list](https://sqlab.yashandb.com/static/docs/images/history-sql-list.png)

3. 点击重新运行，将在指定环境中重新执行所有SQL

   ![rerun](https://sqlab.yashandb.com/static/docs/images/rerun.png)

> 如果SQLab的用户登录后长时间未活跃，系统将回收分配给该用户的数据库环境，同时将环境信息归档。
>
> 用户重新登陆后，可以在历史环境中使用重新运行的功能，快速恢复已归档的数据库环境。



## SQL笔记

在SQL笔记页面，您可以创建并分享自己的笔记，也可以查看喜欢的笔记。

### 我的笔记

1. 在我的笔记页面，可以管理笔记

   ![my-note](https://sqlab.yashandb.com/static/docs/images/my-note.png)

2. 点击笔记名称，可以查看或修改笔记。

   ![note-detail](https://sqlab.yashandb.com/static/docs/images/note-detail.png)

3. 点击顺序执行SQL，可以将笔记中的所有SQL语句在当前环境中顺序执行一次

   ![orderly-execute](https://sqlab.yashandb.com/static/docs/images/orderly-execute.png)

4. 点击导出，可以将笔记导出为MD文件或者SQL脚本保存在本地

   ![export-note](https://sqlab.yashandb.com/static/docs/images/export-note.png)

5. 点击新建笔记，输入笔记名称等信息后，可以创建一个新的笔记。新建的笔记可以选择公开(发布到笔记广场)，也可以设置为私密(仅自己可见)

   ![save-note](https://sqlab.yashandb.com/static/docs/images/save-note.png)

6. 点击确认后进入笔记编辑页面，输入笔记内容并保存，即可新建一个笔记

   ![update-note](https://sqlab.yashandb.com/static/docs/images/update-note.png)

### 我的喜欢

在我的喜欢界面，您可快速找到您收藏的笔记。

![favorite-note](https://sqlab.yashandb.com/static/docs/images/favorite-note.png)



## 笔记广场

在笔记广场，您可以查看其他用户公开的笔记，也可以只查看YashanDB官方推荐的教程。您的公开笔记也将展现在这里。

![public-note](https://sqlab.yashandb.com/static/docs/images/public-note.png)

点击笔记名称，您可以查看其他人公开的笔记内容，对于喜欢的笔记，您可以添加到我的喜欢，方便快速查阅。

![add-favorite](https://sqlab.yashandb.com/static/docs/images/add-favorite.png)

如果您发现某些笔记的内容违反社区规范，可以举报该笔记，官方管理员核实后将对笔记予以下架。
![report-note](https://sqlab.yashandb.com/static/docs/images/report-note.png)

> 只有设置为公开且通过审核的笔记才会被公开在笔记广场中
> 优秀的笔记经官方审核后将会被置为官方推荐


## 用户管理

SQLab提供了一套完整的用户体系，可以帮助您管理您的账号。

### 用户注册

1. 访问SQLab地址
2. 点击注册按钮，跳转到用户注册页面
3. 填写用户信息，点击发送验证码，然后查看邮箱中的验证码并填写
4. 点击注册按钮，完成注册，并成功登陆SQLab
   ![register](https://sqlab.yashandb.com/static/docs/images/register.png)

### 用户登录

1. 访问SQLab地址
2. 填写已注册的邮箱和密码
3. 点击登录按钮，成功登陆SQLab
   ![login](https://sqlab.yashandb.com/static/docs/images/login.png)

### 用户登出

1. 点击右上角用户名，点击退出，即可退出登录状态

   ![logout](https://sqlab.yashandb.com/static/docs/images/logout.png)

2. 退出登录后，系统将会自动归档当前数据库环境并销毁数据库资源

> 超过一段时间未活跃的用户，将会自动登出并销毁对应的数据库资源

### 修改密码

1. 登录后点击右上角用户名，点击修改密码，弹出密码修改框

   ![update-password](https://sqlab.yashandb.com/static/docs/images/update-password.png)

2. 输入旧密码和新密码后点击确认即可修改密码

### 重置密码

1. 访问SQLab地址

2. 点击忘记密码后进入重置密码界面

   ![reset-password](https://sqlab.yashandb.com/static/docs/images/reset-password.png)

3. 输入邮箱后发送验证码

4. 输入验证码及新的密码点击确认即可重置密码

### 修改用户名

1. 登录后点击右上角用户名，点击修改用户名

   ![update-name](https://sqlab.yashandb.com/static/docs/images/update-name.png)

2. 填写新的用户名后点击确认即可修改用户名

> 每个SQLab用户的用户名唯一


## 相关资料

### YashanDB产品文档

SQLab为您分配的数据库为：YashanDB 23.2 个人版，更多数据库信息请移步：[产品文档](https://doc.yashandb.com/yashandb/23.2/zh/%E4%BA%A7%E5%93%81%E6%8F%8F%E8%BF%B0/%E4%BA%A7%E5%93%81%E7%AE%80%E4%BB%8B.html)。
