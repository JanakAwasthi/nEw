class ImageCropper {
  constructor() {
    this.cropper = null;
    this.originalFile = null;
    this.currentShape = 'rectangle';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.setupShapeButtons();
  }

  setupEventListeners() {
    const input = document.getElementById('image-input');
    const resetBtn = document.getElementById('reset-crop');
    const applyBtn = document.getElementById('apply-crop');
    const downloadBtn = document.getElementById('download-cropped');

    if (input) input.addEventListener('change', (e) => this.handleFileSelect(e));
    if (resetBtn) resetBtn.addEventListener('click', () => this.resetCrop());
    if (applyBtn) applyBtn.addEventListener('click', () => this.applyCrop());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadImage());
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => e.preventDefault(), false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });
  }

  setupShapeButtons() {
    const shapeButtons = document.querySelectorAll('.shape-btn');
    shapeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentShape = btn.dataset.shape;
        this.updateCropSettings();
      });
    });
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    this.originalFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      this.initializeCropper(e.target.result);
      this.showImageInfo(file);
    };
    
    reader.readAsDataURL(file);
  }

  initializeCropper(imageSrc) {
    const image = document.getElementById('crop-image');
    const container = document.getElementById('editor-container');
    const placeholder = document.getElementById('editor-placeholder');

    if (!image || !container || !placeholder) return;

    // Show container and hide placeholder
    container.classList.remove('hidden');
    placeholder.classList.add('hidden');

    // Destroy existing cropper if it exists
    if (this.cropper) {
      this.cropper.destroy();
    }

    // Set image source
    image.src = imageSrc;

    // Wait for image to load before initializing cropper
    image.onload = () => {
      // Initialize new cropper with free-form cropping (no aspect ratio)
      this.cropper = new Cropper(image, {
        aspectRatio: NaN, // No aspect ratio constraint - completely free
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.8,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        minCropBoxWidth: 10,
        minCropBoxHeight: 10,
        ready: () => {
          this.updateCropInfo();
        },
        crop: (event) => {
          this.updateCropInfo(event.detail);
        }
      });
    };
  }

  updateCropSettings() {
    if (!this.cropper) return;

    // For free-form cropping, we don't set any aspect ratio
    if (this.currentShape === 'rectangle' || this.currentShape === 'free') {
      this.cropper.setAspectRatio(NaN); // Free form
    } else if (this.currentShape === 'square') {
      this.cropper.setAspectRatio(1); // Square
    } else if (this.currentShape === 'circle') {
      this.cropper.setAspectRatio(1); // Circle needs square crop area
    } else {
      this.cropper.setAspectRatio(NaN); // Default to free form
    }
  }

  updateCropInfo(detail) {
    const info = document.getElementById('crop-info');
    if (!info || !detail) return;

    info.innerHTML = `
      <div class="text-sm space-y-1">
        <div>Width: ${Math.round(detail.width)}px</div>
        <div>Height: ${Math.round(detail.height)}px</div>
        <div>X: ${Math.round(detail.x)}px</div>
        <div>Y: ${Math.round(detail.y)}px</div>
      </div>
    `;
  }

  resetCrop() {
    if (this.cropper) {
      this.cropper.reset();
    }
  }

  applyCrop() {
    if (!this.cropper) return;

    // Get crop data
    const cropData = this.cropper.getData();
    const canvas = this.cropper.getCroppedCanvas({
      width: Math.round(cropData.width),
      height: Math.round(cropData.height),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    if (!canvas) return;

    // Apply shape-specific effects
    let finalCanvas = canvas;
    
    if (this.currentShape === 'circle') {
      finalCanvas = this.applyCircularMask(canvas);
    } else if (this.currentShape === 'heart') {
      finalCanvas = this.applyHeartMask(canvas);
    } else if (this.currentShape === 'star') {
      finalCanvas = this.applyStarMask(canvas);
    } else if (this.currentShape === 'rounded') {
      finalCanvas = this.applyRoundedMask(canvas);
    }

    // Show cropped result
    this.showCroppedResult(finalCanvas);
  }

  applyCircularMask(canvas) {
    const size = Math.min(canvas.width, canvas.height);
    const maskedCanvas = document.createElement('canvas');
    const ctx = maskedCanvas.getContext('2d');
    
    maskedCanvas.width = size;
    maskedCanvas.height = size;
    
    // Create circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Draw image centered
    const x = (size - canvas.width) / 2;
    const y = (size - canvas.height) / 2;
    ctx.drawImage(canvas, x, y);
    
    return maskedCanvas;
  }

  applyHeartMask(canvas) {
    const maskedCanvas = document.createElement('canvas');
    const ctx = maskedCanvas.getContext('2d');
    
    maskedCanvas.width = canvas.width;
    maskedCanvas.height = canvas.height;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create heart shape clip
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + height * 0.3);
    
    for (let i = 0; i < 360; i++) {
      const angle = i * Math.PI / 180;
      const x = 16 * Math.pow(Math.sin(angle), 3);
      const y = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
      ctx.lineTo(centerX + x * width / 32, centerY + y * height / 32);
    }
    
    ctx.clip();
    ctx.drawImage(canvas, 0, 0);
    
    return maskedCanvas;
  }

  applyStarMask(canvas) {
    const maskedCanvas = document.createElement('canvas');
    const ctx = maskedCanvas.getContext('2d');
    
    maskedCanvas.width = canvas.width;
    maskedCanvas.height = canvas.height;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Create 5-pointed star
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const r = i % 2 === 0 ? radius : radius * 0.5;
      const x = centerX + r * Math.cos(angle - Math.PI / 2);
      const y = centerY + r * Math.sin(angle - Math.PI / 2);
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.clip();
    
    ctx.drawImage(canvas, 0, 0);
    
    return maskedCanvas;
  }

  applyRoundedMask(canvas) {
    const maskedCanvas = document.createElement('canvas');
    const ctx = maskedCanvas.getContext('2d');
    
    maskedCanvas.width = canvas.width;
    maskedCanvas.height = canvas.height;
    
    const radius = Math.min(canvas.width, canvas.height) * 0.1;
    
    // Create rounded rectangle clip
    ctx.beginPath();
    ctx.roundRect(0, 0, canvas.width, canvas.height, radius);
    ctx.clip();
    
    ctx.drawImage(canvas, 0, 0);
    
    return maskedCanvas;
  }

  showCroppedResult(canvas) {
    const preview = document.getElementById('cropped-preview');
    if (!preview) return;

    // Clear previous result
    preview.innerHTML = '';
    
    // Create image element
    const img = document.createElement('img');
    img.src = canvas.toDataURL();
    img.className = 'max-w-full max-h-64 rounded-lg border-2 border-green-500';
    preview.appendChild(img);

    // Enable download button
    const downloadBtn = document.getElementById('download-cropped');
    if (downloadBtn) {
      downloadBtn.disabled = false;
      downloadBtn.onclick = () => this.downloadCroppedImage(canvas);
    }

    // Show output details
    this.showOutputDetails(canvas);
  }

  showOutputDetails(canvas) {
    const details = document.getElementById('output-details');
    if (!details) return;

    const fileSize = this.estimateFileSize(canvas);
    
    details.innerHTML = `
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">Dimensions:</span>
          <span class="font-medium">${canvas.width} × ${canvas.height}px</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Shape:</span>
          <span class="font-medium capitalize">${this.currentShape}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Est. Size:</span>
          <span class="font-medium">${fileSize}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Format:</span>
          <span class="font-medium">PNG</span>
        </div>
      </div>
    `;
  }

  estimateFileSize(canvas) {
    const dataURL = canvas.toDataURL();
    const bytes = Math.round((dataURL.length - 'data:image/png;base64,'.length) * 3/4);
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  showImageInfo(file) {
    const info = document.getElementById('image-info');
    if (!info) return;

    info.innerHTML = `
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">File:</span>
          <span class="font-medium">${file.name}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Size:</span>
          <span class="font-medium">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">Type:</span>
          <span class="font-medium">${file.type}</span>
        </div>
      </div>
    `;
  }

  downloadImage() {
    if (!this.cropper) {
      alert('Please crop an image first');
      return;
    }

    this.applyCrop();
  }

  downloadCroppedImage(canvas) {
    const link = document.createElement('a');
    link.download = `cropped-${this.currentShape}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new ImageCropper();
});
