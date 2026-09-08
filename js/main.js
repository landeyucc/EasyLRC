$(document).ready(() => {
  languageController.init();

  uiController.init();

  lyricHandler.renderLyricPreview();

  if (
    typeof audioHandler !== "undefined" &&
    audioHandler.updatePlayButtonsState
  ) {
    audioHandler.updatePlayButtonsState(false);
  }

  window.isPreviewMode = false;

  // 浮动下一步按钮
  (() => {
    const btn = document.getElementById("next-step-btn");
    if (!btn) return;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                  || window.innerWidth < 768;

    // —— 移动端滚动阈值（px） ——
    const MOBILE_THRESHOLD = 1000;
    // —— PC端滚动阈值（px） ——
    const DESKTOP_THRESHOLD = 280;

    const THRESHOLD = isMobile ? MOBILE_THRESHOLD : DESKTOP_THRESHOLD;
    let ticking = false;

    const update = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
      btn.classList.toggle("is-visible", scrolled >= THRESHOLD);
      ticking = false;
    };

    // 暴露给 lyricHandler 在切回编辑界面时调用
    window.__updateNextStepBtnVisibility = update;

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  })();

  // 浮动下一步按钮点击 → 切换预览界面
  const nextStepBtn = document.getElementById("next-step-btn");
  if (nextStepBtn && typeof lyricHandler !== "undefined" && typeof lyricHandler.switchToPreviewInterface === "function") {
    nextStepBtn.addEventListener("click", () => {
      lyricHandler.switchToPreviewInterface();
    });
  }


  document
    .querySelector('input[name="process-mode"][value="line"]')
    .addEventListener("change", function () {
      if (this.checked) {
        lyricHandler.setProcessMode("line");
        document.getElementById("bilingual-toggle").disabled = false;
        const skipSpaceToggle = document.getElementById("skip-space-toggle");
        const wordModeToggle = document.getElementById("word-mode-toggle");
        if (skipSpaceToggle) {
          skipSpaceToggle.disabled = true;
          skipSpaceToggle.checked = false;
        }
        if (wordModeToggle) {
          wordModeToggle.disabled = true;
          wordModeToggle.checked = false;
        }
        document.querySelectorAll(".char-only-btn").forEach((el) => {
          el.classList.add("hidden");
        });
        document.querySelectorAll(".nav-divider").forEach((el) => {
          el.classList.add("hidden");
        });
        if (typeof languageController.updateProcessModeLabels === "function") {
          languageController.updateProcessModeLabels("line");
        }
      }
    });

  document
    .querySelector('input[name="process-mode"][value="char"]')
    .addEventListener("change", function () {
      if (this.checked) {
        lyricHandler.setProcessMode("char");
        document.getElementById("bilingual-toggle").checked = false;
        document.getElementById("bilingual-toggle").disabled = true;
        const skipSpaceToggle = document.getElementById("skip-space-toggle");
        const wordModeToggle = document.getElementById("word-mode-toggle");
        if (skipSpaceToggle) {
          skipSpaceToggle.disabled = false;
          skipSpaceToggle.checked = true;
        }
        if (wordModeToggle) wordModeToggle.disabled = false;
        document.querySelectorAll(".char-only-btn").forEach((el) => {
          el.classList.remove("hidden");
        });
        document.querySelectorAll(".nav-divider").forEach((el) => {
          el.classList.remove("hidden");
        });
        if (typeof languageController.updateProcessModeLabels === "function") {
          languageController.updateProcessModeLabels("char");
        }
      }
    });

  const prevCharBtn = document.getElementById("prev-char");
  if (prevCharBtn) {
    prevCharBtn.addEventListener("click", () => {
      lyricHandler.navigateLyric(-1);
    });
  }
  const nextCharBtn = document.getElementById("next-char");
  if (nextCharBtn) {
    nextCharBtn.addEventListener("click", () => {
      lyricHandler.navigateLyric(1);
    });
  }

  // 自动跳过空格 开关
  const skipSpaceToggle = document.getElementById("skip-space-toggle");
  if (skipSpaceToggle) {
    skipSpaceToggle.addEventListener("change", function () {
      if (lyricHandler.getWordMode()) {
        // wordMode 锁定 skipSpace：强制覆盖内部状态 + UI，避免用户误点击造成不一致
        lyricHandler.setAutoSkipSpace(true);
        this.checked = true;
        this.disabled = true;
      } else {
        lyricHandler.setAutoSkipSpace(this.checked);
      }
    });
  }

  const wordModeToggle = document.getElementById("word-mode-toggle");
  if (wordModeToggle) {
    wordModeToggle.addEventListener("change", function () {
      lyricHandler.setWordMode(this.checked);
      if (this.checked) {
        if (skipSpaceToggle) {
          skipSpaceToggle.checked = true;
          skipSpaceToggle.disabled = true;
        }
      } else {
        if (skipSpaceToggle) {
          skipSpaceToggle.disabled = false;
          skipSpaceToggle.checked = lyricHandler.getAutoSkipSpace();
        }
      }
      if (typeof languageController.updateProcessModeLabels === "function") {
        languageController.updateProcessModeLabels("char");
      }
    });
  }

  const markSettingsBtn = document.getElementById("mark-settings-btn");
  if (markSettingsBtn) {
    markSettingsBtn.addEventListener("click", function () {
      if (typeof uiController !== "undefined" && typeof uiController.showMarkSettings === "function") {
        uiController.showMarkSettings();
      }
    });
  }

  $(document).on("keydown", function (e) {
    if ($(e.target).is("input, textarea")) return;

    const isCharMode =
      typeof lyricHandler !== "undefined" &&
      typeof lyricHandler.getProcessMode === "function" &&
      lyricHandler.getProcessMode() === "char";

    const hasAudio =
      typeof audioHandler !== "undefined" &&
      audioHandler.getAudioElement &&
      audioHandler.getAudioElement().src;
    const hasLyrics =
      typeof lyricHandler !== "undefined" && lyricHandler.getLyrics
        ? lyricHandler.getLyrics().length > 0
        : false;


    if (!window.isPreviewMode && e.altKey && e.key === "o") {
      e.preventDefault();
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "audio/*,.lrc,.txt,.srt,.vtt";
      fileInput.style.display = "none";
      document.body.appendChild(fileInput);

      uiController.showMessage({
        message: languageController.getText("key_open_file"),
        type: "info",
        duration: 2000,
      });

      fileInput.addEventListener("change", function () {
        if (this.files && this.files.length > 0) {
          const file = this.files[0];
          const fileName = file.name.toLowerCase();
          if (file.type.startsWith("audio/")) {
            audioHandler.handleAudioFile(file);
          } else if (fileName.endsWith(".lrc") || fileName.endsWith(".txt")) {
            lyricHandler.handleLyricFile(file);
          } else if (fileName.endsWith(".srt") || fileName.endsWith(".vtt")) {
            subtitleConverter.handleSubtitleFile(file);
          }
        }
        document.body.removeChild(fileInput);
      });

      fileInput.click();
    }

    if (hasAudio && e.altKey && e.key === "Enter") {
      e.preventDefault();
      audioHandler.togglePlay();

      uiController.showMessage({
        message: languageController.getText("key_play_pause"),
        type: "info",
        duration: 2000,
      });
    }

    if (hasAudio && ((!e.altKey && e.key === "b") || e.key === "B")) {
      e.preventDefault();
      audioHandler.seekRelative(-2);

      uiController.showMessage({
        message: languageController.getText("key_back_2s"),
        type: "info",
        duration: 2000,
      });
    }

    if (hasAudio && ((!e.altKey && e.key === "n") || e.key === "N")) {
      e.preventDefault();
      audioHandler.seekRelative(2);

      uiController.showMessage({
        message: languageController.getText("key_forward_2s"),
        type: "info",
        duration: 2000,
      });
    }

    if (
      !window.isPreviewMode &&
      hasLyrics &&
      e.altKey &&
      (e.key === "b" || e.key === "B")
    ) {
      e.preventDefault();
      lyricHandler.navigateLyric(-1);

      uiController.showMessage({
        message: languageController.getText(
          isCharMode ? "key_prev_char" : "key_prev_lyric",
        ),
        type: "info",
        duration: 2000,
      });
    }

    if (
      !window.isPreviewMode &&
      hasLyrics &&
      e.altKey &&
      (e.key === "n" || e.key === "N")
    ) {
      e.preventDefault();
      lyricHandler.navigateLyric(1);

      uiController.showMessage({
        message: languageController.getText(
          isCharMode ? "key_next_char" : "key_next_lyric",
        ),
        type: "info",
        duration: 2000,
      });
    }

    if (!window.isPreviewMode && hasLyrics && e.key === " ") {
      e.preventDefault();
      lyricHandler.markCurrentLyricTime();

      uiController.showMessage({
        message: languageController.getText("key_mark_time"),
        type: "info",
        duration: 2000,
      });
    }

    const swapArrow =
      typeof lyricHandler !== "undefined" &&
      typeof lyricHandler.getMarkSettings === "function" &&
      lyricHandler.getMarkSettings().swapArrowKeys;

    if (hasLyrics && e.key === "ArrowUp") {
      e.preventDefault();
      if (window.isPreviewMode) {
        lyricHandler.navigateSyncLyric(-1);
        uiController.showMessage({
          message: languageController.getText("key_prev_lyric"),
          type: "info",
          duration: 2000,
        });
      } else if (swapArrow) {
        lyricHandler.adjustCurrentLyricTime(-0.2);
        uiController.showMessage({
          message: languageController.getText("key_adjust_time_left"),
          type: "info",
          duration: 1500,
        });
      } else {
        lyricHandler.navigateLyric(-1);
        uiController.showMessage({
          message: languageController.getText(
            isCharMode ? "key_prev_char" : "key_prev_lyric",
          ),
          type: "info",
          duration: 2000,
        });
      }
    }

    if (hasLyrics && e.key === "ArrowDown") {
      e.preventDefault();
      if (window.isPreviewMode) {
        lyricHandler.navigateSyncLyric(1);
        uiController.showMessage({
          message: languageController.getText("key_next_lyric"),
          type: "info",
          duration: 2000,
        });
      } else if (swapArrow) {
        lyricHandler.adjustCurrentLyricTime(0.2);
        uiController.showMessage({
          message: languageController.getText("key_adjust_time_right"),
          type: "info",
          duration: 1500,
        });
      } else {
        lyricHandler.navigateLyric(1);
        uiController.showMessage({
          message: languageController.getText(
            isCharMode ? "key_next_char" : "key_next_lyric",
          ),
          type: "info",
          duration: 2000,
        });
      }
    }

    if (!window.isPreviewMode && hasLyrics && e.key === "ArrowLeft") {
      e.preventDefault();
      if (swapArrow) {
        lyricHandler.navigateLyric(-1);
        uiController.showMessage({
          message: languageController.getText(
            isCharMode ? "key_prev_char" : "key_prev_lyric",
          ),
          type: "info",
          duration: 2000,
        });
      } else {
        lyricHandler.adjustCurrentLyricTime(-0.2);
        uiController.showMessage({
          message: languageController.getText("key_adjust_time_left"),
          type: "info",
          duration: 1500,
        });
      }
    }

    if (!window.isPreviewMode && hasLyrics && e.key === "ArrowRight") {
      e.preventDefault();
      if (swapArrow) {
        lyricHandler.navigateLyric(1);
        uiController.showMessage({
          message: languageController.getText(
            isCharMode ? "key_next_char" : "key_next_lyric",
          ),
          type: "info",
          duration: 2000,
        });
      } else {
        lyricHandler.adjustCurrentLyricTime(0.2);
        uiController.showMessage({
          message: languageController.getText("key_adjust_time_right"),
          type: "info",
          duration: 1500,
        });
      }
    }

    if (e.altKey && (e.key === "m" || e.key === "M")) {
      e.preventDefault();
      const isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        const inputPanel = document.getElementById("input-panel");
        const expandBtn = document.getElementById("expand-input-panel-btn");
        if (inputPanel && expandBtn) {
          const isCollapsed = inputPanel.classList.contains("collapsed");
          if (isCollapsed) {
            inputPanel.classList.remove("collapsed");
            expandBtn.classList.add("hidden");
            document
              .querySelector("main")
              .classList.remove("input-panel-collapsed");
            uiController.showMessage({
              message:
                languageController.getText("key_left_panel_expanded") ||
                "已展开左侧面板",
              type: "info",
              duration: 2000,
            });
          } else {
            inputPanel.classList.add("collapsed");
            expandBtn.classList.remove("hidden");
            document
              .querySelector("main")
              .classList.add("input-panel-collapsed");
            uiController.showMessage({
              message:
                languageController.getText("key_left_panel_collapsed") ||
                "已折叠左侧面板",
              type: "info",
              duration: 2000,
            });
          }
        }
      }
    }
  });

  $("#subtitle-upload").on("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      subtitleConverter.handleSubtitleFile(file);
      $(this).val("");
    }
  });

  const textarea = document.getElementById("lyric-textarea");
  if (textarea) {
    let isManuallyResizing = false;
    let manualHeight = null;

    textarea.addEventListener("mousedown", function (e) {
      if (e.offsetY > textarea.clientHeight - 10) {
        isManuallyResizing = true;
        manualHeight = textarea.style.height;
        textarea.classList.add("manual-resize");
      }
    });

    document.addEventListener("mouseup", function () {
      if (isManuallyResizing) {
        isManuallyResizing = false;
        textarea.classList.remove("manual-resize");
      }
    });

    textarea.addEventListener("input", function () {
      if (!isManuallyResizing) {
        lyricHandler.autoResizeTextarea();
      }
    });
  }

  // 绑定识别时间开关事件
  $("#recognize-time-toggle").on("change", function () {
    const textarea = document.getElementById("lyric-textarea");
    if (!textarea) return;

    if (this.checked) {
      // 开启时：识别并格式化现有内容，保留在textarea中
      const content = textarea.value;
      const result = lyricHandler.recognizeTimeCodes(content);
      textarea.value = result.formatted;
      lyricHandler.autoResizeTextarea();
    }
  });

  $(window).on("beforeunload", (e) => {
    const textarea = document.getElementById("lyric-textarea");
    const hasTextareaContent = textarea && textarea.value.trim().length > 0;
    const hasAudio =
      audioHandler.getAudioElement() && audioHandler.getAudioElement().src;
    const lyrics = lyricHandler.getLyrics();
    const hasLyrics = lyrics && lyrics.length > 0;
    const hasProcessLyrics = lyrics && lyrics.some((l) => l.time !== null);

    if (hasTextareaContent || hasAudio || hasLyrics || hasProcessLyrics) {
      const message = languageController.getText("leave_confirm");
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  });

  function setupTooltips() {
    document.querySelectorAll(".tooltip-icon").forEach((icon) => {
      let tooltipEl = null;

      icon.addEventListener("mouseenter", function () {
        const tooltipKey = this.dataset.tooltip;
        if (!tooltipKey) return;

        let text = null;
        try {
          text =
            typeof languageController.getText === "function"
              ? languageController.getText(tooltipKey)
              : null;
        } catch (e) {}

        if (!text || text === tooltipKey) {
          text = this.getAttribute("data-fallback-title") || "";
        }

        if (!text) return;

        tooltipEl = document.createElement("div");
        tooltipEl.className = "custom-tooltip";
        tooltipEl.textContent = text;
        document.body.appendChild(tooltipEl);

        const rect = this.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();

        tooltipEl.style.position = "fixed";
        tooltipEl.style.left =
          rect.left + rect.width / 2 - tooltipRect.width / 2 + "px";
        tooltipEl.style.top = rect.top - tooltipRect.height - 8 + "px";

        requestAnimationFrame(() => {
          tooltipEl.classList.add("show");
        });
      });

      icon.addEventListener("mouseleave", function () {
        if (tooltipEl) {
          tooltipEl.classList.remove("show");
          setTimeout(() => {
            if (tooltipEl && tooltipEl.parentElement) {
              tooltipEl.parentElement.removeChild(tooltipEl);
            }
            tooltipEl = null;
          }, 250);
        }
      });
    });
  }

  setTimeout(setupTooltips, 300);

  const isMobile = window.innerWidth <= 768;

  if (!isMobile) {
    const inputPanel = document.getElementById("input-panel");
    const collapseBtn = document.getElementById("collapse-input-panel-btn");
    const expandBtn = document.getElementById("expand-input-panel-btn");

    if (collapseBtn && expandBtn && inputPanel) {
      collapseBtn.addEventListener("click", function () {
        inputPanel.classList.add("collapsed");
        expandBtn.classList.remove("hidden");
        document.querySelector("main").classList.add("input-panel-collapsed");
      });

      expandBtn.addEventListener("click", function () {
        inputPanel.classList.remove("collapsed");
        expandBtn.classList.add("hidden");
        document
          .querySelector("main")
          .classList.remove("input-panel-collapsed");
      });
    }
  }

  window.addEventListener("resize", function () {
    const isMobileNow = window.innerWidth <= 768;
    const inputPanel = document.getElementById("input-panel");
    const collapseBtn = document.getElementById("collapse-input-panel-btn");
    const expandBtn = document.getElementById("expand-input-panel-btn");

    if (isMobileNow) {
      if (inputPanel) inputPanel.classList.remove("collapsed");
      if (collapseBtn) collapseBtn.style.display = "none";
      if (expandBtn) expandBtn.classList.add("hidden");
    } else if (collapseBtn && expandBtn && inputPanel) {
      collapseBtn.style.display = "flex";
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const currentYear = new Date().getFullYear();
  const footerText = `© ${currentYear} <a href="https://github.com/landeyucc" target="_blank">@landeyucc</a>&nbsp;All rights reserved. <br/ >Powered by <a href="https://coldsea.vip/" target="_blank" style="text-decoration: none;"><span style="font-family: 'Frizon', sans-serif;">Coldsea</span></a>&nbsp;Team. `;
  const footerElements = document.querySelectorAll(".footer p");

  footerElements.forEach(function (footer) {
    footer.innerHTML = footerText;
  });
});
