// 社交互动功能模块

/**
 * 社交管理器
 */
class SocialManager {
    constructor() {
        this.init();
    }
    
    /**
     * 初始化
     */
    init() {
        this.bindEvents();
        this.initCheckin();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 签到按钮
        const checkinBtn = document.getElementById('checkin-btn');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', () => {
                this.handleCheckin();
            });
        }
        
        // 监听认证事件
        document.addEventListener('auth', (e) => {
            if (e.detail.type === 'login') {
                this.updateCheckinUI();
                this.loadRecommendedUsers();
            } else if (e.detail.type === 'logout') {
                this.updateCheckinUI();
                this.clearRecommendedUsers();
            }
        });
    }
    
    /**
     * 初始化签到功能
     */
    initCheckin() {
        this.updateCheckinUI();
    }
    
    /**
     * 更新签到UI
     */
    updateCheckinUI() {
        const checkinBtn = document.getElementById('checkin-btn');
        const checkinStreak = document.getElementById('checkin-streak');
        
        if (!checkinBtn || !checkinStreak) return;
        
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = '<i class="fas fa-calendar-check"></i> 请先登录';
            checkinStreak.textContent = '0';
            return;
        }
        
        const today = new Date().toDateString();
        const checkins = storage.get('checkins', {});
        const userCheckins = checkins[currentUser.id] || [];
        
        // 检查今天是否已签到
        const todayCheckin = userCheckins.find(checkin => 
            new Date(checkin.date).toDateString() === today
        );
        
        if (todayCheckin) {
            checkinBtn.disabled = true;
            checkinBtn.innerHTML = '<i class="fas fa-check-circle"></i> 今日已签到';
            checkinBtn.classList.add('checked-in');
        } else {
            checkinBtn.disabled = false;
            checkinBtn.innerHTML = '<i class="fas fa-calendar-check"></i> 签到打卡';
            checkinBtn.classList.remove('checked-in');
        }
        
        // 计算连续签到天数
        const streak = this.calculateCheckinStreak(currentUser.id);
        checkinStreak.textContent = streak.toString();
    }
    
    /**
     * 处理签到
     */
    handleCheckin() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }
        
        const today = new Date().toDateString();
        const checkins = storage.get('checkins', {});
        
        if (!checkins[currentUser.id]) {
            checkins[currentUser.id] = [];
        }
        
        // 检查今天是否已签到
        const todayCheckin = checkins[currentUser.id].find(checkin => 
            new Date(checkin.date).toDateString() === today
        );
        
        if (todayCheckin) {
            showToast('今天已经签到过了', 'warning');
            return;
        }
        
        // 添加签到记录
        const checkinRecord = {
            id: generateId(),
            date: new Date().toISOString(),
            points: 10 // 签到获得积分
        };
        
        checkins[currentUser.id].push(checkinRecord);
        storage.set('checkins', checkins);
        
        // 更新用户统计
        const user = userStorage.getUserById(currentUser.id);
        if (user) {
            user.stats.totalCheckins++;
            user.stats.checkinStreak = this.calculateCheckinStreak(currentUser.id);
            userStorage.updateUser(currentUser.id, user);
        }
        
        // 更新UI
        this.updateCheckinUI();
        
        // 显示签到成功消息
        const streak = this.calculateCheckinStreak(currentUser.id);
        let message = '签到成功！获得10积分';
        
        if (streak > 1) {
            message += `，连续签到${streak}天`;
        }
        
        if (streak >= 7) {
            message += '，获得额外奖励！';
        }
        
        showToast(message, 'success');
        
        // 签到动画效果
        this.playCheckinAnimation();
    }
    
    /**
     * 计算连续签到天数
     * @param {string} userId 用户ID
     * @returns {number}
     */
    calculateCheckinStreak(userId) {
        const checkins = storage.get('checkins', {});
        const userCheckins = checkins[userId] || [];
        
        if (userCheckins.length === 0) return 0;
        
        // 按日期排序
        userCheckins.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const checkin of userCheckins) {
            const checkinDate = new Date(checkin.date);
            checkinDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((currentDate - checkinDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    /**
     * 播放签到动画
     */
    playCheckinAnimation() {
        const checkinBtn = document.getElementById('checkin-btn');
        if (!checkinBtn) return;
        
        // 创建动画元素
        const animation = document.createElement('div');
        animation.className = 'checkin-animation';
        animation.innerHTML = '<i class="fas fa-star"></i>';
        
        checkinBtn.appendChild(animation);
        
        // 移除动画元素
        setTimeout(() => {
            if (animation.parentNode) {
                animation.parentNode.removeChild(animation);
            }
        }, 1000);
    }
    
    /**
     * 加载推荐用户
     */
    loadRecommendedUsers() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;
        
        const recommendedContainer = document.getElementById('recommended-users');
        if (!recommendedContainer) return;
        
        // 获取所有用户（排除当前用户）
        const allUsers = userStorage.getAllUsers({ active: true });
        const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
        
        // 简单的推荐算法：随机选择几个用户
        const recommendedUsers = otherUsers
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        
        if (recommendedUsers.length === 0) {
            recommendedContainer.innerHTML = '<p class="no-recommendations">暂无推荐用户</p>';
            return;
        }
        
        recommendedContainer.innerHTML = recommendedUsers.map(user => `
            <div class="recommended-user">
                <img src="${user.avatar}" alt="${user.nickname}" class="user-avatar">
                <div class="user-info">
                    <div class="user-name">${user.nickname}</div>
                    <div class="user-bio">${truncateText(user.bio, 30)}</div>
                </div>
                <button class="btn btn-outline btn-sm follow-btn" onclick="socialManager.toggleFollow('${user.id}')">
                    关注
                </button>
            </div>
        `).join('');
    }
    
    /**
     * 清除推荐用户
     */
    clearRecommendedUsers() {
        const recommendedContainer = document.getElementById('recommended-users');
        if (recommendedContainer) {
            recommendedContainer.innerHTML = '<p class="login-prompt">登录后查看推荐用户</p>';
        }
    }
    
    /**
     * 切换关注状态
     * @param {string} targetUserId 目标用户ID
     */
    toggleFollow(targetUserId) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            authManager.showAuthModal('login');
            return;
        }
        
        if (currentUser.id === targetUserId) {
            showToast('不能关注自己', 'warning');
            return;
        }
        
        const follows = storage.get('follows', {});
        const followKey = `${currentUser.id}_${targetUserId}`;
        
        const isFollowing = !!follows[followKey];
        
        if (isFollowing) {
            // 取消关注
            delete follows[followKey];
            this.updateFollowCount(currentUser.id, 'following', -1);
            this.updateFollowCount(targetUserId, 'followers', -1);
            showToast('已取消关注', 'success');
        } else {
            // 关注
            follows[followKey] = {
                followerId: currentUser.id,
                followingId: targetUserId,
                createdAt: new Date().toISOString()
            };
            this.updateFollowCount(currentUser.id, 'following', 1);
            this.updateFollowCount(targetUserId, 'followers', 1);
            showToast('关注成功', 'success');
        }
        
        storage.set('follows', follows);
        
        // 更新UI
        this.updateFollowButton(targetUserId, !isFollowing);
    }
    
    /**
     * 更新关注数量
     * @param {string} userId 用户ID
     * @param {string} type 类型（following或followers）
     * @param {number} increment 增量
     */
    updateFollowCount(userId, type, increment) {
        const user = userStorage.getUserById(userId);
        if (user) {
            if (type === 'following') {
                user.stats.followingCount = Math.max(0, (user.stats.followingCount || 0) + increment);
            } else if (type === 'followers') {
                user.stats.followersCount = Math.max(0, (user.stats.followersCount || 0) + increment);
            }
            userStorage.updateUser(userId, user);
        }
    }
    
    /**
     * 更新关注按钮状态
     * @param {string} targetUserId 目标用户ID
     * @param {boolean} isFollowing 是否已关注
     */
    updateFollowButton(targetUserId, isFollowing) {
        const followBtns = document.querySelectorAll(`[onclick*="${targetUserId}"]`);
        followBtns.forEach(btn => {
            if (btn.classList.contains('follow-btn')) {
                if (isFollowing) {
                    btn.textContent = '已关注';
                    btn.classList.remove('btn-outline');
                    btn.classList.add('btn-primary');
                } else {
                    btn.textContent = '关注';
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline');
                }
            }
        });
    }
    

    
    /**
     * 获取关注列表
     * @param {string} userId 用户ID
     * @param {string} type 类型（following或followers）
     * @returns {array}
     */
    getFollowList(userId, type = 'following') {
        const follows = storage.get('follows', {});
        const followList = Object.values(follows);
        
        if (type === 'following') {
            return followList.filter(follow => follow.followerId === userId);
        } else {
            return followList.filter(follow => follow.followingId === userId);
        }
    }
    
    /**
     * 获取用户统计数据
     * @param {string} userId 用户ID
     * @returns {object}
     */
    getUserStats(userId) {
        const user = userStorage.getUserById(userId);
        if (!user) return null;

        const posts = postStorage.getPosts({ authorId: userId });
        const checkins = storage.get('checkins', {});
        const userCheckins = checkins[userId] || [];

        return {
            postsCount: posts.length,
            followersCount: user.stats.followersCount || 0,
            followingCount: user.stats.followingCount || 0,
            likesReceived: user.stats.likesReceived || 0,
            totalCheckins: userCheckins.length,
            checkinStreak: this.calculateCheckinStreak(userId)
        };
    }

    /**
     * 检查是否关注某个用户
     * @param {string} followerId 关注者ID
     * @param {string} followingId 被关注者ID
     * @returns {boolean}
     */
    isFollowing(followerId, followingId) {
        const follows = storage.get('follows', {});
        const followKey = `${followerId}_${followingId}`;
        return !!follows[followKey];
    }
}

// 创建全局社交管理器实例
const socialManager = new SocialManager();

// 导出到全局作用域
window.socialManager = socialManager;
window.SocialManager = SocialManager;
