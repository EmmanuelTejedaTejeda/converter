/**
 * My Local Picture - Client-side HEIC to JPG/PNG Converter
 * Uses heic2any library for local processing
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const fileCountSpan = document.getElementById('file-count');
    const convertAllBtn = document.getElementById('convert-all-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const statsCounter = document.getElementById('stats-counter');
    const statsNumber = document.getElementById('stats-number');
    const fileCardTemplate = document.getElementById('file-card-template');
    const thankYouModal = document.getElementById('thank-you-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // HEIC Options
    const formatSelectSection = document.getElementById('format-select-section');
    const targetFormatSelect = document.getElementById('target-format-select');

    // Language Detection
    const lang = document.documentElement.lang || 'es';
    const isEnglish = lang === 'en';
    const isChinese = lang === 'zh';
    const isJapanese = lang === 'ja';

    // App State
    let filesArray = [];
    let fileIdCounter = 0;
    
    // Audio State
    let audioCtx = null;
    let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    
    // Statistics State
    let totalConverted = parseInt(localStorage.getItem('totalConverted') || '0', 10);

    function initSoundToggle() {
        const volumeOnIcon = soundToggle.querySelector('.volume-on-icon');
        const volumeOffIcon = soundToggle.querySelector('.volume-off-icon');

        function updateSoundToggleUI() {
            if (soundEnabled) {
                if (volumeOnIcon) volumeOnIcon.classList.remove('hidden');
                if (volumeOffIcon) volumeOffIcon.classList.add('hidden');
                soundToggle.title = isEnglish ? 'Mute sound' : 'Desactivar sonido';
            } else {
                if (volumeOnIcon) volumeOnIcon.classList.add('hidden');
                if (volumeOffIcon) volumeOffIcon.classList.remove('hidden');
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
        if (!statsNumber || !statsCounter) return;
        statsNumber.textContent = totalConverted;
        if (animate) {
            statsCounter.classList.add('bump');
            setTimeout(() => {
                statsCounter.classList.remove('bump');
            }, 300);
        }
    }
    
    if (statsCounter) {
        updateStatsUI();
    }

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
            triggerTone(523.25, 0.12, 0.12);
            setTimeout(() => { triggerTone(659.25, 0.14, 0.12); }, 70);
            setTimeout(() => { triggerTone(783.99, 0.22, 0.15); }, 140);
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

    function incrementConvertedStats() {
        totalConverted++;
        localStorage.setItem('totalConverted', totalConverted);
        updateStatsUI(true);
        if (typeof gtag === 'function') {
            gtag('event', 'convert_image', {
                'tool': 'heic-to-jpg',
                'status': 'success'
            });
        }
    }

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

    // File Drag & Drop Handlers
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
        });
    }

    function handleFiles(files) {
        if (files.length > 0) {
            playPopSound();
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const nameLower = file.name.toLowerCase();
            if (nameLower.endsWith('.heic') || nameLower.endsWith('.heif')) {
                addFileToList(file);
            } else {
                console.warn('Invalid file type skipped:', file.name);
            }
        }
        if (fileInput) fileInput.value = '';
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function addFileToList(file) {
        const id = fileIdCounter++;
        const fileWrapper = {
            id,
            file,
            originalName: file.name,
            originalSize: file.size,
            status: 'pending',
            convertedBlobUrl: null,
            convertedBlobName: null,
            element: null
        };

        const clone = document.importNode(fileCardTemplate.content, true);
        const card = clone.querySelector('.file-card');
        card.setAttribute('data-id', id);

        card.querySelector('.file-name').textContent = file.name;
        card.querySelector('.file-name').setAttribute('title', file.name);
        card.querySelector('.file-size').textContent = formatBytes(file.size);

        // HEIC cannot be previewed natively in img tag. Use fallback.
        const previewEl = card.querySelector('.file-preview');
        previewEl.classList.add('hidden'); // This auto-displays the SVG fallback because of CSS rule

        const dimsEl = card.querySelector('.file-dims');
        dimsEl.textContent = '-- x -- px';

        const convertBtn = card.querySelector('.btn-action-convert');
        const removeBtn = card.querySelector('.btn-action-remove');

        convertBtn.addEventListener('click', () => {
            convertHeic(fileWrapper);
        });

        removeBtn.addEventListener('click', () => {
            removeFile(id);
        });

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
        if (f.convertedBlobUrl) URL.revokeObjectURL(f.convertedBlobUrl);
        f.element.remove();
        filesArray.splice(idx, 1);
        updateListVisibility();
    }

    function clearAllFiles() {
        if (filesArray.length > 0) {
            playPopSound();
        }
        filesArray.forEach(fileWrapper => {
            if (fileWrapper.convertedBlobUrl) {
                URL.revokeObjectURL(fileWrapper.convertedBlobUrl);
            }
        });
        fileList.innerHTML = '';
        filesArray = [];
        updateListVisibility();
    }

    function updateListVisibility() {
        if (fileCountSpan) {
            fileCountSpan.textContent = filesArray.length;
        }
        if (filesArray.length > 0) {
            fileListContainer.classList.remove('hidden');
            if (formatSelectSection) formatSelectSection.classList.remove('hidden');
        } else {
            fileListContainer.classList.add('hidden');
            if (formatSelectSection) formatSelectSection.classList.add('hidden');
        }
        updateGlobalActionButtons();
    }

    function updateGlobalActionButtons() {
        const hasPending = filesArray.some(f => f.status === 'pending');
        const hasDone = filesArray.some(f => f.status === 'done');
        
        if (convertAllBtn) {
            convertAllBtn.disabled = !hasPending;
            if (hasPending) {
                convertAllBtn.classList.remove('disabled');
            } else {
                convertAllBtn.classList.add('disabled');
            }
        }
        
        if (downloadAllBtn) {
            downloadAllBtn.disabled = !hasDone;
            if (hasDone) {
                downloadAllBtn.classList.remove('disabled');
            } else {
                downloadAllBtn.classList.add('disabled');
            }
        }
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFiles);
    }

    async function convertHeic(fileWrapper) {
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

        // Update UI status badges
        statusBadge.className = 'status-badge badge-converting';
        if (isEnglish) statusBadge.textContent = 'Converting...';
        else if (isChinese) statusBadge.textContent = '转换中...';
        else if (isJapanese) statusBadge.textContent = '変換中...';
        else statusBadge.textContent = 'Convertiendo';

        progressWrapper.classList.remove('hidden');
        progressFill.style.width = '15%';
        if (convertBtn) convertBtn.classList.add('hidden');

        // Check format
        const selectedFormat = targetFormatSelect ? targetFormatSelect.value : 'jpeg';
        const toType = 'image/' + selectedFormat;
        const extension = '.' + (selectedFormat === 'jpeg' ? 'jpg' : selectedFormat);

        // Check if library is available
        if (typeof heic2any !== 'function') {
            console.error('heic2any library is not loaded');
            handleConversionError(fileWrapper, 'heic2any library not loaded');
            return;
        }

        try {
            // Update progress (40%)
            progressFill.style.width = '40%';
            
            // Execute conversion using the library
            const convertedResult = await heic2any({
                blob: fileWrapper.file,
                toType: toType,
                quality: selectedFormat === 'jpeg' ? 0.85 : undefined
            });

            progressFill.style.width = '80%';

            // heic2any returns a Blob or array of Blobs
            const blob = Array.isArray(convertedResult) ? convertedResult[0] : convertedResult;

            if (blob) {
                const objectUrl = URL.createObjectURL(blob);
                const newName = fileWrapper.originalName.replace(/\.(heic|heif)$/i, '') + extension;

                fileWrapper.status = 'done';
                fileWrapper.convertedBlobUrl = objectUrl;
                fileWrapper.convertedBlobName = newName;

                progressFill.style.width = '100%';

                setTimeout(() => {
                    progressWrapper.classList.add('hidden');
                    statusBadge.className = 'status-badge badge-done';
                    
                    if (isEnglish) statusBadge.textContent = 'Ready';
                    else if (isChinese) statusBadge.textContent = '完成';
                    else if (isJapanese) statusBadge.textContent = '完了';
                    else statusBadge.textContent = 'Listo';

                    // Update preview and resolution
                    const previewEl = card.querySelector('.file-preview');
                    const dimsEl = card.querySelector('.file-dims');
                    
                    previewEl.src = objectUrl;
                    previewEl.classList.remove('hidden');

                    const imgObj = new Image();
                    imgObj.onload = () => {
                        dimsEl.textContent = `${imgObj.width} x ${imgObj.height} px`;
                    };
                    imgObj.src = objectUrl;

                    // Setup Download Link
                    if (downloadBtn) {
                        downloadBtn.href = objectUrl;
                        downloadBtn.download = newName;
                        downloadBtn.classList.remove('hidden');
                        
                        // Add single click tracking & modal display
                        const singleDownloadHandler = () => {
                            playPopSound();
                            showThankYouModal();
                        };
                        downloadBtn.addEventListener('click', singleDownloadHandler);
                    }

                    playSuccessChime();
                    incrementConvertedStats();
                    triggerConfetti(statusBadge);

                    card.classList.add('success-pulse');
                    setTimeout(() => card.classList.remove('success-pulse'), 800);

                    updateGlobalActionButtons();
                }, 300);

            } else {
                throw new Error('Blob creation resulted in empty output');
            }

        } catch (error) {
            console.error('HEIC conversion failed:', error);
            handleConversionError(fileWrapper, error.message);
        }
    }

    function handleConversionError(fileWrapper, errorMessage) {
        fileWrapper.status = 'error';
        const card = fileWrapper.element;
        const statusBadge = card.querySelector('.status-badge');
        const progressWrapper = card.querySelector('.file-progress-wrapper');
        const convertBtn = card.querySelector('.btn-action-convert');

        progressWrapper.classList.add('hidden');
        statusBadge.className = 'status-badge badge-error';
        statusBadge.textContent = 'Error';
        if (convertBtn) convertBtn.classList.remove('hidden');
        
        updateGlobalActionButtons();
    }

    // Convert all trigger
    if (convertAllBtn) {
        convertAllBtn.addEventListener('click', () => {
            const pendingFiles = filesArray.filter(f => f.status === 'pending');
            if (pendingFiles.length > 0) {
                playPopSound();
                pendingFiles.forEach(fileWrapper => {
                    convertHeic(fileWrapper);
                });
            }
        });
    }

    // Download all trigger
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => {
            const doneFiles = filesArray.filter(f => f.status === 'done' && f.convertedBlobUrl);
            if (doneFiles.length > 0) {
                playPopSound();
                let delay = 0;
                doneFiles.forEach(fileWrapper => {
                    setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = fileWrapper.convertedBlobUrl;
                        link.download = fileWrapper.convertedBlobName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }, delay);
                    delay += 300;
                });

                setTimeout(() => {
                    showThankYouModal();
                }, delay + 100);
            }
        });
    }

    // Thank You Modal
    function showThankYouModal() {
        if (thankYouModal) {
            thankYouModal.classList.remove('hidden');
        }
    }

    function hideThankYouModal() {
        if (thankYouModal) {
            thankYouModal.classList.add('hidden');
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideThankYouModal);
    }

    if (thankYouModal) {
        thankYouModal.addEventListener('click', (e) => {
            if (e.target === thankYouModal) {
                hideThankYouModal();
            }
        });
    }
});

