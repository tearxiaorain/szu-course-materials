// 应用初始化脚本

/**
 * 简化的应用初始化管理器
 */
class AppInitializer {
    constructor() {
        this.isInitialized = false;
        this.initPromise = null;
    }
    
    /**
     * 检查模块是否已加载
     * @param {string} moduleName 模块名称
     * @returns {boolean}
     */
    checkModule(moduleName) {
        try {
            // 直接检查全局变量
            return typeof window[moduleName] !== 'undefined';
        } catch (error) {
            return false;
        }
    }

    /**
     * 等待模块加载
     * @param {string} moduleName 模块名称
     * @param {number} timeout 超时时间（毫秒）
     * @returns {Promise<boolean>}
     */
    waitForModule(moduleName, timeout = 5000) {
        return new Promise((resolve) => {
            if (this.checkModule(moduleName)) {
                resolve(true);
                return;
            }

            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (this.checkModule(moduleName)) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 50);
        });
    }

    /**
     * 执行初始化
     */
     async executeInit() {
        console.log('🚀 开始应用初始化...');

        try {
            // 更新加载状态
            this.updateLoadingStatus('正在检查基础模块...');

            // 第一步：等待并验证存储系统
            this.updateLoadingStatus('正在初始化存储系统...');
            console.log('📦 初始化存储系统...');

            // 等待存储模块加载完成
            await new Promise(resolve => setTimeout(resolve, 500));

            // 验证核心存储实例（更宽松的检查）
            const coreInstances = ['storage', 'userStorage', 'postStorage'];
            let retryCount = 0;
            const maxRetries = 5; // 减少重试次数

            while (retryCount < maxRetries) {
                let loadedCount = 0;
                for (const instanceName of coreInstances) {
                    if (this.checkModule(instanceName)) {
                        loadedCount++;
                    }
                }

                // 只要有基本的存储模块就继续
                if (loadedCount >= 1) {
                    console.log(`✅ 存储实例已加载 (${loadedCount}/${coreInstances.length})`);
                    break;
                }

                retryCount++;
                console.log(`等待存储实例加载... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // 即使存储系统未完全加载也继续初始化
            if (retryCount >= maxRetries) {
                console.warn('⚠️ 存储系统加载不完整，但继续初始化');
            }

            // 第二步：测试存储功能
            this.updateLoadingStatus('正在测试存储功能...');
            console.log('💾 测试存储功能...');

            // 检查存储系统是否可用
            try {
                if (typeof Storage === 'undefined') {
                    console.warn('⚠️ 浏览器不支持本地存储功能，某些功能可能不可用');
                } else {
                    // 测试存储功能
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    console.log('✅ 本地存储功能正常');
                }

                // 验证存储实例是否正常工作（更宽松的检查）
                if (typeof storage !== 'undefined' && storage.set && storage.get) {
                    console.log('✅ 存储系统功能测试通过');
                } else {
                    console.warn('⚠️ 存储系统实例未完全加载，但继续初始化');
                }
            } catch (storageError) {
                console.warn('⚠️ 存储系统测试失败，但继续初始化:', storageError.message);
            }

            // 第三步：等待其他模块加载
            this.updateLoadingStatus('正在加载应用模块...');
            console.log('🔧 等待应用模块加载...');

            // 等待其他模块加载完成
            await new Promise(resolve => setTimeout(resolve, 800));

            // 检查核心管理器是否存在（非必需）
            const coreManagers = ['authManager', 'postManager', 'socialManager'];
            let loadedManagers = 0;
            for (const manager of coreManagers) {
                if (this.checkModule(manager)) {
                    console.log(`✅ ${manager} 已加载`);
                    loadedManagers++;
                } else {
                    console.warn(`⚠️ ${manager} 未找到，某些功能可能不可用`);
                }
            }

            // 检查主应用是否存在（非必需）
            if (this.checkModule('app')) {
                console.log('✅ 主应用已初始化');
            } else {
                console.warn('⚠️ 主应用未找到，但继续初始化');
            }

            console.log(`📊 模块加载统计: ${loadedManagers}/${coreManagers.length} 个管理器已加载`);

            // 第四步：初始化演示数据
            this.updateLoadingStatus('正在加载演示数据...');
            console.log('📊 初始化演示数据...');
            try {
                // 延迟初始化演示数据，确保所有模块都已加载
                setTimeout(() => {
                    if (typeof demoDataManager !== 'undefined') {
                        demoDataManager.initDemoData();
                        console.log('✅ 演示数据已初始化');
                    } else {
                        console.warn('演示数据管理器未找到，跳过演示数据初始化');
                    }
                }, 200);
            } catch (demoError) {
                console.warn('演示数据初始化失败，但不影响应用运行:', demoError);
            }

            this.updateLoadingStatus('初始化完成！');
            this.isInitialized = true;
            this.onInitComplete();

        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.onInitError(error);
        }
    }

    /**
     * 更新加载状态文本
     * @param {string} status 状态文本
     */
    updateLoadingStatus(status) {
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            const statusText = loadingElement.querySelector('.loading-content p');
            if (statusText) {
                statusText.textContent = status;
            }
        }
    }
    
    /**
     * 初始化完成回调
     */
    onInitComplete() {
        console.log('🎉 应用初始化完成！');

        // 触发初始化完成事件
        const event = new CustomEvent('appInitialized', {
            detail: { success: true }
        });
        document.dispatchEvent(event);

        // 延迟隐藏加载指示器，确保用户能看到完成状态
        setTimeout(() => {
            this.hideLoadingIndicator();

            // 显示成功消息
            if (typeof showToast === 'function') {
                showToast('欢迎使用校园生活交友平台！', 'success');
            }
        }, 500);
    }

    /**
     * 隐藏加载指示器
     */
    hideLoadingIndicator() {
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            // 添加淡出动画
            loadingElement.style.opacity = '0';
            loadingElement.style.transition = 'opacity 0.3s ease-out';

            // 动画完成后移除元素
            setTimeout(() => {
                loadingElement.style.display = 'none';
            }, 300);
        }
    }

    /**
     * 显示加载指示器
     */
    showLoadingIndicator() {
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
            loadingElement.style.opacity = '1';
            loadingElement.style.transition = 'opacity 0.3s ease-in';
        }
    }

    /**
     * 初始化失败回调
     */
    onInitError(error) {
        console.error('💥 应用初始化失败:', error);

        // 触发初始化失败事件
        const event = new CustomEvent('appInitialized', {
            detail: { success: false, error: error.message }
        });
        document.dispatchEvent(event);

        // 更新加载指示器显示错误状态
        this.showErrorState(error);
    }

    /**
     * 显示错误状态
     * @param {Error} error 错误对象
     */
    showErrorState(error) {
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            const loadingContent = loadingElement.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div class="error-content">
                        <div class="error-icon">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 15px;"></i>
                        </div>
                        <h3 style="color: #dc3545; margin-bottom: 10px;">应用初始化失败</h3>
                        <p style="color: #666; margin-bottom: 20px; max-width: 400px; line-height: 1.5;">
                            ${this.getErrorMessage(error)}
                        </p>
                        <div class="error-actions">
                            <button onclick="appInitializer.retry()" class="retry-btn" style="
                                padding: 10px 20px;
                                background: #007bff;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                margin-right: 10px;
                                font-size: 14px;
                            ">
                                <i class="fas fa-redo" style="margin-right: 5px;"></i>
                                重试
                            </button>
                            <button onclick="location.reload()" class="reload-btn" style="
                                padding: 10px 20px;
                                background: #6c757d;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                            ">
                                <i class="fas fa-refresh" style="margin-right: 5px;"></i>
                                刷新页面
                            </button>
                        </div>
                        <details style="margin-top: 15px; text-align: left; max-width: 400px;">
                            <summary style="cursor: pointer; color: #007bff;">查看详细错误信息</summary>
                            <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px; margin-top: 10px; overflow-x: auto;">
${error.stack || error.message}
                            </pre>
                        </details>
                    </div>
                `;
            }
        }
    }

    /**
     * 获取友好的错误消息
     * @param {Error} error 错误对象
     * @returns {string}
     */
    getErrorMessage(error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return '网络连接出现问题，请检查您的网络连接后重试。';
        } else if (errorMessage.includes('storage') || errorMessage.includes('localstorage')) {
            return '浏览器存储功能不可用，请检查浏览器设置或尝试清除缓存。';
        } else if (errorMessage.includes('module') || errorMessage.includes('script')) {
            return '应用模块加载失败，可能是由于网络问题或浏览器兼容性问题。';
        } else {
            return `初始化过程中出现错误：${error.message}`;
        }
    }

    /**
     * 重试初始化
     */
    retry() {
        console.log('🔄 重试应用初始化...');

        // 重置状态
        this.isInitialized = false;
        this.initPromise = null;

        // 显示加载状态
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            const loadingContent = loadingElement.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div class="loading-spinner"></div>
                    <p>正在重新初始化应用...</p>
                `;
            }
        }

        // 重新开始初始化
        this.start().catch(error => {
            console.error('重试失败:', error);
        });
    }
    
    /**
     * 开始初始化
     */
    start() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            // 等待DOM加载完成
            const startInit = () => {
                // 检查网络连接状态
                if (!navigator.onLine) {
                    this.showNetworkError();
                    reject(new Error('网络连接不可用'));
                    return;
                }

                setTimeout(() => {
                    this.executeInit()
                        .then(() => resolve(true))
                        .catch(error => reject(error));
                }, 100);
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', startInit);
            } else {
                startInit();
            }
        });

        // 监听网络状态变化
        window.addEventListener('online', () => {
            if (!this.isInitialized) {
                console.log('网络连接已恢复，重试初始化...');
                this.retry();
            }
        });

        window.addEventListener('offline', () => {
            console.warn('网络连接已断开');
        });

        return this.initPromise;
    }

    /**
     * 显示网络错误
     */
    showNetworkError() {
        const loadingElement = document.querySelector('.loading-indicator');
        if (loadingElement) {
            const loadingContent = loadingElement.querySelector('.loading-content');
            if (loadingContent) {
                loadingContent.innerHTML = `
                    <div class="error-content">
                        <div class="error-icon">
                            <i class="fas fa-wifi" style="font-size: 48px; color: #dc3545; margin-bottom: 15px;"></i>
                        </div>
                        <h3 style="color: #dc3545; margin-bottom: 10px;">网络连接不可用</h3>
                        <p style="color: #666; margin-bottom: 20px; max-width: 400px; line-height: 1.5;">
                            请检查您的网络连接，然后重试。
                        </p>
                        <div class="error-actions">
                            <button onclick="appInitializer.retry()" class="retry-btn" style="
                                padding: 10px 20px;
                                background: #007bff;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                margin-right: 10px;
                                font-size: 14px;
                            ">
                                <i class="fas fa-redo" style="margin-right: 5px;"></i>
                                重试连接
                            </button>
                        </div>
                        <p style="font-size: 12px; color: #999; margin-top: 15px;">
                            网络恢复后将自动重试
                        </p>
                    </div>
                `;
            }
        }
    }
}

// 创建全局初始化器
const appInitializer = new AppInitializer();

// 开始初始化
appInitializer.start().catch(error => {
    console.error('应用启动失败:', error);

    // 备用初始化方案
    console.log('🔄 尝试备用初始化方案...');
    setTimeout(() => {
        try {
            // 简单的备用初始化
            if (typeof storage !== 'undefined' && typeof authManager !== 'undefined') {
                console.log('✅ 备用初始化成功');
                appInitializer.hideLoadingIndicator();
                if (typeof showToast === 'function') {
                    showToast('应用已启动（备用模式）', 'info');
                }
            } else {
                console.error('❌ 备用初始化也失败了');
                appInitializer.showErrorState(new Error('应用初始化完全失败'));
            }
        } catch (backupError) {
            console.error('备用初始化失败:', backupError);
            appInitializer.showErrorState(backupError);
        }
    }, 2000);
});

// 导出到全局作用域
window.appInitializer = appInitializer;
