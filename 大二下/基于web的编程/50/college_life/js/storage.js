// 本地存储管理模块

/**
 * 存储管理器
 */
class StorageManager {
    constructor() {
        this.prefix = 'campus_social_';
        this.init();
    }
    
    /**
     * 初始化存储
     */
    init() {
        // 检查localStorage是否可用
        if (!this.isStorageAvailable()) {
            console.warn('localStorage不可用，数据将无法持久化');
            return;
        }
        
        // 初始化基础数据结构
        this.initializeData();
    }
    
    /**
     * 检查localStorage是否可用
     * @returns {boolean}
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * 初始化数据结构
     */
    initializeData() {
        const defaultData = {
            users: {},
            posts: {},
            comments: {},
            likes: {},
            follows: {},
            checkins: {},
            drafts: {},
            settings: {
                theme: 'light',
                language: 'zh-CN',
                notifications: true
            },
            currentUser: null,
            statistics: {
                totalUsers: 0,
                totalPosts: 0,
                totalComments: 0,
                totalLikes: 0
            }
        };
        
        // 检查并初始化各个数据表
        Object.keys(defaultData).forEach(key => {
            if (!this.get(key)) {
                this.set(key, defaultData[key]);
            }
        });
    }
    
    /**
     * 获取完整的键名
     * @param {string} key 键名
     * @returns {string}
     */
    getKey(key) {
        return this.prefix + key;
    }
    
    /**
     * 设置数据
     * @param {string} key 键名
     * @param {any} value 值
     * @returns {boolean} 是否成功
     */
    set(key, value) {
        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), serializedValue);
            return true;
        } catch (e) {
            console.error('存储数据失败:', e);
            return false;
        }
    }
    
    /**
     * 获取数据
     * @param {string} key 键名
     * @param {any} defaultValue 默认值
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('读取数据失败:', e);
            return defaultValue;
        }
    }
    
    /**
     * 删除数据
     * @param {string} key 键名
     * @returns {boolean}
     */
    remove(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (e) {
            console.error('删除数据失败:', e);
            return false;
        }
    }
    
    /**
     * 清空所有数据
     * @returns {boolean}
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            this.initializeData();
            return true;
        } catch (e) {
            console.error('清空数据失败:', e);
            return false;
        }
    }
    
    /**
     * 获取存储大小（字节）
     * @returns {number}
     */
    getStorageSize() {
        let total = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                total += localStorage.getItem(key).length;
            }
        });
        return total;
    }
    
    /**
     * 导出数据
     * @returns {object}
     */
    exportData() {
        const data = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                const cleanKey = key.replace(this.prefix, '');
                data[cleanKey] = this.get(cleanKey);
            }
        });
        return data;
    }
    
    /**
     * 导入数据
     * @param {object} data 数据对象
     * @returns {boolean}
     */
    importData(data) {
        try {
            Object.keys(data).forEach(key => {
                this.set(key, data[key]);
            });
            return true;
        } catch (e) {
            console.error('导入数据失败:', e);
            return false;
        }
    }
}

/**
 * 用户数据管理
 */
class UserStorage {
    constructor(storage) {
        this.storage = storage;
    }
    
    /**
     * 创建用户
     * @param {object} userData 用户数据
     * @returns {object|null}
     */
    createUser(userData) {
        const users = this.storage.get('users', {});
        const userId = generateId();
        
        const user = {
            id: userId,
            username: userData.username,
            nickname: userData.nickname,
            password: userData.password, // 实际应用中应该加密
            avatar: userData.avatar || getRandomAvatar(userData.username),
            bio: userData.bio || '这个人很懒，什么都没有留下...',
            interests: userData.interests || [],
            email: userData.email || '',
            phone: userData.phone || '',
            gender: userData.gender || '',
            birthday: userData.birthday || '',
            location: userData.location || '',
            website: userData.website || '',
            joinDate: new Date().toISOString(),
            lastLoginDate: new Date().toISOString(),
            isActive: true,
            isVerified: false,
            role: 'user', // user, admin, moderator
            settings: {
                privacy: 'public', // public, private, friends
                notifications: {
                    likes: true,
                    comments: true,
                    follows: true,
                    mentions: true
                }
            },
            stats: {
                postsCount: 0,
                followersCount: 0,
                followingCount: 0,
                likesReceived: 0,
                checkinStreak: 0,
                totalCheckins: 0
            }
        };
        
        users[userId] = user;
        this.storage.set('users', users);
        
        // 更新统计
        this.updateStatistics('totalUsers', 1);
        
        return user;
    }
    
