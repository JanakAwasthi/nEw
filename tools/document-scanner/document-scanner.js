class DocumentScanner {
    constructor() {
        this.stream = null;
        this.originalImage = null;
        this.enhancedImage = null;
        this.canvas = null;
        this.ctx = null;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Camera elements
        this.startCameraBtn = document.getElementById('startCameraBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.imageInput = document.getElementById('imageInput');
        this.cameraInterface = document.getElementById('cameraInterface');
        this.cameraVideo = document.getElementById('cameraVideo');
        this.cameraCanvas = document.getElementById('cameraCanvas');
        this.captureBtn = document.getElementById('captureBtn');
        this.stopCameraBtn = document.getElementById('stopCameraBtn');
        
        // Preview elements
        this.documentPreview = document.getElementById('documentPreview');
        this.originalImage = document.getElementById('originalImage');
        this.enhancedImage = document.getElementById('enhancedImage');
        this.processCanvas = document.getElementById('processCanvas');
        this.processingStatus = document.getElementById('processingStatus');
        
        // Enhancement controls
        this.brightnessSlider = document.getElementById('brightnessSlider');
        this.contrastSlider = document.getElementById('contrastSlider');
        this.sharpnessSlider = document.getElementById('sharpnessSlider');
        this.thresholdSlider = document.getElementById('thresholdSlider');
        
        this.brightnessValue = document.getElementById('brightnessValue');
        this.contrastValue = document.getElementById('contrastValue');
        this.sharpnessValue = document.getElementById('sharpnessValue');
        this.thresholdValue = document.getElementById('thresholdValue');
        
        // Action buttons
        this.autoEnhanceBtn = document.getElementById('autoEnhanceBtn');
        this.downloadImageBtn = document.getElementById('downloadImageBtn');
        this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
        this.newScanBtn = document.getElementById('newScanBtn');
        
        // Filter presets
        this.filterPresets = document.querySelectorAll('.filter-preset');
    }

    attachEventListeners() {
        // Camera controls
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.stopCameraBtn.addEventListener('click', () => this.stopCamera());
        this.captureBtn.addEventListener('click', () => this.captureImage());
        
        // Upload
        this.uploadBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Enhancement sliders
        this.brightnessSlider.addEventListener('input', () => this.updateEnhancement());
        this.contrastSlider.addEventListener('input', () => this.updateEnhancement());
        this.sharpnessSlider.addEventListener('input', () => this.updateEnhancement());
        this.thresholdSlider.addEventListener('input', () => this.updateEnhancement());
        
        // Action buttons
        this.autoEnhanceBtn.addEventListener('click', () => this.autoEnhance());
        this.downloadImageBtn.addEventListener('click', () => this.downloadImage());
        this.downloadPdfBtn.addEventListener('click', () => this.downloadPDF());
        this.newScanBtn.addEventListener('click', () => this.resetScanner());
        
        // Filter presets
        this.filterPresets.forEach(preset => {
            preset.addEventListener('click', (e) => this.applyPreset(e.target.dataset.preset));
        });
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.cameraVideo.srcObject = this.stream;
            this.cameraInterface.classList.remove('hidden');
            this.startCameraBtn.style.display = 'none';
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please ensure you have granted camera permissions.');
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.cameraInterface.classList.add('hidden');
        this.startCameraBtn.style.display = 'inline-block';
    }

    captureImage() {
        const video = this.cameraVideo;
        const canvas = this.cameraCanvas;
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg');
        this.processImage(imageData);
        this.stopCamera();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.processImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    processImage(imageData) {
        this.showProcessing();
        
        // Display original image
        this.originalImage.src = imageData;
        this.originalImage.onload = () => {
            this.setupCanvas();
            this.enhanceDocument();
            this.showPreview();
            this.hideProcessing();
        };
    }

    setupCanvas() {
        const img = this.originalImage;
        this.canvas = this.processCanvas;
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = img.naturalWidth;
        this.canvas.height = img.naturalHeight;
        
        this.ctx.drawImage(img, 0, 0);
        this.updateEnhancedPreview();
    }

    enhanceDocument() {
        // Apply basic document enhancement
        this.applyPreset('document');
    }

    updateEnhancement() {
        if (!this.canvas) return;
        
        const brightness = parseInt(this.brightnessSlider.value);
        const contrast = parseInt(this.contrastSlider.value);
        const sharpness = parseInt(this.sharpnessSlider.value);
        const threshold = parseInt(this.thresholdSlider.value);
        
        // Update value displays
        this.brightnessValue.textContent = brightness;
        this.contrastValue.textContent = contrast;
        this.sharpnessValue.textContent = sharpness;
        this.thresholdValue.textContent = threshold;
        
        // Apply enhancements
        this.applyImageFilters(brightness, contrast, sharpness, threshold);
        this.updateEnhancedPreview();
    }

    applyImageFilters(brightness, contrast, sharpness, threshold) {
        if (!this.originalImage || !this.canvas) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear and redraw original
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(this.originalImage, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply filters
        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];
            
            // Brightness
            r += brightness;
            g += brightness;
            b += brightness;
            
            // Contrast
            const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;
            
            // Clamp values
            r = Math.max(0, Math.min(255, r));
            g = Math.max(0, Math.min(255, g));
            b = Math.max(0, Math.min(255, b));
            
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    applyPreset(preset) {
        switch (preset) {
            case 'original':
                this.resetEnhancement();
                break;
            case 'document':
                this.brightnessSlider.value = 10;
                this.contrastSlider.value = 20;
                this.sharpnessSlider.value = 15;
                this.thresholdSlider.value = 128;
                break;
            case 'blackwhite':
                this.brightnessSlider.value = 0;
                this.contrastSlider.value = 30;
                this.sharpnessSlider.value = 20;
                this.thresholdSlider.value = 100;
                break;
            case 'grayscale':
                this.brightnessSlider.value = 5;
                this.contrastSlider.value = 15;
                this.sharpnessSlider.value = 10;
                this.thresholdSlider.value = 128;
                break;
            case 'vivid':
                this.brightnessSlider.value = 15;
                this.contrastSlider.value = 25;
                this.sharpnessSlider.value = 30;
                this.thresholdSlider.value = 128;
                break;
        }
        
        this.updateEnhancement();
    }

    resetEnhancement() {
        this.brightnessSlider.value = 0;
        this.contrastSlider.value = 0;
        this.sharpnessSlider.value = 0;
        this.thresholdSlider.value = 128;
        this.updateEnhancement();
    }

    autoEnhance() {
        // Apply automatic enhancement
        this.applyPreset('document');
    }

    updateEnhancedPreview() {
        if (this.canvas) {
            this.enhancedImage.src = this.canvas.toDataURL('image/jpeg', 0.9);
        }
    }

    downloadImage() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = `scanned-document-${Date.now()}.jpg`;
        link.href = this.canvas.toDataURL('image/jpeg', 0.9);
        link.click();
    }

    async downloadPDF() {
        if (!this.canvas) return;
        
        try {
            const { jsPDF } = window.jspdf || await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            const imgData = this.canvas.toDataURL('image/jpeg', 0.9);
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (this.canvas.height * imgWidth) / this.canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
            pdf.save(`scanned-document-${Date.now()}.pdf`);
            
        } catch (error) {
            console.error('Error creating PDF:', error);
            alert('Error creating PDF. Please try downloading as image instead.');
        }
    }

    resetScanner() {
        this.stopCamera();
        this.documentPreview.classList.add('hidden');
        this.originalImage.src = '';
        this.enhancedImage.src = '';
        this.canvas = null;
        this.ctx = null;
        this.resetEnhancement();
        this.imageInput.value = '';
    }

    showProcessing() {
        this.processingStatus.classList.remove('hidden');
        this.documentPreview.classList.add('hidden');
    }

    hideProcessing() {
        this.processingStatus.classList.add('hidden');
    }

    showPreview() {
        this.documentPreview.classList.remove('hidden');
    }
}

// Load jsPDF if not already loaded
if (!window.jspdf) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script);
}

// Initialize the document scanner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DocumentScanner();
});
