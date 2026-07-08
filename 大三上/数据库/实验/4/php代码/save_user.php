<?php
// save_user.php 保存用户注册信息

// 确保以 UTF-8 编码输出，避免中文乱码
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // 仅允许 POST 提交
    http_response_code(405);
    echo '方法不允许';
    exit;
}

include 'conn.php'; // 使用已更新的 mysqli 连接，$conn 可用

// 获取并清理输入
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

// 简单验证
if ($username === '' || $phone === '' || $email === '' || $password === '') {
    echo '请填写所有必填字段';
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo '无效的邮箱地址';
    exit;
}

// 验证手机号（示例：11位数字）
if (!preg_match('/^[0-9]{11}$/', $phone)) {
    echo '请输入有效的 11 位手机号';
    exit;
}

if (strlen($password) < 6) {
    echo '密码长度至少 6 位';
    exit;
}

// 表名和列均基于 crebas.sql 中的定义：表 user31，列 user_email, user_phone, user_name, user_password
// 检查邮箱或手机号是否已存在
$checkSql = "SELECT user_id FROM user31 WHERE user_email = ? OR user_phone = ? LIMIT 1";
if ($stmt = $conn->prepare($checkSql)) {
    $stmt->bind_param('ss', $email, $phone);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo '该邮箱或手机号已被注册';
        $stmt->close();
        exit;
    }
    $stmt->close();
} else {
    // 输出具体错误以便调试
    echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
    exit;
}

// 密码哈希
$hashed = password_hash($password, PASSWORD_DEFAULT);

// 检查 user_id 是否为 AUTO_INCREMENT
$ai = false;
if ($res = $conn->query("SHOW COLUMNS FROM user31 LIKE 'user_id'")) {
    if ($col = $res->fetch_assoc()) {
        if (isset($col['Extra']) && stripos($col['Extra'], 'auto_increment') !== false) {
            $ai = true;
        }
    }
    $res->free();
}

if ($ai) {
    // user_id 为自增，直接插入不指定 user_id
    $insertSql = "INSERT INTO user31 (user_name, user_phone, user_email, user_password) VALUES (?, ?, ?, ?)";
    if ($stmt = $conn->prepare($insertSql)) {
        $stmt->bind_param('ssss', $username, $phone, $email, $hashed);
        if ($stmt->execute()) {
            $stmt->close();
            header('Location: login.php');
            exit;
        } else {
            echo '注册失败，请稍后重试';
            $stmt->close();
            exit;
        }
    } else {
        echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
        exit;
    }
} else {
    // user_id 不是自增，计算下一个 id 并显式插入
    $nextId = 1;
    if ($res = $conn->query('SELECT COALESCE(MAX(user_id),0)+1 AS nextid FROM user31')) {
        $row = $res->fetch_assoc();
        $nextId = isset($row['nextid']) ? (int)$row['nextid'] : 1;
        $res->free();
    }

    $insertSql = "INSERT INTO user31 (user_id, user_name, user_phone, user_email, user_password) VALUES (?, ?, ?, ?, ?)";
    if ($stmt = $conn->prepare($insertSql)) {
        $stmt->bind_param('issss', $nextId, $username, $phone, $email, $hashed);
        if ($stmt->execute()) {
            $stmt->close();
            header('Location: login.php');
            exit;
        } else {
            echo '注册失败，请稍后重试';
            $stmt->close();
            exit;
        }
    } else {
        echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
        exit;
    }
}
?>