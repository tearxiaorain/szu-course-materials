/**
 * 个人资料页面脚本
 */

document.addEventListener('DOMContentLoaded', function() {
    // 检查用户登录状态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // 未登录，跳转到登录页面
        window.location.href = 'login.html';
        return;
    }
    
    // 更新页面标题
    document.title = `${currentUser.nickname || currentUser.name} 的个人资料 - 荔荔社区`;
    
    // 获取DOM元素
    const profileName = document.getElementById('profileName');
    const profileId = document.getElementById('profileId');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileCover = document.getElementById('profileCover');
    const userAvatar = document.getElementById('userAvatar');
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
    
    // 加载用户相册
    loadUserPhotos();
    
    // 加载用户好友
    loadUserFriends();
    
    // 标签页切换
    const tabItems = document.querySelectorAll('.profile-tabs li');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有标签页的活动状态
            tabItems.forEach(tab => tab.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // 设置当前标签页为活动状态
            this.classList.add('active');
            document.getElementById(`${tabId}Tab`).classList.add('active');
        });
    });
    
    // 编辑资料模态框
    editProfileBtn.addEventListener('click', function() {
        // 填充表单数据
        fillEditForm();
        // 显示模态框
        editProfileModal.classList.add('active');
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
        avatarInput.click();
    });
    
    avatarInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                profileAvatar.src = e.target.result;
                userAvatar.src = e.target.result;
                
                // 更新用户头像
                const user = JSON.parse(localStorage.getItem('currentUser'));
                user.avatar = e.target.result;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                showMessage('头像更新成功', 'success');
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // 封面上传
    editCoverBtn.addEventListener('click', function() {
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
        // 从本地存储获取用户资料
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // 更新页面显示
        profileName.textContent = user.nickname || user.name;
        profileId.textContent = `学号：${user.studentId}`;
        
        if (user.avatar) {
            profileAvatar.src = user.avatar;
            userAvatar.src = user.avatar;
        }
        
        if (user.cover) {
            profileCover.src = user.cover;
        }
        
        // 更新统计数据（模拟数据）
        postCount.textContent = user.postCount || '0';
        followingCount.textContent = user.followingCount || '0';
        followerCount.textContent = user.followerCount || '0';
        
        // 更新个人信息
        userNickname.textContent = user.nickname || user.name;
        userGender.textContent = user.gender || '未设置';
        userBirthday.textContent = user.birthday || '未设置';
        userLocation.textContent = user.location || '未设置';
        userCollege.textContent = user.college || '未设置';
        userMajor.textContent = user.major || '未设置';
        userBio.textContent = user.bio || '这个人很懒，什么都没留下...';
        
        // 更新兴趣标签
        if (user.interestTags && user.interestTags.length > 0) {
            userInterests.innerHTML = '';
            user.interestTags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'interest-tag';
                tagElement.textContent = tag;
                userInterests.appendChild(tagElement);
            });
        }
    }
    
    // 填充编辑表单
    function fillEditForm() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
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
        // 获取当前用户数据
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        // 更新用户数据
        Object.assign(user, data);
        
        // 保存到本地存储
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // 更新页面显示
        loadUserProfile();
        
        // 显示成功消息
        showMessage('个人资料更新成功', 'success');
    }
    
    // 加载用户动态
    function loadUserPosts() {
        // 模拟动态数据
        const posts = [
            {
                id: 1,
                content: '今天参加了校园歌手大赛，感觉很棒！#校园活动 #音乐',
                images: ['src/images/post-1.jpg', 'src/images/post-2.jpg'],
                time: '2023-11-15 14:30',
                likes: 42,
                comments: 8,
                shares: 3
            },
            {
                id: 2,
                content: '图书馆的学习氛围真好，期末复习加油！#学习 #期末',
                images: ['src/images/post-3.jpg'],
                time: '2023-11-10 09:15',
                likes: 18,
                comments: 5,
                shares: 0
            },
            {
                id: 3,
                content: '和朋友一起参加了志愿者活动，帮助社区清理环境，感觉很有意义！#志愿者 #环保',
                images: [],
                time: '2023-11-05 16:45',
                likes: 36,
                comments: 12,
                shares: 7
            }
        ];
        
        // 渲染动态列表
        userPostList.innerHTML = '';
        
        if (posts.length === 0) {
            userPostList.innerHTML = '<div class="empty-state">暂无动态</div>';
            return;
        }
        
        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post-item';
            
            // 构建图片HTML
            let imagesHTML = '';
            if (post.images && post.images.length > 0) {
                imagesHTML = '<div class="post-images">';
                post.images.forEach(image => {
                    imagesHTML += `
                        <div class="post-image">
                            <img src="${image}" alt="动态图片">
                        </div>
                    `;
                });
                imagesHTML += '</div>';
            }
            
            // 构建动态HTML
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-avatar">
                        <img src="${profileAvatar.src}" alt="头像">
                    </div>
                    <div class="post-author">
                        <div class="post-author-name">${profileName.textContent}</div>
                        <div class="post-time">${formatTime(post.time)}</div>
                    </div>
                    <div class="post-actions">
                        <button class="post-menu-btn"><i class="bi bi-three-dots"></i></button>
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-text">${formatContent(post.content)}</div>
                    ${imagesHTML}
                </div>
                <div class="post-footer">
                    <div class="post-stats">
                        <div class="post-stat"><i class="bi bi-heart"></i> ${post.likes}</div>
                        <div class="post-stat"><i class="bi bi-chat"></i> ${post.comments}</div>
                        <div class="post-stat"><i class="bi bi-share"></i> ${post.shares}</div>
                    </div>
                    <div class="post-interactions">
                        <div class="post-interaction" data-action="like"><i class="bi bi-heart"></i> 点赞</div>
                        <div class="post-interaction" data-action="comment"><i class="bi bi-chat"></i> 评论</div>
                        <div class="post-interaction" data-action="share"><i class="bi bi-share"></i> 分享</div>
                    </div>
                </div>
            `;
            
            // 添加交互事件
            const likeBtn = postElement.querySelector('.post-interaction[data-action="like"]');
            likeBtn.addEventListener('click', function() {
                this.classList.toggle('active');
                const likeCount = postElement.querySelector('.post-stat:first-child');
                const currentLikes = parseInt(likeCount.textContent.match(/\d+/)[0]);
                
                if (this.classList.contains('active')) {
                    likeCount.innerHTML = `<i class="bi bi-heart-fill"></i> ${currentLikes + 1}`;
                    this.innerHTML = `<i class="bi bi-heart-fill"></i> 已点赞`;
                } else {
                    likeCount.innerHTML = `<i class="bi bi-heart"></i> ${currentLikes - 1}`;
                    this.innerHTML = `<i class="bi bi-heart"></i> 点赞`;
                }
            });
            
            userPostList.appendChild(postElement);
        });
    }
    
    // 加载用户相册
    function loadUserPhotos() {
        // 模拟相册数据
        const photos = [
            'src/images/photo-1.jpg',
            'src/images/photo-2.jpg',
            'src/images/photo-3.jpg',
            'src/images/photo-4.jpg',
            'src/images/photo-5.jpg',
            'src/images/photo-6.jpg',
            'src/images/post-1.jpg',
            'src/images/post-2.jpg',
            'src/images/post-3.jpg'
        ];
        
        // 渲染相册
        userPhotoGrid.innerHTML = '';
        
        if (photos.length === 0) {
            userPhotoGrid.innerHTML = '<div class="empty-state">暂无照片</div>';
            return;
        }
        
        photos.forEach(photo => {
            const photoElement = document.createElement('div');
            photoElement.className = 'photo-item';
            photoElement.innerHTML = `<img src="${photo}" alt="照片">`;
            
            // 点击查看大图
            photoElement.addEventListener('click', function() {
                // 实现查看大图功能
                const modal = document.createElement('div');
                modal.className = 'photo-modal';
                modal.innerHTML = `
                    <div class="photo-modal-content">
                        <span class="close-modal">&times;</span>
                        <img src="${photo}" alt="照片大图">
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // 关闭大图
                const closeBtn = modal.querySelector('.close-modal');
                closeBtn.addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
                
                // 点击模态框外部关闭
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
            });
            
            userPhotoGrid.appendChild(photoElement);
        });
    }
    
    // 加载用户好友
    function loadUserFriends() {
        // 模拟好友数据
        const friends = [
            {
                id: 1,
                name: '李四',
                avatar: 'src/images/avatar-1.jpg',
                college: '计算机学院'
            },
            {
                id: 2,
                name: '王五',
                avatar: 'src/images/avatar-2.jpg',
                college: '经济管理学院'
            },
            {
                id: 3,
                name: '赵六',
                avatar: 'src/images/avatar-3.jpg',
                college: '外国语学院'
            },
            {
                id: 4,
                name: '钱七',
                avatar: 'src/images/avatar-4.jpg',
                college: '艺术学院'
            },
            {
                id: 5,
                name: '孙八',
                avatar: 'src/images/avatar-5.jpg',
                college: '体育学院'
            }
        ];
        
        // 渲染好友列表
        userFriendsList.innerHTML = '';
        
        if (friends.length === 0) {
            userFriendsList.innerHTML = '<div class="empty-state">暂无好友</div>';
            return;
        }
        
        friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `
                <div class="friend-avatar">
                    <img src="${friend.avatar}" alt="${friend.name}">
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-meta">${friend.college}</div>
                </div>
                <div class="friend-actions">
                    <button class="btn btn-sm btn-outline">发消息</button>
                </div>
            `;
            
            userFriendsList.appendChild(friendElement);
        });
    }
    
    // 格式化内容（处理话题标签等）
    function formatContent(content) {
        // 处理话题标签 #xxx
        return content.replace(/#([^\s#]+)/g, '<a href="topic.html?tag=$1" class="topic-tag">#$1</a>');
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
    
    // 显示消息提示
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
});