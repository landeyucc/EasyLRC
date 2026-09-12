/**
 * Loading Animation - 自包含的页面加载动画库
 * 仅需引入此脚本即可，无需额外 HTML 标记或 CSS
 *
 * 使用：<script src="js/loading-animation.js" defer></script>
 *
 * 可选配置（在引入脚本前设置 window.LoadingAnimConfig）：
 *   window.LoadingAnimConfig = {
 *     titleText: 'COLDSEA PROGRAMS',  // 标题文字
 *     barColor: '#0066ff',            // 进度条颜色
 *     bgColor: 'white',               // 背景色
 *     titleColor: '#000',             // 标题颜色
 *     minDisplayTime: 1500,           // 最小显示时长(ms)
 *   };
 */
(function () {
  'use strict';

  const config = Object.assign({
    titleText: 'COLDSEA PROGRAMS',
    barColor: '#0066ff',
    bgColor: 'white',
    titleColor: '#000',
    titleFontFamily: "'Roboto', sans-serif",
    minDisplayTime: 1500,
  }, window.LoadingAnimConfig || {});

  // 注入样式
  const style = document.createElement('style');
  style.textContent = `
    #loading-bg {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background-color: ${config.bgColor};
      z-index: 1999;
      transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #loading-bar {
      position: fixed;
      top: 0; left: 0;
      height: 3px; width: 0%;
      background-color: ${config.barColor};
      z-index: 2000;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                  transform 1s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #loading-title {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2.5rem;
      font-weight: bold;
      color: ${config.titleColor};
      z-index: 2001;
      font-family: ${config.titleFontFamily};
      transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
      margin: 0;
    }
  `;
  document.head.appendChild(style);

  // 创建 DOM 元素
  const loadingBg = document.createElement('div');
  loadingBg.id = 'loading-bg';

  const progressBar = document.createElement('div');
  progressBar.id = 'loading-bar';

  const titleText = document.createElement('h1');
  titleText.id = 'loading-title';
  titleText.textContent = config.titleText;

  // 插入到 body 最前面
  document.body.insertBefore(loadingBg, document.body.firstChild);
  document.body.insertBefore(progressBar, document.body.firstChild);
  document.body.insertBefore(titleText, document.body.firstChild);

  const loadStartTime = Date.now();
  let progress = 0;

  // 进度条动画
  const progressInterval = setInterval(() => {
    if (progress < 85) {
      progress += Math.random() * 8;
      progressBar.style.width = `${progress}%`;
    }
  }, 80);

  // 加载完成后退场
  window.addEventListener('load', function () {
    clearInterval(progressInterval);
    progress = 100;
    progressBar.style.width = '100%';

    const elapsedTime = Date.now() - loadStartTime;
    const remainingTime = Math.max(0, config.minDisplayTime - elapsedTime);

    setTimeout(() => {
      progressBar.style.transform = 'translateY(-100%)';
      progressBar.style.opacity = '0';
      titleText.style.transform = 'translate(-50%, -150%)';
      titleText.style.opacity = '0';
      loadingBg.style.transform = 'translateY(-100%)';
      loadingBg.style.opacity = '0';

      setTimeout(() => {
        if (progressBar.parentNode) progressBar.parentNode.removeChild(progressBar);
        if (loadingBg.parentNode) loadingBg.parentNode.removeChild(loadingBg);
        if (titleText.parentNode) titleText.parentNode.removeChild(titleText);
        if (style.parentNode) style.parentNode.removeChild(style);
      }, 800);
    }, remainingTime);
  });
})();
