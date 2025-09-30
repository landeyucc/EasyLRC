/**
 * 歌词处理模块：负责歌词管理、解析、渲染等功能
 */
const lyricHandler = (() => {
    // 导入TXT文件
    const importTXT = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            $('#lyric-textarea').val(content);
            // 自动切换到文本输入选项卡
            $('#text-input-btn').click();
        };
        reader.readAsText(file);
    };
    
    // 处理歌词文件（LRC或TXT）
    const handleLyricFile = (file) => {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.lrc')) {
            importLRC(file);
        } else if (fileName.endsWith('.txt')) {
            importTXT(file);
        }
    };
    // 歌词数据数组
    let lyrics = [];
    // 是否启用双语歌词
    let bilingualEnabled = false;
    // 当前处理的歌词索引
    let currentLyricIndex = -1;
    // 预览界面当前歌词索引
    let previewCurrentLyricIndex = -1;
    // 处理模式：line(逐行处理) 或 char(逐字处理)
    let processMode = 'line';
    // 当前处理的字符索引（用于逐字处理模式）
    let currentCharIndex = 0;
    
    // 分割歌词（按空格、逗号、句号）
    const splitLyrics = () => {
        const text = $('#lyric-textarea').val().trim();
        if (!text) {
            uiController.showMessage({
                title: '提示',
                message: '请输入歌词内容',
                type: 'error',
                duration: 3000
            });
            return;
        }
        
        // 按换行分割，保留所有行（包括空行）
        const allLines = text.split('\n');
        
        // 重置歌词数据
        lyrics = [];
        
        if (bilingualEnabled) {
            // 双语歌词模式：单数行为主歌词，双数行为翻译
            for (let i = 0; i < allLines.length; i += 2) {
                const mainLyric = allLines[i].trim();
                // 检查是否有下一行作为翻译（可能不存在）
                const translation = (i + 1 < allLines.length) ? allLines[i + 1].trim() : '';
                
                if (mainLyric) { // 主歌词不能为空
                    lyrics.push({
                        text: mainLyric,
                        time: null,
                        translation: translation // 翻译可以为空
                    });
                }
            }
        } else {
            // 普通模式：按标点和换行分割
            const lines = text.split(/[\n,，。；]+/).filter(line => line.trim() !== '');
            lyrics = lines.map(text => ({ text, time: null }));
        }
        
        if (lyrics.length === 0) {
            uiController.showMessage({
                title: '提示',
                message: '未检测到有效歌词内容',
                type: 'error',
                duration: 3000
            });
            return;
        }
        
        currentLyricIndex = 0;
        
        // 更新预览和上下文
        renderLyricPreview();
        uiController.updateLyricContext();
    };
    
    // 获取当前选择的解析模式
    const getParsingMode = () => {
        const mode = $('input[name="parsing-mode"]:checked').val();
        return mode || 'default'; // 默认使用默认模式
    };
    
    // 导入LRC文件
    const importLRC = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lrcLines = content.split('\n');
            lyrics = [];
            
            // 解析LRC格式：[mm:ss.xx]或[mm:ss:xx]歌词（xx是百分秒）
            const lrcRegex = /\[(\d+):(\d+)[:.](\d{2})\](.*)/;
            
            // 用于检测双语歌词的正则表达式
            const bilingualRegex = /(.+)\s*[\|／\/]\s*(.+)/;
            
            // 用于检测逐字时间标记的正则表达式 <mm:ss.xx>
            const charTimeRegex = /<(\d+):(\d+)\.(\d{2})>([^<]*)/g;
            
            // 临时存储解析后的行，用于检测双行格式
            const parsedLines = [];
            
            // 检测是否为逐字歌词
            let hasCharTimings = false;
            
            // 第一步：解析所有行，提取时间和文本
            lrcLines.forEach(line => {
                // 先检查是否为元信息标签（无论是否有时间码）
                const metaInfo = parseLRCMetadata(line);
                
                if (metaInfo) {
                    // 将元信息填入对应的输入框
                    $(`#meta-${metaInfo.tag}`).val(metaInfo.value);
                } else {
                    // 不是元数据行，检查是否为时间标签歌词行
                    const match = line.match(lrcRegex);
                    
                    if (match) {
                        // 时间标签歌词行
                        const minutes = parseInt(match[1]);
                        const seconds = parseInt(match[2]);
                        const hundredths = parseInt(match[3]);
                        const time = minutes * 60 + seconds + hundredths / 100;
                        const text = match[4].trim();
                        
                        if (text) {
                            // 检查是否包含逐字时间标记 <mm:ss.xx>
                            if (text.includes('<') && text.includes('>')) {
                                let charText = text;
                                let charMatch;
                                let charTimings = [];
                                let lastIndex = 0;
                                let plainText = '';
                                
                                // 重置正则表达式状态
                                charTimeRegex.lastIndex = 0;
                                
                                while ((charMatch = charTimeRegex.exec(text)) !== null) {
                                    const charMinutes = parseInt(charMatch[1]);
                                    const charSeconds = parseInt(charMatch[2]);
                                    const charHundredths = parseInt(charMatch[3]);
                                    const charTime = charMinutes * 60 + charSeconds + charHundredths / 100;
                                    const char = charMatch[4];
                                    
                                    charTimings.push({
                                        char: char,
                                        time: charTime
                                    });
                                    
                                    plainText += char;
                                    hasCharTimings = true;
                                }
                                
                                if (hasCharTimings) {
                                    parsedLines.push({ 
                                        text: plainText, 
                                        time: time,
                                        charTimings: charTimings
                                    });
                                } else {
                                    parsedLines.push({ text, time });
                                }
                            } else {
                                parsedLines.push({ text, time });
                            }
                        }
                    } else if (line.trim()) {
                        // 没有时间标签的普通文本行
                        parsedLines.push({ text: line.trim(), time: null });
                    }
                }
            });
            
            // 如果检测到逐字歌词，设置处理模式为逐字模式
            if (hasCharTimings) {
                processMode = 'char';
                // 逐字模式下禁用双语歌词
                bilingualEnabled = false;
                // 直接使用解析的行
                lyrics = parsedLines;
            } else {
                // 第二步：处理双语歌词
                if (bilingualEnabled) {
                    for (let i = 0; i < parsedLines.length; i++) {
                        const currentLine = parsedLines[i];
                        
                        // 检查是否有斜杠分隔符
                        const bilingualMatch = currentLine.text.match(bilingualRegex);
                        
                        if (bilingualMatch) {
                            // 使用斜杠分隔的双语歌词
                            const mainLyric = bilingualMatch[1].trim();
                            const translation = bilingualMatch[2].trim();
                            lyrics.push({ 
                                text: mainLyric, 
                                time: currentLine.time, 
                                translation 
                            });
                        } else if (i < parsedLines.length - 1 && 
                                currentLine.time !== null && 
                                parsedLines[i + 1].time !== null && 
                                currentLine.time === parsedLines[i + 1].time) {
                            // 检测到双行格式：两行时间码相同
                            const mainLyric = currentLine.text;
                            const translation = parsedLines[i + 1].text;
                            lyrics.push({ 
                                text: mainLyric, 
                                time: currentLine.time, 
                                translation 
                            });
                            // 跳过下一行，因为已经作为翻译处理了
                            i++;
                        } else {
                            // 普通歌词行，添加空翻译
                            lyrics.push({ 
                                text: currentLine.text, 
                                time: currentLine.time, 
                                translation: "" 
                            });
                        }
                    }
                } else {
                    // 非双语模式，直接添加所有行
                    lyrics = parsedLines;
                }
            }
            
            // 根据解析模式决定是否按时间排序
            const parsingMode = getParsingMode();
            if (parsingMode === 'strict') {
                // 严格模式：按时间排序（有时间的在前，无时间的在后）
                lyrics.sort((a, b) => {
                    if (a.time === null && b.time === null) return 0;
                    if (a.time === null) return 1;
                    if (b.time === null) return -1;
                    return a.time - b.time;
                });
            } else {
                // 默认模式：保持原LRC文件中的顺序
                // 只对null时间的项进行排序（放到最后）
                lyrics.sort((a, b) => {
                    if (a.time === null && b.time !== null) return 1;
                    if (a.time !== null && b.time === null) return -1;
                    return 0; // 保持原有顺序
                });
            }
            
            currentLyricIndex = 0;
            renderLyricPreview();
            uiController.updateLyricContext();
            
        };
        reader.readAsText(file);
    };
    
    // 窗口大小变化处理
    $(window).on('resize', _.debounce(() => {
        if (lyrics.length > 0) {
            renderLyricPreview();
        }
    }, 250));
    
    // 渲染编辑界面的歌词预览
    const renderLyricPreview = () => {
        const $preview = $('#lyric-preview');
        $preview.empty();
        
        if (lyrics.length === 0) {
            $preview.html('<div class="placeholder-text">请输入歌词并分割，或导入LRC文件</div>');
            return;
        }
        
        // 检测是否为移动端（屏幕宽度小于768px）
        const isMobile = window.innerWidth <= 768;
        
        lyrics.forEach((lyric, index) => {
            const $line = $('<div class="lyric-line"></div>');
            $line.addClass(index === currentLyricIndex ? 'current' : '');
            
            let timeText = '未标记';
            if (lyric.time !== null) {
                timeText = timeHandler.formatTime(lyric.time);
            }
            
            if (isMobile) {
                // 移动端：使用下拉菜单
                $line.html(`
                    <span class="lyric-number"><strong>${(index + 1).toString().padStart(2, '0')}</strong></span>
                    <span class="lyric-time">[${timeText}]</span>
                    <span class="lyric-content">${lyric.text}</span>
                    <div class="lyric-menu">
                        <button class="menu-btn select-btn" onclick="lyricHandler.selectLyric(${index})"><i class="fas fa-check"></i></button>
                        <button class="menu-toggle" onclick="$(this).parent().toggleClass('show')"><i class="fas fa-ellipsis-v"></i></button>
                        <div class="dropdown-menu">
                            <button class="menu-item" onclick="lyricHandler.selectLyric(${index}); $(this).closest('.lyric-menu').removeClass('show')">
                                <i class="fas fa-check"></i>选中
                            </button>
                            <button class="menu-item" onclick="lyricHandler.editLyric(${index}); $(this).closest('.lyric-menu').removeClass('show')">
                                <i class="fas fa-edit"></i>编辑
                            </button>
                            <button class="menu-item" onclick="lyricHandler.moveLyricUp(${index}); $(this).closest('.lyric-menu').removeClass('show')">
                                <i class="fas fa-arrow-up"></i>上移
                            </button>
                            <button class="menu-item" onclick="lyricHandler.moveLyricDown(${index}); $(this).closest('.lyric-menu').removeClass('show')">
                                <i class="fas fa-arrow-down"></i>下移
                            </button>
                            <button class="menu-item delete-item" onclick="lyricHandler.deleteLyric(${index}); $(this).closest('.lyric-menu').removeClass('show')">
                                <i class="fas fa-trash"></i>删除
                            </button>
                        </div>
                    </div>
                `);
            } else {
                // PC端：使用按钮布局
                $line.html(`
                    <span class="lyric-number"><strong>${(index + 1).toString().padStart(2, '0')}</strong></span>
                    <span class="lyric-time">[${timeText}]</span>
                    <span class="lyric-content">${lyric.text}</span>
                    <div class="lyric-menu">
                        <button class="menu-btn select-btn" onclick="lyricHandler.selectLyric(${index})"><i class="fas fa-check"></i></button>
                        <button class="menu-btn" onclick="lyricHandler.editLyric(${index})"><i class="fas fa-edit"></i></button>
                        <button class="menu-btn" onclick="lyricHandler.moveLyricUp(${index})"><i class="fas fa-arrow-up"></i></button>
                        <button class="menu-btn" onclick="lyricHandler.moveLyricDown(${index})"><i class="fas fa-arrow-down"></i></button>
                        <button class="menu-btn delete-btn" onclick="lyricHandler.deleteLyric(${index})"><i class="fas fa-trash"></i></button>
                    </div>
                `);
            }
            $preview.append($line);
        });
    };
    
    // 标记当前歌词时间
    const markCurrentLyricTime = () => {
        if (currentLyricIndex < 0 || currentLyricIndex >= lyrics.length) return;
        
        const currentTime = audioHandler.getCurrentTime();
        
        if (processMode === 'line') {
            // 逐行处理模式
            lyrics[currentLyricIndex].time = currentTime;
            
            // 自动跳到下一句
            if (currentLyricIndex < lyrics.length - 1) {
                currentLyricIndex++;
                uiController.updateLyricContext();
            }
        } else if (processMode === 'char') {
            // 逐字处理模式
            const currentLyric = lyrics[currentLyricIndex];
            const text = currentLyric.text;
            
            // 如果是第一个字符，设置整行的时间
            if (currentCharIndex === 0) {
                // 创建逐字时间标记的初始结构
                currentLyric.charTimings = [];
                currentLyric.time = currentTime;
            }
            
            // 添加当前字符的时间标记
            if (currentCharIndex < text.length) {
                currentLyric.charTimings.push({
                    char: text[currentCharIndex],
                    time: currentTime
                });
                
                // 高亮显示当前处理的字符
                uiController.updateLyricContext(currentCharIndex);
                
                // 移动到下一个字符
                currentCharIndex++;
                
                // 如果已经处理完当前行的所有字符，自动跳到下一行
                if (currentCharIndex >= text.length) {
                    currentCharIndex = 0;
                    if (currentLyricIndex < lyrics.length - 1) {
                        currentLyricIndex++;
                        uiController.updateLyricContext();
                    }
                }
            }
        }
        
        renderLyricPreview();
    };
    
    // 获取当前处理模式
    const getProcessMode = () => processMode;
    
    // 设置处理模式
    const setProcessMode = (mode) => {
        if (mode === 'line' || mode === 'char') {
            processMode = mode;
            currentCharIndex = 0; // 重置字符索引
            
            // 如果切换到逐字模式，禁用双语歌词
            if (mode === 'char' && bilingualEnabled) {
                $('#bilingual-toggle').prop('checked', false).trigger('change');
            }
            
            return true;
        }
        return false;
    };
    
    // 导航到上一句/下一句歌词
    const navigateLyric = (direction) => {
        if (lyrics.length === 0) return;
        
        const newIndex = currentLyricIndex + direction;
        if (newIndex >= 0 && newIndex < lyrics.length) {
            currentLyricIndex = newIndex;
            // 在逐字模式下，切换歌词时重置字符索引
            if (processMode === 'char') {
                currentCharIndex = 0;
            }
            uiController.updateLyricContext();
            renderLyricPreview();
        }
    };
    
    // 添加空白歌词
    const addBlankLyric = () => {
        lyrics.splice(currentLyricIndex + 1, 0, { text: '[空白]', time: null });
        renderLyricPreview();
        uiController.updateLyricContext();
    };
    
    // 应用时间调整（整体偏移）
    const applyTimeAdjustment = (adjustment) => {
        if (isNaN(adjustment) || lyrics.length === 0) return;
        
        lyrics.forEach(lyric => {
            if (lyric.time !== null) {
                lyric.time = Math.max(0, lyric.time + adjustment);
            }
        });
        
        renderLyricPreview();
        renderPreviewLyrics(); // 同时更新预览界面
    };
    
    // 切换到预览界面
    const switchToPreviewInterface = () => {
        if (lyrics.length === 0 || !audioHandler.getAudioElement().src) {
            uiController.showMessage({
                title: languageController.getText('tipTitle'),
                message: languageController.getText('uploadAudioAndTagLyrics'),
                type: 'error',
                duration: 3000
            });
            return;
        }
        
        // 检查音频是否在播放，如果是则立即停止
        if (!audioHandler.getAudioElement().paused) {
            audioHandler.getAudioElement().pause();
            if (window.jQuery) {
                $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
            }
        }
        
        $('#edit-interface').addClass('hidden');
        $('#preview-interface').removeClass('hidden');
        renderPreviewLyrics();
        
        // 更新界面状态
        window.isPreviewMode = true;
    };
    
    // 切换回编辑界面
    const switchToEditInterface = () => {
        // 检查音频是否在播放，如果是则立即停止
        if (!audioHandler.getPreviewAudioElement().paused) {
            audioHandler.getPreviewAudioElement().pause();
            if (window.jQuery) {
                $('#preview-play-pause i').removeClass('fa-pause').addClass('fa-play');
            }
        }
        
        $('#preview-interface').addClass('hidden');
        $('#edit-interface').removeClass('hidden');
        
        // 更新界面状态
        window.isPreviewMode = false;
    };
    
    // 渲染预览界面歌词（支持歌词同步高亮显示）
    const renderPreviewLyrics = () => {
        const display = document.getElementById('sync-lyric-display');
        display.innerHTML = '';
        
        if (lyrics.length === 0) {
            display.innerHTML = `<div class="placeholder-text">${languageController.getText('noLyricData')}</div>`;
            return;
        }
        
        // 按时间排序歌词，并确保所有歌词都有有效的时间戳
        const sortedLyrics = [...lyrics]
            .filter(l => l.time !== null && !isNaN(l.time) && l.text.trim() !== '')
            .sort((a, b) => a.time - b.time);
        
        if (sortedLyrics.length === 0) {
            display.innerHTML = `<div class="placeholder-text">${languageController.getText('noValidTimedLyrics')}</div>`;
            return;
        }
        
        // 创建歌词行元素
        sortedLyrics.forEach((lyric, index) => {
            const timeText = timeHandler.formatTime(lyric.time);
            
            const lyricLine = document.createElement('div');
            lyricLine.className = 'sync-lyric-line';
            lyricLine.setAttribute('data-time', lyric.time);
            lyricLine.setAttribute('data-index', index);
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'sync-time';
            timeSpan.textContent = `[${timeText}]`;
            
            const textSpan = document.createElement('span');
            textSpan.className = 'sync-text';
            
            // 处理逐字模式下的歌词显示
            if (processMode === 'char' && lyric.charTimings && lyric.charTimings.length > 0) {
                // 逐字模式：将每个字符包装在span中
                for (let i = 0; i < lyric.text.length; i++) {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char-span';
                    charSpan.textContent = lyric.text[i];
                    textSpan.appendChild(charSpan);
                }
            } else {
                // 逐行模式：直接显示文本
                textSpan.textContent = lyric.text;
            }
            
            lyricLine.appendChild(timeSpan);
            lyricLine.appendChild(textSpan);
            
            // 如果有翻译且双语模式开启，添加翻译文本
            if (bilingualEnabled && lyric.translation) {
                const translationSpan = document.createElement('span');
                translationSpan.className = 'sync-translation';
                translationSpan.textContent = lyric.translation;
                lyricLine.appendChild(document.createElement('br'));
                lyricLine.appendChild(translationSpan);
            }
            
            // 添加点击事件，点击歌词跳转到对应时间
            lyricLine.addEventListener('click', function() {
                const time = parseFloat(this.getAttribute('data-time'));
                if (!isNaN(time)) {
                    audioHandler.getPreviewAudioElement().currentTime = time;
                    // 如果音频暂停中，自动开始播放
                    if (audioHandler.getPreviewAudioElement().paused) {
                        // 调用togglePreviewPlayPause函数来确保图标也被正确更新
                        audioHandler.togglePreviewPlayPause();
                    }
                }
            });
            
            display.appendChild(lyricLine);
        });
        
        // 重置当前歌词索引
        previewCurrentLyricIndex = -1;
        
        // 移除之前的同步事件绑定（如果有）
        audioHandler.getPreviewAudioElement().removeEventListener('timeupdate', syncLyricWithAudio);
        
        // 使用节流函数优化同步频率
        const throttledSync = (function() {
            let lastTime = 0;
            return function() {
                const now = Date.now();
                if (now - lastTime >= 10) { // 每10ms更新一次
                    syncLyricWithAudio();
                    lastTime = now;
                }
            };
        })();
        
        // 绑定音频同步事件，使用节流函数
        audioHandler.getPreviewAudioElement().addEventListener('timeupdate', throttledSync);
        
        // 初始化滚动位置
        const container = document.querySelector('.sync-lyric-container');
        if (container) {
            container.scrollTop = 0;
        }
    };
    
    // 歌词与音频同步
    const syncLyricWithAudio = function() {
        const currentTime = audioHandler.getPreviewAudioElement().currentTime;
        const lines = document.querySelectorAll('.sync-lyric-line');
        if (lines.length === 0) return;
        
        // 从当前索引开始搜索，提高性能
        let startIndex = Math.max(0, previewCurrentLyricIndex - 1);
        let foundCurrentLine = false;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            const lineTime = parseFloat(line.getAttribute('data-time'));
            const nextLineTime = i < lines.length - 1 ? 
                parseFloat(lines[i + 1].getAttribute('data-time')) : 
                Infinity;
            
            // 当前时间在这一行的时间范围内
            if (currentTime >= lineTime && currentTime < nextLineTime) {
                if (i !== previewCurrentLyricIndex) {
                    // 如果有之前的高亮行，先移除
                    if (previewCurrentLyricIndex !== -1) {
                        lines[previewCurrentLyricIndex].classList.remove('current');
                        // 同时移除翻译行的高亮（如果有）
                        const prevTranslation = lines[previewCurrentLyricIndex].querySelector('.sync-translation');
                        if (prevTranslation) {
                            prevTranslation.classList.remove('current-translation');
                        }
                        // 移除所有逐字高亮
                        const prevCharSpans = lines[previewCurrentLyricIndex].querySelectorAll('.char-highlight');
                        prevCharSpans.forEach(span => span.classList.remove('char-highlight'));
                    }
                    
                    // 添加当前行的高亮
                    line.classList.add('current');
                    
                    // 如果有翻译，也高亮显示翻译
                    const translation = line.querySelector('.sync-translation');
                    if (translation) {
                        translation.classList.add('current-translation');
                    }
                    
                    previewCurrentLyricIndex = i;
                    
                    // 处理逐字模式下的字符高亮
                    if (processMode === 'char' && i < lyrics.length && lyrics[i].charTimings) {
                        // 创建或更新字符span元素
                        const textSpan = line.querySelector('.sync-text');
                        if (textSpan && !textSpan.querySelector('.char-span')) {
                            // 将文本拆分为单个字符的span
                            const text = textSpan.textContent;
                            textSpan.textContent = '';
                            for (let j = 0; j < text.length; j++) {
                                const charSpan = document.createElement('span');
                                charSpan.className = 'char-span';
                                charSpan.textContent = text[j];
                                textSpan.appendChild(charSpan);
                            }
                        }
                    }
                    
                    // 平滑滚动到当前歌词（居中显示）
                    const container = document.querySelector('.sync-lyric-container');
                    if (container) {
                        // 使用 scrollIntoView 方法使当前行居中显示
                        // 这种方法更简洁，并且通常能更好地处理各种布局情况
                        line.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }
                
                // 处理逐字模式下的实时字符高亮
                if (processMode === 'char' && i < lyrics.length && lyrics[i].charTimings) {
                    const charTimings = lyrics[i].charTimings;
                    const charSpans = line.querySelectorAll('.char-span');
                    
                    if (charSpans.length > 0 && charTimings.length > 0) {
                        // 查找当前应该高亮到哪个字符
                        let highlightIndex = -1;
                        for (let j = 0; j < charTimings.length; j++) {
                            if (charTimings[j].time <= currentTime) {
                                highlightIndex = j;
                            } else {
                                break;
                            }
                        }
                        
                        // 更新字符高亮
                        for (let j = 0; j < charSpans.length; j++) {
                            if (j <= highlightIndex) {
                                charSpans[j].classList.add('char-highlight');
                            } else {
                                charSpans[j].classList.remove('char-highlight');
                            }
                        }
                    }
                }
                
                foundCurrentLine = true;
                break;
            }
            
            // 如果已经超过当前时间，不需要继续搜索
            if (lineTime > currentTime) break;
        }
        
        // 如果没有找到当前行，移除所有高亮
        if (!foundCurrentLine && previewCurrentLyricIndex !== -1) {
            lines[previewCurrentLyricIndex].classList.remove('current');
            // 同时移除翻译行的高亮（如果有）
            const prevTranslation = lines[previewCurrentLyricIndex].querySelector('.sync-translation');
            if (prevTranslation) {
                prevTranslation.classList.remove('current-translation');
            }
            // 移除所有逐字高亮
            const prevCharSpans = lines[previewCurrentLyricIndex].querySelectorAll('.char-highlight');
            prevCharSpans.forEach(span => span.classList.remove('char-highlight'));
            previewCurrentLyricIndex = -1;
        }
    };
    
    // 获取用户填写的元数据
    const getMetadata = () => {
        const metadata = [];
        const metadataFields = [
            { id: 'meta-ar', tag: 'ar', name: languageController.getText('metaArtist') },
            { id: 'meta-ti', tag: 'ti', name: languageController.getText('metaTitle') },
            { id: 'meta-al', tag: 'al', name: languageController.getText('metaAlbum') },
            { id: 'meta-by', tag: 'by', name: languageController.getText('metaLyricCreator') },
            { id: 'meta-offset', tag: 'offset', name: languageController.getText('metaOffset') },
            { id: 'meta-length', tag: 'length', name: languageController.getText('metaLength') },
            { id: 'meta-au', tag: 'au', name: languageController.getText('metaSinger') },
            { id: 'meta-re', tag: 're', name: languageController.getText('metaArranger') },
            { id: 'meta-ve', tag: 've', name: languageController.getText('metaVersion') },
            { id: 'meta-composer', tag: 'composer', name: languageController.getText('metaComposer') },
            { id: 'meta-lyricist', tag: 'lyricist', name: languageController.getText('metaLyricist') },
            { id: 'meta-translator', tag: 'translator', name: languageController.getText('metaTranslator') },
            { id: 'meta-language', tag: 'language', name: languageController.getText('metaLanguage') }
        ];
        
        metadataFields.forEach(field => {
            const value = $(`#${field.id}`).val().trim();
            if (value) {
                metadata.push(`[${field.tag}:${value}]`);
            }
        });
        
        return metadata;
    };
    
    // 解析LRC元信息标签
    const parseLRCMetadata = (line) => {
        // 先尝试匹配带有时间码的元数据行，格式如：[00:00.00][ar:艺术家]
        const timeMetaRegex = /\[\d+:\d+[:.:]\d{2}\]\[([a-z]+)\s*:\s*(.+?)\]/i;
        let match = line.match(timeMetaRegex);
        
        if (!match) {
            // 如果不是带时间码的元数据行，尝试匹配普通元数据行
            const metaRegex = /\[([a-z]+)\s*:\s*(.+?)\]/i;
            match = line.match(metaRegex);
        }
        
        if (match) {
            const tag = match[1].toLowerCase();
            const value = match[2].trim();
            
            // 检查是否为支持的元信息标签
            const supportedTags = ['ar', 'ti', 'al', 'by', 'offset', 'length', 'au', 're', 've', 
                                'composer', 'lyricist', 'translator', 'language'];
            
            if (supportedTags.includes(tag)) {
                return { tag, value };
            }
        }
        
        return null;
    };
    
    // 导出LRC文件
    const exportLRC = () => {
        if (lyrics.length === 0) return;
        
        let lrcContent = '';
        
        // 获取并添加元数据（如果有）
        const metadata = getMetadata();
        if (metadata.length > 0) {
            metadata.forEach(meta => {
                lrcContent += meta + '\n';
            });
            lrcContent += '\n'; // 添加一个空行分隔元数据和歌词
        }
        
        // 按时间排序歌词
        const sortedLyrics = [...lyrics].filter(l => l.time !== null && l.text.trim() !== '').sort((a, b) => a.time - b.time);
        
        if (processMode === 'char') {
            // 逐字模式 - 使用<mm:ss.xx>格式标记每个字符
            sortedLyrics.forEach(lyric => {
                // 主时间标记
                let line = `[${timeHandler.formatTime(lyric.time)}]`;
                
                // 如果有字符时间标记，添加每个字符的时间标记
                if (lyric.charTimings && lyric.charTimings.length > 0) {
                    for (let i = 0; i < lyric.text.length; i++) {
                        if (i < lyric.charTimings.length) {
                            // 添加字符时间标记
                            line += `<${timeHandler.formatTime(lyric.charTimings[i].time)}>${lyric.text[i]}`;
                        } else {
                            // 没有时间标记的字符直接添加
                            line += lyric.text[i];
                        }
                    }
                } else {
                    // 没有字符时间标记，直接添加文本
                    line += lyric.text;
                }
                
                lrcContent += line + '\n';
            });
        } else if (bilingualEnabled) {
            // 双语歌词模式 - 使用双行格式（相同时间戳）
            sortedLyrics.forEach(lyric => {
                // 主歌词行
                lrcContent += `[${timeHandler.formatTime(lyric.time)}]${lyric.text}\n`;
                
                // 始终添加翻译行（使用相同时间戳），如果没有翻译则为空
                const translation = lyric.translation || "";
                lrcContent += `[${timeHandler.formatTime(lyric.time)}]${translation}\n`;
            });
        } else {
            // 普通模式
            sortedLyrics.forEach(lyric => {
                lrcContent += `[${timeHandler.formatTime(lyric.time)}]${lyric.text}\n`;
            });
        }
        
        const blob = new Blob([lrcContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lyrics.lrc';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    };
    
    // 编辑单句歌词
    const editLyric = (index) => {
        const lyric = lyrics[index];
        const isBilingual = bilingualEnabled;
        
        uiController.showPrompt({
            title: languageController.getText('editLyricTitle'),
            message: languageController.getText('editLyricMessage'),
            defaultValue: lyric.text,
            placeholder: languageController.getText('lyricContentLabel'),
            confirmText: languageController.getText('confirmText'),
            cancelText: languageController.getText('cancelText'),
            showTimeInput: true,
            defaultTime: lyric.time,
            showTranslationInput: isBilingual,
            defaultTranslation: lyric.translation || '',
            onConfirm: (result) => {
                if (result.text !== undefined) {
                    lyrics[index].text = result.text.trim();
                }
                
                if (result.time !== undefined) {
                    lyrics[index].time = result.time;
                }
                
                if (isBilingual && result.translation !== undefined) {
                    lyrics[index].translation = result.translation.trim();
                }
                
                renderLyricPreview();
                uiController.updateLyricContext();
            }
        });
    };
    
    // 上移歌词
    const moveLyricUp = (index) => {
        if (index > 0) {
            // 交换位置
            [lyrics[index], lyrics[index - 1]] = [lyrics[index - 1], lyrics[index]];
            // 如果移动的是当前歌词，更新索引
            if (currentLyricIndex === index) {
                currentLyricIndex = index - 1;
            } else if (currentLyricIndex === index - 1) {
                currentLyricIndex = index;
            }
            renderLyricPreview();
            uiController.updateLyricContext();
        }
    };
    
    // 下移歌词
    const moveLyricDown = (index) => {
        if (index < lyrics.length - 1) {
            // 交换位置
            [lyrics[index], lyrics[index + 1]] = [lyrics[index + 1], lyrics[index]];
            // 如果移动的是当前歌词，更新索引
            if (currentLyricIndex === index) {
                currentLyricIndex = index + 1;
            } else if (currentLyricIndex === index + 1) {
                currentLyricIndex = index;
            }
            renderLyricPreview();
            uiController.updateLyricContext();
        }
    };
    
    // 删除歌词
    const deleteLyric = (index) => {
        uiController.showConfirm({
            title: languageController.getText('confirmDeleteTitle'),
            message: languageController.getText('confirmDeleteMessage'),
            confirmText: languageController.getText('confirmText'),
            cancelText: languageController.getText('cancelText'),
            onConfirm: () => {
                lyrics.splice(index, 1);
                // 调整当前索引
                if (currentLyricIndex >= index) {
                    currentLyricIndex = Math.max(0, currentLyricIndex - 1);
                }
                renderLyricPreview();
                uiController.updateLyricContext();
                
                // 显示删除成功消息
                uiController.showMessage({
                    title: languageController.getText('operationSuccessTitle'),
                    message: languageController.getText('lyricDeletedMessage'),
                    type: 'success',
                    duration: 2000
                });
            }
        });
    };

    // 选中歌词
    const selectLyric = (index) => {
        if (index >= 0 && index < lyrics.length) {
            // 设置当前歌词索引
            currentLyricIndex = index;
            
            // 更新歌词上下文显示
            uiController.updateLyricContext();
            
            // 跳转到对应时间，但不影响播放状态
            const lyric = lyrics[index];
            if (lyric && lyric.time) {
                // 只更新当前界面使用的音频元素时间
                // 检查当前是编辑界面还是预览界面
                const isPreviewMode = !$('#preview-interface').hasClass('hidden');
                if (isPreviewMode) {
                    audioHandler.getPreviewAudioElement().currentTime = lyric.time;
                } else {
                    audioHandler.getAudioElement().currentTime = lyric.time;
                }
            }
            
            uiController.showMessage({
                title: languageController.getText('operationSuccessTitle'),
                message: languageController.getText('jumpToLyric').replace('{index}', index + 1),
                type: 'success',
                duration: 2000
            });
            
            // 更新歌词预览的高亮显示
            renderLyricPreview();
        }
    };
    

    
    // 绑定事件
    $('#split-lyric-btn').on('click', splitLyrics);
    $('#lrc-upload').on('change', function(e) {
        const file = e.target.files[0];
        if (file) handleLyricFile(file);
    });
    $('#set-time').on('click', markCurrentLyricTime);
    $('#prev-lyric').on('click', () => navigateLyric(-1));
    $('#next-lyric').on('click', () => navigateLyric(1));
    $('#add-blank-btn').on('click', addBlankLyric);
    $('#apply-adjustment').on('click', () => {
        const adjustment = parseFloat($('#time-adjust').val());
        applyTimeAdjustment(adjustment);
    });
    $('#next-step-btn').on('click', switchToPreviewInterface);
    $('#back-to-edit').on('click', switchToEditInterface);
    $('#export-lrc').on('click', exportLRC);
    
    // 元数据模块展开/折叠功能
    $('#toggle-metadata-btn').on('click', function() {
        const metadataContainer = $('.metadata-container');
        const metadataContent = $('#metadata-content');
        
        metadataContainer.toggleClass('active');
        metadataContent.toggleClass('hidden');
    });
    
    // 双语歌词开关
    $('#bilingual-toggle').on('change', function() {
        bilingualEnabled = this.checked;
        
        // 更新提示文本
        if (bilingualEnabled) {
            $('#lyric-textarea').attr('placeholder', languageController.getText('lyric_textarea_placeholder'));
            uiController.showMessage({
                title: languageController.getText('bilingual_enabled_title') || '双语歌词已启用',
                message: languageController.getText('bilingual_enabled_message') || '文本输入：单数行为歌词，双数行为翻译\nLRC导入：将识别"/"后的内容作为翻译',
                type: 'info',
                duration: 5000
            });
        } else {
            $('#lyric-textarea').attr('placeholder', languageController.getText('lyric_textarea_placeholder').split('\n')[0]);
        }
        
        // 如果已有歌词，重新渲染预览
        if (lyrics.length > 0) {
            renderLyricPreview();
            renderPreviewLyrics();
        }
    });

    $('#stop-btn').on('click', () => {
        // 重置两个音频时间为00:00
        audioHandler.getAudioElement().pause();
        audioHandler.getAudioElement().currentTime = 0;
        audioHandler.getPreviewAudioElement().pause();
        audioHandler.getPreviewAudioElement().currentTime = 0;
        
        if (window.jQuery) {
            $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
            $('#preview-play-pause i').removeClass('fa-pause').addClass('fa-play');
        }
        
        // 重置当前歌词定位到第一句
        if (lyrics.length > 0) {
            currentLyricIndex = 0;
            previewCurrentLyricIndex = 0;
            uiController.updateLyricContext();
            renderLyricPreview(); // 更新歌词预览的高亮显示
        }
    });
    $('#text-input-btn').on('click', function() {
        $(this).addClass('active');
        $('#lrc-upload-btn').removeClass('active');
        $('#text-input-container').removeClass('hidden');
        $('#lrc-upload-container').addClass('hidden');
    });
    $('#lrc-upload-btn').on('click', function() {
        $(this).addClass('active');
        $('#text-input-btn').removeClass('active');
        $('#lrc-upload-container').removeClass('hidden');
        $('#text-input-container').addClass('hidden');
    });
    
    return {
        getLyrics: () => lyrics,
        getCurrentLyricIndex: () => currentLyricIndex,
        getCurrentLyric: () => lyrics[currentLyricIndex] || null,
        getPreviousLyric: () => lyrics[currentLyricIndex - 1] || null,
        getNextLyric: () => lyrics[currentLyricIndex + 1] || null,
        renderLyricPreview,
        splitLyrics,
        importLRC,
        importTXT,
        handleLyricFile,
        editLyric,
        moveLyricUp,
        moveLyricDown,
        deleteLyric,
        selectLyric,
        getProcessMode,
        setProcessMode,
        markCurrentLyricTime,
        syncLyricWithAudio,
        renderPreviewLyrics,
        navigateLyric
    };
})();