/**
 * Convertify - Shared Theme Management & Auto-Redirect
 * Prevents FOUC (Theme) and handles language routing immediately
 */
(function() {
    // 1. Language Auto-Routing (Executed immediately to prevent flashes, crawler-safe)
    function handleLanguageRedirect() {
        // Bypass redirection on 404 pages to prevent loops
        if (window.is404Page || window.location.pathname.endsWith('/404.html') || window.location.pathname.endsWith('/404') || window.location.pathname.includes('404')) return;

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

    function setupGlobalSearch() {
        const desktopInput = document.querySelector('.global-search-input');
        const desktopDropdown = document.querySelector('.search-results-dropdown');
        const mobileInput = document.querySelector('.mobile-search-input');
        
        if (!desktopInput && !mobileInput) return;

        // 1. Build desktop search database from existing navbar menu items
        let searchIndex = [];
        const menuLinks = document.querySelectorAll('.nav-dropdown-menu a');
        
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            // Clean title text from SVG contents
            let name = link.textContent.trim();
            const keywords = link.getAttribute('data-keywords') || '';
            
            // Find category
            const categoryEl = link.closest('.dropdown-category');
            const category = categoryEl ? categoryEl.querySelector('h4').textContent.trim() : '';
            
            // Grab SVG markup if any
            const svgEl = link.querySelector('svg');
            const svgHtml = svgEl ? svgEl.outerHTML : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`;
            
            searchIndex.push({
                href,
                name,
                keywords: keywords.toLowerCase(),
                category,
                svgHtml
            });
        });

        // 2. Desktop Search Behavior
        if (desktopInput && desktopDropdown) {
            let highlightedIndex = -1;
            let currentMatches = [];

            function renderMatches(matches) {
                desktopDropdown.innerHTML = '';
                currentMatches = matches;
                highlightedIndex = -1;

                if (matches.length === 0) {
                    const noResultsText = desktopInput.getAttribute('data-no-results') || 'No results found';
                    desktopDropdown.innerHTML = `<div class="search-no-results">${noResultsText}</div>`;
                    desktopDropdown.classList.remove('hidden');
                    return;
                }

                matches.forEach((match, index) => {
                    const item = document.createElement('a');
                    item.href = match.href;
                    item.className = 'search-result-item';
                    item.dataset.index = index;
                    item.innerHTML = `
                        ${match.svgHtml}
                        <div class="result-info">
                            <span class="result-name">${match.name}</span>
                            <span class="result-category">${match.category}</span>
                        </div>
                    `;

                    // Mouse interactions
                    item.addEventListener('mouseenter', () => {
                        highlightItem(index);
                    });
                    
                    item.addEventListener('click', () => {
                        if (typeof playPopSoundExternal === 'function') {
                            playPopSoundExternal();
                        }
                    });

                    desktopDropdown.appendChild(item);
                });

                desktopDropdown.classList.remove('hidden');
            }

            function highlightItem(index) {
                const items = desktopDropdown.querySelectorAll('.search-result-item');
                items.forEach(el => el.classList.remove('highlighted'));

                if (index >= 0 && index < items.length) {
                    items[index].classList.add('highlighted');
                    highlightedIndex = index;
                    // Ensure scrolled into view
                    items[index].scrollIntoView({ block: 'nearest' });
                } else {
                    highlightedIndex = -1;
                }
            }

            desktopInput.addEventListener('input', () => {
                const query = desktopInput.value.trim().toLowerCase();
                if (!query) {
                    desktopDropdown.classList.add('hidden');
                    desktopDropdown.innerHTML = '';
                    currentMatches = [];
                    highlightedIndex = -1;
                    return;
                }

                // Filter matching tools
                const matches = searchIndex.filter(item => {
                    return item.name.toLowerCase().includes(query) || item.keywords.includes(query);
                });

                renderMatches(matches.slice(0, 8)); // Limit to top 8
            });

            desktopInput.addEventListener('focus', () => {
                const query = desktopInput.value.trim();
                if (query) {
                    desktopInput.dispatchEvent(new Event('input'));
                }
            });

            // Keyboard navigation on input
            desktopInput.addEventListener('keydown', (e) => {
                const items = desktopDropdown.querySelectorAll('.search-result-item');
                if (desktopDropdown.classList.contains('hidden') || items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    let nextIndex = highlightedIndex + 1;
                    if (nextIndex >= currentMatches.length) nextIndex = 0;
                    highlightItem(nextIndex);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    let prevIndex = highlightedIndex - 1;
                    if (prevIndex < 0) prevIndex = currentMatches.length - 1;
                    highlightItem(prevIndex);
                } else if (e.key === 'Enter') {
                    if (highlightedIndex >= 0 && highlightedIndex < currentMatches.length) {
                        e.preventDefault();
                        if (typeof playPopSoundExternal === 'function') {
                            playPopSoundExternal();
                        }
                        window.location.href = currentMatches[highlightedIndex].href;
                    }
                } else if (e.key === 'Escape') {
                    desktopDropdown.classList.add('hidden');
                    desktopInput.blur();
                }
            });

            // Close dropdown clicking outside
            document.addEventListener('click', (e) => {
                if (!desktopInput.contains(e.target) && !desktopDropdown.contains(e.target)) {
                    desktopDropdown.classList.add('hidden');
                }
            });
        }

        // 3. Mobile Live Search Behavior in Drawer
        if (mobileInput) {
            mobileInput.addEventListener('input', () => {
                const query = mobileInput.value.trim().toLowerCase();
                const categories = document.querySelectorAll('.mobile-category');
                
                categories.forEach(cat => {
                    const links = cat.querySelectorAll('.mobile-links-grid a');
                    let visibleCount = 0;

                    links.forEach(link => {
                        const name = link.textContent.trim().toLowerCase();
                        const keywords = (link.getAttribute('data-keywords') || '').toLowerCase();

                        if (!query || name.includes(query) || keywords.includes(query)) {
                            link.style.display = '';
                            visibleCount++;
                        } else {
                            link.style.display = 'none';
                        }
                    });

                    // Hide category if no links match
                    if (query && visibleCount === 0) {
                        cat.style.display = 'none';
                    } else {
                        cat.style.display = '';
                    }
                });
            });
        }

        // 4. Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Ignore if user is already typing in an input/textarea
            const activeTag = document.activeElement.tagName.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement.isContentEditable) {
                return;
            }

            // Keyboard shortcut '/' focuses search input
            if (e.key === '/') {
                e.preventDefault();
                if (desktopInput) {
                    desktopInput.focus();
                    desktopInput.select();
                }
            }

            // Keyboard shortcut Ctrl+K or Cmd+K focuses search input
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                if (desktopInput) {
                    desktopInput.focus();
                    desktopInput.select();
                }
            }
        });
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
            setupGlobalSearch();

            // Register PWA Service Worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker registered successfully'))
                    .catch(err => console.error('Service Worker registration failed:', err));
            }
        });
    }

    initTheme();
})();
