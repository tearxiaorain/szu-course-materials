<?php
// logout.php - 退出登录处理
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');
session_start();

// 支持 POST 或 GET 触发退出
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    // 清空会话数组
    $_SESSION = array();

    // 如果使用了 session cookie，删除它
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']
        );
    }

    // 销毁会话
    session_destroy();

    // 重定向到登录页
    header('Location: login.php');
    exit;
}

// 若以其他方式访问，直接重定向回登录页
header('Location: login.php');
exit;
?>