const audioHandler = (function () {
  const audioElement = document.getElementById("audio-player");
  const previewAudioElement = document.getElementById("preview-audio-player");

  let isDragging = false;
  let isPreviewDragging = false;

  let currentPlayingAudio = null;

  function pauseAllOtherAudios() {
    const allAudios = document.querySelectorAll("audio");
    allAudios.forEach((audio) => {
      if (
        audio !== audioElement &&
        audio !== previewAudioElement &&
        !audio.paused
      ) {
        audio.pause();
      }
    });
  }

  function setupDragAndDrop() {
    const body = document.body;
    let dragCounter = 0;
    let highlightTimer = null;

    ["dragenter", "dragover", "dragleave", "drop"].forEach(
      function (eventName) {
        body.addEventListener(eventName, preventDefaults, false);
      },
    );

    ["dragenter", "dragover"].forEach(function (eventName) {
      body.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach(function (eventName) {
      body.addEventListener(eventName, unhighlight, false);
    });

    body.addEventListener("drop", handleDrop, false);

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function highlight(e) {
      dragCounter++;
      if (dragCounter > 0) {
        body.classList.add("drag-over");
        const dropText =
          languageController.getText("drop_to_upload") || "释放以上传文件";
        body.setAttribute("data-drop-text", dropText);
      }
    }

    function unhighlight(e) {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        body.classList.remove("drag-over");
      }
    }

    function handleDrop(e) {
      dragCounter = 0;
      body.classList.remove("drag-over");
      const dt = e.dataTransfer;
      const files = dt.files;

      if (files.length > 0) {
        let audioFiles = [];
        let lyricFiles = [];
        let subtitleFiles = [];

        Array.from(files).forEach((file) => {
          if (file.type.startsWith("audio/")) {
            audioFiles.push(file);
          }
          else {
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith(".srt") || fileName.endsWith(".vtt")) {
              subtitleFiles.push(file);
            }
            else if (fileName.endsWith(".lrc") || fileName.endsWith(".txt")) {
              lyricFiles.push(file);
            }
          }
        });

        if (audioFiles.length > 0) {
          handleAudioFile(audioFiles[0]);
          if (audioFiles.length > 1) {
            if (
              typeof uiController !== "undefined" &&
              uiController.showMessage
            ) {
              uiController.showMessage({
                title: languageController.getText("tipTitle"),
                message: languageController
                  .getText("audioFileDetected")
                  .replace("{count}", audioFiles.length),
                type: "info",
                duration: 3000,
              });
            }
          }
        }

        if (subtitleFiles.length > 0) {
          if (
            typeof subtitleConverter !== "undefined" &&
            subtitleConverter.handleSubtitleFile
          ) {
            subtitleConverter.handleSubtitleFile(subtitleFiles[0]);
            if (subtitleFiles.length > 1) {
              if (
                typeof uiController !== "undefined" &&
                uiController.showMessage
              ) {
                uiController.showMessage({
                  title: languageController.getText("tipTitle"),
                  message: languageController
                    .getText("lyricFileDetected")
                    .replace("{count}", subtitleFiles.length),
                  type: "info",
                  duration: 3000,
                });
              }
            }
          }
        }

        if (lyricFiles.length > 0) {
          if (
            typeof lyricHandler !== "undefined" &&
            lyricHandler.handleLyricFile
          ) {
            lyricHandler.handleLyricFile(lyricFiles[0]);
            if (lyricFiles.length > 1) {
              if (
                typeof uiController !== "undefined" &&
                uiController.showMessage
              ) {
                uiController.showMessage({
                  title: languageController.getText("tipTitle"),
                  message: languageController
                    .getText("lyricFileDetected")
                    .replace("{count}", lyricFiles.length),
                  type: "info",
                  duration: 3000,
                });
              }
            }
          }
        }
      }
    }
  }

  function handleAudioFile(file) {
    pauseAllOtherAudios();

    const audioUrl = URL.createObjectURL(file);
    audioElement.src = audioUrl;
    previewAudioElement.src = audioUrl;

    currentPlayingAudio = null;

    audioElement.hidden = true;
    if (window.jQuery) {
      $("#main-audio-player").removeClass("hidden");
      $(".custom-audio-player.preview").removeClass("hidden");
      $("#play-pause i").removeClass("fa-pause").addClass("fa-play");
    }

    updatePlayButtonsState(true);

    audioElement.addEventListener("loadedmetadata", function () {
      updateTotalTime();
      updatePreviewTotalTime();
    });

    previewAudioElement.addEventListener("loadedmetadata", function () {
      updatePreviewTotalTime();
    });
  }

  function updatePlayButtonsState(enabled) {
    const playPauseBtn = document.querySelector("#play-pause");
    const previewPlayPause = document.querySelector("#preview-play-pause");

    if (playPauseBtn) {
      playPauseBtn.disabled = !enabled;
      playPauseBtn.style.opacity = enabled ? "1" : "0.5";
      playPauseBtn.style.cursor = enabled ? "pointer" : "not-allowed";
    }

    if (previewPlayPause) {
      previewPlayPause.disabled = !enabled;
      previewPlayPause.style.opacity = enabled ? "1" : "0.5";
      previewPlayPause.style.cursor = enabled ? "pointer" : "not-allowed";
    }
  }

  function hasAudio() {
    return !!(audioElement.src && audioElement.src !== window.location.href);
  }

  if (window.jQuery) {
    $("#audio-upload").on("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        handleAudioFile(file);
      }
    });
  }

  function updateTotalTime() {
    if (
      !isNaN(audioElement.duration) &&
      window.jQuery &&
      typeof timeHandler !== "undefined" &&
      timeHandler.formatTime
    ) {
      $(".total-time").text(timeHandler.formatTime(audioElement.duration));
    }
  }

  function updatePreviewTotalTime() {
    if (
      !isNaN(previewAudioElement.duration) &&
      window.jQuery &&
      typeof timeHandler !== "undefined" &&
      timeHandler.formatTime
    ) {
      $(".preview-total-time").text(
        timeHandler.formatTime(previewAudioElement.duration),
      );
    }
  }

  function updateCurrentTime() {
    if (
      window.jQuery &&
      typeof timeHandler !== "undefined" &&
      timeHandler.formatTime
    ) {
      $(".current-time").text(timeHandler.formatTime(audioElement.currentTime));
    }
  }

  function updatePreviewCurrentTime() {
    if (
      window.jQuery &&
      typeof timeHandler !== "undefined" &&
      timeHandler.formatTime
    ) {
      $(".preview-current-time").text(
        timeHandler.formatTime(previewAudioElement.currentTime),
      );
    }
  }

  function updateProgressBar() {
    if (isNaN(audioElement.duration) || !window.jQuery) return;

    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    $(".custom-audio-player .progress-fill").width(progress + "%");
    $(".custom-audio-player .progress-handle").css("left", progress + "%");
  }

  function updatePreviewProgressBar() {
    if (isNaN(previewAudioElement.duration) || !window.jQuery) return;

    const progress =
      (previewAudioElement.currentTime / previewAudioElement.duration) * 100;
    $(".custom-audio-player.preview .progress-fill").width(progress + "%");
    $(".custom-audio-player.preview .progress-handle").css(
      "left",
      progress + "%",
    );
  }

  function handleProgressClick(e) {
    if (!window.jQuery) return;

    const rect = $(e.currentTarget)
      .find(".progress-track")[0]
      .getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;

    audioElement.currentTime = pos * audioElement.duration;

    updateProgressBar();
    updateCurrentTime();
  }

  function handlePreviewProgressClick(e) {
    if (!window.jQuery) return;

    const rect = $(e.currentTarget)
      .find(".progress-track")[0]
      .getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;

    previewAudioElement.currentTime = pos * previewAudioElement.duration;

    updatePreviewProgressBar();
    updatePreviewCurrentTime();
  }

  function startDrag(e) {
    if (!window.jQuery) return;

    e.preventDefault();
    isDragging = true;

    $(document).on("mousemove", handleDrag);
    $(document).on("mouseup", stopDrag);
  }

  function handleDrag(e) {
    if (!isDragging || !window.jQuery) return;

    const rect = $(
      ".custom-audio-player .progress-track",
    )[0].getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(1, pos)); // 限制在0-1范围内

    $(".custom-audio-player .progress-fill").width(pos * 100 + "%");
    $(".custom-audio-player .progress-handle").css("left", pos * 100 + "%");

    const seekTime = pos * audioElement.duration;
    if (typeof timeHandler !== "undefined" && timeHandler.formatTime) {
      $(".current-time").text(timeHandler.formatTime(seekTime));
    }
  }

  function stopDrag() {
    if (!isDragging || !window.jQuery) return;

    isDragging = false;

    $(document).off("mousemove", handleDrag);
    $(document).off("mouseup", stopDrag);

    const width = $(".custom-audio-player .progress-track").width();
    const handlePos =
      (parseFloat($(".custom-audio-player .progress-handle").css("left")) /
        100) *
      width;
    const pos = handlePos / width;
    const seekTime = pos * audioElement.duration;

    audioElement.currentTime = seekTime;
  }

  function startPreviewDrag(e) {
    if (!window.jQuery) return;

    e.preventDefault();
    isPreviewDragging = true;

    $(document).on("mousemove", handlePreviewDrag);
    $(document).on("mouseup", stopPreviewDrag);
  }

  function handlePreviewDrag(e) {
    if (!isPreviewDragging || !window.jQuery) return;

    const rect = $(
      ".custom-audio-player.preview .progress-track",
    )[0].getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    pos = Math.max(0, Math.min(1, pos)); // 限制在0-1范围内

    $(".custom-audio-player.preview .progress-fill").width(pos * 100 + "%");
    $(".custom-audio-player.preview .progress-handle").css(
      "left",
      pos * 100 + "%",
    );

    const seekTime = pos * previewAudioElement.duration;
    if (typeof timeHandler !== "undefined" && timeHandler.formatTime) {
      $(".preview-current-time").text(timeHandler.formatTime(seekTime));
    }
  }

  function stopPreviewDrag() {
    if (!isPreviewDragging || !window.jQuery) return;

    isPreviewDragging = false;

    $(document).off("mousemove", handlePreviewDrag);
    $(document).off("mouseup", stopPreviewDrag);

    const width = $(".custom-audio-player.preview .progress-track").width();
    const handlePos =
      (parseFloat(
        $(".custom-audio-player.preview .progress-handle").css("left"),
      ) /
        100) *
      width;
    const pos = handlePos / width;
    const seekTime = pos * previewAudioElement.duration;

    previewAudioElement.currentTime = seekTime;

    updatePreviewProgressBar();
    updatePreviewCurrentTime();
  }

  function togglePlayPause() {
    if (audioElement.paused) {
      pauseAllOtherAudios();

      audioElement.play();

      currentPlayingAudio = audioElement;

      if (window.jQuery) {
        $("#play-pause i").removeClass("fa-play").addClass("fa-pause");
      }
    } else {
      audioElement.pause();
      currentPlayingAudio = null;

      if (window.jQuery) {
        $("#play-pause i").removeClass("fa-pause").addClass("fa-play");
      }
    }
  }

  function togglePreviewPlayPause() {
    if (previewAudioElement.paused) {
      pauseAllOtherAudios();

      previewAudioElement.play();

      currentPlayingAudio = previewAudioElement;

      if (window.jQuery) {
        $("#preview-play-pause i").removeClass("fa-play").addClass("fa-pause");
      }
    } else {
      previewAudioElement.pause();
      currentPlayingAudio = null;

      if (window.jQuery) {
        $("#preview-play-pause i").removeClass("fa-pause").addClass("fa-play");
      }
    }
  }

  function adjustTime(seconds) {
    audioElement.currentTime = Math.max(
      0,
      Math.min(audioElement.duration || 0, audioElement.currentTime + seconds),
    );

    updateProgressBar();
    updateCurrentTime();
  }

  function adjustPreviewTime(seconds) {
    previewAudioElement.currentTime = Math.max(
      0,
      Math.min(
        previewAudioElement.duration || 0,
        previewAudioElement.currentTime + seconds,
      ),
    );

    updatePreviewProgressBar();
    updatePreviewCurrentTime();
  }

  setupDragAndDrop();

  document.addEventListener(
    "play",
    function (e) {
      if (
        e.target !== audioElement &&
        e.target !== previewAudioElement &&
        audioElement !== null &&
        !audioElement.paused
      ) {
        audioElement.pause();
        previewAudioElement.pause();
        currentPlayingAudio = null;

        if (window.jQuery) {
          $("#play-pause i").removeClass("fa-pause").addClass("fa-play");
          $("#preview-play-pause i")
            .removeClass("fa-pause")
            .addClass("fa-play");
        }
      }
    },
    true,
  ); // 使用捕获阶段，确保能捕获所有音频播放事件

  if (window.jQuery) {
    $(".custom-audio-player .audio-progress-bar").on(
      "click",
      handleProgressClick,
    );
    $(".custom-audio-player.preview .audio-progress-bar").on(
      "click",
      handlePreviewProgressClick,
    );
    $(".custom-audio-player .progress-handle").on("mousedown", startDrag);
    $(".custom-audio-player.preview .progress-handle").on(
      "mousedown",
      startPreviewDrag,
    );

    $("#main-audio-player").addClass("hidden");
    $(".custom-audio-player.preview").addClass("hidden");

    $("#play-pause").on("click", togglePlayPause);

    $("#prev-5s").on("click", function () {
      adjustTime(-2);
    });
    $("#next-5s").on("click", function () {
      adjustTime(2);
    });

    $("#preview-prev-2s").on("click", function () {
      adjustPreviewTime(-2);
    });
    $("#preview-next-2s").on("click", function () {
      adjustPreviewTime(2);
    });
    $("#preview-play-pause").on("click", togglePreviewPlayPause);
  }

  audioElement.addEventListener("timeupdate", function () {
    if (!isDragging && !isPreviewDragging) {
      updateCurrentTime();
      updateProgressBar();
    }
  });

  audioElement.addEventListener("ended", function () {
    const playPauseBtn = document.querySelector("#play-pause");
    if (playPauseBtn) {
      playPauseBtn.innerHTML = `<i class="fas fa-play"></i> ${languageController.getText("play_pause")}`;
    }
  });

  previewAudioElement.addEventListener("timeupdate", function () {
    if (!isDragging && !isPreviewDragging) {
      updatePreviewCurrentTime();
      updatePreviewProgressBar();
    }
  });

  previewAudioElement.addEventListener("ended", function () {
    const previewPlayPause = document.querySelector("#preview-play-pause");
    if (previewPlayPause) {
      previewPlayPause.innerHTML = `<i class="fas fa-play"></i> ${languageController.getText("play_pause")}`;
    }
  });

  return {
    getAudioElement: function () {
      return audioElement;
    },
    getPreviewAudioElement: function () {
      return previewAudioElement;
    },
    togglePlayPause: togglePlayPause,
    togglePreviewPlayPause: togglePreviewPlayPause,
    adjustTime: adjustTime,
    adjustPreviewTime: adjustPreviewTime,
    getCurrentTime: function () {
      return audioElement.currentTime;
    },
    getPreviewCurrentTime: function () {
      return previewAudioElement.currentTime;
    },
    setCurrentTime: function (time) {
      if (typeof time !== "number" || isNaN(time) || time < 0) return;
      const clamped = Math.min(time, audioElement.duration || 0);
      audioElement.currentTime = clamped;
    },
    setPreviewCurrentTime: function (time) {
      if (typeof time !== "number" || isNaN(time) || time < 0) return;
      const clamped = Math.min(time, previewAudioElement.duration || 0);
      previewAudioElement.currentTime = clamped;
    },
    updatePlayButtonsState: updatePlayButtonsState,
    hasAudio: hasAudio,
    togglePlay: function () {
      if (window.isPreviewMode) {
        togglePreviewPlayPause();
      } else {
        togglePlayPause();
      }
    },
    seekRelative: function (seconds) {
      if (window.isPreviewMode) {
        adjustPreviewTime(seconds);
      } else {
        adjustTime(seconds);
      }
    },
    handleAudioFile: handleAudioFile,
  };
})();
