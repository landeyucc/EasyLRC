const uiController = (() => {
    const updateLyricContext = () => {
        const currentIndex = lyricHandler.getCurrentLyricIndex();
        const lyrics = lyricHandler.getLyrics();
        const processMode = typeof lyricHandler.getProcessMode === "function"
            ? lyricHandler.getProcessMode()
            : "line";
        
        if (lyrics.length === 0) {
            $('#previous-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
            $('#current-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
            $('#next-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
            return;
        }
        
        const prevLyric = lyricHandler.getPreviousLyric();
        if (prevLyric) {
            const timeHtml = prevLyric.time !== null ? `<span class="lyric-time">[${timeHandler.formatTime(prevLyric.time)}]</span>` : '<span class="lyric-time">[--:--:--]</span>';
            if (processMode === 'char' && prevLyric.charTimings && prevLyric.charTimings.length > 0) {
                let textHtml = '';
                for (let i = 0; i < prevLyric.text.length; i++) {
                    const ct = prevLyric.charTimings[i];
                    if (ct && ct.time !== null) {
                        textHtml += `<span class="char-processed">${prevLyric.text[i]}</span>`;
                    } else {
                        textHtml += prevLyric.text[i];
                    }
                }
                $('#previous-lyric-text').html(`${timeHtml}<span class="lyric-text">${textHtml}</span>`);
            } else {
                $('#previous-lyric-text').html(`${timeHtml}<span class="lyric-text">${prevLyric.text}</span>`);
            }
        } else {
            $('#previous-lyric-text').html(`<span class="lyric-time">[--:--:--]</span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        }
        
        const currentLyric = lyricHandler.getCurrentLyric();
        if (currentLyric) {
            const timeHtml = currentLyric.time !== null ? `<span class="lyric-time">[${timeHandler.formatTime(currentLyric.time)}]</span>` : '<span class="lyric-time">[--:--:--]</span>';

            if (processMode === 'char' && typeof lyricHandler.getCurrentCharIndex === 'function') {
                const currentCharIndex = lyricHandler.getCurrentCharIndex();
                if (currentCharIndex !== undefined && currentCharIndex >= 0) {
                    const charTimings = currentLyric.charTimings || [];
                    const text = currentLyric.text;
                    let textHtml = '';
                    for (let i = 0; i < text.length; i++) {
                        const ct = charTimings[i];
                        if (ct && ct.time !== null) {
                            textHtml += `<span class="char-processed">${text[i]}</span>`;
                        } else if (i === currentCharIndex) {
                            textHtml += `<span class="char-highlight">${text[i]}</span>`;
                        } else {
                            textHtml += text[i];
                        }
                    }
                    $('#current-lyric-text').html(`${timeHtml}<span class="lyric-text">${textHtml}</span>`);
                } else {
                    $('#current-lyric-text').html(`${timeHtml}<span class="lyric-text">${currentLyric.text}</span>`);
                }
            } else {
                $('#current-lyric-text').html(`${timeHtml}<span class="lyric-text">${currentLyric.text}</span>`);
            }
        } else {
            $('#current-lyric-text').html(`<span class="lyric-time">[--:--:--]</span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        }
        
        const nextLyric = lyricHandler.getNextLyric();
        if (nextLyric) {
            const timeHtml = nextLyric.time !== null ? `<span class="lyric-time">[${timeHandler.formatTime(nextLyric.time)}]</span>` : '<span class="lyric-time">[--:--:--]</span>';
            $('#next-lyric-text').html(`${timeHtml}<span class="lyric-text">${nextLyric.text}</span>`);
        } else {
            $('#next-lyric-text').html(`<span class="lyric-time">[--:--:--]</span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        }
    };
    
    const init = () => {
        $('#prev-lyric-label').text(languageController.getText('prev_lyric_text'));
        $('#current-lyric-label').text(languageController.getText('current_lyric_text'));
        $('#next-lyric-label').text(languageController.getText('next_lyric_text'));
        
        $('#previous-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        $('#current-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        $('#next-lyric-text').html(`<span class="lyric-time"></span><span class="lyric-text">${languageController.getText('noLyric')}</span>`);
        
        updateLyricContext();
        $('.modal-overlay').removeClass('active');
        
        if (!$('#message-container').length) {
            $('body').append('<div id="message-container" class="message-container"></div>');
        }
    };
    
    
    const showMessage = (options) => {
        const defaults = {
            title: languageController.getText('message_title'),
            message: '',
            type: 'info', // info, success, error, warning
            duration: 3000, // 自动关闭时间(ms)，0表示不自动关闭
            onClose: null,
            icon: null,
            preventDuplicates: true // 防止重复消息
        };
        
        const settings = {...defaults, ...options};
        
        if (settings.preventDuplicates) {
            const existingMessages = $('#message-container .message');
            for (let i = 0; i < existingMessages.length; i++) {
                const msg = $(existingMessages[i]);
                const msgContent = msg.find('.message-content').text().trim();
                const newContent = `${settings.title}${settings.message}`.trim();
                
                if (msgContent === newContent && msg.hasClass(settings.type)) {
                    return null;
                }
            }
        }
        
        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };
        
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
        
        $('#message-container').append(messageElement);
        
        setTimeout(() => {
            messageElement.css('opacity', '1');
        }, 10);
        
        messageElement.on('click', function(e) {
            if ($(e.target).closest('.message-close').length || $(e.target).is(messageElement)) {
                closeMessage(messageElement, settings.onClose);
            }
        });
        
        if (settings.duration > 0) {
            messageElement.data('timeout', setTimeout(() => {
                closeMessage(messageElement, settings.onClose);
            }, settings.duration));
        }
        
        return messageElement;
    };
    
    const closeMessage = (messageElement, onClose) => {
        clearTimeout(messageElement.data('timeout'));
        
        messageElement.addClass('fade-out');
        
        setTimeout(() => {
            messageElement.remove();
            
            if (typeof onClose === 'function') {
                onClose();
            }
        }, 300);
    };
    
    const showConfirm = (options) => {
        const defaults = {
            title: languageController.getText('confirmOperationTitle'),
            message: languageController.getText('confirmOperationMessage'),
            confirmText: languageController.getText('confirmText'),
            cancelText: languageController.getText('cancelText'),
            onConfirm: null,
            onCancel: null
        };
        
        const settings = {...defaults, ...options};
        
        $('.confirm-dialog').remove();
        
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
        
        $('body').append(dialogElement);
        
        dialogElement.find('.confirm-ok').on('click', () => {
            closeConfirm(dialogElement);
            if (typeof settings.onConfirm === 'function') {
                settings.onConfirm();
            }
        });
        
        dialogElement.find('.confirm-cancel').on('click', () => {
            closeConfirm(dialogElement);
            if (typeof settings.onCancel === 'function') {
                settings.onCancel();
            }
        });
        
        dialogElement.on('click', function(e) {
            if ($(e.target).is(dialogElement)) {
                closeConfirm(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        $(document).on('keydown.confirmDialog', (e) => {
            if (e.key === 'Escape') {
                closeConfirm(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        function closeConfirm(element) {
            $(document).off('keydown.confirmDialog');
            element.remove();
        }
        
        return dialogElement;
    };

    const showMarkSettings = () => {
        let current;
        if (typeof lyricHandler !== "undefined" && typeof lyricHandler.getMarkSettings === "function") {
            current = lyricHandler.getMarkSettings();
        } else {
            current = { bindTimeOnBack: false, bufferTime: 0, swapArrowKeys: false, backDelay: 200 };
        }

        $('.mark-settings-dialog').remove();

        const dialog = $(`<div class="confirm-dialog mark-settings-dialog">
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-title" data-i18n="mark_settings">标记设置</div>
                <div class="mark-settings-body">
                    <label class="mark-setting-row">
                        <input type="checkbox" id="bind-time-toggle" ${current.bindTimeOnBack ? "checked" : ""}>
                        <span class="mark-setting-label" data-i18n="bind_time_on_back">回退时绑定音频时间</span>
                    </label>
                    <div class="mark-setting-row">
                        <label class="mark-setting-label" data-i18n="buffer_time_on_back">退回缓冲时间（秒）</label>
                        <input type="number" id="buffer-time-input" min="0" max="30" step="0.1" value="${current.bufferTime.toFixed(1)}">
                    </div>
                    <label class="mark-setting-row">
                        <input type="checkbox" id="swap-arrow-toggle" ${current.swapArrowKeys ? "checked" : ""}>
                        <span class="mark-setting-label" data-i18n="swap_arrow_keys">使用小键盘前进撤销（交换方向键功能）</span>
                    </label>
                    <div class="mark-setting-row">
                        <label class="mark-setting-label" data-i18n="back_delay_ms">回退按钮延迟（毫秒）</label>
                        <input type="number" id="back-delay-input" min="0" max="5000" step="50" value="${current.backDelay}">
                    </div>
                </div>
                <div class="confirm-dialog-buttons">
                    <button class="action-btn confirm-cancel" data-i18n="cancelText">取消</button>
                    <button class="action-btn primary confirm-ok" data-i18n="confirmText">确定</button>
                </div>
            </div>
        </div>`);

        $('body').append(dialog);

        // 缓冲输入框：只有打开开关时才启用
        const toggle = dialog.find("#bind-time-toggle");
        const bufferInput = dialog.find("#buffer-time-input");
        const updateBufferEnabled = () => {
            bufferInput.prop("disabled", !toggle.prop("checked"));
        };
        updateBufferEnabled();
        toggle.on("change", updateBufferEnabled);

        // 模态框内 data-i18n 元素的局部翻译
        if (typeof languageController !== "undefined" && typeof languageController.getText === "function") {
            dialog.find("[data-i18n]").each(function () {
                const key = $(this).attr("data-i18n");
                if (key) {
                    $(this).text(languageController.getText(key));
                }
            });
            dialog.find("[data-i18n-placeholder]").each(function () {
                const key = $(this).attr("data-i18n-placeholder");
                if (key) {
                    $(this).attr("placeholder", languageController.getText(key));
                }
            });
        }

        dialog.find(".confirm-ok").on("click", () => {
            const bind = toggle.prop("checked");
            let buf = parseFloat(bufferInput.val());
            if (isNaN(buf) || buf < 0) buf = 0;
            const swap = dialog.find("#swap-arrow-toggle").prop("checked");
            let delay = parseInt(dialog.find("#back-delay-input").val(), 10);
            if (!Number.isFinite(delay) || delay < 0) delay = 200;
            if (typeof lyricHandler !== "undefined" && typeof lyricHandler.setMarkSettings === "function") {
                lyricHandler.setMarkSettings({
                    bindTimeOnBack: bind,
                    bufferTime: buf,
                    swapArrowKeys: swap,
                    backDelay: delay,
                });
            }
            close();
        });

        dialog.find(".confirm-cancel").on("click", close);
        dialog.on("click", function(e) { if ($(e.target).is(dialog)) close(); });
        $(document).on("keydown.markSettings", (e) => { if (e.key === "Escape") close(); });

        function close() {
            $(document).off("keydown.markSettings");
            dialog.remove();
        }
    };

    const showPrompt = (options) => {
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
        
        const settings = {...defaults, ...options};
        
        $('.confirm-dialog').remove();
        
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
        
        $('body').append(dialogElement);
        
        const inputElement = dialogElement.find('.prompt-input');
        inputElement.focus();
        inputElement.select();
        
        dialogElement.find('.confirm-ok').on('click', () => {
            const result = {
                text: inputElement.val()
            };
            
            if (settings.showTimeInput) {
                const timeInput = dialogElement.find('.time-input').val();
                if (timeInput) {
                    const timeParts = timeInput.match(/^(\d+):(\d+)\.(\d+)$/);
                    if (timeParts) {
                        const minutes = parseInt(timeParts[1]);
                        const seconds = parseInt(timeParts[2]);
                        const hundredths = parseInt(timeParts[3]);
                        result.time = minutes * 60 + seconds + hundredths / 100;
                    }
                }
            }
            
            if (settings.showTranslationInput) {
                result.translation = dialogElement.find('.translation-input').val();
            }
            
            closePrompt(dialogElement);
            if (typeof settings.onConfirm === 'function') {
                settings.onConfirm(result);
            }
        });
        
        dialogElement.find('.confirm-cancel').on('click', () => {
            closePrompt(dialogElement);
            if (typeof settings.onCancel === 'function') {
                settings.onCancel();
            }
        });
        
        dialogElement.find('input').on('keydown', (e) => {
            if (e.key === 'Enter') {
                dialogElement.find('.confirm-ok').click();
            }
        });
        
        dialogElement.on('click', function(e) {
            if ($(e.target).is(dialogElement)) {
                closePrompt(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        $(document).on('keydown.promptDialog', (e) => {
            if (e.key === 'Escape') {
                closePrompt(dialogElement);
                if (typeof settings.onCancel === 'function') {
                    settings.onCancel();
                }
            }
        });
        
        function closePrompt(element) {
            $(document).off('keydown.promptDialog');
            element.remove();
        }
        
        return dialogElement;
    };

    const showCharTimeEditor = (options) => {
        const defaults = {
            title: languageController.getText('editLyricTitle'),
            defaultValue: '',
            placeholder: '',
            confirmText: languageController.getText('confirmText'),
            cancelText: languageController.getText('cancelText'),
            units: [],
            showLineTimeInput: false,
            defaultLineTime: null,
            lineTimeLabel: null,
            showTranslationInput: false,
            defaultTranslation: '',
            onConfirm: null,
        };
        const settings = { ...defaults, ...options };

        $('.confirm-dialog').remove();

        // 构建 grid HTML
        const gridHtml = settings.units.map((unit, idx) => {
            const formatted = unit.time !== null && unit.time !== undefined
                ? (typeof timeHandler !== 'undefined' && typeof timeHandler.formatTime === 'function'
                    ? timeHandler.formatTime(unit.time)
                    : '')
                : '';
            const safeText = $('<div>').text(unit.text).html();
            return `
                <div class="char-time-cell" data-unit-idx="${idx}">
                    <div class="char-time-cell-label">${safeText}</div>
                    <input type="text" class="char-time-cell-input"
                           value="${formatted}"
                           placeholder="00:00.00"
                           data-unit-idx="${idx}">
                </div>
            `;
        }).join('');

        const lineTimeLabel = settings.lineTimeLabel !== null
            ? settings.lineTimeLabel
            : languageController.getText('timeInputLabel');
        const lineTimeHtml = settings.showLineTimeInput ? `
            <div class="char-edit-main-input">
                <label>${lineTimeLabel}</label>
                <input type="text" id="char-edit-line-time"
                       class="char-edit-line-time"
                       value="${settings.defaultLineTime !== null && settings.defaultLineTime !== undefined
                           ? (typeof timeHandler !== 'undefined' && typeof timeHandler.formatTime === 'function'
                               ? timeHandler.formatTime(settings.defaultLineTime) : '')
                           : ''}"
                       placeholder="00:00.00">
            </div>
        ` : '';

        const translationHtml = settings.showTranslationInput ? `
            <div class="char-edit-main-input">
                <label>${languageController.getText('translationInputLabel')}</label>
                <input type="text" id="char-edit-translation-input" value="${$('<div>').text(settings.defaultTranslation).html()}">
            </div>
        ` : '';

        const dialogElement = $(`
            <div class="confirm-dialog">
                <div class="confirm-dialog-content char-edit-dialog-content">
                    <div class="confirm-dialog-title">${settings.title}</div>
                    <div class="char-edit-main-input">
                        <label>${languageController.getText('lyricContentLabel')}</label>
                        <input type="text" id="char-edit-text-input" value="${$('<div>').text(settings.defaultValue).html()}" placeholder="${settings.placeholder}">
                    </div>
                    ${lineTimeHtml}
                    ${translationHtml}
                    <div class="char-time-grid">${gridHtml}</div>
                    <div class="confirm-dialog-buttons">
                        <button class="action-btn confirm-cancel">${settings.cancelText}</button>
                        <button class="action-btn primary confirm-ok">${settings.confirmText}</button>
                    </div>
                </div>
            </div>
        `);

        $('body').append(dialogElement);

        // 文本输入框聚焦
        const textInput = dialogElement.find('#char-edit-text-input');
        textInput.focus();
        textInput.select();

        // Enter 在文本输入框上 → 直接进第一个时间框；在时间框上 → 进下一个或确定
        textInput.on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                dialogElement.find('.char-time-cell-input').first().focus();
            }
        });
        dialogElement.find('.char-time-cell-input').on('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const inputs = dialogElement.find('.char-time-cell-input');
                const nextIdx = inputs.index(this) + 1;
                if (nextIdx < inputs.length) {
                    inputs.eq(nextIdx).focus();
                } else {
                    dialogElement.find('.confirm-ok').click();
                }
            }
        });

        dialogElement.find('.confirm-ok').on('click', () => {
            const result = {
                text: textInput.val(),
                units: [],
            };
            dialogElement.find('.char-time-cell-input').each(function () {
                const idx = parseInt($(this).attr('data-unit-idx'), 10);
                const raw = $(this).val().trim();
                let time = null;
                if (raw) {
                    if (typeof timeHandler !== 'undefined' && typeof timeHandler.parseTime === 'function') {
                        time = timeHandler.parseTime(raw);
                        if (time === null || isNaN(time)) time = null;
                    } else {
                        const parts = raw.replace('.', ':').split(':');
                        if (parts.length === 3) {
                            const mins = parseInt(parts[0]);
                            const secs = parseInt(parts[1]);
                            const ms = parseInt(parts[2]);
                            if (!isNaN(mins) && !isNaN(secs) && !isNaN(ms)) {
                                time = mins * 60 + secs + ms / 100;
                            }
                        }
                    }
                }
                result.units.push({ idx, time });
            });

            if (settings.showLineTimeInput) {
                const rawLineTime = dialogElement.find('#char-edit-line-time').val().trim();
                if (rawLineTime) {
                    if (typeof timeHandler !== 'undefined' && typeof timeHandler.parseTime === 'function') {
                        result.lineTime = timeHandler.parseTime(rawLineTime);
                    } else {
                        const parts = rawLineTime.replace('.', ':').split(':');
                        if (parts.length === 3) {
                            const mins = parseInt(parts[0]);
                            const secs = parseInt(parts[1]);
                            const ms = parseInt(parts[2]);
                            if (!isNaN(mins) && !isNaN(secs) && !isNaN(ms)) {
                                result.lineTime = mins * 60 + secs + ms / 100;
                            }
                        }
                    }
                    if (result.lineTime === null || result.lineTime === undefined || isNaN(result.lineTime)) {
                        result.lineTime = null;
                    }
                } else {
                    result.lineTime = null;
                }
            }

            if (settings.showTranslationInput) {
                result.translation = dialogElement.find('#char-edit-translation-input').val();
            }

            closeDialog();
            if (typeof settings.onConfirm === 'function') {
                settings.onConfirm(result);
            }
        });

        dialogElement.find('.confirm-cancel').on('click', closeDialog);
        dialogElement.on('click', function (e) { if ($(e.target).is(dialogElement)) closeDialog(); });
        $(document).on('keydown.charTimeEditor', (e) => { if (e.key === 'Escape') closeDialog(); });

        function closeDialog() {
            $(document).off('keydown.charTimeEditor');
            dialogElement.remove();
        }

        return dialogElement;
    };

    return {
        updateLyricContext,
        init,
        showMessage,
        showConfirm,
        showMarkSettings,
        showPrompt,
        showCharTimeEditor
    };
})();