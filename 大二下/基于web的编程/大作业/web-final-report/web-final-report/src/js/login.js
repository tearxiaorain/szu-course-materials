/**
 * 登录页面脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取表单元素
    const loginForm = document.getElementById('loginForm');
    const studentIdInput = document.getElementById('studentId');
    const passwordInput = document.getElementById('password');
    const studentIdError = document.getElementById('studentIdError');
    const passwordError = document.getElementById('passwordError');
    const togglePasswordBtn = document.getElementById('togglePassword');
    
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
    function validateStudentId() {
        const value = studentIdInput.value.trim();
        if (!value) {
            studentIdError.textContent = '请输入学号';
            return false;
        } else if (!/^\d{8,12}$/.test(value)) {
            studentIdError.textContent = '学号格式不正确，应为8-12位数字';
            return false;
        } else {
            studentIdError.textContent = '';
            return true;
        }
    }
    
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
    
    // 输入事件监听
    studentIdInput.addEventListener('input', validateStudentId);
    passwordInput.addEventListener('input', validatePassword);
    
    // 表单提交
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 验证表单
        const isStudentIdValid = validateStudentId();
        const isPasswordValid = validatePassword();
        
        if (isStudentIdValid && isPasswordValid) {
            // 模拟登录请求
            simulateLogin({
                studentId: studentIdInput.value.trim(),
                password: passwordInput.value,
                rememberMe: document.getElementById('rememberMe').checked
            });
        }
    });
    
    // 模拟登录请求
    function simulateLogin(data) {
        // 显示加载状态
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '登录中...';
        
        // 模拟网络请求延迟
        setTimeout(() => {
            // 模拟登录成功
            if (data.studentId === '12345678' && data.password === 'password123') {
                // 保存用户信息到本地存储
                const user = {
                    id: 1,
                    studentId: data.studentId,
                    name: '张三',
                    avatar: 'src/images/avatar.jpg',
                    token: 'simulated_token_' + Date.now()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // 显示成功消息
                showMessage('登录成功，正在跳转...', 'success');
                
                // 跳转到首页
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                // 显示错误消息
                showMessage('学号或密码错误，请重试', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }, 1500);
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