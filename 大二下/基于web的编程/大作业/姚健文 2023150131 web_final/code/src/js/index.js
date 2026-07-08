/**
 * 荔荔社区 - 首页JavaScript功能
 */

// 分页相关变量
let currentPage = 1;
let postsPerPage = 5; // 每页显示的帖子数量
let allFilteredPosts = []; // 存储所有过滤后的帖子
let currentTabType = 'all'; // 当前标签类型

// 检查用户是否被封禁
function checkUserBanStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.banned) {
        // 修改：不再阻止进入系统，只记录封禁状态
        // 封禁限制将在具体的交互功能中实现
        console.log('用户已被封禁，但允许进入系统');
        return true; // 返回true允许进入
    }
    return true;
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 检查用户封禁状态
    if (!checkUserBanStatus()) {
        return;
    }
    
    // 首页加载时初始化预设用户
    initPresetUsers();
    
    // 初始化内容切换标签
    initContentTabs();
    
    // 初始化动态加载
    initPostsLoading();
    
    // 初始化动态交互
    initPostInteractions();
    
    // 自动加载全站动态内容
    loadPosts('all');
    
    // 初始化打卡签到功能
    initCheckinModule();
});

/**
 * 初始化内容切换标签
 */
function initContentTabs() {
    const tabs = document.querySelectorAll('.content-tabs .tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            tabs.forEach(t => t.classList.remove('active'));
            
            // 添加当前标签的active类
            this.classList.add('active');
            
            // 获取标签类型
            const tabType = this.dataset.tab;
            
            // 加载对应类型的动态
            loadPosts(tabType);
        });
    });
}

/**
 * 加载动态内容
 * @param {string} type - 动态类型 (all, following, hot)
 * @param {boolean} append - 是否追加内容
 */
function loadPosts(type = 'all', append = false) {
    const postsList = document.querySelector('.posts-list');
    
    // 如果不是追加，则重置分页状态
    if (!append) {
        currentPage = 1;
        currentTabType = type;
        postsList.innerHTML = '';
        // 加载中提示可选加在postsList上方
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = '加载中...';
        postsList.appendChild(loadingDiv);
    }
    
    setTimeout(() => {
        // 移除加载提示
        const loading = postsList.querySelector('.loading');
        if (loading) {
            postsList.removeChild(loading);
        }
        
        // 获取所有过滤后的动态数据
        if (!append) {
            allFilteredPosts = getPostsData(type);
        }
        
        // 计算当前页应该显示的帖子
        const startIndex = (currentPage - 1) * postsPerPage;
        const endIndex = startIndex + postsPerPage;
        const currentPagePosts = allFilteredPosts.slice(startIndex, endIndex);
        
        // 如果没有数据
        if (allFilteredPosts.length === 0) {
            postsList.innerHTML = '<div class="no-content">暂无内容</div>';
            updateLoadMoreButton(false);
            return;
        }
        
        // 渲染动态
        currentPagePosts.forEach(post => {
            postsList.insertAdjacentHTML('beforeend', createPostHTML(post));
        });
        
        // 检查是否还有更多内容
        const hasMorePosts = endIndex < allFilteredPosts.length;
        updateLoadMoreButton(hasMorePosts);
        
        // 重新绑定交互事件
        initPostInteractions();
    }, 500);
}

/**
 * 获取动态数据（从localStorage）
 * @param {string} type - 动态类型
 * @returns {Array} 动态数据数组
 */
