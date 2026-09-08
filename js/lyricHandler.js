const lyricHandler = (() => {
  let resizeFrameId = null;

  const autoResizeTextarea = () => {
    if (resizeFrameId) {
      cancelAnimationFrame(resizeFrameId);
    }

    resizeFrameId = requestAnimationFrame(() => {
      const textarea = document.getElementById("lyric-textarea");
      if (!textarea) return;

      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = window.innerWidth >= 768 ? 675 : 500;
      const newHeight = Math.min(scrollHeight, maxHeight);

      textarea.style.height = newHeight + "px";

      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.overflowY = "hidden";
      }

      resizeFrameId = null;
    });
  };

  const importTXT = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      $("#lyric-textarea").val(content);
      autoResizeTextarea();
      $("#text-input-btn").click();
    };
    reader.readAsText(file);
  };

  const handleLyricFile = (file) => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".lrc")) {
      importLRC(file);
    } else if (fileName.endsWith(".txt")) {
      importTXT(file);
    }
  };

  // 识别并格式化时间码和元数据
  const recognizeTimeCodes = (content) => {
    let result = content;

    // 识别时间码 [mm:ss.xx] 或 [mm:ss]
    const timePattern = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/g;
    const timedLyrics = [];
    let match;

    const lines = content.split("\n");
    lines.forEach((line) => {
      const timeMatches = [...line.matchAll(timePattern)];
      if (timeMatches.length > 0) {
        timeMatches.forEach((tm) => {
          const minutes = parseInt(tm[1]);
          const seconds = parseInt(tm[2]);
          const milliseconds = tm[3]
            ? parseInt(tm[3].padEnd(2, "0").substring(0, 2))
            : 0;
          const time = minutes * 60 + seconds + milliseconds / 100;

          const timeEndIndex = tm.index + tm[0].length;
          const text = line.substring(timeEndIndex).trim();

          if (text) {
            timedLyrics.push({ time, text });
          }
        });
      }
    });

    result = result.replace(timePattern, (match, min, sec, ms) => {
      const minutes = parseInt(min);
      const seconds = parseInt(sec);
      const milliseconds = ms ? parseInt(ms.padEnd(2, "0").substring(0, 2)) : 0;
      return `[${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}]`;
    });

    return { formatted: result, timedLyrics };
  };

  let lyrics = [];
  let originalLyricsTimeBeforeFix = [];
  let bilingualEnabled = false;
  let currentLyricIndex = -1;
  let previewCurrentLyricIndex = -1;
  let processMode = "line";
  let currentCharIndex = 0;
  let autoSkipSpace = false;
  let wordMode = false;
  const markSettings = {
    bindTimeOnBack: false,
    bufferTime: 0,
    swapArrowKeys: false,
    backDelay: 200,
  };

  let _seekTimer = null;
  const _doSeek = (targetTime) => {
    if (targetTime === null) return;
    if (typeof audioHandler === "undefined") return;
    const seekTo = Math.max(0, targetTime - markSettings.bufferTime);
    const delay = Math.max(0, markSettings.backDelay || 0);
    if (_seekTimer) clearTimeout(_seekTimer);
    _seekTimer = setTimeout(() => {
      if (typeof audioHandler.setCurrentTime === "function") {
        audioHandler.setCurrentTime(seekTo);
      }
      _seekTimer = null;
    }, delay);
  };
  let _previewSortedLyrics = null;

  const importTimedLyrics = (timedLyrics) => {
    if (!Array.isArray(timedLyrics) || timedLyrics.length === 0) {
      uiController.showMessage({
        title: languageController.getText("tipTitle"),
        message: "没有有效的歌词数据",
        type: "error",
        duration: 3000,
      });
      return;
    }

    lyrics = timedLyrics.map((item) => ({
      text: item.text,
      time: item.time !== undefined ? item.time : null,
    }));

    currentLyricIndex = 0;
    currentCharIndex = 0;

    renderLyricPreview();
    uiController.updateLyricContext();
  };

  const splitLyrics = () => {
    const text = $("#lyric-textarea").val().trim();
    if (!text) {
      uiController.showMessage({
        title: "提示",
        message: "请输入歌词内容",
        type: "error",
        duration: 3000,
      });
      return;
    }

    // 检查是否开启了"允许识别时间"开关
    const recognizeTimeEnabled = document.getElementById(
      "recognize-time-toggle",
    )?.checked;

    const allLines = text.split("\n");

    lyrics = [];

    const timePattern = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?\]/g;

    if (recognizeTimeEnabled) {
      allLines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const timeMatches = [...trimmedLine.matchAll(timePattern)];
        if (timeMatches.length > 0) {
          timeMatches.forEach((tm) => {
            const minutes = parseInt(tm[1]);
            const seconds = parseInt(tm[2]);
            const milliseconds = tm[3]
              ? parseInt(tm[3].padEnd(2, "0").substring(0, 2))
              : 0;
            const time = minutes * 60 + seconds + milliseconds / 100;

            const timeEndIndex = tm.index + tm[0].length;
            const lyricText = trimmedLine.substring(timeEndIndex).trim();

            if (lyricText) {
              lyrics.push({
                text: lyricText,
                time: time,
              });
            }
          });
        } else {
          lyrics.push({
            text: trimmedLine,
            time: null,
          });
        }
      });
    } else if (bilingualEnabled) {
      for (let i = 0; i < allLines.length; i += 2) {
        const mainLyric = allLines[i].trim();
        const translation =
          i + 1 < allLines.length ? allLines[i + 1].trim() : "";

        if (mainLyric) {
          lyrics.push({
            text: mainLyric,
            time: null,
            translation: translation,
          });
        }
      }
    } else {
      const lines = text
        .split(/[\n,，。；]+/)
        .filter((line) => line.trim() !== "");
      lyrics = lines.map((text) => ({ text, time: null }));
    }

    if (lyrics.length === 0) {
      uiController.showMessage({
        title: "提示",
        message: "未检测到有效歌词内容",
        type: "error",
        duration: 3000,
      });
      return;
    }

    currentLyricIndex = 0;

    renderLyricPreview();
    uiController.updateLyricContext();
  };

  const getParsingMode = () => {
    const mode = $('input[name="parsing-mode"]:checked').val();
    return mode || "default"; 
  };

  const importLRC = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lrcLines = content.split("\n");
      lyrics = [];

      const lrcRegex = /\[(\d+):(\d+)[:.](\d{2})\](.*)/;

      const bilingualRegex = /(.+)\s*[\|／\/]\s*(.+)/;

      const charTimeRegex = /<(\d+):(\d+)\.(\d{2})>([^<]*)/g;

      const parsedLines = [];

      let hasCharTimings = false;

      lrcLines.forEach((line) => {
        const metaInfo = parseLRCMetadata(line);

        if (metaInfo) {
          $(`#meta-${metaInfo.tag}`).val(metaInfo.value);
        } else {
          const match = line.match(lrcRegex);

          if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const hundredths = parseInt(match[3]);
            const time = minutes * 60 + seconds + hundredths / 100;
            const text = match[4].trim();

            if (text) {
              if (text.includes("<") && text.includes(">")) {
                let charText = text;
                let charMatch;
                let charTimings = [];
                let lastIndex = 0;
                let plainText = "";

                charTimeRegex.lastIndex = 0;

                while ((charMatch = charTimeRegex.exec(text)) !== null) {
                  const charMinutes = parseInt(charMatch[1]);
                  const charSeconds = parseInt(charMatch[2]);
                  const charHundredths = parseInt(charMatch[3]);
                  const charTime =
                    charMinutes * 60 + charSeconds + charHundredths / 100;
                  const char = charMatch[4];

                  charTimings.push({
                    char: char,
                    time: charTime,
                  });

                  plainText += char;
                  hasCharTimings = true;
                }

                if (hasCharTimings) {
                  const normalized = [];
                  for (const entry of charTimings) {
                    if (entry.char.length <= 1) {
                      normalized.push({ char: entry.char, time: entry.time });
                    } else {
                      for (let i = 0; i < entry.char.length; i++) {
                        normalized.push({
                          char: entry.char[i],
                          time: i === 0 ? entry.time : null,
                        });
                      }
                    }
                  }

                  while (normalized.length < plainText.length) {
                    normalized.push({ char: plainText[normalized.length], time: null });
                  }
                  normalized.length = plainText.length;

                  parsedLines.push({
                    text: plainText,
                    time: time,
                    charTimings: normalized,
                  });
                } else {
                  parsedLines.push({ text, time });
                }
              } else {
                parsedLines.push({ text, time });
              }
            }
          } else if (line.trim()) {
            parsedLines.push({ text: line.trim(), time: null });
          }
        }
      });

      if (hasCharTimings) {
        processMode = "char";
        bilingualEnabled = false;
        lyrics = parsedLines;
      } else {
        if (bilingualEnabled) {
          for (let i = 0; i < parsedLines.length; i++) {
            const currentLine = parsedLines[i];

            const bilingualMatch = currentLine.text.match(bilingualRegex);

            if (bilingualMatch) {
              const mainLyric = bilingualMatch[1].trim();
              const translation = bilingualMatch[2].trim();
              lyrics.push({
                text: mainLyric,
                time: currentLine.time,
                translation,
              });
            } else if (
              i < parsedLines.length - 1 &&
              currentLine.time !== null &&
              parsedLines[i + 1].time !== null &&
              currentLine.time === parsedLines[i + 1].time
            ) {
              const mainLyric = currentLine.text;
              const translation = parsedLines[i + 1].text;
              lyrics.push({
                text: mainLyric,
                time: currentLine.time,
                translation,
              });
              i++;
            } else {
              lyrics.push({
                text: currentLine.text,
                time: currentLine.time,
                translation: "",
              });
            }
          }
        } else {
          lyrics = parsedLines;
        }
      }

      const parsingMode = getParsingMode();
      if (parsingMode === "strict") {
        lyrics.sort((a, b) => {
          if (a.time === null && b.time === null) return 0;
          if (a.time === null) return 1;
          if (b.time === null) return -1;
          return a.time - b.time;
        });
      } else {
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

  $(window).on(
    "resize",
    _.debounce(() => {
      if (lyrics.length > 0) {
        renderLyricPreview();
      }
    }, 250),
  );

  const renderLyricPreview = (disableScroll = false) => {
    // 同步"重置"按钮禁用状态：无歌词时禁用
    const $stopBtn = $("#stop-btn");
    if ($stopBtn.length) $stopBtn.prop("disabled", lyrics.length === 0);

    const $preview = $("#lyric-preview");
    $preview.empty();

    if (lyrics.length === 0) {
      $preview.html(
        '<div class="placeholder-text">请输入歌词并分割，或导入LRC文件</div>',
      );
      return;
    }

    const isMobile = window.innerWidth <= 768;

    lyrics.forEach((lyric, index) => {
      const $line = $('<div class="lyric-line"></div>');
      $line.addClass(index === currentLyricIndex ? "current" : "");

      let timeText = "未标记";
      if (lyric.time !== null) {
        timeText = timeHandler.formatTime(lyric.time);
      }

      if (isMobile) {
        $line.html(`
                    <span class="lyric-number"><strong>${(index + 1).toString().padStart(2, "0")}</strong></span>
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
        $line.html(`
                    <span class="lyric-number"><strong>${(index + 1).toString().padStart(2, "0")}</strong></span>
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

    if (!disableScroll && currentLyricIndex >= 0) {
      const $currentLine = $preview.find(".lyric-line").eq(currentLyricIndex);
      if ($currentLine.length) {
        const container = document.getElementById("lyric-preview");
        if (container) {
          // 计算容器内的滚动位置，避免视口滚动
          const containerTop = container.getBoundingClientRect().top;
          const lineTop = $currentLine[0].getBoundingClientRect().top;
          const lineHeight = $currentLine[0].offsetHeight;
          const containerHeight = container.offsetHeight;

          const scrollOffset =
            container.scrollTop +
            (lineTop - containerTop) -
            containerHeight / 2 +
            lineHeight / 2;

          container.scrollTo({
            top: scrollOffset,
            behavior: "smooth",
          });
        }
      }
    }
  };

  const _isEnglishLetter = (ch) =>
    typeof ch === "string" && /[A-Za-z]/.test(ch);
  const _findNextMarkIndex = (text, fromIndex) => {
    const effectiveSkipSpace = autoSkipSpace || wordMode;
    let i = fromIndex;

    if (wordMode) {
      while (i < text.length && _isEnglishLetter(text[i])) i++;
      while (i < text.length && !_isEnglishLetter(text[i])) i++;
      return i;
    }

    // autoSkipSpace: 跳过所有空白字符
    if (effectiveSkipSpace) {
      while (i < text.length && /\s/.test(text[i])) i++;
    }

    return i;
  };

  const _findPrevMarkIndex = (text, fromIndex) => {
    const effectiveSkipSpace = autoSkipSpace || wordMode;
    let i = fromIndex;

    if (wordMode) {
      while (i > 0 && _isEnglishLetter(text[i - 1])) i--;
      while (i > 0 && !_isEnglishLetter(text[i - 1])) i--;
      while (i > 0 && _isEnglishLetter(text[i - 1])) i--;
      return i;
    }

    if (effectiveSkipSpace) {
      while (i > 0 && /\s/.test(text[i - 1])) i--;
    }

    return i;
  };

  const _findPrevLineResumeIndex = (lyric) => {
    const text = lyric.text;
    const cts = lyric.charTimings || [];

    let lastMark = -1;
    for (let i = cts.length - 1; i >= 0; i--) {
      if (cts[i] && cts[i].time !== null) {
        lastMark = i;
        break;
      }
    }

    if (lastMark === -1) {
      return _findNextMarkIndex(text, 0);
    }

    if (wordMode) {
      let wordStart = lastMark;
      while (wordStart > 0 && _isEnglishLetter(text[wordStart - 1])) {
        wordStart--;
      }
      let wordEnd = wordStart;
      while (wordEnd < text.length && _isEnglishLetter(text[wordEnd])) {
        wordEnd++;
      }
      return wordEnd;
    }

    return _findNextMarkIndex(text, lastMark + 1);
  };
  const markCurrentLyricTime = () => {
    if (currentLyricIndex < 0 || currentLyricIndex >= lyrics.length) return;

    const currentTime = audioHandler.getCurrentTime();
    if (typeof currentTime !== "number" || isNaN(currentTime) || currentTime < 0) return;

    if (processMode === "line") {
      lyrics[currentLyricIndex].time = currentTime;

      if (currentLyricIndex < lyrics.length - 1) {
        currentLyricIndex++;
        uiController.updateLyricContext();
      }
    } else if (processMode === "char") {
      const currentLyric = lyrics[currentLyricIndex];
      const text = currentLyric.text;

      if (!currentLyric.charTimings) {
        currentLyric.charTimings = [];
      }

      if (currentCharIndex < text.length) {
        const entry = {
          char: text[currentCharIndex],
          time: currentTime,
        };

        while (currentCharIndex > currentLyric.charTimings.length) {
          const padIdx = currentLyric.charTimings.length;
          currentLyric.charTimings.push({ char: text[padIdx], time: null });
        }

        if (currentCharIndex < currentLyric.charTimings.length) {
          currentLyric.charTimings[currentCharIndex] = entry;
        } else {
          currentLyric.charTimings.push(entry);
        }

        if (wordMode) {
          let j = currentCharIndex + 1;
          while (j < text.length && _isEnglishLetter(text[j])) {
            while (currentLyric.charTimings.length <= j) {
              const padIdx = currentLyric.charTimings.length;
              currentLyric.charTimings.push({
                char: text[padIdx],
                time: null,
              });
            }
            currentLyric.charTimings[j] = {
              char: text[j],
              time: currentTime,
            };
            j++;
          }
        }

        const firstMarked = currentLyric.charTimings.find(ct => ct && ct.time !== null);
        currentLyric.time = firstMarked ? firstMarked.time : null;

        uiController.updateLyricContext();


        const nextIdx = _findNextMarkIndex(text, currentCharIndex + 1);
        currentCharIndex = nextIdx;

        if (currentCharIndex >= text.length) {
          if (currentLyricIndex < lyrics.length - 1) {
            currentCharIndex = 0;
            currentLyricIndex++;
            uiController.updateLyricContext();
          } else {
            currentCharIndex = text.length;
          }
        }
      }
    }

    renderLyricPreview();
  };

  // 自动跳过空格
  const getAutoSkipSpace = () => autoSkipSpace;
  const setAutoSkipSpace = (v) => {
    autoSkipSpace = !!v;
    if (wordMode) autoSkipSpace = true;
  };

  const getWordMode = () => wordMode;
  const setWordMode = (v) => {
    wordMode = !!v;
    if (wordMode) autoSkipSpace = true;
  };

  const getMarkSettings = () => ({ ...markSettings });
  const setMarkSettings = (opts) => {
    if (opts && typeof opts === "object") {
      if (typeof opts.bindTimeOnBack === "boolean") {
        markSettings.bindTimeOnBack = opts.bindTimeOnBack;
      }
      if (typeof opts.bufferTime === "number") {
        markSettings.bufferTime = Math.max(0, opts.bufferTime);
      }
      if (typeof opts.swapArrowKeys === "boolean") {
        markSettings.swapArrowKeys = opts.swapArrowKeys;
      }
      if (typeof opts.backDelay === "number" && opts.backDelay >= 0) {
        markSettings.backDelay = Math.max(0, Math.floor(opts.backDelay));
      }
      try {
        localStorage.setItem(
          "easyLRC_markSettings",
          JSON.stringify(markSettings),
        );
      } catch (_) {}
    }
  };

  // 初始化：从 localStorage 读取
  try {
    const saved = localStorage.getItem("easyLRC_markSettings");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.bindTimeOnBack === "boolean") {
          markSettings.bindTimeOnBack = parsed.bindTimeOnBack;
        }
        if (typeof parsed.bufferTime === "number" && parsed.bufferTime >= 0) {
          markSettings.bufferTime = parsed.bufferTime;
        }
        if (typeof parsed.swapArrowKeys === "boolean") {
          markSettings.swapArrowKeys = parsed.swapArrowKeys;
        }
        if (typeof parsed.backDelay === "number" && parsed.backDelay >= 0) {
          markSettings.backDelay = Math.max(0, Math.floor(parsed.backDelay));
        }
      }
    }
  } catch (_) {}

  const getProcessMode = () => processMode;

  const setProcessMode = (mode) => {
    if (mode === "line" || mode === "char") {
      processMode = mode;
      currentCharIndex = 0;

      // 切到逐行模式时强制关闭单词/空格选项（语义上逐行不需要）
      if (mode === "line") {
        wordMode = false;
        autoSkipSpace = false;
      }

      if (mode === "char") {
        autoSkipSpace = true;
        lyrics.forEach((lyric) => {
          const textLen = lyric.text.length;
          if (!lyric.charTimings) lyric.charTimings = [];
          while (lyric.charTimings.length < textLen) {
            const padIdx = lyric.charTimings.length;
            lyric.charTimings.push({ char: lyric.text[padIdx], time: null });
          }
          if (lyric.charTimings.length > textLen) {
            lyric.charTimings.length = textLen;
          }
        });

        if (bilingualEnabled) {
          $("#bilingual-toggle").prop("checked", false).trigger("change");
        }
      }

      return true;
    }
    return false;
  };

  const navigateLyric = (direction) => {
    if (lyrics.length === 0) return;

    const _calcSeekTargetBeforeBack = () => {
      if (!markSettings.bindTimeOnBack) return null;

      if (processMode === "char" && lyrics[currentLyricIndex]) {
        const cl = lyrics[currentLyricIndex];
        if (cl.charTimings) {
          for (let i = currentCharIndex - 1; i >= 0; i--) {
            const ct = cl.charTimings[i];
            if (ct && ct.time !== null) return ct.time;
          }
        }
      }

      if (currentLyricIndex > 0) {
        const prev = lyrics[currentLyricIndex - 1];
        if (prev) {
          if (prev.charTimings) {
            for (let i = prev.charTimings.length - 1; i >= 0; i--) {
              const ct = prev.charTimings[i];
              if (ct && ct.time !== null) return ct.time;
            }
          }
          if (prev.time !== null) return prev.time;
        }
      }

      return null;
    };

    // 逐字模式下的逐字进退语义
    if (processMode === "char") {
      const currentLyric = lyrics[currentLyricIndex];

      if (currentLyric) {
        const textLen = currentLyric.text.length;
        if (!currentLyric.charTimings) currentLyric.charTimings = [];
        // 补齐 / 截断，保持与 text 长度一致
        while (currentLyric.charTimings.length < textLen) {
          const padIdx = currentLyric.charTimings.length;
          currentLyric.charTimings.push({ char: currentLyric.text[padIdx], time: null });
        }
        if (currentLyric.charTimings.length > textLen) {
          currentLyric.charTimings.length = textLen;
        }
      }

      if (direction === -1) {
        const seekTarget = _calcSeekTargetBeforeBack();

        if (currentCharIndex > 0 && currentLyric) {
          const text = currentLyric.text;

          if (wordMode) {
            let i = currentCharIndex - 1;
            while (i > 0 && !_isEnglishLetter(text[i])) {
              i--;
            }
            while (i > 0 && _isEnglishLetter(text[i - 1])) {
              i--;
            }
            let j = i;
            while (j < text.length && _isEnglishLetter(text[j])) {
              if (currentLyric.charTimings[j]) {
                currentLyric.charTimings[j].time = null;
              }
              j++;
            }
            currentCharIndex = i;
          } else {
            const targetIdx = currentCharIndex - 1;
            if (
              currentLyric.charTimings[targetIdx] &&
              currentLyric.charTimings[targetIdx].time !== null
            ) {
              currentLyric.charTimings[targetIdx].time = null;
            }
            currentCharIndex = _findPrevMarkIndex(text, currentCharIndex - 1);
          }

          const firstMarked = currentLyric.charTimings.find(ct => ct.time !== null);
          currentLyric.time = firstMarked ? firstMarked.time : null;

          uiController.updateLyricContext();

          renderLyricPreview();
          _doSeek(seekTarget);
          return;
        }

        if (currentLyric && currentLyric.charTimings.length > 0) {
          if (wordMode && _isEnglishLetter(currentLyric.text[0])) {
            let wordEnd = 0;
            while (wordEnd < currentLyric.text.length && _isEnglishLetter(currentLyric.text[wordEnd])) {
              if (currentLyric.charTimings[wordEnd]) {
                currentLyric.charTimings[wordEnd].time = null;
              }
              wordEnd++;
            }
          } else {
            const firstEntry = currentLyric.charTimings[0];
            if (firstEntry.time !== null) {
              firstEntry.time = null;
            }
          }
          const firstMarked = currentLyric.charTimings.find(ct => ct.time !== null);
          currentLyric.time = firstMarked ? firstMarked.time : null;

          const hasAnyMark = currentLyric.charTimings.some(ct => ct.time !== null);
          if (!hasAnyMark && currentLyricIndex > 0) {
            currentLyricIndex--;
            const prevLyric = lyrics[currentLyricIndex];
            if (prevLyric) {
              const prevLen = prevLyric.text.length;
              if (!prevLyric.charTimings) prevLyric.charTimings = [];
              while (prevLyric.charTimings.length < prevLen) {
                const pIdx = prevLyric.charTimings.length;
                prevLyric.charTimings.push({ char: prevLyric.text[pIdx], time: null });
              }
              currentCharIndex = _findPrevLineResumeIndex(prevLyric);
            } else {
              currentCharIndex = 0;
            }
          }
          uiController.updateLyricContext();

          renderLyricPreview();
          _doSeek(seekTarget);
          return;
        }

        return;
      }

      if (direction === 1) {
        if (currentLyric && currentCharIndex < currentLyric.text.length) {
          const text = currentLyric.text;
          currentCharIndex = _findNextMarkIndex(text, currentCharIndex + 1);
          uiController.updateLyricContext();

          renderLyricPreview();
          return;
        }

        // 已到当前行末尾，进下一行
        if (currentLyricIndex < lyrics.length - 1) {
          currentLyricIndex++;
          const nextLyric = lyrics[currentLyricIndex];
          if (nextLyric) {
            const nextLen = nextLyric.text.length;
            if (!nextLyric.charTimings) nextLyric.charTimings = [];
            while (nextLyric.charTimings.length < nextLen) {
              const nIdx = nextLyric.charTimings.length;
              nextLyric.charTimings.push({ char: nextLyric.text[nIdx], time: null });
            }
            nextLyric.charTimings.length = nextLen;

            currentCharIndex = _findNextMarkIndex(nextLyric.text, 0);
          } else {
            currentCharIndex = 0;
          }
          uiController.updateLyricContext();

          renderLyricPreview();
          return;
        }

        return;
      }
    }

    const newIndex = currentLyricIndex + direction;
    if (newIndex >= 0 && newIndex < lyrics.length) {
      if (direction === -1 && markSettings.bindTimeOnBack && typeof audioHandler !== "undefined") {
        const targetLyric = lyrics[newIndex];
        let targetTime = null;
        if (targetLyric) {
          if (targetLyric.charTimings && targetLyric.charTimings.some(ct => ct && ct.time !== null)) {
            for (let i = targetLyric.charTimings.length - 1; i >= 0; i--) {
              const ct = targetLyric.charTimings[i];
              if (ct && ct.time !== null) { targetTime = ct.time; break; }
            }
          }
          if (targetTime === null && targetLyric.time !== null) {
            targetTime = targetLyric.time;
          }
        }
        if (targetTime !== null) {
          _doSeek(targetTime);
        }
      }
      currentLyricIndex = newIndex;
      if (processMode === "char") {
        const lyric = lyrics[currentLyricIndex];
        if (lyric && lyric.charTimings && lyric.charTimings.length > 0) {
          const firstNull = lyric.charTimings.findIndex((ct) => ct.time === null);
          currentCharIndex =
            firstNull === -1 ? lyric.charTimings.length : firstNull;
        } else {
          currentCharIndex = 0;
        }
      }
      uiController.updateLyricContext();
      renderLyricPreview();
    }
  };

  const navigateLineLyric = (direction) => {
    if (lyrics.length === 0) return;

    const newIndex = currentLyricIndex + direction;
    if (newIndex >= 0 && newIndex < lyrics.length) {
      // 行级退时 seek 到目标行尾部时间（逐字模式看 charTimings，逐行看 line.time）
      if (markSettings.bindTimeOnBack && direction === -1 && typeof audioHandler !== "undefined") {
        const targetLyric = lyrics[newIndex];
        let targetTime = null;
        if (targetLyric) {
          if (targetLyric.charTimings && processMode === "char") {
            for (let i = targetLyric.charTimings.length - 1; i >= 0; i--) {
              const ct = targetLyric.charTimings[i];
              if (ct && ct.time !== null) { targetTime = ct.time; break; }
            }
          }
          if (targetTime === null && targetLyric.time !== null) {
            targetTime = targetLyric.time;
          }
        }
        if (targetTime !== null) {
          _doSeek(targetTime);
        }
      }

      currentLyricIndex = newIndex;
      if (processMode === "char") {
        currentCharIndex = 0;
      }
      uiController.updateLyricContext();
      renderLyricPreview();
    }
  };

  const navigateSyncLyric = (direction) => {
    const display = document.getElementById("sync-lyric-display");
    if (!display || lyrics.length === 0) return;

    const lines = display.querySelectorAll(".sync-lyric-line");
    if (lines.length === 0) return;

    let newIndex = previewCurrentLyricIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= lines.length) newIndex = lines.length - 1;

    const targetLine = lines[newIndex];
    if (targetLine) {
      const time = parseFloat(targetLine.getAttribute("data-time"));
      if (!isNaN(time)) {
        audioHandler.getPreviewAudioElement().currentTime = time;
        if (audioHandler.getPreviewAudioElement().paused) {
          audioHandler.togglePreviewPlayPause();
        }
      }
    }
  };

  const addBlankLyric = () => {
    lyrics.splice(currentLyricIndex + 1, 0, { text: "[空白]", time: null });
    renderLyricPreview();
    uiController.updateLyricContext();
  };

  const applyTimeAdjustment = (adjustment) => {
    if (isNaN(adjustment) || lyrics.length === 0) return;

    lyrics.forEach((lyric) => {
      if (lyric.time !== null) {
        lyric.time = Math.max(0, lyric.time + adjustment);
      }
      if (lyric.charTimings && lyric.charTimings.some(ct => ct.time !== null)) {
        lyric.charTimings.forEach((ct) => {
          if (ct.time !== null) {
            ct.time = Math.max(0, ct.time + adjustment);
          }
        });
      }
    });

    renderLyricPreview();
    renderPreviewLyrics(); // 同时更新预览界面
  };

  const adjustCurrentLyricTime = (adjustment) => {
    if (currentLyricIndex < 0 || currentLyricIndex >= lyrics.length) return;

    const lyric = lyrics[currentLyricIndex];
    if (lyric.time === null) return;

    let newTime = Math.max(0, lyric.time + adjustment);

    // clamp 行时间不超过下一行的行时间
    const nextLyric = lyrics[currentLyricIndex + 1];
    if (nextLyric && nextLyric.time !== null && newTime > nextLyric.time) {
      newTime = nextLyric.time;
    }
    lyric.time = newTime;

    // clamp 每个 char 时间不超过下一行的行时间
    if (lyric.charTimings && lyric.charTimings.some(ct => ct.time !== null)) {
      lyric.charTimings.forEach((ct) => {
        if (ct.time !== null) {
          let t = ct.time + adjustment;
          t = Math.max(0, t);
          if (nextLyric && nextLyric.time !== null && t > nextLyric.time) {
            t = nextLyric.time;
          }
          ct.time = t;
        }
      });
    }

    audioHandler.getAudioElement().currentTime = newTime;

    renderLyricPreview();
    uiController.updateLyricContext();
  };

  const switchToPreviewInterface = () => {
    if (lyrics.length === 0 || !audioHandler.getAudioElement().src) {
      uiController.showMessage({
        title: languageController.getText("tipTitle"),
        message: languageController.getText("uploadAudioAndTagLyrics"),
        type: "error",
        duration: 3000,
      });
      return;
    }

    if (!audioHandler.getAudioElement().paused) {
      audioHandler.getAudioElement().pause();
      if (window.jQuery) {
        $("#play-pause i").removeClass("fa-pause").addClass("fa-play");
      }
    }

    $("#edit-interface").addClass("hidden");
    $("#preview-interface").removeClass("hidden");
    $("#next-step-btn").removeClass("is-visible").addClass("hidden");
    renderPreviewLyrics();

    window.isPreviewMode = true;
  };

  const switchToEditInterface = () => {
    if (!audioHandler.getPreviewAudioElement().paused) {
      audioHandler.getPreviewAudioElement().pause();
      if (window.jQuery) {
        $("#preview-play-pause i").removeClass("fa-pause").addClass("fa-play");
      }
    }

    $("#preview-interface").addClass("hidden");
    $("#edit-interface").removeClass("hidden");

    // 切回编辑界面后，移除 hidden 让滚动逻辑重新接管
    const btn = document.getElementById("next-step-btn");
    if (btn) {
      btn.classList.remove("hidden");
      requestAnimationFrame(() => {
        if (typeof window.__updateNextStepBtnVisibility === "function") {
          window.__updateNextStepBtnVisibility();
        }
      });
    }

    window.isPreviewMode = false;
  };

  const renderPreviewLyrics = () => {
    const display = document.getElementById("sync-lyric-display");
    display.innerHTML = "";

    if (lyrics.length === 0) {
      display.innerHTML = `<div class="placeholder-text">${languageController.getText("noLyricData")}</div>`;
      return;
    }

    const sortedLyrics = [...lyrics]
      .filter((l) => l.time !== null && !isNaN(l.time) && l.text.trim() !== "")
      .sort((a, b) => a.time - b.time);

    // 缓存排序引用，供 syncLyricWithAudio 使用（避免 DOM index 映射错误）
    _previewSortedLyrics = sortedLyrics;

    if (sortedLyrics.length === 0) {
      display.innerHTML = `<div class="placeholder-text">${languageController.getText("noValidTimedLyrics")}</div>`;
      return;
    }

    sortedLyrics.forEach((lyric, index) => {
      const timeText = timeHandler.formatTime(lyric.time);

      const lyricLine = document.createElement("div");
      lyricLine.className = "sync-lyric-line";
      lyricLine.setAttribute("data-time", lyric.time);
      lyricLine.setAttribute("data-index", index);

      const timeSpan = document.createElement("span");
      timeSpan.className = "sync-time";
      timeSpan.textContent = `[${timeText}]`;

      const textSpan = document.createElement("span");
      textSpan.className = "sync-text";

      if (processMode === "char") {
        for (let i = 0; i < lyric.text.length; i++) {
          const charSpan = document.createElement("span");
          charSpan.className = "char-span";
          charSpan.textContent = lyric.text[i];
          textSpan.appendChild(charSpan);
        }
      } else {
        textSpan.textContent = lyric.text;
      }

      lyricLine.appendChild(timeSpan);
      lyricLine.appendChild(textSpan);

      if (bilingualEnabled && lyric.translation) {
        const translationSpan = document.createElement("span");
        translationSpan.className = "sync-translation";
        translationSpan.textContent = lyric.translation;
        lyricLine.appendChild(document.createElement("br"));
        lyricLine.appendChild(translationSpan);
      }

      lyricLine.addEventListener("click", function () {
        const time = parseFloat(this.getAttribute("data-time"));
        if (!isNaN(time)) {
          audioHandler.getPreviewAudioElement().currentTime = time;
          if (audioHandler.getPreviewAudioElement().paused) {
            audioHandler.togglePreviewPlayPause();
          }
        }
      });

      display.appendChild(lyricLine);
    });

    previewCurrentLyricIndex = -1;

    audioHandler
      .getPreviewAudioElement()
      .removeEventListener("timeupdate", syncLyricWithAudio);

    const throttledSync = (function () {
      let lastTime = 0;
      return function () {
        const now = Date.now();
        if (now - lastTime >= 10) {
          syncLyricWithAudio();
          lastTime = now;
        }
      };
    })();

    audioHandler
      .getPreviewAudioElement()
      .addEventListener("timeupdate", throttledSync);

    const container = document.querySelector(".sync-lyric-container");
    if (container) {
      container.scrollTop = 0;
    }
  };

  const syncLyricWithAudio = function () {
    const currentTime = audioHandler.getPreviewAudioElement().currentTime;
    const lines = document.querySelectorAll(".sync-lyric-line");
    if (lines.length === 0) return;

    let startIndex = Math.max(0, previewCurrentLyricIndex - 1);
    let foundCurrentLine = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const lineLyric = _previewSortedLyrics
        ? _previewSortedLyrics[i]
        : lyrics[i];
      let lineTime = parseFloat(line.getAttribute("data-time"));
      let nextLineTime =
        i < lines.length - 1
          ? parseFloat(lines[i + 1].getAttribute("data-time"))
          : Infinity;

      // 逐字模式：用 charTimings 覆盖行级时间，保证逐字高亮有完整播放窗口
      if (processMode === "char" && lineLyric && lineLyric.charTimings) {
        const cts = lineLyric.charTimings;

        let firstValid = -1;
        for (let j = 0; j < cts.length; j++) {
          if (cts[j] && cts[j].time !== null) {
            firstValid = cts[j].time;
            break;
          }
        }
        if (firstValid >= 0) lineTime = firstValid;

        let lastValid = -1;
        for (let j = cts.length - 1; j >= 0; j--) {
          if (cts[j] && cts[j].time !== null) {
            lastValid = cts[j].time;
            break;
          }
        }
        if (lastValid >= 0) {
          nextLineTime = Math.max(nextLineTime, lastValid + 0.05);
        }
      }

      if (currentTime >= lineTime && currentTime < nextLineTime) {
        if (i !== previewCurrentLyricIndex) {
          if (previewCurrentLyricIndex !== -1) {
            lines[previewCurrentLyricIndex].classList.remove("current");
            const prevTranslation =
              lines[previewCurrentLyricIndex].querySelector(
                ".sync-translation",
              );
            if (prevTranslation) {
              prevTranslation.classList.remove("current-translation");
            }
            const prevCharSpans =
              lines[previewCurrentLyricIndex].querySelectorAll(
                ".char-highlight",
              );
            prevCharSpans.forEach((span) =>
              span.classList.remove("char-highlight"),
            );
          }

          line.classList.add("current");

          const translation = line.querySelector(".sync-translation");
          if (translation) {
            translation.classList.add("current-translation");
          }

          previewCurrentLyricIndex = i;

          if (
            processMode === "char" &&
            i < lyrics.length &&
            lyrics[i].charTimings
          ) {
            const textSpan = line.querySelector(".sync-text");
            if (textSpan && !textSpan.querySelector(".char-span")) {
              const text = textSpan.textContent;
              textSpan.textContent = "";
              for (let j = 0; j < text.length; j++) {
                const charSpan = document.createElement("span");
                charSpan.className = "char-span";
                charSpan.textContent = text[j];
                textSpan.appendChild(charSpan);
              }
            }
          }

          const container = document.querySelector(".sync-lyric-container");
          if (container) {
            line.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }

        if (processMode === "char") {
          // 从排序后的预览歌词数组取 charTimings，避免 DOM index ↔ 原始 lyrics index 错位
          const previewLyric = _previewSortedLyrics ? _previewSortedLyrics[i] : lyrics[i];
          const charTimings = previewLyric && previewLyric.charTimings;
          const charSpans = line.querySelectorAll(".char-span");

          if (charSpans.length > 0 && charTimings && charTimings.length > 0) {
            for (let j = 0; j < charSpans.length; j++) {
              const ct = charTimings[j];
              if (ct && ct.time !== null && ct.time <= currentTime) {
                charSpans[j].classList.add("char-highlight");
              } else {
                charSpans[j].classList.remove("char-highlight");
              }
            }
          }
        }

        foundCurrentLine = true;
        break;
      }

      if (lineTime > currentTime) break;
    }

    if (!foundCurrentLine && previewCurrentLyricIndex !== -1) {
      lines[previewCurrentLyricIndex].classList.remove("current");
      const prevTranslation =
        lines[previewCurrentLyricIndex].querySelector(".sync-translation");
      if (prevTranslation) {
        prevTranslation.classList.remove("current-translation");
      }
      const prevCharSpans =
        lines[previewCurrentLyricIndex].querySelectorAll(".char-highlight");
      prevCharSpans.forEach((span) => span.classList.remove("char-highlight"));
      previewCurrentLyricIndex = -1;
    }
  };

  const getMetadata = () => {
    const metadata = [];
    const metadataFields = [
      {
        id: "meta-ar",
        tag: "ar",
        name: languageController.getText("metaArtist"),
      },
      {
        id: "meta-ti",
        tag: "ti",
        name: languageController.getText("metaTitle"),
      },
      {
        id: "meta-al",
        tag: "al",
        name: languageController.getText("metaAlbum"),
      },
      {
        id: "meta-by",
        tag: "by",
        name: languageController.getText("metaLyricCreator"),
      },
      {
        id: "meta-offset",
        tag: "offset",
        name: languageController.getText("metaOffset"),
      },
      {
        id: "meta-length",
        tag: "length",
        name: languageController.getText("metaLength"),
      },
      {
        id: "meta-au",
        tag: "au",
        name: languageController.getText("metaSinger"),
      },
      {
        id: "meta-re",
        tag: "re",
        name: languageController.getText("metaArranger"),
      },
      {
        id: "meta-ve",
        tag: "ve",
        name: languageController.getText("metaVersion"),
      },
      {
        id: "meta-composer",
        tag: "composer",
        name: languageController.getText("metaComposer"),
      },
      {
        id: "meta-lyricist",
        tag: "lyricist",
        name: languageController.getText("metaLyricist"),
      },
      {
        id: "meta-translator",
        tag: "translator",
        name: languageController.getText("metaTranslator"),
      },
      {
        id: "meta-language",
        tag: "language",
        name: languageController.getText("metaLanguage"),
      },
    ];

    metadataFields.forEach((field) => {
      const value = $(`#${field.id}`).val().trim();
      if (value) {
        metadata.push(`[${field.tag}:${value}]`);
      }
    });

    return metadata;
  };

  const parseLRCMetadata = (line) => {
    const timeMetaRegex = /\[\d+:\d+[:.:]\d{2}\]\[([a-z]+)\s*:\s*(.+?)\]/i;
    let match = line.match(timeMetaRegex);

    if (!match) {
      const metaRegex = /\[([a-z]+)\s*:\s*(.+?)\]/i;
      match = line.match(metaRegex);
    }

    if (match) {
      const tag = match[1].toLowerCase();
      const value = match[2].trim();

      const supportedTags = [
        "ar",
        "ti",
        "al",
        "by",
        "offset",
        "length",
        "au",
        "re",
        "ve",
        "composer",
        "lyricist",
        "translator",
        "language",
      ];

      if (supportedTags.includes(tag)) {
        return { tag, value };
      }
    }

    return null;
  };

  const exportLRC = () => {
    if (lyrics.length === 0) return;

    let lrcContent = "";

    const metadata = getMetadata();
    if (metadata.length > 0) {
      metadata.forEach((meta) => {
        lrcContent += meta + "\n";
      });
      lrcContent += "\n";
    }

    const sortedLyrics = [...lyrics]
      .filter((l) => l.time !== null && l.text.trim() !== "")
      .sort((a, b) => a.time - b.time);

    if (processMode === "char") {
      sortedLyrics.forEach((lyric) => {
        let line = `[${timeHandler.formatTime(lyric.time)}]`;

        // 按时间槽导出：charTimings 永远与 text 长度对齐
        if (lyric.charTimings && lyric.charTimings.length === lyric.text.length) {
          for (let i = 0; i < lyric.text.length; i++) {
            const ct = lyric.charTimings[i];
            if (ct && ct.time !== null) {
              line += `<${timeHandler.formatTime(ct.time)}>${lyric.text[i]}`;
            } else {
              line += lyric.text[i]; // 未标记字直接输出
            }
          }
        } else {
          line += lyric.text;
        }

        lrcContent += line + "\n";
      });
    } else if (bilingualEnabled) {
      sortedLyrics.forEach((lyric) => {
        lrcContent += `[${timeHandler.formatTime(lyric.time)}]${lyric.text}\n`;

        const translation = lyric.translation || "";
        lrcContent += `[${timeHandler.formatTime(lyric.time)}]${translation}\n`;
      });
    } else {
      sortedLyrics.forEach((lyric) => {
        lrcContent += `[${timeHandler.formatTime(lyric.time)}]${lyric.text}\n`;
      });
    }

    const blob = new Blob([lrcContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lyrics.lrc";
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // 提取可编辑时间单元列表：根据当前 wordMode 决定单字/按词，始终跳过空白字符
  const _extractEditableUnits = (lyric) => {
    const text = lyric.text;
    const cts = lyric.charTimings || [];
    const units = [];
    let i = 0;

    while (i < text.length) {
      const ch = text[i];

      if (/\s/.test(ch)) { i++; continue; }

      if (wordMode && _isEnglishLetter(ch)) {
        const start = i;
        while (i < text.length && _isEnglishLetter(text[i])) i++;
        const indices = [];
        for (let j = start; j < i; j++) indices.push(j);
        units.push({
          text: text.slice(start, i),
          indices,
          time: cts[start] ? cts[start].time : null,
        });
      } else {
        units.push({
          text: ch,
          indices: [i],
          time: cts[i] ? cts[i].time : null,
        });
        i++;
      }
    }

    return units;
  };

  const editLyric = (index) => {
    const lyric = lyrics[index];
    const isBilingual = bilingualEnabled;

    if (processMode === "char" && typeof uiController.showCharTimeEditor === "function") {
      const originalUnits = _extractEditableUnits(lyric);

      uiController.showCharTimeEditor({
        title: languageController.getText("editLyricTitle"),
        defaultValue: lyric.text,
        placeholder: languageController.getText("lyricContentLabel"),
        confirmText: languageController.getText("confirmText"),
        cancelText: languageController.getText("cancelText"),
        units: originalUnits,
        showLineTimeInput: true,
        defaultLineTime: lyric.time,
        lineTimeLabel: languageController.getText("timeInputLabel"),
        showTranslationInput: isBilingual,
        defaultTranslation: lyric.translation || "",
        onConfirm: (result) => {
          // 用原始 indices 先写回时间（必须在改 text 之前，保证映射正确）
          if (result.units) {
            result.units.forEach(({ idx, time }) => {
              const unit = originalUnits[idx];
              if (unit && unit.indices.length > 0) {
                lyric.charTimings[unit.indices[0]].time = time;
              }
            });
          }

          // 处理文本变化：更新 text + pad/truncate charTimings（保留前面已写好的 time）
          const newText = result.text !== undefined ? result.text.trim() : lyric.text;
          if (newText !== lyric.text) {
            lyric.text = newText;
            const textLen = newText.length;
            if (!lyric.charTimings) lyric.charTimings = [];
            while (lyric.charTimings.length < textLen) {
              const padIdx = lyric.charTimings.length;
              lyric.charTimings.push({ char: newText[padIdx], time: null });
            }
            if (lyric.charTimings.length > textLen) {
              lyric.charTimings.length = textLen;
            }
          }

          // 单调递增校正：保证每个有效 unit 的时间 ≥ 前一个有效 unit
          {
            let prevValidTime = null;
            for (let i = 0; i < lyric.charTimings.length; i++) {
              const ct = lyric.charTimings[i];
              if (ct && ct.time !== null) {
                if (prevValidTime !== null && ct.time < prevValidTime) {
                  ct.time = prevValidTime;
                } else {
                  prevValidTime = ct.time;
                }
              }
            }
          }

          // 找第一个有效 unit 时间
          let firstUnitTime = null;
          for (let i = 0; i < lyric.charTimings.length; i++) {
            const ct = lyric.charTimings[i];
            if (ct && ct.time !== null) {
              firstUnitTime = ct.time;
              break;
            }
          }

          // 行级时间写回：用户输入为空时取第一个 unit；校验不大于第一个 unit
          let finalLineTime;
          if (result.lineTime !== undefined && result.lineTime !== null) {
            finalLineTime = result.lineTime;
            if (firstUnitTime !== null && finalLineTime > firstUnitTime) {
              finalLineTime = firstUnitTime;
            }
          } else {
            finalLineTime = firstUnitTime;
          }
          lyric.time = finalLineTime;

          // 翻译
          if (isBilingual && result.translation !== undefined) {
            lyric.translation = result.translation.trim();
          }

          renderLyricPreview(true);
          uiController.updateLyricContext();
        },
      });
    } else {
      uiController.showPrompt({
        title: languageController.getText("editLyricTitle"),
        message: languageController.getText("editLyricMessage"),
        defaultValue: lyric.text,
        placeholder: languageController.getText("lyricContentLabel"),
        confirmText: languageController.getText("confirmText"),
        cancelText: languageController.getText("cancelText"),
        showTimeInput: true,
        defaultTime: lyric.time,
        showTranslationInput: isBilingual,
        defaultTranslation: lyric.translation || "",
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

          renderLyricPreview(true);
          uiController.updateLyricContext();
        },
      });
    }
  };

  const moveLyricUp = (index) => {
    if (index > 0) {
      [lyrics[index], lyrics[index - 1]] = [lyrics[index - 1], lyrics[index]];
      if (currentLyricIndex === index) {
        currentLyricIndex = index - 1;
      } else if (currentLyricIndex === index - 1) {
        currentLyricIndex = index;
      }
      renderLyricPreview(true);
      uiController.updateLyricContext();
    }
  };

  const moveLyricDown = (index) => {
    if (index < lyrics.length - 1) {
      [lyrics[index], lyrics[index + 1]] = [lyrics[index + 1], lyrics[index]];
      if (currentLyricIndex === index) {
        currentLyricIndex = index + 1;
      } else if (currentLyricIndex === index + 1) {
        currentLyricIndex = index;
      }
      renderLyricPreview(true);
      uiController.updateLyricContext();
    }
  };

  const deleteLyric = (index) => {
    uiController.showConfirm({
      title: languageController.getText("confirmDeleteTitle"),
      message: languageController.getText("confirmDeleteMessage"),
      confirmText: languageController.getText("confirmText"),
      cancelText: languageController.getText("cancelText"),
      onConfirm: () => {
        lyrics.splice(index, 1);
        if (currentLyricIndex >= index) {
          currentLyricIndex = Math.max(0, currentLyricIndex - 1);
        }
        renderLyricPreview(true);
        uiController.updateLyricContext();

        uiController.showMessage({
          title: languageController.getText("operationSuccessTitle"),
          message: languageController.getText("lyricDeletedMessage"),
          type: "success",
          duration: 2000,
        });
      },
    });
  };

  const selectLyric = (index) => {
    if (index >= 0 && index < lyrics.length) {
      currentLyricIndex = index;

      uiController.updateLyricContext();

      const lyric = lyrics[index];
      if (lyric && lyric.time) {
        const isPreviewMode = !$("#preview-interface").hasClass("hidden");
        if (isPreviewMode) {
          audioHandler.getPreviewAudioElement().currentTime = lyric.time;
        } else {
          audioHandler.getAudioElement().currentTime = lyric.time;
        }
      }

      uiController.showMessage({
        title: languageController.getText("operationSuccessTitle"),
        message: languageController
          .getText("jumpToLyric")
          .replace("{index}", index + 1),
        type: "success",
        duration: 2000,
      });

      renderLyricPreview();
    }
  };

  $("#split-lyric-btn").on("click", splitLyrics);
  $("#lrc-upload").on("change", function (e) {
    const file = e.target.files[0];
    if (file) handleLyricFile(file);
  });
  $("#set-time").on("click", markCurrentLyricTime);
  $("#prev-lyric").on("click", () => navigateLineLyric(-1));
  $("#next-lyric").on("click", () => navigateLineLyric(1));
  $("#add-blank-btn").on("click", addBlankLyric);
  $("#apply-adjustment").on("click", () => {
    const adjustment = parseFloat($("#time-adjust").val());
    applyTimeAdjustment(adjustment);
  });

  $("#audio-fix-time-btn").on("click", async () => {
    const audioElement = audioHandler.getAudioElement();
    const src = audioElement.src;

    if (!src) {
      uiController.showMessage({
        title: languageController.getText("tipTitle") || "提示",
        message: languageController.getText("upload_audio_first"),
        type: "error",
        duration: 3000,
      });
      return;
    }

    if (lyrics.length === 0) {
      uiController.showMessage({
        title: languageController.getText("tipTitle") || "提示",
        message: languageController.getText("import_lyrics_first"),
        type: "error",
        duration: 3000,
      });
      return;
    }

    const fixBtn = document.getElementById("audio-fix-time-btn");
    if (fixBtn) {
      fixBtn.disabled = true;
      fixBtn.classList.add("disabled");
    }

    $("#audio-fix-status").text(languageController.getText("analyzing"));
    $("#audio-fix-result").removeClass("hidden");

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], "audio.wav", { type: blob.type });

      const audioData = await audioFixTime.analyzeAudio(file);

      $("#audio-sample-rate").text(audioData.sampleRate + " Hz");
      $("#audio-duration").text(audioData.duration.toFixed(2) + " s");
      $("#audio-fix-status").text(languageController.getText("fixing"));

      const fixResults = await audioFixTime.fixAllLyricsTime(
        lyrics,
        audioData.data,
        audioData.sampleRate,
      );

      const timeHandler = (() => {
        const formatTime = (seconds) => {
          if (seconds === null || isNaN(seconds)) return "00:00.00";
          const mins = Math.floor(seconds / 60);
          const secs = Math.floor(seconds % 60);
          const ms = Math.floor((seconds % 1) * 100);
          return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
        };
        return { formatTime };
      })();

      const tbody = $("#fix-results-tbody");
      tbody.empty();

      fixResults.forEach((result, index) => {
        const row = $("<tr></tr>");
        row.append(`<td>${index + 1}</td>`);
        row.append(
          `<td>${result.originalTime !== null ? timeHandler.formatTime(result.originalTime) : "--"}</td>`,
        );
        row.append(
          `<td>${result.fixedTime !== null ? timeHandler.formatTime(result.fixedTime) : "--"}</td>`,
        );
        row.append(
          `<td>${result.peakIndex !== null ? result.peakIndex : "--"}</td>`,
        );
        row.append(
          `<td>${result.peakValue !== null ? result.peakValue.toFixed(4) : "--"}</td>`,
        );
        tbody.append(row);
      });

      const waveformData = audioFixTime.generateWaveformData(audioData.data);
      const canvas = document.getElementById("waveform-canvas");
      const ctx = canvas.getContext("2d");
      const width = (canvas.width =
        canvas.offsetWidth * window.devicePixelRatio);
      const height = (canvas.height =
        canvas.offsetHeight * window.devicePixelRatio);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const displayWidth = canvas.offsetWidth;
      const displayHeight = canvas.offsetHeight;

      ctx.fillStyle = "rgba(255, 255, 255, 0.84)";
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      ctx.strokeStyle = "#2241a5ff";
      ctx.lineWidth = 1;

      const barWidth = displayWidth / waveformData.length;

      waveformData.forEach((point, index) => {
        const x = index * barWidth;
        const yMin = ((1 - point.max) * displayHeight) / 2;
        const yMax = ((1 - point.min) * displayHeight) / 2;

        ctx.beginPath();
        ctx.moveTo(x, yMin);
        ctx.lineTo(x, yMax);
        ctx.stroke();
      });

      originalLyricsTimeBeforeFix = lyrics.map((lyric) => ({
        time: lyric.time,
        charTimings: lyric.charTimings
          ? lyric.charTimings.map((ct) => ({ char: ct.char, time: ct.time }))
          : null,
      }));

      lyrics.forEach((lyric, index) => {
        if (fixResults[index] && fixResults[index].fixedTime !== null) {
          const originalTime = originalLyricsTimeBeforeFix[index].time;

          // 此时跳过 charTimings 偏移，并让行级时间与第一个有真实时间的字符对齐
          if (originalTime === null) {
            const firstMarked = lyric.charTimings && lyric.charTimings.find(ct => ct.time !== null);
            if (firstMarked) {
              lyric.time = firstMarked.time;
            }
            return;
          }

          const delta = fixResults[index].fixedTime - originalTime;
          lyric.time = fixResults[index].fixedTime;

          if (lyric.charTimings && lyric.charTimings.some(ct => ct.time !== null) && delta !== 0) {
            lyric.charTimings.forEach((ct) => {
              if (ct.time !== null) {
                ct.time = Math.max(0, ct.time + delta);
              }
            });
          }
        }
      });

      renderLyricPreview();
      renderPreviewLyrics();

      $("#audio-fix-status").text(languageController.getText("completed"));

      const fixedCount = fixResults.filter((r) => r.success).length;
      uiController.showMessage({
        title: languageController.getText("operationSuccessTitle") || "成功",
        message: (
          languageController.getText("lyrics_fixed") ||
          "已校正 {count} 条歌词时间"
        ).replace("{count}", fixedCount),
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("音频分析失败:", error);
      $("#audio-fix-status").text(
        (languageController.getText("failed") || "失败") + ": " + error.message,
      );
      uiController.showMessage({
        title: languageController.getText("errorTitle") || "错误",
        message:
          (languageController.getText("audio_analysis_failed") ||
            "音频分析失败") +
          ": " +
          error.message,
        type: "error",
        duration: 3000,
      });
    }
  });

  $("#undo-fix-time-btn").on("click", () => {
    if (originalLyricsTimeBeforeFix.length === 0) {
      uiController.showMessage({
        title: languageController.getText("tipTitle") || "提示",
        message:
          languageController.getText("no_undo_available") ||
          "没有可撤销的校验记录",
        type: "info",
        duration: 3000,
      });
      return;
    }

    if (lyrics.length !== originalLyricsTimeBeforeFix.length) {
      uiController.showMessage({
        title: languageController.getText("tipTitle") || "提示",
        message: languageController.getText("lyrics_data_changed"),
        type: "error",
        duration: 3000,
      });
      return;
    }

    lyrics.forEach((lyric, index) => {
      lyric.time = originalLyricsTimeBeforeFix[index].time;
      const savedCharTimings = originalLyricsTimeBeforeFix[index].charTimings;
      if (savedCharTimings) {
        lyric.charTimings = savedCharTimings.map((ct) => ({ char: ct.char, time: ct.time }));
      }
    });

    originalLyricsTimeBeforeFix = [];

    const fixBtn = document.getElementById("audio-fix-time-btn");
    if (fixBtn) {
      fixBtn.disabled = false;
      fixBtn.classList.remove("disabled");
    }

    const audioFixResult = document.getElementById("audio-fix-result");
    if (audioFixResult) {
      audioFixResult.classList.add("hidden");
      document.getElementById("audio-sample-rate").textContent = "--";
      document.getElementById("audio-duration").textContent = "--";
      document.getElementById("audio-fix-status").textContent = "--";
      const tbody = document.getElementById("fix-results-tbody");
      if (tbody) {
        tbody.innerHTML = "";
      }
      const canvas = document.getElementById("waveform-canvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    renderLyricPreview();
    renderPreviewLyrics();

    uiController.showMessage({
      title: languageController.getText("operationSuccessTitle") || "成功",
      message:
        languageController.getText("undo_fix_success") || "已恢复校验前的时间",
      type: "success",
      duration: 3000,
    });
  });

  $("#back-to-edit").on("click", switchToEditInterface);
  $("#export-lrc").on("click", exportLRC);

  $("#toggle-metadata-btn").on("click", function () {
    const metadataContainer = $(".metadata-container");
    const metadataContent = $("#metadata-content");

    metadataContainer.toggleClass("active");
    metadataContent.toggleClass("hidden");
  });

  $("#bilingual-toggle").on("change", function () {
    bilingualEnabled = this.checked;

    if (bilingualEnabled) {
      $("#lyric-textarea").attr(
        "placeholder",
        languageController.getText("lyric_textarea_placeholder"),
      );
      uiController.showMessage({
        title:
          languageController.getText("bilingual_enabled_title") ||
          "双语歌词已启用",
        message:
          languageController.getText("bilingual_enabled_message") ||
          '文本输入：单数行为歌词，双数行为翻译\nLRC导入：将识别"/"后的内容作为翻译',
        type: "info",
        duration: 5000,
      });
    } else {
      $("#lyric-textarea").attr(
        "placeholder",
        languageController.getText("lyric_textarea_placeholder").split("\n")[0],
      );
    }

    if (lyrics.length > 0) {
      renderLyricPreview();
      renderPreviewLyrics();
    }
  });

  $("#stop-btn").on("click", () => {
    if (lyrics.length === 0) return;

    const doReset = () => {
      audioHandler.getAudioElement().pause();
      audioHandler.getAudioElement().currentTime = 0;
      audioHandler.getPreviewAudioElement().pause();
      audioHandler.getPreviewAudioElement().currentTime = 0;

      if (window.jQuery) {
        $("#play-pause i").removeClass("fa-pause").addClass("fa-play");
        $("#preview-play-pause i").removeClass("fa-pause").addClass("fa-play");
      }

      lyrics.forEach((lyric) => {
        lyric.time = null;
        if (lyric.charTimings) {
          for (let i = 0; i < lyric.charTimings.length; i++) {
            if (lyric.charTimings[i]) lyric.charTimings[i].time = null;
          }
        }
      });

      currentLyricIndex = 0;
      currentCharIndex = 0;
      previewCurrentLyricIndex = 0;
      uiController.updateLyricContext();
      renderLyricPreview();
    };

    if (typeof uiController.showConfirm === "function") {
      uiController.showConfirm({
        title: languageController.getText("confirmResetTitle"),
        message: languageController.getText("confirmResetMessage"),
        onConfirm: doReset,
      });
    } else {
      doReset();
    }
  });
  $("#text-input-btn").on("click", function () {
    $(this).addClass("active");
    $("#lrc-upload-btn").removeClass("active");
    $("#subtitle-convert-btn").removeClass("active");
    $("#text-input-container").removeClass("hidden");
    $("#lrc-upload-container").addClass("hidden");
    $("#subtitle-converter-container").addClass("hidden");
  });
  $("#lrc-upload-btn").on("click", function () {
    $(this).addClass("active");
    $("#text-input-btn").removeClass("active");
    $("#subtitle-convert-btn").removeClass("active");
    $("#lrc-upload-container").removeClass("hidden");
    $("#text-input-container").addClass("hidden");
    $("#subtitle-converter-container").addClass("hidden");
  });
  $("#subtitle-convert-btn").on("click", function () {
    $(this).addClass("active");
    $("#text-input-btn").removeClass("active");
    $("#lrc-upload-btn").removeClass("active");
    $("#subtitle-converter-container").removeClass("hidden");
    $("#text-input-container").addClass("hidden");
    $("#lrc-upload-container").addClass("hidden");
  });

  $("#lyric-textarea").on("input", function () {
    autoResizeTextarea();
  });

  setTimeout(autoResizeTextarea, 100);

  return {
    getLyrics: () => lyrics,
    getCurrentLyricIndex: () => currentLyricIndex,
    getCurrentCharIndex: () => currentCharIndex,
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
    getAutoSkipSpace,
    setAutoSkipSpace,
    getWordMode,
    setWordMode,
    getMarkSettings,
    setMarkSettings,
    markCurrentLyricTime,
    syncLyricWithAudio,
    renderPreviewLyrics,
    navigateLyric,
    navigateLineLyric,
    navigateSyncLyric,
    adjustCurrentLyricTime,
    autoResizeTextarea,
    importTimedLyrics,
    recognizeTimeCodes,
    switchToPreviewInterface,
  };
})();
