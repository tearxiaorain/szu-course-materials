// 演示数据初始化

/**
 * 演示数据管理器
 */
class DemoDataManager {
    constructor() {
        this.isInitialized = false;
    }
    
    /**
     * 初始化演示数据
     */
    initDemoData() {
        if (this.isInitialized) return;
        
        // 检查是否已有数据
        const users = storage.get('users', {});
        if (Object.keys(users).length > 0) {
            this.isInitialized = true;
            return;
        }
        
        console.log('初始化演示数据...');
        
        // 创建演示用户
        this.createDemoUsers();
        
        // 创建演示动态
        this.createDemoPosts();
        
        // 创建演示互动数据
        this.createDemoInteractions();

        // 创建演示评论数据
        this.createDemoComments();

        this.isInitialized = true;
        console.log('演示数据初始化完成');
    }
    
    /**
     * 创建演示用户
     */
    createDemoUsers() {
        const demoUsers = [
            {
                username: 'alice_student',
                nickname: '爱丽丝',
                password: '123456',
                bio: '计算机科学专业大三学生，热爱编程和设计 💻✨',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'
            },
            {
                username: 'bob_tech',
                nickname: '小明',
                password: '123456',
                bio: '软件工程专业，喜欢篮球和音乐 🏀🎵',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'
            },
            {
                username: 'carol_art',
                nickname: '小红',
                password: '123456',
                bio: '美术学院学生，专注插画和平面设计 🎨',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol'
            },
            {
                username: 'david_music',
                nickname: '大卫',
                password: '123456',
                bio: '音乐学院钢琴专业，古典音乐爱好者 🎹',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david'
            },
            {
                username: 'emma_writer',
                nickname: '艾玛',
                password: '123456',
                bio: '中文系研究生，喜欢写作和阅读 📚✍️',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma'
            }
        ];
        
        demoUsers.forEach(userData => {
            const user = userStorage.createUser(userData);
            if (user) {
                // 添加一些统计数据
                user.stats.followersCount = Math.floor(Math.random() * 100) + 10;
                user.stats.followingCount = Math.floor(Math.random() * 80) + 5;
                userStorage.updateUser(user.id, user);
            }
        });
    }
    
