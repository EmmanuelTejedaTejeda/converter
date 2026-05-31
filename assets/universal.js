/**
 * Convertify - Client-side Universal Image Converter
 * Pure Vanilla JavaScript with HTML5 Canvas and Binary ICO Packing
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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
    
    // Universal Config
    const formatSelectSection = document.getElementById('format-select-section');
    const targetFormatSelect = document.getElementById('target-format-select');

    // Language Detection
    const lang = document.documentElement.lang || 'es';
    const isEnglish = lang === 'en';

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
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
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
            
            if (Math.random() > 0.5) particle.style.borderRadius = '50%';
            const size = Math.random() * 7 + 4 + 'px';
            particle.style.width = size;
            particle.style.height = size;
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            
            document.body.appendChild(particle);
            setTimeout(() => { particle.remove(); }, 1000);
        }
    }

    // Drag and Drop
    if (dropZone) {
        dropZone.addEventListener('click', (e) => {
            if (e.target !== fileInput) fileInput.click();
        });

        ['dragenter', 'dragover'].forEach(name => {
            dropZone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(name => {
            dropZone.addEventListener(name, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            handleFiles(e.dataTransfer.files);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            fileInput.value = '';
        });
    }

    function handleFiles(files) {
        if (files.length === 0) return;
        let acceptedCount = 0;
        let rejectedCount = 0;

        Array.from(files).forEach(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const supported = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext) || file.type.startsWith('image/');
            if (supported) {
                addFileToList(file);
                acceptedCount++;
            } else {
                rejectedCount++;
            }
        });

        if (acceptedCount > 0) playPopSound();
        if (rejectedCount > 0) {
            const warningMsg = isEnglish 
                ? `Skipped ${rejectedCount} file(s) because they were not supported formats.`
                : `Se omitieron ${rejectedCount} archivo(s) porque no eran formatos de imagen compatibles.`;
            alert(warningMsg);
        }
        updateListVisibility();
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

        const previewEl = card.querySelector('.file-preview');
        const dimsEl = card.querySelector('.file-dims');
        const previewUrl = URL.createObjectURL(file);
        previewEl.src = previewUrl;

        const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type === 'image/svg+xml';

        if (isSvg) {
            // Read SVG to get dimensions
            const reader = new FileReader();
            reader.onload = (e) => {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, 'image/svg+xml');
                const svgNode = xmlDoc.getElementsByTagName('svg')[0];
                let w = 800, h = 600;
                if (svgNode) {
                    w = parseInt(svgNode.getAttribute('width'), 10) || w;
                    h = parseInt(svgNode.getAttribute('height'), 10) || h;
                }
                dimsEl.textContent = `${w} x ${h} px`;
                URL.revokeObjectURL(previewUrl);
            };
            reader.readAsText(file);
        } else {
            const imgObj = new Image();
            imgObj.onload = () => {
                dimsEl.textContent = `${imgObj.width} x ${imgObj.height} px`;
                URL.revokeObjectURL(previewUrl);
            };
            imgObj.onerror = () => {
                dimsEl.textContent = '-- x -- px';
                URL.revokeObjectURL(previewUrl);
            };
            imgObj.src = previewUrl;
        }

        const convertBtn = card.querySelector('.btn-action-convert');
        const removeBtn = card.querySelector('.btn-action-remove');

        convertBtn.addEventListener('click', () => {
            convertUniversal(fileWrapper);
        });

        removeBtn.addEventListener('click', () => {
            removeFile(id);
        });

        fileWrapper.element = card;
        filesArray.push(fileWrapper);
        fileList.appendChild(card);
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

    async function convertUniversal(fileWrapper) {
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
        progressFill.style.width = '20%';
        convertBtn.classList.add('hidden');

        const targetFormat = targetFormatSelect.value; // 'png', 'jpeg', 'webp', 'ico'

        const isSvg = fileWrapper.file.name.toLowerCase().endsWith('.svg') || fileWrapper.file.type === 'image/svg+xml';

        if (isSvg) {
            const reader = new FileReader();
            reader.onload = (e) => {
                progressFill.style.width = '50%';
                const svgText = e.target.result;
                const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                    progressFill.style.width = '70%';
                    processImageSource(fileWrapper, img, targetFormat, progressFill, statusBadge, progressWrapper, downloadBtn, card);
                    URL.revokeObjectURL(blobUrl);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(blobUrl);
                    handleError(fileWrapper);
                };
                img.src = blobUrl;
            };
            reader.readAsText(fileWrapper.file);
        } else {
            const img = new Image();
            const objectUrl = URL.createObjectURL(fileWrapper.file);
            img.onload = () => {
                progressFill.style.width = '50%';
                processImageSource(fileWrapper, img, targetFormat, progressFill, statusBadge, progressWrapper, downloadBtn, card);
                URL.revokeObjectURL(objectUrl);
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                handleError(fileWrapper);
            };
            img.src = objectUrl;
        }
    }

    async function processImageSource(fileWrapper, img, targetFormat, progressFill, statusBadge, progressWrapper, downloadBtn, card) {
        try {
            if (targetFormat === 'ico') {
                // ICO generation (16, 32, 48 pixels packed multi-resolution)
                const resolutions = [16, 32, 48];
                const pngBlobs = [];

                for (let size of resolutions) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = size;
                    canvas.height = size;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, size, size);
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                    pngBlobs.push(blob);
                }

                progressFill.style.width = '85%';
                const icoBlob = await packIco(pngBlobs, resolutions);
                const icoUrl = URL.createObjectURL(icoBlob);
                const icoName = fileWrapper.originalName.replace(/\.[^/.]+$/, "") + '.ico';

                finalizeConversion(fileWrapper, icoUrl, icoName, progressFill, statusBadge, progressWrapper, downloadBtn, card);
            } else {
                // Standard canvas formats (PNG, JPG, WebP)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth || img.width || 800;
                canvas.height = img.naturalHeight || img.height || 600;

                let mimeType = 'image/png';
                let extension = '.png';

                if (targetFormat === 'jpeg') {
                    mimeType = 'image/jpeg';
                    extension = '.jpg';
                    // Draw solid white background to avoid black details in case of input transparency
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                } else if (targetFormat === 'webp') {
                    mimeType = 'image/webp';
                    extension = '.webp';
                }

                ctx.drawImage(img, 0, 0);
                progressFill.style.width = '85%';

                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        const name = fileWrapper.originalName.replace(/\.[^/.]+$/, "") + extension;
                        finalizeConversion(fileWrapper, url, name, progressFill, statusBadge, progressWrapper, downloadBtn, card);
                    } else {
                        handleError(fileWrapper);
                    }
                }, mimeType, targetFormat === 'jpeg' ? 0.90 : 0.85);
            }
        } catch (e) {
            console.error(e);
            handleError(fileWrapper);
        }
    }

    function finalizeConversion(fileWrapper, url, name, progressFill, statusBadge, progressWrapper, downloadBtn, card) {
        fileWrapper.status = 'done';
        fileWrapper.convertedBlobUrl = url;
        fileWrapper.convertedBlobName = name;

        progressFill.style.width = '100%';
        setTimeout(() => {
            progressWrapper.classList.add('hidden');
            statusBadge.className = 'status-badge badge-done';
            statusBadge.textContent = isEnglish ? 'Ready' : 'Listo';

            downloadBtn.href = url;
            downloadBtn.download = name;
            downloadBtn.classList.remove('hidden');
            downloadBtn.addEventListener('click', () => {
                playPopSound();
                showThankYouModal();
            });

            playSuccessChime();
            incrementConvertedStats();
            triggerConfetti(statusBadge);
            card.classList.add('success-pulse');
            setTimeout(() => card.classList.remove('success-pulse'), 800);
            updateGlobalActionButtons();
        }, 200);
    }

    async function packIco(pngBlobs, resolutions) {
        const count = pngBlobs.length;
        const images = [];

        for (let i = 0; i < count; i++) {
            const blob = pngBlobs[i];
            const buffer = await blob.arrayBuffer();
            images.push({
                width: resolutions[i],
                height: resolutions[i],
                size: buffer.byteLength,
                buffer: new Uint8Array(buffer)
            });
        }

        const headerSize = 6 + 16 * count;
        let totalSize = headerSize;
        for (const img of images) {
            totalSize += img.size;
        }

        const icoBytes = new Uint8Array(totalSize);
        const view = new DataView(icoBytes.buffer);

        // Header
        view.setUint16(0, 0, true);
        view.setUint16(2, 1, true);
        view.setUint16(4, count, true);

        let currentOffset = headerSize;

        for (let i = 0; i < count; i++) {
            const img = images[i];
            const entryOffset = 6 + 16 * i;

            icoBytes[entryOffset] = img.width >= 256 ? 0 : img.width;
            icoBytes[entryOffset + 1] = img.height >= 256 ? 0 : img.height;
            icoBytes[entryOffset + 2] = 0;
            icoBytes[entryOffset + 3] = 0;
            view.setUint16(entryOffset + 4, 1, true);
            view.setUint16(entryOffset + 6, 32, true);
            view.setUint32(entryOffset + 8, img.size, true);
            view.setUint32(entryOffset + 12, currentOffset, true);

            icoBytes.set(img.buffer, currentOffset);
            currentOffset += img.size;
        }

        return new Blob([icoBytes], { type: 'image/x-icon' });
    }

    function handleError(fileWrapper) {
        fileWrapper.status = 'error';
        const card = fileWrapper.element;
        const statusBadge = card.querySelector('.status-badge');
        const progressWrapper = card.querySelector('.file-progress-wrapper');
        const convertBtn = card.querySelector('.btn-action-convert');

        progressWrapper.classList.add('hidden');
        statusBadge.className = 'status-badge badge-error';
        statusBadge.textContent = 'Error';
        convertBtn.classList.remove('hidden');
        updateGlobalActionButtons();
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (filesArray.length > 0) playPopSound();
            filesArray.forEach(f => {
                if (f.convertedBlobUrl) URL.revokeObjectURL(f.convertedBlobUrl);
            });
            fileList.innerHTML = '';
            filesArray = [];
            updateListVisibility();
        });
    }

        if (convertAllBtn) {
        convertAllBtn.addEventListener('click', () => {
            const pending = filesArray.filter(f => f.status === 'pending');
            if (pending.length > 0) {
                playPopSound();
                pending.forEach(f => convertUniversal(f));
            }
        });
    }

    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => {
            const doneFiles = filesArray.filter(f => f.status === 'done' && f.convertedBlobUrl);
            if (doneFiles.length > 0) {
                playPopSound();
                let delay = 0;
                doneFiles.forEach(fileWrapper => {
                    setTimeout(() => {
                        const a = document.createElement('a');
                        a.href = fileWrapper.convertedBlobUrl;
                        a.download = fileWrapper.convertedBlobName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }, delay);
                    delay += 300;
                });
                setTimeout(() => {
                    showThankYouModal();
                }, delay + 100);
            }
        });
    }

    function showThankYouModal() {
        if (thankYouModal) thankYouModal.classList.remove('hidden');
    }

    function hideThankYouModal() {
        if (thankYouModal) thankYouModal.classList.add('hidden');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideThankYouModal);
    }

    if (thankYouModal) {
        thankYouModal.addEventListener('click', (e) => {
            if (e.target === thankYouModal) hideThankYouModal();
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
});
