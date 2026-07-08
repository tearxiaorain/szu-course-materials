/**
 * 个人资料页面脚本
 */

// ========== 全局消息提示函数 ========== //
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
window.showMessage = showMessage;

// 全局变量
let clickUser = null;
let isOwnProfile = false;
let followingList = null; // 全局变量声明

// 分页相关变量
let currentPage = 1;
let postsPerPage = 5;
let allUserPosts = [];

// ========== 全局交互函数 ========== //

function initProfilePostInteractions() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // 删除按钮点击事件
    const deleteButtons = document.querySelectorAll('.btn-delete-post');
    deleteButtons.forEach(button => {
        // 移除旧事件监听器
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const postId = this.getAttribute('data-post-id');
            if (confirm('确定要删除这条动态吗？删除后无法恢复。')) {
                deleteProfilePost(postId);
            }
        });
    });
    
    // 点赞按钮点击事件 - 同时处理个人动态和收藏动态
    const likeButtons = document.querySelectorAll('.post-like-btn');
    likeButtons.forEach(button => {
        // 移除旧事件监听器
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const postId = this.getAttribute('data-post-id');
            toggleProfileLike(postId);
        });
    });
    
    // 收藏按钮点击事件 - 同时处理个人动态和收藏动态
    const bookmarkButtons = document.querySelectorAll('.post-bookmark-btn');
    bookmarkButtons.forEach(button => {
        // 移除旧事件监听器
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentUser || currentUser.role === 'guest') {
                alert('请先登录后才能收藏');
                return;
            }
            const postId = this.getAttribute('data-post-id');
            toggleProfileBookmark(postId);
        });
    });
    
    // 评论按钮点击事件 - 同时处理个人动态和收藏动态
    const commentButtons = document.querySelectorAll('.post-comment-btn');
    commentButtons.forEach(button => {
        // 移除旧事件监听器
        const newBtn = button.cloneNode(true);
        button.parentNode.replaceChild(newBtn, button);
        newBtn.addEventListener('click', function(e) {
            console.log('评论按钮被点击');
            if (currentUser && currentUser.role === 'guest') {
                e.preventDefault();
                alert('请先登录后才能评论');
                return;
            }
            
            const postItem = this.closest('.post-item');
            const commentsSection = postItem.querySelector('.post-comments');
            const postId = postItem.getAttribute('data-post-id');
            
            console.log('postItem:', postItem);
            console.log('commentsSection:', commentsSection);
            console.log('postId:', postId);
            console.log('commentsSection.classList:', commentsSection.classList);
            console.log('contains show:', commentsSection.classList.contains('show'));
            
            // 展开/收起逻辑
            if (!commentsSection.classList.contains('show')) {
                console.log('准备展开评论区域');
                // 展开，渲染评论内容
                const allPosts = JSON.parse(localStorage.getItem('postList') || '[]');
                const post = allPosts.find(p => String(p.id) === String(postId));
                
                console.log('找到的动态:', post);
                
                if (post) {
                    commentsSection.innerHTML = createProfileCommentsHTML(post);
                    commentsSection.classList.add('show');
                    console.log('评论区域已展开');
                    
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
                    bindProfileCommentEvents(postId);
                } else {
                    console.error('未找到对应的动态数据');
                }
            } else {
                console.log('准备收起评论区域');
                // 收起，清空内容
                commentsSection.classList.remove('show');
                commentsSection.innerHTML = '';
                console.log('评论区域已收起');
            }
        });
    });
}

function createProfileCommentsHTML(post) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    // 从userList中获取最新的用户信息
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    
    let commentsHTML = '';
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(comment => {
            const commentUser = comment.user || {
                name: comment.nickname || comment.username,
                avatar: comment.avatar
            };
            const commentTime = comment.time || comment.publishTime;
            
            // 从userList中获取评论者的最新头像
            const commenterLatestInfo = userList.find(u => u.username === commentUser.name);
            const commenterAvatar = commenterLatestInfo?.avatar || commentUser.avatar || 'src/images/DefaultAvatar.png';
            
            commentsHTML += `
                <div class="comment-item">
                    <div class="comment-avatar">
                        <img src="${commenterAvatar}" alt="用户头像">
                    </div>
                    <div class="comment-content">
                        <div class="comment-author">${commentUser.name}</div>
                        <div class="comment-text">${comment.content}</div>
                        <div class="comment-time">${formatTime(commentTime)}</div>
                    </div>
                </div>
            `;
        });
    }
    
    // 从userList中获取当前用户的最新头像
    const currentUserLatestInfo = userList.find(u => u.username === currentUser?.username);
    const currentUserAvatar = currentUserLatestInfo?.avatar || (currentUser && currentUser.avatar) || 'src/images/DefaultAvatar.png';
    
    const isLoggedIn = currentUser && currentUser.role !== 'guest';
    const inputDisabled = !isLoggedIn;
    const inputPlaceholder = isLoggedIn ? '添加评论...' : '请先登录后评论...';
    const btnDisabled = !isLoggedIn;
    commentsHTML += `
        <div class="comment-input">
            <img src="${currentUserAvatar}" alt="用户头像">
            <input type="text" placeholder="${inputPlaceholder}" ${inputDisabled ? 'disabled' : ''}>
            <button class="btn-send-comment" ${btnDisabled ? 'disabled' : ''}>发送</button>
        </div>
    `;
    return commentsHTML;
}

