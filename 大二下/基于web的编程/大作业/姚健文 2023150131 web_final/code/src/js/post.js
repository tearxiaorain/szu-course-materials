/**
 * 动态发布页面脚本
 */

// 图片存储管理
let uploadedImages = [];

document.addEventListener('DOMContentLoaded', function() {
    // 初始化页面
    initPage();
    
    // 绑定事件
    bindEvents();
});

/**
 * 初始化页面
 */
function initPage() {
    // 检查登录状态
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showMessage('请先登录后再发布动态', 'error');
        setTimeout(() => {
            window.location.href = './login.html';
        }, 1500);
        return;
    }
    
    // 调用common.js中的登录状态检查函数，确保UI正确显示
    if (typeof checkLoginStatus === 'function') {
        checkLoginStatus();
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 图片上传
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // 话题标签点击
    const topicTags = document.querySelectorAll('.topic-tag');
    topicTags.forEach(tag => {
        tag.addEventListener('click', toggleTopicTag);
    });
    
    // 添加自定义话题
    const addTopicBtn = document.getElementById('addCustomTopic');
    if (addTopicBtn) {
        addTopicBtn.addEventListener('click', addCustomTopic);
    }
    
    // 取消按钮
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('确定要取消发布吗？已编辑的内容将不会保存。')) {
                window.location.href = './index.html';
            }
        });
    }
    
    // 表单提交
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handleSubmit);
    }
}

/**
 * 处理图片上传
 * @param {Event} e - 事件对象
 */
function handleImageUpload(e) {
    const files = e.target.files;
    const preview = document.getElementById('uploadPreview');
    const errorElement = document.getElementById('contentError');
    
    // 清除错误信息
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    // 检查图片数量限制
    const existingImages = preview.querySelectorAll('.preview-item').length;
    if (existingImages + files.length > 9) {
        if (errorElement) {
            errorElement.textContent = '最多只能上传9张图片';
        }
        return;
    }
    
    // 处理每个文件
    Array.from(files).forEach(file => {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            if (errorElement) {
                errorElement.textContent = '只能上传图片文件';
            }
            return;
        }
        
        // 检查文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
            if (errorElement) {
                errorElement.textContent = '图片大小不能超过5MB';
            }
            return;
        }
        
        // 创建预览元素
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        // 创建图片元素
        const img = document.createElement('img');
        img.file = file;
        previewItem.appendChild(img);
        
        // 创建删除按钮
        const removeBtn = document.createElement('div');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '<i class="bi bi-x"></i>';
        removeBtn.addEventListener('click', function() {
            // 从上传图片数组中移除
            const index = Array.from(preview.children).indexOf(previewItem);
            if (index > -1) {
                uploadedImages.splice(index, 1);
            }
            preview.removeChild(previewItem);
        });
        previewItem.appendChild(removeBtn);
        
        // 添加到预览区域
        preview.appendChild(previewItem);
        
        // 读取文件并显示预览
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
            
            // 生成图片路径并存储（同时存储路径和base64数据）
            const imagePath = generateImagePath(file);
            uploadedImages.push({
                path: imagePath,
                file: file,
                preview: e.target.result  // 存储base64数据
            });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * 生成图片路径
 * @param {File} file - 图片文件
 * @returns {string} 图片路径
 */
function generateImagePath(file) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const extension = file.name.split('.').pop();
    return `user_uploads/${timestamp}_${random}.${extension}`;
}

/**
 * 切换话题标签选中状态
 * @param {Event} e - 事件对象
 */
function toggleTopicTag(e) {
    const tag = e.currentTarget;
    tag.classList.toggle('selected');
    
    // 检查选中的标签数量
    const selectedTags = document.querySelectorAll('.topic-tag.selected');
    if (selectedTags.length > 3) {
        tag.classList.remove('selected');
        const topicError = document.getElementById('contentError');
        if (topicError) {
            topicError.textContent = '最多只能选择3个话题';
        }
    } else {
        const topicError = document.getElementById('contentError');
        if (topicError) {
            topicError.textContent = '';
        }
    }
}

/**
 * 添加自定义话题
 */
