<?php
// save_apply.php  保存申请信息
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo '方法不允许';
    exit;
}

include 'conn.php'; // mysqli 连接

// 从 POST 获取并清理数据
$pet_id = isset($_POST['pet_id']) ? intval($_POST['pet_id']) : 0;
$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : (isset($_POST['user_id']) ? intval($_POST['user_id']) : 0);
$apply_user_name = isset($_POST['apply_user_name']) ? trim($_POST['apply_user_name']) : '';
$apply_user_sex = isset($_POST['apply_user_sex']) && $_POST['apply_user_sex'] !== '' ? intval($_POST['apply_user_sex']) : null;
$apply_user_age = isset($_POST['apply_user_age']) && $_POST['apply_user_age'] !== '' ? intval($_POST['apply_user_age']) : null;
$apply_user_phone = isset($_POST['apply_user_phone']) ? trim($_POST['apply_user_phone']) : '';
$apply_user_email = isset($_POST['apply_user_email']) ? trim($_POST['apply_user_email']) : '';
$apply_user_area_id = isset($_POST['apply_user_area_id']) && $_POST['apply_user_area_id'] !== '' ? intval($_POST['apply_user_area_id']) : null;

// 简单验证
if ($pet_id <= 0) { echo '无效的 pet_id'; exit; }
if ($user_id <= 0) { echo '请先登录'; exit; }
if ($apply_user_name === '') { echo '请填写姓名'; exit; }
if ($apply_user_phone === '' || !preg_match('/^[0-9]{11}$/', $apply_user_phone)) { echo '请输入有效的 11 位手机号'; exit; }
if ($apply_user_email === '' || !filter_var($apply_user_email, FILTER_VALIDATE_EMAIL)) { echo '请输入有效的邮箱'; exit; }

// 准备插入数据的其他字段
$apply_time = date('Y-m-d');
$apply_state_id = 0; // 默认状态，可根据需要调整

// 检查 apply_id 是否为 AUTO_INCREMENT
$ai = false;
if ($res = $conn->query("SHOW COLUMNS FROM apply31 LIKE 'apply_id'")) {
    if ($col = $res->fetch_assoc()) {
        if (isset($col['Extra']) && stripos($col['Extra'], 'auto_increment') !== false) {
            $ai = true;
        }
    }
    $res->free();
}

if ($ai) {
    $sql = "INSERT INTO apply31 (user_id, pet_id, apply_user_id, apply_pet_id, apply_time, apply_state_id, apply_user_name, apply_user_sex, apply_user_age, apply_user_phone, apply_user_email, apply_user_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    if ($stmt = $conn->prepare($sql)) {
        // 将 apply_user_id 和 apply_pet_id 同样设置为当前 user/pet
        $apply_user_id = $user_id;
        $apply_pet_id = $pet_id;
        // 类型顺序： user_id(i), pet_id(i), apply_user_id(i), apply_pet_id(i), apply_time(s), apply_state_id(i), apply_user_name(s), apply_user_sex(i), apply_user_age(i), apply_user_phone(s), apply_user_email(s), apply_user_area_id(i)
        $stmt->bind_param('iiiisisiissi', $user_id, $pet_id, $apply_user_id, $apply_pet_id, $apply_time, $apply_state_id, $apply_user_name, $apply_user_sex, $apply_user_age, $apply_user_phone, $apply_user_email, $apply_user_area_id);
        if ($stmt->execute()) {
            $stmt->close();
            header('Location: index.php');
            exit;
        } else {
            echo '插入失败';
            $stmt->close();
            exit;
        }
    } else {
        echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
        exit;
    }
} else {
    // 计算下一个 apply_id（当表不是自增时）
    $nextId = 1;
    if ($res = $conn->query('SELECT COALESCE(MAX(apply_id),0)+1 AS nextid FROM apply31')) {
        $row = $res->fetch_assoc();
        $nextId = isset($row['nextid']) ? (int)$row['nextid'] : 1;
        $res->free();
    }

    $sql = "INSERT INTO apply31 (apply_id, user_id, pet_id, apply_user_id, apply_pet_id, apply_time, apply_state_id, apply_user_name, apply_user_sex, apply_user_age, apply_user_phone, apply_user_email, apply_user_area_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    if ($stmt = $conn->prepare($sql)) {
        $apply_user_id = $user_id;
        $apply_pet_id = $pet_id;
        // 类型顺序： apply_id(i), user_id(i), pet_id(i), apply_user_id(i), apply_pet_id(i), apply_time(s), apply_state_id(i), apply_user_name(s), apply_user_sex(i), apply_user_age(i), apply_user_phone(s), apply_user_email(s), apply_user_area_id(i)
        $stmt->bind_param('iiiiisisiissi', $nextId, $user_id, $pet_id, $apply_user_id, $apply_pet_id, $apply_time, $apply_state_id, $apply_user_name, $apply_user_sex, $apply_user_age, $apply_user_phone, $apply_user_email, $apply_user_area_id);
        if ($stmt->execute()) {
            $stmt->close();
            header('Location: index.php');
            exit;
        } else {
            echo '插入失败';
            $stmt->close();
            exit;
        }
    } else {
        echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
        exit;
    }
}
?>