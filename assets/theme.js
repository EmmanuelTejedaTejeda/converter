/**
 * Convertify - Shared Theme Management & Auto-Redirect
 * Prevents FOUC (Theme) and handles language routing immediately
 */
(function() {
    // 1. Language Auto-Routing (Executed immediately to prevent flashes, crawler-safe)
    function handleLanguageRedirect() {
        // Bypass redirection for search engine bots and performance auditing tools
        const botPattern = /bot|googlebot|bingbot|baiduspider|yandex|duckduckbot|slurp|crawler|spider|robot|crawling|lighthouse|pagespeed/i;
        if (botPattern.test(navigator.userAgent)) return;

        // Bypass if user has already been checked/redirected in this session
        if (sessionStorage.getItem('lang_redirected') === 'true') return;

        const userLang = navigator.language || navigator.userLanguage || 'es';
        const isChinese = userLang.toLowerCase().startsWith('zh');
        const isEnglish = userLang.toLowerCase().startsWith('en');
        const isJapanese = userLang.toLowerCase().startsWith('ja');
        const href = window.location.href;

        // Detect current language directory in URL
        let currentLang = 'es'; // default/root is Spanish
        if (href.includes('/en/') || href.includes('en/')) {
            currentLang = 'en';
        } else if (href.includes('/zh/') || href.includes('zh/')) {
            currentLang = 'zh';
        } else if (href.includes('/ja/') || href.includes('ja/')) {
            currentLang = 'ja';
        }

        // Determine target language
        const targetLang = isChinese ? 'zh' : (isEnglish ? 'en' : (isJapanese ? 'ja' : 'es'));

        // Mark as processed for this session so they can navigate manually if desired
        sessionStorage.setItem('lang_redirected', 'true');

        if (currentLang === targetLang) return; // Already on correct language page

        // Determine current page type
        let pageType = 'home';
        if (href.includes('jpg-a-png') || href.includes('jpg-to-png') || href.includes('jpg-zhuan-png') || href.includes('jpg-png-henkan')) {
            pageType = 'jpg-to-png';
        } else if (href.includes('comprimir-imagenes') || href.includes('compress-images') || href.includes('yasuo-tupian') || href.includes('gazo-asshuku')) {
            pageType = 'compress';
        } else if (href.includes('webp-a-jpg') || href.includes('webp-to-jpg') || href.includes('webp-zhuan-jpg') || href.includes('webp-jpg-henkan')) {
            pageType = 'webp-to-jpg';
        } else if (href.includes('imagenes-a-pdf') || href.includes('images-to-pdf') || href.includes('tupian-zhuan-pdf') || href.includes('gazo-pdf-henkan')) {
            pageType = 'images-to-pdf';
        } else if (href.includes('redimensionar-imagenes') || href.includes('resize-images') || href.includes('tupian-tiaozheng-daxiao') || href.includes('gazo-saizu-henko')) {
            pageType = 'resize';
        }

        // Compute relative path prefix to main root
        let pathToRoot = '';
        if (currentLang === 'es') {
            if (pageType !== 'home') pathToRoot = '../';
        } else { // 'en', 'zh', or 'ja'
            if (pageType === 'home') pathToRoot = '../';
            else pathToRoot = '../../';
        }

        // Compute path from main root to target language + page
        let targetPath = '';
        if (targetLang === 'es') {
            if (pageType === 'home') targetPath = 'index.html';
            else if (pageType === 'jpg-to-png') targetPath = 'jpg-a-png/index.html';
            else if (pageType === 'compress') targetPath = 'comprimir-imagenes/index.html';
            else if (pageType === 'webp-to-jpg') targetPath = 'webp-a-jpg/index.html';
            else if (pageType === 'images-to-pdf') targetPath = 'imagenes-a-pdf/index.html';
            else if (pageType === 'resize') targetPath = 'redimensionar-imagenes/index.html';
        } else if (targetLang === 'en') {
            if (pageType === 'home') targetPath = 'en/index.html';
            else if (pageType === 'jpg-to-png') targetPath = 'en/jpg-to-png/index.html';
            else if (pageType === 'compress') targetPath = 'en/compress-images/index.html';
            else if (pageType === 'webp-to-jpg') targetPath = 'en/webp-to-jpg/index.html';
            else if (pageType === 'images-to-pdf') targetPath = 'en/images-to-pdf/index.html';
            else if (pageType === 'resize') targetPath = 'en/resize-images/index.html';
        } else if (targetLang === 'zh') {
            if (pageType === 'home') targetPath = 'zh/index.html';
            else if (pageType === 'jpg-to-png') targetPath = 'zh/jpg-zhuan-png/index.html';
            else if (pageType === 'compress') targetPath = 'zh/yasuo-tupian/index.html';
            else if (pageType === 'webp-to-jpg') targetPath = 'zh/webp-zhuan-jpg/index.html';
            else if (pageType === 'images-to-pdf') targetPath = 'zh/tupian-zhuan-pdf/index.html';
            else if (pageType === 'resize') targetPath = 'zh/tupian-tiaozheng-daxiao/index.html';
        } else if (targetLang === 'ja') {
            if (pageType === 'home') targetPath = 'ja/index.html';
            else if (pageType === 'jpg-to-png') targetPath = 'ja/jpg-png-henkan/index.html';
            else if (pageType === 'compress') targetPath = 'ja/gazo-asshuku/index.html';
            else if (pageType === 'webp-to-jpg') targetPath = 'ja/webp-jpg-henkan/index.html';
            else if (pageType === 'images-to-pdf') targetPath = 'ja/gazo-pdf-henkan/index.html';
            else if (pageType === 'resize') targetPath = 'ja/gazo-saizu-henko/index.html';
        }

        window.location.replace(pathToRoot + targetPath);
    }

    handleLanguageRedirect();

    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const theme = savedTheme || getSystemTheme();
        document.documentElement.className = theme + '-theme';
        // Also apply to body once it's parsed (fallback)
        document.addEventListener('DOMContentLoaded', () => {
            document.body.className = theme + '-theme';
            setupThemeToggler();
            setupMobileMenu();
        });
    }

    function setupMobileMenu() {
        const hamburgerBtn = document.querySelector('.hamburger-menu-btn');
        if (hamburgerBtn) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof playPopSoundExternal === 'function') {
                    playPopSoundExternal();
                }
                const body = document.body;
                const isOpen = body.classList.contains('mobile-menu-open');
                if (isOpen) {
                    body.classList.remove('mobile-menu-open');
                    hamburgerBtn.setAttribute('aria-expanded', 'false');
                } else {
                    body.classList.add('mobile-menu-open');
                    hamburgerBtn.setAttribute('aria-expanded', 'true');
                }
            });
            
            // Close mobile menu when clicking on links inside the drawer
            const drawerLinks = document.querySelectorAll('.mobile-links-grid a');
            drawerLinks.forEach(link => {
                link.addEventListener('click', () => {
                    document.body.classList.remove('mobile-menu-open');
                    hamburgerBtn.setAttribute('aria-expanded', 'false');
                });
            });
            
            // Close mobile menu when clicking outside of header
            document.addEventListener('click', (e) => {
                if (document.body.classList.contains('mobile-menu-open')) {
                    const header = document.querySelector('.app-header');
                    if (header && !header.contains(e.target)) {
                        document.body.classList.remove('mobile-menu-open');
                        hamburgerBtn.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        }
    }

    function setupThemeToggler() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                // Synthesize pop sound if sound function exists
                if (typeof playPopSoundExternal === 'function') {
                    playPopSoundExternal();
                }
                const body = document.body;
                const docEl = document.documentElement;
                if (body.classList.contains('dark-theme')) {
                    body.className = 'light-theme';
                    docEl.className = 'light-theme';
                    localStorage.setItem('theme', 'light');
                } else {
                    body.className = 'dark-theme';
                    docEl.className = 'dark-theme';
                    localStorage.setItem('theme', 'dark');
                }
            });
        }
    }

    initTheme();
})();
