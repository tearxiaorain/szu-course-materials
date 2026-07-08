<?php
// review_apply.php - 显示申请详情并提供审核通过/不通过按钮
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');
session_start();
include 'conn.php';

// 获取 POST apply_id（优先使用 POST）
$applyId = isset($_POST['apply_id']) ? intval($_POST['apply_id']) : (isset($_GET['apply_id']) ? intval($_GET['apply_id']) : null);
$row = null;

// 辅助：根据 area_id 返回 array(province, city, area)
function resolveAreaNames($conn, $area_id) {
    $province = $city = $area = '';
    if (!$area_id) return [$province,$city,$area];
    $cur = $area_id;
    // 以最多两级上溯为准（区->市->省），但也可支持缺层情况
    $stmt = $conn->prepare('SELECT area_id, area_name, area_superior_id, area_type FROM area31 WHERE area_id = ? LIMIT 1');
    while ($cur && $stmt) {
        $stmt->bind_param('i', $cur);
        $stmt->execute();
        $res = $stmt->get_result();
        if (!$res || $res->num_rows === 0) break;
        $r = $res->fetch_assoc();
        if ((int)$r['area_type'] === 3) { $area = $r['area_name']; $cur = $r['area_superior_id']; }
        elseif ((int)$r['area_type'] === 2) { $city = $r['area_name']; $cur = $r['area_superior_id']; }
        elseif ((int)$r['area_type'] === 1) { $province = $r['area_name']; $cur = null; }
        else { // 未知类型，上溯一次然后停
            if (!$province) $province = $r['area_name'];
            $cur = $r['area_superior_id'] ? $r['area_superior_id'] : null;
        }
    }
    if ($stmt) $stmt->close();
    return [$province, $city, $area];
}

if ($applyId) {
    // 从 apply31 获取申请详细（以 apply31 为准）
    $applyRow = null;
    if ($st = $conn->prepare('SELECT * FROM apply31 WHERE apply_id = ? LIMIT 1')) {
        $st->bind_param('i', $applyId);
        $st->execute();
        $res = $st->get_result();
        if ($res && $res->num_rows) $applyRow = $res->fetch_assoc();
        $st->close();
    }

    if ($applyRow) {
        // 提取常见申请人字段
        $applicantName = isset($applyRow['apply_user_name']) ? $applyRow['apply_user_name'] : (isset($applyRow['applicant_name']) ? $applyRow['applicant_name'] : '');
        // 性别可能为数字 1/0 等，转换为文本
        $applicantGender = '';
        if (isset($applyRow['apply_user_sex'])) {
            $g = $applyRow['apply_user_sex'];
            if ($g === '1' || $g === 1 || $g === '男' || $g === 'male') $applicantGender = '男';
            elseif ($g === '0' || $g === 0 || $g === '女' || $g === 'female') $applicantGender = '女';
            else $applicantGender = (string)$g;
        }
        $applicantPhone = isset($applyRow['apply_user_phone']) ? $applyRow['apply_user_phone'] : (isset($applyRow['phone']) ? $applyRow['phone'] : '');
        $applicantEmail = isset($applyRow['apply_user_email']) ? $applyRow['apply_user_email'] : (isset($applyRow['email']) ? $applyRow['email'] : '');
        $areaId = isset($applyRow['apply_user_area_id']) ? $applyRow['apply_user_area_id'] : (isset($applyRow['area_id']) ? $applyRow['area_id'] : null);
        list($applicantProv, $applicantCity, $applicantArea) = resolveAreaNames($conn, $areaId);

        // 查询宠物信息
        $petInfo = null;
        $petId = isset($applyRow['pet_id']) ? $applyRow['pet_id'] : null;
        if ($petId) {
            $sql = "SELECT p.pet_id, p.pet_name, p.pet_sex, p.pet_color, DATE_FORMAT(p.pet_birth, '%Y-%m-%d') AS pet_birth, p.pet_age, p.pet_personality, b.breed_name, c.class_name
                    FROM pet31 p
                    LEFT JOIN breed31 b ON p.breed_id = b.breed_id
                    LEFT JOIN class31 c ON p.class_id = c.class_id
                    WHERE p.pet_id = ? LIMIT 1";
            if ($pst = $conn->prepare($sql)) {
                $pst->bind_param('i', $petId);
                $pst->execute();
                $res = $pst->get_result();
                if ($res && $res->num_rows) $petInfo = $res->fetch_assoc();
                $pst->close();
            }
        }

        // 构造兼容原来视图字段名的 $row 数组，供后续显示逻辑使用
        $row = [];
        // 申请人相关备用键
        $row['申请人姓名'] = $row['领养人姓名'] = $row['联系人姓名'] = $row['姓名'] = $row['applicant_name'] = $row['name'] = $applicantName;
        $row['申请人性别'] = $row['性别'] = $row['gender'] = $applicantGender;
        $row['电话'] = $row['手机'] = $row['联系电话'] = $row['phone'] = $row['mobile'] = $applicantPhone;
        $row['邮箱'] = $row['电子邮件'] = $row['email'] = $applicantEmail;
        $row['省'] = $row['province'] = $applicantProv;
        $row['市'] = $row['city'] = $applicantCity;
        $row['区'] = $row['county'] = $row['area'] = $applicantArea;

        // 宠物相关备用键
        if ($petInfo) {
            $row['宠物名字'] = $row['宠物名称'] = $row['宠物名'] = $row['pet_name'] = $row['宠物'] = $petInfo['pet_name'];
            // 性别文本化
            if (isset($petInfo['pet_sex'])) {
                $ps = $petInfo['pet_sex'];
                $row['性别'] = ($ps === '1' || $ps === 1 || $ps === '雄') ? '雄' : (($ps === '0' || $ps === 0 || $ps === '雌') ? '雌' : (string)$ps);
            }
            $row['种类名'] = $row['种类'] = $row['class_name'] = isset($petInfo['class_name']) ? $petInfo['class_name'] : '';
            $row['品种名'] = $row['品种'] = $row['breed_name'] = isset($petInfo['breed_name']) ? $petInfo['breed_name'] : '';
            $row['生日'] = $row['出生日期'] = $row['pet_birth'] = isset($petInfo['pet_birth']) ? $petInfo['pet_birth'] : '';
            $row['年龄'] = $row['pet_age'] = $row['age'] = isset($petInfo['pet_age']) ? $petInfo['pet_age'] : '';
            $row['颜色'] = $row['pet_color'] = isset($petInfo['pet_color']) ? $petInfo['pet_color'] : '';
            $row['性格'] = $row['pet_personality'] = isset($petInfo['pet_personality']) ? $petInfo['pet_personality'] : '';
        }

        // 仍保留 apply_id 以便后续表单提交
        $row['apply_id'] = $applyId;
    }
}

