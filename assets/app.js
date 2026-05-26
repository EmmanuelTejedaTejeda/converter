/**
 * Convertify - Client-side JPG to PNG Converter
 * Pure Vanilla JavaScript with HTML5 Canvas API
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
                soundToggle.title = 'Desactivar sonido';
            } else {
                volumeOnIcon.classList.add('hidden');
                volumeOffIcon.classList.remove('hidden');
                soundToggle.title = 'Activar sonido';
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

    initSoundToggle();

    // Statistics Loops
    function updateStatsUI(animate = false) {
        statsNumber.textContent = totalConverted;
        if (animate) {
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

    // Confetti Particles Burst
    function triggerConfetti(targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const count = 30;
        const colors = ['#ff4f00', '#18181b', '#71717a', '#d4d4d8', '#faf9f5', '#ff7a00'];
        
        // Document relative center of the element
        const startX = rect.left + rect.width / 2 + window.scrollX;
        const startY = rect.top + rect.height / 2 + window.scrollY;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('span');
            particle.className = 'confetti-particle';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            particle.style.backgroundColor = color;
            
            // Random physics trajectory
            const xVal = (Math.random() - 0.5) * 200 + 'px';
            const yVal = (Math.random() * -140) - 30 + 'px'; // Ascending explosion
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
    
    // Trigger file input click when clicking on the drop zone, but ignore if the input itself was clicked to prevent double trigger
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    // Handle drag events
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

    // Handle file drop
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Handle file input selection
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        // Reset value so same file can be uploaded again if cleared
        fileInput.value = '';
    });

    // ==========================================================================
    // File List Processing
    // ==========================================================================
    
    function handleFiles(files) {
        if (files.length === 0) return;

        const filesToProcess = Array.from(files);
        let acceptedCount = 0;
        let rejectedCount = 0;

        filesToProcess.forEach(file => {
            // Validate JPG/JPEG extension or MIME type
            const isJpg = file.type === 'image/jpeg' || 
                          file.type === 'image/jpg' || 
                          file.name.toLowerCase().endsWith('.jpg') || 
                          file.name.toLowerCase().endsWith('.jpeg');
            
            if (isJpg) {
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
            alert(`Se omitieron ${rejectedCount} archivo(s) porque no eran de tipo JPG/JPEG.`);
        }

        updateListVisibility();

        // Auto-scroll suave hacia la lista de archivos para guiar a los usuarios no técnicos
        if (acceptedCount > 0) {
            setTimeout(() => {
                fileListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    function addFileToList(file) {
        const id = fileIdCounter++;
        
        // Create wrapper object
        const fileWrapper = {
            id: id,
            file: file,
            originalName: file.name,
            originalSize: file.size,
            status: 'pending',
            convertedBlobUrl: null,
            convertedBlobName: null,
            element: null
        };

        // Instantiate template
        const clone = document.importNode(fileCardTemplate.content, true);
        const card = clone.querySelector('.file-card');
        card.setAttribute('data-id', id);

        // Fill Details
        const nameEl = card.querySelector('.file-name');
        nameEl.textContent = file.name;
        nameEl.setAttribute('title', file.name);

        const sizeEl = card.querySelector('.file-size');
        sizeEl.textContent = formatBytes(file.size);

        // Preload preview and dimensions
        const previewEl = card.querySelector('.file-preview');
        const dimsEl = card.querySelector('.file-dims');
        
        const previewUrl = URL.createObjectURL(file);
        previewEl.src = previewUrl;
        
        // Wait for preview image to load to get dimensions
        const imgObj = new Image();
        imgObj.onload = () => {
            dimsEl.textContent = `${imgObj.width} x ${imgObj.height} px`;
            URL.revokeObjectURL(previewUrl); // free memory as preview img tag has it loaded
        };
        imgObj.onerror = () => {
            dimsEl.textContent = '-- x -- px';
            URL.revokeObjectURL(previewUrl);
        };
        imgObj.src = previewUrl;

        // Button Event Listeners
        const convertBtn = card.querySelector('.btn-action-convert');
        const downloadBtn = card.querySelector('.btn-action-download');
        const removeBtn = card.querySelector('.btn-action-remove');

        convertBtn.addEventListener('click', () => {
            convertJpgToPng(fileWrapper);
        });

        removeBtn.addEventListener('click', () => {
            removeFile(id);
        });

        // Store element in wrapper and push to array
        fileWrapper.element = card;
        filesArray.push(fileWrapper);

        // Add to DOM
        fileList.appendChild(card);
    }

    function removeFile(id) {
        const index = filesArray.findIndex(f => f.id === id);
        if (index === -1) return;

        playPopSound();
        const fileWrapper = filesArray[index];
        
        // Clean up object URLs to prevent leaks
        if (fileWrapper.convertedBlobUrl) {
            URL.revokeObjectURL(fileWrapper.convertedBlobUrl);
        }

        // Remove element from DOM
        fileWrapper.element.remove();

        // Remove from state array
        filesArray.splice(index, 1);

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
        // Toggle Convert All button
        const hasPending = filesArray.some(f => f.status === 'pending');
        convertAllBtn.disabled = !hasPending;
        if (hasPending) {
            convertAllBtn.classList.remove('disabled');
        } else {
            convertAllBtn.classList.add('disabled');
        }

        // Toggle Download All button
        const hasConverted = filesArray.some(f => f.status === 'done');
        downloadAllBtn.disabled = !hasConverted;
        if (hasConverted) {
            downloadAllBtn.classList.remove('disabled');
        } else {
            downloadAllBtn.classList.add('disabled');
        }
    }

    clearAllBtn.addEventListener('click', clearAllFiles);

    // ==========================================================================
    // JPG to PNG Conversion Core Logic
    // ==========================================================================
    
    function convertJpgToPng(fileWrapper) {
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
        statusBadge.textContent = 'Procesando';
        progressWrapper.classList.remove('hidden');
        progressFill.style.width = '20%';
        convertBtn.classList.add('hidden');

        // Create virtual Image to draw onto Canvas
        const img = new Image();
        const objectUrl = URL.createObjectURL(fileWrapper.file);

        img.onload = () => {
            progressFill.style.width = '60%';

            // Create offscreen Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Draw JPG onto Canvas
            ctx.drawImage(img, 0, 0);
            
            progressFill.style.width = '80%';

            // Convert to PNG blob
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create download URL
                    const pngUrl = URL.createObjectURL(blob);
                    const pngName = fileWrapper.originalName.replace(/\.(jpe?g)$/i, '') + '.png';

                    // Update wrapper details
                    fileWrapper.status = 'done';
                    fileWrapper.convertedBlobUrl = pngUrl;
                    fileWrapper.convertedBlobName = pngName;

                    // Update UI state
                    progressFill.style.width = '100%';
                    
                    setTimeout(() => {
                        progressWrapper.classList.add('hidden');
                        statusBadge.className = 'status-badge badge-done';
                        statusBadge.textContent = 'Listo';
                        
                        // Setup Download Button
                        downloadBtn.href = pngUrl;
                        downloadBtn.download = pngName;
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
                    }, 250);
                } else {
                    handleConversionError(fileWrapper, 'Error al crear blob');
                }
                // Revoke virtual image object url
                URL.revokeObjectURL(objectUrl);
            }, 'image/png');
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            handleConversionError(fileWrapper, 'Error al cargar imagen');
        };

        img.src = objectUrl;
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
        convertBtn.classList.remove('hidden');
        
        console.error(`Error de conversión para el archivo ${fileWrapper.originalName}:`, errorMessage);
        updateGlobalActionButtons();
    }

    // Convert All pending files
    convertAllBtn.addEventListener('click', () => {
        const pendingFiles = filesArray.filter(f => f.status === 'pending');
        if (pendingFiles.length > 0) {
            playPopSound();
            pendingFiles.forEach(fileWrapper => {
                convertJpgToPng(fileWrapper);
            });
        }
    });

    // Download All converted files sequentially
    downloadAllBtn.addEventListener('click', () => {
        const doneFiles = filesArray.filter(f => f.status === 'done' && f.convertedBlobUrl);
        if (doneFiles.length > 0) {
            playPopSound();
            let delay = 0;
            doneFiles.forEach(fileWrapper => {
                // Stagger downloads slightly so the browser doesn't block them as popup spam
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

            // Mostrar modal de agradecimiento y publicidad al completar las descargas
            setTimeout(() => {
                showThankYouModal();
            }, delay + 100);
        }
    });

    // ==========================================================================
    // Thank-You Modal Logic (Monetization)
    // ==========================================================================
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

    // ==========================================================================
    // Helper Utilities
    // ==========================================================================
    
    // Format byte sizes into human readable text
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
