/**
 * 语言控制模块：负责多语言切换和本地化功能
 */
const languageController = (() => {
    // 默认语言
    let currentLanguage = 'zh-CN';
    // 可用语言列表
    const availableLanguages = ['zh-CN', 'zh-TW', 'en-US'];
    // 语言数据
    let languageData = {};
    
    // 初始化语言控制器
    const init = () => {
        // 从本地存储中获取用户之前选择的语言
        const savedLanguage = localStorage.getItem('easyLRC_language');
        if (savedLanguage && availableLanguages.includes(savedLanguage)) {
            currentLanguage = savedLanguage;
        } else {
            // 如果没有保存的语言，尝试使用浏览器语言
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('zh')) {
                // 检测是否为繁体中文地区
                if (browserLang === 'zh-TW' || browserLang === 'zh-HK') {
                    currentLanguage = 'zh-TW';
                } else {
                    currentLanguage = 'zh-CN';
                }
            } else {
                // 默认使用英文
                currentLanguage = 'en-US';
            }
            // 保存到本地存储
            localStorage.setItem('easyLRC_language', currentLanguage);
        }
        
        // 加载语言文件
        loadLanguageFile(currentLanguage)
            .then(() => {
                // 添加语言切换按钮到浮动按钮区域
                addLanguageSwitcher();
            })
            .catch(err => {
                console.error('初始化语言失败:', err);
                // 如果加载失败且不是默认语言，尝试加载默认语言
                if (currentLanguage !== 'zh-CN') {
                    console.log('尝试加载默认语言 (zh-CN)');
                    return loadLanguageFile('zh-CN').then(() => {
                        addLanguageSwitcher();
                    });
                }
            });
    };
    
    // 加载语言文件
    const loadLanguageFile = (lang) => {
        return new Promise((resolve, reject) => {
            // 如果已经加载过该语言，直接使用
            if (languageData[lang]) {
                applyLanguage(lang);
                resolve();
                return;
            }
            
            try {
                // 创建script元素加载语言文件
                const script = document.createElement('script');
                script.src = `lang/${lang}.js`;
                
                // 设置超时处理
                const timeout = setTimeout(() => {
                    console.error(`加载语言文件超时: ${lang}`);
                    reject(new Error(`加载语言文件超时: ${lang}`));
                }, 5000); // 5秒超时
                
                script.onload = () => {
                    clearTimeout(timeout);
                    try {
                        // 根据语言代码获取对应的变量
                        let langVar;
                        switch (lang) {
                            case 'zh-CN':
                                langVar = typeof zh_CN !== 'undefined' ? zh_CN : null;
                                break;
                            case 'zh-TW':
                                langVar = typeof zh_TW !== 'undefined' ? zh_TW : null;
                                break;
                            case 'en-US':
                                langVar = typeof en_US !== 'undefined' ? en_US : null;
                                break;
                            default:
                                langVar = null;
                        }
                        
                        if (!langVar) {
                            throw new Error(`语言文件 ${lang} 加载成功但变量不可用`);
                        }
                        
                        // 保存语言数据
                        languageData[lang] = langVar;
                        
                        // 应用语言
                        applyLanguage(lang);
                        resolve();
                    } catch (err) {
                        console.error(`处理语言文件时出错: ${err.message}`);
                        reject(err);
                    }
                };
                
                script.onerror = () => {
                    clearTimeout(timeout);
                    console.error(`加载语言文件失败: ${lang}`);
                    reject(new Error(`加载语言文件失败: ${lang}`));
                };
                
                document.head.appendChild(script);
            } catch (err) {
                console.error(`创建脚本元素时出错: ${err.message}`);
                reject(err);
            }
        });
    };
    
    // 应用语言到界面
    const applyLanguage = (lang) => {
        // 更新html lang属性
        document.documentElement.lang = lang;

        currentLanguage = lang;
        const data = languageData[lang];
        if (!data) return;
        
        // 首先保存解析模式相关的文本，以便后续使用
        const parsingModeData = {
            parsing_mode: data.parsing_mode,
            default_mode: data.default_mode,
            strict_mode: data.strict_mode
        };
        
        console.log('应用语言:', lang, '解析模式数据:', parsingModeData);
        
        // 更新歌词上下文显示区域的标签文本
        $('#prev-lyric-label').text(getText('prev_lyric_text'));
        $('#current-lyric-label').text(getText('current_lyric_text'));
        $('#next-lyric-label').text(getText('next_lyric_text'));
        
        // 更新歌词上下文显示区域的歌词文本
        uiController.updateLyricContext();
        
        // 更新页面标题
        document.title = data.title;
        const headerH1 = document.querySelector('header h1');
        if (headerH1) headerH1.textContent = data.title;
        const headerP = document.querySelector('header p');
        if (headerP) headerP.textContent = data.subtitle;
        
        // 更新音频文件区域
        const audioFileH2 = document.querySelector('.input-panel .card h2:first-of-type');
        if (audioFileH2) audioFileH2.textContent = data.audio_file;
        
        const uploadLabel = document.querySelector('.upload-label span');
        if (uploadLabel) uploadLabel.textContent = data.upload_audio;
        
        // 更新歌词输入区域
        const lyricInputH2 = document.querySelector('.input-panel .card:nth-of-type(2) h2');
        if (lyricInputH2) lyricInputH2.textContent = data.lyric_input;
        
        const textInputBtn = document.querySelector('#text-input-btn');
        if (textInputBtn) textInputBtn.textContent = data.text_input;
        
        const lrcUploadBtn = document.querySelector('#lrc-upload-btn');
        if (lrcUploadBtn) lrcUploadBtn.textContent = data.import_lrc;
        
        const switchLabels = document.querySelectorAll('.switch-label[data-i18n]');
        switchLabels.forEach(label => {
            const key = label.dataset.i18n;
            if (data[key]) {
                label.textContent = data[key];
            }
        });
        
        const tooltipIcons = document.querySelectorAll('.tooltip-icon');
        tooltipIcons.forEach(icon => {
            const iElement = icon.querySelector('i');
            if (iElement && icon.dataset.i18nTitle && data[icon.dataset.i18nTitle]) {
                icon.title = data[icon.dataset.i18nTitle];
            }
        });
        
        const lyricTextarea = document.querySelector('#lyric-textarea');
        if (lyricTextarea) lyricTextarea.placeholder = data.lyric_textarea_placeholder;
        
        const splitLyricBtn = document.querySelector('#split-lyric-btn');
        if (splitLyricBtn) splitLyricBtn.textContent = data.split_lyric;
        
        const uploadLrcLabel = document.querySelector('#lrc-upload-container .upload-label span');
        if (uploadLrcLabel) uploadLrcLabel.textContent = data.upload_lrc;
        
        // 更新解析模式区域
        updateParsingModeText(parsingModeData);
        
        // 更新打节奏控制区域
        const timingControlsH2 = document.querySelector('#timing-controls h2');
        if (timingControlsH2) timingControlsH2.textContent = data.timing_controls;
        
        const processModeH3 = document.querySelector('.process-mode-container h3');
        if (processModeH3) processModeH3.textContent = data.process_mode;
        
        const modeLabels = document.querySelectorAll('.mode-label span');
        if (modeLabels && modeLabels.length > 0) {
            if (modeLabels[0]) modeLabels[0].textContent = data.line_mode;
            if (modeLabels[1]) modeLabels[1].textContent = data.char_mode;
        }
        
        const stopBtn = document.querySelector('#stop-btn');
        if (stopBtn) stopBtn.innerHTML = `<i class="fas fa-undo"></i> ${data.reset}`;
        
        const prevLyricBtn = document.querySelector('#prev-lyric');
        if (prevLyricBtn) prevLyricBtn.innerHTML = `<i class="fas fa-step-backward"></i> ${data.prev_lyric}`;
        
        const nextLyricBtn = document.querySelector('#next-lyric');
        if (nextLyricBtn) nextLyricBtn.innerHTML = `<i class="fas fa-step-forward"></i> ${data.next_lyric}`;
        
        const prevLyricSpan = document.querySelector('.previous-lyric span:first-child');
        if (prevLyricSpan) prevLyricSpan.textContent = data.prev_lyric_text;
        
        const currentLyricSpan = document.querySelector('.current-lyric span:first-child');
        if (currentLyricSpan) currentLyricSpan.textContent = data.current_lyric_text;
        
        const nextLyricSpan = document.querySelector('.next-lyric span:first-child');
        if (nextLyricSpan) nextLyricSpan.textContent = data.next_lyric_text;
        
        // 更新无歌词文本
        const noneTexts = document.querySelectorAll('#previous-lyric-text, #current-lyric-text, #next-lyric-text');
        noneTexts.forEach(el => {
            if (el && (el.textContent.trim() === '无' || el.textContent.trim() === '無' || el.textContent.trim() === 'None')) {
                const uninitializedTime = data.uninitialized_time || '[--:--]';
                el.innerHTML = `<span class="lyric-time">${uninitializedTime}</span><span class="lyric-text">${data.none}</span>`;
            }
        });
        
        const prev5sBtn = document.querySelector('#prev-5s');
        if (prev5sBtn) prev5sBtn.innerHTML = `<i class="fas fa-backward-step"></i> ${data.back_2s}`;
        
        const next5sBtn = document.querySelector('#next-5s');
        if (next5sBtn) next5sBtn.innerHTML = `<i class="fas fa-forward-step"></i> ${data.forward_2s}`;
        
        const playPauseBtn = document.querySelector('#play-pause');
        if (playPauseBtn) playPauseBtn.innerHTML = `<i class="fas fa-play"></i> ${data.play_pause}`;
        
        const setTimeBtn = document.querySelector('#set-time');
        if (setTimeBtn) setTimeBtn.innerHTML = `<i class="fas fa-marker"></i> ${data.mark_time}`;
        
        // 更新歌词预览区域
        const lyricPreviewH2 = document.querySelector('.lyric-preview-header h2');
        if (lyricPreviewH2) lyricPreviewH2.textContent = data.lyric_preview;
        
        const placeholderText = document.querySelector('.lyric-preview .placeholder-text');
        if (placeholderText) {
            placeholderText.textContent = data.lyric_preview_placeholder;
        }
        
        const addBlankBtn = document.querySelector('#add-blank-btn');
        if (addBlankBtn) addBlankBtn.innerHTML = `<i class="fas fa-plus-circle"></i> ${data.add_blank_lyric}`;
        
        // 更新时间调整区域
        const adjustmentPanelH2 = document.querySelector('#adjustment-panel h2');
        if (adjustmentPanelH2) adjustmentPanelH2.textContent = data.time_adjustment;
        
        const adjustmentPanelP = document.querySelector('#adjustment-panel p');
        if (adjustmentPanelP) adjustmentPanelP.textContent = data.adjustment_desc;
        
        const timeAdjust = document.querySelector('#time-adjust');
        if (timeAdjust) timeAdjust.placeholder = data.adjustment_placeholder;
        
        const applyAdjustment = document.querySelector('#apply-adjustment');
        if (applyAdjustment) applyAdjustment.textContent = data.apply_adjustment;
        
        const nextStepBtn = document.querySelector('#next-step-btn');
        if (nextStepBtn) nextStepBtn.innerHTML = `<i class="fas fa-arrow-right"></i> ${data.next_step}`;
        
        // 更新预览界面
        const previewInterfaceH2 = document.querySelector('#preview-interface .card h2');
        if (previewInterfaceH2) previewInterfaceH2.textContent = data.sync_preview;
        
        const previewPlaceholder = document.querySelector('#sync-lyric-display .placeholder-text');
        if (previewPlaceholder) {
            previewPlaceholder.textContent = data.sync_preview_placeholder;
        }
        
        const previewPrev2s = document.querySelector('#preview-prev-2s');
        if (previewPrev2s) previewPrev2s.innerHTML = `<i class="fas fa-backward-step"></i> ${data.back_2s}`;
        
        const previewPlayPause = document.querySelector('#preview-play-pause');
        if (previewPlayPause) previewPlayPause.innerHTML = `<i class="fas fa-play"></i> ${data.play_pause}`;
        
        const previewNext2s = document.querySelector('#preview-next-2s');
        if (previewNext2s) previewNext2s.innerHTML = `<i class="fas fa-forward-step"></i> ${data.forward_2s}`;
        
        const backToEdit = document.querySelector('#back-to-edit');
        if (backToEdit) backToEdit.innerHTML = `<i class="fas fa-arrow-left"></i> ${data.back_to_edit}`;
        
        const exportLrc = document.querySelector('#export-lrc');
        if (exportLrc) exportLrc.innerHTML = `<i class="fas fa-download"></i> ${data.export_lrc}`;
        
        // 更新元数据区域
        const toggleMetadataBtn = document.querySelector('#toggle-metadata-btn');
        if (toggleMetadataBtn) toggleMetadataBtn.innerHTML = `<i class="fas fa-chevron-down"></i> ${data.lyric_metadata}`;
        
        // 使用函数更新元数据字段，避免重复代码
        const updateMetaField = (fieldId, labelText, placeholderText) => {
            const label = document.querySelector(`label[for="${fieldId}"]`);
            if (label) label.textContent = labelText;
            
            const input = document.querySelector(`#${fieldId}`);
            if (input) input.placeholder = placeholderText;
        };
        
        // 更新所有元数据字段
        updateMetaField('meta-ar', data.meta_ar, data.meta_ar_placeholder);
        updateMetaField('meta-ti', data.meta_ti, data.meta_ti_placeholder);
        updateMetaField('meta-al', data.meta_al, data.meta_al_placeholder);
        updateMetaField('meta-by', data.meta_by, data.meta_by_placeholder);
        updateMetaField('meta-offset', data.meta_offset, data.meta_offset_placeholder);
        updateMetaField('meta-length', data.meta_length, data.meta_length_placeholder);
        updateMetaField('meta-au', data.meta_au, data.meta_au_placeholder);
        updateMetaField('meta-re', data.meta_re, data.meta_re_placeholder);
        updateMetaField('meta-ve', data.meta_ve, data.meta_ve_placeholder);
        updateMetaField('meta-composer', data.meta_composer, data.meta_composer_placeholder);
        updateMetaField('meta-lyricist', data.meta_lyricist, data.meta_lyricist_placeholder);
        updateMetaField('meta-translator', data.meta_translator, data.meta_translator_placeholder);
        updateMetaField('meta-language', data.meta_language, data.meta_language_placeholder);
        
        // 更新浮动按钮
        const themeToggle = document.querySelector('#theme-toggle');
        if (themeToggle) themeToggle.title = data.toggle_theme;
        
        const githubLink = document.querySelector('.github-link');
        if (githubLink) githubLink.title = data.github_project;
        
        // 更新字幕转换区域
        const subtitleConvertBtn = document.querySelector('#subtitle-convert-btn');
        if (subtitleConvertBtn) subtitleConvertBtn.textContent = data.convert_lrc;
        
        const subtitleUploadLabel = document.querySelector('#subtitle-converter-container .upload-label span');
        if (subtitleUploadLabel) subtitleUploadLabel.textContent = data.upload_subtitle;
        
        const subtitleModeH3 = document.querySelector('#subtitle-converter-container .subtitle-mode-container h3');
        if (subtitleModeH3) subtitleModeH3.textContent = data.subtitle_convert_mode;
        
        const subtitleModeLabels = document.querySelectorAll('#subtitle-converter-container .subtitle-mode-label span');
        if (subtitleModeLabels && subtitleModeLabels.length >= 2) {
            if (subtitleModeLabels[0]) subtitleModeLabels[0].textContent = data.subtitle_text_only;
            if (subtitleModeLabels[1]) subtitleModeLabels[1].textContent = data.subtitle_with_time;
        }
        
        // 更新离开确认消息
        window.onbeforeunload = (e) => {
            const textarea = document.getElementById('lyric-textarea');
            const hasTextareaContent = textarea && textarea.value.trim().length > 0;
            const hasAudio = typeof audioHandler !== 'undefined' && audioHandler.getAudioElement && audioHandler.getAudioElement().src;
            const lyrics = typeof lyricHandler !== 'undefined' && lyricHandler.getLyrics ? lyricHandler.getLyrics() : [];
            const hasLyrics = lyrics && lyrics.length > 0;
            const hasProcessLyrics = lyrics && lyrics.some(l => l.time !== null);
            
            if (hasTextareaContent || hasAudio || hasLyrics || hasProcessLyrics) {
                e.preventDefault();
                e.returnValue = data.leave_confirm;
                return data.leave_confirm;
            }
        };
        
        // 保存当前语言到本地存储
        localStorage.setItem('easyLRC_language', lang);
    };
    
    // 添加语言切换按钮
    const addLanguageSwitcher = () => {
        // 检查浮动按钮区域是否存在
        const floatingButtons = document.querySelector('.floating-buttons');
        if (!floatingButtons) {
            console.error('找不到浮动按钮区域 (.floating-buttons)');
            return;
        }
        
        // 检查是否已经存在语言切换按钮
        if (document.querySelector('#language-toggle')) {
            return; // 避免重复添加
        }
        
        // 创建语言切换按钮
        const langButton = document.createElement('button');
        langButton.id = 'language-toggle';
        langButton.className = 'floating-button language-toggle';
        langButton.title = languageData[currentLanguage]?.language || '语言';
        langButton.innerHTML = '<i class="fas fa-language"></i>';
        
        // 创建语言下拉菜单
        const langMenu = document.createElement('div');
        langMenu.className = 'language-menu';
        langMenu.style.display = 'none';
        
        // 添加语言选项
        availableLanguages.forEach(lang => {
            const langOption = document.createElement('div');
            langOption.className = 'language-option';
            langOption.dataset.lang = lang;
            
            // 设置语言选项文本
            switch (lang) {
                case 'zh-CN':
                    langOption.textContent = '简体中文';
                    break;
                case 'zh-TW':
                    langOption.textContent = '繁體中文';
                    break;
                case 'en-US':
                    langOption.textContent = 'English';
                    break;
            }
            
            // 高亮当前选中的语言
            if (lang === currentLanguage) {
                langOption.classList.add('active');
            }
            
            // 添加点击事件
            langOption.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLang = e.target.dataset.lang;
                if (selectedLang !== currentLanguage) {
                    loadLanguageFile(selectedLang).then(() => {
                        // 更新所有语言选项的激活状态
                        const options = document.querySelectorAll('.language-option');
                        if (options) {
                            options.forEach(option => {
                                option.classList.toggle('active', option.dataset.lang === selectedLang);
                            });
                        }
                    }).catch(err => {
                        console.error('加载语言文件失败:', err);
                    });
                }
                langMenu.style.display = 'none';
            });
            
            langMenu.appendChild(langOption);
        });
        
        // 点击语言按钮显示/隐藏下拉菜单
        langButton.addEventListener('click', (e) => {
            e.stopPropagation();
            langMenu.style.display = langMenu.style.display === 'none' ? 'block' : 'none';
        });
        
        // 点击页面其他地方隐藏下拉菜单
        document.addEventListener('click', () => {
            langMenu.style.display = 'none';
        });
        
        // 将按钮和菜单添加到浮动按钮区域
        floatingButtons.appendChild(langButton);
        floatingButtons.appendChild(langMenu);
        
        // 添加CSS样式
        addLanguageSwitcherStyles();
    };
    
    // 添加语言切换器的CSS样式
    const addLanguageSwitcherStyles = () => {
        const style = document.createElement('style');
        style.textContent = `
            .language-toggle {
                position: relative;
            }
            
            .language-menu {
                position: absolute;
                right: 60px;
                bottom: 60px;
                background-color: var(--card-bg);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 8px 0;
                z-index: 1000;
                min-width: 120px;
            }
            
            .language-option {
                padding: 8px 16px;
                cursor: pointer;
                transition: background-color 0.2s;
                color: var(--text-color);
            }
            
            .language-option:hover {
                background-color: var(--hover-color);
            }
            
            .language-option.active {
                background-color: rgba(var(--primary-color-rgb), 0.15);
                color: var(--primary-color);
            }
        `;
        document.head.appendChild(style);
    };
    
    // 获取当前语言
    const getCurrentLanguage = () => {
        return currentLanguage;
    };
    
    // 获取翻译文本
    const getText = (key) => {
        return languageData[currentLanguage]?.[key] || key;
    };
    
    // 专门的函数用于更新解析模式区域的文本，确保与其他功能区完全分离
    const updateParsingModeText = (data) => {
        if (!data) return;
        
        console.log('更新解析模式文本:', data);
        
        // 使用直接的DOM选择器，避免与其他选择器冲突
        const parsingModeTitle = document.getElementById('parsing-mode-title');
        if (parsingModeTitle) {
            console.log('更新解析模式标题为:', data.parsing_mode);
            parsingModeTitle.textContent = data.parsing_mode;
        }
        
        const defaultModeText = document.getElementById('default-mode-text');
        if (defaultModeText) {
            console.log('更新默认模式文本为:', data.default_mode);
            defaultModeText.textContent = data.default_mode;
        }
        
        const strictModeText = document.getElementById('strict-mode-text');
        if (strictModeText) {
            console.log('更新严格模式文本为:', data.strict_mode);
            strictModeText.textContent = data.strict_mode;
        }
    };
    
    // 在DOM完全加载后再次应用解析模式的翻译
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const data = languageData[currentLanguage];
            if (data) {
                const parsingModeData = {
                    parsing_mode: data.parsing_mode,
                    default_mode: data.default_mode,
                    strict_mode: data.strict_mode
                };
                updateParsingModeText(parsingModeData);
            }
        }, 100);
    });
    
    // 添加全局方法，允许手动更新解析模式文本，用于调试
    window.updateParsingMode = function() {
        const data = languageData[currentLanguage];
        if (data) {
            const parsingModeData = {
                parsing_mode: data.parsing_mode,
                default_mode: data.default_mode,
                strict_mode: data.strict_mode
            };
            updateParsingModeText(parsingModeData);
        }
    };
    
    // 公开API
    return {
        init,
        getCurrentLanguage,
        getText,
        applyLanguage
    };
})();

// 确保DOM完全加载后手动更新解析模式文本
window.addEventListener('load', function() {
    setTimeout(() => {
        if (typeof languageController !== 'undefined' && typeof window.updateParsingMode === 'function') {
            console.log('手动触发解析模式文本更新');
            window.updateParsingMode();
        }
    }, 200);
});