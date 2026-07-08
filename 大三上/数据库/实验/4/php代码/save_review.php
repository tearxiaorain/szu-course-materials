<?php
// save_review.php - 保存审核结果到 review31（更新 apply31 状态）
header('Content-Type: text/html; charset=utf-8');
ini_set('default_charset', 'UTF-8');
session_start();
include 'conn.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die('仅支持 POST 提交');
}

$apply_id = isset($_POST['apply_id']) ? intval($_POST['apply_id']) : 0;
$decision = isset($_POST['decision']) ? trim($_POST['decision']) : '';

if (!$apply_id || $decision === '') {
    die('参数不完整');
}

// 根据要求：apply_review_id 和 apply_id 相同
$review_apply_id = $apply_id;

// 将结果规范为整数：通过 -> 1，不通过 -> 0
if ($decision === 'approve') $review_result = 1;
elseif ($decision === 'reject') $review_result = 0;
else {
    // 非预期结果，转为 0
    $review_result = 0;
}

// 对应 apply31.apply_state_id：通过 -> 2，不通过 -> 1
$apply_state_id = ($review_result === 1) ? 2 : 1;

// 使用事务保证一致性
$conn->begin_transaction();
try {
    // 插入 review31 (apply_id, review_apply_id, review_result, review_time)
    $insSql = "INSERT INTO review31 (apply_id, review_apply_id, review_result, review_time) VALUES (?, ?, ?, NOW())";
    $insStmt = $conn->prepare($insSql);
    if (!$insStmt) {
        // 如果失败，检查是否为 review_id 必须显式提供（无默认值）的情况
        $errStr = $conn->error;
        if (stripos($errStr, 'review_id') !== false || stripos($errStr, "doesn't have a default") !== false || stripos($errStr, '没有默认值') !== false) {
            // 计算下一个 review_id（简单方案：MAX+1）
            $rid = null;
            $r = $conn->query('SELECT IFNULL(MAX(review_id),0)+1 AS nextid FROM review31');
            if ($r) {
                $rr = $r->fetch_assoc();
                $rid = intval($rr['nextid']);
                $r->free();
            } else {
                throw new Exception('无法获取下一个 review_id: ' . $conn->error);
            }
            $insSql2 = "INSERT INTO review31 (review_id, apply_id, review_apply_id, review_result, review_time) VALUES (?, ?, ?, ?, NOW())";
            $insStmt = $conn->prepare($insSql2);
            if (!$insStmt) throw new Exception('准备插入含 review_id SQL 失败: ' . $conn->error);
            $insStmt->bind_param('iiii', $rid, $apply_id, $review_apply_id, $review_result);
        } else {
            throw new Exception('准备插入SQL失败: ' . $errStr);
        }
    } else {
        $insStmt->bind_param('iii', $apply_id, $review_apply_id, $review_result);
    }
    if (!$insStmt->execute()) {
        $err = $insStmt->error;
        // 若错误为重复主键或列无默认值，尝试使用显式 review_id 重试
        $lc = strtolower($err);
        if (stripos($lc, 'duplicate') !== false || stripos($lc, 'duplicata') !== false || stripos($lc, "doesn't have a default") !== false || stripos($lc, '没有默认值') !== false || stripos($lc, 'du champ') !== false) {
            // 先关闭原 stmt
            $insStmt->close();
            // 计算下一个 review_id（MAX+1）
            $rid = null;
            $r = $conn->query('SELECT IFNULL(MAX(review_id),0)+1 AS nextid FROM review31');
            if ($r) {
                $rr = $r->fetch_assoc();
                $rid = intval($rr['nextid']);
                $r->free();
            }
            if (!$rid) throw new Exception('无法获取下一个 review_id: ' . $conn->error);
            $insSql2 = "INSERT INTO review31 (review_id, apply_id, review_apply_id, review_result, review_time) VALUES (?, ?, ?, ?, NOW())";
            if (!($insStmt2 = $conn->prepare($insSql2))) throw new Exception('准备插入含 review_id SQL 失败: ' . $conn->error);
            $insStmt2->bind_param('iiii', $rid, $apply_id, $review_apply_id, $review_result);
            if (!$insStmt2->execute()) {
                $err2 = $insStmt2->error;
                $insStmt2->close();
                throw new Exception('插入审核记录失败(含id): ' . $err2);
            }
            $insStmt2->close();
        } else {
            $insStmt->close();
            throw new Exception('插入审核记录失败: ' . $err);
        }
    } else {
        $insStmt->close();
    }

    // 更新 apply31 的状态
    $updSql = "UPDATE apply31 SET apply_state_id = ? WHERE apply_id = ?";
    if (!($updStmt = $conn->prepare($updSql))) throw new Exception('准备更新apply31失败: ' . $conn->error);
    $updStmt->bind_param('ii', $apply_state_id, $apply_id);
    if (!$updStmt->execute()) {
        $err = $updStmt->error;
        $updStmt->close();
        throw new Exception('更新申请状态失败: ' . $err);
    }
    $updStmt->close();

    $conn->commit();
    header('Location: admin.php?msg=review_saved');
    exit;
} catch (Exception $e) {
    $conn->rollback();
    die('保存审核失败: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8'));
}
?>