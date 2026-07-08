/**
 * 注册页面脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    // 获取表单元素
    const registerForm = document.getElementById('registerForm');
    const studentIdInput = document.getElementById('studentId');
    const nameInput = document.getElementById('name');
    const nicknameInput = document.getElementById('nickname');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const emailInput = document.getElementById('email');
    const verificationCodeInput = document.getElementById('verificationCode');
    const agreeTermsCheckbox = document.getElementById('agreeTerms');
    const sendCodeBtn = document.getElementById('sendCodeBtn');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const interestTagsContainer = document.getElementById('interestTags');
    const avatarPreview = document.getElementById('avatarPreview');
    const avatarInput = document.getElementById('avatarInput');
    const avatarImage = document.getElementById('avatarImage');
    
    // 错误信息元素
    const studentIdError = document.getElementById('studentIdError');
    const nameError = document.getElementById('nameError');
    const nicknameError = document.getElementById('nicknameError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const emailError = document.getElementById('emailError');
    const verificationCodeError = document.getElementById('verificationCodeError');
    const interestTagsError = document.getElementById('interestTagsError');
    const agreeTermsError = document.getElementById('agreeTermsError');
    
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
    
    // 表单验证函数
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
    
    function validateName() {
        const value = nameInput.value.trim();
        if (!value) {
            nameError.textContent = '请输入姓名';
            return false;
        } else if (value.length < 2) {
            nameError.textContent = '姓名长度不能少于2个字符';
            return false;
        } else {
            nameError.textContent = '';
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
    
    function validateVerificationCode() {
        const value = verificationCodeInput.value.trim();
        
        if (!value) {
            verificationCodeError.textContent = '请输入验证码';
            return false;
        } else if (value.length !== 6 || !/^\d+$/.test(value)) {
            verificationCodeError.textContent = '验证码应为6位数字';
            return false;
        } else {
            verificationCodeError.textContent = '';
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
    
    // 输入事件监听
    studentIdInput.addEventListener('input', validateStudentId);
    nameInput.addEventListener('input', validateName);
    nicknameInput.addEventListener('input', validateNickname);
    passwordInput.addEventListener('input', validatePassword);
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    emailInput.addEventListener('input', validateEmail);
    verificationCodeInput.addEventListener('input', validateVerificationCode);
    agreeTermsCheckbox.addEventListener('change', validateAgreeTerms);
    
    // 表单提交
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 验证所有字段
        const isStudentIdValid = validateStudentId();
        const isNameValid = validateName();
        const isNicknameValid = validateNickname();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isEmailValid = validateEmail();
        const isVerificationCodeValid = validateVerificationCode();
        const isInterestTagsValid = validateInterestTags();
        const isAgreeTermsValid = validateAgreeTerms();
        
        // 如果所有字段都验证通过
        if (isStudentIdValid && isNameValid && isNicknameValid && 
            isPasswordValid && isConfirmPasswordValid && 
            isEmailValid && isVerificationCodeValid && 
            isInterestTagsValid && isAgreeTermsValid) {
            
            // 模拟注册请求
            simulateRegister({
                studentId: studentIdInput.value.trim(),
                name: nameInput.value.trim(),
                nickname: nicknameInput.value.trim(),
                password: passwordInput.value,
                email: emailInput.value.trim(),
                verificationCode: verificationCodeInput.value.trim(),
                interestTags: selectedTags,
                avatar: avatarImage.src
            });
        }
    });
    
    // 模拟注册请求
    function simulateRegister(data) {
        // 显示加载状态
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '注册中...';
        
        // 模拟网络请求延迟
        setTimeout(() => {
            // 模拟注册成功
            // 保存用户信息到本地存储
            const user = {
                id: Date.now(),
                studentId: data.studentId,
                name: data.name,
                nickname: data.nickname,
                email: data.email,
                avatar: data.avatar,
                interestTags: data.interestTags,
                token: 'simulated_token_' + Date.now()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // 显示成功消息
            showMessage('注册成功，正在跳转...', 'success');
            
            // 跳转到首页
            setTimeout(() => {
                window.location.href = 'index.html';
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