// 保证模板中使用的变量都已定义，避免 Notice
// 申请人
if (!isset($applicantName)) $applicantName = isset($row['申请人姓名']) ? $row['申请人姓名'] : '';
if (!isset($applicantGender) || $applicantGender === '') $applicantGender = isset($row['申请人性别']) ? $row['申请人性别'] : '未知';
if (!isset($applicantPhone)) $applicantPhone = isset($row['电话']) ? $row['电话'] : '';
if (!isset($applicantEmail)) $applicantEmail = isset($row['邮箱']) ? $row['邮箱'] : '';
if (!isset($applicantProv)) $applicantProv = isset($row['省']) ? $row['省'] : '';
if (!isset($applicantCity)) $applicantCity = isset($row['市']) ? $row['市'] : '';
if (!isset($applicantArea)) $applicantArea = isset($row['区']) ? $row['区'] : '';

// 宠物
if (!isset($petName)) $petName = isset($row['宠物名字']) ? $row['宠物名字'] : (isset($row['pet_name'])? $row['pet_name'] : '');
// petSex 优先从 petInfo，否则尝试视图字段，最后为 未知
if (isset($petInfo) && is_array($petInfo) && isset($petInfo['pet_sex'])) {
    $ps = $petInfo['pet_sex'];
    if ($ps === '1' || $ps === 1 || $ps === '雄') $petSex = '雄';
    elseif ($ps === '0' || $ps === 0 || $ps === '雌') $petSex = '雌';
    else $petSex = (string)$ps;
} else {
    $petSex = isset($row['宠物性别']) ? $row['宠物性别'] : (isset($row['性别']) ? $row['性别'] : '未知');
}
if (!isset($petClass)) $petClass = isset($row['种类名']) ? $row['种类名'] : (isset($row['class_name']) ? $row['class_name'] : '');
if (!isset($petBreed)) $petBreed = isset($row['品种名']) ? $row['品种名'] : (isset($row['breed_name']) ? $row['breed_name'] : '');
if (!isset($petBirth)) $petBirth = isset($row['生日']) ? $row['生日'] : (isset($row['pet_birth']) ? $row['pet_birth'] : '');
if (!isset($petAge)) $petAge = isset($row['年龄']) ? $row['年龄'] : (isset($row['pet_age']) ? $row['pet_age'] : '');
if (!isset($petColor)) $petColor = isset($row['颜色']) ? $row['颜色'] : (isset($row['pet_color']) ? $row['pet_color'] : '');
if (!isset($petPersonality)) $petPersonality = isset($row['性格']) ? $row['性格'] : (isset($row['pet_personality']) ? $row['pet_personality'] : '');

