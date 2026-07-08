<?php
// login.php  登录页面显示
// ...existing code...
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>登录</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; background:#f6f8fa; }
        .container { max-width:420px; margin:60px auto; background:#fff; padding:24px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.08); }
        h2 { margin-top:0; }
        label { display:block; margin-top:12px; font-size:14px; }
        input { width:100%; padding:10px; margin-top:6px; box-sizing:border-box; border:1px solid #dcdfe6; border-radius:4px; }
        button { margin-top:18px; width:100%; padding:10px; background:#28a745; color:#fff; border:0; border-radius:4px; cursor:pointer; }
        button:hover { background:#218838; }
        .hint { margin-top:12px; font-size:13px; color:#666; }
        a { color:#007bff; text-decoration:none; }
    </style>
</head>
<body>
<div class="container">
    <h2>用户登录</h2>

    <!-- 表单通过 POST 提交到 check_user.php -->
    <form method="post" action="check_user.php">
        <label for="username">用户名</label>
        <input type="text" id="username" name="username" required maxlength="100" placeholder="请输入用户名或邮箱">

        <label for="password">密码</label>
        <input type="password" id="password" name="password" required minlength="6" placeholder="请输入密码">

        <button type="submit">登录</button>
    </form>

    <p class="hint">还没有账号？ <a href="register.php">去注册</a></p>
</div>
</body>
</html>