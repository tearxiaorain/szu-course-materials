// 动态管理模块

/**
 * 动态管理器
 */
class PostManager {
    constructor() {
        this.currentPage = 1;
        this.postsPerPage = 10;
        this.currentFilter = 'all';
        this.isLoading = false;
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        this.bindEvents();
        // 延迟加载动态，确保存储系统已初始化
        setTimeout(() => {
            this.loadPosts();
        }, 100);
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 发布表单
        const publishForm = document.getElementById('publish-form');
        if (publishForm) {
            publishForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePublish();
            });
        }
        
        // 字符计数
        const postContent = document.getElementById('post-content');
        const charCount = document.getElementById('char-count');
        if (postContent && charCount) {
            postContent.addEventListener('input', () => {
                const count = postContent.value.length;
                charCount.textContent = count;
                charCount.style.color = count > 450 ? '#ef4444' : '#6b7280';
            });
        }
        
        // 图片上传
        const imageUpload = document.getElementById('image-upload');
        const uploadArea = document.getElementById('upload-area');
        
        if (imageUpload && uploadArea) {
            imageUpload.addEventListener('change', (e) => {
                this.handleImageUpload(e.target.files);
            });
            
            // 拖拽上传
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                this.handleImageUpload(e.dataTransfer.files);
            });
            
            uploadArea.addEventListener('click', () => {
                imageUpload.click();
            });
        }
        
        // 保存草稿
        const saveDraftBtn = document.getElementById('save-draft-btn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                this.saveDraft();
            });
        }
        
        // 筛选按钮
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });
        
        // 加载更多
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMorePosts();
            });
        }
        
        // 监听认证事件
        document.addEventListener('auth', (e) => {
            if (e.detail.type === 'login') {
                this.loadPosts();
            } else if (e.detail.type === 'logout') {
                this.loadPosts();
            }
        });
    }
    
    /**
     * 处理图片上传
     * @param {FileList} files 文件列表
     */
    async handleImageUpload(files) {
        const imagePreview = document.getElementById('image-preview');
        if (!imagePreview) return;
        
        const maxImages = 9;
        const currentImages = imagePreview.querySelectorAll('.image-item').length;
        
        if (currentImages >= maxImages) {
            showToast('最多只能上传9张图片', 'warning');
            return;
        }
        
        const validFiles = Array.from(files).filter(file => {
            if (!file.type.startsWith('image/')) {
                showToast(`${file.name} 不是有效的图片文件`, 'error');
                return false;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB
                showToast(`${file.name} 文件过大，请选择小于5MB的图片`, 'error');
                return false;
            }
            
            return true;
        });
        
        const remainingSlots = maxImages - currentImages;
        const filesToProcess = validFiles.slice(0, remainingSlots);
        
        if (validFiles.length > remainingSlots) {
            showToast(`只能再上传${remainingSlots}张图片`, 'warning');
        }
        
        for (const file of filesToProcess) {
            try {
                const compressedImage = await compressImage(file);
                this.addImagePreview(compressedImage, file.name);
            } catch (error) {
                console.error('图片压缩失败:', error);
                showToast(`${file.name} 处理失败`, 'error');
            }
        }
    }
    
    /**
     * 添加图片预览
     * @param {string} imageData base64图片数据
     * @param {string} fileName 文件名
     */
    addImagePreview(imageData, fileName) {
        const imagePreview = document.getElementById('image-preview');
        if (!imagePreview) return;
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${imageData}" alt="${fileName}">
            <button type="button" class="image-remove" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        imagePreview.appendChild(imageItem);
    }
    
    /**
     * 处理发布
     */
    async handlePublish() {
        if (!authManager.isLoggedIn()) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }
        
        const content = document.getElementById('post-content').value.trim();
        const visibility = document.querySelector('input[name="visibility"]:checked').value;
        const imagePreview = document.getElementById('image-preview');
        
        if (!content && !imagePreview.children.length) {
            showToast('请输入内容或上传图片', 'warning');
            return;
        }
        
        if (content.length > 500) {
            showToast('内容不能超过500字', 'error');
            return;
        }
        
        // 收集图片
        const images = Array.from(imagePreview.querySelectorAll('img')).map(img => img.src);
        
        // 创建动态数据
        const postData = {
            authorId: authManager.getCurrentUser().id,
            content,
            images,
            visibility,
            tags: this.extractTags(content)
        };
        
        try {
            const publishBtn = document.getElementById('publish-btn');
            publishBtn.disabled = true;
            publishBtn.textContent = '发布中...';
            
            const post = postStorage.createPost(postData);
            
            if (post) {
                showToast('发布成功！', 'success');
                this.clearPublishForm();
                this.loadPosts();
                
                // 跳转到首页
                if (typeof app !== 'undefined' && app.showPage) {
                    app.showPage('home');
                }
            } else {
                showToast('发布失败，请稍后重试', 'error');
            }
        } catch (error) {
            console.error('发布失败:', error);
            showToast('发布失败，请稍后重试', 'error');
        } finally {
            const publishBtn = document.getElementById('publish-btn');
            publishBtn.disabled = false;
            publishBtn.textContent = '发布动态';
        }
    }
    
    /**
     * 提取标签
     * @param {string} content 内容
     * @returns {array} 标签数组
     */
    extractTags(content) {
        const tagRegex = /#([^\s#]+)/g;
        const tags = [];
        let match;
        
        while ((match = tagRegex.exec(content)) !== null) {
            tags.push(match[1]);
        }
        
        return [...new Set(tags)]; // 去重
    }
    
    /**
     * 保存草稿
     */
    saveDraft() {
        if (!authManager.isLoggedIn()) {
            showToast('请先登录', 'warning');
            return;
        }
        
        const content = document.getElementById('post-content').value.trim();
        const visibility = document.querySelector('input[name="visibility"]:checked').value;
        const imagePreview = document.getElementById('image-preview');
        const images = Array.from(imagePreview.querySelectorAll('img')).map(img => img.src);
        
        if (!content && !images.length) {
            showToast('没有内容可保存', 'warning');
            return;
        }
        
        const drafts = storage.get('drafts', {});
        const draftId = generateId();
        
        drafts[draftId] = {
            id: draftId,
            authorId: authManager.getCurrentUser().id,
            content,
            images,
            visibility,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        storage.set('drafts', drafts);
        showToast('草稿已保存', 'success');
    }
    
    /**
     * 清空发布表单
     */
    clearPublishForm() {
        const postContent = document.getElementById('post-content');
        const charCount = document.getElementById('char-count');
        const imagePreview = document.getElementById('image-preview');
        const visibilityPublic = document.querySelector('input[name="visibility"][value="public"]');
        
        if (postContent) postContent.value = '';
        if (charCount) charCount.textContent = '0';
        if (imagePreview) imagePreview.innerHTML = '';
        if (visibilityPublic) visibilityPublic.checked = true;
    }
    
    /**
     * 设置筛选条件
     * @param {string} filter 筛选条件
     */
    setFilter(filter) {
        // 检查"关注"筛选是否需要登录
        if (filter === 'following' && !authManager.isLoggedIn()) {
            showToast('请先登录查看关注的动态', 'warning');
            authManager.showAuthModal('login');
            return;
        }

        this.currentFilter = filter;
        this.currentPage = 1;

        // 更新按钮状态
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.loadPosts();
    }
    
    /**
     * 加载动态列表
     */
    loadPosts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const postsContainer = document.getElementById('posts-container');
        
        if (!postsContainer) {
            this.isLoading = false;
            return;
        }
        
        // 显示加载状态
        if (this.currentPage === 1) {
            postsContainer.innerHTML = '<div class="loading">加载中...</div>';
        }
        
        setTimeout(() => {
            try {
                const options = {
                    page: this.currentPage,
                    limit: this.postsPerPage
                };
                
                // 根据筛选条件获取动态
                let posts = [];
                const currentUser = authManager.getCurrentUser();

                if (this.currentFilter === 'all') {
                    posts = postStorage.getPosts(options);
                } else if (this.currentFilter === 'following' && currentUser) {
                    // 获取关注用户的动态
                    const followingList = socialManager.getFollowList(currentUser.id, 'following');
                    const followingIds = followingList.map(follow => follow.followingId);

                    if (followingIds.length === 0) {
                        posts = [];
                    } else {
                        // 获取所有动态，然后过滤出关注用户的动态
                        const allPosts = postStorage.getPosts();
                        posts = allPosts.filter(post => followingIds.includes(post.authorId));

                        // 手动分页
                        const start = (this.currentPage - 1) * this.postsPerPage;
                        const end = start + this.postsPerPage;
                        posts = posts.slice(start, end);
                    }
                } else if (this.currentFilter === 'following' && !currentUser) {
                    // 未登录用户点击关注按钮
                    posts = [];
                } else if (this.currentFilter === 'popular') {
                    // 按点赞数降序排序
                    posts = postStorage.getPosts({ ...options, sortBy: 'popular' });
                }
                
                // 过滤私密动态（只有作者本人可见）
                if (currentUser) {
                    posts = posts.filter(post => 
                        post.visibility === 'public' || post.authorId === currentUser.id
                    );
                } else {
                    posts = posts.filter(post => post.visibility === 'public');
                }
                
                if (this.currentPage === 1) {
                    postsContainer.innerHTML = '';
                }
                
                if (posts.length === 0 && this.currentPage === 1) {
                    let emptyMessage = '';
                    let emptyIcon = 'fas fa-comments';

                    if (this.currentFilter === 'following') {
                        if (!currentUser) {
                            emptyMessage = '请先登录查看关注的用户动态';
                            emptyIcon = 'fas fa-user-lock';
                        } else {
                            const followingList = socialManager.getFollowList(currentUser.id, 'following');
                            if (followingList.length === 0) {
                                emptyMessage = '您还没有关注任何用户，快去发现有趣的人吧！';
                                emptyIcon = 'fas fa-user-plus';
                            } else {
                                emptyMessage = '您关注的用户还没有发布动态';
                                emptyIcon = 'fas fa-heart';
                            }
                        }
                    } else if (this.currentFilter === 'popular') {
                        emptyMessage = '还没有热门动态，快来发布第一条吧！';
                        emptyIcon = 'fas fa-fire';
                    } else {
                        emptyMessage = '还没有动态，快来发布第一条吧！';
                        emptyIcon = 'fas fa-comments';
                    }

                    postsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="${emptyIcon}"></i>
                            <p>${emptyMessage}</p>
                            ${this.currentFilter === 'following' && currentUser && socialManager.getFollowList(currentUser.id, 'following').length === 0 ? `
                                <button class="btn btn-primary" onclick="app.showPage('search')">
                                    <i class="fas fa-search"></i>
                                    发现用户
                                </button>
                            ` : ''}
                            ${(!currentUser && this.currentFilter === 'following') ? `
                                <button class="btn btn-primary" onclick="authManager.showAuthModal('login')">
                                    <i class="fas fa-sign-in-alt"></i>
                                    立即登录
                                </button>
                            ` : ''}
                        </div>
                    `;
                } else {
                    posts.forEach(post => {
                        const postElement = this.createPostElement(post);
                        postsContainer.appendChild(postElement);
                    });
                }
                
                // 更新加载更多按钮状态
                const loadMoreBtn = document.getElementById('load-more-btn');
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = posts.length < this.postsPerPage ? 'none' : 'block';
                }
                
            } catch (error) {
                console.error('加载动态失败:', error);
                postsContainer.innerHTML = '<div class="error">加载失败，请刷新重试</div>';
            } finally {
                this.isLoading = false;
            }
        }, 300); // 模拟网络延迟
    }
    
    /**
     * 加载更多动态
     */
    loadMorePosts() {
        this.currentPage++;
        this.loadPosts();
    }
    
    /**
     * 创建动态元素
     * @param {object} post 动态数据
     * @returns {HTMLElement}
     */
    createPostElement(post) {
        const author = userStorage.getUserById(post.authorId);
        const currentUser = authManager.getCurrentUser();
        const isLiked = currentUser ? likeStorage.isLiked(currentUser.id, post.id, 'post') : false;
        const canEdit = currentUser && (currentUser.id === post.authorId || currentUser.role === 'admin');
        
        const postElement = document.createElement('div');
        postElement.className = 'post-item';
        postElement.dataset.postId = post.id;
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <img src="${author?.avatar || getRandomAvatar(post.authorId)}" alt="${author?.nickname || '用户'}" class="author-avatar clickable" onclick="postManager.viewUserProfile('${post.authorId}')">
                    <div class="author-info">
                        <div class="author-name clickable" onclick="postManager.viewUserProfile('${post.authorId}')">${author?.nickname || '未知用户'}</div>
                        <div class="post-time">${formatTime(post.createdAt)}</div>
                    </div>
                </div>
                ${canEdit ? `
                    <div class="post-actions">
                        <button class="action-btn" onclick="postManager.editPost('${post.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn" onclick="postManager.deletePost('${post.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            
            <div class="post-content clickable" onclick="postManager.showPostDetail('${post.id}')">
                <div class="post-text">${this.formatPostContent(post.content)}</div>
                ${post.images.length > 0 ? `
                    <div class="post-images ${post.images.length === 1 ? 'single' : 'multiple'}">
                        ${post.images.map(img => `
                            <img src="${img}" alt="动态图片" onclick="event.stopPropagation(); postManager.showImageModal('${img}')">
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="post-footer">
                <div class="post-stats">
                    <button class="stat-btn like-btn ${isLiked ? 'liked' : ''}" onclick="postManager.toggleLike('${post.id}')">
                        <i class="fas fa-heart"></i>
                        <span>${formatNumber(post.stats.likesCount)}</span>
                    </button>
                    <button class="stat-btn comment-btn" onclick="postManager.showComments('${post.id}')">
                        <i class="fas fa-comment"></i>
                        <span>${formatNumber(post.stats.commentsCount)}</span>
                    </button>
                    <button class="stat-btn share-btn" onclick="postManager.sharePost('${post.id}')">
                        <i class="fas fa-share"></i>
                        <span>${formatNumber(post.stats.sharesCount)}</span>
                    </button>
                </div>
                <div class="post-visibility">
                    ${post.visibility === 'private' ? '<i class="fas fa-lock" title="私密"></i>' : ''}
                </div>
            </div>
        `;
        
        return postElement;
    }
    
    /**
     * 格式化动态内容
     * @param {string} content 原始内容
     * @returns {string} 格式化后的内容
     */
    formatPostContent(content) {
        // 转义HTML
        let formatted = escapeHtml(content);
        
        // 处理话题标签
        formatted = formatted.replace(/#([^\s#]+)/g, '<span class="hashtag">#$1</span>');
        
        // 处理@提及
        formatted = formatted.replace(/@([^\s@]+)/g, '<span class="mention">@$1</span>');
        
        // 处理换行
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    /**
     * 切换点赞状态
     * @param {string} postId 动态ID
     */
    toggleLike(postId) {
        if (!authManager.isLoggedIn()) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }

        const currentUser = authManager.getCurrentUser();
        const isLiked = likeStorage.toggleLike(currentUser.id, postId, 'post');

        // 更新UI
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const likeBtn = postElement.querySelector('.like-btn');
            const likeCount = postElement.querySelector('.like-btn span');
            const post = postStorage.getPost(postId);

            if (likeBtn) {
                likeBtn.classList.toggle('liked', isLiked);
            }

            if (likeCount && post) {
                likeCount.textContent = formatNumber(post.stats.likesCount);
            }
        }

        showToast(isLiked ? '点赞成功' : '取消点赞', 'success');
    }

    /**
     * 显示评论
     * @param {string} postId 动态ID
     */
    showComments(postId) {
        this.showPostDetail(postId);
    }

    /**
     * 分享动态
     * @param {string} postId 动态ID
     */
    sharePost(postId) {
        const post = postStorage.getPost(postId);
        if (!post) return;

        const author = userStorage.getUserById(post.authorId);
        const shareText = `${author?.nickname || '用户'}的动态：${truncateText(post.content, 50)}`;

        if (navigator.share) {
            navigator.share({
                title: '校园生活 - 动态分享',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(shareText + '\n' + window.location.href)
                .then(() => showToast('链接已复制到剪贴板', 'success'))
                .catch(() => showToast('分享失败', 'error'));
        }
    }

    /**
     * 编辑动态
     * @param {string} postId 动态ID
     */
    editPost(postId) {
        const post = postStorage.getPost(postId);
        if (!post) return;

        const currentUser = authManager.getCurrentUser();
        if (!currentUser || (currentUser.id !== post.authorId && currentUser.role !== 'admin')) {
            showToast('没有权限编辑此动态', 'error');
            return;
        }

        // 填充编辑表单
        const postContent = document.getElementById('post-content');
        const imagePreview = document.getElementById('image-preview');
        const visibilityRadio = document.querySelector(`input[name="visibility"][value="${post.visibility}"]`);

        if (postContent) postContent.value = post.content;
        if (visibilityRadio) visibilityRadio.checked = true;

        if (imagePreview) {
            imagePreview.innerHTML = '';
            post.images.forEach((img, index) => {
                this.addImagePreview(img, `image-${index}`);
            });
        }

        // 跳转到发布页面
        if (typeof app !== 'undefined' && app.showPage) {
            app.showPage('publish');
        }

        showToast('动态内容已加载到编辑器', 'info');
    }

    /**
     * 删除动态
     * @param {string} postId 动态ID
     */
    deletePost(postId) {
        const post = postStorage.getPost(postId);
        if (!post) return;

        const currentUser = authManager.getCurrentUser();
        if (!currentUser || (currentUser.id !== post.authorId && currentUser.role !== 'admin')) {
            showToast('没有权限删除此动态', 'error');
            return;
        }

        if (confirm('确定要删除这条动态吗？删除后无法恢复。')) {
            if (postStorage.deletePost(postId)) {
                // 从UI中移除
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                if (postElement) {
                    postElement.remove();
                }

                showToast('动态已删除', 'success');
            } else {
                showToast('删除失败', 'error');
            }
        }
    }

    /**
     * 显示图片模态框
     * @param {string} imageSrc 图片地址
     */
    showImageModal(imageSrc) {
        // 创建图片查看模态框
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-content">
                <img src="${imageSrc}" alt="查看图片">
                <button class="image-modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定关闭事件
        const closeBtn = modal.querySelector('.image-modal-close');
        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // 显示模态框
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    /**
     * 获取用户动态
     * @param {string} userId 用户ID
     * @param {object} options 选项
     * @returns {array}
     */
    getUserPosts(userId, options = {}) {
        return postStorage.getPosts({
            authorId: userId,
            ...options
        });
    }

    /**
     * 获取草稿列表
     * @param {string} userId 用户ID
     * @returns {array}
     */
    getUserDrafts(userId) {
        const drafts = storage.get('drafts', {});
        return Object.values(drafts).filter(draft => draft.authorId === userId);
    }

    /**
     * 加载草稿
     * @param {string} draftId 草稿ID
     */
    loadDraft(draftId) {
        const drafts = storage.get('drafts', {});
        const draft = drafts[draftId];

        if (!draft) {
            showToast('草稿不存在', 'error');
            return;
        }

        const currentUser = authManager.getCurrentUser();
        if (!currentUser || currentUser.id !== draft.authorId) {
            showToast('没有权限访问此草稿', 'error');
            return;
        }

        // 填充表单
        const postContent = document.getElementById('post-content');
        const imagePreview = document.getElementById('image-preview');
        const visibilityRadio = document.querySelector(`input[name="visibility"][value="${draft.visibility}"]`);

        if (postContent) postContent.value = draft.content;
        if (visibilityRadio) visibilityRadio.checked = true;

        if (imagePreview) {
            imagePreview.innerHTML = '';
            draft.images.forEach((img, index) => {
                this.addImagePreview(img, `draft-image-${index}`);
            });
        }

        // 跳转到发布页面
        if (typeof app !== 'undefined' && app.showPage) {
            app.showPage('publish');
        }

        showToast('草稿已加载', 'success');
    }

    /**
     * 删除草稿
     * @param {string} draftId 草稿ID
     */
    deleteDraft(draftId) {
        const drafts = storage.get('drafts', {});

        if (!drafts[draftId]) {
            showToast('草稿不存在', 'error');
            return;
        }

        const currentUser = authManager.getCurrentUser();
        if (!currentUser || currentUser.id !== drafts[draftId].authorId) {
            showToast('没有权限删除此草稿', 'error');
            return;
        }

        delete drafts[draftId];
        storage.set('drafts', drafts);

        showToast('草稿已删除', 'success');
    }

    /**
     * 查看用户资料
     * @param {string} userId 用户ID
     */
    viewUserProfile(userId) {
        if (!userId) return;

        const user = userStorage.getUserById(userId);
        if (!user) {
            showToast('用户不存在', 'error');
            return;
        }

        // 如果是当前用户，跳转到个人中心
        const currentUser = authManager.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            if (typeof app !== 'undefined' && app.showPage) {
                app.showPage('profile');
            }
            return;
        }

        // 显示其他用户的资料页面
        this.showUserProfileModal(user);
    }

    /**
     * 显示用户资料模态框
     * @param {object} user 用户信息
     */
    showUserProfileModal(user) {
        const currentUser = authManager.getCurrentUser();
        const isFollowing = currentUser ? socialManager.isFollowing(currentUser.id, user.id) : false;
        const stats = socialManager.getUserStats(user.id);

        const modal = document.createElement('div');
        modal.className = 'modal user-profile-modal';
        modal.id = 'user-profile-modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>用户资料</h3>
                    <button class="modal-close" onclick="document.getElementById('user-profile-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="user-profile-info">
                        <div class="profile-header">
                            <img src="${user.avatar || getRandomAvatar(user.id)}" alt="${user.nickname}" class="profile-avatar">
                            <div class="profile-details">
                                <h4 class="profile-name">${user.nickname}</h4>
                                <p class="profile-username">@${user.username}</p>
                                <p class="profile-bio">${user.bio || '这个人很懒，什么都没有留下...'}</p>
                            </div>
                        </div>

                        <div class="profile-stats">
                            <div class="stat-item">
                                <span class="stat-number">${formatNumber(stats?.postsCount || 0)}</span>
                                <span class="stat-label">动态</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${formatNumber(stats?.followingCount || 0)}</span>
                                <span class="stat-label">关注</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">${formatNumber(stats?.followersCount || 0)}</span>
                                <span class="stat-label">粉丝</span>
                            </div>
                        </div>

                        ${currentUser && currentUser.id !== user.id ? `
                            <div class="profile-actions">
                                <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} follow-btn"
                                        onclick="postManager.toggleFollowFromModal('${user.id}')">
                                    ${isFollowing ? '取消关注' : '关注'}
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <div class="user-posts-section">
                        <h4>TA的动态</h4>
                        <div class="user-posts-list" id="modal-user-posts">
                            <div class="loading">加载中...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 显示模态框
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 加载用户动态
        this.loadUserPostsInModal(user.id);
    }

    /**
     * 在模态框中加载用户动态
     * @param {string} userId 用户ID
     */
    loadUserPostsInModal(userId) {
        const container = document.getElementById('modal-user-posts');
        if (!container) return;

        const currentUser = authManager.getCurrentUser();
        const posts = postStorage.getPosts({ authorId: userId });

        // 过滤私密动态（只有作者本人可见）
        const visiblePosts = posts.filter(post =>
            post.visibility === 'public' || (currentUser && currentUser.id === userId)
        );

        if (visiblePosts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>还没有发布任何动态</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        visiblePosts.slice(0, 5).forEach(post => {
            const postElement = this.createPostElement(post);
            postElement.classList.add('modal-post-item');
            container.appendChild(postElement);
        });

        if (visiblePosts.length > 5) {
            const moreBtn = document.createElement('div');
            moreBtn.className = 'view-more-posts';
            moreBtn.innerHTML = `<p>还有 ${visiblePosts.length - 5} 条动态...</p>`;
            container.appendChild(moreBtn);
        }
    }

    /**
     * 从模态框中切换关注状态
     * @param {string} userId 用户ID
     */
    toggleFollowFromModal(userId) {
        socialManager.toggleFollow(userId);

        // 更新按钮状态
        setTimeout(() => {
            const currentUser = authManager.getCurrentUser();
            if (!currentUser) return;

            const isFollowing = socialManager.isFollowing(currentUser.id, userId);
            const followBtn = document.querySelector('.user-profile-modal .follow-btn');
            if (followBtn) {
                followBtn.textContent = isFollowing ? '取消关注' : '关注';
                followBtn.className = `btn ${isFollowing ? 'btn-outline' : 'btn-primary'} follow-btn`;
            }
        }, 100);
    }

    /**
     * 显示动态详情
     * @param {string} postId 动态ID
     */
    showPostDetail(postId) {
        const post = postStorage.getPost(postId);
        if (!post) {
            showToast('动态不存在', 'error');
            return;
        }

        const author = userStorage.getUserById(post.authorId);
        const currentUser = authManager.getCurrentUser();
        const isLiked = currentUser ? likeStorage.isLiked(currentUser.id, post.id, 'post') : false;
        const canEdit = currentUser && (currentUser.id === post.authorId || currentUser.role === 'admin');

        const modal = document.createElement('div');
        modal.className = 'modal post-detail-modal';
        modal.id = 'post-detail-modal';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>动态详情</h3>
                    <button class="modal-close" onclick="document.getElementById('post-detail-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="post-detail">
                        <div class="post-header">
                            <div class="post-author">
                                <img src="${author?.avatar || getRandomAvatar(post.authorId)}" alt="${author?.nickname || '用户'}" class="author-avatar clickable" onclick="postManager.viewUserProfile('${post.authorId}')">
                                <div class="author-info">
                                    <div class="author-name clickable" onclick="postManager.viewUserProfile('${post.authorId}')">${author?.nickname || '未知用户'}</div>
                                    <div class="post-time">${formatTime(post.createdAt)}</div>
                                </div>
                            </div>
                            ${canEdit ? `
                                <div class="post-actions">
                                    <button class="action-btn" onclick="postManager.editPost('${post.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn" onclick="postManager.deletePost('${post.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>

                        <div class="post-content">
                            <div class="post-text">${this.formatPostContent(post.content)}</div>
                            ${post.images.length > 0 ? `
                                <div class="post-images ${post.images.length === 1 ? 'single' : 'multiple'}">
                                    ${post.images.map(img => `
                                        <img src="${img}" alt="动态图片" onclick="postManager.showImageModal('${img}')">
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <div class="post-footer">
                            <div class="post-stats">
                                <button class="stat-btn like-btn ${isLiked ? 'liked' : ''}" onclick="postManager.toggleLikeInDetail('${post.id}')">
                                    <i class="fas fa-heart"></i>
                                    <span id="detail-like-count">${formatNumber(post.stats.likesCount)}</span>
                                </button>
                                <div class="stat-info">
                                    <i class="fas fa-comment"></i>
                                    <span id="detail-comment-count">${formatNumber(post.stats.commentsCount)}</span>
                                </div>
                                <div class="stat-info">
                                    <i class="fas fa-eye"></i>
                                    <span>${formatNumber(post.stats.viewsCount)}</span>
                                </div>
                            </div>
                            <div class="post-visibility">
                                ${post.visibility === 'private' ? '<i class="fas fa-lock" title="私密"></i>' : ''}
                            </div>
                        </div>
                    </div>

                    <div class="comments-section">
                        <h4>评论 (<span id="comments-count">${post.stats.commentsCount}</span>)</h4>

                        ${currentUser ? `
                            <div class="comment-form">
                                <div class="comment-input-group">
                                    <img src="${currentUser.avatar || getRandomAvatar(currentUser.id)}" alt="${currentUser.nickname}" class="comment-avatar">
                                    <div class="comment-input-wrapper">
                                        <textarea id="comment-input" placeholder="写下你的评论..." rows="2"></textarea>
                                        <div class="comment-actions">
                                            <button class="btn btn-primary btn-sm" onclick="postManager.submitComment('${post.id}')">
                                                发表评论
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <div class="login-prompt">
                                <p>请<a href="#" onclick="authManager.showAuthModal('login')">登录</a>后发表评论</p>
                            </div>
                        `}

                        <div class="comments-list" id="comments-list">
                            <div class="loading">加载评论中...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 显示模态框
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 加载评论
        this.loadCommentsForPost(post.id);
    }

    /**
     * 在详情页中切换点赞状态
     * @param {string} postId 动态ID
     */
    toggleLikeInDetail(postId) {
        if (!authManager.isLoggedIn()) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }

        const currentUser = authManager.getCurrentUser();
        const isLiked = likeStorage.toggleLike(currentUser.id, postId, 'post');
        const post = postStorage.getPost(postId);

        // 更新详情页UI
        const likeBtn = document.querySelector('.post-detail-modal .like-btn');
        const likeCount = document.getElementById('detail-like-count');

        if (likeBtn) {
            likeBtn.classList.toggle('liked', isLiked);
        }

        if (likeCount && post) {
            likeCount.textContent = formatNumber(post.stats.likesCount);
        }

        // 同时更新主页面中的对应动态
        const mainPostElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (mainPostElement) {
            const mainLikeBtn = mainPostElement.querySelector('.like-btn');
            const mainLikeCount = mainPostElement.querySelector('.like-btn span');

            if (mainLikeBtn) {
                mainLikeBtn.classList.toggle('liked', isLiked);
            }

            if (mainLikeCount && post) {
                mainLikeCount.textContent = formatNumber(post.stats.likesCount);
            }
        }

        showToast(isLiked ? '点赞成功' : '取消点赞', 'success');
    }

    /**
     * 加载动态的评论
     * @param {string} postId 动态ID
     */
    loadCommentsForPost(postId) {
        const commentsContainer = document.getElementById('comments-list');
        if (!commentsContainer) return;

        const comments = commentStorage.getComments(postId);

        if (comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="empty-comments">
                    <i class="fas fa-comment"></i>
                    <p>还没有评论，快来抢沙发吧！</p>
                </div>
            `;
            return;
        }

        commentsContainer.innerHTML = '';
        comments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsContainer.appendChild(commentElement);
        });
    }

    /**
     * 创建评论元素
     * @param {object} comment 评论数据
     * @returns {HTMLElement}
     */
    createCommentElement(comment) {
        const author = userStorage.getUserById(comment.authorId);
        const currentUser = authManager.getCurrentUser();
        const canDelete = currentUser && (currentUser.id === comment.authorId || currentUser.role === 'admin');
        const isLiked = currentUser ? likeStorage.isLiked(currentUser.id, comment.id, 'comment') : false;

        const commentElement = document.createElement('div');
        commentElement.className = 'comment-item';
        commentElement.dataset.commentId = comment.id;

        commentElement.innerHTML = `
            <div class="comment-header">
                <img src="${author?.avatar || getRandomAvatar(comment.authorId)}" alt="${author?.nickname || '用户'}" class="comment-avatar clickable" onclick="postManager.viewUserProfile('${comment.authorId}')">
                <div class="comment-info">
                    <div class="comment-author clickable" onclick="postManager.viewUserProfile('${comment.authorId}')">${author?.nickname || '未知用户'}</div>
                    <div class="comment-time">${formatTime(comment.createdAt)}</div>
                </div>
                <div class="comment-actions">
                    ${currentUser ? `
                        <button class="comment-like-btn ${isLiked ? 'liked' : ''}" onclick="postManager.toggleCommentLike('${comment.id}')">
                            <i class="fas fa-heart"></i>
                            <span class="like-count">${formatNumber(comment.stats.likesCount || 0)}</span>
                        </button>
                    ` : `
                        <span class="comment-like-count">
                            <i class="fas fa-heart"></i>
                            <span>${formatNumber(comment.stats.likesCount || 0)}</span>
                        </span>
                    `}
                    ${canDelete ? `
                        <button class="comment-delete-btn" onclick="postManager.deleteComment('${comment.id}', '${comment.postId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            <div class="comment-content">
                ${escapeHtml(comment.content)}
            </div>
        `;

        return commentElement;
    }

    /**
     * 提交评论
     * @param {string} postId 动态ID
     */
    submitComment(postId) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }

        const commentInput = document.getElementById('comment-input');
        if (!commentInput) return;

        const content = commentInput.value.trim();
        if (!content) {
            showToast('评论内容不能为空', 'warning');
            return;
        }

        if (content.length > 500) {
            showToast('评论内容不能超过500字符', 'error');
            return;
        }

        // 创建评论
        const commentData = {
            postId,
            authorId: currentUser.id,
            content
        };

        const comment = commentStorage.createComment(commentData);
        if (comment) {
            // 清空输入框
            commentInput.value = '';

            // 重新加载评论列表
            this.loadCommentsForPost(postId);

            // 更新评论计数
            const post = postStorage.getPost(postId);
            if (post) {
                const commentCountElements = document.querySelectorAll('#comments-count, #detail-comment-count');
                commentCountElements.forEach(el => {
                    if (el) el.textContent = formatNumber(post.stats.commentsCount);
                });

                // 更新主页面中的评论计数
                const mainPostElement = document.querySelector(`[data-post-id="${postId}"]`);
                if (mainPostElement) {
                    const mainCommentCount = mainPostElement.querySelector('.comment-btn span');
                    if (mainCommentCount) {
                        mainCommentCount.textContent = formatNumber(post.stats.commentsCount);
                    }
                }
            }

            showToast('评论发表成功', 'success');
        } else {
            showToast('评论发表失败', 'error');
        }
    }

    /**
     * 删除评论
     * @param {string} commentId 评论ID
     * @param {string} postId 动态ID
     */
    deleteComment(commentId, postId) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;

        const comment = commentStorage.getComment(commentId);
        if (!comment) {
            showToast('评论不存在', 'error');
            return;
        }

        if (currentUser.id !== comment.authorId && currentUser.role !== 'admin') {
            showToast('没有权限删除此评论', 'error');
            return;
        }

        if (confirm('确定要删除这条评论吗？')) {
            if (commentStorage.deleteComment(commentId)) {
                // 重新加载评论列表
                this.loadCommentsForPost(postId);

                // 更新评论计数
                const post = postStorage.getPost(postId);
                if (post) {
                    const commentCountElements = document.querySelectorAll('#comments-count, #detail-comment-count');
                    commentCountElements.forEach(el => {
                        if (el) el.textContent = formatNumber(post.stats.commentsCount);
                    });

                    // 更新主页面中的评论计数
                    const mainPostElement = document.querySelector(`[data-post-id="${postId}"]`);
                    if (mainPostElement) {
                        const mainCommentCount = mainPostElement.querySelector('.comment-btn span');
                        if (mainCommentCount) {
                            mainCommentCount.textContent = formatNumber(post.stats.commentsCount);
                        }
                    }
                }

                showToast('评论已删除', 'success');
            } else {
                showToast('删除失败', 'error');
            }
        }
    }

    /**
     * 切换评论点赞状态
     * @param {string} commentId 评论ID
     */
    toggleCommentLike(commentId) {
        if (!authManager.isLoggedIn()) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }

        const currentUser = authManager.getCurrentUser();
        const isLiked = likeStorage.toggleLike(currentUser.id, commentId, 'comment');
        const comment = commentStorage.getComment(commentId);

        // 更新UI
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement && comment) {
            const likeBtn = commentElement.querySelector('.comment-like-btn');
            const likeCount = commentElement.querySelector('.like-count');

            if (likeBtn) {
                likeBtn.classList.toggle('liked', isLiked);
            }

            if (likeCount) {
                likeCount.textContent = formatNumber(comment.stats.likesCount || 0);
            }
        }

        showToast(isLiked ? '点赞成功' : '取消点赞', 'success');
    }
}

// 创建全局动态管理器实例
const postManager = new PostManager();

// 导出到全局作用域
window.postManager = postManager;
window.PostManager = PostManager;
