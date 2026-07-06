/**
 * My Local Picture - DALL-E Watermark Remover
 * Client-side Content-Aware Inpainting (Jacobi Laplace Diffusion)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const editorSection = document.getElementById('editor-section');
    const imageArea = document.getElementById('image-area');
    const canvasContainer = document.getElementById('canvas-container');
    const editorCanvas = document.getElementById('editor-canvas');
    const selectionBox = document.getElementById('selection-box');
    const resizeHandle = document.getElementById('resize-handle');
    
    // Sliders
    const sliderX = document.getElementById('slider-x');
    const sliderY = document.getElementById('slider-y');
    const sliderW = document.getElementById('slider-w');
    const sliderH = document.getElementById('slider-h');
    const valX = document.getElementById('val-x');
    const valY = document.getElementById('val-y');
    const valW = document.getElementById('val-w');
    const valH = document.getElementById('val-h');
    
    // Select & Buttons
    const presetSelect = document.getElementById('preset-select');
    const removeBtn = document.getElementById('remove-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // String translations based on language
    const lang = document.documentElement.lang;
    let msgSelect = 'Por favor selecciona una imagen primero';
    let msgDone = 'Marca de agua eliminada con éxito';
    let msgLoading = 'Procesando...';
    
    if (lang === 'en') {
        msgSelect = 'Please select an image first';
        msgDone = 'Watermark removed successfully';
        msgLoading = 'Processing...';
    } else if (lang === 'ja') {
        msgSelect = 'まず画像を選択してください';
        msgDone = '透かしが正常に削除されました';
        msgLoading = '処理中...';
    } else if (lang === 'zh') {
        msgSelect = '请先选择一张图片';
        msgDone = '成功去除水印';
        msgLoading = '处理中...';
    }

    // State Variables
    let loadedImage = null;
    let imgWidth = 0;
    let imgHeight = 0;
    
    // Selection box state in source image coordinates
    let boxX = 0;
    let boxY = 0;
    let boxW = 48;
    let boxH = 48;
    
    // Dragging state
    let isDragging = false;
    let isResizing = false;
    let startDragX = 0;
    let startDragY = 0;
    let startBoxX = 0;
    let startBoxY = 0;
    let startBoxW = 0;
    let startBoxH = 0;

    // ==========================================================================
    // File upload and initialization
    // ==========================================================================

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
                loadImageFile(files[0]);
            }
        });
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            loadImageFile(files[0]);
        }
    }

    function loadImageFile(file) {
        if (!file.type.match('image.*')) {
            alert(msgSelect);
            return;
        }

        playPopSound();
        const reader = new FileReader();
        reader.onload = (e) => {
            loadedImage = new Image();
            loadedImage.onload = () => {
                imgWidth = loadedImage.naturalWidth || loadedImage.width;
                imgHeight = loadedImage.naturalHeight || loadedImage.height;
                
                // Show editor workspace
                initEditor();
            };
            loadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ==========================================================================
    // Editor Initialization
    // ==========================================================================

    function initEditor() {
        // Show editor, hide dropzone
        dropZone.classList.add('hidden');
        editorSection.classList.remove('hidden');
        
        // Setup sliders ranges
        sliderX.max = imgWidth;
        sliderY.max = imgHeight;
        sliderW.max = imgWidth;
        sliderH.max = imgHeight;
        
        // Set default preset: DALL-E/Copilot (bottom-left)
        presetSelect.value = 'dalle-copilot';
        applyPreset();
        
        // Draw image on canvas
        drawOriginal();
        
        // Set up window resize listener to adjust overlay position
        window.removeEventListener('resize', updateOverlayPosition);
        window.addEventListener('resize', updateOverlayPosition);
    }

    function drawOriginal() {
        editorCanvas.width = imgWidth;
        editorCanvas.height = imgHeight;
        const ctx = editorCanvas.getContext('2d');
        ctx.clearRect(0, 0, imgWidth, imgHeight);
        ctx.drawImage(loadedImage, 0, 0);
        updateOverlayPosition();
    }

    // ==========================================================================
    // Presets & Sliders Handlers
    // ==========================================================================

    function applyPreset() {
        const preset = presetSelect.value;
        
        if (preset === 'dalle-copilot') {
            boxW = 48;
            boxH = 48;
            boxX = 0;
            boxY = Math.max(0, imgHeight - boxH);
        } else if (preset === 'bottom-left-96') {
            boxW = 96;
            boxH = 96;
            boxX = 0;
            boxY = Math.max(0, imgHeight - boxH);
        } else if (preset === 'bottom-right-48') {
            boxW = 48;
            boxH = 48;
            boxX = Math.max(0, imgWidth - boxW);
            boxY = Math.max(0, imgHeight - boxH);
        } else if (preset === 'bottom-right-96') {
            boxW = 96;
            boxH = 96;
            boxX = Math.max(0, imgWidth - boxW);
            boxY = Math.max(0, imgHeight - boxH);
        }
        
        syncSliders();
        updateOverlayPosition();
    }

    function syncSliders() {
        sliderX.value = boxX;
        sliderY.value = boxY;
        sliderW.value = boxW;
        sliderH.value = boxH;
        
        valX.textContent = boxX + 'px';
        valY.textContent = boxY + 'px';
        valW.textContent = boxW + 'px';
        valH.textContent = boxH + 'px';
    }

    function handleSliderChange() {
        boxX = parseInt(sliderX.value, 10);
        boxY = parseInt(sliderY.value, 10);
        boxW = parseInt(sliderW.value, 10);
        boxH = parseInt(sliderH.value, 10);
        
        // Ensure box doesn't overflow boundaries
        if (boxX + boxW > imgWidth) boxW = imgWidth - boxX;
        if (boxY + boxH > imgHeight) boxH = imgHeight - boxY;
        
        presetSelect.value = 'custom';
        syncSliders();
        updateOverlayPosition();
    }

    // Add slider listeners
    [sliderX, sliderY, sliderW, sliderH].forEach(slider => {
        if (slider) {
            slider.addEventListener('input', handleSliderChange);
        }
    });

    if (presetSelect) {
        presetSelect.addEventListener('change', () => {
            applyPreset();
        });
    }

    // ==========================================================================
    // Overlay Drag & Resize Logic (Translates viewport positions to canvas coords)
    // ==========================================================================

    function updateOverlayPosition() {
        if (!loadedImage) return;

        // Get container and canvas bounding boxes
        const canvasRect = editorCanvas.getBoundingClientRect();
        
        // Scale ratio between canvas dimensions and its CSS bounding box
        const scaleX = canvasRect.width / imgWidth;
        const scaleY = canvasRect.height / imgHeight;
        
        selectionBox.style.left = (boxX * scaleX) + 'px';
        selectionBox.style.top = (boxY * scaleY) + 'px';
        selectionBox.style.width = (boxW * scaleX) + 'px';
        selectionBox.style.height = (boxH * scaleY) + 'px';
    }

    // Selection box mouse/touch events for dragging
    selectionBox.addEventListener('mousedown', startDrag);
    selectionBox.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        if (e.target === resizeHandle) {
            startResize(e);
            return;
        }
        
        e.preventDefault();
        isDragging = true;
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        startDragX = clientX;
        startDragY = clientY;
        startBoxX = boxX;
        startBoxY = boxY;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        const canvasRect = editorCanvas.getBoundingClientRect();
        const scaleX = imgWidth / canvasRect.width;
        const scaleY = imgHeight / canvasRect.height;
        
        const deltaX = (clientX - startDragX) * scaleX;
        const deltaY = (clientY - startDragY) * scaleY;
        
        boxX = Math.max(0, Math.min(imgWidth - boxW, Math.round(startBoxX + deltaX)));
        boxY = Math.max(0, Math.min(imgHeight - boxH, Math.round(startBoxY + deltaY)));
        
        presetSelect.value = 'custom';
        syncSliders();
        updateOverlayPosition();
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', stopDrag);
    }

    // Resize handle mouse/touch events
    function startResize(e) {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        startDragX = clientX;
        startDragY = clientY;
        startBoxW = boxW;
        startBoxH = boxH;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchmove', resize, { passive: false });
        document.addEventListener('touchend', stopResize);
    }

    function resize(e) {
        if (!isResizing) return;
        e.preventDefault();
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        const canvasRect = editorCanvas.getBoundingClientRect();
        const scaleX = imgWidth / canvasRect.width;
        const scaleY = imgHeight / canvasRect.height;
        
        const deltaW = (clientX - startDragX) * scaleX;
        const deltaH = (clientY - startDragY) * scaleY;
        
        boxW = Math.max(10, Math.min(imgWidth - boxX, Math.round(startBoxW + deltaW)));
        boxH = Math.max(10, Math.min(imgHeight - boxY, Math.round(startBoxH + deltaH)));
        
        presetSelect.value = 'custom';
        syncSliders();
        updateOverlayPosition();
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('touchend', stopResize);
    }

    // ==========================================================================
    // Laplace Jacobi Inpainting Core Algorithm (Executed locally)
    // ==========================================================================

    if (removeBtn) {
        removeBtn.addEventListener('click', processInpainting);
    }

    async function processInpainting() {
        if (!loadedImage) return;
        
        playPopSound();
        removeBtn.disabled = true;
        removeBtn.classList.add('disabled');
        const origText = removeBtn.textContent;
        removeBtn.textContent = msgLoading;

        // Let UI thread render the button state
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const ctx = editorCanvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight);
            
            // Perform Jacobi Laplace Diffusion on the bounded target region
            // We expand the region slightly by 2px to ensure boundary bleed isn't visible
            const pad = 2;
            const targetX = Math.max(0, boxX - pad);
            const targetY = Math.max(0, boxY - pad);
            const targetW = Math.min(imgWidth - targetX, boxW + (pad * 2));
            const targetH = Math.min(imgHeight - targetY, boxH + (pad * 2));
            
            // Run locally in a non-blocking progressive timeout layout
            await inpaintRegionLaplace(imgData, targetX, targetY, targetW, targetH);
            
            // Put modified pixel data back on canvas
            ctx.putImageData(imgData, 0, 0);
            
            playSuccessChime();
            incrementConvertedStats();
            triggerConfetti(removeBtn);
            
            // Show download button, hide processing state
            downloadBtn.classList.remove('hidden');
            removeBtn.disabled = false;
            removeBtn.classList.remove('disabled');
            removeBtn.textContent = origText;
            
            alert(msgDone);
        } catch (err) {
            console.error("Inpainting failure:", err);
            removeBtn.disabled = false;
            removeBtn.classList.remove('disabled');
            removeBtn.textContent = origText;
            alert("Error: " + err.message);
        }
    }

    /**
     * Laplace Inpainting using Jacobi iterations.
     * Computes the Dirichlet boundary conditions along the selection perimeter
     * and diffuses values into the target region iteratively.
     */
    function inpaintRegionLaplace(imgData, targetX, targetY, targetW, targetH) {
        return new Promise((resolve) => {
            const width = imgData.width;
            const data = imgData.data;
            
            // Jacobi iterations count. 120 gives a great balance between speed and bleed blend.
            const iterations = 120;
            
            // We create a mask for the region. 1 = target pixel, 0 = boundary (source) pixel
            const mask = new Uint8Array(targetW * targetH);
            for (let y = 0; y < targetH; y++) {
                for (let x = 0; x < targetW; x++) {
                    const globalX = targetX + x;
                    const globalY = targetY + y;
                    
                    // Exclude borders of the target block (they act as boundary conditions)
                    if (x === 0 || y === 0 || x === targetW - 1 || y === targetH - 1) {
                        mask[y * targetW + x] = 0;
                    } else {
                        mask[y * targetW + x] = 1;
                    }
                }
            }
            
            // Temporary buffers for RGB
            const rBuffer = new Float32Array(targetW * targetH);
            const gBuffer = new Float32Array(targetW * targetH);
            const bBuffer = new Float32Array(targetW * targetH);
            
            // Initialize buffers with original image colors
            for (let y = 0; y < targetH; y++) {
                for (let x = 0; x < targetW; x++) {
                    const idx = ((targetY + y) * width + (targetX + x)) * 4;
                    const bIdx = y * targetW + x;
                    rBuffer[bIdx] = data[idx];
                    gBuffer[bIdx] = data[idx + 1];
                    bBuffer[bIdx] = data[idx + 2];
                }
            }
            
            // Run Jacobi method iterations
            const nextR = new Float32Array(targetW * targetH);
            const nextG = new Float32Array(targetW * targetH);
            const nextB = new Float32Array(targetW * targetH);
            
            for (let iter = 0; iter < iterations; iter++) {
                for (let y = 1; y < targetH - 1; y++) {
                    for (let x = 1; x < targetW - 1; x++) {
                        const bIdx = y * targetW + x;
                        if (mask[bIdx] === 0) continue;
                        
                        // Laplace 4-neighborhood average
                        const top = (y - 1) * targetW + x;
                        const bottom = (y + 1) * targetW + x;
                        const left = y * targetW + (x - 1);
                        const right = y * targetW + (x + 1);
                        
                        nextR[bIdx] = (rBuffer[top] + rBuffer[bottom] + rBuffer[left] + rBuffer[right]) / 4;
                        nextG[bIdx] = (gBuffer[top] + gBuffer[bottom] + gBuffer[left] + gBuffer[right]) / 4;
                        nextB[bIdx] = (bBuffer[top] + bBuffer[bottom] + bBuffer[left] + bBuffer[right]) / 4;
                    }
                }
                
                // Copy next state back to buffers
                for (let y = 1; y < targetH - 1; y++) {
                    for (let x = 1; x < targetW - 1; x++) {
                        const bIdx = y * targetW + x;
                        if (mask[bIdx] === 0) continue;
                        rBuffer[bIdx] = nextR[bIdx];
                        gBuffer[bIdx] = nextG[bIdx];
                        bBuffer[bIdx] = nextB[bIdx];
                    }
                }
            }
            
            // Copy final diffused values back to imgData.data
            for (let y = 1; y < targetH - 1; y++) {
                for (let x = 1; x < targetW - 1; x++) {
                    const bIdx = y * targetW + x;
                    if (mask[bIdx] === 0) continue;
                    
                    const idx = ((targetY + y) * width + (targetX + x)) * 4;
                    data[idx] = Math.round(rBuffer[bIdx]);
                    data[idx + 1] = Math.round(gBuffer[bIdx]);
                    data[idx + 2] = Math.round(bBuffer[bIdx]);
                    // Alpha (data[idx+3]) remains unmodified
                }
            }
            
            resolve();
        });
    }

    // ==========================================================================
    // Reset & Download
    // ==========================================================================

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (loadedImage) {
                playPopSound();
                drawOriginal();
                downloadBtn.classList.add('hidden');
            }
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!loadedImage) return;
            
            playPopSound();
            
            // Canvas image download
            // Wrap in toBlob (which has the 2.5s global delay!)
            editorCanvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'clean_dalle_image.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    showThankYouModal();
                }, 3000);
            }, 'image/png');
        });
    }

    function showThankYouModal() {
        const modal = document.getElementById('thank-you-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
});