function getPostsData(type) {
    let allPosts = JSON.parse(localStorage.getItem('postList'));
    if (!allPosts) {
        // 初始化默认动态
        allPosts = [
            {
                id: 1,
                user: {
                    id: 1750516625143,
                    name: 'study_master',
                    nickname: '学习达人',
                    avatar: 'src/images/DefaultAvatar.png',
                    department: '计算机学院'
                },
                content: '期末复习攻略分享！#期末复习 #学习方法\n1. 制定合理的复习计划，分配每天的学习任务\n2. 整理笔记和重点知识点，制作思维导图\n3. 多做习题，找出自己的薄弱环节\n4. 保持良好的作息，确保充足的睡眠',
                images: ['src/images/DefaultAvatar.png'],
                time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
                likes: 42,
                visibility: 'public', // 公开
                comments: [
                    {
                        id: 201,
                        user: {
                            id: 1750516625144,
                            name: 'photo_lover',
                            nickname: '摄影爱好者',
                            avatar: 'src/images/DefaultAvatar.png'
                        },
                        content: '非常实用的复习方法，谢谢分享！',
                        time: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1小时前
                        likes: 5
                    }
                ]
            },
            {
                id: 2,
                user: {
                    id: 1750516625144,
                    name: 'photo_lover',
                    nickname: '摄影爱好者',
                    avatar: 'src/images/DefaultAvatar.png',
                    department: '艺术学院'
                },
                content: '校园的春天真美！分享几张今天拍的照片 #校园风光 #摄影',
                images: ['src/images/DefaultAvatar.png', 'src/images/DefaultAvatar.png'],
                time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
                likes: 78,
                visibility: 'public', // 公开
                comments: []
            },
            {
                id: 3,
                user: {
                    id: 1750516625145,
                    name: 'campus_singer',
                    nickname: '校园歌手',
                    avatar: 'src/images/DefaultAvatar.png',
                    department: '音乐学院'
                },
                content: '校园歌手大赛开始报名啦！欢迎所有热爱音乐的同学参加 #校园活动 #音乐\n时间：5月20日-6月10日\n地点：大学生活动中心\n报名方式：扫描下方二维码或到学生会办公室登记',
                images: ['src/images/DefaultAvatar.png'],
                time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
                likes: 156,
                visibility: 'public', // 公开
                comments: []
            },
            {
                id: 4,
                user: {
                    id: 104,
                    name: 'food_lover',
                    nickname: '美食达人',
                    avatar: 'src/images/DefaultAvatar.png',
                    department: '食品学院'
                },
                content: '今天在食堂发现了一道超级好吃的菜！推荐给大家 #校园美食 #美食分享\n菜品：红烧肉\n价格：8元\n位置：第一食堂二楼\n评分：⭐⭐⭐⭐⭐',
                images: ['src/images/DefaultAvatar.png'],
                time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6小时前
                likes: 89,
                visibility: 'followers', // 粉丝可见
                comments: []
            },
            {
                id: 5,
                user: {
                    id: 105,
                    name: 'sports_enthusiast',
                    nickname: '运动健将',
                    avatar: 'src/images/DefaultAvatar.png',
                    department: '体育学院'
                },
                content: '今天在体育馆打篮球，感觉特别棒！ #运动 #篮球\n运动不仅能锻炼身体，还能放松心情。建议大家多参加体育活动！',
                images: ['src/images/DefaultAvatar.png'],
                time: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12小时前
                likes: 34,
                visibility: 'public', // 公开
                comments: []
            }
        ];
        localStorage.setItem('postList', JSON.stringify(allPosts));
    }
    
    // 获取用户列表，用于检查封禁状态
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    
    // 添加调试信息
    console.log('用户列表:', userList);
    console.log('被封禁的用户:', userList.filter(u => u.banned).map(u => u.username));
    
    // 过滤掉被封禁用户发布的帖子
    allPosts = allPosts.filter(post => {
        if (!post.user || !post.user.name) return true; // 保留没有用户信息的帖子
        
        // 查找用户是否被封禁
        const user = userList.find(u => u.username === post.user.name);
        
        // 添加调试信息
        if (user && user.banned) {
            console.log(`过滤掉被封禁用户的帖子: ${post.user.name} (帖子ID: ${post.id})`);
        } else if (user) {
            console.log(`用户 ${post.user.name} 未被封禁，保留帖子`);
        } else {
            console.log(`未找到用户 ${post.user.name}，保留帖子`);
        }
        
        return !user || !user.banned; // 如果用户不存在或未被封禁，则显示帖子
    });
    
    console.log(`过滤后剩余帖子数量: ${allPosts.length}`);
    
    // 根据类型过滤动态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    switch (type) {
        case 'all':
            // 全站动态：显示所有公开动态和粉丝可见动态（如果当前用户是粉丝）
            return allPosts.filter(post => {
                if (post.visibility === 'public') return true;
                if (post.visibility === 'followers' && currentUser) {
                    // 检查当前用户是否是发布者的粉丝
                    const postUser = userList.find(u => u.username === post.user.name);
                    return postUser && postUser.followers && postUser.followers.includes(currentUser.username);
                }
                return false;
            });
            
        case 'following':
            // 关注动态：只显示当前用户关注的人发布的动态
            if (!currentUser || !currentUser.following) return [];
            return allPosts.filter(post => 
                currentUser.following.includes(post.user.name)
            );
            
        case 'hot':
            // 热门动态：按点赞数排序
            return allPosts
                .filter(post => post.visibility === 'public')
                .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                .slice(0, 10); // 只显示前10条热门动态
                
        default:
            return allPosts.filter(post => post.visibility === 'public');
    }
}

/**
 * 创建动态HTML
 * @param {Object} post - 动态数据
 * @returns {string} 动态HTML字符串
 */
