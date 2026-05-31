/**
 * Convertify - Client-side PDF to Images Extractor
 * Pure Vanilla JavaScript with PDF.js and Canvas APIs
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
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            if (isPdf) {
                addFileToList(file);
                acceptedCount++;
            } else {
                rejectedCount++;
            }
        });

        if (acceptedCount > 0) playPopSound();
        if (rejectedCount > 0) {
            const warningMsg = isEnglish 
                ? `Skipped ${rejectedCount} file(s) because they were not PDF documents.`
                : `Se omitieron ${rejectedCount} archivo(s) porque no eran documentos PDF.`;
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
            convertedPages: [], // Array of {url, name}
            element: null
        };

        const clone = document.importNode(fileCardTemplate.content, true);
        const card = clone.querySelector('.file-card');
        card.setAttribute('data-id', id);

        card.querySelector('.file-name').textContent = file.name;
        card.querySelector('.file-name').setAttribute('title', file.name);
        card.querySelector('.file-size').textContent = formatBytes(file.size);

        // Hide preview image since it's a PDF, fallback SVG icon will show
        const previewEl = card.querySelector('.file-preview');
        previewEl.style.display = 'none';
        
        const dimsEl = card.querySelector('.file-dims');
        dimsEl.textContent = 'PDF Document';

        const convertBtn = card.querySelector('.btn-action-convert');
        const removeBtn = card.querySelector('.btn-action-remove');

        convertBtn.addEventListener('click', () => {
            extractPdfImages(fileWrapper);
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
        f.convertedPages.forEach(p => URL.revokeObjectURL(p.url));
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

    async function extractPdfImages(fileWrapper) {
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
        convertBtn.classList.add('hidden');

        try {
            const arrayBuffer = await fileWrapper.file.arrayBuffer();
            progressFill.style.width = '25%';

            // Load document via PDF.js
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;
            
            const dimsEl = card.querySelector('.file-dims');
            dimsEl.textContent = isEnglish ? `${numPages} page(s)` : `${numPages} página(s)`;

            const pages = [];
            
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                
                // Scale 2.0 renders high quality crisp text and graphics
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const url = URL.createObjectURL(blob);
                const name = fileWrapper.originalName.replace(/\.(pdf)$/i, '') + `_page_${pageNum}.png`;

                pages.push({ url, name });
                
                // Update progress incrementally
                const percent = 25 + Math.round((pageNum / numPages) * 70);
                progressFill.style.width = `${percent}%`;
            }

            fileWrapper.status = 'done';
            fileWrapper.convertedPages = pages;

            progressFill.style.width = '100%';
            setTimeout(() => {
                progressWrapper.classList.add('hidden');
                statusBadge.className = 'status-badge badge-done';
                statusBadge.textContent = isEnglish ? 'Ready' : 'Listo';

                // Configure Download Action
                downloadBtn.classList.remove('hidden');
                downloadBtn.style.cursor = 'pointer';
                
                // Override default anchor behavior for sequential staggered downloads
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

                playSuccessChime();
                incrementConvertedStats();
                triggerConfetti(statusBadge);
                card.classList.add('success-pulse');
                setTimeout(() => card.classList.remove('success-pulse'), 800);
                updateGlobalActionButtons();
            }, 200);

        } catch (err) {
            console.error('PDF processing failed:', err);
            handleError(fileWrapper);
        }
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
                f.convertedPages.forEach(p => URL.revokeObjectURL(p.url));
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
                pending.forEach(f => extractPdfImages(f));
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
