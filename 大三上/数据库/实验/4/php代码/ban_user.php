<?php
// ban_user.php  封禁用户处理
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo '方法不允许';
    exit;
}

include 'conn.php';

$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
if ($user_id <= 0) {
    echo '无效的 user_id';
    exit;
}

// 读取当前状态
if ($stmt = $conn->prepare('SELECT user_state_id FROM user31 WHERE user_id = ? LIMIT 1')) {
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        echo '未找到该用户';
        $stmt->close();
        exit;
    }
    $stmt->bind_result($curState);
    $stmt->fetch();
    $stmt->close();
} else {
    echo '查询失败: (' . $conn->errno . ') ' . $conn->error;
    exit;
}

// 切换状态：如果当前为1则设为0，否则设为1
$newState = ($curState == 1) ? 0 : 1;

if ($stmt = $conn->prepare('UPDATE user31 SET user_state_id = ? WHERE user_id = ?')) {
    $stmt->bind_param('ii', $newState, $user_id);
    if ($stmt->execute()) {
        $stmt->close();
        header('Location: admin.php');
        exit;
    } else {
        echo '更新失败: (' . $stmt->errno . ') ' . $stmt->error;
        $stmt->close();
        exit;
    }
} else {
    echo '更新语句准备失败: (' . $conn->errno . ') ' . $conn->error;
    exit;
}
?>