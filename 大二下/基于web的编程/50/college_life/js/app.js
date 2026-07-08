// 主应用程序

/**
 * 应用程序主类
 */
class App {
    constructor() {
        this.currentPage = 'home';
        this.isInitialized = false;
        this.init();
    }
    
    /**
     * 初始化应用程序
     */
    init() {
        if (this.isInitialized) return;
        
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeApp();
            });
        } else {
            this.initializeApp();
        }
    }
    
    /**
     * 初始化应用程序核心功能
     */
    initializeApp() {
        try {
            this.bindEvents();
            this.initializeModules();
            this.setupRouting();
            this.loadInitialData();
            this.isInitialized = true;
            
            console.log('校园生活交友平台初始化完成');
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            showToast('应用程序初始化失败', 'error');
        }
    }
    
    /**
     * 绑定全局事件
     */
    bindEvents() {
        // 导航菜单点击事件
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });
        
        // 移动端导航切换
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, 250));
        
        // 监听认证状态变化
        document.addEventListener('auth', (e) => {
            this.handleAuthChange(e.detail);
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // 全局键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // 全局错误处理
        window.addEventListener('error', (e) => {
            console.error('全局错误:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的Promise拒绝:', e.reason);
        });

        // 个人中心标签页切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchProfileTab(tabName);
            });
        });

        // 编辑资料按钮
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.showEditProfileModal();
            });
        }

        // 头像编辑按钮
        const avatarEditBtn = document.getElementById('avatar-edit-btn');
        if (avatarEditBtn) {
            avatarEditBtn.addEventListener('click', () => {
                this.showAvatarUploadModal();
            });
        }

        // 关注/粉丝统计点击事件
        const followingCount = document.getElementById('following-count');
        const followersCount = document.getElementById('followers-count');

        if (followingCount) {
            followingCount.parentElement.addEventListener('click', () => {
                this.showFollowListModal('following');
            });
            followingCount.parentElement.style.cursor = 'pointer';
        }

        if (followersCount) {
            followersCount.parentElement.addEventListener('click', () => {
                this.showFollowListModal('followers');
            });
            followersCount.parentElement.style.cursor = 'pointer';
        }
    }
    
    /**
     * 初始化各个模块
     */
    initializeModules() {
        // 模块已经在各自的文件中初始化
        // 这里可以进行模块间的协调配置
        
        // 设置模块间的通信
        this.setupModuleCommunication();
    }
    
    /**
     * 设置模块间通信
     */
    setupModuleCommunication() {
        // 监听动态相关事件
        document.addEventListener('postCreated', (e) => {
            // 动态创建后刷新首页
            if (this.currentPage === 'home') {
                postManager.loadPosts();
            }
        });
        
        // 监听用户相关事件
        document.addEventListener('userUpdated', (e) => {
            // 用户信息更新后刷新相关UI
            this.updateUserRelatedUI();
        });
    }
    
    /**
     * 设置路由
     */
    setupRouting() {
        // 简单的客户端路由
        const hash = window.location.hash.slice(1);
        if (hash && ['home', 'publish', 'search', 'profile', 'year-review'].includes(hash)) {
            this.showPage(hash);
        } else {
            this.showPage('home');
        }

        // 监听hash变化
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.slice(1);
            if (newHash && ['home', 'publish', 'search', 'profile', 'year-review'].includes(newHash)) {
                this.showPage(newHash);
            }
        });
    }
    
    /**
     * 加载初始数据
     */
    loadInitialData() {
        try {
            // 延迟加载，确保所有模块都已初始化
            setTimeout(() => {
                // 加载首页数据
                if (typeof postManager !== 'undefined' && postManager && typeof postManager.loadPosts === 'function') {
                    postManager.loadPosts();
                } else {
                    console.warn('postManager 未正确初始化，稍后重试');
                    // 重试机制
                    setTimeout(() => {
                        if (typeof postManager !== 'undefined' && postManager && typeof postManager.loadPosts === 'function') {
                            postManager.loadPosts();
                        }
                    }, 1000);
                }

                // 加载推荐用户
                if (typeof socialManager !== 'undefined' && socialManager && typeof socialManager.loadRecommendedUsers === 'function') {
                    socialManager.loadRecommendedUsers();
                } else {
                    console.warn('socialManager 未正确初始化');
                }

                // 初始化签到状态
                if (typeof socialManager !== 'undefined' && socialManager && typeof socialManager.updateCheckinUI === 'function') {
                    socialManager.updateCheckinUI();
                } else {
                    console.warn('socialManager 签到功能未正确初始化');
                }
            }, 500);
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    }
    
    /**
     * 显示指定页面
     * @param {string} pageName 页面名称
     */
    showPage(pageName) {
        // 检查页面权限
        if (!this.checkPagePermission(pageName)) {
            return;
        }
        
        // 隐藏所有页面
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // 显示目标页面
        const targetPage = document.getElementById(`${pageName}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            
            // 更新导航状态
            this.updateNavigation(pageName);
            
            // 更新URL hash
            window.location.hash = pageName;
            
            // 页面特定的初始化
            this.initializePage(pageName);
            
            // 滚动到顶部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    /**
     * 检查页面访问权限
     * @param {string} pageName 页面名称
     * @returns {boolean}
     */
    checkPagePermission(pageName) {
        const currentUser = authManager.getCurrentUser();
        
        // 需要登录的页面
        const loginRequiredPages = ['publish', 'profile', 'year-review'];

        if (loginRequiredPages.includes(pageName) && !currentUser) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return false;
        }
        
        return true;
    }
    
    /**
     * 更新导航状态
     * @param {string} activePage 当前活跃页面
     */
    updateNavigation(activePage) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === activePage);
        });
    }
    
    /**
     * 初始化特定页面
     * @param {string} pageName 页面名称
     */
    initializePage(pageName) {
        switch (pageName) {
            case 'home':
                // 刷新动态列表
                if (postManager) {
                    postManager.currentPage = 1;
                    postManager.loadPosts();
                }
                break;
                
            case 'publish':
                // 清空发布表单（如果需要）
                break;
                
            case 'search':
                // 聚焦搜索框
                const searchInput = document.getElementById('search-input');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
                break;
                
            case 'profile':
                // 加载用户资料
                this.loadUserProfile();
                break;

            case 'year-review':
                // 年度回顾页面不需要特殊初始化，由yearReviewManager处理
                break;
        }
    }
    
    /**
     * 加载用户资料
     */
    loadUserProfile() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;
        
        // 更新用户信息显示
        const profileAvatar = document.getElementById('profile-avatar');
        const profileName = document.getElementById('profile-name');
        const profileUsername = document.getElementById('profile-username');
        const profileBio = document.getElementById('profile-bio');
        
        if (profileAvatar) profileAvatar.src = currentUser.avatar;
        if (profileName) profileName.textContent = currentUser.nickname;
        if (profileUsername) profileUsername.textContent = currentUser.username;
        if (profileBio) profileBio.textContent = currentUser.bio;
        
        // 更新统计数据
        const stats = socialManager.getUserStats(currentUser.id);
        if (stats) {
            const postsCount = document.getElementById('posts-count');
            const followingCount = document.getElementById('following-count');
            const followersCount = document.getElementById('followers-count');
            
            if (postsCount) postsCount.textContent = formatNumber(stats.postsCount);
            if (followingCount) followingCount.textContent = formatNumber(stats.followingCount);
            if (followersCount) followersCount.textContent = formatNumber(stats.followersCount);
        }
        
        // 加载用户动态（默认显示动态标签页）
        this.switchProfileTab('posts');
    }

    /**
     * 切换个人中心标签页
     * @param {string} tabName 标签页名称
     */
    switchProfileTab(tabName) {
        // 更新标签按钮状态
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新标签内容显示
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // 加载对应标签页的内容
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        switch (tabName) {
            case 'posts':
                this.loadUserPosts(currentUser.id);
                break;
            case 'likes':
                this.loadUserLikedPosts();
                break;
            case 'drafts':
                this.loadUserDrafts();
                break;
        }
    }
    
    /**
     * 加载用户动态
     * @param {string} userId 用户ID
     */
    loadUserPosts(userId) {
        const userPosts = postManager.getUserPosts(userId);
        const userPostsContainer = document.getElementById('user-posts');
        
        if (!userPostsContainer) return;
        
        if (userPosts.length === 0) {
            userPostsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-edit"></i>
                    <p>还没有发布动态</p>
                    <button class="btn btn-primary" onclick="app.showPage('publish')">
                        发布第一条动态
                    </button>
                </div>
            `;
        } else {
            userPostsContainer.innerHTML = '';
            userPosts.forEach(post => {
                const postElement = postManager.createPostElement(post);
                userPostsContainer.appendChild(postElement);
            });
        }
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        // 响应式处理
        const isMobileView = window.innerWidth <= 767;
        document.body.classList.toggle('mobile-view', isMobileView);
        
        // 关闭移动端菜单
        if (!isMobileView) {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        }
    }
    
    /**
     * 处理认证状态变化
     * @param {object} authData 认证数据
     */
    handleAuthChange(authData) {
        const { type, user } = authData;
        
        switch (type) {
            case 'login':
                // 登录后刷新相关数据
                this.loadInitialData();
                break;
                
            case 'logout':
                // 退出后跳转到首页
                this.showPage('home');
                break;
        }
    }
    
    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (!document.hidden) {
            // 页面变为可见时，刷新数据
            if (this.currentPage === 'home' && postManager) {
                postManager.loadPosts();
            }
        }
    }
    
    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} e 键盘事件
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: 聚焦搜索
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.showPage('search');
        }
        
        // Ctrl/Cmd + N: 新建动态
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (authManager.isLoggedIn()) {
                this.showPage('publish');
            }
        }
        
        // ESC: 关闭模态框
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                activeModal.classList.remove('active');
            }
        }
    }
    
    /**
     * 更新用户相关UI
     */
    updateUserRelatedUI() {
        // 更新导航栏用户信息
        if (authManager) {
            authManager.updateUI();
        }
        
        // 更新个人中心信息
        if (this.currentPage === 'profile') {
            this.loadUserProfile();
        }
    }
    
    /**
     * 获取当前页面
     * @returns {string}
     */
    getCurrentPage() {
        return this.currentPage;
    }
    
    /**
     * 检查应用是否已初始化
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * 加载标签页内容
     * @param {string} tabName 标签页名称
     */
    loadTabContent(tabName) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        switch (tabName) {
            case 'posts':
                this.loadUserPosts(currentUser.id);
                break;

            case 'likes':
                this.loadUserLikedPosts();
                break;

            case 'drafts':
                this.loadUserDrafts(currentUser.id);
                break;
        }
    }



    /**
     * 加载用户草稿
     * @param {string} userId 用户ID
     */
    loadUserDrafts(userId) {
        const draftsContainer = document.getElementById('draft-posts');
        if (!draftsContainer) return;

        const drafts = postManager.getUserDrafts(userId);

        if (drafts.length === 0) {
            draftsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>没有保存的草稿</p>
                </div>
            `;
        } else {
            draftsContainer.innerHTML = '';
            drafts.forEach(draft => {
                const draftElement = this.createDraftElement(draft);
                draftsContainer.appendChild(draftElement);
            });
        }
    }

    /**
     * 创建草稿元素
     * @param {object} draft 草稿数据
     * @returns {HTMLElement}
     */
    createDraftElement(draft) {
        const draftElement = document.createElement('div');
        draftElement.className = 'draft-item';

        draftElement.innerHTML = `
            <div class="draft-content">
                <div class="draft-text">${truncateText(draft.content, 100)}</div>
                <div class="draft-meta">
                    <span class="draft-time">保存于 ${formatTime(draft.updatedAt)}</span>
                    <span class="draft-visibility">${draft.visibility === 'public' ? '公开' : '私密'}</span>
                </div>
            </div>
            <div class="draft-actions">
                <button class="btn btn-outline btn-sm" onclick="postManager.loadDraft('${draft.id}')">
                    编辑
                </button>
                <button class="btn btn-outline btn-sm" onclick="postManager.deleteDraft('${draft.id}')">
                    删除
                </button>
            </div>
        `;

        return draftElement;
    }

    /**
     * 显示头像上传模态框
     */
    showAvatarUploadModal() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'avatar-upload-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>更换头像</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="avatar-upload-section">
                        <div class="current-avatar">
                            <img src="${currentUser.avatar || getRandomAvatar(currentUser.id)}" alt="当前头像" id="current-avatar-preview">
                            <p>当前头像</p>
                        </div>

                        <div class="avatar-upload-form">
                            <input type="file" id="profile-avatar-input" accept="image/*" style="display: none;">
                            <div class="upload-area" onclick="document.getElementById('profile-avatar-input').click()">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>点击选择新头像</p>
                                <small>支持 JPG、PNG、GIF 格式，建议尺寸 200x200，最大2MB</small>
                            </div>

                            <div class="avatar-preview-section" id="new-avatar-preview" style="display: none;">
                                <img src="" alt="新头像预览" id="new-avatar-img">
                                <p>新头像预览</p>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">
                            取消
                        </button>
                        <button type="button" class="btn btn-primary" id="save-avatar-btn" disabled>
                            保存头像
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定文件选择事件
        const avatarInput = document.getElementById('profile-avatar-input');
        const saveBtn = document.getElementById('save-avatar-btn');
        let selectedAvatarData = null;

        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
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
                selectedAvatarData = e.target.result;
                const newAvatarImg = document.getElementById('new-avatar-img');
                const previewSection = document.getElementById('new-avatar-preview');

                if (newAvatarImg && previewSection) {
                    newAvatarImg.src = selectedAvatarData;
                    previewSection.style.display = 'block';
                    saveBtn.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        });

        // 绑定保存按钮事件
        saveBtn.addEventListener('click', () => {
            if (selectedAvatarData) {
                this.saveNewAvatar(selectedAvatarData);
            }
        });
    }

    /**
     * 保存新头像
     * @param {string} avatarData Base64编码的图片数据
     */
    saveNewAvatar(avatarData) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        // 更新用户头像
        const updatedUser = userStorage.updateUser(currentUser.id, { avatar: avatarData });
        if (updatedUser) {
            // 更新认证管理器中的用户信息
            authManager.updateCurrentUser(updatedUser);

            // 更新页面显示
            this.updateProfileDisplay();

            // 关闭模态框
            document.getElementById('avatar-upload-modal').remove();

            showToast('头像更新成功', 'success');
        } else {
            showToast('头像更新失败，请重试', 'error');
        }
    }

    /**
     * 显示编辑资料模态框
     */
    showEditProfileModal() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }

        // 创建编辑资料模态框
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'edit-profile-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑资料</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form class="edit-profile-form" id="edit-profile-form">
                        <div class="form-group">
                            <label class="form-label">昵称</label>
                            <input type="text" class="form-control" id="edit-nickname"
                                   value="${currentUser.nickname}" required maxlength="20">
                            <small class="form-help">昵称最多20个字符</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">头像</label>
                            <div class="avatar-upload-inline">
                                <input type="file" id="edit-avatar-input" accept="image/*" style="display: none;">
                                <div class="avatar-current">
                                    <img src="${currentUser.avatar || getRandomAvatar(currentUser.id)}" alt="当前头像" id="edit-avatar-preview">
                                    <button type="button" class="avatar-change-btn" onclick="document.getElementById('edit-avatar-input').click()">
                                        <i class="fas fa-camera"></i>
                                        更换头像
                                    </button>
                                </div>
                            </div>
                            <small class="form-help">支持 JPG、PNG、GIF 格式，建议尺寸 200x200，最大2MB</small>
                        </div>

                        <div class="form-group">
                            <label class="form-label">个人简介</label>
                            <textarea class="form-control" id="edit-bio" rows="4"
                                      maxlength="200" placeholder="介绍一下自己吧...">${currentUser.bio || ''}</textarea>
                            <div class="char-count">
                                <span id="bio-char-count">${(currentUser.bio || '').length}</span>/200
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">学校</label>
                            <input type="text" class="form-control" id="edit-school"
                                   value="${currentUser.school || ''}" maxlength="50" placeholder="请输入学校名称">
                        </div>

                        <div class="form-group">
                            <label class="form-label">专业</label>
                            <input type="text" class="form-control" id="edit-major"
                                   value="${currentUser.major || ''}" maxlength="50" placeholder="请输入专业名称">
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">
                                取消
                            </button>
                            <button type="submit" class="btn btn-primary">
                                保存修改
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定表单提交事件
        const form = document.getElementById('edit-profile-form');
        let selectedAvatarData = null;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditProfile(selectedAvatarData);
        });

        // 绑定字符计数
        const bioTextarea = document.getElementById('edit-bio');
        const bioCharCount = document.getElementById('bio-char-count');
        bioTextarea.addEventListener('input', () => {
            bioCharCount.textContent = bioTextarea.value.length;
        });

        // 头像文件选择
        const avatarInput = document.getElementById('edit-avatar-input');
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
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
                selectedAvatarData = e.target.result;
                const avatarPreview = document.getElementById('edit-avatar-preview');
                if (avatarPreview) {
                    avatarPreview.src = selectedAvatarData;
                }
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * 处理编辑资料表单提交
     * @param {string} avatarData 新头像数据（可选）
     */
    handleEditProfile(avatarData = null) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        const nickname = document.getElementById('edit-nickname').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        const school = document.getElementById('edit-school').value.trim();
        const major = document.getElementById('edit-major').value.trim();

        // 验证输入
        if (!nickname) {
            showToast('昵称不能为空', 'error');
            return;
        }

        if (nickname.length > 20) {
            showToast('昵称不能超过20个字符', 'error');
            return;
        }

        if (bio.length > 200) {
            showToast('个人简介不能超过200个字符', 'error');
            return;
        }

        // 更新用户信息
        const updateData = {
            nickname,
            bio,
            school,
            major
        };

        // 如果提供了新头像数据，更新头像
        if (avatarData) {
            updateData.avatar = avatarData;
        }

        const updatedUser = userStorage.updateUser(currentUser.id, updateData);
        if (updatedUser) {
            // 更新认证管理器中的用户信息
            authManager.updateCurrentUser(updatedUser);

            // 更新页面显示
            this.updateProfileDisplay();

            // 关闭模态框
            document.getElementById('edit-profile-modal').remove();

            showToast('资料更新成功', 'success');
        } else {
            showToast('更新失败，请重试', 'error');
        }
    }

    /**
     * 更新个人资料显示
     */
    updateProfileDisplay() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        // 更新导航栏用户信息
        const navUserName = document.getElementById('user-name');
        const navUserAvatar = document.getElementById('user-avatar');
        if (navUserName) navUserName.textContent = currentUser.nickname;
        if (navUserAvatar) navUserAvatar.src = currentUser.avatar || getRandomAvatar(currentUser.id);

        // 更新个人中心页面信息
        const profileName = document.getElementById('profile-name');
        const profileUsername = document.getElementById('profile-username');
        const profileBio = document.getElementById('profile-bio');
        const profileAvatar = document.getElementById('profile-avatar');

        if (profileName) profileName.textContent = currentUser.nickname;
        if (profileUsername) profileUsername.textContent = currentUser.username;
        if (profileBio) profileBio.textContent = currentUser.bio || '这个人很懒，什么都没有留下...';
        if (profileAvatar) profileAvatar.src = currentUser.avatar || getRandomAvatar(currentUser.id);
    }

    /**
     * 加载用户点赞的动态
     */
    loadUserLikedPosts() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }

        const likedPostsContainer = document.getElementById('liked-posts');
        if (!likedPostsContainer) return;

        try {
            // 获取用户点赞的动态ID列表
            const userLikes = likeStorage.getUserLikes(currentUser.id, 'post');

            if (userLikes.length === 0) {
                likedPostsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-heart"></i>
                        <p>还没有点赞任何动态</p>
                    </div>
                `;
                return;
            }

            // 获取点赞的动态详情
            const likedPosts = [];
            userLikes.forEach(like => {
                const post = postStorage.getPost(like.targetId);
                if (post) {
                    likedPosts.push(post);
                }
            });

            // 按点赞时间排序（最新的在前）
            likedPosts.sort((a, b) => {
                const likeA = userLikes.find(like => like.targetId === a.id);
                const likeB = userLikes.find(like => like.targetId === b.id);
                return new Date(likeB.createdAt) - new Date(likeA.createdAt);
            });

            // 渲染动态列表
            likedPostsContainer.innerHTML = '';
            likedPosts.forEach(post => {
                const postElement = postManager.createPostElement(post);
                likedPostsContainer.appendChild(postElement);
            });

        } catch (error) {
            console.error('加载点赞动态失败:', error);
            likedPostsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载失败，请刷新重试</p>
                </div>
            `;
        }
    }

    /**
     * 加载用户草稿
     */
    loadUserDrafts() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }

        const draftsContainer = document.getElementById('draft-posts');
        if (!draftsContainer) return;

        try {
            const drafts = postManager.getUserDrafts(currentUser.id);

            if (drafts.length === 0) {
                draftsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <p>还没有保存任何草稿</p>
                    </div>
                `;
                return;
            }

            // 按创建时间排序（最新的在前）
            drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // 渲染草稿列表
            draftsContainer.innerHTML = '';
            drafts.forEach(draft => {
                const draftElement = this.createDraftElement(draft);
                draftsContainer.appendChild(draftElement);
            });

        } catch (error) {
            console.error('加载草稿失败:', error);
            draftsContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>加载失败，请刷新重试</p>
                </div>
            `;
        }
    }

    /**
     * 创建草稿元素
     * @param {object} draft 草稿数据
     * @returns {HTMLElement}
     */
    createDraftElement(draft) {
        const draftElement = document.createElement('div');
        draftElement.className = 'draft-item';
        draftElement.innerHTML = `
            <div class="draft-content">
                <div class="draft-text">${truncateText(draft.content, 100)}</div>
                <div class="draft-meta">
                    <span class="draft-time">保存于 ${formatTime(draft.createdAt)}</span>
                    <span class="draft-visibility">
                        <i class="fas fa-${draft.visibility === 'public' ? 'globe' : 'lock'}"></i>
                        ${draft.visibility === 'public' ? '公开' : '私密'}
                    </span>
                </div>
            </div>
            <div class="draft-actions">
                <button class="btn btn-sm btn-outline" onclick="postManager.loadDraft('${draft.id}')">
                    <i class="fas fa-edit"></i>
                    编辑
                </button>
                <button class="btn btn-sm btn-primary" onclick="app.publishDraft('${draft.id}')">
                    <i class="fas fa-paper-plane"></i>
                    发布
                </button>
                <button class="btn btn-sm btn-danger" onclick="app.deleteDraft('${draft.id}')">
                    <i class="fas fa-trash"></i>
                    删除
                </button>
            </div>
        `;
        return draftElement;
    }

    /**
     * 发布草稿
     * @param {string} draftId 草稿ID
     */
    publishDraft(draftId) {
        const drafts = storage.get('drafts', {});
        const draft = drafts[draftId];

        if (!draft) {
            showToast('草稿不存在', 'error');
            return;
        }

        const currentUser = authManager.getCurrentUser();
        if (!currentUser || currentUser.id !== draft.authorId) {
            showToast('没有权限发布此草稿', 'error');
            return;
        }

        // 创建动态
        const postData = {
            authorId: draft.authorId,
            content: draft.content,
            images: draft.images || [],
            visibility: draft.visibility,
            tags: draft.tags || []
        };

        const post = postStorage.createPost(postData);
        if (post) {
            // 删除草稿
            delete drafts[draftId];
            storage.set('drafts', drafts);

            // 刷新草稿列表
            this.loadUserDrafts();

            showToast('草稿发布成功', 'success');
        } else {
            showToast('发布失败，请重试', 'error');
        }
    }

    /**
     * 删除草稿
     * @param {string} draftId 草稿ID
     */
    deleteDraft(draftId) {
        if (confirm('确定要删除这个草稿吗？删除后无法恢复。')) {
            postManager.deleteDraft(draftId);
            this.loadUserDrafts();
        }
    }

    /**
     * 显示关注/粉丝列表模态框
     * @param {string} type 类型（following或followers）
     */
    showFollowListModal(type) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }

        const title = type === 'following' ? '关注列表' : '粉丝列表';
        const followList = socialManager.getFollowList(currentUser.id, type);

        const modal = document.createElement('div');
        modal.className = 'modal follow-list-modal';
        modal.id = 'follow-list-modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="document.getElementById('follow-list-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="follow-list" id="follow-list">
                        <div class="loading">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 显示模态框
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 加载关注/粉丝列表
        this.loadFollowList(followList, type);
    }

    /**
     * 加载关注/粉丝列表
     * @param {array} followList 关注列表
     * @param {string} type 类型
     */
    loadFollowList(followList, type) {
        const container = document.getElementById('follow-list');
        if (!container) return;

        if (followList.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>${type === 'following' ? '还没有关注任何人' : '还没有粉丝'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        followList.forEach(follow => {
            const userId = type === 'following' ? follow.followingId : follow.followerId;
            const user = userStorage.getUserById(userId);

            if (user) {
                const userElement = document.createElement('div');
                userElement.className = 'follow-list-item';

                const currentUser = authManager.getCurrentUser();
                const isFollowing = currentUser && type === 'followers' ?
                    socialManager.isFollowing(currentUser.id, user.id) : null;

                userElement.innerHTML = `
                    <div class="user-info">
                        <img src="${user.avatar || getRandomAvatar(user.id)}" alt="${user.nickname}" class="user-avatar clickable" onclick="postManager.viewUserProfile('${user.id}')">
                        <div class="user-details">
                            <div class="user-name clickable" onclick="postManager.viewUserProfile('${user.id}')">${user.nickname}</div>
                            <div class="user-username">@${user.username}</div>
                            <div class="user-bio">${truncateText(user.bio || '', 50)}</div>
                        </div>
                    </div>
                    ${currentUser && currentUser.id !== user.id && type === 'followers' ? `
                        <div class="user-actions">
                            <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm follow-btn"
                                    onclick="app.toggleFollowInList('${user.id}')">
                                ${isFollowing ? '已关注' : '关注'}
                            </button>
                        </div>
                    ` : ''}
                `;

                container.appendChild(userElement);
            }
        });
    }

    /**
     * 在列表中切换关注状态
     * @param {string} userId 用户ID
     */
    toggleFollowInList(userId) {
        socialManager.toggleFollow(userId);

        // 更新按钮状态
        setTimeout(() => {
            const currentUser = authManager.getCurrentUser();
            if (!currentUser) return;

            const isFollowing = socialManager.isFollowing(currentUser.id, userId);
            const followBtns = document.querySelectorAll(`.follow-list-modal [onclick*="${userId}"]`);
            followBtns.forEach(btn => {
                if (btn.classList.contains('follow-btn')) {
                    btn.textContent = isFollowing ? '已关注' : '关注';
                    btn.className = `btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm follow-btn`;
                }
            });
        }, 100);
    }
}

// 创建全局应用实例
const app = new App();

// 导出到全局作用域（用于调试）
window.app = app;
