// 搜索页面功能

// 全局变量
let currentSearchType = 'content';
let searchKeyword = '';

// DOM元素
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchTabs = document.querySelectorAll('.search-tab');
const searchPanes = document.querySelectorAll('.search-pane');

// 搜索结果容器
const contentResults = document.getElementById('contentResults');
const tagsResults = document.getElementById('tagsResults');
const usersResults = document.getElementById('usersResults');

// 结果计数
const contentCount = document.getElementById('contentCount');
const tagsCount = document.getElementById('tagsCount');
const usersCount = document.getElementById('usersCount');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initSearchPage();
    
    // 从URL参数获取搜索关键词
    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('q');
    if (keyword) {
        searchInput.value = keyword;
        searchKeyword = keyword;
        performSearch();
    }
});

/**
 * 初始化搜索页面
 */
function initSearchPage() {
    // 绑定搜索按钮事件
    searchBtn.addEventListener('click', performSearch);
    
    // 绑定回车键搜索
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 绑定搜索类型切换
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            switchSearchTab(tabType);
        });
    });
    
    // 调用common.js中的登录状态检查
    if (typeof checkLoginStatus === 'function') {
        checkLoginStatus();
    }
    
    // 绑定主题切换
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            if (typeof toggleTheme === 'function') {
                toggleTheme();
            }
        });
    }
}

/**
 * 执行搜索
 */
function performSearch() {
    searchKeyword = searchInput.value.trim();
    
    if (!searchKeyword) {
        showEmptyState('请输入搜索关键词');
        return;
    }
    
    // 更新URL参数
    const url = new URL(window.location);
    url.searchParams.set('q', searchKeyword);
    window.history.pushState({}, '', url);
    
    // 根据当前搜索类型执行搜索
    switch (currentSearchType) {
        case 'content':
            searchContent(searchKeyword);
            break;
        case 'tags':
            searchTags(searchKeyword);
            break;
        case 'users':
            searchUsers(searchKeyword);
            break;
    }
}

/**
 * 切换搜索类型标签
 */
function switchSearchTab(tabType) {
    // 更新当前搜索类型
    currentSearchType = tabType;
    
    // 更新标签状态
    searchTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabType) {
            tab.classList.add('active');
        }
    });
    
    // 更新面板显示
    searchPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabType + 'Pane') {
            pane.classList.add('active');
        }
    });
    
    // 如果有搜索关键词，执行搜索
    if (searchKeyword) {
        performSearch();
    } else {
        showEmptyState('请输入搜索关键词');
    }
}

/**
 * 搜索内容
 */
function searchContent(keyword) {
    const allPosts = JSON.parse(localStorage.getItem('postList') || '[]');
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    
    // 过滤掉被封禁用户的帖子
    const filteredPosts = allPosts.filter(post => {
        if (!post.user || !post.user.name) return false;
        const user = userList.find(u => u.username === post.user.name);
        return !user || !user.banned;
    });
    
    // 搜索匹配的帖子
    const matchedPosts = filteredPosts.filter(post => {
        const content = post.content.toLowerCase();
        const nickname = (post.user.nickname || '').toLowerCase();
        const username = (post.user.name || '').toLowerCase();
        
        return content.includes(keyword.toLowerCase()) ||
               nickname.includes(keyword.toLowerCase()) ||
               username.includes(keyword.toLowerCase());
    });
    
    // 渲染搜索结果
    renderContentResults(matchedPosts, keyword);
    contentCount.textContent = matchedPosts.length;
}

/**
 * 渲染内容搜索结果
 */
