/**
 * 荔荔社区 - 首页JavaScript功能
 */

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化内容切换标签
    initContentTabs();
    
    // 初始化动态加载
    initPostsLoading();
    
    // 初始化动态交互
    initPostInteractions();
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
    const postsContainer = document.querySelector('.posts-list');
    
    // 如果不是追加，则清空容器
    if (!append) {
        postsContainer.innerHTML = '<div class="loading">加载中...</div>';
    }
    
    // 模拟加载延迟
    setTimeout(() => {
        // 移除加载提示
        const loading = postsContainer.querySelector('.loading');
        if (loading) {
            postsContainer.removeChild(loading);
        }
        
        // 模拟获取动态数据
        const posts = getPostsData(type);
        
        // 如果没有数据
        if (posts.length === 0) {
            postsContainer.innerHTML = '<div class="no-content">暂无内容</div>';
            return;
        }
        
        // 渲染动态
        posts.forEach(post => {
            if (!append) {
                postsContainer.innerHTML += createPostHTML(post);
            } else {
                postsContainer.insertAdjacentHTML('beforeend', createPostHTML(post));
            }
        });
        
        // 重新绑定交互事件
        initPostInteractions();
    }, 500);
}

/**
 * 获取动态数据（模拟）
 * @param {string} type - 动态类型
 * @returns {Array} 动态数据数组
 */
