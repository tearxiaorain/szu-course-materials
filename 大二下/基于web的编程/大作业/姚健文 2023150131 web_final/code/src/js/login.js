/**
 * 登录页面脚本
 */

// 自动初始化 admin 账号到 localStorage
(function initAdminAccount() {
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    if (!users.find(u => u.username === 'admin')) {
        users.push({
            username: 'admin',
            studentId: '1111111111',
            nickname: 'admin',
            password: '88888888',
            interestTags: [],
            avatar: 'src/images/DefaultAvatar.png',
            id: Date.now(),
            banned: false
        });
        localStorage.setItem('userList', JSON.stringify(users));
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    // 获取表单元素
    const loginForm = document.getElementById('loginForm');
    // const studentIdInput = document.getElementById('studentId');
    const passwordInput = document.getElementById('password');
    // const studentIdError = document.getElementById('studentIdError');
    const passwordError = document.getElementById('passwordError');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const usernameInput = document.getElementById('username');
    const usernameError = document.getElementById('usernameError');
    
    // 密码显示/隐藏切换
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // 切换图标
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        } else {
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        }
    });
    
    // 表单验证
    // function validateStudentId() {
    //     const value = studentIdInput.value.trim();
    //     if (!value) {
    //         studentIdError.textContent = '请输入学号';
    //         return false;
    //     } else if (!/^\d{8,12}$/.test(value)) {
    //         studentIdError.textContent = '学号格式不正确，应为8-12位数字';
    //         return false;
    //     } else {
    //         studentIdError.textContent = '';
    //         return true;
    //     }
    // }
    
    function validatePassword() {
        const value = passwordInput.value;
        if (!value) {
            passwordError.textContent = '请输入密码';
            return false;
        } else if (value.length < 6) {
            passwordError.textContent = '密码长度不能少于6位';
            return false;
        } else {
            passwordError.textContent = '';
            return true;
        }
    }
    
    // 用户名校验
    function validateUsername() {
        const value = usernameInput.value.trim();
        if (!value) {
            usernameError.textContent = '请输入用户名';
            return false;
        } else if (!/^[a-zA-Z0-9]{2,16}$/.test(value)) {
            usernameError.textContent = '用户名格式错误，仅限2-16位英文和数字';
            return false;
        } else {
            usernameError.textContent = '';
            return true;
        }
    }
    
    // 输入事件监听
    // studentIdInput.addEventListener('input', validateStudentId);
    passwordInput.addEventListener('input', validatePassword);
    usernameInput.addEventListener('input', validateUsername);
    
    // 登录表单提交
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // const isStudentIdValid = validateStudentId();
        const isUsernameValid = validateUsername();
        const isPasswordValid = validatePassword();
        if (isUsernameValid && isPasswordValid) {
            simulateLogin({
                username: usernameInput.value.trim(),
                password: passwordInput.value,
                rememberMe: document.getElementById('rememberMe').checked
            });
        }
    });
    
    // 登录逻辑改为用户名+密码
    function simulateLogin(data) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';
        // 移除旧的错误提示
        let oldMsg = document.getElementById('loginErrorMsg');
        if (oldMsg) oldMsg.remove();
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('userList')) || [];
            const user = users.find(u => u.username === data.username);
            if (!user) {
                showLoginError('账户不存在');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } else if (user.password !== data.password) {
                showLoginError('密码错误');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            } else {
                localStorage.setItem('currentUser', JSON.stringify(user));
                showMessage('登录成功，正在跳转...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        }, 1000);
    }
    
    // 登录失败弹出提示（按钮上方）
    function showLoginError(msg) {
        let errorDiv = document.createElement('div');
        errorDiv.id = 'loginErrorMsg';
        errorDiv.className = 'login-error-msg';
        errorDiv.textContent = msg;
        // 插入到登录按钮上方
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.parentNode.insertBefore(errorDiv, submitBtn);
        setTimeout(() => {
            errorDiv.classList.add('show');
        }, 10);
        setTimeout(() => {
            errorDiv.classList.remove('show');
            errorDiv.addEventListener('transitionend', function() {
                errorDiv.remove();
            });
        }, 2500);
    }
    
    // 显示消息提示
    function showMessage(message, type = 'info') {
        // 检查是否已存在消息元素
        let messageElement = document.querySelector('.message-container');
        
        if (!messageElement) {
            // 创建消息容器
            messageElement = document.createElement('div');
            messageElement.className = 'message-container';
            document.body.appendChild(messageElement);
        }
        
        // 创建消息元素
        const messageItem = document.createElement('div');
        messageItem.className = `message message-${type}`;
        messageItem.innerHTML = `
            <div class="message-content">
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 添加到容器
        messageElement.appendChild(messageItem);
        
        // 显示动画
        setTimeout(() => {
            messageItem.classList.add('show');
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            messageItem.classList.remove('show');
            messageItem.addEventListener('transitionend', function() {
                messageItem.remove();
                
                // 如果没有更多消息，移除容器
                if (messageElement.children.length === 0) {
                    messageElement.remove();
                }
            });
        }, 3000);
    }
});