function createPostHTML(post) {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 从userList中获取最新的用户信息（包括头像）
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const latestUserInfo = userList.find(u => u.username === post.user.name);
    
    // 使用最新的头像信息
    const userAvatar = latestUserInfo?.avatar || post.user.avatar || 'src/images/DefaultAvatar.png';
    
    // 判断是否显示关注按钮还是删除按钮
    let actionButtonHTML = '';
    if (currentUser && (currentUser.username === post.user.name || currentUser.id === post.user.id)) {
        // 如果是当前用户发布的动态，显示删除按钮
        actionButtonHTML = `<button class="btn-delete" data-post-id="${post.id}">删除</button>`;
    } else {
        // 如果不是当前用户发布的动态，显示关注按钮
        // 检查关注状态：通过用户ID或用户名判断
        const isFollowing = currentUser && currentUser.following && (
            currentUser.following.includes(post.user.id) || 
            currentUser.following.includes(post.user.name)
        );
        const buttonText = isFollowing ? '已关注' : '关注';
        const buttonClass = isFollowing ? 'btn-follow following' : 'btn-follow';
        const buttonStyle = isFollowing ? 'style="background-color: #e0e0e0; color: #666;"' : '';
        actionButtonHTML = `<button class="${buttonClass}" data-user-id="${post.user.id}" data-user-name="${post.user.name}" ${buttonStyle}>${buttonText}</button>`;
    }
    
    // 检查当前用户是否已点赞此动态
    const isLiked = post.likedBy && post.likedBy.includes(currentUser?.username);
    const likeIconClass = isLiked ? 'bi-heart-fill' : 'bi-heart';
    const likeButtonClass = isLiked ? 'btn-like active' : 'btn-like';
    
    // 检查当前用户是否已收藏此动态
    const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(currentUser?.username);
    const bookmarkIconClass = isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark';
    const bookmarkButtonClass = isBookmarked ? 'btn-bookmark active' : 'btn-bookmark';
    
    // 处理图片展示
    let imagesHTML = '';
    if (post.images && post.images.length > 0) {
        // 获取图片存储数据
        const imageStorage = JSON.parse(localStorage.getItem('imageStorage') || '{}');
        
        // 处理图片路径，如果是用户上传的图片，从imageStorage中获取
        const processedImages = post.images.map(imgPath => {
            // 如果是用户上传的图片路径（以user_uploads开头）
            if (imgPath.startsWith('user_uploads/')) {
                return imageStorage[imgPath] || 'src/images/DefaultAvatar.png';
            }
            // 如果是本地图片路径，直接使用
            return imgPath;
        });
        
        if (processedImages.length === 1) {
            imagesHTML = `
                <div class="post-images">
                    <img src="${processedImages[0]}" alt="动态图片">
                </div>
            `;
        } else if (processedImages.length === 2) {
            imagesHTML = `
                <div class="post-images grid-2">
                    <img src="${processedImages[0]}" alt="动态图片">
                    <img src="${processedImages[1]}" alt="动态图片">
                </div>
            `;
        } else if (processedImages.length >= 3) {
            imagesHTML = `
                <div class="post-images grid-3">
                    <img src="${processedImages[0]}" alt="动态图片">
                    <img src="${processedImages[1]}" alt="动态图片">
                    <img src="${processedImages[2]}" alt="动态图片">
                </div>
            `;
        }
    }
    
    // 处理评论展示
    let commentsHTML = '';
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(comment => {
            // 兼容两种数据结构
            const commentUser = comment.user || {
                name: comment.nickname || comment.username,
                avatar: comment.avatar
            };
            const commentTime = comment.time || comment.publishTime;
            
            // 从userList中获取评论者的最新头像
            const commenterLatestInfo = userList.find(u => u.username === commentUser.name);
            const commenterAvatar = commenterLatestInfo?.avatar || commentUser.avatar || 'src/images/DefaultAvatar.png';
            
            // 检查当前用户是否已点赞此评论
            const isLiked = comment.likedBy && comment.likedBy.includes(currentUser?.username);
            const likeIconClass = isLiked ? 'bi-heart-fill' : 'bi-heart';
            const likeButtonClass = isLiked ? 'btn-like-comment active' : 'btn-like-comment';
            
            commentsHTML += `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <img src="${commenterAvatar}" alt="用户头像" class="user-avatar-clickable" data-user-id="${commentUser.id || commentUser.name}" data-user-name="${commentUser.name}" style="cursor: pointer;">
                    <div class="comment-content">
                        <h4>${commentUser.name}</h4>
                        <p>${comment.content}</p>
                        <div class="comment-actions">
                            <span>${formatTime(commentTime)}</span>
                            <button class="btn-reply">回复</button>
                            <button class="${likeButtonClass}"><i class="bi ${likeIconClass}"></i> ${comment.likes || 0}</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // 格式化内容，处理换行和话题标签
    const formattedContent = post.content
        .replace(/\n/g, '</p><p>')
        .replace(/#(\S+)/g, '<a href="#" class="topic">#$1</a>');
    
    // 处理话题标签显示
    let topicsHTML = '';
    let topics = [];
    
    // 优先使用动态对象中的topics字段
    if (post.topics && post.topics.length > 0) {
        topics = post.topics;
    } else {
        // 如果没有topics字段，从内容中提取话题标签
        const topicMatches = post.content.match(/#(\S+)/g);
        if (topicMatches) {
            topics = topicMatches.map(tag => tag.substring(1)); // 去掉#号
        }
    }
    
    if (topics.length > 0) {
        topicsHTML = `
            <div class="post-topics">
                ${topics.map(topic => `<span class="topic-tag">#${topic}</span>`).join('')}
            </div>
        `;
    }
    
    // 可见性标识
    let visibilityIcon = '';
    let visibilityText = '';
    switch (post.visibility) {
        case 'public':
            visibilityIcon = '<i class="bi bi-globe"></i>';
            visibilityText = '公开';
            break;
        case 'followers':
            visibilityIcon = '<i class="bi bi-people"></i>';
            visibilityText = '粉丝可见';
            break;
        case 'private':
            visibilityIcon = '<i class="bi bi-lock"></i>';
            visibilityText = '私密';
            break;
        default:
            visibilityIcon = '<i class="bi bi-globe"></i>';
            visibilityText = '公开';
    }
    
    return `
        <article class="post-item" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${userAvatar}" alt="用户头像" class="user-avatar-clickable" data-user-id="${post.user.id}" data-user-name="${post.user.name}" style="cursor: pointer;">
                <div class="post-info">
                    <h3>${post.user.nickname || post.user.name}</h3>
                    <p class="post-meta">
                        ${formatTime(post.time)}
                        <span class="visibility-badge" title="${visibilityText}">
                            ${visibilityIcon} ${visibilityText}
                        </span>
                    </p>
                </div>
                ${actionButtonHTML}
            </div>
            <div class="post-content">
                <p>${formattedContent}</p>
                ${topicsHTML}
                ${imagesHTML}
            </div>
            <div class="post-actions">
                <button class="${likeButtonClass}"><i class="bi ${likeIconClass}"></i> 点赞 <span>${post.likes}</span></button>
                <button class="btn-comment"><i class="bi bi-chat"></i> 评论 <span>${post.comments.length}</span></button>
                <button class="btn-share"><i class="bi bi-share"></i> 分享</button>
                <button class="${bookmarkButtonClass}"><i class="bi ${bookmarkIconClass}"></i> 收藏 <span>${post.bookmarkedBy ? post.bookmarkedBy.length : 0}</span></button>
            </div>
            <div class="post-comments"><!-- 默认不加show类，收起 --></div>
        </article>
    `;
}

/**
 * 初始化动态加载
 */
function initPostsLoading() {
    const loadMoreBtn = document.querySelector('.load-more button');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            // 增加页码
            currentPage++;
            
            // 加载更多动态
            loadPosts(currentTabType, true);
        });
    }
}

/**
 * 更新加载更多按钮状态
 * @param {boolean} hasMore - 是否还有更多内容
 */
function updateLoadMoreButton(hasMore) {
    const loadMoreBtn = document.querySelector('.load-more button');
    if (!loadMoreBtn) return;
    
    if (hasMore) {
        loadMoreBtn.textContent = '加载更多';
        loadMoreBtn.disabled = false;
        loadMoreBtn.style.cursor = 'pointer';
    } else {
        loadMoreBtn.textContent = '已经滑到底了';
        loadMoreBtn.disabled = true;
        loadMoreBtn.style.cursor = 'not-allowed';
        loadMoreBtn.style.opacity = '0.6';
    }
}

/**
 * 生成评论区HTML
 * @param {Object} post - 动态数据
 * @returns {string} 评论区HTML字符串
 */
function createCommentsHTML(post) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // 获取用户列表，用于获取评论者的最新头像
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    let commentsHTML = '';
    
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(comment => {
            // 兼容两种数据结构
            const commentUser = comment.user || {
                name: comment.nickname || comment.username,
                avatar: comment.avatar
            };
            const commentTime = comment.time || comment.publishTime;
            
            // 从userList中获取评论者的最新头像
            const commenterLatestInfo = userList.find(u => u.username === commentUser.name);
            const commenterAvatar = commenterLatestInfo?.avatar || commentUser.avatar || 'src/images/DefaultAvatar.png';
            
            // 检查当前用户是否已点赞此评论
            const isLiked = comment.likedBy && comment.likedBy.includes(currentUser?.username);
            const likeIconClass = isLiked ? 'bi-heart-fill' : 'bi-heart';
            const likeButtonClass = isLiked ? 'btn-like-comment active' : 'btn-like-comment';
            
            commentsHTML += `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <img src="${commenterAvatar}" alt="用户头像" class="user-avatar-clickable" data-user-id="${commentUser.id || commentUser.name}" data-user-name="${commentUser.name}" style="cursor: pointer;">
                    <div class="comment-content">
                        <h4>${commentUser.name}</h4>
                        <p>${comment.content}</p>
                        <div class="comment-actions">
                            <span>${formatTime(commentTime)}</span>
                            <button class="btn-reply">回复</button>
                            <button class="${likeButtonClass}"><i class="bi ${likeIconClass}"></i> ${comment.likes || 0}</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // 评论输入区 - 根据用户状态设置初始状态
    const isLoggedIn = currentUser && currentUser.role !== 'guest';
    const inputDisabled = !isLoggedIn;
    const inputPlaceholder = isLoggedIn ? '添加评论...' : '请先登录后评论...';
    const btnDisabled = !isLoggedIn;
    
    // 获取当前用户的头像 - 从userList中获取最新头像，与profile.js保持一致
    const currentUserLatestInfo = userList.find(u => u.username === currentUser?.username);
    const currentUserAvatar = currentUserLatestInfo?.avatar || (currentUser && currentUser.avatar) || 'src/images/DefaultAvatar.png';
    
    commentsHTML += `
        <div class="comment-input">
            <img src="${currentUserAvatar}" alt="用户头像">
            <input type="text" placeholder="${inputPlaceholder}" ${inputDisabled ? 'disabled' : ''}>
            <button class="btn-send-comment" ${btnDisabled ? 'disabled' : ''}>发送</button>
        </div>
    `;
    return commentsHTML;
}

/**
 * 初始化动态交互
 */
function initPostInteractions() {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 首页发布动态功能
    const publishBtn = document.querySelector('.btn-publish');
    if (publishBtn) {
        const newBtn = publishBtn.cloneNode(true);
        publishBtn.parentNode.replaceChild(newBtn, publishBtn);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleHomePagePublish();
        });
    }
    
    // 用户头像点击事件
    const userAvatars = document.querySelectorAll('.user-avatar-clickable');
    userAvatars.forEach(avatar => {
        const newAvatar = avatar.cloneNode(true);
        avatar.parentNode.replaceChild(newAvatar, avatar);
        newAvatar.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            
            // 跳转到用户主页
            if (userId) {
                window.location.href = `profile.html?userId=${userId}`;
            } else if (userName) {
                // 如果没有userId，使用userName作为备用
                window.location.href = `profile.html?userId=${userName}`;
            }
        });
    });
    
    // 删除按钮
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const postId = this.getAttribute('data-post-id');
            if (confirm('确定要删除这条动态吗？删除后无法恢复。')) {
                deletePost(postId);
            }
        });
    });
    
    // 关注按钮
    const followButtons = document.querySelectorAll('.btn-follow');
    followButtons.forEach(button => {
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentUser) {
                alert('请先登录后才能关注用户');
                return;
            }
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            toggleFollow(userId, this);
        });
    });
    
    // 点赞按钮
    const likeButtons = document.querySelectorAll('.post-actions .btn-like');
    likeButtons.forEach(button => {
        // 先移除所有旧事件
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const postId = this.closest('.post-item').getAttribute('data-post-id');
            toggleLike(postId);
        });
    });
    
    // 评论按钮
    const commentButtons = document.querySelectorAll('.post-actions .btn-comment');
    commentButtons.forEach(button => {
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            if (currentUser && currentUser.role === 'guest') {
                e.preventDefault();
                alert('请先登录后才能评论');
                return;
            }
            const postItem = this.closest('.post-item');
            const commentsSection = postItem.querySelector('.post-comments');
            // 获取动态id
            const postId = postItem.getAttribute('data-post-id');
            
            // 展开/收起逻辑
            if (!commentsSection.classList.contains('show')) {
                // 展开，渲染评论内容
                const posts = getPostsData();
                const post = posts.find(p => String(p.id) === String(postId));
                commentsSection.innerHTML = createCommentsHTML(post);
                commentsSection.classList.add('show');
                
                // 立即启用评论输入区（如果用户已登录）
                const input = commentsSection.querySelector('input');
                const btn = commentsSection.querySelector('.btn-send-comment');
                
                if (currentUser && currentUser.role !== 'guest') {
                    // 登录用户，启用输入框和发送按钮
                    if (input) {
                        input.disabled = false;
                        input.placeholder = '添加评论...';
                        input.focus(); // 自动聚焦到输入框
                    }
                    if (btn) {
                        btn.disabled = false;
                    }
                } else {
                    // 游客或未登录用户，保持禁用状态
                    if (input) {
                        input.disabled = true;
                        input.placeholder = '请先登录后评论...';
                    }
                    if (btn) {
                        btn.disabled = true;
                    }
                }
                
                // 绑定评论发送事件
                bindCommentEvents(postId);
            } else {
                // 收起，清空内容
                commentsSection.classList.remove('show');
                commentsSection.innerHTML = '';
            }
        });
    });
    
    // 分享按钮
    const shareButtons = document.querySelectorAll('.post-actions .btn-share');
    shareButtons.forEach(button => {
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            if (currentUser && currentUser.role === 'guest') {
                e.preventDefault();
                alert('请先登录后才能分享');
                return;
            }
            // ... 这里可加分享逻辑 ...
        });
    });
    
    // 收藏按钮
    const bookmarkButtons = document.querySelectorAll('.post-actions .btn-bookmark');
    bookmarkButtons.forEach(button => {
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentUser || currentUser.role === 'guest') {
                alert('请先登录后才能收藏');
                return;
            }
            const postId = this.closest('.post-item').getAttribute('data-post-id');
            toggleBookmark(postId);
        });
    });
}

