<?php 
$hostname = "localhost"; //主机名,可以用IP代替
$database = "exp4"; //数据库名
$username = "root"; //数据库用户名
$password = ""; //数据库密码

// 使用 mysqli 面向对象方式建立连接
$conn = new mysqli($hostname, $username, $password, $database);
if ($conn->connect_error) {
    die('数据库连接失败: (' . $conn->connect_errno . ') ' . $conn->connect_error);
}
$conn->set_charset('utf8mb4');
?>
