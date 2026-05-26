/**
 * Convertify - Client-side Image Compressor
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
    const compressAllBtn = document.getElementById('compress-all-btn');
    const downloadAllBtn = document.getElementById('download-all-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const statsCounter = document.getElementById('stats-counter');
    const statsNumber = document.getElementById('stats-number');
    const fileCardTemplate = document.getElementById('file-card-template');
    const thankYouModal = document.getElementById('thank-you-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Compressor Settings
    const qualityRange = document.getElementById('quality-range');
    const qualityBadge = document.getElementById('quality-badge');
    const outputFormat = document.getElementById('output-format');

    // App State
    let filesArray = [];
    let fileIdCounter = 0;
    
    // Audio State
    let audioCtx = null;
    let soundEnabled = localStorage.getItem('soundEnabled') !== 'false'; // Default to true

    // Statistics State
    let totalConverted = parseInt(localStorage.getItem('totalConverted') || '0', 10);

    // Expose pop sound globally for theme.js
    window.playPopSoundExternal = playPopSound;

    // Initialize UI states
    updateStatsDisplay();
    initSoundToggleUI();

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
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.9, audioCtx.currentTime + duration);
        
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function triggerConfetti(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const burstCount = 15;
        const colors = ['#ff4f00', '#a259ff', '#00e5ff', '#ffeb3b', '#4caf50'];
        
        for (let i = 0; i < burstCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti-particle';
            body.appendChild(particle);
            
            const startX = rect.left + rect.width / 2 + window.scrollX;
            const startY = rect.top + rect.height / 2 + window.scrollY;
            
            particle.style.left = `${startX}px`;
            particle.style.top = `${startY}px`;
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 3 + Math.random() * 5;
            const size = 6 + Math.random() * 6;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            
            let posX = startX;
            let posY = startY;
            let velX = Math.cos(angle) * velocity;
            let velY = Math.sin(angle) * velocity - 2; // Initial upward push
            const gravity = 0.2;
            let opacity = 1;
            
            const animate = () => {
                velY += gravity;
                posX += velX;
                posY += velY;
                opacity -= 0.02;
                
                particle.style.left = `${posX}px`;
                particle.style.top = `${posY}px`;
                particle.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            
            requestAnimationFrame(animate);
        }
    }

    function updateStatsDisplay() {
        if (totalConverted > 0) {
            statsCounter.classList.add('visible');
            statsNumber.textContent = totalConverted;
        } else {
            statsCounter.classList.remove('visible');
        }
    }

    function incrementStats(count = 1) {
        totalConverted += count;
        localStorage.setItem('totalConverted', totalConverted);
        updateStatsDisplay();
    }

    // ==========================================================================
    // Range Slider Interactivity
    // ==========================================================================
    if (qualityRange && qualityBadge) {
        qualityRange.addEventListener('input', () => {
            qualityBadge.textContent = `${qualityRange.value}%`;
            // Trigger pop sound softly
            if (qualityRange.value % 10 === 0) {
                playPopSound();
            }
        });
    }

    // ==========================================================================
    // Sound Toggle State Management
    // ==========================================================================
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            soundEnabled = !soundEnabled;
            localStorage.setItem('soundEnabled', soundEnabled);
            initSoundToggleUI();
            if (soundEnabled) {
                playPopSound();
            }
        });
    }

    function initSoundToggleUI() {
        if (!soundToggle) return;
        const volumeOn = soundToggle.querySelector('.volume-on-icon');
        const volumeOff = soundToggle.querySelector('.volume-off-icon');
        
        if (soundEnabled) {
            volumeOn.classList.remove('hidden');
            volumeOff.classList.add('hidden');
            soundToggle.title = document.documentElement.lang === 'en' ? 'Mute sound' : 'Desactivar sonido';
        } else {
            volumeOn.classList.add('hidden');
            volumeOff.classList.remove('hidden');
            soundToggle.title = document.documentElement.lang === 'en' ? 'Enable sound' : 'Activar sonido';
        }
    }

    // ==========================================================================
    // File Handlers & Drop Zone
    // ==========================================================================
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone on drag
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Handle selected files
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });

    // Main files processor
    function handleFiles(files) {
        if (files.length === 0) return;
        
        playPopSound();
        let addedCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate it is an image
            if (!file.type.startsWith('image/')) {
                continue;
            }
            
            fileIdCounter++;
            const fileObj = {
                id: fileIdCounter,
                file: file,
                name: file.name,
                size: file.size,
                status: 'pending',
                compressedBlob: null,
                previewUrl: null
            };
            
            filesArray.push(fileObj);
            createFileCardUI(fileObj);
            addedCount++;
        }
        
        if (addedCount > 0) {
            updateListHeader();
            updateGlobalActionButtons();
            
            // Auto scroll to list if it was hidden
            if (fileListContainer.classList.contains('hidden')) {
                fileListContainer.classList.remove('hidden');
                setTimeout(() => {
                    fileListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
        
        // Reset file input value so same files can be selected again
        fileInput.value = '';
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Create the card UI for a file
    function createFileCardUI(fileObj) {
        const clone = fileCardTemplate.content.cloneNode(true);
        const card = clone.querySelector('.file-card');
        card.setAttribute('data-file-id', fileObj.id);
        
        // Set filename and original size
        card.querySelector('.file-name').textContent = fileObj.name;
        card.querySelector('.file-name').title = fileObj.name;
        card.querySelector('.file-size-original').textContent = formatBytes(fileObj.size);
        
        // Load image preview and dimensions
        const imgElement = card.querySelector('.file-preview');
        const fallback = card.querySelector('.file-preview-fallback');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            fileObj.previewUrl = e.target.result;
            imgElement.src = e.target.result;
            imgElement.classList.remove('hidden');
            fallback.classList.add('hidden');
            
            // Extract dimensions
            const imgTemp = new Image();
            imgTemp.onload = () => {
                const dimsSpan = card.querySelector('.file-dims');
                if (dimsSpan) {
                    dimsSpan.textContent = `${imgTemp.naturalWidth} x ${imgTemp.naturalHeight}`;
                }
            };
            imgTemp.src = e.target.result;
        };
        reader.readAsDataURL(fileObj.file);
        
        // Wire action buttons
        const convertBtn = card.querySelector('.btn-action-convert');
        const downloadBtn = card.querySelector('.btn-action-download');
        const removeBtn = card.querySelector('.btn-action-remove');
        
        convertBtn.addEventListener('click', () => {
            compressSingleFile(fileObj.id);
        });
        
        downloadBtn.addEventListener('click', (e) => {
            if (fileObj.status !== 'done' || !fileObj.compressedBlob) {
                e.preventDefault();
                return;
            }
            playPopSound();
            triggerConfetti(downloadBtn);
            incrementStats(1);
            showThankYouModal();
        });
        
        removeBtn.addEventListener('click', () => {
            playPopSound();
            removeFile(fileObj.id);
        });
        
        fileList.appendChild(clone);
    }

    function removeFile(id) {
        const card = fileList.querySelector(`[data-file-id="${id}"]`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.remove();
                filesArray = filesArray.filter(f => f.id !== id);
                updateListHeader();
                updateGlobalActionButtons();
                
                if (filesArray.length === 0) {
                    fileListContainer.classList.add('hidden');
                }
            }, 150);
        }
    }

    function updateListHeader() {
        fileCountSpan.textContent = filesArray.length;
    }

    function updateGlobalActionButtons() {
        const hasPending = filesArray.some(f => f.status === 'pending');
        const hasDone = filesArray.some(f => f.status === 'done');
        
        // Compress All Button
        if (hasPending) {
            compressAllBtn.classList.remove('disabled');
            compressAllBtn.removeAttribute('disabled');
        } else {
            compressAllBtn.classList.add('disabled');
            compressAllBtn.setAttribute('disabled', 'true');
        }
        
        // Download All Button
        if (hasDone) {
            downloadAllBtn.classList.remove('disabled');
            downloadAllBtn.removeAttribute('disabled');
        } else {
            downloadAllBtn.classList.add('disabled');
            downloadAllBtn.setAttribute('disabled', 'true');
        }
    }

    // ==========================================================================
    // Compression Engine (HTML5 Canvas)
    // ==========================================================================

    function compressSingleFile(id) {
        const fileObj = filesArray.find(f => f.id === id);
        if (!fileObj || fileObj.status !== 'pending') return;
        
        const card = fileList.querySelector(`[data-file-id="${id}"]`);
        const badge = card.querySelector('.status-badge');
        const progressWrapper = card.querySelector('.file-progress-wrapper');
        const progressFill = card.querySelector('.progress-fill');
        const convertBtn = card.querySelector('.btn-action-convert');
        
        // Update state to compressing
        fileObj.status = 'compressing';
        badge.className = 'status-badge badge-converting';
        badge.textContent = document.documentElement.lang === 'en' ? 'Compressing...' : 'Comprimiendo...';
        progressWrapper.classList.remove('hidden');
        progressFill.style.width = '30%';
        convertBtn.classList.add('hidden');
        
        // Load image into canvas
        const img = new Image();
        img.onload = () => {
            progressFill.style.width = '60%';
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            
            // Get quality and mime settings
            const qualityVal = parseInt(qualityRange.value, 10) / 100;
            let mimeVal = outputFormat.value;
            
            if (mimeVal === 'original') {
                mimeVal = fileObj.file.type;
            }
            
            // Special warning / handling for PNG
            // PNG is lossless; if output format is PNG, quality settings are ignored by browser's toBlob().
            // We strip metadata anyway. If PNG output is chosen and it doesn't save size, we fall back gracefully.
            
            progressFill.style.width = '80%';
            
            canvas.toBlob((blob) => {
                if (blob) {
                    progressFill.style.width = '100%';
                    
                    // UX Detail: If the compressed image is actually LARGER than the original
                    // (which happens on small images at 90-100% quality or raw PNGs), 
                    // we gracefully fall back to the original file to avoid bloating the user's storage!
                    let finalBlob = blob;
                    if (blob.size >= fileObj.size && mimeVal === fileObj.file.type) {
                        finalBlob = fileObj.file;
                    }
                    
                    fileObj.compressedBlob = finalBlob;
                    fileObj.status = 'done';
                    
                    // Calculate savings
                    const savings = Math.round((1 - finalBlob.size / fileObj.size) * 100);
                    const finalSavings = savings < 0 ? 0 : savings;
                    
                    setTimeout(() => {
                        badge.className = 'status-badge badge-done';
                        badge.textContent = document.documentElement.lang === 'en' ? 'Ready' : 'Listo';
                        progressWrapper.classList.add('hidden');
                        
                        // Show compressed size metadata
                        const sizeArrow = card.querySelector('.file-size-arrow');
                        const sizeComp = card.querySelector('.file-size-compressed');
                        const sizeSave = card.querySelector('.file-size-saving');
                        
                        sizeArrow.classList.remove('hidden');
                        sizeComp.classList.remove('hidden');
                        sizeComp.textContent = formatBytes(finalBlob.size);
                        
                        if (finalSavings > 0) {
                            sizeSave.classList.remove('hidden');
                            sizeSave.textContent = `(-${finalSavings}%)`;
                            sizeSave.className = 'file-size-saving saving-positive';
                        } else {
                            sizeSave.classList.remove('hidden');
                            sizeSave.textContent = `(0%)`;
                            sizeSave.className = 'file-size-saving';
                        }
                        
                        // Show download button
                        const downloadBtn = card.querySelector('.btn-action-download');
                        downloadBtn.classList.remove('hidden');
                        
                        // Create download URL
                        const downloadUrl = URL.createObjectURL(finalBlob);
                        downloadBtn.href = downloadUrl;
                        
                        // Generate dynamic clean download filename
                        const origName = fileObj.name;
                        const lastDot = origName.lastIndexOf('.');
                        const baseName = lastDot !== -1 ? origName.substring(0, lastDot) : origName;
                        let extension = mimeVal.split('/')[1];
                        if (extension === 'jpeg') extension = 'jpg';
                        downloadBtn.download = `${baseName}-compressed.${extension}`;
                        
                        playSuccessChime();
                        triggerConfetti(badge);
                        updateGlobalActionButtons();
                    }, 200);
                } else {
                    handleCompressionError(fileObj, card, badge, progressWrapper);
                }
            }, mimeVal, qualityVal);
        };
        
        img.onerror = () => {
            handleCompressionError(fileObj, card, badge, progressWrapper);
        };
        
        img.src = fileObj.previewUrl;
    }

    function handleCompressionError(fileObj, card, badge, progressWrapper) {
        fileObj.status = 'error';
        badge.className = 'status-badge badge-error';
        badge.textContent = document.documentElement.lang === 'en' ? 'Error' : 'Error';
        progressWrapper.classList.add('hidden');
        card.querySelector('.btn-action-convert').classList.remove('hidden');
        updateGlobalActionButtons();
    }

    // ==========================================================================
    // Bulk Operations
    // ==========================================================================
    
    // Compress all files sequentially with slight delays
    compressAllBtn.addEventListener('click', () => {
        if (compressAllBtn.classList.contains('disabled')) return;
        
        const pendingFiles = filesArray.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) return;
        
        playPopSound();
        
        let delay = 0;
        pendingFiles.forEach((fileObj) => {
            setTimeout(() => {
                compressSingleFile(fileObj.id);
            }, delay);
            delay += 250; // Stagger to prevent browser freezing
        });
    });

    // Download all ready files
    downloadAllBtn.addEventListener('click', () => {
        if (downloadAllBtn.classList.contains('disabled')) return;
        
        const readyFiles = filesArray.filter(f => f.status === 'done' && f.compressedBlob);
        if (readyFiles.length === 0) return;
        
        playSuccessChime();
        
        let delay = 0;
        readyFiles.forEach((fileObj) => {
            setTimeout(() => {
                const card = fileList.querySelector(`[data-file-id="${fileObj.id}"]`);
                const downloadBtn = card.querySelector('.btn-action-download');
                if (downloadBtn) {
                    downloadBtn.click();
                }
            }, delay);
            delay += 300; // Delay to let browser queue downloads safely
        });
        
        incrementStats(readyFiles.length);
        showThankYouModal();
    });

    // Clear all files
    clearAllBtn.addEventListener('click', () => {
        playPopSound();
        
        // Remove object URLs to release memory
        filesArray.forEach(fileObj => {
            if (fileObj.compressedBlob) {
                const card = fileList.querySelector(`[data-file-id="${fileObj.id}"]`);
                if (card) {
                    const downloadBtn = card.querySelector('.btn-action-download');
                    if (downloadBtn && downloadBtn.href) {
                        URL.revokeObjectURL(downloadBtn.href);
                    }
                }
            }
        });
        
        fileList.innerHTML = '';
        filesArray = [];
        updateListHeader();
        updateGlobalActionButtons();
        fileListContainer.classList.add('hidden');
    });

    // ==========================================================================
    // Support/Thank You Modal
    // ==========================================================================
    function showThankYouModal() {
        thankYouModal.classList.remove('hidden');
        thankYouModal.classList.add('fade-in');
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            playPopSound();
            thankYouModal.classList.add('hidden');
        });
    }

    // Close modal on background click
    thankYouModal.addEventListener('click', (e) => {
        if (e.target === thankYouModal) {
            playPopSound();
            thankYouModal.classList.add('hidden');
        }
    });
});