function bindProfileCommentEvents(postId) {
    const commentsSection = document.querySelector(`[data-post-id="${postId}"] .post-comments`);
    const input = commentsSection.querySelector('input');
    const btn = commentsSection.querySelector('.btn-send-comment');
    btn.addEventListener('click', function() {
        const content = input.value.trim();
        if (content) {
            sendProfileComment(postId, content);
            input.value = '';
        }
    });
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const content = input.value.trim();
            if (content) {
                sendProfileComment(postId, content);
                input.value = '';
            }
        }
    });
    input.addEventListener('input', function() {
        btn.disabled = !input.value.trim();
    });
}

function sendProfileComment(postId, content) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!content.trim()) {
        alert('请输入评论内容');
        return;
    }
    if (!currentUser || currentUser.role === 'guest') {
        alert('请先登录后才能发送评论');
        return;
    }
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === currentUser.username);
    if (user && user.banned) {
        alert('当前账号被封禁，无法操作');
        return;
    }
    let posts = JSON.parse(localStorage.getItem('postList')) || [];
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    if (postIndex === -1) {
        alert('动态不存在');
        return;
    }
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
    if (!posts[postIndex].comments) {
        posts[postIndex].comments = [];
    }
    posts[postIndex].comments.push(newComment);
    localStorage.setItem('postList', JSON.stringify(posts));
    const commentInput = document.querySelector(`[data-post-id="${postId}"] .comment-input input`);
    if (commentInput) {
        commentInput.value = '';
        commentInput.dispatchEvent(new Event('input'));
    }
    const activeTab = document.querySelector('.profile-tabs li.active');
    if (activeTab) {
        const tabName = activeTab.getAttribute('data-tab');
        if (tabName === 'bookmarks') {
            loadBookmarksList();
        } else {
            loadUserPosts();
        }
    }
    alert('评论发表成功！');
}

function toggleProfileLike(postId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('请先登录');
        return;
    }
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === currentUser.username);
    if (user && user.banned) {
        alert('当前账号被封禁，无法操作');
        return;
    }
    let posts = JSON.parse(localStorage.getItem('postList')) || [];
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    if (postIndex === -1) {
        alert('动态不存在');
        return;
    }
    const post = posts[postIndex];
    if (!post.likedBy) {
        post.likedBy = [];
    }
    const userLikedIndex = post.likedBy.indexOf(currentUser.username);
    if (userLikedIndex === -1) {
        post.likedBy.push(currentUser.username);
        post.likes = (post.likes || 0) + 1;
    } else {
        post.likedBy.splice(userLikedIndex, 1);
        post.likes = Math.max(0, (post.likes || 0) - 1);
    }
    localStorage.setItem('postList', JSON.stringify(posts));
    updateProfileLikeButton(postId, post.likes, post.likedBy.includes(currentUser.username));
}

function updateProfileLikeButton(postId, likeCount, isLiked) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;
    const likeButton = postElement.querySelector('.post-like-btn');
    if (!likeButton) return;
    likeButton.innerHTML = `<i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i> ${likeCount || 0}`;
    if (isLiked) {
        likeButton.classList.add('active');
    } else {
        likeButton.classList.remove('active');
    }
}

function toggleProfileBookmark(postId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role === 'guest') {
        alert('请先登录后才能收藏');
        return;
    }
    let posts = JSON.parse(localStorage.getItem('postList')) || [];
    const postIndex = posts.findIndex(post => String(post.id) === String(postId));
    if (postIndex === -1) {
        alert('动态不存在');
        return;
    }
    const post = posts[postIndex];
    if (!post.bookmarkedBy) {
        post.bookmarkedBy = [];
    }
    const isBookmarked = post.bookmarkedBy.includes(currentUser.username);
    if (isBookmarked) {
        post.bookmarkedBy = post.bookmarkedBy.filter(username => username !== currentUser.username);
        alert('已取消收藏');
    } else {
        post.bookmarkedBy.push(currentUser.username);
        alert('收藏成功！');
    }
    localStorage.setItem('postList', JSON.stringify(posts));
    updateProfileBookmarkButton(postId, post.bookmarkedBy.length, !isBookmarked);
    const activeTab = document.querySelector('.profile-tabs li.active');
    if (activeTab && activeTab.getAttribute('data-tab') === 'bookmarks') {
        loadBookmarksList();
    }
}

function updateProfileBookmarkButton(postId, bookmarkCount, isBookmarked) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (!postElement) return;
    const bookmarkButton = postElement.querySelector('.post-bookmark-btn');
    if (!bookmarkButton) return;
    bookmarkButton.innerHTML = `<i class="bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i> ${bookmarkCount || 0}`;
    if (isBookmarked) {
        bookmarkButton.classList.add('active');
    } else {
        bookmarkButton.classList.remove('active');
    }
}

// ========== 全局函数 ========== //

// 全局取消关注函数
function unfollowUser(targetUsername) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        showMessage('请先登录', 'error');
        return;
    }
    
    // 检查用户是否被封禁
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === currentUser.username);
    if (user && user.banned) {
        showMessage('当前账号被封禁，无法操作', 'error');
        return;
    }
    
    // 获取用户列表
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    
    // 找到当前用户和目标用户
    const currentUserIndex = users.findIndex(u => u.username === currentUser.username);
    const targetUser = users.find(u => u.username === targetUsername);
    
    if (currentUserIndex === -1 || !targetUser) {
        showMessage('用户不存在', 'error');
        return;
    }
    
    const currentUserData = users[currentUserIndex];
    
    // 从关注列表中移除
    if (currentUserData.following) {
        // 只处理用户名
        currentUserData.following = currentUserData.following.filter(item => {
            if (typeof item === 'string') {
                return item !== targetUser.username;
            }
            return true; // 保留非字符串项（如果有的话）
        });
    }
    
    // 从目标用户的粉丝列表中移除
    if (targetUser.followers) {
        targetUser.followers = targetUser.followers.filter(username => username !== currentUser.username);
    }
    
    // 保存更新
    localStorage.setItem('userList', JSON.stringify(users));
    
    // 更新当前用户信息
    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
    
    // 重新加载关注列表
    loadFollowingList();
    
    // 更新关注数
    updateFollowCounts();
    
    showMessage('已取消关注', 'success');
}

