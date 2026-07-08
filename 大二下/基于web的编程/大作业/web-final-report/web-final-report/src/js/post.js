/**
 * 动态发布页面脚本
 */

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
    checkLoginStatus();
    
    // 如果未登录，跳转到登录页面
    if (!isLoggedIn()) {
        showMessage('请先登录后再发布动态', 'error');
        setTimeout(() => {
            window.location.href = './login.html';
        }, 1500);
    }
}

/**
 * 绑定事件
 */
function bindEvents() {
    // 图片上传
    const imageUpload = document.getElementById('image-upload');
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // 话题标签点击
    const topicTags = document.querySelectorAll('.topic-tag');
    topicTags.forEach(tag => {
        tag.addEventListener('click', toggleTopicTag);
    });
    
    // 添加自定义话题
    const addTopicBtn = document.getElementById('add-topic-btn');
    if (addTopicBtn) {
        addTopicBtn.addEventListener('click', addCustomTopic);
    }
    
    // 位置按钮点击
    const locationBtn = document.getElementById('location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', openLocationModal);
    }
    
    // 关闭位置模态框
    const closeLocationModal = document.getElementById('close-location-modal');
    if (closeLocationModal) {
        closeLocationModal.addEventListener('click', closeLocationModalHandler);
    }
    
    // 位置项点击
    const locationItems = document.querySelectorAll('.location-item');
    locationItems.forEach(item => {
        item.addEventListener('click', selectLocation);
    });
    
    // 位置搜索
    const locationSearch = document.getElementById('location-search');
    if (locationSearch) {
        locationSearch.addEventListener('input', searchLocation);
    }
    
    // 取消按钮
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('确定要取消发布吗？已编辑的内容将不会保存。')) {
                window.location.href = './index.html';
            }
        });
    }
    
    // 表单提交
    const postForm = document.getElementById('post-form');
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
    const preview = document.getElementById('image-preview');
    const errorElement = document.getElementById('image-error');
    
    // 清除错误信息
    errorElement.textContent = '';
    
    // 检查图片数量限制
    const existingImages = preview.querySelectorAll('.preview-item').length;
    if (existingImages + files.length > 9) {
        errorElement.textContent = '最多只能上传9张图片';
        return;
    }
    
    // 处理每个文件
    Array.from(files).forEach(file => {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            errorElement.textContent = '只能上传图片文件';
            return;
        }
        
        // 检查文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
            errorElement.textContent = '图片大小不能超过5MB';
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
        removeBtn.innerHTML = '<i class="ri-close-line"></i>';
        removeBtn.addEventListener('click', function() {
            preview.removeChild(previewItem);
        });
        previewItem.appendChild(removeBtn);
        
        // 添加到预览区域
        preview.appendChild(previewItem);
        
        // 读取文件并显示预览
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
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
        document.getElementById('topic-error').textContent = '最多只能选择3个话题';
    } else {
        document.getElementById('topic-error').textContent = '';
    }
}

/**
 * 添加自定义话题
 */
function addCustomTopic() {
    const customTopicInput = document.getElementById('custom-topic');
    const topicValue = customTopicInput.value.trim();
    const topicError = document.getElementById('topic-error');
    const topicTags = document.getElementById('topic-tags');
    
    // 验证输入
    if (!topicValue) {
        topicError.textContent = '话题不能为空';
        return;
    }
    
    if (topicValue.length > 20) {
        topicError.textContent = '话题不能超过20个字符';
        return;
    }
    
    // 检查是否已存在相同话题
    const existingTags = document.querySelectorAll('.topic-tag');
    for (let i = 0; i < existingTags.length; i++) {
        if (existingTags[i].getAttribute('data-topic') === topicValue) {
            topicError.textContent = '该话题已存在';
            return;
        }
    }
    
    // 检查话题数量限制
    if (existingTags.length >= 20) {
        topicError.textContent = '话题数量已达上限';
        return;
    }
    
    // 创建新话题标签
    const newTag = document.createElement('span');
    newTag.className = 'topic-tag';
    newTag.setAttribute('data-topic', topicValue);
    newTag.textContent = topicValue;
    newTag.addEventListener('click', toggleTopicTag);
    
    // 添加到话题区域
    topicTags.appendChild(newTag);
    
    // 清空输入框和错误信息
    customTopicInput.value = '';
    topicError.textContent = '';
}

/**
 * 打开位置选择模态框
 */
function openLocationModal() {
    const modal = document.getElementById('location-modal');
    modal.classList.add('active');
    
    // 阻止页面滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭位置选择模态框
 */
function closeLocationModalHandler() {
    const modal = document.getElementById('location-modal');
    modal.classList.remove('active');
    
    // 恢复页面滚动
    document.body.style.overflow = '';
}

/**
 * 选择位置
 * @param {Event} e - 事件对象
 */
function selectLocation(e) {
    const locationItem = e.currentTarget;
    const locationName = locationItem.getAttribute('data-location');
    const locationText = document.getElementById('location-text');
    const locationBtn = document.getElementById('location-btn');
    
    // 更新位置文本
    locationText.textContent = locationName;
    
    // 添加选中样式
    locationBtn.classList.add('active');
    
    // 关闭模态框
    closeLocationModalHandler();
}

/**
 * 搜索位置
 * @param {Event} e - 事件对象
 */
function searchLocation(e) {
    const searchValue = e.target.value.toLowerCase();
    const locationItems = document.querySelectorAll('.location-item');
    
    locationItems.forEach(item => {
        const locationName = item.getAttribute('data-location').toLowerCase();
        const locationAddress = item.querySelector('.location-address').textContent.toLowerCase();
        
        if (locationName.includes(searchValue) || locationAddress.includes(searchValue)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * 处理表单提交
 * @param {Event} e - 事件对象
 */
function handleSubmit(e) {
    e.preventDefault();
    
    // 获取表单数据
    const content = document.getElementById('post-content').value.trim();
    const images = Array.from(document.querySelectorAll('.preview-item img')).map(img => img.src);
    const topics = Array.from(document.querySelectorAll('.topic-tag.selected')).map(tag => tag.getAttribute('data-topic'));
    const locationBtn = document.getElementById('location-btn');
    const location = locationBtn.classList.contains('active') ? document.getElementById('location-text').textContent : null;
    const privacy = document.querySelector('input[name="privacy"]:checked').value;
    
    // 验证内容
    const contentError = document.getElementById('content-error');
    if (!content && images.length === 0) {
        contentError.textContent = '请输入内容或上传图片';
        return;
    }
    
    if (content.length > 1000) {
        contentError.textContent = '内容不能超过1000个字符';
        return;
    }
    
    // 构建动态数据
    const postData = {
        id: generateUniqueId(),
        userId: getCurrentUserId(),
        content: content,
        images: images,
        topics: topics,
        location: location,
        privacy: privacy,
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
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-2-line ri-spin"></i> 发布中...';
    
    // 模拟网络请求延迟
    setTimeout(() => {
        // 获取本地存储的动态数据
        let posts = JSON.parse(localStorage.getItem('posts') || '[]');
        
        // 添加新动态
        posts.unshift(postData);
        
        // 保存到本地存储
        localStorage.setItem('posts', JSON.stringify(posts));
        
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