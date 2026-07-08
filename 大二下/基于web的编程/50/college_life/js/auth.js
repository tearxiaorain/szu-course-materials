// 用户认证模块

/**
 * 认证管理器
 */
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    
    /**
     * 初始化认证状态
     */
    init() {
        // 检查是否有已登录的用户
        const currentUserId = storage.get('currentUser');
        if (currentUserId) {
            const user = userStorage.getUserById(currentUserId);
            if (user && user.isActive) {
                this.currentUser = user;
                this.updateLastLoginDate();
                this.updateUI();
            } else {
                // 清除无效的登录状态
                storage.remove('currentUser');
            }
        }
        
        this.bindEvents();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 登录按钮
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal('login'));
        }
        
        // 注册按钮
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showAuthModal('register'));
        }
        
        // 退出按钮
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // 模态框相关
        const modal = document.getElementById('auth-modal');
        const modalClose = document.getElementById('modal-close');
        const authSwitchLink = document.getElementById('auth-switch-link');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideAuthModal());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAuthModal();
                }
            });
        }
        
        if (authSwitchLink) {
            authSwitchLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchAuthMode();
            });
        }
        
        // 表单提交
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // 注册表单增强功能
        this.bindRegisterEnhancements();

        // 登录表单增强功能
        this.bindLoginEnhancements();
    }

    /**
     * 绑定注册表单增强功能
     */
    bindRegisterEnhancements() {
        // 头像上传
        const avatarInput = document.getElementById('register-avatar');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => {
                this.handleAvatarUpload(e);
            });
        }

        // 兴趣标签选择
        const availableTags = document.getElementById('available-tags');
        if (availableTags) {
            availableTags.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-option')) {
                    this.toggleInterestTag(e.target);
                }
            });
        }
    }

    /**
     * 绑定登录表单增强功能
     */
    bindLoginEnhancements() {
        // 密码可见性切换
        const passwordToggle = document.getElementById('login-password-toggle');
        if (passwordToggle) {
            passwordToggle.addEventListener('click', () => {
                this.togglePasswordVisibility('login-password', 'login-password-toggle');
            });
        }

        // 忘记密码链接
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }

        // 记住我功能 - 页面加载时检查
        this.checkRememberMe();
    }

    /**
     * 切换密码可见性
     * @param {string} passwordInputId 密码输入框ID
     * @param {string} toggleButtonId 切换按钮ID
     */
    togglePasswordVisibility(passwordInputId, toggleButtonId) {
        const passwordInput = document.getElementById(passwordInputId);
        const toggleButton = document.getElementById(toggleButtonId);

        if (!passwordInput || !toggleButton) return;

        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';

        const icon = toggleButton.querySelector('i');
        if (icon) {
            icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        }
    }

    /**
     * 显示忘记密码模态框
     */
    showForgotPasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal forgot-password-modal';
        modal.id = 'forgot-password-modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>重置密码</h3>
                    <button class="modal-close" onclick="document.getElementById('forgot-password-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p class="forgot-password-desc">请输入您的用户名，我们将为您重置密码。</p>
                    <form id="forgot-password-form">
                        <div class="form-group">
                            <label class="form-label">用户名</label>
                            <input type="text" class="form-control" id="forgot-username" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('forgot-password-modal').remove()">
                                取消
                            </button>
                            <button type="submit" class="btn btn-primary">
                                重置密码
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 显示模态框
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 绑定表单提交事件
        const form = document.getElementById('forgot-password-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    }

    /**
     * 处理忘记密码
     */
    handleForgotPassword() {
        const username = document.getElementById('forgot-username').value.trim();

        if (!username) {
            showToast('请输入用户名', 'error');
            return;
        }

        const user = userStorage.getUserByUsername(username);
        if (!user) {
            showToast('用户不存在', 'error');
            return;
        }

        // 生成新密码（实际应用中应该发送邮件）
        const newPassword = this.generateRandomPassword();

        // 更新用户密码
        userStorage.updateUser(user.id, { password: newPassword });

        // 显示新密码（实际应用中不应该这样做）
        const modal = document.getElementById('forgot-password-modal');
        if (modal) {
            modal.querySelector('.modal-body').innerHTML = `
                <div class="password-reset-success">
                    <i class="fas fa-check-circle"></i>
                    <h4>密码重置成功</h4>
                    <p>您的新密码是：</p>
                    <div class="new-password">${newPassword}</div>
                    <p class="password-note">请妥善保管您的新密码，建议登录后立即修改。</p>
                    <button class="btn btn-primary" onclick="document.getElementById('forgot-password-modal').remove()">
                        确定
                    </button>
                </div>
            `;
        }

        showToast('密码重置成功', 'success');
    }

    /**
     * 生成随机密码
     * @returns {string}
     */
    generateRandomPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * 检查记住我功能
     */
    checkRememberMe() {
        const rememberedUser = storage.get('rememberedUser');
        if (rememberedUser) {
            const usernameInput = document.getElementById('login-username');
            const rememberCheckbox = document.getElementById('remember-me');

            if (usernameInput) {
                usernameInput.value = rememberedUser.username;
            }
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }
    }

    /**
     * 处理头像上传
     * @param {Event} event 文件选择事件
     */
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            showToast('请选择图片文件', 'error');
            return;
        }

        // 验证文件大小（限制为2MB）
        if (file.size > 2 * 1024 * 1024) {
            showToast('图片大小不能超过2MB', 'error');
            return;
        }

        // 读取文件并显示预览
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarImg = document.getElementById('register-avatar-img');
            if (avatarImg) {
                avatarImg.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }

    /**
     * 切换兴趣标签选择
     * @param {HTMLElement} tagElement 标签元素
     */
    toggleInterestTag(tagElement) {
        const tag = tagElement.dataset.tag;
        const selectedTagsContainer = document.getElementById('selected-tags');
        const maxTags = 5;

        if (tagElement.classList.contains('selected')) {
            // 取消选择
            tagElement.classList.remove('selected');
            this.removeSelectedTag(tag);
        } else {
            // 检查是否已达到最大数量
            const selectedTags = selectedTagsContainer.querySelectorAll('.selected-tag');
            if (selectedTags.length >= maxTags) {
                showToast(`最多只能选择${maxTags}个兴趣标签`, 'warning');
                return;
            }

            // 添加选择
            tagElement.classList.add('selected');
            this.addSelectedTag(tag);
        }
    }

    /**
     * 添加已选择的标签
     * @param {string} tag 标签名
     */
    addSelectedTag(tag) {
        const selectedTagsContainer = document.getElementById('selected-tags');
        const helpText = selectedTagsContainer.querySelector('.form-help');

        if (helpText) {
            helpText.style.display = 'none';
        }

        const tagElement = document.createElement('span');
        tagElement.className = 'selected-tag';
        tagElement.dataset.tag = tag;
        tagElement.innerHTML = `
            ${tag}
            <button type="button" class="remove-tag" onclick="authManager.removeSelectedTag('${tag}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        selectedTagsContainer.appendChild(tagElement);
    }

    /**
     * 移除已选择的标签
     * @param {string} tag 标签名
     */
    removeSelectedTag(tag) {
        const selectedTagsContainer = document.getElementById('selected-tags');
        const tagElement = selectedTagsContainer.querySelector(`[data-tag="${tag}"]`);

        if (tagElement) {
            tagElement.remove();
        }

        // 取消对应的可选标签的选中状态
        const availableTag = document.querySelector(`#available-tags [data-tag="${tag}"]`);
        if (availableTag) {
            availableTag.classList.remove('selected');
        }

        // 如果没有选中的标签，显示帮助文本
        const selectedTags = selectedTagsContainer.querySelectorAll('.selected-tag');
        const helpText = selectedTagsContainer.querySelector('.form-help');
        if (selectedTags.length === 0 && helpText) {
            helpText.style.display = 'block';
        }
    }
    
    /**
     * 显示认证模态框
     * @param {string} mode 模式（login或register）
     */
    showAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        const modalTitle = document.getElementById('modal-title');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authSwitchText = document.getElementById('auth-switch-text');
        const authSwitchLink = document.getElementById('auth-switch-link');
        
        if (mode === 'login') {
            modalTitle.textContent = '登录';
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            authSwitchText.textContent = '还没有账号？';
            authSwitchLink.textContent = '立即注册';
        } else {
            modalTitle.textContent = '注册';
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            authSwitchText.textContent = '已有账号？';
            authSwitchLink.textContent = '立即登录';
        }
        
        modal.classList.add('active');
        
        // 清空表单
        this.clearForms();
    }
    
    /**
     * 隐藏认证模态框
     */
    hideAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.remove('active');
        this.clearForms();
    }
    
    /**
     * 切换认证模式
     */
    switchAuthMode() {
        const loginForm = document.getElementById('login-form');
        const isLoginMode = !loginForm.classList.contains('hidden');
        
        if (isLoginMode) {
            this.showAuthModal('register');
        } else {
            this.showAuthModal('login');
        }
    }
    
    /**
     * 清空表单
     */
    clearForms() {
        const forms = ['login-form', 'register-form'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.reset();
                // 清除错误状态
                const inputs = form.querySelectorAll('.form-control');
                inputs.forEach(input => {
                    input.classList.remove('error');
                });
            }
        });
    }
    
    /**
     * 处理登录
     */
    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // 验证输入
        if (!username || !password) {
            showToast('请填写完整的登录信息', 'error');
            return;
        }

        // 查找用户
        const user = userStorage.getUserByUsername(username);
        if (!user) {
            showToast('用户名不存在', 'error');
            this.highlightError('login-username');
            return;
        }

        // 验证密码
        if (user.password !== password) {
            showToast('密码错误', 'error');
            this.highlightError('login-password');
            return;
        }

        // 检查用户状态
        if (!user.isActive) {
            showToast('账号已被禁用', 'error');
            return;
        }

        // 处理记住我功能
        if (rememberMe) {
            storage.set('rememberedUser', { username: user.username });
        } else {
            storage.remove('rememberedUser');
        }

        // 登录成功
        this.currentUser = user;
        storage.set('currentUser', user.id);
        this.updateLastLoginDate();
        this.updateUI();
        this.hideAuthModal();

        showToast(`欢迎回来，${user.nickname}！`, 'success');

        // 跳转到个人资料页面
        setTimeout(() => {
            if (typeof app !== 'undefined' && app.showPage) {
                app.showPage('profile');
            }
        }, 1000);

        // 触发登录事件
        this.dispatchAuthEvent('login', user);
    }
    
    /**
     * 处理注册
     */
    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const nickname = document.getElementById('register-nickname').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const bio = document.getElementById('register-bio').value.trim();

        // 获取头像
        const avatarImg = document.getElementById('register-avatar-img');
        const avatar = avatarImg && avatarImg.src !== 'https://via.placeholder.com/80x80?text=头像' ?
            avatarImg.src : null;

        // 获取选中的兴趣标签
        const selectedTags = Array.from(document.querySelectorAll('#selected-tags .selected-tag'))
            .map(tag => tag.dataset.tag);

        // 验证输入
        if (!username || !nickname || !password || !confirmPassword) {
            showToast('请填写完整的注册信息', 'error');
            return;
        }

        // 验证用户名格式
        if (!validateUsername(username)) {
            showToast('用户名只能包含字母、数字和下划线，长度3-20位', 'error');
            this.highlightError('register-username');
            return;
        }

        // 验证昵称长度
        if (nickname.length > 20) {
            showToast('昵称不能超过20个字符', 'error');
            this.highlightError('register-nickname');
            return;
        }

        // 验证个人简介长度
        if (bio.length > 200) {
            showToast('个人简介不能超过200个字符', 'error');
            this.highlightError('register-bio');
            return;
        }

        // 验证密码
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            showToast(passwordValidation.message, 'error');
            this.highlightError('register-password');
            return;
        }

        // 验证密码确认
        if (password !== confirmPassword) {
            showToast('两次输入的密码不一致', 'error');
            this.highlightError('register-confirm-password');
            return;
        }

        // 检查用户名是否已存在
        if (userStorage.getUserByUsername(username)) {
            showToast('用户名已存在', 'error');
            this.highlightError('register-username');
            return;
        }

        // 创建用户
        const userData = {
            username,
            nickname,
            password,
            bio: bio || '',
            avatar: avatar || getRandomAvatar(generateId()),
            interests: selectedTags
        };

        const user = userStorage.createUser(userData);
        if (!user) {
            showToast('注册失败，请稍后重试', 'error');
            return;
        }

        // 自动登录
        this.currentUser = user;
        storage.set('currentUser', user.id);
        this.updateUI();
        this.hideAuthModal();

        showToast(`注册成功，欢迎加入校园生活！`, 'success');

        // 清空注册表单
        this.resetRegisterForm();

        // 触发注册事件
        this.dispatchAuthEvent('register', user);
    }

    /**
     * 重置注册表单
     */
    resetRegisterForm() {
        // 重置表单字段
        const form = document.getElementById('register-form');
        if (form) {
            form.reset();
        }

        // 重置头像预览
        const avatarImg = document.getElementById('register-avatar-img');
        if (avatarImg) {
            avatarImg.src = 'https://via.placeholder.com/80x80?text=头像';
        }

        // 重置兴趣标签
        const selectedTags = document.querySelectorAll('#selected-tags .selected-tag');
        selectedTags.forEach(tag => tag.remove());

        const availableTags = document.querySelectorAll('#available-tags .tag-option');
        availableTags.forEach(tag => tag.classList.remove('selected'));

        const helpText = document.querySelector('#selected-tags .form-help');
        if (helpText) {
            helpText.style.display = 'block';
        }
    }
    
    /**
     * 退出登录
     */
    logout() {
        if (!this.currentUser) return;
        
        const user = this.currentUser;
        this.currentUser = null;
        storage.remove('currentUser');
        this.updateUI();
        
        showToast('已退出登录', 'success');
        
        // 触发退出事件
        this.dispatchAuthEvent('logout', user);
        
        // 跳转到首页
        if (typeof app !== 'undefined' && app.showPage) {
            app.showPage('home');
        }
    }
    
    /**
     * 更新最后登录时间
     */
    updateLastLoginDate() {
        if (this.currentUser) {
            userStorage.updateUser(this.currentUser.id, {
                lastLoginDate: new Date().toISOString()
            });
        }
    }
    
    /**
     * 更新UI状态
     */
    updateUI() {
        const navAuth = document.getElementById('nav-auth');
        const navUser = document.getElementById('nav-user');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (this.currentUser) {
            // 显示用户信息
            if (navAuth) navAuth.classList.add('hidden');
            if (navUser) navUser.classList.remove('hidden');
            
            if (userAvatar) userAvatar.src = this.currentUser.avatar;
            if (userName) userName.textContent = this.currentUser.nickname;
        } else {
            // 显示登录注册按钮
            if (navAuth) navAuth.classList.remove('hidden');
            if (navUser) navUser.classList.add('hidden');
        }
    }
    
    /**
     * 高亮错误输入框
     * @param {string} inputId 输入框ID
     */
    highlightError(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.classList.add('error');
            setTimeout(() => {
                input.classList.remove('error');
            }, 3000);
        }
    }
    
    /**
     * 触发认证事件
     * @param {string} type 事件类型
     * @param {object} user 用户对象
     */
    dispatchAuthEvent(type, user) {
        const event = new CustomEvent('auth', {
            detail: { type, user }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 检查是否已登录
     * @returns {boolean}
     */
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    /**
     * 获取当前用户
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 更新当前用户信息
     * @param {object} userData 用户数据
     */
    updateCurrentUser(userData) {
        if (this.currentUser && userData.id === this.currentUser.id) {
            this.currentUser = { ...this.currentUser, ...userData };
            // 更新localStorage中的用户信息
            storage.set('currentUser', this.currentUser);
        }
    }
    
    /**
     * 检查权限
     * @param {string} permission 权限名称
     * @returns {boolean}
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        const permissions = {
            'post.create': true,
            'post.edit': (postAuthorId) => postAuthorId === this.currentUser.id,
            'post.delete': (postAuthorId) => postAuthorId === this.currentUser.id || this.currentUser.role === 'admin',
            'comment.create': true,
            'comment.delete': (commentAuthorId) => commentAuthorId === this.currentUser.id || this.currentUser.role === 'admin',
            'user.follow': true,
            'admin.panel': this.currentUser.role === 'admin'
        };
        
        return permissions[permission] || false;
    }
}

// 创建全局认证管理器实例
const authManager = new AuthManager();

// 导出到全局作用域
window.authManager = authManager;
window.AuthManager = AuthManager;
