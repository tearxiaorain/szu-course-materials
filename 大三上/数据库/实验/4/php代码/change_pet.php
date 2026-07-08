<?php
// change_pet.php  修改宠物信息处理
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo '方法不允许';
    exit;
}

include 'conn.php'; // mysqli 连接

// 获取并清理输入
$pet_id = isset($_POST['pet_id']) ? intval($_POST['pet_id']) : 0;
$pet_name = isset($_POST['pet_name']) ? trim($_POST['pet_name']) : '';
$class_id = isset($_POST['class_id']) && $_POST['class_id'] !== '' ? intval($_POST['class_id']) : null;
$breed_id = isset($_POST['breed_id']) && $_POST['breed_id'] !== '' ? intval($_POST['breed_id']) : null;
$pet_sex = isset($_POST['pet_sex']) && $_POST['pet_sex'] !== '' ? intval($_POST['pet_sex']) : null;
$pet_birth = isset($_POST['pet_birth']) && $_POST['pet_birth'] !== '' ? $_POST['pet_birth'] : null;
$pet_age = isset($_POST['pet_age']) && $_POST['pet_age'] !== '' ? intval($_POST['pet_age']) : null;
$pet_color = isset($_POST['pet_color']) ? trim($_POST['pet_color']) : null;
$pet_personality = isset($_POST['pet_personality']) ? trim($_POST['pet_personality']) : null;

// 验证
if ($pet_id <= 0) { echo '无效的 pet_id'; exit; }
if ($pet_name === '') { echo '请填写宠物名称'; exit; }
if ($pet_birth !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $pet_birth)) { echo '生日格式应为 YYYY-MM-DD'; exit; }

// 验证 class_id/breed_id 是否存在
if ($class_id !== null) {
    if ($stmt = $conn->prepare('SELECT class_id FROM class31 WHERE class_id = ? LIMIT 1')) {
        $stmt->bind_param('i', $class_id);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows === 0) { echo '所选种类不存在'; $stmt->close(); exit; }
        $stmt->close();
    }
}
if ($breed_id !== null) {
    if ($stmt = $conn->prepare('SELECT breed_id FROM breed31 WHERE breed_id = ? LIMIT 1')) {
        $stmt->bind_param('i', $breed_id);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows === 0) { echo '所选品种不存在'; $stmt->close(); exit; }
        $stmt->close();
    }
}

// 执行更新
$sql = "UPDATE pet31 SET breed_id = ?, class_id = ?, pet_name = ?, pet_birth = ?, pet_age = ?, pet_sex = ?, pet_breed_id = ?, pet_class_id = ?, pet_color = ?, pet_personality = ? WHERE pet_id = ?";
if ($stmt = $conn->prepare($sql)) {
    // 绑定参数，保持与列类型一致（i=int, s=string），允许 null
    $b_breed = $breed_id;
    $b_class = $class_id;
    $b_name = $pet_name;
    $b_birth = $pet_birth;
    $b_age = $pet_age;
    $b_sex = $pet_sex;
    $b_pet_breed = $breed_id;
    $b_pet_class = $class_id;
    $b_color = $pet_color;
    $b_personality = $pet_personality;

    $stmt->bind_param('iissiiiissi', $b_breed, $b_class, $b_name, $b_birth, $b_age, $b_sex, $b_pet_breed, $b_pet_class, $b_color, $b_personality, $pet_id);
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
    echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
    exit;
}
?>