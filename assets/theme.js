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
            gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-TQ5G8WJ3PH';
            document.head.appendChild(gtagScript);

            // Initialize GA configurations
            window.gtag('js', new Date());
            window.gtag('config', 'G-TQ5G8WJ3PH');

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
            setupShareFAB();
            setupGlobalZIP();
            setupPWAInstall();

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