function renderContentResults(posts, keyword) {
    if (posts.length === 0) {
        contentResults.classList.add('empty-state-container');
        contentResults.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-search"></i>
                <h3>未找到相关内容</h3>
                <p>尝试使用其他关键词搜索</p>
            </div>
        `;
        return;
    }
    
    // 移除空状态容器类
    contentResults.classList.remove('empty-state-container');
    
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    
    contentResults.innerHTML = posts.map(post => {
        // 从userList中获取最新的用户信息
        const latestUserInfo = userList.find(u => u.username === post.user.name);
        const userAvatar = latestUserInfo?.avatar || post.user.avatar || 'src/images/DefaultAvatar.png';
        
        // 高亮搜索关键词
        const highlightedContent = highlightKeyword(post.content, keyword);
        
        return `
            <div class="content-item">
                <div class="content-avatar" onclick="visitUserProfile('${post.user.name}')" style="cursor: pointer;" title="点击查看用户主页">
                    <img src="${userAvatar}" alt="用户头像">
                </div>
                <div class="content-info">
                    <div class="content-author" onclick="visitUserProfile('${post.user.name}')" style="cursor: pointer; color: var(--primary-color);" title="点击查看用户主页">${post.user.nickname || post.user.name}</div>
                    <div class="content-time">${formatTime(post.time)}</div>
                    <div class="content-text">${highlightedContent}</div>
                    <div class="content-stats">
                        <span><i class="bi bi-heart"></i> ${post.likes || 0}</span>
                        <span><i class="bi bi-chat"></i> ${post.comments ? post.comments.length : 0}</span>
                        <span><i class="bi bi-bookmark"></i> ${post.bookmarkedBy ? post.bookmarkedBy.length : 0}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // 为内容搜索结果添加悬停效果
    const contentItems = contentResults.querySelectorAll('.content-item');
    contentItems.forEach(item => {
        const avatar = item.querySelector('.content-avatar');
        const author = item.querySelector('.content-author');
        
        // 头像悬停效果
        if (avatar) {
            avatar.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transition = 'transform 0.2s ease';
            });
            
            avatar.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        }
        
        // 作者名悬停效果
        if (author) {
            author.addEventListener('mouseenter', function() {
                this.style.textDecoration = 'underline';
            });
            
            author.addEventListener('mouseleave', function() {
                this.style.textDecoration = 'none';
            });
        }
    });
}

/**
 * 搜索话题标签
 */
