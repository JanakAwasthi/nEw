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

    input.addEventListener('change', (e) => this.handleFileSelect(e));
    resetBtn.addEventListener('click', () => this.resetCrop());
    applyBtn.addEventListener('click', () => this.applyCrop());
    downloadBtn.addEventListener('click', () => this.downloadImage());
  }

  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    
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

    // Show container and hide placeholder
    container.classList.remove('hidden');
    placeholder.classList.add('hidden');

    // Destroy existing cropper if it exists
    if (this.cropper) {
      this.cropper.destroy();
    }

    // Set image source
    image.src = imageSrc;

    // Initialize new cropper without aspect ratio constraints
    this.cropper = new Cropper(image, {
      aspectRatio: NaN, // No aspect ratio constraint - free form cropping
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
      ready: () => {
        this.updateCropSettings();
      },
      crop: (event) => {
        this.updateCropInfo(event.detail);
      }
    });
  }
    if (this.cropper) {
      this.cropper.destroy();
    }

    // Set image source
    image.src = imageSrc;

    // Initialize cropper
    image.onload = () => {
      this.cropper = new Cropper(image, {
        aspectRatio: this.getAspectRatio(),
        viewMode: 1,
        autoCropArea: 0.8,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
      });

      // Show controls
      document.getElementById('crop-settings').classList.remove('hidden');
      document.getElementById('crop-controls').classList.remove('hidden');
    };
  }

  getAspectRatio() {
    switch (this.currentShape) {
      case 'square':
        return 1;
      case 'circle':
        return 1;
      case 'rectangle':
        return NaN; // Free aspect ratio
      default:
        return NaN;
    }
  }

  updateCropSettings() {
    if (this.cropper) {
      const aspectRatio = this.getAspectRatio();
      this.cropper.setAspectRatio(aspectRatio);
    }
  }

  resetCrop() {
    if (this.cropper) {
      this.cropper.reset();
    }
  }

  applyCrop() {
    if (!this.cropper) return;

    const canvas = this.cropper.getCroppedCanvas({
      width: parseInt(document.getElementById('crop-width').value) || 800,
      height: parseInt(document.getElementById('crop-height').value) || 600,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    if (this.currentShape === 'circle') {
      this.applyCircularMask(canvas);
    } else if (this.currentShape === 'heart') {
      this.applyHeartMask(canvas);
    } else if (this.currentShape === 'star') {
      this.applyStarMask(canvas);
    } else if (this.currentShape === 'rounded') {
      this.applyRoundedMask(canvas);
    }

    // Show preview
    const previewCanvas = document.getElementById('preview-canvas');
    const previewCtx = previewCanvas.getContext('2d');
    
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    previewCtx.drawImage(canvas, 0, 0);

    // Show preview section
    document.getElementById('preview-section').classList.remove('hidden');
    document.getElementById('download-section').classList.remove('hidden');
    
    // Update size info
    document.getElementById('cropped-size').textContent = 
      `${canvas.width} x ${canvas.height} px`;
  }

  applyCircularMask(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) / 2;
    
    // Create circular mask
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance > radius) {
          const index = (y * width + x) * 4;
          data[index + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  applyHeartMask(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Create heart shape path
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.4;
    
    // Heart shape using bezier curves
    ctx.moveTo(centerX, centerY + size * 0.3);
    ctx.bezierCurveTo(centerX, centerY, centerX - size * 0.5, centerY - size * 0.5, centerX - size * 0.5, centerY);
    ctx.bezierCurveTo(centerX - size * 0.5, centerY + size * 0.3, centerX, centerY + size * 0.7, centerX, centerY + size);
    ctx.bezierCurveTo(centerX, centerY + size * 0.7, centerX + size * 0.5, centerY + size * 0.3, centerX + size * 0.5, centerY);
    ctx.bezierCurveTo(centerX + size * 0.5, centerY - size * 0.5, centerX, centerY, centerX, centerY + size * 0.3);
    
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  applyStarMask(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) * 0.4;
    const innerRadius = outerRadius * 0.5;
    const spikes = 5;
    
    // Create star shape
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  applyRoundedMask(canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const radius = Math.min(width, height) * 0.1;
    
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, radius);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  showImageInfo(file) {
    const img = new Image();
    img.onload = () => {
      document.getElementById('original-size').textContent = 
        `${img.width} x ${img.height} px`;
      document.getElementById('image-format').textContent = 
        file.type.split('/')[1].toUpperCase();
      document.getElementById('image-info').classList.remove('hidden');
    };
    img.src = URL.createObjectURL(file);
  }

  downloadImage() {
    const canvas = document.getElementById('preview-canvas');
    const format = document.getElementById('output-format').value;
    
    const link = document.createElement('a');
    link.download = `cropped-image.${format}`;
    
    if (format === 'png') {
      link.href = canvas.toDataURL('image/png');
    } else if (format === 'jpeg') {
      link.href = canvas.toDataURL('image/jpeg', 0.9);
    } else if (format === 'webp') {
      link.href = canvas.toDataURL('image/webp', 0.9);
    }
    
    link.click();
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  new ImageCropper();
});

// Add CSS for shape buttons
const style = document.createElement('style');
style.textContent = `
.shape-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 10px;
  padding: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.shape-btn:hover {
  border-color: var(--neon-blue);
  background: rgba(0, 212, 255, 0.1);
}

.shape-btn.active {
  border-color: var(--neon-blue);
  background: rgba(0, 212, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}
`;
document.head.appendChild(style);