/**
 * 绑定评论相关事件
 * @param {string} postId - 动态ID
 */
function bindCommentEvents(postId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 发送评论按钮
    const sendCommentBtn = document.querySelector(`[data-post-id="${postId}"] .btn-send-comment`);
    const commentInput = document.querySelector(`[data-post-id="${postId}"] .comment-input input`);
    
    if (sendCommentBtn && commentInput) {
        // 发送评论事件
        sendCommentBtn.addEventListener('click', function() {
            sendComment(postId, commentInput.value);
        });
        
        // 回车发送评论
        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendComment(postId, this.value);
            }
        });
        
        // 输入时启用/禁用发送按钮
        commentInput.addEventListener('input', function() {
            sendCommentBtn.disabled = !this.value.trim();
        });
    }
    
    // 评论点赞按钮
    const commentLikeButtons = document.querySelectorAll(`[data-post-id="${postId}"] .btn-like-comment`);
    commentLikeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const commentItem = this.closest('.comment-item');
            const commentId = commentItem.getAttribute('data-comment-id');
            toggleCommentLike(postId, commentId);
        });
    });
    
    // 回复按钮
    const replyButtons = document.querySelectorAll(`[data-post-id="${postId}"] .btn-reply`);
    replyButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentUser && currentUser.role === 'guest') {
                alert('请先登录后才能回复评论');
                return;
            }
            // 回复功能可以后续扩展
            alert('回复功能开发中...');
        });
    });
}