// 全局访问用户主页函数
function visitUserProfile(userId) {
    console.log('visitUserProfile 被调用，用户ID:', userId);
    // 跳转到用户主页，传递用户ID参数
    window.location.href = `profile.html?userId=${userId}`;
}

// 加载关注列表函数 - 全局函数
function loadFollowingList() {
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    
    // 更新clickUser的最新信息
    const updatedClickUser = userList.find(u => String(u.id) === String(clickUser.id));
    if (updatedClickUser) {
        clickUser = updatedClickUser;
    }
    
    // 获取followingList元素
    const followingListElement = document.getElementById('followingList');
    if (!clickUser || !followingListElement) return;
    
    const followingArr = clickUser.following || [];
    
    if (followingArr.length === 0) {
        // 添加空状态容器类
        followingListElement.classList.add('empty-state-container');
        // 显示空状态
        followingListElement.innerHTML = `
            <div class="following-empty">
                <i class="bi bi-people"></i>
                <h3>还没有关注任何人</h3>
                <p>去发现更多有趣的人吧！</p>
            </div>
        `;
        return;
    }
    
    // 移除空状态容器类
    followingListElement.classList.remove('empty-state-container');
    
    // 清空列表
    followingListElement.innerHTML = '';
    
    // 获取关注用户的详细信息
    const followingUsers = [];
    followingArr.forEach(username => {
        // 只处理用户名
        if (typeof username === 'string') {
            const user = userList.find(u => u.username === username);
            if (user) {
                followingUsers.push(user);
            }
        }
    });
    
    // 渲染关注列表
    followingUsers.forEach(user => {
        const followingItem = document.createElement('div');
        followingItem.className = 'following-item';
        
        // 根据是否访问自己的主页来决定按钮显示和样式
        let actionButton = '';
        if (isOwnProfile) {
            // 访问自己的主页，显示取消关注按钮
            actionButton = `<button class="btn btn-outline btn-sm unfollow-btn" onclick="event.stopPropagation(); unfollowUser('${user.username}')">取消关注</button>`;
        } else {
            // 访问他人的主页，添加clickable类显示点击提示
            followingItem.classList.add('clickable');
            actionButton = '';
        }
        
        followingItem.innerHTML = `
            <div class="following-avatar">
                <img src="${user.avatar || 'src/images/DefaultAvatar.png'}" alt="${user.nickname || user.username}">
            </div>
            <div class="following-info">
                <div class="following-name">${user.nickname || user.username}</div>
                <div class="following-username">@${user.username}</div>
            </div>
            <div class="following-actions">
                ${actionButton}
            </div>
        `;
        
        // 添加点击事件，让整个卡片可以点击进入用户主页
        followingItem.addEventListener('click', function(e) {
            console.log('关注列表项被点击:', user);
            console.log('点击的元素:', e.target);
            console.log('点击的元素类名:', e.target.className);
            
            // 如果点击的是取消关注按钮，不执行跳转
            if (e.target.classList.contains('unfollow-btn')) {
                console.log('点击的是取消关注按钮，不跳转');
                return;
            }
            
            console.log('准备跳转到用户主页:', user.id);
            // 跳转到用户主页
            visitUserProfile(user.id);
        });
        
        followingListElement.appendChild(followingItem);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // 清理历史关注数据，只保留用户名
    cleanFollowingList();
    
    // 检查用户登录状态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // 未登录，跳转到登录页面
        window.location.href = 'login.html';
        return;
    }
    
    // 检查用户是否被封禁
    if (currentUser.banned) {
        // 修改：不再阻止进入系统，只记录封禁状态
        // 封禁限制将在具体的交互功能中实现
        console.log('用户已被封禁，但允许进入个人主页');
    }
    
    // 获取clickUser（从URL参数或localStorage）
    let clickUserId = null;
    const urlParams = new URLSearchParams(window.location.search);
    clickUserId = urlParams.get('userId');
    
    if (clickUserId) {
        // 从URL参数获取用户ID，从userList中查找用户信息
        const userList = JSON.parse(localStorage.getItem('userList') || '[]');
        clickUser = userList.find(user => String(user.id) === String(clickUserId));
        
        if (!clickUser) {
            alert('用户不存在');
            window.location.href = 'index.html';
            return;
        }
    } else {
        // 没有URL参数，说明访问的是自己的主页
        clickUser = currentUser;
    }
    
    // 判断是否访问自己的主页
    isOwnProfile = String(currentUser.id) === String(clickUser.id);
    
    // 检查用户是否被封禁
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    const userInList = userList.find(u => u.username === clickUser.username);
    if (userInList && userInList.banned) {
        // 显示封禁提示
        if (typeof showToast === 'function') {
            showToast('该用户已被封禁', 'warning');
        } else {
            // 如果showToast函数不存在，使用alert
            alert('该用户已被封禁');
        }
    }
    
    // 调用common.js中的登录状态检查函数，确保UI正确显示
    if (typeof checkLoginStatus === 'function') {
        checkLoginStatus();
    }
    
    // 更新页面标题
    document.title = `${clickUser.nickname || clickUser.name} 的个人资料 - 荔荔社区`;
    
    // 获取DOM元素
    const profileName = document.getElementById('profileName');
    const profileId = document.getElementById('profileId');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileCover = document.getElementById('profileCover');
    const userAvatar = document.querySelector('.user-info .avatar img');
    // 右上角头像始终显示当前用户头像
    if (userAvatar && currentUser.avatar) {
        userAvatar.src = currentUser.avatar;
    }
    const postCount = document.getElementById('postCount');
    const followingCount = document.getElementById('followingCount');
    const followerCount = document.getElementById('followerCount');
    const userNickname = document.getElementById('userNickname');
    const userGender = document.getElementById('userGender');
    const userBirthday = document.getElementById('userBirthday');
    const userLocation = document.getElementById('userLocation');
    const userCollege = document.getElementById('userCollege');
    const userMajor = document.getElementById('userMajor');
    const userBio = document.getElementById('userBio');
    const userInterests = document.getElementById('userInterests');
    const userPostList = document.getElementById('userPostList');
    const userPhotoGrid = document.getElementById('userPhotoGrid');
    const userFriendsList = document.getElementById('userFriendsList');
    
    // 标签切换相关元素
    const profileTabs = document.querySelectorAll('.profile-tabs li');
    const tabPanes = document.querySelectorAll('.tab-pane');
    followingList = document.getElementById('followingList'); // 赋值给全局变量
    
    // 编辑资料相关元素
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editProfileForm = document.getElementById('editProfileForm');
    const editNickname = document.getElementById('editNickname');
    const editGender = document.getElementById('editGender');
    const editBirthday = document.getElementById('editBirthday');
    const editLocation = document.getElementById('editLocation');
    const editCollege = document.getElementById('editCollege');
    const editMajor = document.getElementById('editMajor');
    const editBio = document.getElementById('editBio');
    const editInterestTags = document.getElementById('editInterestTags');
    
    // 头像和封面上传
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const editCoverBtn = document.getElementById('editCoverBtn');
    const coverInput = document.getElementById('coverInput');
    
    // 加载用户资料
    loadUserProfile();
    // 加载用户动态
    loadUserPosts();
    // 加载关注和粉丝列表
    loadFollowLists();
    
    // 初始化标签切换
    initProfileTabs();
    
    // 监听localStorage变化，实时更新关注和粉丝数
    window.addEventListener('storage', function(e) {
        if (e.key === 'currentUser' || e.key === 'userList') {
            // 当用户数据或用户列表发生变化时，重新加载关注和粉丝数
            loadFollowLists();
        }
    });
    
    // 页面可见性变化时也重新加载数据（用户从其他页面返回时）
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadFollowLists();
        }
    });
    
    // 检查编辑按钮是否存在
    console.log('编辑按钮元素:', editProfileBtn);
    console.log('模态框元素:', editProfileModal);
    
    // 编辑资料模态框
    editProfileBtn.addEventListener('click', function() {
        // 只有访问自己的主页时才能编辑
        if (!isOwnProfile) {
            alert('只能编辑自己的资料');
            return;
        }
        
        console.log('编辑按钮被点击');
        // 填充表单数据
        fillEditForm();
        // 显示模态框
        editProfileModal.classList.add('active');
        console.log('模态框应该已显示');
    });
    
    closeModalBtn.addEventListener('click', function() {
        editProfileModal.classList.remove('active');
    });
    
    cancelEditBtn.addEventListener('click', function() {
        editProfileModal.classList.remove('active');
    });
    
    // 点击模态框外部关闭
    editProfileModal.addEventListener('click', function(e) {
        if (e.target === editProfileModal) {
            editProfileModal.classList.remove('active');
        }
    });
    
    // 兴趣标签选择
    const interestTags = editInterestTags.querySelectorAll('.interest-tag');
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
        });
    });
    
    // 头像上传
    editAvatarBtn.addEventListener('click', function() {
        // 只有访问自己的主页时才能上传头像
        if (!isOwnProfile) {
            alert('只能编辑自己的头像');
            return;
        }
        avatarInput.click();
    });
    
    avatarInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                profileAvatar.src = e.target.result;
                // 只在访问自己主页时才更新右上角头像
                if (userAvatar && isOwnProfile) {
                    userAvatar.src = e.target.result;
                }
                // 更新用户头像 - 同时更新currentUser和userList
                const user = JSON.parse(localStorage.getItem('currentUser'));
                user.avatar = e.target.result;
                localStorage.setItem('currentUser', JSON.stringify(user));
                updateUserAvatarInUserList(user.username, e.target.result);
                updateUserAvatarInPosts(user.username, e.target.result);
                showMessage('头像更新成功', 'success');
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // 封面上传
    editCoverBtn.addEventListener('click', function() {
        // 只有访问自己的主页时才能上传封面
        if (!isOwnProfile) {
            alert('只能编辑自己的封面');
            return;
        }
        coverInput.click();
    });
    
    coverInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                profileCover.src = e.target.result;
                
                // 更新用户封面
                const user = JSON.parse(localStorage.getItem('currentUser'));
                user.cover = e.target.result;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                showMessage('封面更新成功', 'success');
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // 提交编辑表单
    editProfileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 只有访问自己的主页时才能提交编辑
        if (!isOwnProfile) {
            alert('只能编辑自己的资料');
            return;
        }
        
        // 获取表单数据
        const formData = {
            nickname: editNickname.value.trim(),
            gender: editGender.value,
            birthday: editBirthday.value,
            location: editLocation.value.trim(),
            college: editCollege.value.trim(),
            major: editMajor.value.trim(),
            bio: editBio.value.trim(),
            interestTags: selectedTags
        };
        
        // 更新用户资料
        updateUserProfile(formData);
        
        // 关闭模态框
        editProfileModal.classList.remove('active');
    });
    
    // 加载用户资料
    function loadUserProfile() {
        if (!clickUser) return;
        
        // 更新页面标题
        document.title = `${clickUser.nickname || clickUser.username} 的个人资料 - 荔荔社区`;
        
        // 更新个人资料信息
        profileName.textContent = clickUser.nickname || clickUser.username;
        profileId.textContent = `学号：${clickUser.studentId || '未知'}`;
        
        // 从userList中获取最新的用户信息（包括头像）
        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        const latestUserInfo = userList.find(u => u.username === clickUser.username);
        
        // 更新头像 - 优先使用userList中的最新头像
        const avatarToUse = latestUserInfo?.avatar || clickUser.avatar || 'src/images/DefaultAvatar.png';
        profileAvatar.src = avatarToUse;
        // 只在访问自己主页时才更新右上角头像
        if (userAvatar && isOwnProfile) {
            userAvatar.src = avatarToUse;
        }
        
        // 更新封面图（如果有的话）
        if (clickUser.coverImage) {
            profileCover.src = clickUser.coverImage;
        } else {
            profileCover.src = 'src/images/DefaultAvatar.png';
        }
        
        // 根据是否访问自己的主页来更新标签文本
        const postsTab = document.querySelector('.profile-tabs li[data-tab="posts"]');
        if (postsTab) {
            if (isOwnProfile) {
                postsTab.textContent = '我的动态';
            } else {
                postsTab.textContent = 'TA的动态';
            }
        }
        
        // 根据是否访问自己的主页来控制编辑按钮的显示
        if (editProfileBtn) {
            if (isOwnProfile) {
                editProfileBtn.style.display = 'block';
            } else {
                editProfileBtn.style.display = 'none';
            }
        }
        
        // 根据是否访问自己的主页来控制头像和封面的编辑按钮
        if (editAvatarBtn) {
            editAvatarBtn.style.display = isOwnProfile ? 'flex' : 'none';
        }
        if (editCoverBtn) {
            editCoverBtn.style.display = isOwnProfile ? 'block' : 'none';
        }
        
        // 更新统计数据（动态数量由loadUserPosts更新，关注和粉丝数由loadFollowLists更新）
        postCount.textContent = clickUser.postCount || '0';
        
        // 更新关注和粉丝数
        loadFollowLists();
    }
    
    // 填充编辑表单
    function fillEditForm() {
        const user = clickUser;
        
        editNickname.value = user.nickname || user.name;
        editGender.value = user.gender || '保密';
        editBirthday.value = user.birthday || '';
        editLocation.value = user.location || '';
        editCollege.value = user.college || '';
        editMajor.value = user.major || '';
        editBio.value = user.bio || '';
        
        // 重置兴趣标签
        selectedTags = user.interestTags || [];
        const tagElements = editInterestTags.querySelectorAll('.interest-tag');
        
        tagElements.forEach(tag => {
            const tagValue = tag.getAttribute('data-tag');
            if (selectedTags.includes(tagValue)) {
                tag.classList.add('selected');
            } else {
                tag.classList.remove('selected');
            }
        });
    }
    
    // 更新用户资料
    function updateUserProfile(data) {
        // 只有访问自己的主页时才能更新资料
        if (!isOwnProfile) {
            alert('只能编辑自己的资料');
            return;
        }
        
        // 获取当前用户数据
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // 更新用户数据
        Object.assign(user, data);
        
        // 保存到本地存储
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // 更新clickUser数据
        clickUser = user;
        
        // 更新页面显示
        loadUserProfile();
        
        // 显示成功消息
        showMessage('个人资料更新成功', 'success');
    }
    
    // 加载用户动态
    function loadUserPosts() {
        // 获取所有动态
        let allPosts = JSON.parse(localStorage.getItem('postList') || '[]');
        
        // 获取当前用户信息
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { role: 'guest' };
        
        // 获取用户列表，用于检查封禁状态
        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        
        // 过滤掉被封禁用户发布的帖子
        allPosts = allPosts.filter(post => {
            if (!post.user || !post.user.name) return true; // 保留没有用户信息的帖子
            
            // 查找用户是否被封禁
            const user = userList.find(u => u.username === post.user.name);
            return !user || !user.banned; // 如果用户不存在或未被封禁，则显示帖子
        });
        
        // 只筛选clickUser发布的动态
        let userPosts = allPosts.filter(post => {
            if (!post.user) return false;
            
            // 通过用户ID匹配
            if (post.user.id === clickUser.id) return true;
            
            // 通过用户名匹配（新数据结构）
            if (post.user.name === clickUser.username) return true;
            
            // 通过昵称匹配（旧数据结构）
            if (post.user.name === clickUser.nickname) return true;
            
            return false;
        });
        
        // 根据可见性过滤动态
        userPosts = userPosts.filter(post => {
            // 如果是访问自己的主页，显示所有动态
            if (isOwnProfile) {
                return true;
            }
            
            // 如果是游客，只能看到公开的动态
            if (currentUser.role === 'guest') {
                return post.visibility === 'public';
            }
            
            // 根据可见性判断
            switch (post.visibility) {
                case 'public':
                    return true; // 公开动态所有人都能看到
                case 'followers':
                    // 粉丝可见：检查当前用户是否是clickUser的粉丝
                    // 通过检查其他用户的following数组中是否包含clickUser的ID，且该用户是currentUser
                    const clickUserId = String(clickUser.id);
                    const isFollower = userList.some(user => {
                        // 检查是否是currentUser
                        if (String(user.id) !== String(currentUser.id) && user.username !== currentUser.username) {
                            return false;
                        }
                        // 检查该用户的following数组是否包含clickUser
                        return user.following && user.following.some(id => String(id) === clickUserId);
                    });
                    return isFollower;
                case 'private':
                    return false; // 私密动态只有作者能看到
                default:
                    return true; // 默认公开
            }
        });
        
        // 渲染动态列表
        userPostList.innerHTML = '';
        if (userPosts.length === 0) {
            userPostList.innerHTML = '<div class="empty-state">暂无动态</div>';
        } else {
            // 按时间倒序
            userPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
            userPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-item';
                postElement.setAttribute('data-post-id', post.id);
            
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
                
                // 格式化内容，处理换行和话题标签
                const formattedContent = post.content
                    .replace(/\n/g, '</p><p>')
                    .replace(/#(\S+)/g, '<a href="#" class="topic-tag">#$1</a>');
                
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
                
                // 删除按钮 - 只在访问自己的主页时显示
                const deleteButton = isOwnProfile ? 
                    `<button class="btn-delete-post" data-post-id="${post.id}" title="删除动态">
                        <i class="bi bi-trash"></i>
                    </button>` : '';
                
                // 检查当前用户是否已点赞此动态
                const isLiked = post.likedBy && post.likedBy.includes(currentUser?.username);
                const likeIconClass = isLiked ? 'bi-heart-fill' : 'bi-heart';
                const likeButtonClass = isLiked ? 'post-like-btn active' : 'post-like-btn';
                
                // 检查当前用户是否已收藏此动态
                const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(currentUser?.username);
                const bookmarkIconClass = isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark';
                const bookmarkButtonClass = isBookmarked ? 'post-bookmark-btn active' : 'post-bookmark-btn';
                
                // 从userList中获取最新的用户头像
                const userList = JSON.parse(localStorage.getItem('userList')) || [];
                const latestUserInfo = userList.find(u => u.username === post.user.name);
                const userAvatar = latestUserInfo?.avatar || post.user.avatar || 'src/images/DefaultAvatar.png';
                
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-avatar">
                            <img src="${userAvatar}" alt="头像">
                    </div>
                    <div class="post-author">
                            <div class="post-author-name">${post.user.nickname || post.user.name}</div>
                            <div class="post-time">
                                ${formatTime(post.time)}
                                <span class="visibility-badge" title="${visibilityText}">
                                    ${visibilityIcon} ${visibilityText}
                                </span>
                    </div>
                    </div>
                        ${deleteButton}
                </div>
                <div class="post-content">
                        <div class="post-text">${formattedContent}</div>
                    ${imagesHTML}
                </div>
                <div class="post-footer">
                    <div class="post-stats">
                            <span class="${likeButtonClass}" data-post-id="${post.id}" style="cursor: pointer;"><i class="bi ${likeIconClass}"></i> ${post.likes || 0}</span>
                            <span class="post-stat post-comment-btn" style="cursor: pointer;"><i class="bi bi-chat"></i> ${post.comments ? post.comments.length : 0}</span>
                            <span class="${bookmarkButtonClass}" data-post-id="${post.id}" style="cursor: pointer;"><i class="bi ${bookmarkIconClass}"></i> ${post.bookmarkedBy ? post.bookmarkedBy.length : 0}</span>
                    </div>
                    </div>
                    <div class="post-comments"><!-- 默认收起，点击评论按钮后展开 --></div>
                `;
            userPostList.appendChild(postElement);
        });
    }
    
        // 同步动态数量
        postCount.textContent = userPosts.length;
        
        // 初始化评论交互
        initProfilePostInteractions();
    }
    
    // 加载关注和粉丝列表
    function loadFollowLists() {
        // 重新获取用户信息，确保数据是最新的
        const userList = JSON.parse(localStorage.getItem('userList') || '[]');
        
        // 更新clickUser的最新信息
        const updatedClickUser = userList.find(u => String(u.id) === String(clickUser.id));
        if (updatedClickUser) {
            clickUser = updatedClickUser;
        }
        
        if (!clickUser) return;
        
        // 关注数：从clickUser的following数组获取长度，需要去重计算
        const followingArr = clickUser.following || [];
        const uniqueFollowing = new Set(followingArr.filter(item => typeof item === 'string'));
        
        followingCount.textContent = uniqueFollowing.size;
        
        // 粉丝数：遍历所有用户，统计following数组中包含clickUser ID的用户数量
        // 确保数据类型一致，转换为字符串进行比较
        const clickUserId = String(clickUser.id);
        const followersArr = userList.filter(u => {
            if (!u.following || !Array.isArray(u.following)) return false;
            return u.following.some(id => String(id) === clickUserId);
        });
        followerCount.textContent = followersArr.length;
    }
    
    // 格式化时间
    function formatTime(timeStr) {
        const date = new Date(timeStr);
        const now = new Date();
        const diff = now - date;
        
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
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    }
    
    // 初始化标签切换
    function initProfileTabs() {
        profileTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                
                // 移除所有活动状态
                profileTabs.forEach(t => t.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                
                // 添加当前标签的活动状态
                this.classList.add('active');
                
                // 显示对应的内容
                const targetPane = document.getElementById(tabName + 'Tab');
                if (targetPane) {
                    targetPane.classList.add('active');
                    
                    // 如果切换到关注列表，加载关注数据
                    if (tabName === 'following') {
                        loadFollowingList();
                    }
                    
                    // 如果切换到收藏动态，加载收藏数据
                    if (tabName === 'bookmarks') {
                        loadBookmarksList();
                    }
                }
            });
        });
    }
    
    // 加载收藏动态列表
    function loadBookmarksList() {
        // 确保clickUser已初始化
        if (!clickUser) {
            console.error('clickUser未初始化');
            return;
        }
        
        // 获取所有动态
        let allPosts = JSON.parse(localStorage.getItem('postList') || '[]');
        
        // 获取当前用户信息
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { role: 'guest' };
        
        // 获取用户列表，用于检查封禁状态
        const userList = JSON.parse(localStorage.getItem('userList')) || [];
        
        // 过滤掉被封禁用户发布的帖子
        allPosts = allPosts.filter(post => {
            if (!post.user || !post.user.name) return true; // 保留没有用户信息的帖子
            
            // 查找用户是否被封禁
            const user = userList.find(u => u.username === post.user.name);
            return !user || !user.banned; // 如果用户不存在或未被封禁，则显示帖子
        });
        
        // 筛选clickUser收藏的动态
        let bookmarkedPosts = allPosts.filter(post => {
            if (!post.bookmarkedBy || !Array.isArray(post.bookmarkedBy)) return false;
            
            // 检查clickUser是否收藏了这条动态
            return post.bookmarkedBy.includes(clickUser.username);
        });
        
        // 获取收藏动态列表容器
        const bookmarksList = document.getElementById('bookmarksList');
        if (!bookmarksList) return;
        
        // 渲染收藏动态列表
        bookmarksList.innerHTML = '';
        if (bookmarkedPosts.length === 0) {
            bookmarksList.innerHTML = `
                <div class="bookmarks-empty">
                    <i class="bi bi-bookmark"></i>
                    <h3>还没有收藏任何动态</h3>
                    <p>去发现更多精彩内容吧！</p>
                </div>
            `;
            return;
        }
        
        // 按时间倒序排列
        bookmarkedPosts.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        // 复用个人动态的显示逻辑
        bookmarkedPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-item';
            postElement.setAttribute('data-post-id', post.id);
            
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
            
            // 格式化内容，处理换行和话题标签
            const formattedContent = post.content
                .replace(/\n/g, '</p><p>')
                .replace(/#(\S+)/g, '<a href="#" class="topic-tag">#$1</a>');
            
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
            
            // 检查当前用户是否已点赞此动态
            const isLiked = post.likedBy && post.likedBy.includes(currentUser?.username);
            const likeIconClass = isLiked ? 'bi-heart-fill' : 'bi-heart';
            const likeButtonClass = isLiked ? 'post-like-btn active' : 'post-like-btn';
            
            // 检查当前用户是否已收藏此动态
            const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(currentUser?.username);
            const bookmarkIconClass = isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark';
            const bookmarkButtonClass = isBookmarked ? 'post-bookmark-btn active' : 'post-bookmark-btn';
            
            // 从userList中获取最新的用户头像
            const userList = JSON.parse(localStorage.getItem('userList')) || [];
            const latestUserInfo = userList.find(u => u.username === post.user.name);
            const userAvatar = latestUserInfo?.avatar || post.user.avatar || 'src/images/DefaultAvatar.png';
            
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-avatar">
                        <img src="${userAvatar}" alt="头像">
                    </div>
                    <div class="post-author">
                        <div class="post-author-name">${post.user.nickname || post.user.name}</div>
                        <div class="post-time">
                            ${formatTime(post.time)}
                            <span class="visibility-badge" title="${visibilityText}">
                                ${visibilityIcon} ${visibilityText}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-text">${formattedContent}</div>
                    ${imagesHTML}
                </div>
                <div class="post-footer">
                    <div class="post-stats">
                        <span class="${likeButtonClass}" data-post-id="${post.id}" style="cursor: pointer;"><i class="bi ${likeIconClass}"></i> ${post.likes || 0}</span>
                        <span class="post-stat post-comment-btn" style="cursor: pointer;"><i class="bi bi-chat"></i> ${post.comments ? post.comments.length : 0}</span>
                        <span class="${bookmarkButtonClass}" data-post-id="${post.id}" style="cursor: pointer;"><i class="bi ${bookmarkIconClass}"></i> ${post.bookmarkedBy ? post.bookmarkedBy.length : 0}</span>
                    </div>
                </div>
                <div class="post-comments"><!-- 默认收起，点击评论按钮后展开 --></div>
            `;
            
            bookmarksList.appendChild(postElement);
        });
        
        // 复用个人动态的交互功能
        initProfilePostInteractions();
    }
    
    // 删除个人主页动态
    function deleteProfilePost(postId) {
        // 获取所有动态
        const allPosts = JSON.parse(localStorage.getItem('postList') || '[]');
        const postIndex = allPosts.findIndex(p => String(p.id) === String(postId));
        
        if (postIndex === -1) {
            alert('动态不存在');
            return;
        }
        
        // 检查是否是当前用户的动态
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const post = allPosts[postIndex];
        
        if (!currentUser || (String(post.user.id) !== String(currentUser.id) && post.user.name !== currentUser.username)) {
            alert('只能删除自己的动态');
            return;
        }
        
        // 从数组中删除动态
        allPosts.splice(postIndex, 1);
        
        // 保存到localStorage
        localStorage.setItem('postList', JSON.stringify(allPosts));
        
        // 从页面中移除动态元素
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
        
        // 更新动态数量
        const currentCount = parseInt(postCount.textContent) - 1;
        postCount.textContent = currentCount;
        
        // 显示成功消息
        showMessage('动态删除成功', 'success');
    }
});

