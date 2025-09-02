/**
 * 主题控制器 - 管理深色/浅色主题切换
 */

class ThemeController {
    constructor() {
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.moonIcon = '<i class="fas fa-moon"></i>';
        this.sunIcon = '<i class="fas fa-sun"></i>';
        this.initTheme();
        this.setupEventListeners();
    }

    initTheme() {
        // 检查本地存储中是否有保存的主题偏好
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.enableDarkTheme();
        } else {
            this.enableLightTheme();
        }
    }

    setupEventListeners() {
        // 添加主题切换按钮的点击事件
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        if (document.body.hasAttribute('data-theme')) {
            this.enableLightTheme();
        } else {
            this.enableDarkTheme();
        }
    }

    enableDarkTheme() {
        document.body.setAttribute('data-theme', 'dark');
        this.themeToggleBtn.innerHTML = this.sunIcon;
        localStorage.setItem('theme', 'dark');
    }

    enableLightTheme() {
        document.body.removeAttribute('data-theme');
        this.themeToggleBtn.innerHTML = this.moonIcon;
        localStorage.setItem('theme', 'light');
    }
}

// 初始化主题控制器
document.addEventListener('DOMContentLoaded', () => {
    new ThemeController();
});