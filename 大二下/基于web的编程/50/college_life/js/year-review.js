// 年度回顾功能模块

/**
 * 年度回顾管理器
 */
class YearReviewManager {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.reviewData = null;
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
        // 年度回顾按钮
        const yearReviewBtn = document.getElementById('year-review-btn');
        if (yearReviewBtn) {
            yearReviewBtn.addEventListener('click', () => {
                this.showYearReview();
            });
        }
        
        // 年份选择器
        const yearSelect = document.getElementById('year-select');
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = parseInt(e.target.value);
                this.generateReview();
            });
        }
        
        // 分享按钮
        const shareReviewBtn = document.getElementById('share-review-btn');
        if (shareReviewBtn) {
            shareReviewBtn.addEventListener('click', () => {
                this.shareReview();
            });
        }
        
        // 下载按钮
        const downloadReviewBtn = document.getElementById('download-review-btn');
        if (downloadReviewBtn) {
            downloadReviewBtn.addEventListener('click', () => {
                this.downloadReview();
            });
        }
    }
    
    /**
     * 显示年度回顾页面
     */
    showYearReview() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) {
            showToast('请先登录', 'warning');
            return;
        }
        
        // 跳转到年度回顾页面
        if (typeof app !== 'undefined' && app.showPage) {
            app.showPage('year-review');
        }
        
        // 生成回顾数据
        this.generateReview();
    }
    
    /**
     * 生成年度回顾数据
     */
    generateReview() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser) return;
        
        const reviewContainer = document.getElementById('year-review-content');
        if (!reviewContainer) return;
        
        // 显示加载状态
        reviewContainer.innerHTML = '<div class="loading">正在生成年度回顾...</div>';
        
        // 模拟数据生成延迟
        setTimeout(() => {
            try {
                this.reviewData = this.calculateYearStats(currentUser.id, this.currentYear);
                this.renderReview(this.reviewData);
            } catch (error) {
                console.error('生成年度回顾失败:', error);
                reviewContainer.innerHTML = '<div class="error">生成年度回顾失败，请稍后重试</div>';
            }
        }, 1000);
    }
    
    /**
     * 计算年度统计数据
     * @param {string} userId 用户ID
     * @param {number} year 年份
     * @returns {object}
     */
    calculateYearStats(userId, year) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year + 1, 0, 1);
        
        // 获取用户所有动态
        const allPosts = postStorage.getPosts({ authorId: userId });
        const yearPosts = allPosts.filter(post => {
            const postDate = new Date(post.createdAt);
            return postDate >= yearStart && postDate < yearEnd;
        });
        
        // 获取签到数据
        const checkins = storage.get('checkins', {});
        const userCheckins = checkins[userId] || [];
        const yearCheckins = userCheckins.filter(checkin => {
            const checkinDate = new Date(checkin.date);
            return checkinDate >= yearStart && checkinDate < yearEnd;
        });
        
        // 获取点赞数据
        const likes = storage.get('likes', {});
        const userLikes = Object.values(likes).filter(like => 
            like.userId === userId && 
            new Date(like.createdAt) >= yearStart && 
            new Date(like.createdAt) < yearEnd
        );
        
        // 计算获得的点赞数
        let receivedLikes = 0;
        yearPosts.forEach(post => {
            receivedLikes += post.stats.likesCount || 0;
        });
        
        // 分析最活跃的月份
        const monthlyActivity = new Array(12).fill(0);
        yearPosts.forEach(post => {
            const month = new Date(post.createdAt).getMonth();
            monthlyActivity[month]++;
        });
        const mostActiveMonth = monthlyActivity.indexOf(Math.max(...monthlyActivity));
        
        // 分析最常用的标签
        const tagCount = {};
        yearPosts.forEach(post => {
            if (post.tags) {
                post.tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
        });
        const topTags = Object.entries(tagCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);
        
        // 计算最长签到连续天数
        let maxStreak = 0;
        let currentStreak = 0;
        const sortedCheckins = yearCheckins.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (let i = 0; i < sortedCheckins.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            } else {
                const prevDate = new Date(sortedCheckins[i - 1].date);
                const currDate = new Date(sortedCheckins[i].date);
                const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 1;
                }
            }
        }
        maxStreak = Math.max(maxStreak, currentStreak);
        
        // 计算总浏览量
        const totalViews = yearPosts.reduce((sum, post) => sum + (post.stats.viewsCount || 0), 0);
        
        return {
            year,
            totalPosts: yearPosts.length,
            totalCheckins: yearCheckins.length,
            totalLikes: userLikes.length,
            receivedLikes,
            totalViews,
            maxCheckinStreak: maxStreak,
            mostActiveMonth: mostActiveMonth,
            topTags,
            monthlyActivity,
            firstPost: yearPosts.length > 0 ? yearPosts[yearPosts.length - 1] : null,
            mostLikedPost: yearPosts.reduce((max, post) => 
                (post.stats.likesCount || 0) > (max?.stats?.likesCount || 0) ? post : max, null
            ),
            achievements: this.calculateAchievements(yearPosts, yearCheckins, receivedLikes)
        };
    }
    
    /**
     * 计算成就
     * @param {array} posts 动态列表
     * @param {array} checkins 签到列表
     * @param {number} receivedLikes 获得的点赞数
     * @returns {array}
     */
    calculateAchievements(posts, checkins, receivedLikes) {
        const achievements = [];
        
        if (posts.length >= 100) {
            achievements.push({ name: '创作达人', description: '发布了100+条动态', icon: 'fas fa-pen' });
        } else if (posts.length >= 50) {
            achievements.push({ name: '活跃用户', description: '发布了50+条动态', icon: 'fas fa-edit' });
        } else if (posts.length >= 10) {
            achievements.push({ name: '初出茅庐', description: '发布了10+条动态', icon: 'fas fa-seedling' });
        }
        
        if (checkins.length >= 300) {
            achievements.push({ name: '签到王者', description: '签到300+天', icon: 'fas fa-crown' });
        } else if (checkins.length >= 100) {
            achievements.push({ name: '坚持不懈', description: '签到100+天', icon: 'fas fa-medal' });
        } else if (checkins.length >= 30) {
            achievements.push({ name: '每日打卡', description: '签到30+天', icon: 'fas fa-calendar-check' });
        }
        
        if (receivedLikes >= 1000) {
            achievements.push({ name: '人气之星', description: '获得1000+点赞', icon: 'fas fa-star' });
        } else if (receivedLikes >= 500) {
            achievements.push({ name: '受欢迎', description: '获得500+点赞', icon: 'fas fa-heart' });
        } else if (receivedLikes >= 100) {
            achievements.push({ name: '小有名气', description: '获得100+点赞', icon: 'fas fa-thumbs-up' });
        }
        
        return achievements;
    }
    
    /**
     * 渲染年度回顾
     * @param {object} data 回顾数据
     */
    renderReview(data) {
        const reviewContainer = document.getElementById('year-review-content');
        if (!reviewContainer) return;
        
        const monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        
        reviewContainer.innerHTML = `
            <div class="review-section hero-section">
                <div class="review-hero">
                    <h2>${data.year}年，我在校园生活的足迹</h2>
                    <p>这一年，我用${data.totalPosts}条动态记录生活</p>
                </div>
            </div>
            
            <div class="review-section stats-section">
                <h3>我的年度数据</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-edit"></i></div>
                        <div class="stat-number">${data.totalPosts}</div>
                        <div class="stat-label">发布动态</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-heart"></i></div>
                        <div class="stat-number">${data.receivedLikes}</div>
                        <div class="stat-label">获得点赞</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-calendar-check"></i></div>
                        <div class="stat-number">${data.totalCheckins}</div>
                        <div class="stat-label">签到天数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-eye"></i></div>
                        <div class="stat-number">${data.totalViews}</div>
                        <div class="stat-label">总浏览量</div>
                    </div>
                </div>
            </div>
            
            ${data.achievements.length > 0 ? `
                <div class="review-section achievements-section">
                    <h3>我的成就</h3>
                    <div class="achievements-grid">
                        ${data.achievements.map(achievement => `
                            <div class="achievement-card">
                                <div class="achievement-icon"><i class="${achievement.icon}"></i></div>
                                <div class="achievement-name">${achievement.name}</div>
                                <div class="achievement-desc">${achievement.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="review-section activity-section">
                <h3>我最活跃的月份</h3>
                <div class="activity-chart">
                    <div class="active-month">
                        <div class="month-name">${monthNames[data.mostActiveMonth]}</div>
                        <div class="month-desc">这个月我发布了 ${data.monthlyActivity[data.mostActiveMonth]} 条动态</div>
                    </div>
                    <div class="monthly-bars">
                        ${data.monthlyActivity.map((count, index) => `
                            <div class="month-bar ${index === data.mostActiveMonth ? 'active' : ''}">
                                <div class="bar" style="height: ${Math.max(count / Math.max(...data.monthlyActivity) * 100, 5)}%"></div>
                                <div class="month-label">${monthNames[index]}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            ${data.topTags.length > 0 ? `
                <div class="review-section tags-section">
                    <h3>我最爱的话题</h3>
                    <div class="top-tags">
                        ${data.topTags.map((tag, index) => `
                            <span class="top-tag rank-${index + 1}">#${tag}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${data.mostLikedPost ? `
                <div class="review-section highlight-section">
                    <h3>我最受欢迎的动态</h3>
                    <div class="highlight-post">
                        <div class="post-content">${truncateText(data.mostLikedPost.content, 100)}</div>
                        <div class="post-stats">
                            <span><i class="fas fa-heart"></i> ${data.mostLikedPost.stats.likesCount}</span>
                            <span><i class="fas fa-comment"></i> ${data.mostLikedPost.stats.commentsCount}</span>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="review-section summary-section">
                <h3>年度总结</h3>
                <div class="summary-text">
                    <p>${data.year}年，我在校园生活平台上度过了充实的一年。</p>
                    <p>发布了 <strong>${data.totalPosts}</strong> 条动态，获得了 <strong>${data.receivedLikes}</strong> 个点赞，坚持签到 <strong>${data.totalCheckins}</strong> 天。</p>
                    ${data.maxCheckinStreak > 0 ? `<p>最长连续签到 <strong>${data.maxCheckinStreak}</strong> 天，展现了我的坚持精神。</p>` : ''}
                    <p>感谢这一年来所有朋友的支持和陪伴，期待新的一年有更多精彩！</p>
                </div>
            </div>
        `;
        
        // 添加动画效果
        setTimeout(() => {
            const sections = reviewContainer.querySelectorAll('.review-section');
            sections.forEach((section, index) => {
                setTimeout(() => {
                    section.classList.add('fade-in');
                }, index * 200);
            });
        }, 100);
    }
    
    /**
     * 分享年度回顾
     */
    shareReview() {
        if (!this.reviewData) {
            showToast('请先生成年度回顾', 'warning');
            return;
        }
        
        const currentUser = authManager.getCurrentUser();
        const shareText = `我的${this.reviewData.year}年度回顾：发布了${this.reviewData.totalPosts}条动态，获得了${this.reviewData.receivedLikes}个点赞，签到${this.reviewData.totalCheckins}天！来校园生活平台看看我的精彩一年吧！`;
        
        if (navigator.share) {
            navigator.share({
                title: `${currentUser.nickname}的${this.reviewData.year}年度回顾`,
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(shareText)
                .then(() => showToast('年度回顾已复制到剪贴板', 'success'))
                .catch(() => showToast('分享失败', 'error'));
        }
    }
    
    /**
     * 下载年度回顾图片
     */
    downloadReview() {
        showToast('图片下载功能开发中...', 'info');
        // 这里可以使用html2canvas等库来生成图片
    }
}

// 创建全局年度回顾管理器实例
const yearReviewManager = new YearReviewManager();

// 导出到全局作用域
window.yearReviewManager = yearReviewManager;
window.YearReviewManager = YearReviewManager;
