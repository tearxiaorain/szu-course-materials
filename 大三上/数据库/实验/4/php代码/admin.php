<?php
// admin.php  管理后台显示
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');
session_start();
include 'conn.php';

// 读取视图数据，宠物按 ID 升序（视图列名为 `宠物ID`）
$userRes = $conn->query("SELECT * FROM v_user_info");
$petRes = $conn->query("SELECT * FROM v_pet_info ORDER BY `宠物ID` ASC");
$applyRes = $conn->query("SELECT * FROM v_apply_info");

if ($userRes === false || $petRes === false || $applyRes === false) {
    die('查询视图失败: (' . $conn->errno . ') ' . $conn->error);
}

// 读取品种和种类用于添加宠物表单
$breeds = [];
if ($r = $conn->query("SELECT breed_id, breed_name FROM breed31")) {
    while ($row = $r->fetch_assoc()) $breeds[] = $row;
    $r->free();
}
$classes = [];
if ($r = $conn->query("SELECT class_id, class_name FROM class31")) {
    while ($row = $r->fetch_assoc()) $classes[] = $row;
    $r->free();
}

// 获取表头
function get_headers_from_result($res) {
    $fields = $res->fetch_fields();
    $headers = [];
    foreach ($fields as $f) $headers[] = $f->name;
    return $headers;
}

$userHeaders = get_headers_from_result($userRes);
$petHeaders = get_headers_from_result($petRes);
$applyHeaders = get_headers_from_result($applyRes);

// 判断 id 列名
function find_id_key($headers, $candidates) {
    foreach ($candidates as $cand) {
        foreach ($headers as $h) {
            if ($h === $cand) return $h;
        }
    }
    // fallback first column
    return count($headers) ? $headers[0] : null;
}

$userIdKey = find_id_key($userHeaders, ['用户ID','user_id','userId','用户Id']);
$petIdKey = find_id_key($petHeaders, ['宠物ID','pet_id','petId','宠物id']);
$applyIdKey = find_id_key($applyHeaders, ['申请ID','apply_id','applyId']);

