/**
 * Convertify - Shared Theme Management & Auto-Redirect
 * Prevents FOUC (Theme) and handles language routing immediately
 */
(function() {
    // 1. Language Auto-Routing (Executed immediately to prevent flashes)
    function handleLanguageRedirect() {
        const savedLang = localStorage.getItem('pref-lang');
        if (savedLang) return; // Respect manual selection

        const userLang = navigator.language || navigator.userLanguage || 'es';
        const isEnglish = userLang.toLowerCase().startsWith('en');
        const href = window.location.href;

        if (isEnglish) {
            // Redirect English speakers from Spanish pages
            if (!href.includes('/en/') && !href.includes('en/')) {
                if (href.includes('jpg-a-png')) {
                    window.location.replace('../en/jpg-to-png/index.html');
                } else {
                    window.location.replace('en/index.html');
                }
            }
        } else {
            // Redirect Spanish speakers from English pages (if they ended up there by error)
            if (href.includes('/en/') || href.includes('en/')) {
                if (href.includes('jpg-to-png')) {
                    window.location.replace('../../jpg-a-png/index.html');
                } else {
                    window.location.replace('../index.html');
                }
            }
        }
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
            setupLanguageTracker();
        });
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

    function setupLanguageTracker() {
        const langLinks = document.querySelectorAll('.lang-link');
        langLinks.forEach(link => {
            link.addEventListener('click', () => {
                const href = link.getAttribute('href') || '';
                if (href.includes('en/')) {
                    localStorage.setItem('pref-lang', 'en');
                } else {
                    localStorage.setItem('pref-lang', 'es');
                }
            });
        });
    }

    initTheme();
})();