// 如果没有找到，则 $row 保持 null，后面的模板会显示未找到提示

// 安全输出
function h($s){ return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>审核申请</title>
<style>
    body{font-family:Arial,Helvetica,sans-serif;background:#f6f8fa;padding:18px}
    .card{background:#fff;padding:16px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.06);max-width:800px;margin:0 auto}
    h2{margin-top:0}
    .row{display:flex;gap:12px;margin-bottom:8px}
    .col{flex:1}
    label{display:block;font-weight:600;margin-bottom:4px}
    .value{background:#fafafa;padding:8px;border-radius:4px;border:1px solid #eee}
    .actions{display:flex;gap:12px;justify-content:flex-end;margin-top:16px}
    .btn{padding:10px 14px;border-radius:6px;border:0;cursor:pointer}
    .btn-accept{background:#28a745;color:#fff}
    .btn-reject{background:#dc3545;color:#fff}
</style>
</head>
<body>
<div class="card">
    <h2>申请详情</h2>
    <?php if (!$row): ?>
        <p>未找到申请信息。</p>
    <?php else: ?>
        <h3>申请人信息</h3>
        <div class="row">
            <div class="col">
                <label>姓名</label>
                <div class="value"><?php echo h($applicantName); ?></div>
            </div>
            <div class="col">
                <label>性别</label>
                <div class="value"><?php echo h($applicantGender); ?></div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <label>电话</label>
                <div class="value"><?php echo h($applicantPhone); ?></div>
            </div>
            <div class="col">
                <label>邮箱</label>
                <div class="value"><?php echo h($applicantEmail); ?></div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <label>省</label>
                <div class="value"><?php echo h($applicantProv); ?></div>
            </div>
            <div class="col">
                <label>市</label>
                <div class="value"><?php echo h($applicantCity); ?></div>
            </div>
            <div class="col">
                <label>区</label>
                <div class="value"><?php echo h($applicantArea); ?></div>
            </div>
        </div>

        <h3 style="margin-top:16px">领养宠物信息</h3>
        <div class="row">
            <div class="col">
                <label>名字</label>
                <div class="value"><?php echo h($petName); ?></div>
            </div>
            <div class="col">
                <label>性别</label>
                <div class="value"><?php echo h($petSex); ?></div>
            </div>
            <div class="col">
                <label>种类</label>
                <div class="value"><?php echo h($petClass); ?></div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <label>品种</label>
                <div class="value"><?php echo h($petBreed); ?></div>
            </div>
            <div class="col">
                <label>生日</label>
                <div class="value"><?php echo h($petBirth); ?></div>
            </div>
            <div class="col">
                <label>年龄</label>
                <div class="value"><?php echo h($petAge); ?></div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <label>颜色</label>
                <div class="value"><?php echo h($petColor); ?></div>
            </div>
            <div class="col">
                <label>性格</label>
                <div class="value"><?php echo h($petPersonality); ?></div>
            </div>
        </div>

        <div class="actions">
            <form method="post" action="save_review.php" style="margin:0">
                <input type="hidden" name="apply_id" value="<?php echo h($applyId); ?>">
                <input type="hidden" name="decision" value="approve">
                <button class="btn btn-accept" type="submit">通过</button>
            </form>

            <form method="post" action="save_review.php" style="margin:0">
                <input type="hidden" name="apply_id" value="<?php echo h($applyId); ?>">
                <input type="hidden" name="decision" value="reject">
                <button class="btn btn-reject" type="submit">不通过</button>
            </form>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
<?php $conn->close(); ?>