/**
 * 发送评论
 * @param {string} postId - 动态ID
 * @param {string} content - 评论内容
 */
function sendComment(postId, content) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!content.trim()) {
        alert('请输入评论内容');
        return;
    }
    
    if (!currentUser || currentUser.role === 'guest') {
        alert('请先登录后才能发送评论');
        return;
    }
    
    // 检查当前用户是否被封禁
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === currentUser.username);
    if (user && user.banned) {
        alert('当前账号被封禁，无法操作');
        return;
    }
    
    // 获取动态数据
    let posts = JSON.parse(localStorage.getItem('postList')) || [];
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    
    if (postIndex === -1) {
        alert('动态不存在');
        return;
    }
    
    // 创建新评论
    const newComment = {
        id: Date.now(),
        user: {
            id: currentUser.id,
            name: currentUser.username,
            nickname: currentUser.nickname || currentUser.username,
            avatar: currentUser.avatar || 'src/images/DefaultAvatar.png'
        },
        content: content.trim(),
        time: new Date(),
        likes: 0
    };
    
    // 添加评论到动态
    if (!posts[postIndex].comments) {
        posts[postIndex].comments = [];
    }
    posts[postIndex].comments.push(newComment);
    
    // 保存到localStorage
    localStorage.setItem('postList', JSON.stringify(posts));
    
    // 清空输入框
    const commentInput = document.querySelector(`[data-post-id="${postId}"] .comment-input input`);
    if (commentInput) {
        commentInput.value = '';
        commentInput.dispatchEvent(new Event('input')); // 触发input事件以更新发送按钮状态
    }
    
    // 更新评论数量
    const commentCountSpan = document.querySelector(`[data-post-id="${postId}"] .btn-comment span`);
    if (commentCountSpan) {
        commentCountSpan.textContent = posts[postIndex].comments.length;
    }
    
    // 只更新评论区域，保持评论区展开状态
    updatePostComments(postId, posts[postIndex].comments);
    
    // 显示成功提示
    showToast('评论发表成功！');
}

/**
 * 更新动态评论显示
 * @param {string} postId - 动态ID
 * @param {Array} comments - 评论数组
 */
