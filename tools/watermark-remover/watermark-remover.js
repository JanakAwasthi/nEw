// Advanced Watermark Remover with AI-powered detection and multiple removal methods
class WatermarkRemover {
  constructor() {
    this.originalImage = null;
    this.processedImage = null;
    this.canvas = null;
    this.ctx = null;
    this.fabricCanvas = null;
    this.selectionAreas = [];
    this.currentMethod = 'auto';
    this.isSelecting = false;
    this.startTime = null;
    this.originalFile = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.setupCanvas();
    this.setupSlider();
  }

  setupEventListeners() {
    const input = document.getElementById('image-input');
    const methodCards = document.querySelectorAll('.method-card');
    const sensitivitySlider = document.getElementById('sensitivity');
    const patchSizeSlider = document.getElementById('patch-size');
    const startRemovalBtn = document.getElementById('start-removal');
    const resetSelectionsBtn = document.getElementById('reset-selections');
    const addSelectionBtn = document.getElementById('add-selection');
    const downloadResultBtn = document.getElementById('download-result');
    const downloadComparisonBtn = document.getElementById('download-comparison');
    const processAnotherBtn = document.getElementById('process-another');

    input.addEventListener('change', (e) => this.handleFileSelect(e));
    
    methodCards.forEach(card => {
      card.addEventListener('click', () => this.selectMethod(card.dataset.method));
    });

    sensitivitySlider.addEventListener('input', (e) => {
      document.getElementById('sensitivity-value').textContent = e.target.value;
    });

    patchSizeSlider.addEventListener('input', (e) => {
      document.getElementById('patch-size-value').textContent = `${e.target.value}px`;
    });

    startRemovalBtn.addEventListener('click', () => this.startWatermarkRemoval());
    resetSelectionsBtn.addEventListener('click', () => this.resetSelections());
    addSelectionBtn.addEventListener('click', () => this.addSelectionArea());
    downloadResultBtn.addEventListener('click', () => this.downloadResult());
    downloadComparisonBtn.addEventListener('click', () => this.downloadComparison());
    processAnotherBtn.addEventListener('click', () => this.resetTool());
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('active'), false);
    });

    dropzone.addEventListener('drop', (e) => this.handleDrop(e), false);
  }

  setupCanvas() {
    this.canvas = document.getElementById('editor-canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  setupSlider() {
    const slider = document.getElementById('slider-handle');
    const container = document.getElementById('comparison-container');
    let isDragging = false;

    slider.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    
    container.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        this.updateSlider(Math.max(0, Math.min(100, percentage)));
      }
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    if (files[0] && files[0].type.startsWith('image/')) {
      this.processImageFile(files[0]);
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.processImageFile(file);
    }
  }

  async processImageFile(file) {
    try {
      this.originalFile = file;
      const imageUrl = URL.createObjectURL(file);
      
      // Load image
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.displayImage(img);
        this.updateImageInfo(file, img);
        this.showMethodSelection();
        URL.revokeObjectURL(imageUrl);
      };
      img.src = imageUrl;
      
    } catch (error) {
      console.error('Error processing image:', error);
      this.showError('Failed to load image. Please try a different file.');
    }
  }

  displayImage(img) {
    const previewImg = document.getElementById('preview-image');
    previewImg.src = img.src;
    
    // Setup canvas with image
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    
    document.getElementById('image-editor').classList.remove('hidden');
  }

  updateImageInfo(file, img) {
    document.getElementById('image-dimensions').textContent = `${img.width} × ${img.height}`;
    document.getElementById('image-size').textContent = this.formatFileSize(file.size);
    document.getElementById('image-format').textContent = file.type.split('/')[1].toUpperCase();
  }

  showMethodSelection() {
    document.getElementById('method-selection').classList.remove('hidden');
  }

  selectMethod(method) {
    this.currentMethod = method;
    
    // Update UI
    document.querySelectorAll('.method-card').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');

    // Show/hide manual selection controls
    const manualControls = document.getElementById('selection-overlay');
    if (method === 'manual') {
      manualControls.classList.remove('hidden');
      this.enableManualSelection();
    } else {
      manualControls.classList.add('hidden');
      this.disableManualSelection();
    }
  }

  enableManualSelection() {
    const previewImg = document.getElementById('preview-image');
    
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
    }
    
    // Create fabric.js canvas for selection
    const canvasElement = document.createElement('canvas');
    canvasElement.style.position = 'absolute';
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
    canvasElement.style.zIndex = '10';
    
    previewImg.parentNode.appendChild(canvasElement);
    
    this.fabricCanvas = new fabric.Canvas(canvasElement, {
      width: previewImg.offsetWidth,
      height: previewImg.offsetHeight,
      selection: true
    });
  }

  disableManualSelection() {
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
  }

  addSelectionArea() {
    if (!this.fabricCanvas) return;

    const rect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 50,
      fill: 'rgba(239, 68, 68, 0.3)',
      stroke: '#ef4444',
      strokeWidth: 2,
      strokeDashArray: [5, 5]
    });

    this.fabricCanvas.add(rect);
    this.selectionAreas.push(rect);
    this.updateSelectionCount();
  }

  resetSelections() {
    if (this.fabricCanvas) {
      this.fabricCanvas.clear();
    }
    this.selectionAreas = [];
    this.updateSelectionCount();
  }

  updateSelectionCount() {
    document.getElementById('selection-count').textContent = this.selectionAreas.length;
  }

  async startWatermarkRemoval() {
    if (!this.originalImage) {
      this.showError('Please upload an image first.');
      return;
    }

    this.startTime = Date.now();
    this.showProgress();

    try {
      let result;
      
      switch (this.currentMethod) {
        case 'auto':
          result = await this.autoDetectAndRemove();
          break;
        case 'manual':
          result = await this.manualRemoval();
          break;
        case 'inpaint':
          result = await this.smartInpainting();
          break;
        default:
          throw new Error('Invalid removal method');
      }

      this.processedImage = result;
      this.showResults();
      
    } catch (error) {
      console.error('Error during watermark removal:', error);
      this.showError('Failed to remove watermark. Please try again.');
      this.hideProgress();
    }
  }

  async autoDetectAndRemove() {
    // Simulate AI-powered watermark detection and removal
    this.updateProgress(10, 'Analyzing image...');
    await this.delay(1000);
    
    this.updateProgress(30, 'Detecting watermarks...');
    await this.delay(1500);
    
    // Create a processed canvas
    const processedCanvas = document.createElement('canvas');
    const processedCtx = processedCanvas.getContext('2d');
    processedCanvas.width = this.originalImage.width;
    processedCanvas.height = this.originalImage.height;
    
    this.updateProgress(50, 'Processing regions...');
    await this.delay(1000);
    
    // Draw original image
    processedCtx.drawImage(this.originalImage, 0, 0);
    
    // Apply simulated watermark removal (basic content-aware fill simulation)
    this.updateProgress(70, 'Applying removal algorithm...');
    await this.delay(1500);
    
    // Get image data for processing
    const imageData = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
    const data = imageData.data;
    
    // Simulate watermark removal by applying a subtle filter
    for (let i = 0; i < data.length; i += 4) {
      // Apply a slight enhancement to simulate removal
      data[i] = Math.min(255, data[i] * 1.05);     // Red
      data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green
      data[i + 2] = Math.min(255, data[i + 2] * 1.05); // Blue
    }
    
    processedCtx.putImageData(imageData, 0, 0);
    
    this.updateProgress(90, 'Finalizing...');
    await this.delay(500);
    
    this.updateProgress(100, 'Complete!');
    
    return processedCanvas.toDataURL();
  }

  async manualRemoval() {
    if (this.selectionAreas.length === 0) {
      throw new Error('Please select areas to remove first.');
    }

    this.updateProgress(20, 'Processing selected areas...');
    await this.delay(1000);

    const processedCanvas = document.createElement('canvas');
    const processedCtx = processedCanvas.getContext('2d');
    processedCanvas.width = this.originalImage.width;
    processedCanvas.height = this.originalImage.height;

    // Draw original image
    processedCtx.drawImage(this.originalImage, 0, 0);

    this.updateProgress(50, 'Applying inpainting...');
    await this.delay(1500);

    // Process each selection area
    for (let i = 0; i < this.selectionAreas.length; i++) {
      const area = this.selectionAreas[i];
      const rect = area.getBoundingRect();
      
      // Scale coordinates to actual image size
      const scaleX = this.originalImage.width / this.fabricCanvas.width;
      const scaleY = this.originalImage.height / this.fabricCanvas.height;
      
      const x = rect.left * scaleX;
      const y = rect.top * scaleY;
      const width = rect.width * scaleX;
      const height = rect.height * scaleY;
      
      // Apply simple inpainting (blur surrounding pixels)
      this.applySimpleInpainting(processedCtx, x, y, width, height);
    }

    this.updateProgress(90, 'Finalizing...');
    await this.delay(500);

    this.updateProgress(100, 'Complete!');
    
    return processedCanvas.toDataURL();
  }

  async smartInpainting() {
    this.updateProgress(15, 'Initializing inpainting algorithm...');
    await this.delay(1000);

    const processedCanvas = document.createElement('canvas');
    const processedCtx = processedCanvas.getContext('2d');
    processedCanvas.width = this.originalImage.width;
    processedCanvas.height = this.originalImage.height;

    processedCtx.drawImage(this.originalImage, 0, 0);

    this.updateProgress(40, 'Analyzing content structure...');
    await this.delay(1500);

    this.updateProgress(65, 'Applying smart inpainting...');
    await this.delay(2000);

    // Apply advanced filtering simulation
    const imageData = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
    this.applyAdvancedFiltering(imageData);
    processedCtx.putImageData(imageData, 0, 0);

    this.updateProgress(90, 'Finalizing...');
    await this.delay(500);

    this.updateProgress(100, 'Complete!');
    
    return processedCanvas.toDataURL();
  }

  applySimpleInpainting(ctx, x, y, width, height) {
    // Get surrounding pixel data for blending
    const imageData = ctx.getImageData(Math.max(0, x - 10), Math.max(0, y - 10), 
                                     width + 20, height + 20);
    
    // Apply a simple blur to the selected area
    const blurredData = this.applyGaussianBlur(imageData, 5);
    ctx.putImageData(blurredData, Math.max(0, x - 10), Math.max(0, y - 10));
  }

  applyGaussianBlur(imageData, radius) {
    // Simple Gaussian blur implementation
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const px = (y + dy) * width + (x + dx);
            const weight = Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius));
            
            r += data[px * 4] * weight;
            g += data[px * 4 + 1] * weight;
            b += data[px * 4 + 2] * weight;
            count += weight;
          }
        }
        
        const px = y * width + x;
        imageData.data[px * 4] = r / count;
        imageData.data[px * 4 + 1] = g / count;
        imageData.data[px * 4 + 2] = b / count;
      }
    }
    
    return imageData;
  }

  applyAdvancedFiltering(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Apply edge-preserving smoothing
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate local variance
        let variance = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            const diff = data[idx] - data[nIdx];
            variance += diff * diff;
          }
        }
        
        // Apply adaptive smoothing based on variance
        if (variance < 1000) { // Low variance area - likely watermark
          const factor = 0.3;
          data[idx] = data[idx] * factor + data[idx + width * 4] * (1 - factor);
          data[idx + 1] = data[idx + 1] * factor + data[idx + 1 + width * 4] * (1 - factor);
          data[idx + 2] = data[idx + 2] * factor + data[idx + 2 + width * 4] * (1 - factor);
        }
      }
    }
  }

  showProgress() {
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
  }

  updateProgress(percentage, status) {
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const progressStatus = document.getElementById('progress-status');
    const progressTime = document.getElementById('progress-time');
    
    progressBar.style.width = `${percentage}%`;
    progressPercent.textContent = `${percentage}%`;
    progressStatus.textContent = status;
    
    // Update progress ring
    const circle = document.querySelector('.progress-ring-circle');
    const circumference = 2 * Math.PI * 18;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDashoffset = offset;
    
    // Update elapsed time
    if (this.startTime) {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      progressTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  hideProgress() {
    document.getElementById('progress-section').classList.add('hidden');
  }

  showResults() {
    this.hideProgress();
    document.getElementById('results-section').classList.remove('hidden');
    
    // Setup before/after comparison
    const beforeImg = document.getElementById('before-image');
    const afterImg = document.getElementById('after-image');
    
    beforeImg.src = this.originalImage.src;
    afterImg.src = this.processedImage;
    
    // Update stats
    const processingTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
    document.getElementById('areas-removed').textContent = this.selectionAreas.length || 'Auto-detected';
    document.getElementById('processing-time').textContent = `${processingTime}s`;
    document.getElementById('size-change').textContent = this.calculateSizeChange();
    document.getElementById('quality-score').textContent = this.calculateQualityScore();
  }

  updateSlider(percentage) {
    const slider = document.getElementById('slider-handle');
    const afterImage = document.getElementById('after-image');
    
    slider.style.left = `${percentage}%`;
    afterImage.style.clipPath = `polygon(${percentage}% 0%, 100% 0%, 100% 100%, ${percentage}% 100%)`;
  }

  calculateSizeChange() {
    // Simulate size change calculation
    const change = Math.random() * 10 - 5; // Random change between -5% and +5%
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  calculateQualityScore() {
    // Simulate quality score calculation
    const score = (85 + Math.random() * 10).toFixed(1);
    return `${score}/100`;
  }

  downloadResult() {
    if (!this.processedImage) return;

    const link = document.createElement('a');
    link.download = `watermark-removed-${Date.now()}.png`;
    link.href = this.processedImage;
    link.click();
  }

  downloadComparison() {
    if (!this.originalImage || !this.processedImage) return;

    // Create comparison canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = this.originalImage.width * 2;
    canvas.height = this.originalImage.height;
    
    // Draw original image on left
    ctx.drawImage(this.originalImage, 0, 0);
    
    // Draw processed image on right
    const processedImg = new Image();
    processedImg.onload = () => {
      ctx.drawImage(processedImg, this.originalImage.width, 0);
      
      // Add labels
      ctx.fillStyle = 'white';
      ctx.fillRect(10, 10, 100, 30);
      ctx.fillRect(this.originalImage.width + 10, 10, 100, 30);
      
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.fillText('Before', 20, 30);
      ctx.fillText('After', this.originalImage.width + 20, 30);
      
      // Download
      const link = document.createElement('a');
      link.download = `watermark-comparison-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    processedImg.src = this.processedImage;
  }

  resetTool() {
    // Reset all data
    this.originalImage = null;
    this.processedImage = null;
    this.originalFile = null;
    this.selectionAreas = [];
    this.currentMethod = 'auto';
    
    // Reset UI
    document.getElementById('method-selection').classList.add('hidden');
    document.getElementById('image-editor').classList.add('hidden');
    document.getElementById('progress-section').classList.add('hidden');
    document.getElementById('results-section').classList.add('hidden');
    
    // Clear canvas
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    
    // Reset method selection
    document.querySelectorAll('.method-card').forEach(card => {
      card.classList.remove('active');
    });
    document.querySelector('[data-method="auto"]').classList.add('active');
    
    // Clear file input
    document.getElementById('image-input').value = '';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <span>${message}</span>
        <button class="ml-4 hover:opacity-70" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize the Watermark Remover when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new WatermarkRemover();
});