/**
 * 关注/取消关注用户
 * @param {string} targetUsername - 目标用户名
 */
function toggleFollow(targetUsername) {
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
    
    if (currentUser.username === targetUsername) {
        alert('不能关注自己');
        return;
    }
    
    // 获取用户列表
    let users = JSON.parse(localStorage.getItem('userList')) || [];
    
    // 找到当前用户和目标用户
    const currentUserIndex = users.findIndex(u => u.username === currentUser.username);
    const targetUserIndex = users.findIndex(u => u.username === targetUsername);
    
    if (currentUserIndex === -1 || targetUserIndex === -1) {
        alert('用户不存在');
        return;
    }
    
    const currentUserData = users[currentUserIndex];
    const targetUserData = users[targetUserIndex];
    
    // 检查是否已经关注
    const isFollowing = currentUserData.following && currentUserData.following.includes(targetUsername);
    
    if (isFollowing) {
        // 取消关注
        currentUserData.following = currentUserData.following.filter(name => name !== targetUsername);
        targetUserData.followers = targetUserData.followers.filter(name => name !== currentUser.username);
    } else {
        // 添加关注
        if (!currentUserData.following) currentUserData.following = [];
        if (!targetUserData.followers) targetUserData.followers = [];
        
        currentUserData.following.push(targetUsername);
        targetUserData.followers.push(currentUser.username);
    }
    
    // 保存更新
    localStorage.setItem('userList', JSON.stringify(users));
    
    // 更新当前用户信息
    localStorage.setItem('currentUser', JSON.stringify(currentUserData));
    
    // 更新页面显示
    updateFollowButton(targetUsername, !isFollowing);
    updateFollowCounts();
}