function updatePostComments(postId, comments) {
    const commentsSection = document.querySelector(`[data-post-id="${postId}"] .post-comments`);
    if (commentsSection) {
        // 保持展开状态
        const wasExpanded = commentsSection.classList.contains('show');
        
        // 重新渲染评论区域
        const post = { comments: comments };
        commentsSection.innerHTML = createCommentsHTML(post);
        
        // 如果之前是展开状态，保持展开
        if (wasExpanded) {
            commentsSection.classList.add('show');
        }
        
        // 重新绑定评论事件
        bindCommentEvents(postId);
    }
}

/**
 * 删除动态
 * @param {string} postId - 动态ID
 */
function deletePost(postId) {
    // 获取所有动态数据
    let posts = JSON.parse(localStorage.getItem('postList') || '[]');
    
    // 找到要删除的动态
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    
    if (postIndex !== -1) {
        // 从数组中删除该动态
        posts.splice(postIndex, 1);
        
        // 更新localStorage
        localStorage.setItem('postList', JSON.stringify(posts));
        
        // 从页面中移除该动态元素
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
        
        // 显示删除成功消息
        alert('动态删除成功！');
    } else {
        alert('删除失败，动态不存在！');
    }
}

/**
 * 切换关注状态
 * @param {string} userId - 用户ID
 * @param {HTMLElement} button - 关注按钮元素
 */
function toggleFollow(userId, button) {
    // 获取当前用户
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role === 'guest') {
        alert('请先登录后才能关注用户');
        return;
    }
    
    // 不能关注自己
    if (String(currentUser.id) === String(userId)) {
        alert('不能关注自己');
        return;
    }
    
    // 获取所有用户数据
    let userList = JSON.parse(localStorage.getItem('userList') || '[]');
    
    // 找到当前用户和目标用户
    const currentUserIndex = userList.findIndex(user => String(user.id) === String(currentUser.id));
    const targetUserIndex = userList.findIndex(user => String(user.id) === String(userId));
    
    if (currentUserIndex === -1) {
        alert('当前用户信息不存在');
        return;
    }
    
    if (targetUserIndex === -1) {
        alert('目标用户不存在');
        return;
    }
    
    const currentUserData = userList[currentUserIndex];
    const targetUserData = userList[targetUserIndex];
    
    // 确保关注列表存在
    if (!currentUserData.following) currentUserData.following = [];
    
    // 检查是否已经关注（同时检查用户ID和用户名）
    // 确保数据类型一致，转换为字符串进行比较
    const userIdStr = String(userId);
    const isFollowing = currentUserData.following.some(id => 
        String(id) === userIdStr || String(id) === targetUserData.username
    );
    
    if (isFollowing) {
        // 取消关注（移除用户ID和用户名）
        currentUserData.following = currentUserData.following.filter(id => 
            String(id) !== userIdStr && String(id) !== targetUserData.username
        );
        
        button.textContent = '关注';
        button.classList.remove('following');
        alert('已取消关注');
    } else {
        // 添加关注（同时添加用户ID和用户名）
        if (!currentUserData.following.some(id => String(id) === userIdStr)) {
            currentUserData.following.push(userId);
        }
        if (!currentUserData.following.some(id => String(id) === targetUserData.username)) {
            currentUserData.following.push(targetUserData.username);
        }
        
        button.textContent = '已关注';
        button.classList.add('following');
        alert('关注成功！');
    }
    
    // 更新用户列表
    localStorage.setItem('userList', JSON.stringify(userList));
    
    // 更新当前用户信息
    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
    
    // 更新关注按钮状态
    updateFollowButtonState(userId, button, isFollowing);
    
    // 更新关注数量显示
    updateFollowCounts();
    
    // 重新渲染所有动态，确保所有相关帖子的关注状态都得到更新
    const activeTab = document.querySelector('.content-tabs .tab.active');
    const tabType = activeTab ? activeTab.dataset.tab : 'all';
    loadPosts(tabType);
}

/**
 * 更新关注按钮状态
 * @param {string} userId - 用户ID
 * @param {HTMLElement} button - 关注按钮元素
 * @param {boolean} wasFollowing - 之前是否关注
 */
function updateFollowButtonState(userId, button, wasFollowing) {
    if (wasFollowing) {
        // 之前关注，现在取消关注
        button.textContent = '关注';
        button.classList.remove('following');
        button.style.backgroundColor = '';
        button.style.color = '';
    } else {
        // 之前未关注，现在关注
        button.textContent = '已关注';
        button.classList.add('following');
        button.style.backgroundColor = '#e0e0e0';
        button.style.color = '#666';
    }
}

/**
 * 更新关注数量显示
 */
function updateFollowCounts() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // 更新个人主页的关注数量（如果存在）
    const followingCount = document.querySelector('.following-count');
    const followersCount = document.querySelector('.followers-count');
    
    if (followingCount) {
        // 由于关注逻辑中同时存储了用户ID和用户名，所以需要除以2
        const actualFollowingCount = currentUser.following ? Math.floor(currentUser.following.length / 2) : 0;
        followingCount.textContent = actualFollowingCount;
    }
    
    if (followersCount) {
        // 计算粉丝数量：遍历所有用户，统计following数组中包含当前用户ID的用户数量
        const userList = JSON.parse(localStorage.getItem('userList') || '[]');
        // 确保数据类型一致，转换为字符串进行比较
        const currentUserId = String(currentUser.id);
        const followers = userList.filter(user => {
            if (!user.following || !Array.isArray(user.following)) return false;
            return user.following.some(id => String(id) === currentUserId);
        }).length;
        followersCount.textContent = followers;
    }
}

/**
 * 获取关注列表
 * @param {string} username - 用户名
 * @returns {Array} 关注列表
 */
