/**
 * 注册页面脚本
 */

// 自动初始化 admin 账号到 localStorage
(function initAdminAccount() {
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    
    // 初始化管理员账号
    if (!users.find(u => u.username === 'admin')) {
        users.push({
            username: 'admin',
            studentId: '1111111111',
            nickname: '管理员',
            password: '88888888',
            interestTags: [],
            avatar: 'src/images/DefaultAvatar.png',
            id: 1750516625142,
            role: 'admin',
            following: [],
            followers: [],
            banned: false
        });
    }
    
    // 初始化学习达人账号
    if (!users.find(u => u.username === 'study_master')) {
        users.push({
            username: 'study_master',
            studentId: '2021001001',
            nickname: '学习达人',
            password: '111111c',
            interestTags: ['学习', '编程', '阅读'],
            avatar: 'src/images/DefaultAvatar.png',
            id: 1750516625143,
            role: 'user',
            following: [],
            followers: [],
            banned: false
        });
    }
    
    // 初始化摄影爱好者账号
    if (!users.find(u => u.username === 'photo_lover')) {
        users.push({
            username: 'photo_lover',
            studentId: '2021002001',
            nickname: '摄影爱好者',
            password: '111111c',
            interestTags: ['摄影', '艺术', '旅行'],
            avatar: 'src/images/DefaultAvatar.png',
            id: 1750516625144,
            role: 'user',
            following: [],
            followers: [],
            banned: false
        });
    }
    
    // 初始化校园歌手账号
    if (!users.find(u => u.username === 'campus_singer')) {
        users.push({
            username: 'campus_singer',
            studentId: '2021003001',
            nickname: '校园歌手',
            password: '111111c',
            interestTags: ['音乐', '唱歌', '表演'],
            avatar: 'src/images/DefaultAvatar.png',
            id: 1750516625145,
            role: 'user',
            following: [],
            followers: [],
            banned: false
        });
    }
    
    localStorage.setItem('userList', JSON.stringify(users));
})();

// 注册页面加载时初始化预设用户
initPresetUsers();

