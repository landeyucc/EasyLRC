/**
 * 主入口模块：初始化所有模块，协调各模块工作
 */
$(document).ready(() => {
    // 初始化语言控制器
    languageController.init();
    
    // 初始化UI
    uiController.init();
    
    // 初始化歌词预览
    lyricHandler.renderLyricPreview();
    
    // 初始化时禁用播放按钮（没有音频时）
    if (typeof audioHandler !== 'undefined' && audioHandler.updatePlayButtonsState) {
        audioHandler.updatePlayButtonsState(false);
    }
    
    // 跟踪当前界面状态（编辑界面或预览界面）
    window.isPreviewMode = false;
    
    // 处理模式切换事件
    document.querySelector('input[name="process-mode"][value="line"]').addEventListener('change', function() {
        if (this.checked) {
            lyricHandler.setProcessMode('line');
            // 启用双语歌词开关
            document.getElementById('bilingual-toggle').disabled = false;
        }
    });
    
    document.querySelector('input[name="process-mode"][value="char"]').addEventListener('change', function() {
        if (this.checked) {
            lyricHandler.setProcessMode('char');
            // 禁用双语歌词
            document.getElementById('bilingual-toggle').checked = false;
            document.getElementById('bilingual-toggle').disabled = true;
        }
    });
    
    // 绑定全局快捷键
    $(document).on('keydown', function(e) {
        // 忽略在输入框中的按键事件
        if ($(e.target).is('input, textarea')) return;
        
        // 根据当前界面状态决定是否执行快捷键操作
        
        // Alt+O：打开文件选择（仅在编辑界面生效）
        if (!window.isPreviewMode && e.altKey && e.key === 'o') {
            e.preventDefault();
            // 创建一个临时的文件输入元素
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'audio/*,.lrc,.txt,.srt,.vtt';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            // 显示按键操作提示
            uiController.showMessage({
                message: languageController.getText('key_open_file'),
                type: 'info',
                duration: 2000
            });
            
            // 监听文件选择事件
            fileInput.addEventListener('change', function() {
                if (this.files && this.files.length > 0) {
                    const file = this.files[0];
                    const fileName = file.name.toLowerCase();
                    // 根据文件类型处理
                    if (file.type.startsWith('audio/')) {
                        audioHandler.handleAudioFile(file);
                    } else if (fileName.endsWith('.lrc') || fileName.endsWith('.txt')) {
                        lyricHandler.handleLyricFile(file);
                    } else if (fileName.endsWith('.srt') || fileName.endsWith('.vtt')) {
                        subtitleConverter.handleSubtitleFile(file);
                    }
                }
                // 移除临时元素
                document.body.removeChild(fileInput);
            });
            
            // 触发点击事件
            fileInput.click();
        }
        
        // Alt+Enter：播放/暂停音频
        if (e.altKey && e.key === 'Enter') {
            e.preventDefault();
            audioHandler.togglePlay();
            
            // 显示按键操作提示
            uiController.showMessage({
                message: languageController.getText('key_play_pause'),
                type: 'info',
                duration: 2000
            });
        }
        
        // B键：后退两秒
        if (!e.altKey && e.key === 'b' || e.key === 'B') {
            e.preventDefault();
            audioHandler.seekRelative(-2);
            
            // 显示按键操作提示
            uiController.showMessage({
                message: languageController.getText('key_back_2s'),
                type: 'info',
                duration: 2000
            });
        }
        
        // N键：前进两秒
        if (!e.altKey && e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            audioHandler.seekRelative(2);
            
            // 显示按键操作提示
            uiController.showMessage({
                message: languageController.getText('key_forward_2s'),
                type: 'info',
                duration: 2000
            });
        }
        
        // Alt+B：切换上一个歌词（仅在编辑界面生效）
        if (!window.isPreviewMode && e.altKey && (e.key === 'b' || e.key === 'B')) {
            e.preventDefault();
            lyricHandler.navigateLyric(-1);
            
            // 显示按键操作提示
            uiController.showMessage({
                message: languageController.getText('key_prev_lyric'),
                type: 'info',
                duration: 2000
            });
        }
        
        // Alt+N：切换下一个歌词（仅在编辑界面生效）
        if (!window.isPreviewMode && e.altKey && (e.key === 'n' || e.key === 'N')) {
            e.preventDefault();
            lyricHandler.navigateLyric(1);
            
            // 显示按键操作提示
            uiController.showMessage({
                message: languageController.getText('key_next_lyric'),
                type: 'info',
                duration: 2000
            });
        }
        
        // 空格键：标记时间（仅在编辑界面生效）
        if (!window.isPreviewMode && e.key === ' ') {
            e.preventDefault();
            lyricHandler.markCurrentLyricTime();
            
            // 显示按键操作提示
            uiController.showMessage({
                message: languageController.getText('key_mark_time'),
                type: 'info',
                duration: 2000
            });
        }
    });

    // 绑定字幕上传事件
    $('#subtitle-upload').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            subtitleConverter.handleSubtitleFile(file);
            // 清空input以便重复选择同一文件
            $(this).val('');
        }
    });
    
    // 处理textarea手动调整高度
    const textarea = document.getElementById('lyric-textarea');
    if (textarea) {
        let isManuallyResizing = false;
        let manualHeight = null;
        
        textarea.addEventListener('mousedown', function(e) {
            if (e.offsetY > textarea.clientHeight - 10) {
                isManuallyResizing = true;
                manualHeight = textarea.style.height;
                textarea.classList.add('manual-resize');
            }
        });
        
        document.addEventListener('mouseup', function() {
            if (isManuallyResizing) {
                isManuallyResizing = false;
                textarea.classList.remove('manual-resize');
            }
        });
        
        textarea.addEventListener('input', function() {
            if (!isManuallyResizing) {
                lyricHandler.autoResizeTextarea();
            }
        });
    }

    // 绑定识别时间开关事件
    $('#recognize-time-toggle').on('change', function() {
        const textarea = document.getElementById('lyric-textarea');
        if (!textarea) return;
        
        if (this.checked) {
            // 开启时：识别并格式化现有内容，保留在textarea中
            const content = textarea.value;
            const result = lyricHandler.recognizeTimeCodes(content);
            textarea.value = result.formatted;
            lyricHandler.autoResizeTextarea();
        }
    });
    
    // 绑定全局事件
    $(window).on('beforeunload', (e) => {
        const textarea = document.getElementById('lyric-textarea');
        const hasTextareaContent = textarea && textarea.value.trim().length > 0;
        const hasAudio = audioHandler.getAudioElement() && audioHandler.getAudioElement().src;
        const lyrics = lyricHandler.getLyrics();
        const hasLyrics = lyrics && lyrics.length > 0;
        const hasProcessLyrics = lyrics && lyrics.some(l => l.time !== null);
        
        if (hasTextareaContent || hasAudio || hasLyrics || hasProcessLyrics) {
            const message = languageController.getText('leave_confirm');
            e.preventDefault();
            e.returnValue = message;
            return message;
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const currentYear = new Date().getFullYear();
    const footerText = `© ${currentYear} Github@<a href="https://github.com/landeyucc" target="_blank" title="GitHub">landeyucc</a>. Powered by <a href="https://coldsea.vip/" target="_blank" title="Coldsea">Coldsea Team</a> `;
    const footerElements = document.querySelectorAll('.footer p');
    
    footerElements.forEach(function(footer) {
        footer.innerHTML = footerText;
    });
});