function getFollowingList(username) {
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    const user = userList.find(u => u.username === username);
    return user ? (user.following || []) : [];
}

/**
 * 获取粉丝列表
 * @param {string} username - 用户名
 * @returns {Array} 粉丝列表
 */
function getFollowersList(username) {
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    const user = userList.find(u => u.username === username);
    if (!user) return [];
    
    // 查找所有关注了该用户的用户（检查其他用户的following数组）
    // 确保数据类型一致，转换为字符串进行比较
    const targetUserId = String(user.id);
    return userList.filter(u => {
        if (!u.following || !Array.isArray(u.following)) return false;
        return u.following.some(id => String(id) === targetUserId);
    }).map(u => u.id);
}

/**
 * 检查是否关注了某个用户
 * @param {string} userId - 用户ID
 * @returns {boolean} 是否关注
 */
function isFollowingUser(userId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.following) return false;
    
    // 确保数据类型一致，转换为字符串进行比较
    const userIdStr = String(userId);
    return currentUser.following.some(id => 
        String(id) === userIdStr || String(id) === userIdStr.toString()
    );
}

/**
 * 格式化时间显示
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) {
        return '刚刚';
    } else if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return new Date(date).toLocaleDateString();
    }
}

/**
 * 处理首页发布动态
 */
function handleHomePagePublish() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser || currentUser.role === 'guest') {
        alert('请先登录后才能发布动态');
        return;
    }
    
    // 检查用户是否被封禁
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === currentUser.username);
    if (user && user.banned) {
        alert('当前账号被封禁，无法操作');
        return;
    }
    
    // 跳转到发布页面
    window.location.href = 'post.html';
}

/**
 * 切换点赞状态
 * @param {number} postId - 动态ID
 */
function toggleLike(postId) {
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
    
    // 获取动态数据
    let posts = JSON.parse(localStorage.getItem('postList')) || [];
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    
    if (postIndex === -1) {
        alert('动态不存在');
        return;
    }
    
    const post = posts[postIndex];
    
    // 初始化点赞用户列表
    if (!post.likedBy) {
        post.likedBy = [];
    }
    
    // 检查用户是否已经点赞
    const userLikedIndex = post.likedBy.indexOf(currentUser.username);
    
    if (userLikedIndex === -1) {
        // 用户未点赞，添加点赞
        post.likedBy.push(currentUser.username);
        post.likes = (post.likes || 0) + 1;
    } else {
        // 用户已点赞，取消点赞
        post.likedBy.splice(userLikedIndex, 1);
        post.likes = Math.max(0, (post.likes || 0) - 1);
    }
    
    // 保存到localStorage
    localStorage.setItem('postList', JSON.stringify(posts));
    
    // 更新页面显示
    updateLikeButton(postId, post.likes, post.likedBy.includes(currentUser.username));
}

/**
 * 更新点赞按钮状态
 * @param {number} postId - 动态ID
 * @param {number} likeCount - 点赞数
 * @param {boolean} isLiked - 是否已点赞
 */
function updateLikeButton(postId, likeCount, isLiked) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;
    
    const likeButton = postElement.querySelector('.btn-like');
    const likeCountSpan = likeButton.querySelector('span');
    const likeIcon = likeButton.querySelector('i');
    
    // 更新点赞数
    likeCountSpan.textContent = likeCount || 0;
    
    // 更新点赞状态
    if (isLiked) {
        likeButton.classList.add('active');
        if (likeIcon) {
            likeIcon.classList.remove('bi-heart');
            likeIcon.classList.add('bi-heart-fill');
        }
    } else {
        likeButton.classList.remove('active');
        if (likeIcon) {
            likeIcon.classList.remove('bi-heart-fill');
            likeIcon.classList.add('bi-heart');
        }
    }
}

/**
 * 切换评论点赞状态
 * @param {number} postId - 动态ID
 * @param {number} commentId - 评论ID
 */
function toggleCommentLike(postId, commentId) {
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
    
    // 获取动态数据
    let posts = JSON.parse(localStorage.getItem('postList')) || [];
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    
    if (postIndex === -1) {
        alert('动态不存在');
        return;
    }
    
    const post = posts[postIndex];
    const commentIndex = post.comments.findIndex(comment => String(comment.id) === String(commentId));
    
    if (commentIndex === -1) {
        alert('评论不存在');
        return;
    }
    
    const comment = post.comments[commentIndex];
    
    // 初始化评论点赞用户列表
    if (!comment.likedBy) {
        comment.likedBy = [];
    }
    
    // 检查用户是否已经点赞
    const userLikedIndex = comment.likedBy.indexOf(currentUser.username);
    
    if (userLikedIndex === -1) {
        // 用户未点赞，添加点赞
        comment.likedBy.push(currentUser.username);
        comment.likes = (comment.likes || 0) + 1;
    } else {
        // 用户已点赞，取消点赞
        comment.likedBy.splice(userLikedIndex, 1);
        comment.likes = Math.max(0, (comment.likes || 0) - 1);
    }
    
    // 保存到localStorage
    localStorage.setItem('postList', JSON.stringify(posts));
    
    // 只更新评论区域，保持评论区展开状态
    updatePostComments(postId, post.comments);
}

/**
 * 初始化打卡签到模块
 */
function initCheckinModule() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const checkinCard = document.querySelector('.checkin-card');
    const guestCard = document.querySelector('.guest-card');
    
    if (currentUser && currentUser.role !== 'guest') {
        // 登录用户显示打卡模块，隐藏游客提示
        if (checkinCard) checkinCard.style.display = 'block';
        if (guestCard) guestCard.style.display = 'none';
        
        // 初始化打卡状态
        updateCheckinStatus();
        
        // 绑定打卡按钮事件
        const checkinBtn = document.getElementById('checkinBtn');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', handleCheckin);
        }
    } else {
        // 游客隐藏打卡模块，显示游客提示
        if (checkinCard) checkinCard.style.display = 'none';
        if (guestCard) guestCard.style.display = 'block';
    }
}