    /**
     * 创建演示动态
     */
    createDemoPosts() {
        const users = userStorage.getAllUsers();
        if (users.length === 0) return;
        
        const demoPosts = [
            {
                content: '今天的算法课学了动态规划，感觉打开了新世界的大门！#编程学习 #算法',
                tags: ['编程学习', '算法'],
                images: []
            },
            {
                content: '图书馆的夕阳真美，适合学习和思考 📚☀️',
                tags: [],
                images: ['https://picsum.photos/400/300?random=1']
            },
            {
                content: '刚完成了一个小项目，用React做的待办事项应用。虽然简单但很有成就感！#前端开发 #React',
                tags: ['前端开发', 'React'],
                images: []
            },
            {
                content: '今天和室友一起做了蛋糕，第一次尝试烘焙，虽然卖相不太好但味道还不错 🍰',
                tags: ['烘焙', '生活'],
                images: ['https://picsum.photos/400/300?random=2']
            },
            {
                content: '参加了学校的篮球比赛，虽然输了但过程很精彩！团队合作真的很重要 🏀',
                tags: ['篮球', '运动'],
                images: []
            },
            {
                content: '最近在画一幅风景画，灵感来自校园里的梧桐大道 🎨 #绘画 #校园生活',
                tags: ['绘画', '校园生活'],
                images: ['https://picsum.photos/400/300?random=3']
            },
            {
                content: '今晚的音乐会演出很成功！感谢所有来听的朋友们 🎹✨ #音乐 #演出',
                tags: ['音乐', '演出'],
                images: ['https://picsum.photos/400/300?random=4']
            },
            {
                content: '写完了这学期的第一篇论文，虽然熬了夜但很有收获。学术路漫漫~ #学术 #论文',
                tags: ['学术', '论文'],
                images: []
            },
            {
                content: '和朋友们一起去爬山，山顶的风景太美了！运动后的心情格外舒畅 ⛰️',
                tags: ['爬山', '运动', '友谊'],
                images: ['https://picsum.photos/400/300?random=5', 'https://picsum.photos/400/300?random=6']
            },
            {
                content: '今天在咖啡厅读了一下午书，《百年孤独》真的是神作！#阅读 #文学',
                tags: ['阅读', '文学'],
                images: []
            }
        ];
        
        // 为每个用户创建一些动态
        users.forEach((user, userIndex) => {
            const userPostCount = Math.floor(Math.random() * 3) + 1; // 每个用户1-3条动态
            
            for (let i = 0; i < userPostCount; i++) {
                const postIndex = (userIndex * userPostCount + i) % demoPosts.length;
                const postData = {
                    ...demoPosts[postIndex],
                    authorId: user.id,
                    visibility: Math.random() > 0.1 ? 'public' : 'private' // 90%公开，10%私密
                };
                
                const post = postStorage.createPost(postData);
                
                if (post) {
                    // 随机添加一些统计数据
                    post.stats.likesCount = Math.floor(Math.random() * 50);
                    post.stats.commentsCount = Math.floor(Math.random() * 20);
                    post.stats.viewsCount = Math.floor(Math.random() * 200) + 10;
                    
                    // 随机设置创建时间（过去30天内）
                    const daysAgo = Math.floor(Math.random() * 30);
                    const createdAt = new Date();
                    createdAt.setDate(createdAt.getDate() - daysAgo);
                    post.createdAt = createdAt.toISOString();
                    
                    postStorage.updatePost(post.id, post);
                }
            }
        });
    }
    
    /**
     * 创建演示互动数据
     */
    createDemoInteractions() {
        const users = userStorage.getAllUsers();
        const posts = postStorage.getPosts();
        
        if (users.length === 0 || posts.length === 0) return;
        
        // 创建关注关系
        users.forEach((user, index) => {
            const followCount = Math.floor(Math.random() * 3) + 1;
            const otherUsers = users.filter(u => u.id !== user.id);
            
            for (let i = 0; i < Math.min(followCount, otherUsers.length); i++) {
                const targetUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                const follows = storage.get('follows', {});
                const followKey = `${user.id}_${targetUser.id}`;
                
                if (!follows[followKey]) {
                    follows[followKey] = {
                        followerId: user.id,
                        followingId: targetUser.id,
                        createdAt: new Date().toISOString()
                    };
                    storage.set('follows', follows);
                }
            }
        });
        
        // 创建点赞数据
        posts.forEach(post => {
            const likeCount = post.stats.likesCount || 0;
            const likes = storage.get('likes', {});
            
            for (let i = 0; i < likeCount; i++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const likeKey = `${randomUser.id}_${post.id}_post`;
                
                if (!likes[likeKey]) {
                    likes[likeKey] = {
                        userId: randomUser.id,
                        targetId: post.id,
                        type: 'post',
                        createdAt: new Date().toISOString()
                    };
                }
            }
            
            storage.set('likes', likes);
        });
        
        // 创建签到数据
        users.forEach(user => {
            const checkins = storage.get('checkins', {});
            if (!checkins[user.id]) {
                checkins[user.id] = [];
            }
            
            // 为每个用户创建过去30天内的随机签到记录
            const checkinDays = Math.floor(Math.random() * 20) + 5; // 5-25天
            const checkinDates = [];
            
            for (let i = 0; i < checkinDays; i++) {
                const daysAgo = Math.floor(Math.random() * 30);
                const checkinDate = new Date();
                checkinDate.setDate(checkinDate.getDate() - daysAgo);
                
                // 避免重复日期
                const dateString = checkinDate.toDateString();
                if (!checkinDates.includes(dateString)) {
                    checkinDates.push(dateString);
                    checkins[user.id].push({
                        id: generateId(),
                        date: checkinDate.toISOString(),
                        points: 10
                    });
                }
            }
            
            storage.set('checkins', checkins);
        });
    }

