/**
 * Convertify - Client-side SVG to Image Converter
 * Pure Vanilla JavaScript with HTML5 Canvas API
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const fileListContainer = document.getElementById('file-list-container');
    const fileList = document.getElementById('file-list');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const processBtn = document.getElementById('process-btn');
    const fileCardTemplate = document.getElementById('file-card-template');
    const thankYouModal = document.getElementById('thank-you-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // Language Detection
    const lang = document.documentElement.lang || 'es';
    const isEnglish = lang === 'en';

    // App State
    let filesArray = [];
    let fileIdCounter = 0;
    
    // Audio State
    let audioCtx = null;
    let soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    let totalConverted = parseInt(localStorage.getItem('totalConverted') || '0', 10);

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
            const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
            if (isSvg) {
                addFileToList(file);
                acceptedCount++;
            } else {
                rejectedCount++;
            }
        });

        if (acceptedCount > 0) playPopSound();
        if (rejectedCount > 0) {
            const warningMsg = isEnglish 
                ? `Skipped ${rejectedCount} file(s) because they were not in SVG format.`
                : `Se omitieron ${rejectedCount} archivo(s) porque no eran de tipo SVG.`;
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

        // Fetch SVG text to figure out natural dimensions if possible
        const reader = new FileReader();
        reader.onload = (e) => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, 'image/svg+xml');
            const svgNode = xmlDoc.getElementsByTagName('svg')[0];
            
            let width = 800;
            let height = 600;
            
            if (svgNode) {
                if (svgNode.hasAttribute('width')) {
                    width = parseInt(svgNode.getAttribute('width'), 10) || width;
                }
                if (svgNode.hasAttribute('height')) {
                    height = parseInt(svgNode.getAttribute('height'), 10) || height;
                }
                if (svgNode.hasAttribute('viewBox') && (!svgNode.hasAttribute('width') || !svgNode.hasAttribute('height'))) {
                    const vb = svgNode.getAttribute('viewBox').split(/\s+/);
                    if (vb.length === 4) {
                        width = parseInt(vb[2], 10) || width;
                        height = parseInt(vb[3], 10) || height;
                    }
                }
            }
            dimsEl.textContent = `${width} x ${height} px`;
            URL.revokeObjectURL(previewUrl);
        };
        reader.onerror = () => {
            dimsEl.textContent = '800 x 600 px';
            URL.revokeObjectURL(previewUrl);
        };
        reader.readAsText(file);

        const convertBtn = card.querySelector('.btn-action-convert');
        const removeBtn = card.querySelector('.btn-action-remove');

        convertBtn.addEventListener('click', () => {
            convertSvgToPng(fileWrapper);
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
        if (filesArray.length > 0) {
            fileListContainer.classList.remove('hidden');
        } else {
            fileListContainer.classList.add('hidden');
        }
        updateGlobalActionButtons();
    }

    function updateGlobalActionButtons() {
        const hasPending = filesArray.some(f => f.status === 'pending');
        processBtn.disabled = !hasPending;
        if (hasPending) {
            processBtn.classList.remove('disabled');
        } else {
            processBtn.classList.add('disabled');
        }
    }

    function convertSvgToPng(fileWrapper) {
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
        progressFill.style.width = '30%';
        convertBtn.classList.add('hidden');

        const reader = new FileReader();
        reader.onload = (e) => {
            progressFill.style.width = '50%';
            
            const svgText = e.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgNode = xmlDoc.getElementsByTagName('svg')[0];
            
            let width = 800;
            let height = 600;
            if (svgNode) {
                if (svgNode.hasAttribute('width')) {
                    width = parseInt(svgNode.getAttribute('width'), 10) || width;
                }
                if (svgNode.hasAttribute('height')) {
                    height = parseInt(svgNode.getAttribute('height'), 10) || height;
                }
                if (svgNode.hasAttribute('viewBox') && (!svgNode.hasAttribute('width') || !svgNode.hasAttribute('height'))) {
                    const vb = svgNode.getAttribute('viewBox').split(/\s+/);
                    if (vb.length === 4) {
                        width = parseInt(vb[2], 10) || width;
                        height = parseInt(vb[3], 10) || height;
                    }
                }
            }

            // Create image from SVG text content safely via ObjectURL
            const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                progressFill.style.width = '80%';
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                progressFill.style.width = '95%';
                setTimeout(() => {
                    canvas.toBlob((pngBlob) => {
                        if (pngBlob) {
                            const pngUrl = URL.createObjectURL(pngBlob);
                            const pngName = fileWrapper.originalName.replace(/\.(svg)$/i, '') + '.png';

                            fileWrapper.status = 'done';
                            fileWrapper.convertedBlobUrl = pngUrl;
                            fileWrapper.convertedBlobName = pngName;

                            progressFill.style.width = '100%';
                            setTimeout(() => {
                                progressWrapper.classList.add('hidden');
                                statusBadge.className = 'status-badge badge-done';
                                statusBadge.textContent = isEnglish ? 'Ready' : 'Listo';

                                downloadBtn.href = pngUrl;
                                downloadBtn.download = pngName;
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
                        URL.revokeObjectURL(blobUrl);
                    }, 'image/png');
                }, 300);
            };

            img.onerror = () => {
                URL.revokeObjectURL(blobUrl);
                handleError(fileWrapper);
            };

            img.src = blobUrl;
        };

        reader.onerror = () => {
            handleError(fileWrapper);
        };
        reader.readAsText(fileWrapper.file);
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

    if (processBtn) {
        processBtn.addEventListener('click', () => {
            const pending = filesArray.filter(f => f.status === 'pending');
            if (pending.length > 0) {
                playPopSound();
                pending.forEach(f => convertSvgToPng(f));
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
