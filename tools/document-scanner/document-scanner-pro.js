// Advanced Document Scanner like CamScanner with Batch Processing
class CamScannerClone {
    constructor() {
        this.scannedImages = [];
        this.currentBatch = [];
        this.isScanning = false;
        this.stream = null;
        this.scanMode = 'auto'; // auto, manual
        this.enhancementMode = 'enhanced'; // original, enhanced, grayscale
        this.pageSize = 'auto'; // auto, a4, letter, custom
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.loadSavedBatches();
    }

    setupCanvas() {
        this.canvas = document.getElementById('scan-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.previewCanvas = document.getElementById('preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
    }

    setupEventListeners() {
        // Camera controls
        document.getElementById('start-scan')?.addEventListener('click', () => this.startCamera());
        document.getElementById('stop-scan')?.addEventListener('click', () => this.stopCamera());
        document.getElementById('capture-page')?.addEventListener('click', () => this.captureDocument());
        document.getElementById('switch-camera')?.addEventListener('click', () => this.switchCamera());
        document.getElementById('toggle-flash')?.addEventListener('click', () => this.toggleFlash());

        // File upload
        document.getElementById('upload-images')?.addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('upload-btn')?.addEventListener('click', () => {
            document.getElementById('upload-images').click();
        });

        // Drag and drop
        this.setupDragAndDrop();

        // Batch management
        document.getElementById('new-batch')?.addEventListener('click', () => this.createNewBatch());
        document.getElementById('save-batch')?.addEventListener('click', () => this.saveBatch());
        document.getElementById('load-batch')?.addEventListener('click', () => this.loadBatch());
        document.getElementById('clear-batch')?.addEventListener('click', () => this.clearBatch());

        // Page editing
        document.getElementById('edit-page')?.addEventListener('click', () => this.editSelectedPage());
        document.getElementById('delete-page')?.addEventListener('click', () => this.deleteSelectedPage());
        document.getElementById('reorder-pages')?.addEventListener('click', () => this.enableReordering());

        // Enhancement controls
        document.getElementById('enhancement-mode')?.addEventListener('change', (e) => {
            this.enhancementMode = e.target.value;
            this.updatePreview();
        });

        document.getElementById('scan-mode')?.addEventListener('change', (e) => {
            this.scanMode = e.target.value;
        });

        document.getElementById('page-size')?.addEventListener('change', (e) => {
            this.pageSize = e.target.value;
        });

        // Export options
        document.getElementById('export-pdf')?.addEventListener('click', () => this.exportToPDF());
        document.getElementById('export-images')?.addEventListener('click', () => this.exportAsImages());
        document.getElementById('export-word')?.addEventListener('click', () => this.exportToWord());
        document.getElementById('share-batch')?.addEventListener('click', () => this.shareBatch());

        // Auto-processing controls
        document.getElementById('auto-crop')?.addEventListener('change', () => this.updatePreview());
        document.getElementById('auto-enhance')?.addEventListener('change', () => this.updatePreview());
        document.getElementById('auto-deskew')?.addEventListener('change', () => this.updatePreview());

        // Advanced editing
        document.getElementById('crop-tool')?.addEventListener('click', () => this.activateCropTool());
        document.getElementById('rotate-left')?.addEventListener('click', () => this.rotatePage(-90));
        document.getElementById('rotate-right')?.addEventListener('click', () => this.rotatePage(90));
        document.getElementById('brightness')?.addEventListener('input', (e) => this.adjustBrightness(e.target.value));
        document.getElementById('contrast')?.addEventListener('input', (e) => this.adjustContrast(e.target.value));
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('camera-container');
        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    async startCamera() {
        try {
            this.showLoading('Starting camera...');

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                throw new Error('No camera found');
            }

            // Prefer back camera for document scanning
            const backCamera = videoDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear')
            ) || videoDevices[0];

            const constraints = {
                video: {
                    deviceId: backCamera.deviceId,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    facingMode: { ideal: 'environment' }
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('camera-video');
            video.srcObject = this.stream;
            video.play();

            this.isScanning = true;

            // Setup camera controls
            document.getElementById('camera-controls').classList.remove('hidden');
            document.getElementById('start-scan').classList.add('hidden');
            document.getElementById('stop-scan').classList.remove('hidden');

            // Start automatic document detection if enabled
            if (this.scanMode === 'auto') {
                this.startDocumentDetection();
            }

            this.hideLoading();
            this.showSuccess('Camera started successfully!');

        } catch (error) {
            console.error('Error starting camera:', error);
            this.hideLoading();
            this.showError(`Failed to start camera: ${error.message}`);
        }
    }

    async stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.isScanning = false;

        document.getElementById('camera-controls').classList.add('hidden');
        document.getElementById('start-scan').classList.remove('hidden');
        document.getElementById('stop-scan').classList.add('hidden');

        const video = document.getElementById('camera-video');
        video.srcObject = null;
    }

    startDocumentDetection() {
        if (!this.isScanning) return;

        const video = document.getElementById('camera-video');
        const overlay = document.getElementById('detection-overlay');

        const detectDocument = () => {
            if (!this.isScanning) return;

            try {
                // Draw video frame to canvas for processing
                this.canvas.width = video.videoWidth;
                this.canvas.height = video.videoHeight;
                this.ctx.drawImage(video, 0, 0);

                // Detect document edges (simplified implementation)
                const edges = this.detectDocumentEdges();
                
                if (edges.length === 4) {
                    // Draw detected rectangle
                    this.drawDetectionOverlay(edges);
                    
                    // Auto-capture if confidence is high
                    if (this.scanMode === 'auto' && this.isDocumentStable(edges)) {
                        this.captureDocument();
                        return;
                    }
                } else {
                    overlay.innerHTML = '';
                }

            } catch (error) {
                console.error('Document detection error:', error);
            }

            requestAnimationFrame(detectDocument);
        };

        detectDocument();
    }

    detectDocumentEdges() {
        // Simplified edge detection - in a real implementation, 
        // you would use OpenCV.js or similar computer vision library
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // For demo purposes, return mock edges
        const w = this.canvas.width;
        const h = this.canvas.height;
        const margin = 50;
        
        return [
            { x: margin, y: margin },
            { x: w - margin, y: margin },
            { x: w - margin, y: h - margin },
            { x: margin, y: h - margin }
        ];
    }

    drawDetectionOverlay(edges) {
        const overlay = document.getElementById('detection-overlay');
        const video = document.getElementById('camera-video');
        const rect = video.getBoundingClientRect();
        
        const scaleX = rect.width / this.canvas.width;
        const scaleY = rect.height / this.canvas.height;
        
        overlay.innerHTML = `
            <svg class="absolute inset-0 w-full h-full pointer-events-none">
                <polygon 
                    points="${edges.map(p => `${p.x * scaleX},${p.y * scaleY}`).join(' ')}"
                    fill="rgba(0, 255, 0, 0.1)"
                    stroke="rgba(0, 255, 0, 0.8)"
                    stroke-width="2"
                />
            </svg>
        `;
    }

    isDocumentStable(edges) {
        // Check if document position is stable for auto-capture
        // This would track edge positions over multiple frames
        return true; // Simplified for demo
    }

    async captureDocument() {
        if (!this.isScanning) {
            this.showError('Camera not active');
            return;
        }

        try {
            const video = document.getElementById('camera-video');
            
            // Capture current frame
            this.canvas.width = video.videoWidth;
            this.canvas.height = video.videoHeight;
            this.ctx.drawImage(video, 0, 0);

            // Process the captured image
            const processedImage = await this.processDocumentImage();
            
            // Add to current batch
            this.addPageToBatch(processedImage);
            
            // Update UI
            this.updateBatchDisplay();
            
            // Show capture feedback
            this.showCaptureEffect();
            
            this.showSuccess('Document page captured!');

        } catch (error) {
            console.error('Error capturing document:', error);
            this.showError('Failed to capture document');
        }
    }

    async processDocumentImage() {
        // Get current image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply enhancements based on settings
        let processedData = imageData;
        
        if (document.getElementById('auto-crop')?.checked) {
            processedData = this.autoCrop(processedData);
        }
        
        if (document.getElementById('auto-deskew')?.checked) {
            processedData = this.autoDeskew(processedData);
        }
        
        if (document.getElementById('auto-enhance')?.checked) {
            processedData = this.autoEnhance(processedData);
        }
        
        // Apply enhancement mode
        switch (this.enhancementMode) {
            case 'enhanced':
                processedData = this.enhanceDocument(processedData);
                break;
            case 'grayscale':
                processedData = this.toGrayscale(processedData);
                break;
            case 'bw':
                processedData = this.toBlackAndWhite(processedData);
                break;
        }
        
        // Create canvas with processed image
        const processedCanvas = document.createElement('canvas');
        const processedCtx = processedCanvas.getContext('2d');
        processedCanvas.width = processedData.width;
        processedCanvas.height = processedData.height;
        processedCtx.putImageData(processedData, 0, 0);
        
        return {
            id: Date.now(),
            canvas: processedCanvas,
            dataURL: processedCanvas.toDataURL('image/jpeg', 0.9),
            timestamp: new Date().toISOString(),
            settings: {
                enhancementMode: this.enhancementMode,
                pageSize: this.pageSize
            }
        };
    }

    autoCrop(imageData) {
        // Implement automatic cropping
        // For demo, return original
        return imageData;
    }

    autoDeskew(imageData) {
        // Implement automatic deskewing
        // For demo, return original
        return imageData;
    }

    autoEnhance(imageData) {
        // Implement automatic enhancement
        const data = new Uint8ClampedArray(imageData.data);
        
        // Increase contrast and brightness
        for (let i = 0; i < data.length; i += 4) {
            // Increase contrast
            const factor = 1.2;
            data[i] = Math.min(255, (data[i] - 128) * factor + 128 + 10);     // R
            data[i + 1] = Math.min(255, (data[i + 1] - 128) * factor + 128 + 10); // G
            data[i + 2] = Math.min(255, (data[i + 2] - 128) * factor + 128 + 10); // B
        }
        
        return new ImageData(data, imageData.width, imageData.height);
    }

    enhanceDocument(imageData) {
        // Enhanced mode - optimize for document readability
        const data = new Uint8ClampedArray(imageData.data);
        
        for (let i = 0; i < data.length; i += 4) {
            // Convert to grayscale first
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            
            // Apply document enhancement
            const enhanced = gray > 127 ? Math.min(255, gray * 1.3) : Math.max(0, gray * 0.7);
            
            data[i] = enhanced;     // R
            data[i + 1] = enhanced; // G
            data[i + 2] = enhanced; // B
        }
        
        return new ImageData(data, imageData.width, imageData.height);
    }

    toGrayscale(imageData) {
        const data = new Uint8ClampedArray(imageData.data);
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;     // R
            data[i + 1] = gray; // G
            data[i + 2] = gray; // B
        }
        
        return new ImageData(data, imageData.width, imageData.height);
    }