document.addEventListener('DOMContentLoaded', function() {
    // 获取表单元素
    const registerForm = document.getElementById('registerForm');
    const studentIdInput = document.getElementById('studentId');
    // const nameInput = document.getElementById('name');
    const nicknameInput = document.getElementById('nickname');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    // const emailInput = document.getElementById('email');
    const verificationCodeInput = document.getElementById('verificationCode');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const interestTagsContainer = document.getElementById('interestTags');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarInput = document.getElementById('avatarInput');
    const avatarImage = document.getElementById('avatarImage');
    const usernameInput = document.getElementById('username');
    
    // 错误信息元素
    const studentIdError = document.getElementById('studentIdError');
    // const nameError = document.getElementById('nameError');
    const nicknameError = document.getElementById('nicknameError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    // const emailError = document.getElementById('emailError');
    const verificationCodeError = document.getElementById('verificationCodeError');
    const interestTagsError = document.getElementById('interestTagsError');
    const agreeTermsError = document.getElementById('agreeTermsError');
    const usernameError = document.getElementById('usernameError');
    
    // 头像上传预览
    avatarPreview.addEventListener('click', function() {
        avatarInput.click();
    });
    
    avatarInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                avatarImage.src = e.target.result;
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
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
    
    // 兴趣标签选择
    const interestTags = interestTagsContainer.querySelectorAll('.interest-tag');
    let selectedTags = [];
    
    interestTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagValue = this.getAttribute('data-tag');
            
            if (this.classList.contains('selected')) {
                // 取消选择
                this.classList.remove('selected');
                selectedTags = selectedTags.filter(item => item !== tagValue);
            } else {
                // 选择标签
                if (selectedTags.length < 5) {
                    this.classList.add('selected');
                    selectedTags.push(tagValue);
                } else {
                    showMessage('最多只能选择5个兴趣标签', 'error');
                }
            }
            
            // 验证兴趣标签
            validateInterestTags();
        });
    });
    /*
    // 发送验证码
    let countdown = 0;
    let timer = null;
    
    sendCodeBtn.addEventListener('click', function() {
        // 验证邮箱
        if (!validateEmail()) {
            return;
        }
        
        // 开始倒计时
        countdown = 60;
        sendCodeBtn.disabled = true;
        sendCodeBtn.textContent = `${countdown}秒后重新发送`;
        
        timer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(timer);
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = '获取验证码';
            } else {
                sendCodeBtn.textContent = `${countdown}秒后重新发送`;
            }
        }, 1000);
        
        // 模拟发送验证码
        showMessage('验证码已发送到您的邮箱，请查收', 'success');
    });
    */
    // 表单验证函数
    function validateStudentId() {
        const value = studentIdInput.value.trim();
        if (!value) {
            studentIdError.textContent = '请输入学号';
            return false;
        } else if (!/^\d{10}$/.test(value)) {
            studentIdError.textContent = '学号必须为10位数字';
            return false;
        } else {
            // 校验唯一性
            const users = JSON.parse(localStorage.getItem('userList')) || [];
            if (users.some(u => u.studentId === value)) {
                studentIdError.textContent = '该学号已被注册';
                return false;
            }
            studentIdError.textContent = '';
            return true;
        }
    }
    
    function validateNickname() {
        const value = nicknameInput.value.trim();
        if (!value) {
            nicknameError.textContent = '请输入昵称';
            return false;
        } else if (value.length < 2 || value.length > 15) {
            nicknameError.textContent = '昵称长度应为2-15个字符';
            return false;
        } else {
            nicknameError.textContent = '';
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
        } else if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
            passwordError.textContent = '密码必须包含字母和数字';
            return false;
        } else {
            passwordError.textContent = '';
            return true;
        }
    }
    
    function validateConfirmPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!confirmPassword) {
            confirmPasswordError.textContent = '请确认密码';
            return false;
        } else if (confirmPassword !== password) {
            confirmPasswordError.textContent = '两次输入的密码不一致';
            return false;
        } else {
            confirmPasswordError.textContent = '';
            return true;
        }
    }
    
    function validateEmail() {
        const value = emailInput.value.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        if (!value) {
            emailError.textContent = '请输入邮箱';
            return false;
        } else if (!emailRegex.test(value)) {
            emailError.textContent = '邮箱格式不正确';
            return false;
        } else {
            emailError.textContent = '';
            return true;
        }
    }
    
    function validateInterestTags() {
        if (selectedTags.length === 0) {
            interestTagsError.textContent = '请至少选择1个兴趣标签';
            return false;
        } else {
            interestTagsError.textContent = '';
            return true;
        }
    }
    
    function validateAgreeTerms() {
        if (!agreeTermsCheckbox.checked) {
            agreeTermsError.textContent = '请阅读并同意用户协议和隐私政策';
            return false;
        } else {
            agreeTermsError.textContent = '';
            return true;
        }
    }
    
    function validateUsername() {
        const value = usernameInput.value.trim();
        if (!value) {
            usernameError.textContent = '请输入用户名';
            return false;
        } else if (!/^[a-zA-Z0-9]{2,16}$/.test(value)) {
            usernameError.textContent = '用户名格式错误，仅限2-16位英文和数字';
            return false;
        } else {
            // 校验唯一性
            const users = JSON.parse(localStorage.getItem('userList')) || [];
            if (users.some(u => u.username === value)) {
                usernameError.textContent = '该用户名已被注册';
                return false;
            }
            usernameError.textContent = '';
            return true;
        }
    }
    
    // 输入事件监听
    studentIdInput.addEventListener('input', validateStudentId);
    // nameInput.addEventListener('input', validateName);
    nicknameInput.addEventListener('input', validateNickname);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    // emailInput.addEventListener('input', validateEmail);
    //verificationCodeInput.addEventListener('input', validateVerificationCode);
    agreeTermsCheckbox.addEventListener('change', validateAgreeTerms);
    usernameInput.addEventListener('input', validateUsername);
    
    // 表单提交
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 验证所有字段
        const isUsernameValid = validateUsername();
        const isStudentIdValid = validateStudentId();
        const isNicknameValid = validateNickname();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isInterestTagsValid = validateInterestTags();
        const isAgreeTermsValid = validateAgreeTerms();
        
        if (!(isUsernameValid && isStudentIdValid && isNicknameValid && isPasswordValid && isConfirmPasswordValid && isInterestTagsValid && isAgreeTermsValid)) {
            return;
        }
        
        // 模拟注册请求
        simulateRegister({
            username: usernameInput.value.trim(),
            studentId: studentIdInput.value.trim(),
            nickname: nicknameInput.value.trim(),
            password: passwordInput.value,
            interestTags: selectedTags,
            avatar: avatarImage.src
        });
    });
    
    // 模拟注册请求
    function simulateRegister(data) {
        // 显示加载状态
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '注册中...';
        
        setTimeout(() => {
            // 保存用户信息到本地存储
            const user = {
                id: Date.now(),
                username: data.username,
                studentId: data.studentId,
                nickname: data.nickname,
                password: data.password,
                interestTags: data.interestTags,
                avatar: data.avatar || 'src/images/DefaultAvatar.png',
                token: 'simulated_token_' + Date.now()
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            // 写入 userList
            let users = JSON.parse(localStorage.getItem('userList')) || [];
            users.push(user);
            localStorage.setItem('userList', JSON.stringify(users));

            // 写入数据库（模拟fetch POST到 server/user-db.json）
            fetch('server/user-db.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            }).catch(() => {}); // 仅模拟，实际本地静态页面不会成功

            // 显示成功消息
            showMessage('注册成功，正在跳转到登录页面...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        }, 2000);
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