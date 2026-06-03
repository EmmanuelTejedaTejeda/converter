/**
 * Convertify - Client-side Interactive Image Cropper
 * Pure Vanilla JavaScript with HTML5 Canvas API
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
    
    // Crop Configuration
    const cropSection = document.getElementById('crop-section');
    const cropCanvas = document.getElementById('crop-canvas');
    const aspectRatioSelector = document.getElementById('aspect-ratio-selector');

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

    // Cropping State
    let currentImageElement = null; // Active original Image object
    let cropBox = { x: 50, y: 50, w: 200, h: 200 };
    let dragMode = -1; // -1: none, 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right, 4: move/drag box
    let dragStart = { x: 0, y: 0 };
    const handleSize = 10;

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
                'tool': 'crop-image',
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
        
        // Crop-image only handles ONE image at a time (since it's a manual crop tool)
        const file = files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        const isImage = ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext) || file.type.startsWith('image/');
        
        if (!isImage) {
            const warningMsg = isEnglish 
                ? "Format not supported. Please select an image file."
                : "Formato no compatible. Por favor, selecciona un archivo de imagen.";
            alert(warningMsg);
            return;
        }

        // Reset previous state
        clearAllFiles();
        playPopSound();
        addFileToList(file);
        updateListVisibility();
        
        // Initialize crop interface
        initCropSection(file);
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

        const convertBtn = card.querySelector('.btn-action-convert');
        const removeBtn = card.querySelector('.btn-action-remove');

        // Main conversion process is cropping
        convertBtn.addEventListener('click', () => {
            processCrop(fileWrapper);
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
        
        currentImageElement = null;
        if (cropSection) cropSection.classList.add('hidden');
        updateListVisibility();
    }

    function clearAllFiles() {
        filesArray.forEach(f => {
            if (f.convertedBlobUrl) URL.revokeObjectURL(f.convertedBlobUrl);
        });
        fileList.innerHTML = '';
        filesArray = [];
        currentImageElement = null;
        if (cropSection) cropSection.classList.add('hidden');
        updateListVisibility();
    }

    function updateListVisibility() {
        if (fileCountSpan) {
            fileCountSpan.textContent = filesArray.length;
        }
        if (filesArray.length > 0) {
            fileListContainer.classList.remove('hidden');
        } else {
            fileListContainer.classList.add('hidden');
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

    // Cropper Engine Initialization
    function initCropSection(file) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            currentImageElement = img;
            
            // Set responsive Canvas dimensions
            const containerWidth = Math.min(dropZone.clientWidth - 32, 600);
            const containerHeight = 400;
            const ratio = img.naturalWidth / img.naturalHeight;
            
            let displayW = img.naturalWidth;
            let displayH = img.naturalHeight;
            
            if (displayW > containerWidth) {
                displayW = containerWidth;
                displayH = displayW / ratio;
            }
            if (displayH > containerHeight) {
                displayH = containerHeight;
                displayW = displayH * ratio;
            }

            cropCanvas.width = displayW;
            cropCanvas.height = displayH;
            
            // Default Crop Box size (e.g. 70% centered)
            const boxW = Math.round(displayW * 0.7);
            const boxH = Math.round(displayH * 0.7);
            const boxX = Math.round((displayW - boxW) / 2);
            const boxY = Math.round((displayH - boxH) / 2);
            
            cropBox = { x: boxX, y: boxY, w: boxW, h: boxH };
            
            // Show section
            cropSection.classList.remove('hidden');
            
            drawCropCanvas();
            initCropControls();
            
            // Auto scroll to cropper
            setTimeout(() => {
                cropSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
        };
        img.src = url;
    }

    function drawCropCanvas() {
        if (!currentImageElement || !cropCanvas) return;
        
        const ctx = cropCanvas.getContext('2d');
        const w = cropCanvas.width;
        const h = cropCanvas.height;
        
        // 1. Draw original image scaled to canvas
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(currentImageElement, 0, 0, w, h);
        
        // 2. Draw dark semitransparent mask
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, w, h);
        
        // 3. Clear crop box region (unmask it)
        ctx.save();
        ctx.beginPath();
        ctx.rect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
        ctx.clip();
        ctx.drawImage(currentImageElement, 0, 0, w, h);
        ctx.restore();
        
        // 4. Draw crop box border
        ctx.strokeStyle = '#ff4f00'; // Brand primary color orange
        ctx.lineWidth = 2;
        ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);
        
        // 5. Draw 4 Corner Handles
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cropBox.x - handleSize/2, cropBox.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(cropBox.x + cropBox.w - handleSize/2, cropBox.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(cropBox.x - handleSize/2, cropBox.y + cropBox.h - handleSize/2, handleSize, handleSize);
        ctx.fillRect(cropBox.x + cropBox.w - handleSize/2, cropBox.y + cropBox.h - handleSize/2, handleSize, handleSize);
    }

    function getMousePos(e) {
        const rect = cropCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function initCropControls() {
        // Event Listeners for dragging and resizing
        cropCanvas.onmousedown = handleDragStart;
        cropCanvas.ontouchstart = handleDragStart;
        
        window.onmousemove = handleDragMove;
        window.ontouchmove = handleDragMove;
        
        window.onmouseup = handleDragEnd;
        window.ontouchend = handleDragEnd;
        
        aspectRatioSelector.onchange = () => {
            playPopSound();
            applyAspectRatio();
            drawCropCanvas();
        };
    }

    function handleDragStart(e) {
        if (!currentImageElement) return;
        const pos = getMousePos(e);
        
        // Check corners first
        const corners = [
            { x: cropBox.x, y: cropBox.y }, // Top-Left
            { x: cropBox.x + cropBox.w, y: cropBox.y }, // Top-Right
            { x: cropBox.x, y: cropBox.y + cropBox.h }, // Bottom-Left
            { x: cropBox.x + cropBox.w, y: cropBox.y + cropBox.h } // Bottom-Right
        ];
        
        for (let i = 0; i < corners.length; i++) {
            const dist = Math.hypot(pos.x - corners[i].x, pos.y - corners[i].y);
            if (dist <= handleSize * 1.5) {
                dragMode = i;
                dragStart = pos;
                e.preventDefault();
                return;
            }
        }
        
        // Check inside box
        if (pos.x >= cropBox.x && pos.x <= cropBox.x + cropBox.w &&
            pos.y >= cropBox.y && pos.y <= cropBox.y + cropBox.h) {
            dragMode = 4; // Move box mode
            dragStart = { x: pos.x - cropBox.x, y: pos.y - cropBox.y };
            e.preventDefault();
        }
    }

    function handleDragMove(e) {
        if (dragMode === -1 || !currentImageElement) return;
        
        const pos = getMousePos(e);
        const w = cropCanvas.width;
        const h = cropCanvas.height;
        const aspect = getSelectedAspectRatio();

        if (dragMode === 4) {
            // Drag move box
            let newX = pos.x - dragStart.x;
            let newY = pos.y - dragStart.y;
            
            // Constrain limits
            newX = Math.max(0, Math.min(w - cropBox.w, newX));
            newY = Math.max(0, Math.min(h - cropBox.h, newY));
            
            cropBox.x = newX;
            cropBox.y = newY;
        } else {
            // Resize mode
            let minSize = 30;
            let dx = pos.x - dragStart.x;
            let dy = pos.y - dragStart.y;
            
            if (dragMode === 3) { // Bottom-Right
                let newW = Math.max(minSize, Math.min(w - cropBox.x, cropBox.w + (pos.x - (cropBox.x + cropBox.w))));
                let newH = aspect ? newW / aspect : Math.max(minSize, Math.min(h - cropBox.y, cropBox.h + (pos.y - (cropBox.y + cropBox.h))));
                
                if (aspect) {
                    if (cropBox.y + newH > h) {
                        newH = h - cropBox.y;
                        newW = newH * aspect;
                    }
                }
                cropBox.w = newW;
                cropBox.h = newH;
            } else if (dragMode === 0) { // Top-Left
                let newX = Math.max(0, Math.min(cropBox.x + cropBox.w - minSize, pos.x));
                let newW = cropBox.x + cropBox.w - newX;
                let newH = aspect ? newW / aspect : cropBox.h;
                
                if (!aspect) {
                    let newY = Math.max(0, Math.min(cropBox.y + cropBox.h - minSize, pos.y));
                    cropBox.h = cropBox.y + cropBox.h - newY;
                    cropBox.y = newY;
                } else {
                    let newY = cropBox.y + cropBox.h - newH;
                    if (newY < 0) {
                        newY = 0;
                        newH = cropBox.y + cropBox.h;
                        newW = newH * aspect;
                        newX = cropBox.x + cropBox.w - newW;
                    }
                    cropBox.h = newH;
                    cropBox.y = newY;
                }
                cropBox.x = newX;
                cropBox.w = newW;
            } else if (dragMode === 1) { // Top-Right
                let newW = Math.max(minSize, Math.min(w - cropBox.x, pos.x - cropBox.x));
                let newH = aspect ? newW / aspect : cropBox.h;
                
                if (!aspect) {
                    let newY = Math.max(0, Math.min(cropBox.y + cropBox.h - minSize, pos.y));
                    cropBox.h = cropBox.y + cropBox.h - newY;
                    cropBox.y = newY;
                } else {
                    let newY = cropBox.y + cropBox.h - newH;
                    if (newY < 0) {
                        newY = 0;
                        newH = cropBox.y + cropBox.h;
                        newW = newH * aspect;
                    }
                    cropBox.h = newH;
                    cropBox.y = newY;
                }
                cropBox.w = newW;
            } else if (dragMode === 2) { // Bottom-Left
                let newX = Math.max(0, Math.min(cropBox.x + cropBox.w - minSize, pos.x));
                let newW = cropBox.x + cropBox.w - newX;
                let newH = aspect ? newW / aspect : Math.max(minSize, Math.min(h - cropBox.y, cropBox.h + (pos.y - (cropBox.y + cropBox.h))));
                
                if (aspect) {
                    if (cropBox.y + newH > h) {
                        newH = h - cropBox.y;
                        newW = newH * aspect;
                        newX = cropBox.x + cropBox.w - newW;
                    }
                } else {
                    cropBox.h = newH;
                }
                cropBox.x = newX;
                cropBox.w = newW;
            }
        }
        
        drawCropCanvas();
    }

    function handleDragEnd() {
        dragMode = -1;
    }

    function getSelectedAspectRatio() {
        const val = aspectRatioSelector.value;
        if (val === '1:1') return 1.0;
        if (val === '16:9') return 16/9;
        if (val === '4:3') return 4/3;
        return null; // free
    }

    function applyAspectRatio() {
        const aspect = getSelectedAspectRatio();
        if (!aspect) return;
        
        const w = cropCanvas.width;
        const h = cropCanvas.height;
        
        let newW = cropBox.w;
        let newH = newW / aspect;
        
        if (cropBox.y + newH > h) {
            newH = h - cropBox.y;
            newW = newH * aspect;
        }
        if (cropBox.x + newW > w) {
            newW = w - cropBox.x;
            newH = newW / aspect;
        }
        
        cropBox.w = Math.max(30, Math.round(newW));
        cropBox.h = Math.max(30, Math.round(newH));
    }

    // Crop Core Logic
    function processCrop(fileWrapper) {
        if (fileWrapper.status === 'converting' || fileWrapper.status === 'done') return;
        if (!currentImageElement) return;

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
        progressFill.style.width = '30%';
        convertBtn.classList.add('hidden');

        setTimeout(() => {
            progressFill.style.width = '60%';
            
            // Calculate scale from canvas space back to original image space
            const scaleX = currentImageElement.naturalWidth / cropCanvas.width;
            const scaleY = currentImageElement.naturalHeight / cropCanvas.height;
            
            const sourceX = cropBox.x * scaleX;
            const sourceY = cropBox.y * scaleY;
            const sourceW = cropBox.w * scaleX;
            const sourceH = cropBox.h * scaleY;
            
            // Create full quality cropped canvas
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');
            finalCanvas.width = sourceW;
            finalCanvas.height = sourceH;
            
            finalCtx.drawImage(
                currentImageElement,
                sourceX, sourceY, sourceW, sourceH,
                0, 0, sourceW, sourceH
            );
            
            progressFill.style.width = '90%';
            
            // Match input mime type or default to png
            let mimeType = fileWrapper.file.type || 'image/png';
            let extension = fileWrapper.originalName.split('.').pop().toLowerCase();
            if (extension === 'jpg' || extension === 'jpeg') {
                mimeType = 'image/jpeg';
            }

            setTimeout(() => {
                finalCanvas.toBlob((croppedBlob) => {
                    if (croppedBlob) {
                        const croppedUrl = URL.createObjectURL(croppedBlob);
                        const croppedName = 'cropped_' + fileWrapper.originalName;

                        fileWrapper.status = 'done';
                        fileWrapper.convertedBlobUrl = croppedUrl;
                        fileWrapper.convertedBlobName = croppedName;

                        progressFill.style.width = '100%';
                        setTimeout(() => {
                            progressWrapper.classList.add('hidden');
                            statusBadge.className = 'status-badge badge-done';
                            statusBadge.textContent = isEnglish ? 'Ready' : 'Listo';

                            downloadBtn.href = croppedUrl;
                            downloadBtn.download = croppedName;
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
                    } else {
                        handleError(fileWrapper);
                    }
                }, mimeType, 0.92);
            }, 300);
            
        }, 300);
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
            clearAllFiles();
        });
    }

        if (convertAllBtn) {
        convertAllBtn.addEventListener('click', () => {
            const pending = filesArray.filter(f => f.status === 'pending');
            if (pending.length > 0) {
                playPopSound();
                pending.forEach(f => processCrop(f));
            }
        });
    }

    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => {
            const doneFiles = filesArray.filter(f => f.status === 'done' && f.convertedBlobUrl);
            if (doneFiles.length > 0) {
                playPopSound();
                const f = doneFiles[0];
                const a = document.createElement('a');
                a.href = f.convertedBlobUrl;
                a.download = f.convertedBlobName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                showThankYouModal();
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