    /**
     * 根据用户名获取用户
     * @param {string} username 用户名
     * @returns {object|null}
     */
    getUserByUsername(username) {
        const users = this.storage.get('users', {});
        return Object.values(users).find(user => user.username === username) || null;
    }
    
    /**
     * 根据ID获取用户
     * @param {string} userId 用户ID
     * @returns {object|null}
     */
    getUserById(userId) {
        const users = this.storage.get('users', {});
        return users[userId] || null;
    }
    
    /**
     * 更新用户信息
     * @param {string} userId 用户ID
     * @param {object} updateData 更新数据
     * @returns {object|null}
     */
    updateUser(userId, updateData) {
        const users = this.storage.get('users', {});
        if (!users[userId]) return null;
        
        users[userId] = { ...users[userId], ...updateData };
        this.storage.set('users', users);
        
        return users[userId];
    }
    
    /**
     * 删除用户
     * @param {string} userId 用户ID
     * @returns {boolean}
     */
    deleteUser(userId) {
        const users = this.storage.get('users', {});
        if (!users[userId]) return false;
        
        delete users[userId];
        this.storage.set('users', users);
        
        // 更新统计
        this.updateStatistics('totalUsers', -1);
        
        return true;
    }
    
    /**
     * 获取所有用户
     * @param {object} options 选项
     * @returns {array}
     */
    getAllUsers(options = {}) {
        const users = this.storage.get('users', {});
        let userList = Object.values(users);
        
        // 过滤
        if (options.active !== undefined) {
            userList = userList.filter(user => user.isActive === options.active);
        }
        
        // 排序
        if (options.sortBy) {
            userList.sort((a, b) => {
                const aValue = a[options.sortBy];
                const bValue = b[options.sortBy];
                
                if (options.sortOrder === 'desc') {
                    return bValue > aValue ? 1 : -1;
                }
                return aValue > bValue ? 1 : -1;
            });
        }
        
        // 分页
        if (options.page && options.limit) {
            const start = (options.page - 1) * options.limit;
            const end = start + options.limit;
            userList = userList.slice(start, end);
        }
        
        return userList;
    }
    
