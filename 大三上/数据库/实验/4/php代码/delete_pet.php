<?php
// delete_pet.php  删除宠物处理
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo '方法不允许';
    exit;
}

include 'conn.php'; // mysqli 连接

$pet_id = isset($_POST['pet_id']) ? intval($_POST['pet_id']) : 0;
if ($pet_id <= 0) {
    echo '无效的 pet_id';
    exit;
}

// 检查是否存在
if ($stmt = $conn->prepare('SELECT pet_id FROM pet31 WHERE pet_id = ? LIMIT 1')) {
    $stmt->bind_param('i', $pet_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        echo '未找到要删除的宠物';
        $stmt->close();
        exit;
    }
    $stmt->close();
} else {
    echo '查询失败: (' . $conn->errno . ') ' . $conn->error;
    exit;
}

// 尝试删除
if ($stmt = $conn->prepare('DELETE FROM pet31 WHERE pet_id = ?')) {
    $stmt->bind_param('i', $pet_id);
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            $stmt->close();
            header('Location: admin.php');
            exit;
        } else {
            echo '未删除任何记录';
            $stmt->close();
            exit;
        }
    } else {
        // 可能是外键约束导致无法删除
        echo '删除失败: (' . $stmt->errno . ') ' . $stmt->error . '. 如果存在关联记录（例如申请记录），请先删除或处理关联。';
        $stmt->close();
        exit;
    }
} else {
    echo '删除语句准备失败: (' . $conn->errno . ') ' . $conn->error;
    exit;
}
?>