/**
 * 更新打卡状态显示
 */
function updateCheckinStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role === 'guest') return;
    
    const checkinStatus = document.querySelector('.checkin-status');
    const checkinStreak = document.getElementById('checkinStreak');
    const checkinBtn = document.getElementById('checkinBtn');
    
    if (!checkinStatus || !checkinStreak || !checkinBtn) return;
    
    // 获取用户的打卡记录
    const checkinData = JSON.parse(localStorage.getItem('checkinData')) || {};
    const userCheckin = checkinData[currentUser.username] || {
        lastCheckin: null,
        streak: 0,
        totalCheckins: 0
    };
    
    // 检查今天是否已经打卡
    const today = new Date().toDateString();
    const isTodayChecked = userCheckin.lastCheckin === today;
    
    // 更新状态显示
    if (isTodayChecked) {
        checkinStatus.textContent = '今日已签到';
        checkinStatus.className = 'checkin-status signed';
        checkinBtn.disabled = true;
        checkinBtn.innerHTML = '<i class="bi bi-check-circle"></i> 已签到';
    } else {
        checkinStatus.textContent = '今日未签到';
        checkinStatus.className = 'checkin-status';
        checkinBtn.disabled = false;
        checkinBtn.innerHTML = '<i class="bi bi-check-circle"></i> 立即签到';
    }
    
    // 更新连续签到天数
    checkinStreak.textContent = userCheckin.streak || 0;
}

/**
 * 处理打卡签到
 */
function handleCheckin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role === 'guest') {
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
    
    const today = new Date().toDateString();
    const checkinData = JSON.parse(localStorage.getItem('checkinData')) || {};
    const userCheckin = checkinData[currentUser.username] || {
        lastCheckin: null,
        streak: 0,
        totalCheckins: 0
    };
    
    // 检查是否已经打卡
    if (userCheckin.lastCheckin === today) {
        alert('今日已经签到过了');
        return;
    }
    
    // 计算连续签到天数
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    if (userCheckin.lastCheckin === yesterdayStr) {
        // 连续签到
        userCheckin.streak = (userCheckin.streak || 0) + 1;
    } else {
        // 中断连续签到，重新开始
        userCheckin.streak = 1;
    }
    
    // 更新打卡记录
    userCheckin.lastCheckin = today;
    userCheckin.totalCheckins = (userCheckin.totalCheckins || 0) + 1;
    
    // 保存到localStorage
    checkinData[currentUser.username] = userCheckin;
    localStorage.setItem('checkinData', JSON.stringify(checkinData));
    
    // 更新显示
    updateCheckinStatus();
    
    // 显示成功提示
    if (typeof showToast === 'function') {
        showToast('签到成功！', 'success');
    } else {
        alert('签到成功！');
    }
}

/**
 * 切换收藏状态
 * @param {string} postId - 动态ID
 */
function toggleBookmark(postId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role === 'guest') {
        alert('请先登录后才能收藏');
        return;
    }
    
    // 获取动态数据
    let posts = JSON.parse(localStorage.getItem('postList')) || [];
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    
    if (postIndex === -1) {
        alert('动态不存在');
        return;
    }
    
    const post = posts[postIndex];
    
    // 初始化收藏用户列表
    if (!post.bookmarkedBy) {
        post.bookmarkedBy = [];
    }
    
    // 检查用户是否已经收藏
    const isBookmarked = post.bookmarkedBy.includes(currentUser.username);
    
    if (isBookmarked) {
        // 用户已收藏，取消收藏
        post.bookmarkedBy = post.bookmarkedBy.filter(username => username !== currentUser.username);
        alert('已取消收藏');
    } else {
        // 用户未收藏，添加收藏
        post.bookmarkedBy.push(currentUser.username);
        alert('收藏成功！');
    }
    
    // 保存到localStorage
    localStorage.setItem('postList', JSON.stringify(posts));
    
    // 只更新收藏按钮状态，不重新渲染整个列表
    updateBookmarkButton(postId, post.bookmarkedBy.length, !isBookmarked);
}

/**
 * 更新收藏按钮状态
 * @param {string} postId - 动态ID
 * @param {number} bookmarkCount - 收藏数
 * @param {boolean} isBookmarked - 是否已收藏
 */
function updateBookmarkButton(postId, bookmarkCount, isBookmarked) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;
    
    const bookmarkButton = postElement.querySelector('.btn-bookmark');
    const bookmarkCountSpan = bookmarkButton.querySelector('span');
    const bookmarkIcon = bookmarkButton.querySelector('i');
    
    // 更新收藏数
    bookmarkCountSpan.textContent = bookmarkCount || 0;
    
    // 更新收藏状态
    if (isBookmarked) {
        bookmarkButton.classList.add('active');
        if (bookmarkIcon) {
            bookmarkIcon.classList.remove('bi-bookmark');
            bookmarkIcon.classList.add('bi-bookmark-fill');
        }
    } else {
        bookmarkButton.classList.remove('active');
        if (bookmarkIcon) {
            bookmarkIcon.classList.remove('bi-bookmark-fill');
            bookmarkIcon.classList.add('bi-bookmark');
        }
    }
}

/**
 * 重新渲染动态列表
 */
function renderPosts() {
    // 重新加载当前标签页的动态
    loadPosts(currentTabType, false);
}