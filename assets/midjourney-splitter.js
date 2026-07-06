/**
 * My Local Picture - Midjourney Grid Splitter
 * Splits a 2x2 Midjourney grid image into 4 individual files locally.
 */
(function() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const convertAllBtn = document.getElementById('convert-all-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const fileCountSpan = document.getElementById('file-count');

    let filesArray = [];
    const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('/en/');
    const isJapanese = document.documentElement.lang === 'ja' || window.location.pathname.includes('/ja/');
    const isChinese = document.documentElement.lang === 'zh' || window.location.pathname.includes('/zh/');

    // Initializer
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFiles(files);
            }
        });
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFiles(files);
        }
    }

    function processFiles(files) {
        // Enforce Freemium batch limit of 5 files
        const maxFiles = 5;
        const currentCount = filesArray.length;
        const incomingCount = files.length;
        const total = currentCount + incomingCount;
        
        const isUnlimited = localStorage.getItem('isUnlimited') === 'true';
        
        let filesToProcess = Array.from(files);
        
        if (!isUnlimited && total > maxFiles) {
            const allowed = maxFiles - currentCount;
            if (allowed <= 0) {
                showFreemiumModal();
                return;
            }
            showFreemiumModal();
            filesToProcess = filesToProcess.slice(0, allowed);
        }

        filesToProcess.forEach(file => {
            if (file.type.match('image.*')) {
                addFileToQueue(file);
            } else {
                alert(isEnglish ? 'Please upload image files only.' : (isJapanese ? '画像ファイルのみをアップロードしてください。' : '请只上传图像文件。'));
            }
        });

        if (fileInput) fileInput.value = ''; // Reset input
    }

    function addFileToQueue(file) {
        const id = 'mj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const fileWrapper = {
            id: id,
            file: file,
            originalName: file.name,
            status: 'pending',
            convertedPages: [], // Array of {url, name}
            element: null
        };

        const fileCardTemplate = document.getElementById('file-card-template');
        if (!fileCardTemplate) return;

        const clone = document.importNode(fileCardTemplate.content, true);
        const card = clone.querySelector('.file-card');
        card.setAttribute('data-id', id);

        card.querySelector('.file-name').textContent = file.name;
        card.querySelector('.file-name').setAttribute('title', file.name);
        card.querySelector('.file-size').textContent = formatBytes(file.size);

        // Preview rendering
        const previewEl = card.querySelector('.file-preview');
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewEl) previewEl.src = e.target.result;
        };
        reader.readAsDataURL(file);

        const convertBtn = card.querySelector('.btn-action-convert');
        const removeBtn = card.querySelector('.btn-action-remove');

        if (convertBtn) {
            convertBtn.addEventListener('click', () => {
                splitMidjourneyGrid(fileWrapper);
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                removeFile(id);
            });
        }

        fileWrapper.element = card;
        filesArray.push(fileWrapper);
        fileList.appendChild(card);
        
        updateListVisibility();
    }

    function removeFile(id) {
        const idx = filesArray.findIndex(f => f.id === id);
        if (idx === -1) return;
        playPopSound();
        const f = filesArray[idx];
        f.convertedPages.forEach(p => URL.revokeObjectURL(p.url));
        f.element.remove();
        filesArray.splice(idx, 1);
        updateListVisibility();
    }

    function updateListVisibility() {
        if (fileCountSpan) {
            fileCountSpan.textContent = filesArray.length;
        }

        const dropzoneContainer = document.querySelector('.converter-card');
        if (filesArray.length > 0) {
            dropzoneContainer.classList.add('has-files');
        } else {
            dropzoneContainer.classList.remove('has-files');
        }

        updateGlobalActionButtons();
    }

    function updateGlobalActionButtons() {
        const hasPending = filesArray.some(f => f.status === 'pending');
        const hasDone = filesArray.some(f => f.status === 'done');

        if (convertAllBtn) {
            if (hasPending) {
                convertAllBtn.classList.remove('disabled');
                convertAllBtn.disabled = false;
            } else {
                convertAllBtn.classList.add('disabled');
                convertAllBtn.disabled = true;
            }
        }

        if (downloadAllBtn) {
            if (hasDone) {
                downloadAllBtn.classList.remove('disabled');
                downloadAllBtn.disabled = false;
            } else {
                downloadAllBtn.classList.add('disabled');
                downloadAllBtn.disabled = true;
            }
        }
    }

    async function splitMidjourneyGrid(fileWrapper) {
        if (fileWrapper.status === 'converting' || fileWrapper.status === 'done') return;

        playPopSound();
        const card = fileWrapper.element;
        const statusBadge = card.querySelector('.status-badge');
        const progressWrapper = card.querySelector('.file-progress-wrapper');
        const progressFill = card.querySelector('.progress-fill');
        const convertBtn = card.querySelector('.btn-action-convert');
        const downloadBtn = card.querySelector('.btn-action-download');

        fileWrapper.status = 'converting';
        updateGlobalActionButtons();

        statusBadge.className = 'status-badge badge-converting';
        statusBadge.textContent = isEnglish ? 'Processing...' : 'Procesando';
        progressWrapper.classList.remove('hidden');
        progressFill.style.width = '10%';
        if (convertBtn) convertBtn.classList.add('hidden');

        try {
            const img = new Image();
            const objectUrl = URL.createObjectURL(fileWrapper.file);

            const loadImage = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = reject;
            });
            img.src = objectUrl;
            await loadImage;

            progressFill.style.width = '30%';

            const w = img.naturalWidth / 2;
            const h = img.naturalHeight / 2;

            // Dimensions details update
            const dimsEl = card.querySelector('.file-dims');
            if (dimsEl) {
                dimsEl.textContent = `${img.naturalWidth}x${img.naturalHeight}px -> 4x ${w}x${h}px`;
            }

            const quadrants = [
                { x: 0, y: 0, suffix: '_Q1_top_left' },
                { x: w, y: 0, suffix: '_Q2_top_right' },
                { x: 0, y: h, suffix: '_Q3_bottom_left' },
                { x: w, y: h, suffix: '_Q4_bottom_right' }
            ];

            const pages = [];
            
            for (let i = 0; i < quadrants.length; i++) {
                const quad = quadrants[i];
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = w;
                canvas.height = h;

                // Crop and draw quadrant
                ctx.drawImage(img, quad.x, quad.y, w, h, 0, 0, w, h);

                // Use toBlob (which has the global 2.5s perceived progress patch in theme.js!)
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const url = URL.createObjectURL(blob);
                const name = fileWrapper.originalName.replace(/\.[^/.]+$/, "") + `${quad.suffix}.png`;

                pages.push({ url, name });
                progressFill.style.width = `${30 + (i + 1) * 15}%`;
            }

            fileWrapper.status = 'done';
            fileWrapper.convertedPages = pages;

            progressFill.style.width = '100%';
            setTimeout(() => {
                progressWrapper.classList.add('hidden');
                statusBadge.className = 'status-badge badge-done';
                statusBadge.textContent = isEnglish ? 'Ready' : 'Listo';

                if (downloadBtn) {
                    downloadBtn.classList.remove('hidden');
                    downloadBtn.style.cursor = 'pointer';
                    downloadBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        playPopSound();
                        
                        let delay = 0;
                        pages.forEach(p => {
                            setTimeout(() => {
                                const a = document.createElement('a');
                                a.href = p.url;
                                a.download = p.name;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                            }, delay);
                            delay += 300;
                        });
                        setTimeout(() => {
                            showThankYouModal();
                        }, delay + 100);
                    });
                }

                playSuccessChime();
                incrementConvertedStats();
                triggerConfetti(statusBadge);
                card.classList.add('success-pulse');
                setTimeout(() => card.classList.remove('success-pulse'), 800);
                updateGlobalActionButtons();
            }, 200);

            URL.revokeObjectURL(objectUrl);

        } catch (err) {
            console.error("Error splitting Midjourney grid:", err);
            fileWrapper.status = 'error';
            progressWrapper.classList.add('hidden');
            statusBadge.className = 'status-badge badge-error';
            statusBadge.textContent = 'Error';
            if (convertBtn) convertBtn.classList.remove('hidden');
            updateGlobalActionButtons();
        }
    }

    // Convert All Button Action
    if (convertAllBtn) {
        convertAllBtn.addEventListener('click', () => {
            const pending = filesArray.filter(f => f.status === 'pending');
            if (pending.length > 0) {
                playPopSound();
                pending.forEach(f => splitMidjourneyGrid(f));
            }
        });
    }

    // Download All (ZIP packaging)
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', async () => {
            const doneFiles = filesArray.filter(f => f.status === 'done' && f.convertedPages.length > 0);
            if (doneFiles.length === 0) return;

            playPopSound();
            downloadAllBtn.disabled = true;
            downloadAllBtn.classList.add('disabled');
            downloadAllBtn.textContent = isEnglish ? 'Zipping...' : (isJapanese ? '圧縮中...' : '正在打包...');

            try {
                // Ensure JSZip is loaded dynamically
                await loadJsZipLibrary();

                const zip = new JSZip();
                
                for (let i = 0; i < doneFiles.length; i++) {
                    const fileWrapper = doneFiles[i];
                    for (let j = 0; j < fileWrapper.convertedPages.length; j++) {
                        const page = fileWrapper.convertedPages[j];
                        const response = await fetch(page.url);
                        const blob = await response.blob();
                        zip.file(page.name, blob);
                    }
                }

                const content = await zip.generateAsync({ type: 'blob' });
                const zipUrl = URL.createObjectURL(content);
                
                const a = document.createElement('a');
                a.href = zipUrl;
                a.download = 'Midjourney_Split_Images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setTimeout(() => {
                    URL.revokeObjectURL(zipUrl);
                    showThankYouModal();
                    downloadAllBtn.disabled = false;
                    downloadAllBtn.classList.remove('disabled');
                    downloadAllBtn.textContent = isEnglish ? 'Download All (ZIP)' : (isJapanese ? 'すべてダウンロード (ZIP)' : '打包下载 (ZIP)');
                }, 1000);

            } catch (err) {
                console.error("Failed to generate ZIP file:", err);
                alert(isEnglish ? 'Failed to package files. Downloading individually.' : 'Error al empaquetar archivos. Descargando uno a uno.');
                
                let delay = 0;
                doneFiles.forEach(f => {
                    f.convertedPages.forEach(p => {
                        setTimeout(() => {
                            const a = document.createElement('a');
                            a.href = p.url;
                            a.download = p.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }, delay);
                        delay += 300;
                    });
                });
                downloadAllBtn.disabled = false;
                downloadAllBtn.classList.remove('disabled');
                downloadAllBtn.textContent = isEnglish ? 'Download All (ZIP)' : 'Descargar Todo (ZIP)';
            }
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (filesArray.length > 0) playPopSound();
            filesArray.forEach(f => {
                f.convertedPages.forEach(p => URL.revokeObjectURL(p.url));
            });
            fileList.innerHTML = '';
            filesArray = [];
            updateListVisibility();
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function loadJsZipLibrary() {
        if (window.JSZip) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            // Find prefix depth
            let depth = 0;
            const pathname = window.location.pathname;
            const match = pathname.match(/\//g);
            if (match) {
                depth = match.length - 1;
            }
            if (pathname.endsWith('/') || pathname.endsWith('.html')) {
                // If it ends with folder/ or file.html, matches correctly
            }
            
            let prefix = '';
            for (let i = 0; i < depth - 1; i++) {
                prefix += '../';
            }
            if (depth <= 1) {
                prefix = './';
            }
            
            script.src = prefix + 'assets/jszip.min.js';
            script.onload = resolve;
            script.onerror = () => {
                // Try fallback prefix
                script.src = '../assets/jszip.min.js';
                script.onload = resolve;
                script.onerror = reject;
            };
            document.head.appendChild(script);
        });
    }

    function showFreemiumModal() {
        if (window.showPremiumModal) {
            window.showPremiumModal();
        }
    }
})();
