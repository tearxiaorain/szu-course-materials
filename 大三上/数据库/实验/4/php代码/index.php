<?php
// index.php  首页显示
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');

session_start(); // 启用会话以便识别当前登录用户
$loggedIn = isset($_SESSION['user_id']);

// 显示用户名
$displayName = '';
if ($loggedIn) {
    if (!empty($_SESSION['username'])) $displayName = $_SESSION['username'];
    elseif (!empty($_SESSION['user_name'])) $displayName = $_SESSION['user_name'];
    elseif (!empty($_SESSION['name'])) $displayName = $_SESSION['name'];
    else $displayName = '用户#' . $_SESSION['user_id'];
}

include 'conn.php'; // 使用 mysqli 连接

$sql = "SELECT * FROM v_pet_info ORDER BY `宠物ID` ASC"; // 按宠物ID升序排序
$result = $conn->query($sql);
if ($result === false) {
    die('查询失败: (' . $conn->errno . ') ' . $conn->error);
}

// 获取字段名
$fields = $result->fetch_fields();
$headers = [];
$hasPetId = false;
foreach ($fields as $f) {
    $headers[] = $f->name;
    if ($f->name === '宠物ID' || $f->name === 'pet_id' || $f->name === '宠物id' || $f->name === 'id') {
        $hasPetId = true;
    }
}

// 显示时不展示 pet_id 列
$visibleHeaders = array_filter($headers, function($h){
    return !in_array($h, ['宠物ID','pet_id','宠物id','id'], true);
});
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>宠物信息</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; background:#f6f8fa; padding:20px; }
        table { border-collapse:collapse; width:100%; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
        th, td { padding:8px 12px; border:1px solid #e6e6e6; text-align:left; }
        th { background:#f0f2f5; }
        caption { font-size:20px; margin-bottom:8px; }
        .apply-btn { display:inline-block; padding:6px 10px; background:#ff7f50; color:#fff; border-radius:4px; text-decoration:none; border:0; cursor:pointer; }
        .apply-btn:hover { background:#ff6030; }
        .disabled { opacity:0.6; pointer-events:none; }
        .login-link { color:#007bff; text-decoration:none; }

        /* 用户右上角区域与下拉菜单样式 */
        .user-area { position: absolute; top:20px; right:20px; z-index:1000; }
        .user-dropdown { position: relative; display:inline-block; }
        .user-name { display:inline-block; background:#fff; padding:6px 10px; border-radius:6px; box-shadow:0 1px 4px rgba(0,0,0,0.08); cursor:pointer; color:#333; }
        .user-menu { display:none; position:absolute; right:0; top:100%; transform:translateY(6px); background:#fff; border:1px solid #e6e6e6; box-shadow:0 6px 18px rgba(0,0,0,0.08); border-radius:6px; min-width:150px; overflow:hidden; }
        .user-dropdown.open .user-menu { display:block; }
         .user-action, .user-action-button { display:block; padding:10px 12px; color:#333; text-decoration:none; background:transparent; border:0; width:100%; text-align:left; font-size:14px; font-family:inherit; box-sizing:border-box; }
         .user-action:hover, .user-action-button:hover { background:#f5f5f5; }
         .user-action-button { background:none; border:none; margin:0; cursor:pointer; }
+        .user-name { user-select:none; }
    </style>
</head>
<body>
    <!-- 右上角用户信息与下拉菜单 -->
    <div class="user-area">
        <?php if ($loggedIn): ?>
            <div class="user-dropdown">
                <span class="user-name"><?php echo htmlspecialchars($displayName, ENT_QUOTES, 'UTF-8'); ?> ▾</span>
                <div class="user-menu">
                    <form method="post" action="logout.php" style="margin:0;">
                        <button type="submit" class="user-action user-action-button">退出登录</button>
                    </form>
                </div>
            </div>
        <?php else: ?>
            <a class="login-link" href="login.php">登录/注册</a>
        <?php endif; ?>
    </div>

    <h1>宠物认领平台</h1>

    <?php if ($result->num_rows === 0): ?>
        <p>暂无数据。</p>
    <?php else: ?>
        <table>
            <caption>共 <?php echo $result->num_rows; ?> 条记录</caption>
            <thead>
                <tr>
                    <?php foreach ($visibleHeaders as $h): ?>
                        <th><?php echo htmlspecialchars($h, ENT_QUOTES, 'UTF-8'); ?></th>
                    <?php endforeach; ?>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php while ($row = $result->fetch_assoc()): ?>
                    <tr>
                        <?php foreach ($visibleHeaders as $h): ?>
                            <td><?php echo htmlspecialchars(isset($row[$h]) ? $row[$h] : '', ENT_QUOTES, 'UTF-8'); ?></td>
                        <?php endforeach; ?>
                        <td>
                            <?php
                                // 优先使用已知键名 pet_id，或中文/通用 id
                                $pid = null;
                                if (isset($row['pet_id'])) $pid = $row['pet_id'];
                                elseif (isset($row['宠物id'])) $pid = $row['宠物id'];
                                elseif (isset($row['id'])) $pid = $row['id'];
                                elseif (isset($row['宠物ID'])) $pid = $row['宠物ID'];

                                if ($pid) {
                                    if ($loggedIn) {
                                        // 使用 POST 表单提交 pet_id 到 apply.php
                                        echo '<form method="post" action="apply.php" style="display:inline">';
                                        echo '<input type="hidden" name="pet_id" value="' . htmlspecialchars($pid, ENT_QUOTES, 'UTF-8') . '">';
                                        echo '<button type="submit" class="apply-btn">申请领养</button>';
                                        echo '</form>';
                                    } else {
                                        // 未登录，提示登录
                                        echo '<a class="apply-btn" href="login.php">去登录以申请</a>';
                                    }
                                } else {
                                    echo '<span class="apply-btn disabled">需要 pet_id</span>';
                                }
                            ?>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
        <?php if (!$hasPetId): ?>
            <p style="color:#a00;margin-top:12px;">提示：当前视图没有返回宠物的 id。建议修改视图，加入 pet31.pet_id AS pet_id，但在表格中保持不显示。</p>
        <?php endif; ?>
    <?php endif; ?>

</body>
<script>
// 点击切换用户菜单，点击页面其它地方关闭
document.addEventListener('DOMContentLoaded', function(){
    var dropdown = document.querySelector('.user-dropdown');
    if (!dropdown) return;
    var name = dropdown.querySelector('.user-name');
    var menu = dropdown.querySelector('.user-menu');
    // 使触发元素可聚焦并支持键盘操作
    name.setAttribute('tabindex', '0');
    name.setAttribute('role', 'button');
    name.addEventListener('click', function(e){
        dropdown.classList.toggle('open');
    });
    name.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropdown.classList.toggle('open'); }
    });
    // 点击页面空白关闭菜单
    document.addEventListener('click', function(e){
        if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
    });
    // 在菜单内点击不要使外层 document 的点击处理器关闭菜单（例如退出表单）
    menu.addEventListener('click', function(e){ e.stopPropagation(); });
});
</script>
</html>
<?php
$result->free();
?>