function searchTags(keyword) {
    const allPosts = JSON.parse(localStorage.getItem('postList') || '[]');
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    
    // 收集所有话题标签
    const tagMap = new Map();
    
    allPosts.forEach(post => {
        // 检查用户是否被封禁
        if (post.user && post.user.name) {
            const user = userList.find(u => u.username === post.user.name);
            if (user && user.banned) return;
        }
        
        // 提取话题标签
        let tags = [];
        if (post.topics && post.topics.length > 0) {
            tags = post.topics;
        } else {
            // 从内容中提取话题标签
            const topicMatches = post.content.match(/#(\S+)/g);
            if (topicMatches) {
                tags = topicMatches.map(tag => tag.substring(1));
            }
        }
        
        // 统计话题使用情况
        tags.forEach(tag => {
            if (tagMap.has(tag)) {
                const tagInfo = tagMap.get(tag);
                tagInfo.count++;
                tagInfo.posts.push(post);
            } else {
                tagMap.set(tag, {
                    name: tag,
                    count: 1,
                    posts: [post]
                });
            }
        });
    });
    
    // 过滤匹配的话题
    const matchedTags = Array.from(tagMap.values()).filter(tag => 
        tag.name.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // 渲染搜索结果
    renderTagsResults(matchedTags, keyword);
    tagsCount.textContent = matchedTags.length;
}

/**
 * 渲染话题搜索结果
 */
function renderTagsResults(tags, keyword) {
    if (tags.length === 0) {
        tagsResults.classList.add('empty-state-container');
        tagsResults.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-tags"></i>
                <h3>未找到相关话题</h3>
                <p>尝试使用其他关键词搜索</p>
            </div>
        `;
        return;
    }
    
    // 移除空状态容器类
    tagsResults.classList.remove('empty-state-container');
    
    tagsResults.innerHTML = tags.map(tag => {
        const highlightedName = highlightKeyword(tag.name, keyword);
        const recentPosts = tag.posts.slice(0, 3); // 显示最近3个帖子
        
        return `
            <div class="tag-item" onclick="searchTag('${tag.name}')" style="cursor: pointer;" title="点击搜索此话题">
                <div class="tag-header">
                    <div class="tag-icon">
                        <i class="bi bi-tag"></i>
                    </div>
                    <div class="tag-name">${highlightedName}</div>
                </div>
                <div class="tag-stats">
                    <span>${tag.count} 个帖子</span>
                    <span>${tag.posts.length} 次使用</span>
                </div>
                <div class="tag-description">
                    这是一个热门话题，有 ${tag.count} 个相关帖子
                </div>
                <div class="tag-posts">
                    ${recentPosts.map(post => `
                        <span class="tag-post-preview">${post.content.substring(0, 20)}...</span>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // 为话题搜索结果添加悬停效果
    const tagItems = tagsResults.querySelectorAll('.tag-item');
    tagItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
    });
}

/**
 * 搜索用户
 */
function searchUsers(keyword) {
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 过滤匹配的用户
    const matchedUsers = userList.filter(user => {
        const nickname = (user.nickname || '').toLowerCase();
        const username = (user.username || '').toLowerCase();
        const bio = (user.bio || '').toLowerCase();
        
        return nickname.includes(keyword.toLowerCase()) ||
               username.includes(keyword.toLowerCase()) ||
               bio.includes(keyword.toLowerCase());
    });
    
    // 渲染搜索结果
    renderUsersResults(matchedUsers, keyword, currentUser);
    usersCount.textContent = matchedUsers.length;
}

/**
 * 渲染用户搜索结果
 */
function renderUsersResults(users, keyword, currentUser) {
    if (users.length === 0) {
        usersResults.classList.add('empty-state-container');
        usersResults.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-people"></i>
                <h3>未找到相关用户</h3>
                <p>尝试使用其他关键词搜索</p>
            </div>
        `;
        return;
    }
    
    // 移除空状态容器类
    usersResults.classList.remove('empty-state-container');
    
    usersResults.innerHTML = users.map(user => {
        const highlightedName = highlightKeyword(user.nickname || user.username, keyword);
        const highlightedUsername = highlightKeyword(user.username, keyword);
        
        // 检查是否已关注
        const isFollowing = currentUser && currentUser.following && 
                           currentUser.following.includes(user.username);
        
        // 检查是否是当前用户
        const isCurrentUser = currentUser && currentUser.username === user.username;
        
        let followButton = '';
        if (!isCurrentUser) {
            followButton = `
                <button class="btn-follow-user ${isFollowing ? 'following' : ''}" 
                        onclick="event.stopPropagation(); toggleFollowUser('${user.username}', this)">
                    ${isFollowing ? '已关注' : '关注'}
                </button>
            `;
        }
        
        return `
            <div class="user-item" onclick="visitUserProfile('${user.username}')" style="cursor: pointer;">
                <div class="user-avatar">
                    <img src="${user.avatar || 'src/images/DefaultAvatar.png'}" alt="用户头像">
                </div>
                <div class="user-info">
                    <div class="user-name">${highlightedName}</div>
                    <div class="user-username">@${highlightedUsername}</div>
                    <div class="user-bio">${user.bio || '这个人很懒，还没有写个人简介'}</div>
                    <div class="user-stats">
                        <span>${user.postCount || 0} 动态</span>
                        <span>${user.following ? user.following.length : 0} 关注</span>
                        <span>${user.followers ? user.followers.length : 0} 粉丝</span>
                    </div>
                </div>
                <div class="user-actions">
                    ${followButton}
                </div>
            </div>
        `;
    }).join('');
    
    // 添加用户卡片的悬停效果
    const userItems = usersResults.querySelectorAll('.user-item');
    userItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        });
    });
}

/**
 * 高亮搜索关键词
 */
function highlightKeyword(text, keyword) {
    if (!keyword) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<span class="content-highlight">$1</span>');
}

/**
 * 切换关注用户
 */
function toggleFollowUser(username, button) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        alert('请先登录');
        return;
    }
    
    // 检查用户是否被封禁
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === currentUser.username);
    if (user && user.banned) {
        alert('当前账号被封禁，无法操作');
        return;
    }
    
    if (currentUser.username === username) {
        alert('不能关注自己');
        return;
    }
    
    // 获取用户列表
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    
    // 找到当前用户和目标用户
    const currentUserIndex = users.findIndex(u => u.username === currentUser.username);
    const targetUserIndex = users.findIndex(u => u.username === username);
    
    if (currentUserIndex === -1 || targetUserIndex === -1) {
        alert('用户不存在');
        return;
    }
    
    const currentUserData = users[currentUserIndex];
    const targetUserData = users[targetUserIndex];
    
    // 检查是否已经关注
    const isFollowing = currentUserData.following && currentUserData.following.includes(username);
    
    if (isFollowing) {
        // 取消关注
        currentUserData.following = currentUserData.following.filter(name => name !== username);
        targetUserData.followers = targetUserData.followers.filter(name => name !== currentUser.username);
        button.textContent = '关注';
        button.classList.remove('following');
    } else {
        // 添加关注
        if (!currentUserData.following) currentUserData.following = [];
        if (!targetUserData.followers) targetUserData.followers = [];
        
        currentUserData.following.push(username);
        targetUserData.followers.push(currentUser.username);
        button.textContent = '已关注';
        button.classList.add('following');
    }
    
    // 保存更新
    localStorage.setItem('userList', JSON.stringify(users));
    
    // 更新当前用户信息
    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
    
    // 显示成功消息
    const message = isFollowing ? '已取消关注' : '关注成功';
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else {
        alert(message);
    }
}

