/**
 * 字幕转换模块：支持SRT和VTT格式转换为LRC格式
 */
const subtitleConverter = (() => {
    // 解析SRT格式
    const parseSRT = (content) => {
        const subtitles = [];
        const blocks = content.trim().split(/\n\n+/);
        
        blocks.forEach(block => {
            const lines = block.trim().split('\n');
            if (lines.length >= 3) {
                let timeLineIndex = -1;
                
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('-->')) {
                        timeLineIndex = i;
                        break;
                    }
                }
                
                if (timeLineIndex !== -1) {
                    const timeLine = lines[timeLineIndex];
                    const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
                    
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        const seconds = parseInt(timeMatch[3]);
                        const milliseconds = parseInt(timeMatch[4]);
                        const startTime = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
                        
                        const textLines = lines.slice(timeLineIndex + 1).filter(line => line.trim());
                        const text = textLines.join(' ');
                        
                        subtitles.push({
                            startTime: startTime,
                            text: text
                        });
                    }
                }
            }
        });
        
        return subtitles;
    };
    
    // 解析VTT格式
    const parseVTT = (content) => {
        const subtitles = [];
        const lines = content.trim().split('\n');
        let i = 0;
        
        while (i < lines.length && !lines[i].includes('-->')) {
            i++;
        }
        
        while (i < lines.length) {
            const line = lines[i].trim();
            
            if (line.includes('-->')) {
                const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
                const timeMatchShort = line.match(/(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2})\.(\d{3})/);
                
                let startTime;
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const seconds = parseInt(timeMatch[3]);
                    const milliseconds = parseInt(timeMatch[4]);
                    startTime = hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
                } else if (timeMatchShort) {
                    const minutes = parseInt(timeMatchShort[1]);
                    const seconds = parseInt(timeMatchShort[2]);
                    const milliseconds = parseInt(timeMatchShort[3]);
                    startTime = minutes * 60 + seconds + milliseconds / 1000;
                } else {
                    i++;
                    continue;
                }
                
                i++;
                const textLines = [];
                
                while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
                    const textLine = lines[i].trim();
                    if (textLine && !textLine.startsWith('NOTE') && !textLine.startsWith('STYLE')) {
                        textLines.push(textLine);
                    }
                    i++;
                }
                
                const text = textLines.join(' ');
                if (text) {
                    subtitles.push({
                        startTime: startTime,
                        text: text
                    });
                }
            } else {
                i++;
            }
        }
        
        return subtitles;
    };
    
    // 转换为LRC格式（带时间）
    const convertToLRC = (subtitles) => {
        if (subtitles.length === 0) {
            return '';
        }
        
        let lrcContent = '';
        subtitles.forEach(sub => {
            const minutes = Math.floor(sub.startTime / 60);
            const seconds = Math.floor(sub.startTime % 60);
            const hundredths = Math.floor((sub.startTime % 1) * 100);
            
            const timeTag = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}]`;
            lrcContent += `${timeTag}${sub.text}\n`;
        });
        
        return lrcContent;
    };
    
    // 转换为纯文本（无时间）
    const convertToPlainText = (subtitles) => {
        if (subtitles.length === 0) {
            return '';
        }
        
        return subtitles.map(sub => sub.text).join('\n');
    };
    
    // 获取当前选择的转换模式
    const getConvertMode = () => {
        const mode = $('input[name="subtitle-mode"]:checked').val();
        return mode || 'text-only';
    };
    
    // 处理SRT文件
    const handleSRTFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const subtitles = parseSRT(content);
                
                if (subtitles.length === 0) {
                    uiController.showMessage({
                        title: languageController.getText('tipTitle'),
                        message: languageController.getText('parse_srt_error'),
                        type: 'error',
                        duration: 3000
                    });
                    return;
                }
                
                processSubtitles(subtitles);
                
            } catch (error) {
                uiController.showMessage({
                    title: languageController.getText('tipTitle'),
                    message: languageController.getText('handle_subtitle_error').replace('{error}', error.message),
                    type: 'error',
                    duration: 3000
                });
            }
        };
        reader.readAsText(file);
    };
    
    // 处理VTT文件
    const handleVTTFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const subtitles = parseVTT(content);
                
                if (subtitles.length === 0) {
                    uiController.showMessage({
                        title: languageController.getText('tipTitle'),
                        message: languageController.getText('parse_vtt_error'),
                        type: 'error',
                        duration: 3000
                    });
                    return;
                }
                
                processSubtitles(subtitles);
                
            } catch (error) {
                uiController.showMessage({
                    title: languageController.getText('tipTitle'),
                    message: languageController.getText('handle_subtitle_error').replace('{error}', error.message),
                    type: 'error',
                    duration: 3000
                });
            }
        };
        reader.readAsText(file);
    };
    
    // 处理字幕数据（根据模式处理）
    const processSubtitles = (subtitles) => {
        const mode = getConvertMode();
        
        if (mode === 'text-only') {
            // 仅提取文本模式：填入textarea，不进入歌词预览
            const plainText = convertToPlainText(subtitles);
            $('#lyric-textarea').val(plainText);
            
            if (typeof lyricHandler !== 'undefined' && lyricHandler.autoResizeTextarea) {
                lyricHandler.autoResizeTextarea();
            }
            
            uiController.showMessage({
                title: languageController.getText('operationSuccessTitle'),
                message: languageController.getText('subtitle_text_extracted').replace('{count}', subtitles.length),
                type: 'success',
                duration: 3000
            });
            
            // 切换到文本输入选项卡但不分割
            $('#text-input-btn').click();
            
        } else {
            // 提取时间与文本模式：直接导入到歌词预览
            if (typeof lyricHandler !== 'undefined' && lyricHandler.importTimedLyrics) {
                // 转换为带时间的歌词格式
                const timedLyrics = subtitles.map(sub => ({
                    text: sub.text,
                    time: sub.startTime
                }));
                
                lyricHandler.importTimedLyrics(timedLyrics);
                
                uiController.showMessage({
                    title: languageController.getText('operationSuccessTitle'),
                    message: languageController.getText('subtitle_imported_with_time').replace('{count}', subtitles.length),
                    type: 'success',
                    duration: 3000
                });
            } else {
                // 如果lyricHandler未加载，回退到文本模式
                const plainText = convertToPlainText(subtitles);
                $('#lyric-textarea').val(plainText);
                
                if (typeof lyricHandler !== 'undefined' && lyricHandler.autoResizeTextarea) {
                    lyricHandler.autoResizeTextarea();
                }
                
                uiController.showMessage({
                    title: languageController.getText('tipTitle'),
                    message: languageController.getText('subtitle_fallback_text_only'),
                    type: 'info',
                    duration: 3000
                });
                
                $('#text-input-btn').click();
            }
        }
    };
    
    // 处理字幕文件（根据扩展名判断类型）
    const handleSubtitleFile = (file) => {
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.srt')) {
            handleSRTFile(file);
        } else if (fileName.endsWith('.vtt')) {
            handleVTTFile(file);
        } else {
            uiController.showMessage({
                title: languageController.getText('tipTitle'),
                message: languageController.getText('unsupported_format'),
                type: 'error',
                duration: 3000
            });
        }
    };
    
    return {
        parseSRT,
        parseVTT,
        convertToLRC,
        convertToPlainText,
        handleSRTFile,
        handleVTTFile,
        handleSubtitleFile,
        getConvertMode
    };
})();
