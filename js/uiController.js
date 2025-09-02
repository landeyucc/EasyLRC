/**
 * UI控制模块：负责界面元素更新、交互反馈等功能
 */
const uiController = (() => {
    // 更新歌词上下文显示（上一句、当前、下一句）
    const updateLyricContext = (currentCharIndex) => {
        const currentIndex = lyricHandler.getCurrentLyricIndex();
        const lyrics = lyricHandler.getLyrics();
        const processMode = lyricHandler.getProcessMode ? lyricHandler.getProcessMode() : 'line';
        
        if (lyrics.length === 0) {
            $('#previous-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
            $('#current-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
            $('#next-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
            return;
        }
        
        // 上一句
        const prevLyric = lyricHandler.getPreviousLyric();
        if (prevLyric) {
            const timeHtml = prevLyric.time !== null ? `<span class="lyric-time">[${timeHandler.formatTime(prevLyric.time)}]</span>` : '<span class="lyric-time">[--:--:--]</span>';
            $('#previous-lyric-text').html(`${timeHtml}<span class="lyric-text">${prevLyric.text}</span>`);
        } else {
            $('#previous-lyric-text').html(`<span class="lyric-time">[--:--:--]</span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        }
        
        // 当前句
        const currentLyric = lyricHandler.getCurrentLyric();
        if (currentLyric) {
            const timeHtml = currentLyric.time !== null ? `<span class="lyric-time">[${timeHandler.formatTime(currentLyric.time)}]</span>` : '<span class="lyric-time">[--:--:--]</span>';
            
            // 处理逐字模式下的高亮显示
            if (processMode === 'char' && currentCharIndex !== undefined && currentCharIndex >= 0) {
                let textHtml = '';
                const text = currentLyric.text;
                
                for (let i = 0; i < text.length; i++) {
                    if (i === currentCharIndex) {
                        // 当前处理的字符高亮显示
                        textHtml += `<span class="char-highlight">${text[i]}</span>`;
                    } else if (i < currentCharIndex) {
                        // 已处理的字符使用不同样式
                        textHtml += `<span class="char-processed">${text[i]}</span>`;
                    } else {
                        // 未处理的字符使用普通样式
                        textHtml += text[i];
                    }
                }
                
                $('#current-lyric-text').html(`${timeHtml}<span class="lyric-text">${textHtml}</span>`);
            } else {
                // 逐行模式下的普通显示
                $('#current-lyric-text').html(`${timeHtml}<span class="lyric-text">${currentLyric.text}</span>`);
            }
        } else {
            $('#current-lyric-text').html(`<span class="lyric-time">[--:--:--]</span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        }
        
        // 下一句
        const nextLyric = lyricHandler.getNextLyric();
        if (nextLyric) {
            const timeHtml = nextLyric.time !== null ? `<span class="lyric-time">[${timeHandler.formatTime(nextLyric.time)}]</span>` : '<span class="lyric-time">[--:--:--]</span>';
            $('#next-lyric-text').html(`${timeHtml}<span class="lyric-text">${nextLyric.text}</span>`);
        } else {
            $('#next-lyric-text').html(`<span class="lyric-time">[--:--:--]</span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        }
    };
    
    // 初始化界面
    const init = () => {
        // 初始化歌词上下文显示区域的文本和标签
        $('#prev-lyric-label').text(languageController.getText('prev_lyric_text'));
        $('#current-lyric-label').text(languageController.getText('current_lyric_text'));
        $('#next-lyric-label').text(languageController.getText('next_lyric_text'));
        
        $('#previous-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        $('#current-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        $('#next-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        
        updateLyricContext();
        // 初始隐藏模态框
        $('.modal-overlay').removeClass('active');
        
        // 初始化消息容器
        if (!$('#message-container').length) {
            $('body').append('<div id="message-container" class="message-container"></div>');
        }
    };
    
    /* ================ 自定义消息提示系统 ================ */
    
    // 显示消息提示
    const showMessage = (options) => {
        // 默认选项
        const defaults = {
            title: languageController.getText('message_title'),
            message: '',
            type: 'info', // info, success, error, warning
            duration: 3000, // 自动关闭时间(ms)，0表示不自动关闭
            onClose: null,
            icon: null,
            preventDuplicates: true // 防止重复消息
        };
        
        // 合并选项
        const settings = {...defaults, ...options};
        
        // 如果启用了防重复，检查是否有相同的消息正在显示
        if (settings.preventDuplicates) {
            const existingMessages = $('#message-container .message');
            for (let i = 0; i < existingMessages.length; i++) {
                const msg = $(existingMessages[i]);
                const msgContent = msg.find('.message-content').text().trim();
                const newContent = `${settings.title}${settings.message}`.trim();
                
                // 如果内容相似，则不再显示新消息
                if (msgContent === newContent && msg.hasClass(settings.type)) {
                    return null;
                }
            }
        }
        
        // 获取图标
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };
        
        // 创建消息元素
        const messageElement = $('<div>', {
            'class': `message ${settings.type}`,
            html: `
                <i class="fas ${settings.icon || icons[settings.type]}"></i>
                <div class="message-content">
                    <div class="message-title">${settings.title}</div>
                    <div class="message-text">${settings.message}</div>
                </div>
                <button class="message-close"><i class="fas fa-times"></i></button>
            `
        });
        
        // 先设置为不可见，添加到DOM后再进行动画，避免闪烁
        messageElement.css('opacity', '0');
        
        // 添加到容器
        $('#message-container').append(messageElement);
        
        // 强制重排后再执行显示动画
        setTimeout(() => {
            messageElement.css('opacity', '1');
        }, 10);
        
        // 点击关闭
        messageElement.on('click', function(e) {
            if ($(e.target).closest('.message-close').length || $(e.target).is(messageElement)) {
                closeMessage(messageElement, settings.onClose);
            }
        });
        
        // 自动关闭
        if (settings.duration > 0) {
            messageElement.data('timeout', setTimeout(() => {
                closeMessage(messageElement, settings.onClose);
            }, settings.duration));
        }
        
        // 返回消息元素（用于手动关闭等操作）
        return messageElement;
    };
    
    // 关闭消息
    const closeMessage = (messageElement, onClose) => {
        // 清除自动关闭定时器
        clearTimeout(messageElement.data('timeout'));
        
        // 添加淡出动画
        messageElement.addClass('fade-out');
        
        // 动画结束后移除元素
        setTimeout(() => {
            messageElement.remove();
            
            // 调用回调
            if (typeof onClose === 'function') {
                onClose();
            }
        }, 300);
    };
    
    // 显示确认对话框
    const showConfirm = (options) => {
        // 默认选项
        const defaults = {
            title: languageController.getText('confirmOperationTitle'),
            message: languageController.getText('confirmOperationMessage'),
            confirmText: languageController.getText('confirmText'),
            cancelText: languageController.getText('cancelText'),
            onConfirm: null,
            onCancel: null
        };
        
        // 合并选项
        const settings = {...defaults, ...options};
        
        // 检查是否已存在对话框
        $('.confirm-dialog').remove();
        
        // 创建确认对话框
        const dialogElement = $('<div>', {
            'class': 'confirm-dialog',
            html: `
                <div class="confirm-dialog-content">
                    <div class="confirm-dialog-title">${settings.title}</div>
                    <div class="confirm-dialog-message">${settings.message}</div>
                    <div class="confirm-dialog-buttons">
                        <button class="action-btn confirm-cancel">${settings.cancelText}</button>
                        <button class="action-btn primary confirm-ok">${settings.confirmText}</button>
                    </div>
                </div>
            `
        });
        
        // 添加到页面
        $('body').append(dialogElement);
        
        // 点击确认
        dialogElement.find('.confirm-ok').on('click', () => {
            closeConfirm(dialogElement);
            if (typeof settings.onConfirm === 'function') {
                settings.onConfirm();
            }
        });
        
        // 点击取消
        dialogElement.find('.confirm-cancel').on('click', () => {
            closeConfirm(dialogElement);
            if (typeof settings.onCancel === 'function') {
                settings.onCancel();
            }
        });
        
        // 点击外部关闭
        dialogElement.on('click', function(e) {
            if ($(e.target).is(dialogElement)) {
                closeConfirm(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        // ESC键关闭
        $(document).on('keydown.confirmDialog', (e) => {
            if (e.key === 'Escape') {
                closeConfirm(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        // 关闭对话框
        function closeConfirm(element) {
            $(document).off('keydown.confirmDialog');
            element.remove();
        }
        
        // 返回对话框元素
        return dialogElement;
    };
    
    // 显示提示对话框（模拟prompt）
    const showPrompt = (options) => {
        // 默认选项
        const defaults = {
            title: languageController.getText('promptInputTitle'),
            message: '',
            defaultValue: '',
            placeholder: '',
            confirmText: languageController.getText('confirmText'),
            cancelText: languageController.getText('cancelText'),
            onConfirm: null,
            onCancel: null,
            showTimeInput: false,  // 是否显示时间输入
            defaultTime: null,     // 默认时间值
            showTranslationInput: false, // 是否显示翻译输入
            defaultTranslation: '' // 默认翻译值
        };
        
        // 合并选项
        const settings = {...defaults, ...options};
        
        // 检查是否已存在对话框
        $('.confirm-dialog').remove();
        
        // 准备时间输入HTML
        let timeInputHtml = '';
        if (settings.showTimeInput) {
            const formattedTime = settings.defaultTime !== null ? 
                timeHandler.formatTime(settings.defaultTime) : 
                '';
            
            timeInputHtml = `
                <div class="input-group" style="margin-bottom: 15px;">
                    <label for="time-input" style="display: block; margin-bottom: 5px; font-weight: bold;">${languageController.getText('timeInputLabel')}</label>
                    <input type="text" id="time-input" class="time-input" value="${formattedTime}" placeholder="00:00.00" style="
                        width: 100%;
                        padding: 10px 15px;
                        border: none;
                        border-radius: 10px;
                        background-color: #e0e5ec;
                        box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.1),
                                    inset -2px -2px 5px rgba(255, 255, 255, 0.7);
                        font-size: 1rem;
                    ">
                </div>
            `;
        }
        
        // 准备翻译输入HTML
        let translationInputHtml = '';
        if (settings.showTranslationInput) {
            translationInputHtml = `
                <div class="input-group" style="margin-bottom: 15px;">
                    <label for="translation-input" style="display: block; margin-bottom: 5px; font-weight: bold;">${languageController.getText('translationInputLabel')}</label>
                    <input type="text" id="translation-input" class="translation-input" value="${settings.defaultTranslation}" placeholder="翻译内容" style="
                        width: 100%;
                        padding: 10px 15px;
                        border: none;
                        border-radius: 10px;
                        background-color: #e0e5ec;
                        box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.1),
                                    inset -2px -2px 5px rgba(255, 255, 255, 0.7);
                        font-size: 1rem;
                    ">
                </div>
            `;
        }
        
        // 创建提示对话框
        const dialogElement = $('<div>', {
            'class': 'confirm-dialog',
            html: `
                <div class="confirm-dialog-content">
                    <div class="confirm-dialog-title">${settings.title}</div>
                    <div class="confirm-dialog-message">${settings.message}</div>
                    
                    <div class="input-group" style="margin-bottom: 15px;">
                        <label for="main-input" style="display: block; margin-bottom: 5px; font-weight: bold;">${languageController.getText('lyricContentLabel')}</label>
                        <input type="text" id="main-input" class="prompt-input" value="${settings.defaultValue}" placeholder="${settings.placeholder}" style="
                            width: 100%;
                            padding: 10px 15px;
                            border: none;
                            border-radius: 10px;
                            background-color: #e0e5ec;
                            box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.1),
                                        inset -2px -2px 5px rgba(255, 255, 255, 0.7);
                            font-size: 1rem;
                        ">
                    </div>
                    
                    ${timeInputHtml}
                    ${translationInputHtml}
                    
                    <div class="confirm-dialog-buttons">
                        <button class="action-btn confirm-cancel">${settings.cancelText}</button>
                        <button class="action-btn primary confirm-ok">${settings.confirmText}</button>
                    </div>
                </div>
            `
        });
        
        // 添加到页面
        $('body').append(dialogElement);
        
        // 自动聚焦主输入框
        const inputElement = dialogElement.find('.prompt-input');
        inputElement.focus();
        inputElement.select();
        
        // 点击确认
        dialogElement.find('.confirm-ok').on('click', () => {
            const result = {
                text: inputElement.val()
            };
            
            // 如果有时间输入，解析时间
            if (settings.showTimeInput) {
                const timeInput = dialogElement.find('.time-input').val();
                if (timeInput) {
                    // 解析时间格式 mm:ss.xx
                    const timeParts = timeInput.match(/^(\d+):(\d+)\.(\d+)$/);
                    if (timeParts) {
                        const minutes = parseInt(timeParts[1]);
                        const seconds = parseInt(timeParts[2]);
                        const hundredths = parseInt(timeParts[3]);
                        result.time = minutes * 60 + seconds + hundredths / 100;
                    }
                }
            }
            
            // 如果有翻译输入
            if (settings.showTranslationInput) {
                result.translation = dialogElement.find('.translation-input').val();
            }
            
            closePrompt(dialogElement);
            if (typeof settings.onConfirm === 'function') {
                settings.onConfirm(result);
            }
        });
        
        // 点击取消
        dialogElement.find('.confirm-cancel').on('click', () => {
            closePrompt(dialogElement);
            if (typeof settings.onCancel === 'function') {
                settings.onCancel();
            }
        });
        
        // Enter键确认，Escape键取消
        dialogElement.find('input').on('keydown', (e) => {
            if (e.key === 'Enter') {
                dialogElement.find('.confirm-ok').click();
            }
        });
        
        // 点击外部关闭
        dialogElement.on('click', function(e) {
            if ($(e.target).is(dialogElement)) {
                closePrompt(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        // ESC键关闭
        $(document).on('keydown.promptDialog', (e) => {
            if (e.key === 'Escape') {
                closePrompt(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        // 关闭对话框
        function closePrompt(element) {
            $(document).off('keydown.promptDialog');
            element.remove();
        }
        
        // 返回对话框元素
        return dialogElement;
    };
    
    return {
        updateLyricContext,
        init,
        showMessage,
        showConfirm,
        showPrompt
    };
})();