/**
 * 显示空状态
 */
function showEmptyState(message) {
    const activePane = document.querySelector('.search-pane.active');
    if (activePane) {
        const resultsContainer = activePane.querySelector('[id$="Results"]');
        if (resultsContainer) {
            // 添加空状态容器类
            resultsContainer.classList.add('empty-state-container');
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-search"></i>
                    <h3>${message}</h3>
                    <p>输入关键词开始搜索</p>
                </div>
            `;
        }
    }
}

/**
 * 格式化时间
 */
function formatTime(date) {
    const now = new Date();
    const time = new Date(date);
    const diff = now - time;
    
    // 小于1分钟
    if (diff < 60 * 1000) {
        return '刚刚';
    }
    
    // 小于1小时
    if (diff < 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 1000))}分钟前`;
    }
    
    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
        return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    }
    
    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
        return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
    }
    
    // 大于30天，显示具体日期
    const year = time.getFullYear();
    const month = time.getMonth() + 1;
    const day = time.getDate();
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

/**
 * 跳转到用户个人主页
 * @param {string} username - 用户名
 */
function visitUserProfile(username) {
    // 获取用户列表
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === username);
    
    if (!user) {
        alert('用户不存在');
        return;
    }
    
    // 跳转到个人主页，传递用户ID作为参数
    window.location.href = `profile.html?userId=${user.id}`;
}

/**
 * 搜索指定话题
 * @param {string} tagName - 话题名称
 */
function searchTag(tagName) {
    // 确保当前在话题标签页
    if (currentSearchType !== 'tags') {
        switchSearchTab('tags');
    }
    
    // 设置搜索关键词为话题名称
    searchInput.value = tagName;
    searchKeyword = tagName;
    
    // 显示该话题相关的动态
    showTagPosts(tagName);
    
    // 更新URL参数
    const url = new URL(window.location);
    url.searchParams.set('q', tagName);
    window.history.pushState({}, '', url);
}

/**
 * 显示指定话题相关的动态
 * @param {string} tagName - 话题名称
 */
