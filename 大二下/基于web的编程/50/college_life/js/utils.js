// 工具函数库

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 格式化时间
 * @param {Date|string|number} date 日期
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diff = now - targetDate;
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;
    
    if (diff < minute) {
        return '刚刚';
    } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前';
    } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前';
    } else if (diff < week) {
        return Math.floor(diff / day) + '天前';
    } else if (diff < month) {
        return Math.floor(diff / week) + '周前';
    } else if (diff < year) {
        return Math.floor(diff / month) + '个月前';
    } else {
        return Math.floor(diff / year) + '年前';
    }
}

/**
 * 格式化数字（如点赞数、关注数等）
 * @param {number} num 数字
 * @returns {string} 格式化后的数字字符串
 */
function formatNumber(num) {
    if (num < 1000) {
        return num.toString();
    } else if (num < 10000) {
        return (num / 1000).toFixed(1) + 'K';
    } else if (num < 100000) {
        return Math.floor(num / 1000) + 'K';
    } else if (num < 1000000) {
        return Math.floor(num / 10000) + 'W';
    } else {
        return (num / 1000000).toFixed(1) + 'M';
    }
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 验证用户名格式
 * @param {string} username 用户名
 * @returns {boolean} 是否有效
 */
function validateUsername(username) {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
}

/**
 * 验证密码强度
 * @param {string} password 密码
 * @returns {object} 验证结果
 */
function validatePassword(password) {
    const result = {
        valid: false,
        message: '',
        strength: 0
    };
    
    if (password.length < 6) {
        result.message = '密码至少需要6位字符';
        return result;
    }
    
    if (password.length > 50) {
        result.message = '密码不能超过50位字符';
        return result;
    }
    
    let strength = 0;
    
    // 检查是否包含小写字母
    if (/[a-z]/.test(password)) strength++;
    
    // 检查是否包含大写字母
    if (/[A-Z]/.test(password)) strength++;
    
    // 检查是否包含数字
    if (/\d/.test(password)) strength++;
    
    // 检查是否包含特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    result.strength = strength;
    result.valid = true;
    
    if (strength <= 1) {
        result.message = '密码强度：弱';
    } else if (strength <= 2) {
        result.message = '密码强度：中';
    } else {
        result.message = '密码强度：强';
    }
    
    return result;
}

/**
 * 验证邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * 转义HTML字符
 * @param {string} text 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 截取文本
 * @param {string} text 原文本
 * @param {number} maxLength 最大长度
 * @returns {string} 截取后的文本
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

/**
 * 检测图片URL是否有效
 * @param {string} url 图片URL
 * @returns {Promise<boolean>} 是否有效
 */
function isValidImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

/**
 * 压缩图片
 * @param {File} file 图片文件
 * @param {number} maxWidth 最大宽度
 * @param {number} maxHeight 最大高度
 * @param {number} quality 压缩质量 (0-1)
 * @returns {Promise<string>} 压缩后的base64字符串
 */
function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // 计算新的尺寸
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制并压缩图片
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/**
 * 显示Toast通知
 * @param {string} message 消息内容
 * @param {string} type 消息类型 (success, error, warning, info)
 * @param {number} duration 显示时长（毫秒）
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // 设置图标
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toastIcon.className = `toast-icon ${icons[type] || icons.info}`;
    toastMessage.textContent = message;
    
    // 设置样式类
    toast.className = `toast ${type}`;
    
    // 显示Toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * 深拷贝对象
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 获取随机头像URL
 * @param {string} seed 种子字符串
 * @returns {string} 头像URL
 */
function getRandomAvatar(seed = '') {
    const avatarServices = [
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
        `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`,
        `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`
    ];
    
    const index = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % avatarServices.length;
    return avatarServices[index];
}

/**
 * 检查是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
function isMobile() {
    return window.innerWidth <= 767;
}

/**
 * 平滑滚动到指定元素
 * @param {string|Element} target 目标元素或选择器
 * @param {number} offset 偏移量
 */
function scrollToElement(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

// 导出工具函数（如果使用模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateId,
        formatTime,
        formatNumber,
        debounce,
        throttle,
        validateUsername,
        validatePassword,
        validateEmail,
        escapeHtml,
        truncateText,
        isValidImageUrl,
        compressImage,
        showToast,
        deepClone,
        getRandomAvatar,
        isMobile,
        scrollToElement
    };
}
