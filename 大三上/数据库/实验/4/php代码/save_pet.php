<?php
// save_pet.php  保存宠物信息
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo '方法不允许';
    exit;
}

include 'conn.php'; // mysqli 连接

// 获取并清理输入
$pet_name = isset($_POST['pet_name']) ? trim($_POST['pet_name']) : '';
$class_id = isset($_POST['class_id']) && $_POST['class_id'] !== '' ? intval($_POST['class_id']) : null;
$breed_id = isset($_POST['breed_id']) && $_POST['breed_id'] !== '' ? intval($_POST['breed_id']) : null;
$pet_sex = isset($_POST['pet_sex']) && $_POST['pet_sex'] !== '' ? intval($_POST['pet_sex']) : null;
$pet_birth = isset($_POST['pet_birth']) && $_POST['pet_birth'] !== '' ? $_POST['pet_birth'] : null; // expect YYYY-MM-DD
$pet_age = isset($_POST['pet_age']) && $_POST['pet_age'] !== '' ? intval($_POST['pet_age']) : null;
$pet_color = isset($_POST['pet_color']) ? trim($_POST['pet_color']) : null;
$pet_personality = isset($_POST['pet_personality']) ? trim($_POST['pet_personality']) : null;

// 简单验证
if ($pet_name === '') {
    echo '请填写宠物名称';
    exit;
}

// 可选：验证日期格式（YYYY-MM-DD）
if ($pet_birth !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $pet_birth)) {
    echo '生日格式应为 YYYY-MM-DD';
    exit;
}

// 检查 pet_id 是否为 AUTO_INCREMENT
$ai = false;
if ($res = $conn->query("SHOW COLUMNS FROM pet31 LIKE 'pet_id'")) {
    if ($col = $res->fetch_assoc()) {
        if (isset($col['Extra']) && stripos($col['Extra'], 'auto_increment') !== false) {
            $ai = true;
        }
    }
    $res->free();
}

// 列顺序参考 crebas.sql: pet_id, breed_id, class_id, pet_name, pet_birth, pet_age, pet_sex, pet_breed_id, pet_class_id, pet_color, pet_personality
if ($ai) {
    $sql = "INSERT INTO pet31 (breed_id, class_id, pet_name, pet_birth, pet_age, pet_sex, pet_breed_id, pet_class_id, pet_color, pet_personality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    if ($stmt = $conn->prepare($sql)) {
        // 将 NULL 转换为 nulls compatible with bind_param by using variables
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
        // bind types: i i s s i i i i s s -> but need correct ordering. Use 'iissiiiiss' mapping: breed_id(i), class_id(i), pet_name(s), pet_birth(s), pet_age(i), pet_sex(i), pet_breed_id(i), pet_class_id(i), pet_color(s), pet_personality(s)
        $stmt->bind_param('iissiiiiss', $b_breed, $b_class, $b_name, $b_birth, $b_age, $b_sex, $b_pet_breed, $b_pet_class, $b_color, $b_personality);
        if ($stmt->execute()) {
            $stmt->close();
            header('Location: admin.php');
            exit;
        } else {
            echo '插入失败: (' . $stmt->errno . ') ' . $stmt->error;
            $stmt->close();
            exit;
        }
    } else {
        echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
        exit;
    }
} else {
    // 非自增，计算下一个 pet_id
    $nextId = 1;
    if ($res = $conn->query('SELECT COALESCE(MAX(pet_id),0)+1 AS nextid FROM pet31')) {
        $row = $res->fetch_assoc();
        $nextId = isset($row['nextid']) ? (int)$row['nextid'] : 1;
        $res->free();
    }

    $sql = "INSERT INTO pet31 (pet_id, breed_id, class_id, pet_name, pet_birth, pet_age, pet_sex, pet_breed_id, pet_class_id, pet_color, pet_personality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    if ($stmt = $conn->prepare($sql)) {
        $pid = $nextId;
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
        $stmt->bind_param('iiissiiiiss', $pid, $b_breed, $b_class, $b_name, $b_birth, $b_age, $b_sex, $b_pet_breed, $b_pet_class, $b_color, $b_personality);
        if ($stmt->execute()) {
            $stmt->close();
            header('Location: admin.php');
            exit;
        } else {
            echo '插入失败: (' . $stmt->errno . ') ' . $stmt->error;
            $stmt->close();
            exit;
        }
    } else {
        echo 'Prepare failed: (' . $conn->errno . ') ' . $conn->error;
        exit;
    }
}
?>