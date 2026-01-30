/**
 * 音频处理模块：负责音频加载、播放控制等功能
 */
const audioHandler = (function() {
    // 获取音频元素
    const audioElement = document.getElementById('audio-player');
    const previewAudioElement = document.getElementById('preview-audio-player');
    
    // 拖拽状态变量
    let isDragging = false;
    let isPreviewDragging = false;
    
    // 全局音频控制变量
    let currentPlayingAudio = null;
    
    // 暂停页面上所有其他音频
    function pauseAllOtherAudios() {
        // 获取页面上所有音频元素
        const allAudios = document.querySelectorAll('audio');
        allAudios.forEach(audio => {
            // 排除当前模块的两个音频元素
            if (audio !== audioElement && audio !== previewAudioElement && !audio.paused) {
                audio.pause();
            }
        });
    }
    
    // 设置拖放区域
    function setupDragAndDrop() {
        const body = document.body;
        let dragCounter = 0;
        let highlightTimer = null;
        
        // 阻止浏览器默认拖放行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
            body.addEventListener(eventName, preventDefaults, false);
        });
        
        // 高亮效果 - 使用计数器解决闪烁问题
        ['dragenter', 'dragover'].forEach(function(eventName) {
            body.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(function(eventName) {
            body.addEventListener(eventName, unhighlight, false);
        });
        
        // 处理拖放文件
        body.addEventListener('drop', handleDrop, false);
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        function highlight(e) {
            dragCounter++;
            if (dragCounter > 0) {
                body.classList.add('drag-over');
                // 设置拖放提示文本
                const dropText = languageController.getText('drop_to_upload') || '释放以上传文件';
                body.setAttribute('data-drop-text', dropText);
            }
        }
        
        function unhighlight(e) {
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                body.classList.remove('drag-over');
            }
        }
        
        function handleDrop(e) {
            dragCounter = 0;
            body.classList.remove('drag-over');
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                // 处理多个文件
                let audioFiles = [];
                let lyricFiles = [];
                let subtitleFiles = [];
                
                // 分类文件
                Array.from(files).forEach(file => {
                    // 音频文件
                    if (file.type.startsWith('audio/')) {
                        audioFiles.push(file);
                    } 
                    // 字幕文件（SRT/VTT）
                    else {
                        const fileName = file.name.toLowerCase();
                        if (fileName.endsWith('.srt') || fileName.endsWith('.vtt')) {
                            subtitleFiles.push(file);
                        }
                        // 歌词文件
                        else if (fileName.endsWith('.lrc') || fileName.endsWith('.txt')) {
                            lyricFiles.push(file);
                        }
                    }
                });
                
                // 处理音频文件
                if (audioFiles.length > 0) {
                    // 默认处理第一个音频文件
                    handleAudioFile(audioFiles[0]);
                    // 如果有多个音频文件，显示提示
                    if (audioFiles.length > 1) {
                        if (typeof uiController !== 'undefined' && uiController.showMessage) {
                            uiController.showMessage({
                                title: languageController.getText('tipTitle'),
                                message: languageController.getText('audioFileDetected').replace('{count}', audioFiles.length),
                                type: 'info',
                                duration: 3000
                            });
                        }
                    }
                }
                
                // 处理字幕文件（SRT/VTT）
                if (subtitleFiles.length > 0) {
                    // 默认处理第一个字幕文件
                    if (typeof subtitleConverter !== 'undefined' && subtitleConverter.handleSubtitleFile) {
                        subtitleConverter.handleSubtitleFile(subtitleFiles[0]);
                        // 如果有多个字幕文件，显示提示
                        if (subtitleFiles.length > 1) {
                            if (typeof uiController !== 'undefined' && uiController.showMessage) {
                                uiController.showMessage({
                                    title: languageController.getText('tipTitle'),
                                    message: languageController.getText('lyricFileDetected').replace('{count}', subtitleFiles.length),
                                    type: 'info',
                                    duration: 3000
                                });
                            }
                        }
                    }
                }
                
                // 处理歌词文件
                if (lyricFiles.length > 0) {
                    // 默认处理第一个歌词文件
                    if (typeof lyricHandler !== 'undefined' && lyricHandler.handleLyricFile) {
                        lyricHandler.handleLyricFile(lyricFiles[0]);
                        // 如果有多个歌词文件，显示提示
                        if (lyricFiles.length > 1) {
                            if (typeof uiController !== 'undefined' && uiController.showMessage) {
                                uiController.showMessage({
                                title: languageController.getText('tipTitle'),
                                message: languageController.getText('lyricFileDetected').replace('{count}', lyricFiles.length),
                                type: 'info',
                                duration: 3000
                            });
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 处理音频文件
    function handleAudioFile(file) {
        // 暂停所有其他音频
        pauseAllOtherAudios();
        
        const audioUrl = URL.createObjectURL(file);
        audioElement.src = audioUrl;
        previewAudioElement.src = audioUrl;
        
        // 重置播放状态
        currentPlayingAudio = null;
        
        // 隐藏默认播放器，显示自定义播放器
        audioElement.hidden = true;
        if (window.jQuery) {
            $('#main-audio-player').removeClass('hidden');
            $('.custom-audio-player.preview').removeClass('hidden');
            // 确保播放按钮显示为播放状态
            $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
        }
        
        // 启用播放按钮
        updatePlayButtonsState(true);
        
        // 当元数据加载完成后更新总时长
        audioElement.addEventListener('loadedmetadata', function() {
            updateTotalTime();
            updatePreviewTotalTime();
        });
        
        previewAudioElement.addEventListener('loadedmetadata', function() {
            updatePreviewTotalTime();
        });
    }
    
    // 更新播放按钮的禁用/启用状态
    function updatePlayButtonsState(enabled) {
        const playPauseBtn = document.querySelector('#play-pause');
        const previewPlayPause = document.querySelector('#preview-play-pause');
        
        if (playPauseBtn) {
            playPauseBtn.disabled = !enabled;
            playPauseBtn.style.opacity = enabled ? '1' : '0.5';
            playPauseBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
        
        if (previewPlayPause) {
            previewPlayPause.disabled = !enabled;
            previewPlayPause.style.opacity = enabled ? '1' : '0.5';
            previewPlayPause.style.cursor = enabled ? 'pointer' : 'not-allowed';
        }
    }
    
    // 检查是否有音频加载
    function hasAudio() {
        return !!(audioElement.src && audioElement.src !== window.location.href);
    }
    
    // 音频上传处理
    if (window.jQuery) {
        $('#audio-upload').on('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleAudioFile(file);
            }
        });
    }
    
    // 更新总时长显示
    function updateTotalTime() {
        if (!isNaN(audioElement.duration) && window.jQuery && typeof timeHandler !== 'undefined' && timeHandler.formatTime) {
            $('.total-time').text(timeHandler.formatTime(audioElement.duration));
        }
    }
    
    // 更新预览界面总时长显示
    function updatePreviewTotalTime() {
        if (!isNaN(previewAudioElement.duration) && window.jQuery && typeof timeHandler !== 'undefined' && timeHandler.formatTime) {
            $('.preview-total-time').text(timeHandler.formatTime(previewAudioElement.duration));
        }
    }
    
    // 更新当前时间显示
    function updateCurrentTime() {
        if (window.jQuery && typeof timeHandler !== 'undefined' && timeHandler.formatTime) {
            $('.current-time').text(timeHandler.formatTime(audioElement.currentTime));
        }
    }
    
    // 更新预览界面当前时间显示
    function updatePreviewCurrentTime() {
        if (window.jQuery && typeof timeHandler !== 'undefined' && timeHandler.formatTime) {
            $('.preview-current-time').text(timeHandler.formatTime(previewAudioElement.currentTime));
        }
    }
    
    // 更新主播放器进度条
    function updateProgressBar() {
        if (isNaN(audioElement.duration) || !window.jQuery) return;
        
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        $('.custom-audio-player .progress-fill').width(progress + '%');
        $('.custom-audio-player .progress-handle').css('left', progress + '%');
    }
    
    // 更新预览播放器进度条
    function updatePreviewProgressBar() {
        if (isNaN(previewAudioElement.duration) || !window.jQuery) return;
        
        const progress = (previewAudioElement.currentTime / previewAudioElement.duration) * 100;
        $('.custom-audio-player.preview .progress-fill').width(progress + '%');
        $('.custom-audio-player.preview .progress-handle').css('left', progress + '%');
    }
    
    // 处理进度条点击（主音频）
    function handleProgressClick(e) {
        if (!window.jQuery) return;
        
        const rect = $(e.currentTarget).find('.progress-track')[0].getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        
        audioElement.currentTime = pos * audioElement.duration;
        
        updateProgressBar();
        updateCurrentTime();
    }
    
    // 处理预览进度条点击（预览音频）
    function handlePreviewProgressClick(e) {
        if (!window.jQuery) return;
        
        const rect = $(e.currentTarget).find('.progress-track')[0].getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        
        previewAudioElement.currentTime = pos * previewAudioElement.duration;
        
        updatePreviewProgressBar();
        updatePreviewCurrentTime();
    }
    
    // 开始拖拽主进度条
    function startDrag(e) {
        if (!window.jQuery) return;
        
        e.preventDefault();
        isDragging = true;
        
        // 添加全局事件监听
        $(document).on('mousemove', handleDrag);
        $(document).on('mouseup', stopDrag);
    }
    
    // 拖拽主进度条
    function handleDrag(e) {
        if (!isDragging || !window.jQuery) return;
        
        const rect = $('.custom-audio-player .progress-track')[0].getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos)); // 限制在0-1范围内
        
        // 更新进度条显示
        $('.custom-audio-player .progress-fill').width(pos * 100 + '%');
        $('.custom-audio-player .progress-handle').css('left', pos * 100 + '%');
        
        // 更新当前时间显示
        const seekTime = pos * audioElement.duration;
        if (typeof timeHandler !== 'undefined' && timeHandler.formatTime) {
            $('.current-time').text(timeHandler.formatTime(seekTime));
        }
    }
    
    // 停止拖拽主进度条
    function stopDrag() {
        if (!isDragging || !window.jQuery) return;
        
        isDragging = false;
        
        // 移除全局事件监听
        $(document).off('mousemove', handleDrag);
        $(document).off('mouseup', stopDrag);
        
        // 设置最终的播放位置
        const width = $('.custom-audio-player .progress-track').width();
        const handlePos = parseFloat($('.custom-audio-player .progress-handle').css('left')) / 100 * width;
        const pos = handlePos / width;
        const seekTime = pos * audioElement.duration;
        
        audioElement.currentTime = seekTime;
    }
    
    // 开始拖拽预览进度条
    function startPreviewDrag(e) {
        if (!window.jQuery) return;
        
        e.preventDefault();
        isPreviewDragging = true;
        
        // 添加全局事件监听
        $(document).on('mousemove', handlePreviewDrag);
        $(document).on('mouseup', stopPreviewDrag);
    }
    
    // 拖拽预览进度条
    function handlePreviewDrag(e) {
        if (!isPreviewDragging || !window.jQuery) return;
        
        const rect = $('.custom-audio-player.preview .progress-track')[0].getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos)); // 限制在0-1范围内
        
        // 更新进度条显示
        $('.custom-audio-player.preview .progress-fill').width(pos * 100 + '%');
        $('.custom-audio-player.preview .progress-handle').css('left', pos * 100 + '%');
        
        // 更新当前时间显示
        const seekTime = pos * previewAudioElement.duration;
        if (typeof timeHandler !== 'undefined' && timeHandler.formatTime) {
            $('.preview-current-time').text(timeHandler.formatTime(seekTime));
        }
    }
    
    // 停止拖拽预览进度条
    function stopPreviewDrag() {
        if (!isPreviewDragging || !window.jQuery) return;
        
        isPreviewDragging = false;
        
        // 移除全局事件监听
        $(document).off('mousemove', handlePreviewDrag);
        $(document).off('mouseup', stopPreviewDrag);
        
        // 设置最终的播放位置
        const width = $('.custom-audio-player.preview .progress-track').width();
        const handlePos = parseFloat($('.custom-audio-player.preview .progress-handle').css('left')) / 100 * width;
        const pos = handlePos / width;
        const seekTime = pos * previewAudioElement.duration;
        
        previewAudioElement.currentTime = seekTime;
        
        // 更新预览播放器的显示
        updatePreviewProgressBar();
        updatePreviewCurrentTime();
    }
    
    // 播放/暂停控制（主音频）
    function togglePlayPause() {
        if (audioElement.paused) {
            // 暂停所有其他音频
            pauseAllOtherAudios();
            
            // 只播放主音频元素
            audioElement.play();
            
            // 更新播放状态
            currentPlayingAudio = audioElement;
            
            if (window.jQuery) {
                $('#play-pause i').removeClass('fa-play').addClass('fa-pause');
            }
        } else {
            audioElement.pause();
            currentPlayingAudio = null;
            
            if (window.jQuery) {
                $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
            }
        }
    }
    
    // 播放/暂停控制（预览音频）
    function togglePreviewPlayPause() {
        if (previewAudioElement.paused) {
            // 暂停所有其他音频
            pauseAllOtherAudios();
            
            // 只播放预览音频元素
            previewAudioElement.play();
            
            // 更新播放状态
            currentPlayingAudio = previewAudioElement;
            
            if (window.jQuery) {
                $('#preview-play-pause i').removeClass('fa-play').addClass('fa-pause');
            }
        } else {
            previewAudioElement.pause();
            currentPlayingAudio = null;
            
            if (window.jQuery) {
                $('#preview-play-pause i').removeClass('fa-pause').addClass('fa-play');
            }
        }
    }
    
    // 时间调整（主音频前进/后退2秒）
    function adjustTime(seconds) {
        audioElement.currentTime = Math.max(0, Math.min(audioElement.duration || 0, audioElement.currentTime + seconds));
        
        // 更新进度条和时间显示
        updateProgressBar();
        updateCurrentTime();
    }
    
    // 时间调整（预览音频前进/后退2秒）
    function adjustPreviewTime(seconds) {
        previewAudioElement.currentTime = Math.max(0, Math.min(previewAudioElement.duration || 0, previewAudioElement.currentTime + seconds));
        
        // 更新进度条和时间显示
        updatePreviewProgressBar();
        updatePreviewCurrentTime();
    }
    
    // 初始化拖放功能
    setupDragAndDrop();
    
    // 添加全局音频事件监听，确保只有一个音频在播放
    document.addEventListener('play', function(e) {
        // 如果播放的不是当前模块的音频元素，且当前模块有音频在播放
        if ((e.target !== audioElement && e.target !== previewAudioElement) && 
            (audioElement !== null && !audioElement.paused)) {
            // 暂停当前模块的音频
            audioElement.pause();
            previewAudioElement.pause();
            currentPlayingAudio = null;
            
            if (window.jQuery) {
                $('#play-pause i').removeClass('fa-pause').addClass('fa-play');
                $('#preview-play-pause i').removeClass('fa-pause').addClass('fa-play');
            }
        }
    }, true); // 使用捕获阶段，确保能捕获所有音频播放事件
    
    // 初始化进度条事件监听器
    if (window.jQuery) {
        $('.custom-audio-player .audio-progress-bar').on('click', handleProgressClick);
        $('.custom-audio-player.preview .audio-progress-bar').on('click', handlePreviewProgressClick);
        $('.custom-audio-player .progress-handle').on('mousedown', startDrag);
        $('.custom-audio-player.preview .progress-handle').on('mousedown', startPreviewDrag);
        
        // 隐藏自定义播放器（初始状态）
        $('#main-audio-player').addClass('hidden');
        $('.custom-audio-player.preview').addClass('hidden');
        
        // 绑定播放/暂停按钮事件
        $('#play-pause').on('click', togglePlayPause);
        
        // 绑定时间调整按钮事件
        $('#prev-5s').on('click', function() { adjustTime(-2); });
        $('#next-5s').on('click', function() { adjustTime(2); });
        
        // 绑定预览界面时间调整按钮事件
        $('#preview-prev-2s').on('click', function() { adjustPreviewTime(-2); });
        $('#preview-next-2s').on('click', function() { adjustPreviewTime(2); });
        $('#preview-play-pause').on('click', togglePreviewPlayPause);
    }
    
    // 实时更新当前时间和进度条显示
    audioElement.addEventListener('timeupdate', function() {
        if (!isDragging && !isPreviewDragging) {
            updateCurrentTime();
            updateProgressBar();
        }
    });
    
    // 音频播放完毕时重置播放状态
    audioElement.addEventListener('ended', function() {
        const playPauseBtn = document.querySelector('#play-pause');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = `<i class="fas fa-play"></i> ${languageController.getText('play_pause')}`;
        }
    });
    
    // 实时更新预览界面当前时间和进度条显示
    previewAudioElement.addEventListener('timeupdate', function() {
        if (!isDragging && !isPreviewDragging) {
            updatePreviewCurrentTime();
            updatePreviewProgressBar();
        }
    });
    
    // 预览音频播放完毕时重置播放状态
    previewAudioElement.addEventListener('ended', function() {
        const previewPlayPause = document.querySelector('#preview-play-pause');
        if (previewPlayPause) {
            previewPlayPause.innerHTML = `<i class="fas fa-play"></i> ${languageController.getText('play_pause')}`;
        }
    });
    
    // 移除预览音频的自动同步逻辑，让两个音频独立运行
    
    return {
        getAudioElement: function() { return audioElement; },
        getPreviewAudioElement: function() { return previewAudioElement; },
        togglePlayPause: togglePlayPause,
        togglePreviewPlayPause: togglePreviewPlayPause,
        adjustTime: adjustTime,
        adjustPreviewTime: adjustPreviewTime,
        getCurrentTime: function() { return audioElement.currentTime; },
        getPreviewCurrentTime: function() { return previewAudioElement.currentTime; },
        setCurrentTime: function(time) {
            audioElement.currentTime = time;
        },
        setPreviewCurrentTime: function(time) {
            previewAudioElement.currentTime = time;
        },
        updatePlayButtonsState: updatePlayButtonsState,
        hasAudio: hasAudio,
        // 用于全局快捷键的方法
        togglePlay: function() {
            // 根据当前页面状态决定切换主音频还是预览音频
            if (window.isPreviewMode) {
                togglePreviewPlayPause();
            } else {
                togglePlayPause();
            }
        },
        seekRelative: function(seconds) {
            // 根据当前页面状态决定调整主音频还是预览音频的时间
            if (window.isPreviewMode) {
                adjustPreviewTime(seconds);
            } else {
                adjustTime(seconds);
            }
        },
        handleAudioFile: handleAudioFile
    };
})();