/**
 * 更新关注和粉丝数量显示
 */
function updateFollowCounts() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userList = JSON.parse(localStorage.getItem('userList')) || [];
    const user = userList.find(u => u.username === currentUser.username);
    
    if (user) {
        // 更新关注数，只处理用户名
        const followingCount = document.querySelector('.following-count');
        if (followingCount) {
            const followingArr = user.following || [];
            // 只保留用户名，去重
            const uniqueFollowing = new Set(followingArr.filter(item => typeof item === 'string'));
            followingCount.textContent = uniqueFollowing.size;
        }
        
        // 更新粉丝数
        const followerCount = document.querySelector('.follower-count');
        if (followerCount) {
            const followers = userList.filter(u => 
                u.following && u.following.includes(user.username)
            );
            followerCount.textContent = followers.length;
        }
    }
}

// 确保全局可用
window.initProfilePostInteractions = initProfilePostInteractions;

/**
 * 更新userList中指定用户的头像
 * @param {string} username - 用户名
 * @param {string} newAvatar - 新的头像URL
 */
function updateUserAvatarInUserList(username, newAvatar) {
    let userList = JSON.parse(localStorage.getItem('userList')) || [];
    const userIndex = userList.findIndex(u => u.username === username);
    
    if (userIndex !== -1) {
        userList[userIndex].avatar = newAvatar;
        localStorage.setItem('userList', JSON.stringify(userList));
        console.log(`已更新userList中用户 ${username} 的头像`);
    } else {
        console.warn(`未找到用户 ${username} 在userList中`);
    }
}

