// 管理员后台脚本
// 1. 校验是否为管理员
// 2. 渲染用户列表，支持封禁/解封、重置资料、删除
// 3. 支持搜索
// 4. 详细中文注释

// 检查当前登录用户是否为管理员
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser || currentUser.username !== 'admin') {
    alert('无权限访问，需管理员账号登录！');
    window.location.href = 'index.html';
}

// 退出登录功能
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('确定要退出登录吗？')) {
        // 清除当前用户信息
        localStorage.removeItem('currentUser');
        // 跳转到首页
        window.location.href = 'index.html';
    }
});

// 获取用户数据（模拟，实际应从后端获取）
function getUserList() {
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    // 管理员账号不显示在列表中
    return users.filter(u => u.username !== 'admin');
}

// 渲染用户列表
function renderUserTable(filter = '') {
    const tbody = document.getElementById('userTableBody');
    const users = getUserList().filter(user =>
        user.username.includes(filter) || 
        (user.studentId && user.studentId.includes(filter)) ||
        (user.nickname && user.nickname.includes(filter))
    );
    tbody.innerHTML = '';
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">暂无用户</td></tr>';
        return;
    }
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${user.studentId || '未设置'}</td>
            <td>${user.nickname || ''}</td>
            <td>${user.banned ? '<span class="banned">已封禁</span>' : '正常'}</td>
            <td>
                <button class="btn-action" onclick="toggleBanUser('${user.username}')">${user.banned ? '解封' : '封禁'}</button>
                <button class="btn-action" onclick="resetUser('${user.username}')">重置资料</button>
                <button class="btn-action" onclick="deleteUser('${user.username}')">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 封禁/解封用户
function toggleBanUser(username) {
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    users = users.map(u => {
        if (u.username === username) {
            u.banned = !u.banned;
        }
        return u;
    });
    localStorage.setItem('userList', JSON.stringify(users));
    showAdminMessage('操作成功！');
    renderUserTable(document.getElementById('searchInput').value);
}

// 重置用户资料
function resetUser(username) {
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    users = users.map(u => {
        if (u.username === username) {
            u.nickname = '';
            u.avatar = '';
            u.bio = '';
            u.interests = [];
        }
        return u;
    });
    localStorage.setItem('userList', JSON.stringify(users));
    showAdminMessage('资料已重置！');
    renderUserTable(document.getElementById('searchInput').value);
}

// 删除用户
function deleteUser(username) {
    if (!confirm('确定要删除该用户吗？')) return;
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    users = users.filter(u => u.username !== username);
    localStorage.setItem('userList', JSON.stringify(users));
    showAdminMessage('用户已删除！');
    renderUserTable(document.getElementById('searchInput').value);
}

// 管理员操作提示
function showAdminMessage(msg) {
    const msgDiv = document.getElementById('adminMessage');
    msgDiv.innerText = msg;
    msgDiv.style.display = 'block';
    setTimeout(() => { msgDiv.style.display = 'none'; }, 2000);
}

// 搜索功能
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
searchBtn.onclick = function() {
    renderUserTable(searchInput.value.trim());
};
searchInput.oninput = function() {
    if (!this.value) renderUserTable('');
};

// 页面加载时渲染用户列表
window.onload = function() {
    renderUserTable();
};

// 默认管理员账号初始化（如未存在）
// (function initAdminAccount() {
//     let users = JSON.parse(localStorage.getItem('userList')) || [];
//     if (!users.find(u => u.studentId === 'admin')) {
//         users.push({ studentId: 'admin', password: '88888888', nickname: '管理员', banned: false });
//         localStorage.setItem('userList', JSON.stringify(users));
//     }
// })(); 