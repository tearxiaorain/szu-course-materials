<?php
// check_user.php  验证登录处理

header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo '方法不允许';
    exit;
}

include 'conn.php'; // $conn 为 mysqli

$input = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if ($input === '' || $password === '') {
    echo '请填写用户名和密码';
    exit;
}

// 在 user31 表中查找匹配的用户名、邮箱或手机号，并获取状态
$sql = "SELECT user_id, user_name, user_email, user_phone, user_password, user_state_id FROM user31 WHERE user_name = ? OR user_email = ? OR user_phone = ? LIMIT 1";
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param('sss', $input, $input, $input);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        echo '用户名或密码不正确';
        $stmt->close();
        exit;
    }

    $stmt->bind_result($user_id, $user_name, $user_email, $user_phone, $user_password_hash, $user_state_id);
    $stmt->fetch();
    $stmt->close();

    // 验证密码
    if (password_verify($password, $user_password_hash)) {
        // 检查账号状态：0=正常，1=封禁，3=管理员
        if ((int)$user_state_id === 1) {
            echo '账号已被封禁，无法登录';
            exit;
        }

        // 登录成功，写入会话并重定向
        $_SESSION['user_id'] = $user_id;
        $_SESSION['user_name'] = $user_name;
        $_SESSION['user_phone'] = $user_phone;
        $_SESSION['user_email'] = $user_email;
        $_SESSION['user_state_id'] = $user_state_id;

        if ((int)$user_state_id === 3) {
            // 管理员
            header('Location: admin.php');
            exit;
        } else {
            // 普通用户
            header('Location: index.php');
            exit;
        }
    } else {
        echo '用户名或密码不正确';
        exit;
    }
} else {
    echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
    exit;
}
?>