function addCustomTopic() {
    const customTopicInput = document.getElementById('customTopic');
    const topicValue = customTopicInput.value.trim();
    const topicError = document.getElementById('contentError');
    const topicTags = document.getElementById('topicTags');
    
    // 验证输入
    if (!topicValue) {
        if (topicError) {
            topicError.textContent = '话题不能为空';
        }
        return;
    }
    
    if (topicValue.length > 20) {
        if (topicError) {
            topicError.textContent = '话题不能超过20个字符';
        }
        return;
    }
    
    // 检查是否已存在相同话题
    const existingTags = document.querySelectorAll('.topic-tag');
    for (let i = 0; i < existingTags.length; i++) {
        if (existingTags[i].getAttribute('data-tag') === topicValue) {
            if (topicError) {
                topicError.textContent = '该话题已存在';
            }
            return;
        }
    }
    
    // 创建新话题标签
    const newTag = document.createElement('div');
    newTag.className = 'topic-tag';
    newTag.setAttribute('data-tag', topicValue);
    newTag.textContent = '#' + topicValue;
    newTag.addEventListener('click', toggleTopicTag);
    
    // 添加到话题区域
    topicTags.appendChild(newTag);
    
    // 清空输入框
    customTopicInput.value = '';
    
    // 清除错误信息
    if (topicError) {
        topicError.textContent = '';
    }
}

/**
 * 处理表单提交
 * @param {Event} e - 事件对象
 */
function handleSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const content = document.getElementById('postContent').value.trim();
    const imagePaths = uploadedImages.map(img => img.path); // 只存储图片路径
    const topics = Array.from(document.querySelectorAll('.topic-tag.selected')).map(tag => tag.getAttribute('data-tag'));
    const visibility = document.querySelector('input[name="privacy"]:checked').value;
    
    // 验证内容
    const contentError = document.getElementById('contentError');
    if (!content && imagePaths.length === 0) {
        if (contentError) {
            contentError.textContent = '请输入内容或上传图片';
        }
        return;
    }
    
    if (content.length > 1000) {
        if (contentError) {
            contentError.textContent = '内容不能超过1000个字符';
        }
        return;
    }
    
    // 检查用户登录状态
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
    
    // 构建动态数据
    const postData = {
        id: generateUniqueId(),
        userId: getCurrentUserId(),
        content: content,
        images: imagePaths, // 只存储图片路径
        topics: topics,
        visibility: visibility,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0
    };
    
    // 模拟发布请求
    simulatePostRequest(postData);
}

/**
 * 模拟发布请求
 * @param {Object} postData - 动态数据
 */
function simulatePostRequest(postData) {
    // 显示加载状态
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> 发布中...';
    }
    
    // 模拟网络请求延迟
    setTimeout(() => {
        // 获取本地存储的动态数据
        let posts = JSON.parse(localStorage.getItem('postList') || '[]');
        
        // 获取当前用户信息
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // 存储图片数据到localStorage（同时存储路径和base64数据）
        const imageStorage = JSON.parse(localStorage.getItem('imageStorage') || '{}');
        uploadedImages.forEach(img => {
            imageStorage[img.path] = img.preview;  // 存储base64数据
        });
        localStorage.setItem('imageStorage', JSON.stringify(imageStorage));
        
        // 构建完整的动态数据
        const newPost = {
            id: postData.id,
            user: {
                id: currentUser.id || currentUser.username,
                name: currentUser.username,
                nickname: currentUser.nickname || currentUser.name || currentUser.username,
                avatar: currentUser.avatar || 'src/images/DefaultAvatar.png',
                department: currentUser.department || '未知学院'
            },
            content: postData.content,
            images: postData.images, // 存储图片路径
            topics: postData.topics, // 存储话题标签
            time: new Date(),
            likes: 0,
            likedBy: [], // 点赞用户列表
            bookmarkedBy: [], // 收藏用户列表
            visibility: postData.visibility,
            comments: []
        };
        
        // 添加新动态到开头
        posts.unshift(newPost);
        
        // 保存到本地存储
        localStorage.setItem('postList', JSON.stringify(posts));
        
        // 显示成功消息
        showMessage('动态发布成功', 'success');
        
        // 跳转到首页
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1500);
    }, 1000);
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * 获取当前用户ID
 * @returns {string} 用户ID
 */
function getCurrentUserId() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    return currentUser ? currentUser.id : null;
}

/**
 * 显示消息提示
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型（success/error/info）
 */
function showMessage(message, type = 'info') {
    // 检查是否已存在消息元素
    let messageElement = document.querySelector('.message-toast');
    
    // 如果不存在，创建一个新的
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = 'message-toast';
        document.body.appendChild(messageElement);
    }
    
    // 设置消息内容和类型
    messageElement.textContent = message;
    messageElement.className = `message-toast ${type}`;
    
    // 显示消息
    messageElement.classList.add('show');
    
    // 3秒后隐藏消息
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
}

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
function isLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}