    toBlackAndWhite(imageData) {
        const data = new Uint8ClampedArray(imageData.data);
        
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const bw = gray > 127 ? 255 : 0;
            data[i] = bw;     // R
            data[i + 1] = bw; // G
            data[i + 2] = bw; // B
        }
        
        return new ImageData(data, imageData.width, imageData.height);
    }

    addPageToBatch(page) {
        this.currentBatch.push(page);
        this.updateBatchStats();
    }

    updateBatchDisplay() {
        const container = document.getElementById('batch-pages');
        container.innerHTML = '';
        
        this.currentBatch.forEach((page, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = 'page-thumb relative cursor-pointer hover:shadow-lg transition-shadow';
            pageElement.innerHTML = `
                <img src="${page.dataURL}" alt="Page ${index + 1}" class="w-full h-24 object-cover rounded">
                <div class="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1 rounded">${index + 1}</div>
                <div class="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                    ${new Date(page.timestamp).toLocaleTimeString()}
                </div>
                <div class="absolute top-1 left-1">
                    <button onclick="documentScanner.editPage(${index})" class="bg-gray-700 text-white text-xs p-1 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
            
            pageElement.addEventListener('click', () => this.selectPage(index));
            container.appendChild(pageElement);
        });
    }

    updateBatchStats() {
        const stats = document.getElementById('batch-stats');
        if (stats) {
            const totalSize = this.currentBatch.reduce((sum, page) => sum + this.estimatePageSize(page), 0);
            stats.innerHTML = `
                <div class="text-sm text-gray-600">
                    ${this.currentBatch.length} pages • ${this.formatFileSize(totalSize)}
                </div>
            `;
        }
    }

    estimatePageSize(page) {
        // Rough estimation
        return page.dataURL.length * 0.75;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }

    selectPage(index) {
        this.selectedPageIndex = index;
        
        // Update page selection UI
        document.querySelectorAll('.page-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('ring-2', i === index);
            thumb.classList.toggle('ring-blue-500', i === index);
        });
        
        // Show page in preview
        if (this.currentBatch[index]) {
            this.showPagePreview(this.currentBatch[index]);
        }
    }

    showPagePreview(page) {
        const preview = document.getElementById('page-preview');
        if (preview) {
            preview.innerHTML = `
                <img src="${page.dataURL}" alt="Page Preview" class="max-w-full max-h-full object-contain">
            `;
        }
    }

    editPage(index) {
        this.selectedPageIndex = index;
        const page = this.currentBatch[index];
        
        if (page) {
            // Show page editor
            this.showPageEditor(page);
        }
    }

    showPageEditor(page) {
        // Show editing interface
        document.getElementById('page-editor').classList.remove('hidden');
        
        // Load page into editor canvas
        const editorCanvas = document.getElementById('editor-canvas');
        const editorCtx = editorCanvas.getContext('2d');
        
        const img = new Image();
        img.onload = () => {
            editorCanvas.width = img.width;
            editorCanvas.height = img.height;
            editorCtx.drawImage(img, 0, 0);
        };
        img.src = page.dataURL;
    }

    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                this.processUploadedImage(file);
            }
        });
    }

    async processUploadedImage(file) {
        try {
            const img = new Image();
            img.onload = async () => {
                // Draw to canvas
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                
                // Process as document
                const processedImage = await this.processDocumentImage();
                this.addPageToBatch(processedImage);
                this.updateBatchDisplay();
            };
            
            img.src = URL.createObjectURL(file);
            
        } catch (error) {
            console.error('Error processing uploaded image:', error);
            this.showError('Failed to process uploaded image');
        }
    }

    handleDrop(e) {
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
            imageFiles.forEach(file => this.processUploadedImage(file));
            this.showSuccess(`Processing ${imageFiles.length} image(s)...`);
        } else {
            this.showError('Please drop valid image files');
        }
    }

    createNewBatch() {
        if (this.currentBatch.length > 0 && 
            !confirm('Start a new batch? Current pages will be cleared.')) {
            return;
        }
        
        this.currentBatch = [];
        this.selectedPageIndex = -1;
        this.updateBatchDisplay();
        this.updateBatchStats();
        
        document.getElementById('page-preview').innerHTML = '';
        this.showSuccess('New batch created');
    }

    saveBatch() {
        if (this.currentBatch.length === 0) {
            this.showError('No pages to save');
            return;
        }
        
        const batchName = prompt('Enter batch name:', `Scan_${new Date().toDateString()}`);
        if (!batchName) return;
        
        const batch = {
            id: Date.now(),
            name: batchName,
            pages: this.currentBatch,
            created: new Date().toISOString(),
            pageCount: this.currentBatch.length
        };
        
        // Save to localStorage
        const savedBatches = JSON.parse(localStorage.getItem('documentBatches') || '[]');
        savedBatches.push(batch);
        localStorage.setItem('documentBatches', JSON.stringify(savedBatches));
        
        this.showSuccess(`Batch "${batchName}" saved successfully!`);
        this.updateSavedBatchesList();
    }

    loadSavedBatches() {
        this.updateSavedBatchesList();
    }

    updateSavedBatchesList() {
        const container = document.getElementById('saved-batches');
        if (!container) return;
        
        const savedBatches = JSON.parse(localStorage.getItem('documentBatches') || '[]');
        
        container.innerHTML = '';
        savedBatches.forEach(batch => {
            const batchElement = document.createElement('div');
            batchElement.className = 'saved-batch p-3 border rounded hover:bg-gray-50 cursor-pointer';
            batchElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium">${batch.name}</div>
                        <div class="text-sm text-gray-500">${batch.pageCount} pages</div>
                        <div class="text-xs text-gray-400">${new Date(batch.created).toLocaleDateString()}</div>
                    </div>
                    <div class="flex space-x-1">
                        <button onclick="documentScanner.loadBatch(${batch.id})" class="text-blue-600 text-sm">Load</button>
                        <button onclick="documentScanner.deleteBatch(${batch.id})" class="text-red-600 text-sm">Delete</button>
                    </div>
                </div>
            `;
            container.appendChild(batchElement);
        });
    }

    loadBatch(batchId) {
        const savedBatches = JSON.parse(localStorage.getItem('documentBatches') || '[]');
        const batch = savedBatches.find(b => b.id === batchId);
        
        if (batch) {
            this.currentBatch = batch.pages;
            this.updateBatchDisplay();
            this.updateBatchStats();
            this.showSuccess(`Batch "${batch.name}" loaded`);
        }
    }

    deleteBatch(batchId) {
        if (!confirm('Delete this batch permanently?')) return;
        
        const savedBatches = JSON.parse(localStorage.getItem('documentBatches') || '[]');
        const filteredBatches = savedBatches.filter(b => b.id !== batchId);
        localStorage.setItem('documentBatches', JSON.stringify(filteredBatches));
        
        this.updateSavedBatchesList();
        this.showSuccess('Batch deleted');
    }

    clearBatch() {
        if (this.currentBatch.length === 0) return;
        
        if (confirm('Clear all pages from current batch?')) {
            this.currentBatch = [];
            this.selectedPageIndex = -1;
            this.updateBatchDisplay();
            this.updateBatchStats();
            document.getElementById('page-preview').innerHTML = '';
        }
    }

    async exportToPDF() {
        if (this.currentBatch.length === 0) {
            this.showError('No pages to export');
            return;
        }
        
        try {
            this.showLoading('Generating PDF...');
            
            // This would use a PDF library like jsPDF
            // For demo, we'll create a simple implementation
            
            const { jsPDF } = window.jspdf || {};
            if (!jsPDF) {
                throw new Error('PDF library not loaded');
            }
            
            const pdf = new jsPDF();
            
            for (let i = 0; i < this.currentBatch.length; i++) {
                const page = this.currentBatch[i];
                
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Add page image to PDF
                const imgData = page.dataURL;
                pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0); // Auto height
            }
            
            pdf.save(`document-batch-${Date.now()}.pdf`);
            
            this.hideLoading();
            this.showSuccess('PDF exported successfully!');
            
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.hideLoading();
            this.showError('Failed to export PDF');
        }
    }

    async exportAsImages() {
        if (this.currentBatch.length === 0) {
            this.showError('No pages to export');
            return;
        }
        
        try {
            this.showLoading('Preparing images...');
            
            // Create ZIP file with all images
            const zip = new JSZip();
            
            this.currentBatch.forEach((page, index) => {
                const canvas = page.canvas;
                canvas.toBlob(blob => {
                    zip.file(`page-${index + 1}.jpg`, blob);
                }, 'image/jpeg', 0.9);
            });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const link = document.createElement('a');
            link.download = `document-images-${Date.now()}.zip`;
            link.href = URL.createObjectURL(zipBlob);
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            this.hideLoading();
            this.showSuccess('Images exported successfully!');
            
        } catch (error) {
            console.error('Error exporting images:', error);
            this.hideLoading();
            this.showError('Failed to export images');
        }
    }

    showCaptureEffect() {
        // Show visual feedback for capture
        const effect = document.createElement('div');
        effect.className = 'fixed inset-0 bg-white opacity-50 pointer-events-none z-50';
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 100);
    }

    showLoading(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.querySelector('p').textContent = message;
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white shadow-lg`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.documentScanner = new CamScannerClone();
});