/**
 * 更新postList中指定用户发布和评论的动态头像
 * @param {string} username - 用户名
 * @param {string} newAvatar - 新的头像URL
 */
function updateUserAvatarInPosts(username, newAvatar) {
    let postList = JSON.parse(localStorage.getItem('postList')) || [];
    let hasUpdated = false;
    
    // 遍历所有动态
    postList.forEach(post => {
        // 更新发布者头像
        if (post.user && post.user.name === username) {
            post.user.avatar = newAvatar;
            hasUpdated = true;
            console.log(`已更新动态 ${post.id} 中发布者 ${username} 的头像`);
        }
        
        // 更新评论者头像
        if (post.comments && post.comments.length > 0) {
            post.comments.forEach(comment => {
                // 兼容两种评论数据结构
                const commentUser = comment.user || {
                    name: comment.nickname || comment.username,
                    avatar: comment.avatar
                };
                
                if (commentUser.name === username) {
                    commentUser.avatar = newAvatar;
                    // 如果comment.user存在，直接更新；否则更新comment.avatar
                    if (comment.user) {
                        comment.user.avatar = newAvatar;
                    } else {
                        comment.avatar = newAvatar;
                    }
                    hasUpdated = true;
                    console.log(`已更新动态 ${post.id} 中评论者 ${username} 的头像`);
                }
            });
        }
    });
    
    if (hasUpdated) {
        localStorage.setItem('postList', JSON.stringify(postList));
        console.log(`已更新postList中用户 ${username} 的所有头像`);
    } else {
        console.log(`用户 ${username} 在postList中没有找到相关动态或评论`);
    }
}

