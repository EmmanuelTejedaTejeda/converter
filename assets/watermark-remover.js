/**
 * Convertify - Gemini Watermark Remover
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
    
    // String translations loaded from HTML data attributes
    const stringsEl = document.getElementById('watermark-strings');
    const msgSelect = stringsEl.dataset.msgSelect || 'Por favor selecciona una imagen primero';
    const msgDone = stringsEl.dataset.msgDone || 'Marca de agua eliminada con éxito';
    const msgLoading = stringsEl.dataset.msgLoading || 'Procesando...';
    
    // App State
    let loadedImage = null;
    let imgWidth = 0;
    let imgHeight = 0;
    
    // Selection box in actual image pixels
    let boxX = 0;
    let boxY = 0;
    let boxW = 48;
    let boxH = 48;
    
    // Interaction State
    let isDragging = false;
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startBoxX = 0;
    let startBoxY = 0;
    let startBoxW = 0;
    let startBoxH = 0;
    
    // Sound & Stats Integration
    let totalConverted = parseInt(localStorage.getItem('totalConverted') || '0', 10);

    function playPop() {
        if (window.playPopSoundExternal) {
            window.playPopSoundExternal();
        }
    }

    // ==========================================================================
    // File Handlers
    // ==========================================================================

    if (dropZone && fileInput) {


        fileInput.addEventListener('change', handleFileSelect);

        // Drag & Drop
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
                fileInput.files = files;
                handleFileSelect();
            }
        });
    }

    function handleFileSelect() {
        const file = fileInput.files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert(msgSelect);
            return;
        }

        playPop();

        const reader = new FileReader();
        reader.onload = (e) => {
            loadedImage = new Image();
            loadedImage.onload = () => {
                imgWidth = loadedImage.width;
                imgHeight = loadedImage.height;
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
        
        // Set default preset: Gemini Vertical
        presetSelect.value = 'gemini-vertical';
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
        
        if (preset === 'gemini-vertical') {
            boxW = 48;
            boxH = 48;
            boxX = Math.max(0, Math.min(imgWidth - boxW, 505));
            boxY = Math.max(0, Math.min(imgHeight - boxH, 957));
        } else if (preset === 'gemini-horizontal') {
            boxW = 48;
            boxH = 48;
            boxX = Math.max(0, Math.min(imgWidth - boxW, 953));
            boxY = Math.max(0, Math.min(imgHeight - boxH, 509));
        } else if (preset === 'gemini-square') {
            boxW = 48;
            boxH = 48;
            boxX = Math.max(0, Math.min(imgWidth - boxW, 953));
            boxY = Math.max(0, Math.min(imgHeight - boxH, 957));
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
        } else if (preset === 'bottom-left-48') {
            boxW = 48;
            boxH = 48;
            boxX = 0;
            boxY = Math.max(0, imgHeight - boxH);
        } else if (preset === 'bottom-left-96') {
            boxW = 96;
            boxH = 96;
            boxX = 0;
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

    [sliderX, sliderY, sliderW, sliderH].forEach(slider => {
        slider.addEventListener('input', handleSliderChange);
    });

    presetSelect.addEventListener('change', () => {
        playPop();
        applyPreset();
    });

    // ==========================================================================
    // Visual Overlay Positioning
    // ==========================================================================

    function updateOverlayPosition() {
        if (!loadedImage) return;
        
        // Calculate offset if canvas is centered in the container
        const containerRect = canvasContainer.getBoundingClientRect();
        const canvasRect = editorCanvas.getBoundingClientRect();
        
        const offsetX = canvasRect.left - containerRect.left;
        const offsetY = canvasRect.top - containerRect.top;
        
        // Calculate scale between canvas display size and actual image resolution
        const scaleX = canvasRect.width / imgWidth;
        const scaleY = canvasRect.height / imgHeight;
        
        // Position overlays
        selectionBox.style.left = (offsetX + boxX * scaleX) + 'px';
        selectionBox.style.top = (offsetY + boxY * scaleY) + 'px';
        selectionBox.style.width = (boxW * scaleX) + 'px';
        selectionBox.style.height = (boxH * scaleY) + 'px';
    }

    // ==========================================================================
    // Drag & Resize Mouse/Touch Interactions
    // ==========================================================================

    // Helper to calculate image-relative changes
    function getDisplayScale() {
        const rect = editorCanvas.getBoundingClientRect();
        return {
            scaleX: imgWidth / rect.width,
            scaleY: imgHeight / rect.height
        };
    }

    selectionBox.addEventListener('mousedown', (e) => {
        if (e.target === resizeHandle) return; // Handled separately
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startBoxX = boxX;
        startBoxY = boxY;
    });

    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startBoxW = boxW;
        startBoxH = boxH;
    });

    // Touch Support
    selectionBox.addEventListener('touchstart', (e) => {
        if (e.target === resizeHandle) return;
        isDragging = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startBoxX = boxX;
        startBoxY = boxY;
    });

    resizeHandle.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        isResizing = true;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startBoxW = boxW;
        startBoxH = boxH;
    });

    // Click/Tap on Canvas to move box instantly
    function handleCanvasClick(clientX, clientY) {
        if (isDragging || isResizing) return;
        
        const rect = editorCanvas.getBoundingClientRect();
        
        // Ensure click is within image bounds (ignore clicks on container padding)
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;

        const scaleX = imgWidth / rect.width;
        const scaleY = imgHeight / rect.height;

        const clickImgX = (clientX - rect.left) * scaleX;
        const clickImgY = (clientY - rect.top) * scaleY;

        boxX = Math.round(clickImgX - boxW / 2);
        boxY = Math.round(clickImgY - boxH / 2);

        // Constrain
        boxX = Math.max(0, Math.min(imgWidth - boxW, boxX));
        boxY = Math.max(0, Math.min(imgHeight - boxH, boxY));

        presetSelect.value = 'custom';
        syncSliders();
        updateOverlayPosition();
    }

    canvasContainer.addEventListener('mousedown', (e) => {
        if (e.target === selectionBox || e.target === resizeHandle) return;
        handleCanvasClick(e.clientX, e.clientY);
    });

    canvasContainer.addEventListener('touchstart', (e) => {
        if (e.target === selectionBox || e.target === resizeHandle) return;
        const touch = e.touches[0];
        handleCanvasClick(touch.clientX, touch.clientY);
    });

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('touchmove', handlePointerMove, { passive: false });

    function handlePointerMove(e) {
        if (!isDragging && !isResizing) return;
        
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX === undefined || clientY === undefined) return;
        
        const deltaX = clientX - startX;
        const deltaY = clientY - startY;
        const scale = getDisplayScale();
        const imgDeltaX = deltaX * scale.scaleX;
        const imgDeltaY = deltaY * scale.scaleY;
        
        if (isDragging) {
            boxX = Math.round(startBoxX + imgDeltaX);
            boxY = Math.round(startBoxY + imgDeltaY);
            
            // Constrain boundaries
            boxX = Math.max(0, Math.min(imgWidth - boxW, boxX));
            boxY = Math.max(0, Math.min(imgHeight - boxH, boxY));
        } else if (isResizing) {
            boxW = Math.round(startBoxW + imgDeltaX);
            boxH = Math.round(startBoxH + imgDeltaY);
            
            // Constrain minimum and maximum size
            boxW = Math.max(10, Math.min(imgWidth - boxX, boxW));
            boxH = Math.max(10, Math.min(imgHeight - boxY, boxH));
        }
        
        presetSelect.value = 'custom';
        syncSliders();
        updateOverlayPosition();
    }

    document.addEventListener('mouseup', handlePointerEnd);
    document.addEventListener('touchend', handlePointerEnd);

    function handlePointerEnd() {
        isDragging = false;
        isResizing = false;
    }

    // ==========================================================================
    // Inpainting Algorithm (Jacobi Boundary Interpolation)
    // ==========================================================================

    // ==========================================================================
    // Inpainting Algorithm (OpenCV Telea + Jacobi Fallback)
    // ==========================================================================

    function manualInpaintRect(ctx, bx, by, bw, bh) {
        const canvas = ctx.canvas;
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = imgData.width;
        const height = imgData.height;

        // Copy original buffer to read pristine boundary colors
        const dataCopy = new Uint8ClampedArray(data);

        function getPixel(x, y) {
            if (x < 0 || x >= width || y < 0 || y >= height) return null;
            const idx = (y * width + x) * 4;
            return [dataCopy[idx], dataCopy[idx+1], dataCopy[idx+2], dataCopy[idx+3]];
        }

        // Apply inverse squared distance boundary interpolation
        for (let py = by; py < by + bh; py++) {
            for (let px = bx; px < bx + bw; px++) {
                if (px < 0 || px >= width || py < 0 || py >= height) continue;

                // Grab corresponding boundary pixels
                const pLeft = getPixel(bx - 1, py);
                const pRight = getPixel(bx + bw, py);
                const pTop = getPixel(px, by - 1);
                const pBottom = getPixel(px, by + bh);

                let rSum = 0, gSum = 0, bSum = 0, aSum = 0, wSum = 0;

                if (pLeft) {
                    const d = px - bx + 1;
                    const w = 1 / (d * d);
                    rSum += pLeft[0] * w;
                    gSum += pLeft[1] * w;
                    bSum += pLeft[2] * w;
                    aSum += pLeft[3] * w;
                    wSum += w;
                }
                if (pRight) {
                    const d = bx + bw - px;
                    const w = 1 / (d * d);
                    rSum += pRight[0] * w;
                    gSum += pRight[1] * w;
                    bSum += pRight[2] * w;
                    aSum += pRight[3] * w;
                    wSum += w;
                }
                if (pTop) {
                    const d = py - by + 1;
                    const w = 1 / (d * d);
                    rSum += pTop[0] * w;
                    gSum += pTop[1] * w;
                    bSum += pTop[2] * w;
                    aSum += pTop[3] * w;
                    wSum += w;
                }
                if (pBottom) {
                    const d = by + bh - py;
                    const w = 1 / (d * d);
                    rSum += pBottom[0] * w;
                    gSum += pBottom[1] * w;
                    bSum += pBottom[2] * w;
                    aSum += pBottom[3] * w;
                    wSum += w;
                }

                if (wSum > 0) {
                    const idx = (py * width + px) * 4;
                    data[idx] = Math.round(rSum / wSum);
                    data[idx+1] = Math.round(gSum / wSum);
                    data[idx+2] = Math.round(bSum / wSum);
                    data[idx+3] = 255; // Set fully opaque to prevent transparency issues

                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
    }

    function inpaintRect(ctx, bx, by, bw, bh) {
        // Check if OpenCV is loaded and WebAssembly is fully initialized
        if (typeof cv !== 'undefined' && cv.Mat && window.cvReady) {
            try {
                const src = cv.imread(ctx.canvas);
                const mask = new cv.Mat(src.rows, src.cols, cv.CV_8UC1, new cv.Scalar(0));
                
                // Draw white rectangle on the mask where the watermark is
                const point1 = new cv.Point(bx, by);
                const point2 = new cv.Point(bx + bw, by + bh);
                // -1 thickness means filled rectangle
                cv.rectangle(mask, point1, point2, new cv.Scalar(255, 255, 255, 255), -1, cv.LINE_8, 0);
                
                const dst = new cv.Mat();
                
                // Perform Telea Inpainting (radius 3)
                cv.inpaint(src, mask, dst, 3, cv.INPAINT_TELEA);
                
                // Render back to canvas
                cv.imshow(ctx.canvas, dst);
                
                // Free memory to avoid WebAssembly memory leaks
                src.delete();
                mask.delete();
                dst.delete();
                return;
            } catch (err) {
                console.warn("OpenCV inpainting failed, using mathematical fallback:", err);
            }
        }
        
        // Fallback to manual algorithm if OpenCV is not loaded or failed
        manualInpaintRect(ctx, bx, by, bw, bh);
    }

    // ==========================================================================
    // Inpainting Actions & Download
    // ==========================================================================

    removeBtn.addEventListener('click', () => {
        if (!loadedImage) return;

        playPop();
        
        // Change button state to loading
        removeBtn.disabled = true;
        const originalText = removeBtn.innerHTML;
        removeBtn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg> ${msgLoading}`;
        
        setTimeout(() => {
            // Restore original image canvas and run inpainting on it
            drawOriginal();
            const ctx = editorCanvas.getContext('2d');
            inpaintRect(ctx, boxX, boxY, boxW, boxH);
            
            // Re-render overlay box and change states
            updateOverlayPosition();
            removeBtn.disabled = false;
            removeBtn.innerHTML = originalText;
            
            // Show download, play success sound and trigger confetti
            downloadBtn.classList.remove('hidden');
            
            if (window.confetti) {
                window.confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.8 }
                });
            }
            
            // Increment statistics
            totalConverted++;
            localStorage.setItem('totalConverted', totalConverted);
            const statsNum = document.getElementById('stats-number');
            if (statsNum) statsNum.textContent = totalConverted;
            
            // Show modal thank you popup
            const modal = document.getElementById('thank-you-modal');
            if (modal) {
                setTimeout(() => {
                    modal.classList.remove('hidden');
                }, 800);
            }
        }, 300);
    });

    downloadBtn.addEventListener('click', () => {
        playPop();
        
        // Export Canvas to Blob
        editorCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            // Create a clean filename
            const inputName = fileInput.files[0] ? fileInput.files[0].name : 'gemini-limpia';
            const cleanName = inputName.replace(/\.[^/.]+$/, "") + '_no_watermark.png';
            
            a.href = url;
            a.download = cleanName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    });

    resetBtn.addEventListener('click', () => {
        playPop();
        drawOriginal();
        downloadBtn.classList.add('hidden');
    });
    
    // Close Modal Event
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('thank-you-modal');
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener('click', () => {
            playPop();
            modal.classList.add('hidden');
        });
    }
});