?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>管理后台</title>
    <style>
        body { font-family:Arial,Helvetica,sans-serif; background:#f6f8fa; padding:18px; }
        .tabs { display:flex; gap:8px; margin-bottom:12px; }
        .tab { padding:8px 12px; background:#fff; border-radius:6px; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.06);} 
        .tab.active { background:#007bff; color:#fff; }
        .panel { display:none; background:#fff; padding:12px; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        .panel.active { display:block; }
        table { width:100%; border-collapse:collapse; margin-bottom:12px; }
        th, td { border:1px solid #e6e6e6; padding:8px; text-align:left; }
        th { background:#f0f2f5; }
        .btn { display:inline-block; padding:6px 10px; border-radius:4px; color:#fff; text-decoration:none; border:0; cursor:pointer; }
        .btn-ban { background:#dc3545; }
        .btn-unban { background:#6c757d; }
        .btn-edit { background:#17a2b8; }
        .btn-delete { background:#dc3545; }
        .btn-add { background:#28a745; margin-top:8px; }
        .btn-review { background:#ffc107; color:#000; }
        form.inline { display:inline-block; margin:0 4px; }
        .add-form, .edit-form { border:1px dashed #e6e6e6; padding:12px; margin-top:12px; border-radius:6px; display:none; }
        .add-form label, .edit-form label { display:block; margin-top:8px; font-weight:600; }
        .add-form input, .add-form select, .edit-form input, .edit-form select { width:100%; padding:6px; margin-top:6px; box-sizing:border-box; }
    </style>
</head>
<body>
    <h1>管理后台</h1>
    <div class="tabs">
        <div class="tab active" data-target="panel-users">用户</div>
        <div class="tab" data-target="panel-pets">宠物</div>
        <div class="tab" data-target="panel-applies">申请</div>
    </div>

    <div id="panel-users" class="panel active">
        <h2>用户列表</h2>
        <table>
            <thead>
                <tr>
                    <?php foreach ($userHeaders as $h): ?>
                        <th><?php echo htmlspecialchars($h, ENT_QUOTES, 'UTF-8'); ?></th>
                    <?php endforeach; ?>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($row = $userRes->fetch_assoc()): ?>
                    <tr>
                        <?php foreach ($userHeaders as $h): ?>
                            <td><?php echo htmlspecialchars(isset($row[$h]) ? $row[$h] : '', ENT_QUOTES, 'UTF-8'); ?></td>
                        <?php endforeach; ?>
                        <td>
                            <?php
                                $uid = isset($row[$userIdKey]) ? $row[$userIdKey] : '';
                                // 查询真实状态 id
                                $userState = null;
                                if ($uid !== '') {
                                    if ($st = $conn->prepare('SELECT user_state_id FROM user31 WHERE user_id = ? LIMIT 1')) {
                                        $st->bind_param('i', $uid);
                                        $st->execute();
                                        $st->bind_result($userState);
                                        $st->fetch();
                                        $st->close();
                                    }
                                }

                                // 根据状态显示文字及按钮：0=正常，1=封禁中，3=管理员（无按钮）
                                if ($userState === null) {
                                    echo '<span>未知状态</span>';
                                } elseif ((int)$userState === 3) {
                                    echo '<span>管理员</span>';
                                } elseif ((int)$userState === 1) {
                                    echo '<span>封禁中</span> ';
                                    echo '<form class="inline" method="post" action="ban_user.php">';
                                    echo '<input type="hidden" name="user_id" value="'.htmlspecialchars($uid, ENT_QUOTES, 'UTF-8').'">';
                                    echo '<input type="hidden" name="action" value="unban">';
                                    echo '<button class="btn btn-unban" type="submit">解封</button>';
                                    echo '</form>';
                                } else {
                                    // 其他（包括 0）视为正常
                                    echo '<span>正常</span> ';
                                    echo '<form class="inline" method="post" action="ban_user.php">';
                                    echo '<input type="hidden" name="user_id" value="'.htmlspecialchars($uid, ENT_QUOTES, 'UTF-8').'">';
                                    echo '<input type="hidden" name="action" value="ban">';
                                    echo '<button class="btn btn-ban" type="submit">封禁</button>';
                                    echo '</form>';
                                }
                            ?>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>

    <div id="panel-pets" class="panel">
        <h2>宠物列表</h2>
        <table>
            <thead>
                <tr>
                    <?php foreach ($petHeaders as $h): ?>
                        <th><?php echo htmlspecialchars($h, ENT_QUOTES, 'UTF-8'); ?></th>
                    <?php endforeach; ?>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($row = $petRes->fetch_assoc()): ?>
                    <tr>
                        <?php foreach ($petHeaders as $h): ?>
                            <td><?php echo htmlspecialchars(isset($row[$h]) ? $row[$h] : '', ENT_QUOTES, 'UTF-8'); ?></td>
                        <?php endforeach; ?>
                        <td>
                            <?php
                                $pid = isset($row[$petIdKey]) ? $row[$petIdKey] : '';
                                // 修改按钮：打开编辑表单，按钮包含本行数据 JSON
                                $json = htmlspecialchars(json_encode($row, JSON_UNESCAPED_UNICODE), ENT_QUOTES, 'UTF-8');
                                echo '<button class="btn btn-edit open-edit" type="button" data-pet="'.$json.'">修改</button>';
                                // 删除按钮为直接 POST
                                echo '<form class="inline" method="post" action="delete_pet.php">';
                                echo '<input type="hidden" name="pet_id" value="'.htmlspecialchars($pid, ENT_QUOTES, 'UTF-8').'">';
                                echo '<button class="btn btn-delete" type="submit">删除</button>';
                                echo '</form>';
                            ?>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
        <button id="showAddPet" class="btn btn-add" type="button">添加</button>

        <div id="addForm" class="add-form">
            <h3>添加宠物</h3>
            <form method="post" action="save_pet.php">
                <label for="pet_name">名字</label>
                <input id="pet_name" name="pet_name" required maxlength="255">

                <label for="class_id">种类</label>
                <select id="class_id" name="class_id">
                    <option value="">请选择</option>
                    <?php foreach ($classes as $c): ?>
                        <option value="<?php echo htmlspecialchars($c['class_id'], ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($c['class_name'], ENT_QUOTES, 'UTF-8'); ?></option>
                    <?php endforeach; ?>
                </select>

                <label for="breed_id">品种</label>
                <select id="breed_id" name="breed_id">
                    <option value="">请选择</option>
                    <?php foreach ($breeds as $b): ?>
                        <option value="<?php echo htmlspecialchars($b['breed_id'], ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($b['breed_name'], ENT_QUOTES, 'UTF-8'); ?></option>
                    <?php endforeach; ?>
                </select>

                <label for="pet_sex">性别</label>
                <select id="pet_sex" name="pet_sex">
                    <option value="">请选择</option>
                    <option value="1">雄</option>
                    <option value="0">雌</option>
                </select>

                <label for="pet_birth">生日</label>
                <input id="pet_birth" name="pet_birth" type="date">

                <label for="pet_age">年龄</label>
                <input id="pet_age" name="pet_age" type="number" min="0">

                <label for="pet_color">颜色</label>
                <input id="pet_color" name="pet_color">

                <label for="pet_personality">性格</label>
                <input id="pet_personality" name="pet_personality">

                <div style="margin-top:8px;">
                    <button class="btn btn-add" type="submit">提交</button>
                    <button class="btn" id="cancelAdd" type="button" style="background:#6c757d;">取消</button>
                </div>
            </form>
        </div>

        <div id="editForm" class="edit-form">
            <h3>修改宠物</h3>
            <form method="post" action="change_pet.php">
                <input type="hidden" id="edit_pet_id" name="pet_id" value="">

                <label for="edit_pet_name">名字</label>
                <input id="edit_pet_name" name="pet_name" required maxlength="255">

                <label for="edit_class_id">种类</label>
                <select id="edit_class_id" name="class_id">
                    <option value="">请选择</option>
                    <?php foreach ($classes as $c): ?>
                        <option value="<?php echo htmlspecialchars($c['class_id'], ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($c['class_name'], ENT_QUOTES, 'UTF-8'); ?></option>
                    <?php endforeach; ?>
                </select>

                <label for="edit_breed_id">品种</label>
                <select id="edit_breed_id" name="breed_id">
                    <option value="">请选择</option>
                    <?php foreach ($breeds as $b): ?>
                        <option value="<?php echo htmlspecialchars($b['breed_id'], ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($b['breed_name'], ENT_QUOTES, 'UTF-8'); ?></option>
                    <?php endforeach; ?>
                </select>

                <label for="edit_pet_sex">性别</label>
                <select id="edit_pet_sex" name="pet_sex">
                    <option value="">请选择</option>
                    <option value="1">雄</option>
                    <option value="0">雌</option>
                </select>

                <label for="edit_pet_birth">生日</label>
                <input id="edit_pet_birth" name="pet_birth" type="date">

                <label for="edit_pet_age">年龄</label>
                <input id="edit_pet_age" name="pet_age" type="number" min="0">

                <label for="edit_pet_color">颜色</label>
                <input id="edit_pet_color" name="pet_color">

                <label for="edit_pet_personality">性格</label>
                <input id="edit_pet_personality" name="pet_personality">

                <div style="margin-top:8px;">
                    <button class="btn btn-edit" type="submit">提交修改</button>
                    <button class="btn" id="cancelEdit" type="button" style="background:#6c757d;">取消</button>
                </div>
            </form>
        </div>
    </div>

    <div id="panel-applies" class="panel">
        <h2>申请列表</h2>
        <table>
            <thead>
                <tr>
                    <?php foreach ($applyHeaders as $h): ?>
                        <th><?php echo htmlspecialchars($h, ENT_QUOTES, 'UTF-8'); ?></th>
                    <?php endforeach; ?>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($row = $applyRes->fetch_assoc()): ?>
                    <tr>
                        <?php foreach ($applyHeaders as $h): ?>
                            <td><?php echo htmlspecialchars(isset($row[$h]) ? $row[$h] : '', ENT_QUOTES, 'UTF-8'); ?></td>
                        <?php endforeach; ?>
                        <td>
                            <?php
                                $aid = isset($row[$applyIdKey]) ? $row[$applyIdKey] : '';
                                // 根据 apply_id 查询实际的 apply_state_id，只有状态为 0 时显示审核按钮
                                $applyState = null;
                                if ($aid !== '') {
                                    if ($st = $conn->prepare('SELECT apply_state_id FROM apply31 WHERE apply_id = ? LIMIT 1')) {
                                        $st->bind_param('i', $aid);
                                        $st->execute();
                                        $st->bind_result($applyState);
                                        $st->fetch();
                                        $st->close();
                                    }
                                }
                                if ($applyState === null) {
                                    echo '<span>状态未知</span>';
                                } elseif ((int)$applyState === 0) {
                                    // 未审核：显示审核按钮
                                    echo '<form class="inline" method="post" action="review.php">';
                                    echo '<input type="hidden" name="apply_id" value="'.htmlspecialchars($aid, ENT_QUOTES, 'UTF-8').'">';
                                    echo '<button class="btn btn-review" type="submit">审核</button>';
                                    echo '</form>';
                                } else {
                                    // 已处理，显示结果
                                    $label = '已处理';
                                    if ((int)$applyState === 1) $label = '不通过';
                                    elseif ((int)$applyState === 2) $label = '通过';
                                    echo '<span>'.htmlspecialchars($label, ENT_QUOTES, 'UTF-8').'</span>';
                                }
                            ?>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>

<script>
    // 选项卡切换
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-target')).classList.add('active');
        });
    });

    // 添加宠物表单显示控制
    const showBtn = document.getElementById('showAddPet');
    const addForm = document.getElementById('addForm');
    const cancelBtn = document.getElementById('cancelAdd');
    showBtn.addEventListener('click', () => { addForm.style.display = 'block'; showBtn.style.display = 'none'; });
    cancelBtn.addEventListener('click', () => { addForm.style.display = 'none'; showBtn.style.display = 'inline-block'; });

    // 编辑按钮打开并填充编辑表单
    document.querySelectorAll('.open-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const data = btn.getAttribute('data-pet');
            try {
                const pet = JSON.parse(data);
                document.getElementById('edit_pet_id').value = pet['宠物ID'] || pet['pet_id'] || pet['id'] || '';
                document.getElementById('edit_pet_name').value = pet['宠物名字'] || pet['宠物名字'] || pet['pet_name'] || '';
                // 填充下拉框：先重置
                document.getElementById('edit_class_id').value = pet['种类名'] ? '' : '';
                // 如果视图没有返回 class_id/breed_id，我们不能直接设置 id，只能尽量通过名称匹配
                // 通过匹配 option 文本来选择
                const selectByText = (selId, text) => {
                    if (!text) return;
                    const sel = document.getElementById(selId);
                    for (let i=0;i<sel.options.length;i++) {
                        if (sel.options[i].text === text) { sel.selectedIndex = i; break; }
                    }
                };
                selectByText('edit_class_id', pet['种类名'] || pet['class_name']);
                selectByText('edit_breed_id', pet['品种名'] || pet['breed_name']);

                // 性别、生日、年龄、颜色、性格
                if (pet['性别']) {
                    const sex = pet['性别'] === '雄' ? '1' : (pet['性别'] === '雌' ? '0' : '');
                    document.getElementById('edit_pet_sex').value = sex;
                }
                document.getElementById('edit_pet_birth').value = pet['生日'] || pet['pet_birth'] || '';
                document.getElementById('edit_pet_age').value = pet['年龄'] || pet['pet_age'] || '';
                document.getElementById('edit_pet_color').value = pet['颜色'] || pet['pet_color'] || '';
                document.getElementById('edit_pet_personality').value = pet['性格'] || pet['pet_personality'] || '';

                // 显示编辑表单
                document.getElementById('editForm').style.display = 'block';
                // 隐藏添加按钮区域以避免混淆
                showBtn.style.display = 'none';
                addForm.style.display = 'none';
            } catch (e) {
                alert('无法解析宠物数据');
            }
        });
    });

    // 取消编辑
    const cancelEdit = document.getElementById('cancelEdit');
    cancelEdit.addEventListener('click', () => { document.getElementById('editForm').style.display = 'none'; showBtn.style.display = 'inline-block'; });
</script>
</body>
</html>