function getPostsData(type) {
    // 模拟数据
    const allPosts = [
        {
            id: 1,
            user: {
                id: 101,
                name: '学习达人',
                avatar: 'src/images/avatar-1.svg',
                department: '计算机学院'
            },
            content: '期末复习攻略分享！#期末复习 #学习方法\n1. 制定合理的复习计划，分配每天的学习任务\n2. 整理笔记和重点知识点，制作思维导图\n3. 多做习题，找出自己的薄弱环节\n4. 保持良好的作息，确保充足的睡眠',
            images: ['src/images/post-img-1.svg'],
            time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
            likes: 42,
            comments: [
                {
                    id: 201,
                    user: {
                        id: 102,
                        name: '摄影爱好者',
                        avatar: 'src/images/avatar-2.svg'
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
                id: 102,
                name: '摄影爱好者',
                avatar: 'src/images/avatar-2.svg',
                department: '艺术学院'
            },
            content: '校园的春天真美！分享几张今天拍的照片 #校园风光 #摄影',
            images: ['src/images/post-img-2.svg', 'src/images/post-img-3.svg'],
            time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
            likes: 78,
            comments: []
        },
        {
            id: 3,
            user: {
                id: 103,
                name: '校园歌手',
                avatar: 'src/images/avatar-3.svg',
                department: '音乐学院'
            },
            content: '校园歌手大赛开始报名啦！欢迎所有热爱音乐的同学参加 #校园活动 #音乐\n时间：5月20日-6月10日\n地点：大学生活动中心\n报名方式：扫描下方二维码或到学生会办公室登记',
            images: ['src/images/post-img-4.svg'],
            time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3天前
            likes: 156,
            comments: []
        }
    ];
    
    // 根据类型筛选
    switch (type) {
        case 'following':
            // 模拟已登录用户关注的用户发布的动态
            return [];
        case 'hot':
            // 按点赞数排序
            return [...allPosts].sort((a, b) => b.likes - a.likes);
        case 'all':
        default:
            return allPosts;
    }
}

/**
 * 创建动态HTML
 * @param {Object} post - 动态数据
 * @returns {string} 动态HTML字符串
 */
function createPostHTML(post) {
    // 处理图片展示
    let imagesHTML = '';
    if (post.images && post.images.length > 0) {
        if (post.images.length === 1) {
            imagesHTML = `
                <div class="post-images">
                    <img src="${post.images[0]}" alt="动态图片">
                </div>
            `;
        } else if (post.images.length === 2) {
            imagesHTML = `
                <div class="post-images grid-2">
                    <img src="${post.images[0]}" alt="动态图片">
                    <img src="${post.images[1]}" alt="动态图片">
                </div>
            `;
        } else if (post.images.length >= 3) {
            imagesHTML = `
                <div class="post-images grid-3">
                    <img src="${post.images[0]}" alt="动态图片">
                    <img src="${post.images[1]}" alt="动态图片">
                    <img src="${post.images[2]}" alt="动态图片">
                </div>
            `;
        }
    }
    
    // 处理评论展示
    let commentsHTML = '';
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(comment => {
            commentsHTML += `
                <div class="comment-item">
                    <img src="${comment.user.avatar}" alt="用户头像">
                    <div class="comment-content">
                        <h4>${comment.user.name}</h4>
                        <p>${comment.content}</p>
                        <div class="comment-actions">
                            <span>${formatTime(comment.time)}</span>
                            <button>回复</button>
                            <button><i class="bi bi-heart"></i> ${comment.likes}</button>
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
    
    return `
        <article class="post-item" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${post.user.avatar}" alt="用户头像">
                <div class="post-info">
                    <h3>${post.user.name}</h3>
                    <p class="post-meta">${post.user.department} · ${formatTime(post.time)}</p>
                </div>
                <button class="btn-follow" data-user-id="${post.user.id}">关注</button>
            </div>
            <div class="post-content">
                <p>${formattedContent}</p>
                ${imagesHTML}
            </div>
            <div class="post-actions">
                <button class="btn-like"><i class="bi bi-heart"></i> 点赞 <span>${post.likes}</span></button>
                <button class="btn-comment"><i class="bi bi-chat"></i> 评论 <span>${post.comments.length}</span></button>
                <button class="btn-share"><i class="bi bi-share"></i> 分享</button>
                <button class="btn-bookmark"><i class="bi bi-bookmark"></i> 收藏</button>
            </div>
            <div class="post-comments">
                ${commentsHTML}
                <div class="comment-input">
                    <img src="src/images/avatar-default.svg" alt="用户头像">
                    <input type="text" placeholder="添加评论..." disabled>
                    <button class="btn-comment" disabled>发送</button>
                </div>
            </div>
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
            // 获取当前活动的标签类型
            const activeTab = document.querySelector('.content-tabs .tab.active');
            const tabType = activeTab ? activeTab.dataset.tab : 'all';
            
            // 加载更多动态
            loadPosts(tabType, true);
        });
    }
    
    // 实现懒加载
    window.addEventListener('scroll', function() {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        // 当滚动到距离底部100px时，自动加载更多
        if (scrollHeight - scrollTop - clientHeight < 100) {
            // 防止频繁触发
            if (!window.isLoading) {
                window.isLoading = true;
                
                // 获取当前活动的标签类型
                const activeTab = document.querySelector('.content-tabs .tab.active');
                const tabType = activeTab ? activeTab.dataset.tab : 'all';
                
                // 加载更多动态
                loadPosts(tabType, true);
                
                // 设置延迟，防止频繁触发
                setTimeout(() => {
                    window.isLoading = false;
                }, 1000);
            }
        }
    });
}

/**
 * 初始化动态交互
 */
function initPostInteractions() {
    // 点赞按钮
    const likeButtons = document.querySelectorAll('.post-actions .btn-like');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 检查用户是否登录
            const userInfo = localStorage.getItem('userInfo');
            
            if (!userInfo) {
                // 未登录，提示登录
                showToast('请先登录后再操作', 'warning');
                return;
            }
            
            // 切换点赞状态
            this.classList.toggle('active');
            
            // 更新点赞数
            const likeCount = this.querySelector('span');
            let count = parseInt(likeCount.textContent);
            
            if (this.classList.contains('active')) {
                likeCount.textContent = count + 1;
            } else {
                likeCount.textContent = count - 1;
            }
        });
    });
    
    // 评论按钮
    const commentButtons = document.querySelectorAll('.post-actions .btn-comment');
    
    commentButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 获取当前动态的评论区
            const postItem = this.closest('.post-item');
            const commentsSection = postItem.querySelector('.post-comments');
            
            // 切换评论区显示状态
            commentsSection.classList.toggle('show');
            
            // 如果显示评论区，则自动聚焦到评论输入框
            if (commentsSection.classList.contains('show')) {
                const commentInput = commentsSection.querySelector('input');
                if (commentInput && !commentInput.disabled) {
                    commentInput.focus();
                }
            }
        });
    });
    
    // 关注按钮
    const followButtons = document.querySelectorAll('.btn-follow');
    
    followButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 检查用户是否登录
            const userInfo = localStorage.getItem('userInfo');
            
            if (!userInfo) {
                // 未登录，提示登录
                showToast('请先登录后再操作', 'warning');
                return;
            }
            
            // 切换关注状态
            this.classList.toggle('following');
            
            if (this.classList.contains('following')) {
                this.textContent = '已关注';
                showToast('关注成功', 'success');
            } else {
                this.textContent = '关注';
                showToast('已取消关注', 'info');
            }
        });
    });
}