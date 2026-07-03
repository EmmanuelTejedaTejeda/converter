/**
 * My Local Picture - Shared Theme Management & Auto-Redirect
 * Prevents FOUC (Theme) and handles language routing immediately
 */
(function() {
    // Auto-redirect from old subdomain to new domain
    if (window.location.hostname === 'herramientas-imagen.pages.dev') {
        window.location.replace('https://mylocalpicture.com' + window.location.pathname + window.location.search);
        return;
    }

    // Initialize Google Analytics dataLayer stub immediately (prevents undefined reference errors on early calls)
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };

    // Lazy load Analytics and AdSense on first user interaction or fallback timeout (crawler-safe)
    function setupLazyThirdParty() {
        let scriptsLoaded = false;

        // Bypass loading on performance auditing tools and search engine crawlers
        const botPattern = /bot|googlebot|bingbot|baiduspider|yandex|duckduckbot|slurp|crawler|spider|robot|crawling|lighthouse|pagespeed|Mediapartners-Google/i;
        const isBot = botPattern.test(navigator.userAgent);

        function loadThirdPartyScripts() {
            if (scriptsLoaded) return;
            scriptsLoaded = true;

            // 1. Load Google Analytics Gtag
            const gtagScript = document.createElement('script');
            gtagScript.async = true;
            gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-6DWDN024S9';
            document.head.appendChild(gtagScript);

            // Initialize GA configurations
            window.gtag('js', new Date());
            window.gtag('config', 'G-6DWDN024S9');

            // 2. Load Google AdSense
            const adsenseScript = document.createElement('script');
            adsenseScript.async = true;
            adsenseScript.crossOrigin = 'anonymous';
            adsenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4529923995739017';
            document.head.appendChild(adsenseScript);
        }

        const translations = {
            es: {
                text: 'Utilizamos cookies de terceros (Google Analytics y Google AdSense) para analizar el tráfico del sitio y mostrar anuncios personalizados. Al hacer clic en Aceptar, consientes el uso de estas cookies.',
                accept: 'Aceptar',
                decline: 'Rechazar',
                linkText: 'Política de Privacidad',
                linkUrl: '/politica-privacidad/'
            },
            en: {
                text: 'We use third-party cookies (Google Analytics and Google AdSense) to analyze site traffic and display personalized ads. By clicking Accept, you consent to the use of these cookies.',
                accept: 'Accept',
                decline: 'Decline',
                linkText: 'Privacy Policy',
                linkUrl: '/en/privacy-policy/'
            },
            zh: {
                text: '我们使用第三方 Cookie（Google Analytics 和 Google AdSense）来分析网站流量并展示个性化广告。点击“接受”即表示您同意使用这些 Cookie。',
                accept: '接受',
                decline: '拒绝',
                linkText: '隐私政策',
                linkUrl: '/zh/yinsi-zhengce/'
            },
            ja: {
                text: '当サイトでは、トラフィック分析やパーソナライズ広告表示のために、サードパーティCookie（GoogleアナリティクスやAdSenseなど）を使用しています。「同意する」をクリックすると、Cookieの使用に同意したことになります。',
                accept: '同意する',
                decline: '拒否する',
                linkText: 'プライバシーポリシー',
                linkUrl: '/ja/privacy-policy/'
            }
        };

        function showCookieConsentBanner() {
            if (document.getElementById('cookie-consent-banner')) return;

            const pageLang = document.documentElement.lang || 'es';
            const t = translations[pageLang] || translations['es'];

            const banner = document.createElement('div');
            banner.id = 'cookie-consent-banner';
            banner.className = 'cookie-consent-banner';
            banner.innerHTML = `
                <div class="cookie-container">
                    <p class="cookie-text">
                        ${t.text} 
                        <a href="${t.linkUrl}" class="cookie-link" target="_blank">${t.linkText}</a>.
                    </p>
                    <div class="cookie-buttons">
                        <button id="cookie-decline-btn" class="btn btn-cookie-decline">${t.decline}</button>
                        <button id="cookie-accept-btn" class="btn btn-cookie-accept">${t.accept}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(banner);

            // Add events
            document.getElementById('cookie-accept-btn').addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'accepted');
                banner.classList.add('cookie-banner-hide');
                setTimeout(() => banner.remove(), 400);
                loadThirdPartyScripts();
            });

            document.getElementById('cookie-decline-btn').addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'declined');
                banner.classList.add('cookie-banner-hide');
                setTimeout(() => banner.remove(), 400);
            });
        }

        if (isBot) {
            // Load immediately for search engine crawlers and AdSense verification bots
            loadThirdPartyScripts();
        } else {
            const consent = localStorage.getItem('cookie_consent');
            if (consent === 'accepted') {
                loadThirdPartyScripts();
            } else if (consent === 'declined') {
                // Do not load scripts, respect user choice
            } else {
                // If no preference stored, show banner after window is fully loaded to prevent performance impact
                if (document.readyState === 'complete') {
                    showCookieConsentBanner();
                } else {
                    window.addEventListener('load', showCookieConsentBanner);
                }
            }
        }
    }

    setupLazyThirdParty();

    // 3. Centralized Audio Feedback (Programmatic Web Audio API, 0 KB payload)
    let audioCtx = null;
    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Global playPopSound function with 50ms rate-limiter
    window.playPopSound = function() {
        // Exclude search engine bots and audits
        const botPattern = /bot|googlebot|bingbot|baiduspider|yandex|duckduckbot|slurp|crawler|spider|robot|crawling|lighthouse|pagespeed/i;
        if (botPattern.test(navigator.userAgent)) return;

        // Verify if sounds are disabled by user preference
        if (localStorage.getItem('soundEnabled') === 'false') return;

        // Rate-limiting: prevent playing sounds too close together (less than 50ms)
        const now = Date.now();
        if (window._lastSoundTime && (now - window._lastSoundTime < 50)) return;
        window._lastSoundTime = now;

        try {
            initAudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } catch (e) {
            console.warn('Audio synthesis failed:', e);
        }
    };

    // Override the old window.playPopSoundExternal to point to our global pop sound
    window.playPopSoundExternal = window.playPopSound;

    // Delegate click event listeners to play pop sounds on interactive elements
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .btn, a, input[type="checkbox"], input[type="radio"], select, .lang-dropdown-trigger, .theme-toggle, .btn-reorder');
        if (target) {
            window.playPopSound();
        }
    }, { passive: true });

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

    function setupShareFAB() {
        // Translations dictionary for Share Toast
        const shareTranslations = {
            es: {
                toast: '¡Enlace copiado al portapapeles! Compártelo con tus amigos. 🚀',
                title: 'Compartir',
                description: 'Comparte My Local Picture'
            },
            en: {
                toast: 'Link copied to clipboard! Share it with your friends. 🚀',
                title: 'Share',
                description: 'Share My Local Picture'
            },
            zh: {
                toast: '链接已复制到剪贴板！与朋友分享吧。🚀',
                title: '分享',
                description: '分享 My Local Picture'
            },
            ja: {
                toast: 'リンクがクリップボードにコピーされました！友達と共有しましょう。🚀',
                title: '共有',
                description: 'My Local Pictureを共有'
            }
        };

        const pageLang = document.documentElement.lang || 'es';
        const t = shareTranslations[pageLang] || shareTranslations['es'];

        // Create the button element
        const shareBtn = document.createElement('button');
        shareBtn.id = 'share-float-btn';
        shareBtn.className = 'share-float-btn';
        shareBtn.setAttribute('aria-label', t.title);
        shareBtn.setAttribute('title', t.description);
        
        // Use a clean connected node/share SVG icon
        shareBtn.innerHTML = `
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
        `;

        document.body.appendChild(shareBtn);

        // Click event handler
        shareBtn.addEventListener('click', () => {
            const shareData = {
                title: document.title,
                text: document.querySelector('meta[name="description"]')?.getAttribute('content') || 'My Local Picture - Free Online Image Tools',
                url: window.location.href
            };

            // Detect native Web Share API
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData)
                    .catch(err => {
                        // If user cancels, do not show error
                        if (err.name !== 'AbortError') console.error('Share error:', err);
                    });
            } else {
                // Fallback: Clipboard Copy
                navigator.clipboard.writeText(window.location.href)
                    .then(() => {
                        showShareToast(t.toast);
                    })
                    .catch(err => {
                        console.error('Clipboard copy failed:', err);
                        // Hard fallback if clipboard API permissions fail
                        const tempInput = document.createElement('input');
                        tempInput.value = window.location.href;
                        document.body.appendChild(tempInput);
                        tempInput.select();
                        document.execCommand('copy');
                        document.body.removeChild(tempInput);
                        showShareToast(t.toast);
                    });
            }
        });

        // Toast show helper
        function showShareToast(message) {
            // Check if there is an existing toast
            let toast = document.getElementById('share-toast');
            if (toast) toast.remove();

            toast = document.createElement('div');
            toast.id = 'share-toast';
            toast.className = 'share-toast';
            toast.textContent = message;

            document.body.appendChild(toast);

            // Active animation class
            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            // Remove toast after 3 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        }
    }

    function setupGlobalZIP() {
        const downloadAllBtn = document.getElementById('download-all-btn');
        if (!downloadAllBtn) return;

        downloadAllBtn.addEventListener('click', (e) => {
            // Find all ready download buttons inside cards
            const readyButtons = Array.from(document.querySelectorAll('.btn-action-download'))
                .filter(btn => btn.href && btn.href.startsWith('blob:') && !btn.classList.contains('hidden'));

            if (readyButtons.length <= 1) {
                // Let the default single-file or sequential download propagate if only 1 or 0 files
                return;
            }

            // If there are multiple files, we intercept and package them into a ZIP!
            e.preventDefault();
            e.stopImmediatePropagation();

            const originalText = downloadAllBtn.innerHTML;
            downloadAllBtn.disabled = true;
            downloadAllBtn.classList.add('disabled');

            // Detect language
            const pageLang = document.documentElement.lang || 'es';
            const zipText = {
                es: 'Creando ZIP...',
                en: 'Creating ZIP...',
                zh: '正在生成ZIP...',
                ja: 'ZIP作成中...'
            };
            downloadAllBtn.innerHTML = zipText[pageLang] || zipText['es'];

            // Dynamically load JSZip
            loadJSZip(() => {
                const zip = new JSZip();
                const promises = readyButtons.map((btn, index) => {
                    // Extract filename from download attribute or fallback to index
                    let filename = btn.getAttribute('download');
                    if (!filename) {
                        const fileCard = btn.closest('.file-card');
                        const nameEl = fileCard ? fileCard.querySelector('.file-name') : null;
                        filename = nameEl ? nameEl.textContent.trim() : `file-${index}`;
                    }
                    
                    return fetch(btn.href)
                        .then(r => r.blob())
                        .then(blob => {
                            zip.file(filename, blob);
                        });
                });

                Promise.all(promises)
                    .then(() => {
                        return zip.generateAsync({ type: 'blob' });
                    })
                    .then(zipBlob => {
                        const zipUrl = URL.createObjectURL(zipBlob);
                        const link = document.createElement('a');
                        link.href = zipUrl;
                        link.download = 'My Local Picture-files.zip';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        setTimeout(() => URL.revokeObjectURL(zipUrl), 10000);

                        // Reset button
                        downloadAllBtn.disabled = false;
                        downloadAllBtn.classList.remove('disabled');
                        downloadAllBtn.innerHTML = originalText;

                        // Show thank you modal
                        const thankYouModal = document.getElementById('thank-you-modal');
                        if (thankYouModal) {
                            thankYouModal.classList.remove('hidden');
                        }
                    })
                    .catch(err => {
                        console.error('ZIP generation failed, falling back to default sequential downloads:', err);
                        // Reset button
                        downloadAllBtn.disabled = false;
                        downloadAllBtn.classList.remove('disabled');
                        downloadAllBtn.innerHTML = originalText;

                        // Click all buttons sequentially as fallback
                        let delay = 0;
                        readyButtons.forEach(btn => {
                            setTimeout(() => btn.click(), delay);
                            delay += 300;
                        });
                    });
            });
        }, true);

        // Helper to load JSZip dynamically
        function loadJSZip(callback) {
            if (window.JSZip) {
                callback();
                return;
            }
            const script = document.createElement('script');
            const pathPrefix = window.location.pathname.includes('/en/') || 
                               window.location.pathname.includes('/zh/') || 
                               window.location.pathname.includes('/ja/') ? '../../' : '../';
            script.src = pathPrefix + 'assets/jszip.min.js';
            script.onload = () => callback();
            script.onerror = () => {
                console.error('Failed to load JSZip');
                callback(new Error('Load failed'));
            };
            document.head.appendChild(script);
        }
    }

    function setupPWAInstall() {
        let deferredPrompt;
        const pageLang = document.documentElement.lang || 'es';

        const installTranslations = {
            es: {
                text: 'Instala My Local Picture en tu dispositivo para usarlo sin conexión.',
                btn: 'Instalar',
                title: 'Instalar App'
            },
            en: {
                text: 'Install My Local Picture on your device for offline use.',
                btn: 'Install',
                title: 'Install App'
            },
            zh: {
                text: '安装 My Local Picture 以便离线使用。',
                btn: '安装',
                title: '安装应用'
            },
            ja: {
                text: 'オフラインで利用するためアプリをインストール。',
                btn: 'インストール',
                title: 'アプリをインストール'
            }
        };

        const t = installTranslations[pageLang] || installTranslations['es'];

        window.addEventListener('beforeinstallprompt', (e) => {
            // Check if dismissed before in this session
            if (sessionStorage.getItem('pwa_dismissed') === 'true') {
                return;
            }

            // Prevent default prompt
            e.preventDefault();
            deferredPrompt = e;

            // Show custom install promo banner
            showInstallBanner();
        });

        function showInstallBanner() {
            if (document.getElementById('pwa-install-banner')) return;

            const banner = document.createElement('div');
            banner.id = 'pwa-install-banner';
            banner.className = 'pwa-install-banner';
            banner.innerHTML = `
                <div class="pwa-install-content">
                    <div class="pwa-icon-wrapper">
                        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </div>
                    <div class="pwa-text-container">
                        <p class="pwa-text">${t.text}</p>
                    </div>
                    <div class="pwa-buttons-wrapper">
                        <button id="pwa-install-btn" class="btn btn-pwa-install">${t.btn}</button>
                        <button id="pwa-close-btn" class="pwa-close-btn" aria-label="Close">&times;</button>
                    </div>
                </div>
            `;

            document.body.appendChild(banner);

            // Trigger show animation
            setTimeout(() => {
                banner.classList.add('show');
            }, 100);

            // Install click event
            document.getElementById('pwa-install-btn').addEventListener('click', () => {
                if (!deferredPrompt) return;
                banner.classList.remove('show');
                setTimeout(() => banner.remove(), 400);

                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the PWA install prompt');
                    } else {
                        console.log('User dismissed the PWA install prompt');
                    }
                    deferredPrompt = null;
                });
            });

            // Dismiss click event
            document.getElementById('pwa-close-btn').addEventListener('click', () => {
                banner.classList.remove('show');
                setTimeout(() => banner.remove(), 400);
                // Don't show again in this browser session
                sessionStorage.setItem('pwa_dismissed', 'true');
            });
        }
    }

    function setupSmartDropzone() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        if (!dropZone || !fileInput) return;

        const lang = document.documentElement.lang || 'es';
        
        // Inject Custom Freemium & Stripe Styles
        if (!document.getElementById('stripe-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'stripe-modal-styles';
            style.innerHTML = `
                .stripe-modal-card {
                    position: relative;
                    background: var(--card-bg);
                    border: 1px solid var(--card-border);
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    width: 100%;
                    max-width: 480px;
                    box-sizing: border-box;
                    transform: translateY(20px);
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
                .modal-overlay:not(.hidden) .stripe-modal-card {
                    transform: translateY(0);
                }
                .stripe-field-group {
                    margin-bottom: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    text-align: left;
                }
                .stripe-field-group label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                }
                .stripe-input {
                    background: var(--body-bg);
                    border: 1px solid var(--card-border);
                    color: var(--text-primary);
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    width: 100%;
                    box-sizing: border-box;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .stripe-input:focus {
                    border-color: var(--accent-primary);
                }
                .stripe-row {
                    display: flex;
                    gap: 1rem;
                }
                .stripe-row .stripe-field-group {
                    flex: 1;
                }
                .stripe-badge-secure {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                    font-size: 0.75rem;
                    color: #10b981;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }
                .stripe-features-list {
                    list-style: none;
                    padding: 0;
                    margin: 1rem 0 1.5rem 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    text-align: left;
                }
                .stripe-features-list li {
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .stripe-spinner {
                    display: inline-block;
                    width: 1.2rem;
                    height: 1.2rem;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: stripe-spin 0.8s linear infinite;
                    margin-right: 0.5rem;
                    vertical-align: middle;
                }
                @keyframes stripe-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        const getRedirectPath = (ext) => {
            const paths = {
                es: {
                    png: '/png-a-jpg/',
                    jpg: '/jpg-a-png/',
                    jpeg: '/jpg-a-png/',
                    webp: '/webp-a-jpg/',
                    heic: '/convertir-heic-a-jpg/',
                    heif: '/convertir-heic-a-jpg/',
                    svg: '/svg-a-jpg/',
                    bmp: '/bmp-a-jpg/',
                    gif: '/gif-a-jpg/',
                    pdf: '/pdf-a-jpg/'
                },
                en: {
                    png: '/en/png-to-jpg/',
                    jpg: '/en/jpg-to-png/',
                    jpeg: '/en/jpg-to-png/',
                    webp: '/en/webp-to-jpg/',
                    heic: '/en/heic-to-jpg/',
                    heif: '/en/heic-to-jpg/',
                    svg: '/en/svg-to-jpg/',
                    bmp: '/en/bmp-to-jpg/',
                    gif: '/en/gif-to-jpg/',
                    pdf: '/en/pdf-to-jpg/'
                },
                ja: {
                    png: '/ja/png-jpg-henkan/',
                    jpg: '/ja/jpg-png-henkan/',
                    jpeg: '/ja/jpg-png-henkan/',
                    webp: '/ja/webp-jpg-henkan/',
                    heic: '/ja/heic-jpg-henkan/',
                    heif: '/ja/heic-jpg-henkan/',
                    svg: '/ja/svg-to-jpg/',
                    bmp: '/ja/bmp-jpg-henkan/',
                    gif: '/ja/gif-jpg-henkan/',
                    pdf: '/ja/pdf-jpg-henkan/'
                },
                zh: {
                    png: '/zh/png-zhuan-jpg/',
                    jpg: '/zh/jpg-zhuan-png/',
                    jpeg: '/zh/jpg-zhuan-png/',
                    webp: '/zh/webp-zhuan-jpg/',
                    heic: '/zh/heic-zhuan-jpg/',
                    heif: '/zh/heic-zhuan-jpg/',
                    svg: '/zh/svg-zhuan-jpg/',
                    bmp: '/zh/bmp-zhuan-jpg/',
                    gif: '/zh/gif-zhuan-jpg/',
                    pdf: '/zh/pdf-zhuan-jpg/'
                }
            };
            const langPaths = paths[lang] || paths['es'];
            return langPaths[ext.toLowerCase()];
        };

        const getAcceptExtensions = () => {
            const acceptAttr = fileInput.getAttribute('accept') || '';
            const exts = [];
            acceptAttr.split(',').forEach(item => {
                const clean = item.trim().toLowerCase();
                if (clean.startsWith('.')) {
                    exts.push(clean.substring(1));
                } else if (clean.startsWith('image/')) {
                    exts.push(clean.substring(6));
                } else if (clean === 'application/pdf') {
                    exts.push('pdf');
                }
            });
            if (exts.length === 0) {
                const path = window.location.pathname.toLowerCase();
                if (path.includes('png')) exts.push('png');
                if (path.includes('jpg') || path.includes('jpeg')) exts.push('jpg', 'jpeg');
                if (path.includes('webp')) exts.push('webp');
                if (path.includes('heic') || path.includes('heif')) exts.push('heic', 'heif');
                if (path.includes('svg')) exts.push('svg');
                if (path.includes('bmp')) exts.push('bmp');
                if (path.includes('gif')) exts.push('gif');
                if (path.includes('pdf')) exts.push('pdf');
            }
            return exts;
        };

        const isAccepted = (fileName) => {
            const exts = getAcceptExtensions();
            if (exts.length === 0) return true;
            const fileExt = fileName.split('.').pop().toLowerCase();
            return exts.includes(fileExt);
        };

        // Capture drop events at capture phase
        dropZone.addEventListener('drop', (e) => {
            if (e.isFreemiumBypass) return;
            if (!e.dataTransfer || e.dataTransfer.files.length === 0) return;
            const files = e.dataTransfer.files;
            
            const mismatchFiles = [];
            Array.from(files).forEach(file => {
                if (!isAccepted(file.name)) {
                    mismatchFiles.push(file);
                }
            });

            if (mismatchFiles.length > 0) {
                e.preventDefault();
                e.stopPropagation();

                const firstFile = mismatchFiles[0];
                const ext = firstFile.name.split('.').pop().toLowerCase();
                const redirectPath = getRedirectPath(ext);

                if (redirectPath) {
                    showRedirectModal(firstFile.name, ext.toUpperCase(), redirectPath);
                } else {
                    const msg = {
                        es: `El formato de "${firstFile.name}" no es compatible con esta herramienta.`,
                        en: `The format of "${firstFile.name}" is not supported by this tool.`,
                        ja: `"${firstFile.name}" の形式はこのツールでサポートされていません。`,
                        zh: `此工具不支持 "${firstFile.name}" 格式。`
                    };
                    alert(msg[lang] || msg['es']);
                }
                return;
            }

            // Freemium check
            if (localStorage.getItem('isUnlimited') === 'true') return;

            const currentCount = parseInt(document.getElementById('file-count')?.textContent || '0', 10);
            const incomingCount = files.length;

            if (currentCount + incomingCount > 5) {
                e.preventDefault();
                e.stopPropagation();
                showStripePromoModal(Array.from(files), currentCount, 'drop', dropZone);
            }
        }, true);

        // Capture file-input change events at capture phase
        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'file-input') {
                if (e.isFreemiumBypass) return;
                if (localStorage.getItem('isUnlimited') === 'true') return;

                const files = e.target.files;
                const currentCount = parseInt(document.getElementById('file-count')?.textContent || '0', 10);
                const incomingCount = files ? files.length : 0;

                if (currentCount + incomingCount > 5) {
                    e.preventDefault();
                    e.stopPropagation();
                    const originalFiles = Array.from(files);
                    e.target.value = ''; // clear value
                    showStripePromoModal(originalFiles, currentCount, 'change', e.target);
                }
            }
        }, true);

        function showRedirectModal(fileName, formatName, redirectPath) {
            const existing = document.getElementById('smart-redirect-modal');
            if (existing) existing.remove();

            const modalTranslations = {
                es: {
                    title: '¡Formato detectado!',
                    text: `Has arrastrado un archivo <strong>${formatName}</strong> (${fileName}). ¿Quieres ir a la herramienta correcta para procesarlo?`,
                    btnRedirect: 'Ir al Convertidor',
                    btnCancel: 'Cancelar'
                },
                en: {
                    title: 'Format Detected!',
                    text: `You dragged a <strong>${formatName}</strong> file (${fileName}). Would you like to open the correct tool for it?`,
                    btnRedirect: 'Go to Converter',
                    btnCancel: 'Cancel'
                },
                ja: {
                    title: 'フォーマット検出！',
                    text: `<strong>${formatName}</strong> ファイル (${fileName}) がドロップされました。対応するツールを開きますか？`,
                    btnRedirect: '変換ツールへ行く',
                    btnCancel: 'キャンセル'
                },
                zh: {
                    title: '检测到文件格式！',
                    text: `您拖入了 <strong>${formatName}</strong> 文件 (${fileName})。是否跳转到对应的转换工具进行处理？`,
                    btnRedirect: '前往转换器',
                    btnCancel: '取消'
                }
            };

            const t = modalTranslations[lang] || modalTranslations['es'];

            const modal = document.createElement('div');
            modal.id = 'smart-redirect-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="modal-card success-pulse" style="max-width: 450px;">
                    <button class="modal-close-btn" id="redirect-close-btn" aria-label="Close">&times;</button>
                    <div class="modal-content" style="text-align: center; padding: 1rem 0.5rem 0.5rem 0.5rem;">
                        <div class="modal-icon" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--accent-primary);">🎯</div>
                        <h3 class="modal-title" style="margin-bottom: 0.75rem;">${t.title}</h3>
                        <p class="modal-text" style="font-size: 0.95rem; line-height: 1.5; color: var(--text-secondary); margin-bottom: 1.5rem;">${t.text}</p>
                        <div style="display: flex; gap: 0.75rem; justify-content: center; width: 100%;">
                            <button id="redirect-cancel-btn" class="btn" style="flex: 1; padding: 0.8rem; background: var(--card-border); color: var(--text-primary); border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">${t.btnCancel}</button>
                            <a href="${redirectPath}" id="redirect-confirm-btn" class="btn" style="flex: 1; padding: 0.8rem; background: var(--accent-primary); color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-align: center; display: inline-block;">${t.btnRedirect}</a>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const close = () => {
                modal.classList.add('hidden');
                setTimeout(() => modal.remove(), 300);
            };

            document.getElementById('redirect-close-btn').addEventListener('click', close);
            document.getElementById('redirect-cancel-btn').addEventListener('click', close);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) close();
            });

            if (window.playPopSoundExternal) {
                window.playPopSoundExternal();
            }
        }

        function showStripePromoModal(incomingFiles, currentCount, eventType, targetElement) {
            const existing = document.getElementById('stripe-promo-modal');
            if (existing) existing.remove();

            const allowedCount = Math.max(0, 5 - currentCount);

            const tContent = {
                es: {
                    title: '⚡ Límite de Lotes Excedido',
                    text: `Has seleccionado <strong>${incomingFiles.length}</strong> archivos. El límite de procesamiento gratuito es de <strong>5</strong> archivos por lote simultáneo para ayudar a mantener el sitio.`,
                    subText: `Puedes continuar gratis con los primeros <strong>${allowedCount}</strong> archivos (y convertir el resto en otro lote gratis), o activar el **Pase Ilimitado por $2/mes**.`,
                    btnUpgrade: 'Obtener Pase Ilimitado ($2/mes)',
                    btnContinue: `Continuar gratis con ${allowedCount} archivos`,
                    btnCancel: 'Cancelar'
                },
                en: {
                    title: '⚡ Batch Limit Exceeded',
                    text: `You selected <strong>${incomingFiles.length}</strong> files. The free batch limit is <strong>5</strong> simultaneous files to help keep our servers running.`,
                    subText: `You can continue for free with the first <strong>${allowedCount}</strong> files (and convert the rest in another free batch), or activate the **Unlimited Pass for $2/mo**.`,
                    btnUpgrade: 'Get Unlimited Pass ($2/mo)',
                    btnContinue: `Continue free with ${allowedCount} files`,
                    btnCancel: 'Cancel'
                },
                ja: {
                    title: '⚡ バッチ制限を超過しました',
                    text: `<strong>${incomingFiles.length}</strong> 個のファイルが選択されました。サーバー維持のため、無料での同時処理は <strong>5</strong> 個までとなっております。`,
                    subText: `最初の <strong>${allowedCount}</strong> 個のみ無料で処理を継続する（残りは別の無料バッチで処理可能）か、**月額2ドルの無制限パス**を有効にしてください。`,
                    btnUpgrade: '無制限パスを入手する (月額2ドル)',
                    btnContinue: `最初の${allowedCount}個で無料継続`,
                    btnCancel: 'キャンセル'
                },
                zh: {
                    title: '⚡ 超出单批处理限制',
                    text: `您已选择 <strong>${incomingFiles.length}</strong> 个文件。为了维持服务器运行，免费同时处理限制为 <strong>5</strong> 个。`,
                    subText: `您可以选择继续免费处理前 <strong>${allowedCount}</strong> 个文件（其余文件可在下一批免费处理），或激活 **$2/月 无限制通行证**。`,
                    btnUpgrade: '获取无限制通行证 ($2/月)',
                    btnContinue: `继续处理前 ${allowedCount} 个文件`,
                    btnCancel: '取消'
                }
            };

            const t = tContent[lang] || tContent['es'];

            const modal = document.createElement('div');
            modal.id = 'stripe-promo-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="stripe-modal-card" style="max-width: 480px; text-align: center;">
                    <button class="modal-close-btn" id="stripe-promo-close" aria-label="Close">&times;</button>
                    <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--accent-primary);">⚡</div>
                    <h3 style="margin-bottom: 1rem; font-weight: 700; font-family: var(--font-heading); font-size: 1.35rem;">${t.title}</h3>
                    <p style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.5; margin-bottom: 1rem; text-align: left;">${t.text}</p>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1.5rem; text-align: left;">${t.subText}</p>
                    
                    <ul class="stripe-features-list">
                        <li>✅ <strong>Conversiones Masivas Ilimitadas</strong> (lotes de más de 50 imágenes)</li>
                        <li>✅ <strong>Procesamiento Local Seguro</strong> (sin subir tus fotos a internet)</li>
                        <li>✅ <strong>Soporte Prioritario</strong> y sin anuncios en el convertidor</li>
                    </ul>

                    <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
                        <button id="stripe-upgrade-btn" class="btn btn-primary" style="padding: 0.8rem; background: var(--accent-primary); color: #fff; border-radius: 8px; border: none; font-weight: 700; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2);">
                            💳 ${t.btnUpgrade}
                        </button>
                        ${allowedCount > 0 ? `
                            <button id="stripe-bypass-btn" class="btn" style="padding: 0.75rem; background: var(--card-border); color: var(--text-primary); border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">
                                ${t.btnContinue}
                            </button>
                        ` : ''}
                        <button id="stripe-promo-cancel" class="btn-link" style="color: var(--text-muted); border: none; background: none; font-size: 0.85rem; cursor: pointer; margin-top: 0.25rem;">
                            ${t.btnCancel}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const close = () => {
                modal.classList.add('hidden');
                setTimeout(() => modal.remove(), 300);
            };

            document.getElementById('stripe-promo-close').addEventListener('click', close);
            document.getElementById('stripe-promo-cancel').addEventListener('click', close);

            // Continue free button
            const bypassBtn = document.getElementById('stripe-bypass-btn');
            if (bypassBtn) {
                bypassBtn.addEventListener('click', () => {
                    close();
                    // Bypass with first allowedCount files
                    const dt = new DataTransfer();
                    incomingFiles.slice(0, allowedCount).forEach(file => {
                        dt.items.add(file);
                    });

                    if (eventType === 'change') {
                        targetElement.files = dt.files;
                        const bypassEvent = new Event('change', { bubbles: true });
                        bypassEvent.isFreemiumBypass = true;
                        targetElement.dispatchEvent(bypassEvent);
                    } else {
                        const bypassEvent = new DragEvent('drop', {
                            bubbles: true,
                            cancelable: true,
                            dataTransfer: dt
                        });
                        bypassEvent.isFreemiumBypass = true;
                        targetElement.dispatchEvent(bypassEvent);
                    }
                });
            }

            // Upgrade button -> Stripe checkout form
            document.getElementById('stripe-upgrade-btn').addEventListener('click', () => {
                close();
                showStripeCheckoutModal(incomingFiles, eventType, targetElement);
            });

            if (window.playPopSoundExternal) window.playPopSoundExternal();
        }

        function showStripeCheckoutModal(incomingFiles, eventType, targetElement) {
            const existing = document.getElementById('stripe-checkout-modal');
            if (existing) existing.remove();

            const tCheck = {
                es: {
                    title: 'Suscripción Ilimitada',
                    price: '$2.00 / mes',
                    cardLabel: 'Información de la Tarjeta',
                    btnPay: 'Pagar $2.00 USD',
                    secureText: 'Pago seguro encriptado vía Stripe SSL'
                },
                en: {
                    title: 'Unlimited Subscription',
                    price: '$2.00 / mo',
                    cardLabel: 'Card Information',
                    btnPay: 'Pay $2.00 USD',
                    secureText: 'Secure encrypted payment powered by Stripe SSL'
                },
                ja: {
                    title: '無制限パスサブスクリプション',
                    price: '月額 2.00米ドル',
                    cardLabel: 'カード情報',
                    btnPay: '2.00米ドルを支払う',
                    secureText: 'Stripe SSLによる暗号化された安全な決済'
                },
                zh: {
                    title: '无限制通行证订阅',
                    price: '$2.00 / 月',
                    cardLabel: '银行卡信息',
                    btnPay: '支付 $2.00 美元',
                    secureText: '由 Stripe SSL 提供的安全加密支付'
                }
            };

            const t = tCheck[lang] || tCheck['es'];

            const modal = document.createElement('div');
            modal.id = 'stripe-checkout-modal';
            modal.className = 'modal-overlay';
            modal.style.zIndex = '9999';
            modal.innerHTML = `
                <div class="stripe-modal-card">
                    <button class="modal-close-btn" id="stripe-checkout-close" aria-label="Close">&times;</button>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--card-border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 700; font-family: var(--font-heading); font-size: 1.2rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
                                <path d="M34.72 16.5c0-5.75-2.9-8.88-8.47-8.88-3.05 0-5.78 1.4-7.07 2.08l-.2.12-.23-.13c-1.34-.73-4.13-2.07-7.23-2.07-5.58 0-8.48 3.13-8.48 8.88 0 5.43 2.65 8.1 7.42 10.3l3.05 1.4c2.8 1.28 4.3 2.13 4.3 4.25 0 2.2-2.18 3.03-5.26 3.03-3.66 0-7.3-1.42-9.69-2.85l-.2-.12-.34.25c-.27.2-.55.43-.83.67l-.27.24.12.18c2.94 4.54 8.24 5.92 11.23 5.92 6.09 0 9.17-3.05 9.17-8.84 0-5.58-2.65-8.23-7.55-10.45l-2.68-1.22c-3.13-1.43-4.57-2.35-4.57-4.3 0-1.89 1.77-2.77 4.57-2.77 3.05 0 6.13 1.13 8.35 2.38l.18.1.3-.23a12.72 12.72 0 0 1 .8-.56l.24-.15-.12-.18z" fill="#6772E5"/>
                                <path d="M26.25 24.32c0-2.2 2.18-3.03 5.26-3.03 3.66 0 7.3 1.42 9.69 2.85l.2.12.34-.25c.27-.2.55-.43.83-.67l.27-.24-.12-.18c-2.94-4.54-8.24-5.92-11.23-5.92-6.09 0-9.17 3.05-9.17 8.84 0 5.58 2.65 8.23 7.55 10.45l2.68 1.22c3.13 1.43 4.57 2.35 4.57 4.3 0 1.89-1.77 2.77-4.57 2.77-3.05 0-6.13-1.13-8.35-2.38l-.18-.1-.3.23a12.72 12.72 0 0 1-.8.56l-.24.15.12.18c2.94 4.54 8.24 5.92 11.23 5.92 6.09 0 9.17-3.05 9.17-8.84z" fill="#6772E5"/>
                            </svg>
                            ${t.title}
                        </h3>
                        <span style="font-weight: 800; color: var(--accent-primary); font-size: 1.15rem;">${t.price}</span>
                    </div>

                    <form id="stripe-checkout-form" style="display: flex; flex-direction: column;">
                        <div class="stripe-field-group">
                            <label>Email</label>
                            <input type="email" class="stripe-input" required placeholder="tu@email.com">
                        </div>

                        <div class="stripe-field-group">
                            <label>${t.cardLabel}</label>
                            <div style="position: relative;">
                                <input type="text" class="stripe-input" id="stripe-card-number" required placeholder="4242 4242 4242 4242" maxlength="19">
                                <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 1.2rem;">💳</span>
                            </div>
                        </div>

                        <div class="stripe-row">
                            <div class="stripe-field-group">
                                <label>MM/AA</label>
                                <input type="text" class="stripe-input" id="stripe-card-expiry" required placeholder="12/28" maxlength="5">
                            </div>
                            <div class="stripe-field-group">
                                <label>CVC</label>
                                <input type="text" class="stripe-input" id="stripe-card-cvc" required placeholder="123" maxlength="4">
                            </div>
                        </div>

                        <div class="stripe-badge-secure">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>${t.secureText}</span>
                        </div>

                        <button type="submit" id="stripe-submit-btn" class="btn" style="background: #10b981; color: #fff !important; width: 100%; padding: 0.9rem; border-radius: 8px; border: none; font-weight: 700; font-size: 1rem; cursor: pointer; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
                            ${t.btnPay}
                        </button>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);

            const close = () => {
                modal.classList.add('hidden');
                setTimeout(() => modal.remove(), 300);
            };

            document.getElementById('stripe-checkout-close').addEventListener('click', close);

            // Simple format validations for inputs
            const cardNum = document.getElementById('stripe-card-number');
            cardNum.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                val = val.match(/.{1,4}/g)?.join(' ') || val;
                e.target.value = val.substring(0, 19);
            });

            const expiry = document.getElementById('stripe-card-expiry');
            expiry.addEventListener('input', (e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 2) {
                    val = val.substring(0, 2) + '/' + val.substring(2, 4);
                }
                e.target.value = val;
            });

            const cvc = document.getElementById('stripe-card-cvc');
            cvc.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
            });

            // Form Submit Simulation
            document.getElementById('stripe-checkout-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = document.getElementById('stripe-submit-btn');
                btn.disabled = true;
                btn.style.opacity = '0.8';
                btn.innerHTML = `<span class="stripe-spinner"></span> Procesando...`;

                setTimeout(() => {
                    // Activate PRO membership
                    localStorage.setItem('isUnlimited', 'true');
                    updateHeaderProBadge();

                    // Play success audio synthesizers
                    if (window.playPopSoundExternal) {
                        try {
                            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                            const triggerTone = (freq, dur, vol) => {
                                const osc = audioCtx.createOscillator();
                                const gain = audioCtx.createGain();
                                osc.connect(gain); gain.connect(audioCtx.destination);
                                osc.frequency.value = freq; gain.gain.setValueAtTime(vol, audioCtx.currentTime);
                                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
                                osc.start(); osc.stop(audioCtx.currentTime + dur);
                            };
                            triggerTone(523.25, 0.12, 0.2);
                            setTimeout(() => triggerTone(659.25, 0.14, 0.2), 70);
                            setTimeout(() => triggerTone(783.99, 0.22, 0.2), 140);
                        } catch(err) {}
                    }

                    alert(lang === 'es' ? '¡Gracias! Tu Pase Ilimitado de Procesamiento Masivo ha sido activado con éxito. 🎉' : 'Thank you! Your Unlimited Batch Pass has been successfully activated. 🎉');
                    
                    close();

                    // Process all original files
                    const dt = new DataTransfer();
                    incomingFiles.forEach(file => {
                        dt.items.add(file);
                    });

                    if (eventType === 'change') {
                        targetElement.files = dt.files;
                        const bypassEvent = new Event('change', { bubbles: true });
                        bypassEvent.isFreemiumBypass = true;
                        targetElement.dispatchEvent(bypassEvent);
                    } else {
                        const bypassEvent = new DragEvent('drop', {
                            bubbles: true,
                            cancelable: true,
                            dataTransfer: dt
                        });
                        bypassEvent.isFreemiumBypass = true;
                        targetElement.dispatchEvent(bypassEvent);
                    }
                }, 1500);
            });
        }
    }

    function setupThankYouModalMonetization() {
        const modal = document.getElementById('thank-you-modal');
        if (!modal) return;

        const lang = document.documentElement.lang || 'es';
        const canvaLink = "https://partner.canva.com/c/3412534/647168/10068";
        const fiverrLink = "https://fiverr.com";

        const content = {
            es: {
                title: '🎉 ¡Imagen Guardada!',
                text: 'Tu descarga ha comenzado con éxito.',
                canva: '🎨 <strong>¿Convertiste tu imagen?</strong> Crea un diseño increíble o edítala gratis en <strong>Canva Pro</strong>.',
                canvaBtn: 'Diseñar Gratis en Canva',
                fiverr: '✨ <strong>¿Necesitas más calidad?</strong> Contrata a un diseñador profesional para retoques en Fiverr desde $5.',
                fiverrBtn: 'Buscar Diseñador en Fiverr',
                adLabel: 'Anuncio Patrocinado'
            },
            en: {
                title: '🎉 Image Saved!',
                text: 'Your download has successfully started.',
                canva: '🎨 <strong>Image converted!</strong> Create an amazing design or edit it for free in <strong>Canva Pro</strong>.',
                canvaBtn: 'Design Free on Canva',
                fiverr: '✨ <strong>Need better quality?</strong> Hire a professional designer to retouch your image starting at $5 on Fiverr.',
                fiverrBtn: 'Find Designers on Fiverr',
                adLabel: 'Sponsored Advertisement'
            },
            ja: {
                title: '🎉 画像を保存しました！',
                text: 'ダウンロードが正常に開始されました。',
                canva: '🎨 <strong>変換完了！</strong> <strong>Canva Pro</strong> でこの画像を使って素晴らしいデザインを無料で作成しましょう。',
                canvaBtn: 'Canvaで無料デザイン',
                fiverr: '✨ <strong>画質を向上させたいですか？</strong> Fiverrで5ドルからプロのデザイナーにレタッチを依頼できます。',
                fiverrBtn: 'Fiverrでデザイナーを探す',
                adLabel: 'スポンサー広告'
            },
            zh: {
                title: '🎉 图片已保存！',
                text: '您的下载已成功开始。',
                canva: '🎨 <strong>图片已转换！</strong> 使用此图片在 <strong>Canva Pro</strong> 中免费创建精美设计或进行编辑。',
                canvaBtn: '在Canva免费设计',
                fiverr: '✨ <strong>需要更高品质？</strong> 在 Fiverr 上只需 5 美元起即可聘请专业设计师为您修图。',
                fiverrBtn: '在Fiverr寻找设计师',
                adLabel: '赞助广告'
            }
        };

        const t = content[lang] || content['es'];

        const injectContent = () => {
            modal.innerHTML = `
                <div class="modal-card success-pulse" style="max-width: 500px;">
                    <button id="close-modal-btn" class="modal-close-btn" aria-label="Close window">&times;</button>
                    <div class="modal-content" style="padding: 1.5rem 1rem 0.5rem 1rem; box-sizing: border-box;">
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem; text-align: center;">🎉</div>
                        <h3 class="modal-title" style="text-align: center; margin-bottom: 0.5rem; font-family: var(--font-heading); font-weight: 700;">${t.title}</h3>
                        <p class="modal-text" style="text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.95rem;">${t.text}</p>
                        
                        <!-- Dynamic Native AdSense Unit -->
                        <div class="modal-adsense-container" style="margin: 1rem 0 1.5rem 0; text-align: center; background: var(--card-bg); border: 1px dashed var(--card-border); padding: 0.75rem; border-radius: 8px; box-sizing: border-box;">
                            <span style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.5rem; letter-spacing: 0.05em;">${t.adLabel}</span>
                            <ins class="adsbygoogle"
                                 style="display:inline-block;width:320px;height:100px"
                                 data-ad-client="ca-pub-4529923995739017"
                                 data-ad-slot="9012482390"
                                 data-full-width-responsive="true"></ins>
                            <script>
                                 try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) {}
                            </script>
                        </div>

                        <!-- Canva & Fiverr Contextual Affiliates -->
                        <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem;">
                            <div style="background: rgba(167, 139, 250, 0.08); border: 1px solid var(--accent-primary); border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; box-sizing: border-box;">
                                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4; color: var(--text-primary); text-align: left;">${t.canva}</p>
                                <a href="${canvaLink}" target="_blank" rel="noopener noreferrer" class="btn" style="background: var(--accent-primary); color: #fff !important; width: 100%; text-align: center; font-size: 0.85rem; padding: 0.6rem; border-radius: 6px; font-weight: 600; text-decoration: none; display: block; box-sizing: border-box;">${t.canvaBtn}</a>
                            </div>

                            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid #10b981; border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; box-sizing: border-box;">
                                <p style="margin: 0; font-size: 0.9rem; line-height: 1.4; color: var(--text-primary); text-align: left;">${t.fiverr}</p>
                                <a href="${fiverrLink}" target="_blank" rel="noopener noreferrer" class="btn" style="background: #10b981; color: #fff !important; width: 100%; text-align: center; font-size: 0.85rem; padding: 0.6rem; border-radius: 6px; font-weight: 600; text-decoration: none; display: block; box-sizing: border-box;">${t.fiverrBtn}</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const closeBtn = modal.querySelector('#close-modal-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        };

        // MutationObserver to capture modal being opened and inject dynamically
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && !modal.classList.contains('hidden')) {
                    injectContent();
                }
            });
        });
        observer.observe(modal, { attributes: true });
    }

    function updateHeaderProBadge() {
        const isUnlimited = localStorage.getItem('isUnlimited') === 'true';
        if (!isUnlimited) return;

        const logo = document.querySelector('.logo');
        if (logo && !document.getElementById('pro-badge')) {
            const badge = document.createElement('span');
            badge.id = 'pro-badge';
            badge.className = 'pro-badge';
            badge.innerHTML = 'PRO';
            badge.style.cssText = `
                background: linear-gradient(135deg, #a78bfa, #8b5cf6);
                color: #fff;
                font-size: 0.65rem;
                padding: 2px 6px;
                border-radius: 9999px;
                margin-left: 8px;
                font-weight: 800;
                letter-spacing: 0.05em;
                display: inline-flex;
                align-items: center;
                box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
                vertical-align: middle;
            `;
            logo.appendChild(badge);
        }
    }

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const theme = savedTheme || getSystemTheme();
        document.documentElement.className = theme + '-theme';
        document.addEventListener('DOMContentLoaded', () => {
            document.body.className = theme + '-theme';
            setupThemeToggler();
            setupMobileMenu();
            setupGlobalSearch();
            setupShareFAB();
            setupGlobalZIP();
            setupPWAInstall();
            setupSmartDropzone();
            setupThankYouModalMonetization();
            updateHeaderProBadge();

            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker registered successfully'))
                    .catch(err => console.error('Service Worker registration failed:', err));
            }
        });
    }

    initTheme();
})();