function showTagPosts(tagName) {
    const allPosts = JSON.parse(localStorage.getItem('postList') || '[]');
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    
    // 过滤掉被封禁用户的帖子
    const filteredPosts = allPosts.filter(post => {
        if (!post.user || !post.user.name) return false;
        const user = userList.find(u => u.username === post.user.name);
        return !user || !user.banned;
    });
    
    // 查找包含该话题的帖子
    const tagPosts = filteredPosts.filter(post => {
        // 检查topics字段
        if (post.topics && post.topics.length > 0) {
            return post.topics.some(topic => 
                topic.toLowerCase() === tagName.toLowerCase()
            );
        }
        
        // 从内容中提取话题标签
        const topicMatches = post.content.match(/#(\S+)/g);
        if (topicMatches) {
            const topics = topicMatches.map(tag => tag.substring(1));
            return topics.some(topic => 
                topic.toLowerCase() === tagName.toLowerCase()
            );
        }
        
        return false;
    });
    
    // 渲染话题相关的动态
    renderTagPosts(tagPosts, tagName);
    
    // 更新结果计数
    tagsCount.textContent = tagPosts.length;
}

/**
 * 渲染话题相关的动态
 * @param {Array} posts - 动态数组
 * @param {string} tagName - 话题名称
 */
function renderTagPosts(posts, tagName) {
    if (posts.length === 0) {
        tagsResults.classList.add('empty-state-container');
        tagsResults.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-tags"></i>
                <h3>未找到包含话题"${tagName}"的动态</h3>
                <p>尝试搜索其他话题</p>
            </div>
        `;
        return;
    }
    
    // 移除空状态容器类
    tagsResults.classList.remove('empty-state-container');
    
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    
    tagsResults.innerHTML = `
        <div class="tag-posts-header">
            <div class="tag-posts-title">
                <h3>话题"${tagName}"相关的动态 (${posts.length}条)</h3>
            </div>
            <button class="btn-back-to-tags" onclick="backToTagsSearch()">
                <i class="bi bi-arrow-left"></i> 返回话题搜索
            </button>
        </div>
        <div class="tag-posts-grid">
            ${posts.map(post => {
                // 从userList中获取最新的用户信息
                const latestUserInfo = userList.find(u => u.username === post.user.name);
                const userAvatar = latestUserInfo?.avatar || post.user.avatar || 'src/images/DefaultAvatar.png';
                
                // 高亮话题标签
                const highlightedContent = highlightKeyword(post.content, tagName);
                
                // 处理图片显示
                let imagesHTML = '';
                if (post.images && post.images.length > 0) {
                    const imageStorage = JSON.parse(localStorage.getItem('imageStorage') || '{}');
                    const processedImages = post.images.map(imgPath => {
                        if (imgPath.startsWith('user_uploads/')) {
                            return imageStorage[imgPath] || 'src/images/DefaultAvatar.png';
                        }
                        return imgPath;
                    });
                    
                    if (processedImages.length === 1) {
                        imagesHTML = `<div class="post-image"><img src="${processedImages[0]}" alt="动态图片"></div>`;
                    } else if (processedImages.length >= 2) {
                        imagesHTML = `<div class="post-images-grid"><img src="${processedImages[0]}" alt="动态图片"><img src="${processedImages[1]}" alt="动态图片"></div>`;
                    }
                }
                
                return `
                    <div class="post-card" onclick="viewPostDetail(${post.id})" style="cursor: pointer;">
                        <div class="post-card-header">
                            <div class="post-author" onclick="event.stopPropagation(); visitUserProfile('${post.user.name}')" style="cursor: pointer;">
                                <img src="${userAvatar}" alt="用户头像" class="author-avatar">
                                <span class="author-name">${post.user.nickname || post.user.name}</span>
                            </div>
                            <div class="post-time">${formatTime(post.time)}</div>
                        </div>
                        <div class="post-card-content">
                            <div class="post-text">${highlightedContent}</div>
                            ${imagesHTML}
                        </div>
                        <div class="post-card-footer">
                            <div class="post-stats">
                                <span><i class="bi bi-heart"></i> ${post.likes || 0}</span>
                                <span><i class="bi bi-chat"></i> ${post.comments ? post.comments.length : 0}</span>
                                <span><i class="bi bi-bookmark"></i> ${post.bookmarkedBy ? post.bookmarkedBy.length : 0}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    // 为卡片添加悬停效果
    const postCards = tagsResults.querySelectorAll('.post-card');
    postCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        });
    });
    
    // 为作者头像和姓名添加悬停效果
    const postAuthors = tagsResults.querySelectorAll('.post-author');
    postAuthors.forEach(author => {
        author.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
        });
        
        author.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
        });
    });
}

/**
 * 返回话题搜索
 */
function backToTagsSearch() {
    // 清空搜索框
    searchInput.value = '';
    searchKeyword = '';
    
    // 重新执行话题搜索
    searchTags('');
    
    // 更新URL参数
    const url = new URL(window.location);
    url.searchParams.delete('q');
    window.history.pushState({}, '', url);
}

/**
 * 查看动态详情
 * @param {number} postId - 动态ID
 */
function viewPostDetail(postId) {
    // 跳转到动态详情页面或显示动态详情弹窗
    // 这里可以根据需要实现具体的跳转逻辑
    console.log('查看动态详情:', postId);
    // 暂时显示提示信息
    alert('动态详情功能开发中...');
}

// 确保全局可用
window.toggleFollowUser = toggleFollowUser;
window.visitUserProfile = visitUserProfile;
window.searchTag = searchTag;
window.backToTagsSearch = backToTagsSearch;
window.viewPostDetail = viewPostDetail; 