// ========== 清理历史关注数据，只保留用户名 ========== //
function cleanFollowingList() {
    const userList = JSON.parse(localStorage.getItem('userList') || '[]');
    let hasChanges = false;
    
    userList.forEach(user => {
        if (Array.isArray(user.following)) {
            const originalLength = user.following.length;
            // 只保留用户名，移除所有ID
            user.following = user.following.filter(item => {
                if (typeof item === 'string') {
                    // 检查是否是有效的用户名
                    return userList.some(u => u.username === item);
                }
                return false; // 移除所有非字符串（ID）
            });
            
            if (user.following.length !== originalLength) {
                hasChanges = true;
                console.log(`清理用户 ${user.username} 的关注列表: ${originalLength} -> ${user.following.length}`);
            }
        }
        
        if (Array.isArray(user.followers)) {
            const originalLength = user.followers.length;
            // 只保留用户名，移除所有ID
            user.followers = user.followers.filter(item => {
                if (typeof item === 'string') {
                    // 检查是否是有效的用户名
                    return userList.some(u => u.username === item);
                }
                return false; // 移除所有非字符串（ID）
            });
            
            if (user.followers.length !== originalLength) {
                hasChanges = true;
                console.log(`清理用户 ${user.username} 的粉丝列表: ${originalLength} -> ${user.followers.length}`);
            }
        }
    });
    
    if (hasChanges) {
        localStorage.setItem('userList', JSON.stringify(userList));
        console.log('已清理所有用户的关注和粉丝数据，只保留用户名');
    }
}