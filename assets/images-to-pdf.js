/**
 * Convertify - Client-side Images to PDF Converter
 * Pure Vanilla JavaScript with jsPDF API
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.body;
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const fileCountSpan = document.getElementById('file-count');
    const generatePdfBtn = document.getElementById('convert-all-btn'); // reusing standard ID for styling
    const clearAllBtn = document.getElementById('clear-all-btn');
    const previewAllBtn = document.getElementById('preview-all-btn'); // Global Preview
    const soundToggle = document.getElementById('sound-toggle');
    const statsCounter = document.getElementById('stats-counter');
    const statsNumber = document.getElementById('stats-number');
    const fileCardTemplate = document.getElementById('file-card-template');
    const thankYouModal = document.getElementById('thank-you-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Global Layout Editor Elements
    const layoutEditorModal = document.getElementById('layout-editor-modal');
    const closeLayoutModalBtn = document.getElementById('close-layout-modal-btn');
    const saveLayoutBtn = document.getElementById('save-layout-btn');
    const resetLayoutBtn = document.getElementById('reset-layout-btn');
    const layoutZoomRange = document.getElementById('layout-zoom-range');
    const layoutZoomBadge = document.getElementById('layout-zoom-badge');
    const previewPagesContainer = document.getElementById('preview-pages-container');
    
    // PDF Design Settings Elements
    const pageSizeSelect = document.getElementById('page-size');
    const pageOrientationSelect = document.getElementById('page-orientation');
    const pageMarginSelect = document.getElementById('page-margin');
    const pageFitSelect = document.getElementById('page-fit');
    const compressPdfCheck = document.getElementById('compress-pdf');
    const compressionSettings = document.getElementById('compression-settings');
    const qualityRange = document.getElementById('quality-range');
    const qualityBadge = document.getElementById('quality-badge');

    // Language Detection
    const isEnglish = document.documentElement.lang === 'en';

    // App State
    let filesArray = [];
    let fileIdCounter = 0;
    
    // Audio State
    let audioCtx = null;
    let soundEnabled = localStorage.getItem('soundEnabled') !== 'false'; // Default to true

    // Statistics State
    let totalConverted = parseInt(localStorage.getItem('totalConverted') || '0', 10);

    // Expose pop sound for theme.js external usage
    window.playPopSoundExternal = playPopSound;

    // Initialize UI
    if (compressPdfCheck && compressionSettings) {
        compressPdfCheck.addEventListener('change', () => {
            if (compressPdfCheck.checked) {
                compressionSettings.classList.remove('hidden');
            } else {
                compressionSettings.classList.add('hidden');
            }
        });
    }

    if (qualityRange && qualityBadge) {
        qualityRange.addEventListener('input', () => {
            qualityBadge.textContent = `${qualityRange.value}%`;
            if (qualityRange.value % 10 === 0) {
                playPopSound();
            }
        });
    }

    // ==========================================================================
    // Psychological Triggers (Audio ASMR & Confetti & Stats)
    // ==========================================================================
    
    function initAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playPopSound() {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.08);
            
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } catch (e) {
            console.warn('Audio synthesis failed:', e);
        }
    }

    function playSuccessChime() {
        if (!soundEnabled) return;
        try {
            initAudioContext();
            triggerTone(523.25, 0.12, 0.12); // C5
            setTimeout(() => {
                triggerTone(659.25, 0.14, 0.12); // E5
            }, 70);
            setTimeout(() => {
                triggerTone(783.99, 0.22, 0.15); // G5
            }, 140);
        } catch (e) {
            console.warn('Audio synthesis failed:', e);
        }
    }

    function triggerTone(frequency, duration, volume) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function initSoundToggle() {
        const volumeOnIcon = soundToggle.querySelector('.volume-on-icon');
        const volumeOffIcon = soundToggle.querySelector('.volume-off-icon');

        function updateSoundToggleUI() {
            if (soundEnabled) {
                volumeOnIcon.classList.remove('hidden');
                volumeOffIcon.classList.add('hidden');
                soundToggle.title = isEnglish ? 'Mute sound' : 'Desactivar sonido';
            } else {
                volumeOnIcon.classList.add('hidden');
                volumeOffIcon.classList.remove('hidden');
                soundToggle.title = isEnglish ? 'Enable sound' : 'Activar sonido';
            }
        }

        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('soundEnabled', soundEnabled);
            updateSoundToggleUI();
            if (soundEnabled) {
                playPopSound();
            }
        });

        updateSoundToggleUI();
    }

    if (soundToggle) {
        initSoundToggle();
    }

    function updateStatsUI(animate = false) {
        if (!statsNumber) return;
        statsNumber.textContent = totalConverted;
        if (animate && statsCounter) {
            statsCounter.classList.add('bump');
            setTimeout(() => {
                statsCounter.classList.remove('bump');
            }, 400);
        }
    }

    function incrementConvertedStats() {
        totalConverted++;
        localStorage.setItem('totalConverted', totalConverted);
        updateStatsUI(true);
    }

    updateStatsUI(false);

    function triggerConfetti(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const count = 30;
        const colors = ['#ff4f00', '#18181b', '#71717a', '#d4d4d8', '#faf9f5', '#ff7a00'];
        
        const startX = rect.left + rect.width / 2 + window.scrollX;
        const startY = rect.top + rect.height / 2 + window.scrollY;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('span');
            particle.className = 'confetti-particle';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.backgroundColor = color;
            
            const xVal = (Math.random() - 0.5) * 200 + 'px';
            const yVal = (Math.random() * -140) - 30 + 'px';
            const rVal = Math.random() * 360 + 'deg';
            const r2Val = Math.random() * 360 + 'deg';
            const r3Val = Math.random() * 360 + 'deg';
            
            particle.style.setProperty('--x', xVal);
            particle.style.setProperty('--y', yVal);
            particle.style.setProperty('--r', rVal);
            particle.style.setProperty('--r2', r2Val);
            particle.style.setProperty('--r3', r3Val);
            
            if (Math.random() > 0.5) {
                particle.style.borderRadius = '50%';
            }
            
            const size = Math.random() * 7 + 4 + 'px';
            particle.style.width = size;
            particle.style.height = size;
            
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    // ==========================================================================
    // File Drag & Drop Handlers
    // ==========================================================================
    if (dropZone) {
        dropZone.addEventListener('click', (e) => {
            if (e.target !== fileInput) {
                fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            fileInput.value = '';
        });
    }

    // ==========================================================================
    // File List Processing
    // ==========================================================================
    function handleFiles(files) {
        if (files.length === 0) return;

        const filesToProcess = Array.from(files);
        let acceptedCount = 0;
        let rejectedCount = 0;

        filesToProcess.forEach(file => {
            const isImage = file.type.startsWith('image/');
            if (isImage) {
                addFileToList(file);
                acceptedCount++;
            } else {
                rejectedCount++;
            }
        });

        if (acceptedCount > 0) {
            playPopSound();
        }

        if (rejectedCount > 0) {
            const warningMsg = isEnglish 
                ? `Skipped ${rejectedCount} file(s) because they were not images.`
                : `Se omitieron ${rejectedCount} archivo(s) porque no eran imágenes.`;
            alert(warningMsg);
        }

        updateListVisibility();

        if (acceptedCount > 0 && fileListContainer) {
            setTimeout(() => {
                fileListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    function addFileToList(file) {
        const id = fileIdCounter++;
        
        const fileWrapper = {
            id: id,
            file: file,
            originalName: file.name,
            originalSize: file.size,
            previewUrl: URL.createObjectURL(file),
            dimensions: null
        };

        const clone = document.importNode(fileCardTemplate.content, true);
        const card = clone.querySelector('.file-card');
        card.setAttribute('data-id', id);

        const nameEl = card.querySelector('.file-name');
        nameEl.textContent = file.name;
        nameEl.setAttribute('title', file.name);

        const sizeEl = card.querySelector('.file-size');
        sizeEl.textContent = formatBytes(file.size);

        const previewEl = card.querySelector('.file-preview');
        const dimsEl = card.querySelector('.file-dims');
        
        previewEl.src = fileWrapper.previewUrl;
        
        const imgObj = new Image();
        imgObj.onload = () => {
            fileWrapper.dimensions = { width: imgObj.width, height: imgObj.height };
            dimsEl.textContent = `${imgObj.width} x ${imgObj.height} px`;
        };
        imgObj.onerror = () => {
            dimsEl.textContent = '-- x -- px';
        };
        imgObj.src = fileWrapper.previewUrl;

        // Button Event Listeners
        const upBtn = card.querySelector('.btn-reorder-up');
        const downBtn = card.querySelector('.btn-reorder-down');
        const removeBtn = card.querySelector('.btn-action-remove');

        upBtn.addEventListener('click', () => {
            reorderFile(id, -1);
        });

        downBtn.addEventListener('click', () => {
            reorderFile(id, 1);
        });

        removeBtn.addEventListener('click', () => {
            removeFile(id);
        });

        filesArray.push(fileWrapper);
        fileList.appendChild(card);
        
        updateReorderButtonsUI();
    }

    function removeFile(id) {
        const index = filesArray.findIndex(f => f.id === id);
        if (index === -1) return;

        playPopSound();
        const fileWrapper = filesArray[index];
        URL.revokeObjectURL(fileWrapper.previewUrl);

        // Remove element from DOM
        const card = fileList.querySelector(`[data-id="${id}"]`);
        if (card) card.remove();

        filesArray.splice(index, 1);

        updateListVisibility();
        updateReorderButtonsUI();
    }

    function reorderFile(id, direction) {
        const index = filesArray.findIndex(f => f.id === id);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= filesArray.length) return;

        playPopSound();

        // Swap in array
        const temp = filesArray[index];
        filesArray[index] = filesArray[newIndex];
        filesArray[newIndex] = temp;

        // Rebuild DOM to match array order smoothly
        rebuildDOMList();
    }

    function rebuildDOMList() {
        // Detach card elements and append in new order
        filesArray.forEach(fileWrapper => {
            const card = fileList.querySelector(`[data-id="${fileWrapper.id}"]`);
            if (card) {
                fileList.appendChild(card);
            }
        });
        updateReorderButtonsUI();
    }

    function updateReorderButtonsUI() {
        const cards = fileList.querySelectorAll('.file-card');
        cards.forEach((card, index) => {
            const upBtn = card.querySelector('.btn-reorder-up');
            const downBtn = card.querySelector('.btn-reorder-down');
            
            if (upBtn) upBtn.disabled = (index === 0);
            if (downBtn) downBtn.disabled = (index === cards.length - 1);
        });
    }

    function clearAllFiles() {
        if (filesArray.length > 0) {
            playPopSound();
        }
        filesArray.forEach(fileWrapper => {
            URL.revokeObjectURL(fileWrapper.previewUrl);
        });
        
        fileList.innerHTML = '';
        filesArray = [];
        updateListVisibility();
    }

    function updateListVisibility() {
        if (filesArray.length > 0) {
            fileListContainer.classList.remove('hidden');
            fileCountSpan.textContent = filesArray.length;
        } else {
            fileListContainer.classList.add('hidden');
            fileCountSpan.textContent = '0';
        }
        updateGlobalActionButtons();
    }

    function updateGlobalActionButtons() {
        const hasFiles = filesArray.length > 0;
        generatePdfBtn.disabled = !hasFiles;
        if (previewAllBtn) previewAllBtn.disabled = !hasFiles;
        
        if (hasFiles) {
            generatePdfBtn.classList.remove('disabled');
            if (previewAllBtn) previewAllBtn.classList.remove('disabled');
        } else {
            generatePdfBtn.classList.add('disabled');
            if (previewAllBtn) previewAllBtn.classList.add('disabled');
        }
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFiles);
    }
    if (previewAllBtn) {
        previewAllBtn.addEventListener('click', openGlobalPreview);
    }

    // ==========================================================================
    // Images to PDF Core Logic (jsPDF)
    // ==========================================================================
    
    // Helper to load image asynchronously as HTMLImageElement
    function loadImageAsync(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image: ' + src));
            img.src = src;
        });
    }

    // Main PDF Generation function
    async function generatePdf() {
        if (filesArray.length === 0) return;
        
        // Safety: verify jsPDF library is loaded
        if (!window.jspdf || !window.jspdf.jsPDF) {
            const errorMsg = isEnglish 
                ? 'PDF library (jsPDF) is not loaded. Please check your internet connection and try again.'
                : 'La biblioteca de PDF (jsPDF) no se ha cargado. Verifica tu conexión a internet e inténtalo de nuevo.';
            alert(errorMsg);
            return;
        }

        playPopSound();
        
        // Show loading progress on button with staged artificial delays (psychological trust effect)
        const originalText = generatePdfBtn.innerHTML;
        generatePdfBtn.disabled = true;
        generatePdfBtn.classList.add('disabled');
        
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        try {
            // Stage 1: Processing images (0 - 500ms)
            generatePdfBtn.innerHTML = isEnglish ? 'Processing images...' : 'Procesando fotos...';
            await delay(500);

            // Stage 2: Assembling pages (500 - 1000ms)
            generatePdfBtn.innerHTML = isEnglish ? 'Assembling pages...' : 'Ensamblando páginas...';
            await delay(500);

            // Stage 3: Saving PDF (1000 - 1300ms)
            generatePdfBtn.innerHTML = isEnglish ? 'Saving PDF...' : 'Guardando PDF...';
            await delay(300);
            const { jsPDF } = window.jspdf;
            let doc = null;

            // Retrieve configuration values
            const configSize = pageSizeSelect.value; // 'auto', 'a4', 'letter'
            const configOrientation = pageOrientationSelect.value; // 'auto', 'p', 'l'
            const configMarginVal = parseInt(pageMarginSelect.value, 10); // 0, 10, 20
            const configFit = pageFitSelect ? pageFitSelect.value : 'contain';
            const shouldCompress = compressPdfCheck.checked;
            const compressQuality = shouldCompress ? (parseInt(qualityRange.value, 10) / 100) : 1.0;

            for (let i = 0; i < filesArray.length; i++) {
                const fileWrapper = filesArray[i];
                const img = await loadImageAsync(fileWrapper.previewUrl);
                
                const imgW = img.naturalWidth || img.width;
                const imgH = img.naturalHeight || img.height;

                // 1. Calculate Page Orientation (Auto or manual)
                let orientation = configOrientation;
                if (orientation === 'auto') {
                    orientation = imgW >= imgH ? 'l' : 'p';
                }

                // 2. Calculate Page Size in points (pt). 1 inch = 72 pt = 25.4 mm.
                // mm = pt * 25.4 / 72. pt = mm * 72 / 25.4.
                let pageW = 0;
                let pageH = 0;

                if (configSize === 'auto') {
                    // Let page size match the image at a standard 96 DPI resolution (0.75 ratio)
                    pageW = imgW * 0.75;
                    pageH = imgH * 0.75;
                } else if (configSize === 'a4') {
                    // A4 standard: 210 x 297 mm = 595 x 842 pt
                    pageW = orientation === 'p' ? 595.28 : 842.89;
                    pageH = orientation === 'p' ? 842.89 : 595.28;
                } else if (configSize === 'letter') {
                    // Letter standard: 8.5 x 11 inches = 612 x 792 pt
                    pageW = orientation === 'p' ? 612 : 792;
                    pageH = orientation === 'p' ? 792 : 612;
                }

                // Convert margin from mm to points (1 mm = 2.8346 pt)
                const margin = configMarginVal * 2.8346;

                // Initialize document on first loop, or add page on subsequent loops
                if (i === 0) {
                    doc = new jsPDF({
                        orientation: orientation,
                        unit: 'pt',
                        format: [pageW, pageH]
                    });
                } else {
                    doc.addPage([pageW, pageH], orientation);
                }

                // 3. Calculate scales and placement coordinates inside margins
                const printableW = pageW - (margin * 2);
                const printableH = pageH - (margin * 2);

                let finalW, finalH, x, y;

                if (fileWrapper.customTransform && fileWrapper.simWidthOnSave) {
                    // Apply visual editor transformations
                    const physicalToUiRatio = printableW / fileWrapper.simWidthOnSave;
                    
                    const baseScaleX = printableW / imgW;
                    const baseScaleY = printableH / imgH;
                    const baseScale = Math.min(baseScaleX, baseScaleY); // matches object-fit: contain
                    
                    finalW = imgW * baseScale * fileWrapper.customTransform.scale;
                    finalH = imgH * baseScale * fileWrapper.customTransform.scale;
                    
                    const centerPtX = margin + (printableW / 2);
                    const centerPtY = margin + (printableH / 2);
                    
                    const offsetPtX = fileWrapper.customTransform.x * physicalToUiRatio;
                    const offsetPtY = fileWrapper.customTransform.y * physicalToUiRatio;
                    
                    x = centerPtX + offsetPtX - (finalW / 2);
                    y = centerPtY + offsetPtY - (finalH / 2);
                } else {
                    // Standard auto-fit mode
                    const scaleX = printableW / imgW;
                    const scaleY = printableH / imgH;
                    
                    // If fit is 'cover', we use max instead of min to fill the area, cropping what overflows
                    const scale = configFit === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

                    finalW = imgW * scale;
                    finalH = imgH * scale;

                    // Center in printable area
                    x = margin + (printableW - finalW) / 2;
                    y = margin + (printableH - finalH) / 2;
                }

                // 4. Format/Compress Image
                let finalImgSrc = img;
                let mimeType = 'JPEG';

                // Paint white canvas background and save to JPEG dataURL if compressed
                if (shouldCompress) {
                    const canvas = document.createElement('canvas');
                    canvas.width = imgW;
                    canvas.height = imgH;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    finalImgSrc = canvas.toDataURL('image/jpeg', compressQuality);
                } else {
                    // Fallback to Canvas JPEG to strip transparency (avoid black backgrounds in jsPDF)
                    // or add standard JPEGs as is. Transparency in PNG/WEBP should be flattened onto white.
                    const isTransparent = fileWrapper.file.type === 'image/png' || 
                                          fileWrapper.file.type === 'image/webp';
                    if (isTransparent) {
                        const canvas = document.createElement('canvas');
                        canvas.width = imgW;
                        canvas.height = imgH;
                        const ctx = canvas.getContext('2d');
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        finalImgSrc = canvas.toDataURL('image/jpeg', 0.95);
                    }
                }

                // 5. Draw onto PDF page
                doc.addImage(finalImgSrc, mimeType, x, y, finalW, finalH, `img_${i}`);
            }

            // Save PDF document
            if (doc) {
                doc.save('convertify_document.pdf');
                playSuccessChime();
                triggerConfetti(generatePdfBtn);
                incrementConvertedStats();
                showThankYouModal();
            }

        } catch (error) {
            console.error('PDF Generation failed:', error);
            const failMsg = isEnglish
                ? 'Failed to generate PDF. Please try again.'
                : 'Error al generar el PDF. Por favor, inténtalo de nuevo.';
            alert(failMsg);
        } finally {
            // Restore button UI
            generatePdfBtn.disabled = false;
            generatePdfBtn.classList.remove('disabled');
            generatePdfBtn.innerHTML = originalText;
        }
    }

    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generatePdf);
    }

    // ==========================================================================
    // Support/Thank You Modal
    // ==========================================================================
    function showThankYouModal() {
        if (thankYouModal) {
            thankYouModal.classList.remove('hidden');
            thankYouModal.classList.add('fade-in');
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            playPopSound();
            thankYouModal.classList.add('hidden');
        });
    }

    if (thankYouModal) {
        thankYouModal.addEventListener('click', (e) => {
            if (e.target === thankYouModal) {
                playPopSound();
                thankYouModal.classList.add('hidden');
            }
        });
    }

    // Byte Formatter
    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // ==========================================================================
    // Visual Layout Editor Logic
    // ==========================================================================
    // (Variables already declared at the top of the file)
    
    let activeEditId = null;
    let editTransform = { x: 0, y: 0, scale: 1 };
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    
    if (closeLayoutModalBtn) {
        closeLayoutModalBtn.addEventListener('click', closeLayoutEditor);
    }
    
    if (closeLayoutModalBtn) {
        closeLayoutModalBtn.addEventListener('click', closeLayoutEditor);
    }
    if (saveLayoutBtn) {
        saveLayoutBtn.addEventListener('click', closeLayoutEditor);
    }
    
    function closeLayoutEditor() {
        if (layoutEditorModal) {
            layoutEditorModal.classList.add('hidden');
            activeEditId = null;
            playPopSound();
        }
    }

    async function openGlobalPreview() {
        if (!layoutEditorModal || filesArray.length === 0) return;
        
        previewPagesContainer.innerHTML = '';
        activeEditId = null;
        
        layoutZoomRange.disabled = true;
        resetLayoutBtn.disabled = true;
        layoutZoomBadge.textContent = '100%';
        layoutZoomRange.value = 100;

        const configSize = pageSizeSelect.value;
        const configOrientation = pageOrientationSelect.value;

        for (let i = 0; i < filesArray.length; i++) {
            const fileWrapper = filesArray[i];
            
            // Setup transform object if it doesn't exist
            if (!fileWrapper.customTransform) {
                fileWrapper.customTransform = { x: 0, y: 0, scale: 1 };
            }

            let ratio = 1 / 1.414; // Default portrait A4
            if (configSize === 'letter') ratio = 8.5 / 11;

            const img = await loadImageAsync(fileWrapper.previewUrl);
            const imgW = img.naturalWidth || img.width;
            const imgH = img.naturalHeight || img.height;

            let isLandscape = false;
            if (configOrientation === 'l' || (configOrientation === 'auto' && imgW >= imgH)) {
                isLandscape = true;
                ratio = 1 / ratio; // invert for landscape
            }

            if (configSize === 'auto') {
                ratio = imgW / imgH; 
            }

            // Size the simulated page
            const workspaceW = previewPagesContainer.clientWidth || 300;
            let simW = workspaceW * 0.9;
            let simH = simW / ratio;
            
            // Limit max height for better visibility
            if (simH > 800) {
                simH = 800;
                simW = simH * ratio;
            }

            fileWrapper.uiSimRatio = simW;

            // Build DOM
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-page-wrapper';
            
            const numberLabel = document.createElement('div');
            numberLabel.className = 'preview-page-number';
            numberLabel.textContent = isEnglish ? `Page ${i + 1}` : `Página ${i + 1}`;
            
            const simPage = document.createElement('div');
            simPage.className = 'simulated-page';
            simPage.style.width = `${simW}px`;
            simPage.style.height = `${simH}px`;
            
            const imgEl = document.createElement('img');
            imgEl.className = 'draggable-image';
            imgEl.src = fileWrapper.previewUrl;
            imgEl.draggable = false;
            
            const updateTransformUI = () => {
                imgEl.style.transform = `translate(calc(-50% + ${fileWrapper.customTransform.x}px), calc(-50% + ${fileWrapper.customTransform.y}px)) scale(${fileWrapper.customTransform.scale})`;
            };
            
            updateTransformUI();

            // Dragging Logic
            let isDragging = false;
            let dragStart = { x: 0, y: 0 };

            imgEl.addEventListener('pointerdown', (e) => {
                // Set as active
                document.querySelectorAll('.draggable-image').forEach(el => el.classList.remove('active-edit'));
                imgEl.classList.add('active-edit');
                activeEditId = fileWrapper.id;
                
                // Enable controls
                layoutZoomRange.disabled = false;
                resetLayoutBtn.disabled = false;
                layoutZoomRange.value = fileWrapper.customTransform.scale * 100;
                layoutZoomBadge.textContent = `${Math.round(fileWrapper.customTransform.scale * 100)}%`;

                // Start dragging
                isDragging = true;
                dragStart = { x: e.clientX - fileWrapper.customTransform.x, y: e.clientY - fileWrapper.customTransform.y };
                imgEl.setPointerCapture(e.pointerId);
            });

            imgEl.addEventListener('pointermove', (e) => {
                if (!isDragging) return;
                fileWrapper.customTransform.x = e.clientX - dragStart.x;
                fileWrapper.customTransform.y = e.clientY - dragStart.y;
                fileWrapper.simWidthOnSave = simW; // Update physical ratio reference dynamically
                updateTransformUI();
            });

            const stopDrag = (e) => {
                if (isDragging) {
                    isDragging = false;
                    imgEl.releasePointerCapture(e.pointerId);
                }
            };

            imgEl.addEventListener('pointerup', stopDrag);
            imgEl.addEventListener('pointercancel', stopDrag);

            simPage.appendChild(imgEl);
            wrapper.appendChild(numberLabel);
            wrapper.appendChild(simPage);
            previewPagesContainer.appendChild(wrapper);
        }

        // Auto-select the first image so the slider works immediately
        const firstImg = previewPagesContainer.querySelector('.draggable-image');
        if (firstImg && filesArray.length > 0) {
            firstImg.classList.add('active-edit');
            activeEditId = filesArray[0].id;
            layoutZoomRange.disabled = false;
            resetLayoutBtn.disabled = false;
            layoutZoomRange.value = filesArray[0].customTransform.scale * 100;
            layoutZoomBadge.textContent = `${Math.round(filesArray[0].customTransform.scale * 100)}%`;
        }

        // Add scroll hint if there are multiple pages
        if (filesArray.length > 1) {
            const scrollHint = document.createElement('div');
            scrollHint.className = 'scroll-hint-indicator';
            scrollHint.innerHTML = isEnglish 
                ? '↓ Scroll down to see more pages ↓' 
                : '↓ Haz scroll hacia abajo para ver más páginas ↓';
            // Insert it into the workspace so it is sticky at the bottom of the viewport
            const workspace = document.getElementById('canvas-workspace');
            if (workspace) {
                // Remove existing if any
                const existing = workspace.querySelector('.scroll-hint-indicator');
                if (existing) existing.remove();
                workspace.appendChild(scrollHint);
                
                // Hide scroll hint when user scrolls down
                workspace.addEventListener('scroll', function onScroll() {
                    if (workspace.scrollTop > 50) {
                        scrollHint.style.display = 'none';
                        workspace.removeEventListener('scroll', onScroll);
                    }
                });
            }
        }

        layoutEditorModal.classList.remove('hidden');
    };

    // Global Slider control
    if (layoutZoomRange) {
        layoutZoomRange.addEventListener('input', (e) => {
            if (!activeEditId) return;
            const fileWrapper = filesArray.find(f => f.id === activeEditId);
            if (fileWrapper) {
                fileWrapper.customTransform.scale = e.target.value / 100;
                layoutZoomBadge.textContent = `${e.target.value}%`;
                
                // Update UI visually
                const activeImg = document.querySelector(`.draggable-image.active-edit`);
                if (activeImg) {
                    activeImg.style.transform = `translate(calc(-50% + ${fileWrapper.customTransform.x}px), calc(-50% + ${fileWrapper.customTransform.y}px)) scale(${fileWrapper.customTransform.scale})`;
                }
            }
        });
    }

    if (resetLayoutBtn) {
        resetLayoutBtn.addEventListener('click', () => {
            if (!activeEditId) return;
            const fileWrapper = filesArray.find(f => f.id === activeEditId);
            if (fileWrapper) {
                fileWrapper.customTransform = { x: 0, y: 0, scale: 1 };
                layoutZoomRange.value = 100;
                layoutZoomBadge.textContent = '100%';
                
                // Update UI visually
                const activeImg = document.querySelector(`.draggable-image.active-edit`);
                if (activeImg) {
                    activeImg.style.transform = `translate(calc(-50% + 0px), calc(-50% + 0px)) scale(1)`;
                }
                playPopSound();
            }
        });
    }
});
