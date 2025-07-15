// Advanced Image Compressor with Real-time Preview and Detailed Analytics
class ImageCompressor {
  constructor() {
    this.originalImage = null;
    this.originalFile = null;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupEventListeners() {
    const input = document.getElementById('image-input');
    const qualityInput = document.getElementById('quality');
    const formatSelect = document.getElementById('output-format');
    const progressiveCheckbox = document.getElementById('progressive');
    const optimizeCheckbox = document.getElementById('optimize');
    const downloadBtn = document.getElementById('download-btn');

    input.addEventListener('change', (e) => this.handleFileSelect(e));
    qualityInput.addEventListener('input', () => {
      this.updateQualityDisplay();
      this.compressImage();
    });
    formatSelect.addEventListener('change', () => this.compressImage());
    progressiveCheckbox.addEventListener('change', () => this.compressImage());
    optimizeCheckbox.addEventListener('change', () => this.compressImage());
    downloadBtn.addEventListener('click', () => this.downloadImage());
  }  setupDragAndDrop() {
    const dropzone = document.getElementById('dropzone');
    if (dropzone) {
      ToolUtils.setupFileDrop(dropzone, (file) => this.loadImage(file), ['image']);
    }
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.loadImage(files[0]);
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.loadImage(file);
    }
  }
  loadImage(file) {
    if (!file.type.startsWith('image/')) {
      ToolUtils.showStatus('Please select a valid image file.', 'error');
      return;
    }

    this.originalFile = file;
    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(25);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.originalImage = img;
        this.displayOriginalImage(img);
        this.displayFileInfo(file, img);
        this.showControls();
        ToolUtils.updateProgress(75);
        this.compressImage();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  displayOriginalImage(img) {
    const preview = document.getElementById('original-preview');
    const originalImg = document.getElementById('original-image');
    
    originalImg.src = img.src;
    preview.classList.remove('hidden');
  }
  displayFileInfo(file, img) {
    // Update file info in output details
    const details = {
      'Original Dimensions': `${img.width} × ${img.height}px`,
      'Original Format': file.type.split('/')[1].toUpperCase(),
      'Original Size': ToolUtils.formatFileSize(file.size),
      'Color Depth': '24-bit'
    };
    
    ToolUtils.updateOutputDetails(details);
  }

  showControls() {
    document.getElementById('compression-controls').classList.remove('hidden');
  }

  updateQualityDisplay() {
    const quality = document.getElementById('quality').value;
    document.getElementById('quality-value').textContent = `${quality}%`;
  }
  compressImage() {
    if (!this.originalImage) return;

    ToolUtils.showLoading(true);
    ToolUtils.updateProgress(50);

    setTimeout(() => {
      try {
        const quality = parseInt(document.getElementById('quality').value) / 100;
        const format = document.getElementById('output-format').value;
        const progressive = document.getElementById('progressive').checked;
        const optimize = document.getElementById('optimize').checked;

        // Set canvas dimensions
        this.canvas.width = this.originalImage.width;
        this.canvas.height = this.originalImage.height;

        // Configure context for optimization
        if (optimize) {
          this.ctx.imageSmoothingEnabled = true;
          this.ctx.imageSmoothingQuality = 'high';
        }

        // Draw image to canvas
        this.ctx.drawImage(this.originalImage, 0, 0);

        // Generate compressed image
        let mimeType = `image/${format}`;
        let dataUrl;

        if (format === 'png') {
          dataUrl = this.canvas.toDataURL('image/png');
        } else if (format === 'webp') {
          dataUrl = this.canvas.toDataURL('image/webp', quality);
        } else {
          // JPEG
          dataUrl = this.canvas.toDataURL('image/jpeg', quality);
        }

        this.displayCompressedImage(dataUrl);
        this.updateOutputInfo(dataUrl, format);
        this.showDownloadButton();
        ToolUtils.updateProgress(100);
        ToolUtils.showLoading(false);

        setTimeout(() => ToolUtils.updateProgress(0), 1000);

      } catch (error) {
        ToolUtils.showStatus('Error compressing image: ' + error.message, 'error');
        ToolUtils.showLoading(false);
      }
    }, 100);
  }
  displayCompressedImage(dataUrl) {
    const previewContainer = document.getElementById('output-preview-container');
    const preview = document.getElementById('output-preview');
    const compressedImg = document.getElementById('compressed-image');
    
    compressedImg.src = dataUrl;
    preview.classList.remove('hidden');
    previewContainer.classList.add('output-ready');
    
    // Hide placeholder
    const icon = previewContainer.querySelector('i');
    const text = previewContainer.querySelector('p');
    if (icon) icon.style.display = 'none';
    if (text) text.style.display = 'none';
  }
  updateOutputInfo(dataUrl, format) {
    // Calculate file sizes
    const originalSize = this.originalFile.size;
    const compressedBlob = this.dataURLtoBlob(dataUrl);
    const newSize = compressedBlob.size;
    
    // Calculate compression metrics
    const compressionRatio = ToolUtils.getCompressionRatio(originalSize, newSize);
    const sizeReduction = originalSize - newSize;

    // Update output details
    const details = {
      'Original Dimensions': `${this.originalImage.width} × ${this.originalImage.height}px`,
      'Original Size': ToolUtils.formatFileSize(originalSize),
      'Compressed Size': ToolUtils.formatFileSize(newSize),
      'Size Reduction': ToolUtils.formatFileSize(sizeReduction),
      'Compression Ratio': `${compressionRatio}%`,
      'Output Format': format.toUpperCase(),
      'Quality': document.getElementById('quality').value + '%'
    };
    
    ToolUtils.updateOutputDetails(details);
  }

  showDownloadButton() {
    document.getElementById('download-section').classList.remove('hidden');
  }
  downloadImage() {
    const compressedImg = document.getElementById('compressed-image');
    if (!compressedImg.src) return;

    const format = document.getElementById('output-format').value;
    const filename = `compressed-${this.originalFile.name.split('.')[0]}.${format}`;

    // Convert data URL to blob
    const blob = this.dataURLtoBlob(compressedImg.src);
    const downloadBtn = ToolUtils.createDownloadButton(blob, filename, 'Download Compressed Image');
    downloadBtn.click();

    ToolUtils.showStatus('Compressed image downloaded successfully!', 'success');
  }
  // Remove old methods that are now handled by shared utilities
  formatFileSize(bytes) {
    return ToolUtils.formatFileSize(bytes);
  }

  dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

// Initialize the Image Compressor when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new ImageCompressor();
});

// Legacy function for backward compatibility
function compressImage() {
  console.log('Image compression is now handled by the ImageCompressor class');
}
