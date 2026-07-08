<?php
// apply.php  申请表单显示
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');
session_start();

include 'conn.php'; // mysqli 连接

// 获取 pet_id（支持 POST 或 GET）
$pet_id = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pet_id'])) {
    $pet_id = intval($_POST['pet_id']);
} elseif (isset($_GET['pet_id'])) {
    $pet_id = intval($_GET['pet_id']);
}

if (!$pet_id) {
    echo '未指定宠物 ID。';
    exit;
}

// 查询宠物信息（基于 pet31, breed31, class31）
$sql = "SELECT p.pet_id, p.pet_name, p.pet_sex, p.pet_color, DATE_FORMAT(p.pet_birth, '%Y-%m-%d') AS pet_birth, p.pet_age, p.pet_personality, b.breed_name, c.class_name
        FROM pet31 p
        LEFT JOIN breed31 b ON p.breed_id = b.breed_id
        LEFT JOIN class31 c ON p.class_id = c.class_id
        WHERE p.pet_id = ? LIMIT 1";

$pet = null;
if ($stmt = $conn->prepare($sql)) {
    $stmt->bind_param('i', $pet_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $pet = $res->fetch_assoc();
    $stmt->close();
} else {
    die('查询宠物信息失败: (' . $conn->errno . ') ' . $conn->error);
}

if (!$pet) {
    echo '未找到指定的宠物信息。';
    exit;
}

// 从会话获取当前用户信息以预填充电话/邮箱（如果登录时保存了）
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : '';
$prefill_phone = isset($_SESSION['user_phone']) ? $_SESSION['user_phone'] : '';
$prefill_email = isset($_SESSION['user_email']) ? $_SESSION['user_email'] : '';

// 读取所有区域数据，用于前端联动
$areas = [];
if ($res = $conn->query("SELECT area_id, area_name, area_superior_id, area_type FROM area31")) {
    while ($r = $res->fetch_assoc()) {
        $areas[] = $r;
    }
    $res->free();
}
$areas_json = json_encode($areas, JSON_UNESCAPED_UNICODE);
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>申请领养 - <?php echo htmlspecialchars($pet['pet_name'], ENT_QUOTES, 'UTF-8'); ?></title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; background:#f6f8fa; padding:20px; }
        .card { max-width:760px; margin:18px auto; background:#fff; padding:18px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        h2 { margin-top:0; }
        .pet-info { margin-bottom:18px; }
        .pet-info dl { display:grid; grid-template-columns:120px 1fr; row-gap:6px; }
        label { display:block; margin-top:8px; font-size:14px; }
        input, select, textarea { width:100%; padding:8px; margin-top:6px; box-sizing:border-box; border:1px solid #dcdfe6; border-radius:4px; }
        button { margin-top:12px; padding:10px 14px; background:#ff7f50; color:#fff; border:0; border-radius:4px; cursor:pointer; }
        .inline-selects { display:flex; gap:8px; }
        .inline-selects select { flex:1; }
    </style>
</head>
<body>
<div class="card">
    <h2>申请领养</h2>

    <div class="pet-info">
        <h3>宠物信息</h3>
        <dl>
            <dt>名字：</dt><dd><?php echo htmlspecialchars($pet['pet_name'], ENT_QUOTES, 'UTF-8'); ?></dd>
            <dt>种类：</dt><dd><?php echo htmlspecialchars($pet['class_name'], ENT_QUOTES, 'UTF-8'); ?></dd>
            <dt>品种：</dt><dd><?php echo htmlspecialchars($pet['breed_name'], ENT_QUOTES, 'UTF-8'); ?></dd>
            <dt>性别：</dt><dd><?php echo ($pet['pet_sex'] === null) ? '未知' : (($pet['pet_sex'] == 1) ? '雄' : (($pet['pet_sex'] == 0) ? '雌' : '未知')); ?></dd>
            <dt>颜色：</dt><dd><?php echo htmlspecialchars($pet['pet_color'], ENT_QUOTES, 'UTF-8'); ?></dd>
            <dt>生日：</dt><dd><?php echo htmlspecialchars($pet['pet_birth'], ENT_QUOTES, 'UTF-8'); ?></dd>
            <dt>年龄：</dt><dd><?php echo htmlspecialchars($pet['pet_age'], ENT_QUOTES, 'UTF-8'); ?></dd>
            <dt>性格：</dt><dd><?php echo htmlspecialchars($pet['pet_personality'], ENT_QUOTES, 'UTF-8'); ?></dd>
        </dl>
    </div>

    <div class="applicant-form">
        <h3>领养人信息</h3>
        <form method="post" action="save_apply.php">
            <input type="hidden" name="pet_id" value="<?php echo htmlspecialchars($pet_id, ENT_QUOTES, 'UTF-8'); ?>">
            <input type="hidden" name="user_id" value="<?php echo htmlspecialchars($user_id, ENT_QUOTES, 'UTF-8'); ?>">

            <label for="apply_user_name">姓名</label>
            <input type="text" id="apply_user_name" name="apply_user_name" required maxlength="255" placeholder="真实姓名">

            <label for="apply_user_sex">性别</label>
            <select id="apply_user_sex" name="apply_user_sex">
                <option value="">请选择</option>
                <option value="1">男</option>
                <option value="0">女</option>
                <option value="2">其他/保密</option>
            </select>

            <label for="apply_user_age">年龄</label>
            <input type="number" id="apply_user_age" name="apply_user_age" min="1" max="150" placeholder="年龄">

            <label for="apply_user_area">所在省市区</label>
            <div class="inline-selects">
                <select id="area_level1" name="area_level1">
                    <option value="">选择省/直辖市</option>
                </select>
                <select id="area_level2" name="area_level2">
                    <option value="">选择市</option>
                </select>
                <select id="area_level3" name="area_level3">
                    <option value="">选择区/县</option>
                </select>
            </div>
            <!-- 最终提交的区域 id -->
            <input type="hidden" id="apply_user_area_id" name="apply_user_area_id" value="">

            <label for="apply_user_phone">电话</label>
            <input type="tel" id="apply_user_phone" name="apply_user_phone" pattern="[0-9]{11}" value="<?php echo htmlspecialchars($prefill_phone, ENT_QUOTES, 'UTF-8'); ?>" required>

            <label for="apply_user_email">邮箱</label>
            <input type="email" id="apply_user_email" name="apply_user_email" value="<?php echo htmlspecialchars($prefill_email, ENT_QUOTES, 'UTF-8'); ?>" required>

            <button type="submit">提交申请</button>
        </form>
    </div>
</div>

<script>
    // 前端联动逻辑，使用后端输出的区域数组
    const areas = <?php echo $areas_json; ?>;
    // areas 元素结构: { area_id, area_name, area_superior_id, area_type }

    const level1 = document.getElementById('area_level1');
    const level2 = document.getElementById('area_level2');
    const level3 = document.getElementById('area_level3');
    const hiddenAreaId = document.getElementById('apply_user_area_id');

    function clearSelect(sel) {
        sel.innerHTML = '';
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = sel === level1 ? '选择省/直辖市' : (sel === level2 ? '选择市' : '选择区/县');
        sel.appendChild(opt);
    }

    function populate(selectEl, items) {
        clearSelect(selectEl);
        items.forEach(it => {
            const o = document.createElement('option');
            o.value = it.area_id;
            o.textContent = it.area_name;
            selectEl.appendChild(o);
        });
    }

    // 初始化 level1（area_type == 1）
    function initLevel1() {
        const l1 = areas.filter(a => parseInt(a.area_type) === 1);
        populate(level1, l1);
    }

    function onLevel1Change() {
        const id = level1.value;
        hiddenAreaId.value = ''; // reset
        if (!id) {
            clearSelect(level2);
            clearSelect(level3);
            return;
        }
        const l2 = areas.filter(a => parseInt(a.area_type) === 2 && String(a.area_superior_id) === String(id));
        populate(level2, l2);
        clearSelect(level3);
        // set hidden to level1 by default
        hiddenAreaId.value = id;
    }

    function onLevel2Change() {
        const id = level2.value;
        hiddenAreaId.value = id || level1.value || '';
        if (!id) {
            clearSelect(level3);
            return;
        }
        const l3 = areas.filter(a => parseInt(a.area_type) === 3 && String(a.area_superior_id) === String(id));
        populate(level3, l3);
    }

    function onLevel3Change() {
        const id = level3.value;
        hiddenAreaId.value = id || level2.value || level1.value || '';
    }

    level1.addEventListener('change', onLevel1Change);
    level2.addEventListener('change', onLevel2Change);
    level3.addEventListener('change', onLevel3Change);

    // 页面加载初始化
    initLevel1();

</script>
</body>
</html>