    /**
     * 创建演示评论数据
     */
    createDemoComments() {
        const users = userStorage.getAllUsers();
        const posts = postStorage.getPosts();

        if (users.length === 0 || posts.length === 0) return;

        // 预定义的评论内容模板
        const commentTemplates = [
            '太棒了！👍',
            '很有意思的分享',
            '学到了，谢谢分享！',
            '同感！我也有类似的经历',
            '哈哈哈，太有趣了',
            '加油！支持你',
            '这个想法很不错',
            '期待更多分享',
            '真的很棒！',
            '我也想试试',
            '好厉害啊！',
            '很有启发性',
            '赞同你的观点',
            '继续努力！',
            '很实用的经验',
            '感谢分享这么好的内容',
            '我也遇到过类似的情况',
            '这个方法很好用',
            '学习了！',
            '很有道理',
            '支持！',
            '太赞了！',
            '很有帮助',
            '说得很对',
            '我也这么觉得'
        ];

        // 为每个帖子创建评论
        posts.forEach(post => {
            const targetCommentCount = post.stats.commentsCount || 0;

            for (let i = 0; i < targetCommentCount; i++) {
                // 随机选择一个用户作为评论者
                const randomUser = users[Math.floor(Math.random() * users.length)];

                // 随机选择评论内容
                const commentContent = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];

                // 创建评论数据
                const commentData = {
                    postId: post.id,
                    authorId: randomUser.id,
                    content: commentContent
                };

                const comment = commentStorage.createComment(commentData);

                if (comment) {
                    // 随机设置评论的点赞数
                    comment.stats.likesCount = Math.floor(Math.random() * 10);

                    // 随机设置评论时间（在帖子创建时间之后）
                    const postDate = new Date(post.createdAt);
                    const commentDate = new Date(postDate);
                    const hoursAfter = Math.floor(Math.random() * 24 * 7); // 帖子发布后7天内
                    commentDate.setHours(commentDate.getHours() + hoursAfter);
                    comment.createdAt = commentDate.toISOString();

                    // 更新评论
                    const comments = storage.get('comments', {});
                    comments[comment.id] = comment;
                    storage.set('comments', comments);

                    // 为评论创建点赞数据
                    this.createCommentLikes(comment, users);
                }
            }
        });
    }

    /**
     * 为评论创建点赞数据
     * @param {object} comment 评论对象
     * @param {array} users 用户列表
     */
    createCommentLikes(comment, users) {
        const likeCount = comment.stats.likesCount || 0;
        const likes = storage.get('likes', {});

        for (let i = 0; i < likeCount; i++) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const likeKey = `${randomUser.id}_${comment.id}_comment`;

            if (!likes[likeKey]) {
                likes[likeKey] = {
                    userId: randomUser.id,
                    targetId: comment.id,
                    type: 'comment',
                    createdAt: new Date().toISOString()
                };
            }
        }

        storage.set('likes', likes);
    }

    /**
     * 清除所有演示数据
     */
    clearDemoData() {
        if (confirm('确定要清除所有演示数据吗？此操作不可恢复。')) {
            storage.clear();
            this.isInitialized = false;
            showToast('演示数据已清除', 'success');
            
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
    
    /**
     * 重新初始化演示数据
     */
    reinitDemoData() {
        this.clearDemoData();
        setTimeout(() => {
            this.initDemoData();
        }, 1000);
    }
}

// 创建全局演示数据管理器实例
const demoDataManager = new DemoDataManager();

// 演示数据将由初始化管理器统一管理，不在此处自动初始化
// 如需手动初始化演示数据，请调用 demoDataManager.initDemoData()

// 添加到全局作用域（用于调试）
window.demoDataManager = demoDataManager;