    /**
     * 搜索用户
     * @param {string} query 搜索关键词
     * @param {object} options 选项
     * @returns {array}
     */
    searchUsers(query, options = {}) {
        const users = this.storage.get('users', {});
        const userList = Object.values(users);
        
        const results = userList.filter(user => {
            const searchText = `${user.username} ${user.nickname} ${user.bio}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        return results.slice(0, options.limit || 10);
    }
    
    /**
     * 更新统计数据
     * @param {string} key 统计键
     * @param {number} increment 增量
     */
    updateStatistics(key, increment) {
        const stats = this.storage.get('statistics', {});
        stats[key] = (stats[key] || 0) + increment;
        this.storage.set('statistics', stats);
    }
}

/**
 * 动态数据管理
 */
class PostStorage {
    constructor(storage) {
        this.storage = storage;
    }
    
    /**
     * 创建动态
     * @param {object} postData 动态数据
     * @returns {object|null}
     */
    createPost(postData) {
        const posts = this.storage.get('posts', {});
        const postId = generateId();
        
        const post = {
            id: postId,
            authorId: postData.authorId,
            content: postData.content,
            images: postData.images || [],
            visibility: postData.visibility || 'public',
            tags: postData.tags || [],
            location: postData.location || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: {
                likesCount: 0,
                commentsCount: 0,
                sharesCount: 0,
                viewsCount: 0
            },
            isDeleted: false
        };
        
        posts[postId] = post;
        this.storage.set('posts', posts);
        
        // 更新用户统计
        const users = this.storage.get('users', {});
        const user = users[postData.authorId];
        if (user) {
            user.stats.postsCount = (user.stats.postsCount || 0) + 1;
            users[postData.authorId] = user;
            this.storage.set('users', users);
        }
        
        // 更新全局统计
        this.updateStatistics('totalPosts', 1);
        
        return post;
    }
    
    /**
     * 获取动态
     * @param {string} postId 动态ID
     * @returns {object|null}
     */
    getPost(postId) {
        const posts = this.storage.get('posts', {});
        const post = posts[postId];
        
        if (post && !post.isDeleted) {
            // 增加浏览量
            post.stats.viewsCount++;
            posts[postId] = post;
            this.storage.set('posts', posts);
            
            return post;
        }
        
        return null;
    }
    
    /**
     * 更新动态
     * @param {string} postId 动态ID
     * @param {object} updateData 更新数据
     * @returns {object|null}
     */
    updatePost(postId, updateData) {
        const posts = this.storage.get('posts', {});
        if (!posts[postId] || posts[postId].isDeleted) return null;
        
        posts[postId] = { 
            ...posts[postId], 
            ...updateData, 
            updatedAt: new Date().toISOString() 
        };
        this.storage.set('posts', posts);
        
        return posts[postId];
    }
    
    /**
     * 删除动态
     * @param {string} postId 动态ID
     * @returns {boolean}
     */
    deletePost(postId) {
        const posts = this.storage.get('posts', {});
        if (!posts[postId]) return false;
        
        posts[postId].isDeleted = true;
        this.storage.set('posts', posts);
        
        // 更新统计
        this.updateStatistics('totalPosts', -1);
        
        return true;
    }
    
    /**
     * 获取动态列表
     * @param {object} options 选项
     * @returns {array}
     */
    getPosts(options = {}) {
        const posts = this.storage.get('posts', {});
        let postList = Object.values(posts).filter(post => !post.isDeleted);

        // 过滤
        if (options.authorId) {
            postList = postList.filter(post => post.authorId === options.authorId);
        }

        if (options.visibility) {
            postList = postList.filter(post => post.visibility === options.visibility);
        }

        // 排序
        if (options.sortBy === 'popular') {
            // 按点赞数降序排序
            postList.sort((a, b) => (b.stats.likesCount || 0) - (a.stats.likesCount || 0));
        } else {
            // 默认按创建时间降序排序
            postList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // 分页
        if (options.page && options.limit) {
            const start = (options.page - 1) * options.limit;
            const end = start + options.limit;
            postList = postList.slice(start, end);
        }

        return postList;
    }
    
    /**
     * 搜索动态
     * @param {string} query 搜索关键词
     * @param {object} options 选项
     * @returns {array}
     */
    searchPosts(query, options = {}) {
        const posts = this.storage.get('posts', {});
        const postList = Object.values(posts).filter(post => !post.isDeleted);
        
        const results = postList.filter(post => {
            const searchText = `${post.content} ${post.tags.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        return results.slice(0, options.limit || 10);
    }
    
    /**
     * 更新统计数据
     * @param {string} key 统计键
     * @param {number} increment 增量
     */
    updateStatistics(key, increment) {
        const stats = this.storage.get('statistics', {});
        stats[key] = (stats[key] || 0) + increment;
        this.storage.set('statistics', stats);
    }
}

/**
 * 评论数据管理
 */
class CommentStorage {
    constructor(storage) {
        this.storage = storage;
    }

    /**
     * 创建评论
     * @param {object} commentData 评论数据
     * @returns {object|null}
     */
    createComment(commentData) {
        const comments = this.storage.get('comments', {});
        const commentId = generateId();

        const comment = {
            id: commentId,
            postId: commentData.postId,
            authorId: commentData.authorId,
            content: commentData.content,
            parentId: commentData.parentId || null, // 用于回复评论
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stats: {
                likesCount: 0
            },
            isDeleted: false
        };

        comments[commentId] = comment;
        this.storage.set('comments', comments);

        // 更新动态评论数
        const posts = this.storage.get('posts', {});
        const post = posts[commentData.postId];
        if (post && !post.isDeleted) {
            post.stats.commentsCount = (post.stats.commentsCount || 0) + 1;
            posts[commentData.postId] = post;
            this.storage.set('posts', posts);
        }

        // 更新全局统计
        this.updateStatistics('totalComments', 1);

        return comment;
    }

    /**
     * 获取单个评论
     * @param {string} commentId 评论ID
     * @returns {object|null}
     */
    getComment(commentId) {
        const comments = this.storage.get('comments', {});
        const comment = comments[commentId];
        return (comment && !comment.isDeleted) ? comment : null;
    }

    /**
     * 获取评论列表
     * @param {string} postId 动态ID
     * @param {object} options 选项
     * @returns {array}
     */
    getComments(postId, options = {}) {
        const comments = this.storage.get('comments', {});
        let commentList = Object.values(comments).filter(
            comment => comment.postId === postId && !comment.isDeleted
        );

        // 排序
        commentList.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        return commentList;
    }

    /**
     * 删除评论
     * @param {string} commentId 评论ID
     * @returns {boolean}
     */
    deleteComment(commentId) {
        const comments = this.storage.get('comments', {});
        if (!comments[commentId]) return false;

        comments[commentId].isDeleted = true;
        this.storage.set('comments', comments);

        // 更新统计
        this.updateStatistics('totalComments', -1);

        return true;
    }

    /**
     * 更新统计数据
     * @param {string} key 统计键
     * @param {number} increment 增量
     */
    updateStatistics(key, increment) {
        const stats = this.storage.get('statistics', {});
        stats[key] = (stats[key] || 0) + increment;
        this.storage.set('statistics', stats);
    }
}

/**
 * 点赞数据管理
 */
class LikeStorage {
    constructor(storage) {
        this.storage = storage;
    }

    /**
     * 点赞/取消点赞
     * @param {string} userId 用户ID
     * @param {string} targetId 目标ID（动态或评论）
     * @param {string} type 类型（post或comment）
     * @returns {boolean} 是否点赞（true为点赞，false为取消点赞）
     */
    toggleLike(userId, targetId, type = 'post') {
        const likes = this.storage.get('likes', {});
        const likeKey = `${userId}_${targetId}_${type}`;

        const isLiked = !!likes[likeKey];

        if (isLiked) {
            // 取消点赞
            delete likes[likeKey];
            this.updateTargetLikeCount(targetId, type, -1);
        } else {
            // 点赞
            likes[likeKey] = {
                userId,
                targetId,
                type,
                createdAt: new Date().toISOString()
            };
            this.updateTargetLikeCount(targetId, type, 1);
        }

        this.storage.set('likes', likes);
        return !isLiked;
    }

    /**
     * 检查是否已点赞
     * @param {string} userId 用户ID
     * @param {string} targetId 目标ID
     * @param {string} type 类型
     * @returns {boolean}
     */
    isLiked(userId, targetId, type = 'post') {
        const likes = this.storage.get('likes', {});
        const likeKey = `${userId}_${targetId}_${type}`;
        return !!likes[likeKey];
    }

    /**
     * 获取用户点赞的内容
     * @param {string} userId 用户ID
     * @param {string} type 类型
     * @returns {array}
     */
    getUserLikes(userId, type = 'post') {
        const likes = this.storage.get('likes', {});
        return Object.values(likes).filter(
            like => like.userId === userId && like.type === type
        );
    }

    /**
     * 更新目标的点赞数
     * @param {string} targetId 目标ID
     * @param {string} type 类型
     * @param {number} increment 增量
     */
    updateTargetLikeCount(targetId, type, increment) {
        if (type === 'post') {
            const posts = this.storage.get('posts', {});
            const post = posts[targetId];
            if (post && !post.isDeleted) {
                post.stats.likesCount = Math.max(0, (post.stats.likesCount || 0) + increment);
                posts[targetId] = post;
                this.storage.set('posts', posts);
            }
        } else if (type === 'comment') {
            const comments = this.storage.get('comments', {});
            if (comments[targetId]) {
                comments[targetId].stats.likesCount = Math.max(0, (comments[targetId].stats.likesCount || 0) + increment);
                this.storage.set('comments', comments);
            }
        }

        // 更新全局统计
        const stats = this.storage.get('statistics', {});
        stats.totalLikes = (stats.totalLikes || 0) + increment;
        this.storage.set('statistics', stats);
    }
}

// 创建全局存储实例
const storage = new StorageManager();
const userStorage = new UserStorage(storage);
const postStorage = new PostStorage(storage);
const commentStorage = new CommentStorage(storage);
const likeStorage = new LikeStorage(storage);

// 导出到全局作用域
window.StorageManager = StorageManager;
window.UserStorage = UserStorage;
window.PostStorage = PostStorage;
window.CommentStorage = CommentStorage;
window.LikeStorage = LikeStorage;

window.storage = storage;
window.userStorage = userStorage;
window.postStorage = postStorage;
window.commentStorage = commentStorage;
window.likeStorage = likeStorage;

console.log('✅ 存储系统已初始化并导出到全局作用域');
