// 搜索功能模块

/**
 * 搜索管理器
 */
class SearchManager {
    constructor() {
        this.currentQuery = '';
        this.currentType = 'all';
        this.searchResults = [];
        this.isSearching = false;
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        this.bindEvents();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索输入框
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            // 防抖搜索
            const debouncedSearch = debounce((query) => {
                this.performSearch(query);
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                this.currentQuery = query;
                
                if (query.length >= 2) {
                    debouncedSearch(query);
                } else {
                    this.clearResults();
                }
            });
            
            // 回车搜索
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = e.target.value.trim();
                    if (query) {
                        this.performSearch(query);
                    }
                }
            });
        }
        
        // 搜索按钮
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput ? searchInput.value.trim() : '';
                if (query) {
                    this.performSearch(query);
                }
            });
        }
        
        // 搜索类型筛选
        const searchFilters = document.querySelectorAll('[data-search-type]');
        searchFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                this.setSearchType(filter.dataset.searchType);
            });
        });
    }
    
    /**
     * 设置搜索类型
     * @param {string} type 搜索类型
     */
    setSearchType(type) {
        this.currentType = type;
        
        // 更新按钮状态
        const searchFilters = document.querySelectorAll('[data-search-type]');
        searchFilters.forEach(filter => {
            filter.classList.toggle('active', filter.dataset.searchType === type);
        });
        
        // 如果有搜索查询，重新搜索
        if (this.currentQuery) {
            this.performSearch(this.currentQuery);
        }
    }
    
    /**
     * 执行搜索
     * @param {string} query 搜索查询
     */
    async performSearch(query) {
        if (this.isSearching) return;
        
        this.isSearching = true;
        this.currentQuery = query;
        
        const searchResults = document.getElementById('search-results');
        if (!searchResults) {
            this.isSearching = false;
            return;
        }
        
        // 显示加载状态
        searchResults.innerHTML = '<div class="search-loading">搜索中...</div>';
        
        try {
            // 模拟搜索延迟
            await new Promise(resolve => setTimeout(resolve, 300));
            
            let results = [];
            
            if (this.currentType === 'all' || this.currentType === 'posts') {
                const postResults = this.searchPosts(query);
                results = results.concat(postResults.map(item => ({ ...item, type: 'post' })));
            }
            
            if (this.currentType === 'all' || this.currentType === 'users') {
                const userResults = this.searchUsers(query);
                results = results.concat(userResults.map(item => ({ ...item, type: 'user' })));
            }
            
            this.searchResults = results;
            this.displayResults(results);
            
        } catch (error) {
            console.error('搜索失败:', error);
            searchResults.innerHTML = '<div class="search-error">搜索失败，请稍后重试</div>';
        } finally {
            this.isSearching = false;
        }
    }
    
    /**
     * 搜索动态
     * @param {string} query 搜索查询
     * @returns {array}
     */
    searchPosts(query) {
        const posts = postStorage.searchPosts(query, { limit: 20 });
        const currentUser = authManager.getCurrentUser();
        
        // 过滤私密动态
        return posts.filter(post => {
            if (post.visibility === 'private') {
                return currentUser && currentUser.id === post.authorId;
            }
            return true;
        });
    }
    
    /**
     * 搜索用户
     * @param {string} query 搜索查询
     * @returns {array}
     */
    searchUsers(query) {
        return userStorage.searchUsers(query, { limit: 20 });
    }
    
    /**
     * 显示搜索结果
     * @param {array} results 搜索结果
     */
    displayResults(results) {
        const searchResults = document.getElementById('search-results');
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-empty">
                    <i class="fas fa-search"></i>
                    <p>没有找到相关内容</p>
                    <small>尝试使用不同的关键词</small>
                </div>
            `;
            return;
        }
        
        const resultsByType = this.groupResultsByType(results);
        let html = '';
        
        // 显示用户结果
        if (resultsByType.users && resultsByType.users.length > 0) {
            html += '<div class="search-section">';
            html += '<h3 class="search-section-title">用户</h3>';
            html += '<div class="search-users">';
            
            resultsByType.users.forEach(user => {
                html += this.createUserResultElement(user);
            });
            
            html += '</div></div>';
        }
        
        // 显示动态结果
        if (resultsByType.posts && resultsByType.posts.length > 0) {
            html += '<div class="search-section">';
            html += '<h3 class="search-section-title">动态</h3>';
            html += '<div class="search-posts">';
            
            resultsByType.posts.forEach(post => {
                html += this.createPostResultElement(post);
            });
            
            html += '</div></div>';
        }
        
        searchResults.innerHTML = html;
    }
    
    /**
     * 按类型分组结果
     * @param {array} results 搜索结果
     * @returns {object}
     */
    groupResultsByType(results) {
        const grouped = {
            users: [],
            posts: []
        };
        
        results.forEach(result => {
            if (result.type === 'user') {
                grouped.users.push(result);
            } else if (result.type === 'post') {
                grouped.posts.push(result);
            }
        });
        
        return grouped;
    }
    
    /**
     * 创建用户搜索结果元素
     * @param {object} user 用户数据
     * @returns {string}
     */
    createUserResultElement(user) {
        const currentUser = authManager.getCurrentUser();
        const isCurrentUser = currentUser && currentUser.id === user.id;
        const isFollowing = currentUser && !isCurrentUser ? 
            socialManager.isFollowing(currentUser.id, user.id) : false;
        
        return `
            <div class="search-user-item">
                <img src="${user.avatar}" alt="${user.nickname}" class="user-avatar">
                <div class="user-info">
                    <div class="user-name">${this.highlightQuery(user.nickname)}</div>
                    <div class="user-username">@${this.highlightQuery(user.username)}</div>
                    <div class="user-bio">${this.highlightQuery(truncateText(user.bio, 60))}</div>
                    <div class="user-stats">
                        <span>${formatNumber(user.stats.postsCount || 0)} 动态</span>
                        <span>${formatNumber(user.stats.followersCount || 0)} 粉丝</span>
                    </div>
                </div>
                <div class="user-actions">
                    ${!isCurrentUser ? `
                        <button class="btn ${isFollowing ? 'btn-primary' : 'btn-outline'} btn-sm" 
                                onclick="searchManager.toggleFollowFromSearch('${user.id}')">
                            ${isFollowing ? '已关注' : '关注'}
                        </button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm" onclick="searchManager.viewUserProfile('${user.id}')">
                        查看
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 创建动态搜索结果元素
     * @param {object} post 动态数据
     * @returns {string}
     */
    createPostResultElement(post) {
        const author = userStorage.getUserById(post.authorId);
        const currentUser = authManager.getCurrentUser();
        const isLiked = currentUser ? likeStorage.isLiked(currentUser.id, post.id, 'post') : false;
        
        return `
            <div class="search-post-item">
                <div class="post-header">
                    <img src="${author?.avatar || getRandomAvatar(post.authorId)}" 
                         alt="${author?.nickname || '用户'}" class="author-avatar">
                    <div class="author-info">
                        <div class="author-name">${author?.nickname || '未知用户'}</div>
                        <div class="post-time">${formatTime(post.createdAt)}</div>
                    </div>
                </div>
                
                <div class="post-content">
                    <div class="post-text">${this.highlightQuery(truncateText(post.content, 150))}</div>
                    ${post.images.length > 0 ? `
                        <div class="post-images-preview">
                            ${post.images.slice(0, 3).map(img => `
                                <img src="${img}" alt="动态图片">
                            `).join('')}
                            ${post.images.length > 3 ? `<span class="more-images">+${post.images.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="post-stats">
                    <span class="stat-item ${isLiked ? 'liked' : ''}" onclick="searchManager.toggleLikeFromSearch('${post.id}')">
                        <i class="fas fa-heart"></i>
                        ${formatNumber(post.stats.likesCount)}
                    </span>
                    <span class="stat-item">
                        <i class="fas fa-comment"></i>
                        ${formatNumber(post.stats.commentsCount)}
                    </span>
                    <button class="btn btn-outline btn-sm" onclick="searchManager.viewPost('${post.id}')">
                        查看详情
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 高亮搜索关键词
     * @param {string} text 原文本
     * @returns {string}
     */
    highlightQuery(text) {
        if (!this.currentQuery || !text) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(this.currentQuery)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * 转义正则表达式特殊字符
     * @param {string} string 字符串
     * @returns {string}
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    /**
     * 清除搜索结果
     */
    clearResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-search"></i>
                    <p>输入关键词开始搜索</p>
                </div>
            `;
        }
        this.searchResults = [];
    }
    
    /**
     * 从搜索结果中切换关注状态
     * @param {string} userId 用户ID
     */
    toggleFollowFromSearch(userId) {
        socialManager.toggleFollow(userId);
        
        // 更新搜索结果中的按钮状态
        setTimeout(() => {
            if (this.currentQuery) {
                this.performSearch(this.currentQuery);
            }
        }, 100);
    }
    
    /**
     * 从搜索结果中切换点赞状态
     * @param {string} postId 动态ID
     */
    toggleLikeFromSearch(postId) {
        if (!authManager.isLoggedIn()) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }
        
        const currentUser = authManager.getCurrentUser();
        likeStorage.toggleLike(currentUser.id, postId, 'post');
        
        // 更新搜索结果中的点赞状态
        setTimeout(() => {
            if (this.currentQuery) {
                this.performSearch(this.currentQuery);
            }
        }, 100);
    }
    
    /**
     * 查看用户资料
     * @param {string} userId 用户ID
     */
    viewUserProfile(userId) {
        // 这里可以跳转到用户详情页或显示用户资料弹窗
        console.log('查看用户资料:', userId);
        showToast('用户详情页开发中...', 'info');
    }
    
    /**
     * 查看动态详情
     * @param {string} postId 动态ID
     */
    viewPost(postId) {
        // 这里可以跳转到动态详情页或显示动态详情弹窗
        console.log('查看动态详情:', postId);
        showToast('动态详情页开发中...', 'info');
    }
    
    /**
     * 获取搜索历史
     * @returns {array}
     */
    getSearchHistory() {
        return storage.get('searchHistory', []);
    }
    
    /**
     * 添加搜索历史
     * @param {string} query 搜索查询
     */
    addSearchHistory(query) {
        if (!query || query.length < 2) return;
        
        const history = this.getSearchHistory();
        const filteredHistory = history.filter(item => item !== query);
        
        filteredHistory.unshift(query);
        
        // 只保留最近10条搜索历史
        const newHistory = filteredHistory.slice(0, 10);
        storage.set('searchHistory', newHistory);
    }
    
    /**
     * 清除搜索历史
     */
    clearSearchHistory() {
        storage.remove('searchHistory');
        showToast('搜索历史已清除', 'success');
    }
}

// 创建全局搜索管理器实例
const searchManager = new SearchManager();

// 导出到全局作用域
window.searchManager = searchManager;
window.SearchManager = SearchManager;
