/**
 * Convertify - Client-side Image Resizer
 * Pure Vanilla JavaScript with HTML5 Canvas API
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.body;
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const fileCountSpan = document.getElementById('file-count');
    const resizeAllBtn = document.getElementById('convert-all-btn'); // Reusing ID for layout alignment
    const downloadAllBtn = document.getElementById('download-all-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const statsCounter = document.getElementById('stats-counter');
    const statsNumber = document.getElementById('stats-number');
    const fileCardTemplate = document.getElementById('file-card-template');
    const thankYouModal = document.getElementById('thank-you-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Resizer Control Elements
    const resizeMode = document.getElementById('resize-mode');
    const resizePercentage = document.getElementById('resize-percentage');
    const percentageBadge = document.getElementById('percentage-badge');
    const percentageControlGroup = document.getElementById('percentage-control-group');
    const dimensionsControlGroup = document.getElementById('dimensions-control-group');
    const resizeWidth = document.getElementById('resize-width');
    const resizeHeight = document.getElementById('resize-height');
    const maintainAspect = document.getElementById('maintain-aspect');
    const aspectRatioGroup = document.getElementById('aspect-ratio-group');
    const outputFormat = document.getElementById('output-format');

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
            
            // Bright satisfying chime (C5 to E5 to G5 chord notes)
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
    // Resizer Control Logic & Synchronization
    // ==========================================================================

    function toggleResizeMode() {
        if (resizeMode.value === 'percentage') {
            percentageControlGroup.classList.remove('hidden');
            dimensionsControlGroup.classList.add('hidden');
            aspectRatioGroup.classList.add('hidden');
        } else {
            percentageControlGroup.classList.add('hidden');
            dimensionsControlGroup.classList.remove('hidden');
            aspectRatioGroup.classList.remove('hidden');
            
            // Populate defaults from first image if available
            if (filesArray.length > 0 && !resizeWidth.value && !resizeHeight.value) {
                const first = filesArray[0];
                resizeWidth.value = first.originalWidth;
                resizeHeight.value = first.originalHeight;
            }
        }
        updateAllCardsResizedDimensions();
    }

    if (resizeMode) {
        resizeMode.addEventListener('change', () => {
            playPopSound();
            toggleResizeMode();
        });
    }

    if (resizePercentage && percentageBadge) {
        resizePercentage.addEventListener('input', () => {
            percentageBadge.textContent = `${resizePercentage.value}%`;
            if (resizePercentage.value % 25 === 0) {
                playPopSound();
            }
            updateAllCardsResizedDimensions();
        });
    }

    function syncDimensions(changedInput) {
        if (!maintainAspect.checked || filesArray.length === 0) return;
        
        const first = filesArray[0];
        const ratio = first.originalWidth / first.originalHeight;

        if (changedInput === 'width') {
            const wVal = parseFloat(resizeWidth.value);
            if (wVal > 0) {
                resizeHeight.value = Math.round(wVal / ratio);
            } else {
                resizeHeight.value = '';
            }
        } else {
            const hVal = parseFloat(resizeHeight.value);
            if (hVal > 0) {
                resizeWidth.value = Math.round(hVal * ratio);
            } else {
                resizeWidth.value = '';
            }
        }
    }

    if (resizeWidth) {
        resizeWidth.addEventListener('input', () => {
            syncDimensions('width');
            updateAllCardsResizedDimensions();
        });
    }

    if (resizeHeight) {
        resizeHeight.addEventListener('input', () => {
            syncDimensions('height');
            updateAllCardsResizedDimensions();
        });
    }

    if (maintainAspect) {
        maintainAspect.addEventListener('change', () => {
            playPopSound();
            if (maintainAspect.checked) {
                syncDimensions('width');
            }
            updateAllCardsResizedDimensions();
        });
    }

    function calculateTargetDimensions(originalWidth, originalHeight) {
        const mode = resizeMode.value;
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (mode === 'percentage') {
            const percent = parseFloat(resizePercentage.value) / 100;
            targetWidth = Math.round(originalWidth * percent);
            targetHeight = Math.round(originalHeight * percent);
        } else {
            const targetW = parseFloat(resizeWidth.value) || originalWidth;
            const targetH = parseFloat(resizeHeight.value) || originalHeight;

            if (maintainAspect.checked) {
                // Scale proportional to fits inside target boundaries
                const scale = Math.min(targetW / originalWidth, targetH / originalHeight);
                targetWidth = Math.round(originalWidth * scale);
                targetHeight = Math.round(originalHeight * scale);
            } else {
                targetWidth = Math.round(targetW);
                targetHeight = Math.round(targetH);
            }
        }

        // Constraints: Canvas must be at least 1x1 pixel
        return {
            width: Math.max(1, targetWidth),
            height: Math.max(1, targetHeight)
        };
    }

    function updateCardResizedDimensions(fileWrapper) {
        const card = fileWrapper.element;
        const sizeArrow = card.querySelector('.file-size-arrow');
        const dimsResized = card.querySelector('.file-dims-resized');

        if (fileWrapper.status === 'done') return; // Keep fixed state once completed

        if (fileWrapper.originalWidth && fileWrapper.originalHeight) {
            const targets = calculateTargetDimensions(fileWrapper.originalWidth, fileWrapper.originalHeight);
            dimsResized.textContent = `${targets.width} x ${targets.height} px`;
            
            sizeArrow.classList.remove('hidden');
            dimsResized.classList.remove('hidden');
        } else {
            sizeArrow.classList.add('hidden');
            dimsResized.classList.add('hidden');
        }
    }

    function updateAllCardsResizedDimensions() {
        filesArray.forEach(fileWrapper => {
            updateCardResizedDimensions(fileWrapper);
        });
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
            originalWidth: null,
            originalHeight: null,
            status: 'pending', // pending, converting, done, error
            resizedBlobUrl: null,
            resizedBlobName: null,
            element: null
        };

        const clone = document.importNode(fileCardTemplate.content, true);
        const card = clone.querySelector('.file-card');
        card.setAttribute('data-id', id);
        fileWrapper.element = card;

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
            fileWrapper.originalWidth = imgObj.width;
            fileWrapper.originalHeight = imgObj.height;
            dimsEl.textContent = `${imgObj.width} x ${imgObj.height} px`;
            
            // If dimensions mode default width/height are empty, populate them
            if (resizeMode.value === 'dimensions' && !resizeWidth.value && !resizeHeight.value && filesArray[0] === fileWrapper) {
                resizeWidth.value = imgObj.width;
                resizeHeight.value = imgObj.height;
            }

            updateCardResizedDimensions(fileWrapper);
        };
        imgObj.onerror = () => {
            dimsEl.textContent = '-- x -- px';
        };
        imgObj.src = fileWrapper.previewUrl;

        // Button Event Listeners
        const removeBtn = card.querySelector('.btn-action-remove');
        const convertBtn = card.querySelector('.btn-action-convert');

        removeBtn.addEventListener('click', () => {
            removeFile(id);
        });

        convertBtn.addEventListener('click', () => {
            resizeSingleFile(fileWrapper);
        });

        filesArray.push(fileWrapper);
        fileList.appendChild(card);
        updateGlobalActionButtons();
    }

    function removeFile(id) {
        const index = filesArray.findIndex(f => f.id === id);
        if (index === -1) return;

        playPopSound();
        const fileWrapper = filesArray[index];
        URL.revokeObjectURL(fileWrapper.previewUrl);
        if (fileWrapper.resizedBlobUrl) {
            URL.revokeObjectURL(fileWrapper.resizedBlobUrl);
        }

        // Remove element from DOM
        if (fileWrapper.element) fileWrapper.element.remove();

        filesArray.splice(index, 1);

        updateListVisibility();
    }

    function clearAllFiles() {
        if (filesArray.length > 0) {
            playPopSound();
        }
        filesArray.forEach(fileWrapper => {
            URL.revokeObjectURL(fileWrapper.previewUrl);
            if (fileWrapper.resizedBlobUrl) {
                URL.revokeObjectURL(fileWrapper.resizedBlobUrl);
            }
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
        const hasPending = filesArray.some(f => f.status === 'pending');
        const hasDone = filesArray.some(f => f.status === 'done');

        resizeAllBtn.disabled = !hasPending;
        if (hasPending) {
            resizeAllBtn.classList.remove('disabled');
        } else {
            resizeAllBtn.classList.add('disabled');
        }

        downloadAllBtn.disabled = !hasDone;
        if (hasDone) {
            downloadAllBtn.classList.remove('disabled');
        } else {
            downloadAllBtn.classList.add('disabled');
        }
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllFiles);
    }

    // ==========================================================================
    // Resizing Core Engine (HTML5 Canvas + Artificial delay)
    // ==========================================================================
    
    function resizeSingleFile(fileWrapper) {
        if (fileWrapper.status === 'converting' || fileWrapper.status === 'done') return;

        playPopSound();
        const card = fileWrapper.element;
        const statusBadge = card.querySelector('.status-badge');
        const progressWrapper = card.querySelector('.file-progress-wrapper');
        const progressFill = card.querySelector('.progress-fill');
        const convertBtn = card.querySelector('.btn-action-convert');
        const downloadBtn = card.querySelector('.btn-action-download');

        // Set status to converting
        fileWrapper.status = 'converting';
        updateGlobalActionButtons();

        // Update UI
        statusBadge.className = 'status-badge badge-converting';
        statusBadge.textContent = isEnglish ? 'Processing...' : 'Procesando';
        progressWrapper.classList.remove('hidden');
        progressFill.style.width = '20%';
        convertBtn.classList.add('hidden');

        // Create virtual Image
        const img = new Image();
        const objectUrl = URL.createObjectURL(fileWrapper.file);

        img.onload = () => {
            // Step 1: Initialize loading (30%)
            progressFill.style.width = '30%';

            setTimeout(() => {
                // Step 2: Processing canvas scaling (70%)
                progressFill.style.width = '70%';

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Compute output sizes
                const targetDims = calculateTargetDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height);
                canvas.width = targetDims.width;
                canvas.height = targetDims.height;

                // Determine Output Format
                let outputMime = outputFormat.value;
                if (outputMime === 'original') {
                    outputMime = fileWrapper.file.type || 'image/jpeg';
                }

                // If output format is JPEG, draw white background first
                if (outputMime === 'image/jpeg') {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Draw scaled image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                setTimeout(() => {
                    // Step 3: Compiling and saving (100%)
                    progressFill.style.width = '100%';

                    canvas.toBlob((blob) => {
                        if (blob) {
                            // Create download URL
                            const resizedUrl = URL.createObjectURL(blob);
                            
                            // Generate file extension
                            let ext = outputMime.split('/')[1];
                            if (ext === 'jpeg') ext = 'jpg';
                            const origName = fileWrapper.originalName;
                            const lastDot = origName.lastIndexOf('.');
                            const baseName = lastDot !== -1 ? origName.substring(0, lastDot) : origName;
                            const outputName = `${baseName}-resized.${ext}`;

                            // Update wrapper details
                            fileWrapper.status = 'done';
                            fileWrapper.resizedBlobUrl = resizedUrl;
                            fileWrapper.resizedBlobName = outputName;

                            setTimeout(() => {
                                progressWrapper.classList.add('hidden');
                                statusBadge.className = 'status-badge badge-done';
                                statusBadge.textContent = isEnglish ? 'Ready' : 'Listo';
                                
                                // Update dimensions to target display values
                                const dimsResized = card.querySelector('.file-dims-resized');
                                dimsResized.textContent = `${canvas.width} x ${canvas.height} px`;
                                card.querySelector('.file-size-arrow').classList.remove('hidden');
                                dimsResized.classList.remove('hidden');

                                // Setup Download Button
                                downloadBtn.href = resizedUrl;
                                downloadBtn.download = outputName;
                                downloadBtn.classList.remove('hidden');
                                downloadBtn.addEventListener('click', () => {
                                    playPopSound();
                                    showThankYouModal();
                                });
                                
                                // Dopamine UX Triggers
                                playSuccessChime();
                                incrementConvertedStats();
                                triggerConfetti(statusBadge);
                                card.classList.add('success-pulse');
                                setTimeout(() => card.classList.remove('success-pulse'), 800);

                                updateGlobalActionButtons();
                            }, 300);
                        } else {
                            handleResizingError(fileWrapper, 'Blob creation failed');
                        }
                        // Revoke virtual image object url
                        URL.revokeObjectURL(objectUrl);
                    }, outputMime, 0.92);

                }, 400);

            }, 400);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            handleResizingError(fileWrapper, 'Image loading failed');
        };

        img.src = objectUrl;
    }

    function handleResizingError(fileWrapper, errorMessage) {
        fileWrapper.status = 'error';
        const card = fileWrapper.element;
        const statusBadge = card.querySelector('.status-badge');
        const progressWrapper = card.querySelector('.file-progress-wrapper');
        const convertBtn = card.querySelector('.btn-action-convert');

        progressWrapper.classList.add('hidden');
        statusBadge.className = 'status-badge badge-error';
        statusBadge.textContent = 'Error';
        convertBtn.classList.remove('hidden');
        
        console.error(`Resizing error for ${fileWrapper.originalName}:`, errorMessage);
        updateGlobalActionButtons();
    }

    // Convert All pending files
    if (resizeAllBtn) {
        resizeAllBtn.addEventListener('click', () => {
            const pendingFiles = filesArray.filter(f => f.status === 'pending');
            if (pendingFiles.length === 0) return;

            // Sequential processing with staggered delay
            let delay = 0;
            pendingFiles.forEach(fileWrapper => {
                setTimeout(() => {
                    // Check if file is still pending (not removed)
                    if (filesArray.includes(fileWrapper)) {
                        resizeSingleFile(fileWrapper);
                    }
                }, delay);
                delay += 300; // sequential launch stagger
            });
        });
    }

    // Download All zip or sequential click downloads
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', () => {
            const doneFiles = filesArray.filter(f => f.status === 'done');
            if (doneFiles.length === 0) return;

            playPopSound();
            
            // Programmatically trigger downloads for all completed files
            doneFiles.forEach((fileWrapper, idx) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = fileWrapper.resizedBlobUrl;
                    link.download = fileWrapper.resizedBlobName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, idx * 250); // Stagger actual browser triggers to prevent blockages
            });

            setTimeout(() => {
                showThankYouModal();
            }, doneFiles.length * 250);
        });
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
});
