/**
 * Advanced Image Format Converter
 * Convert between multiple image formats with quality control and batch processing
 */

class ImageFormatConverter {
    constructor() {
        this.selectedFiles = [];
        this.convertedImages = [];
        this.selectedFormat = 'jpeg';
        this.conversionSettings = {
            quality: 90,
            removeMetadata: true,
            progressiveJpeg: false,
            optimizePng: true,
            enableResize: false,
            resizeWidth: null,
            resizeHeight: null,
            maintainAspect: true
        };

        this.initializeEventListeners();
    }    initializeEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        const dropZone = document.getElementById('drop-zone');
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

        dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Format selection
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectFormat(e.currentTarget.dataset.format));
        });

        // Quality slider
        const qualitySlider = document.getElementById('quality-slider');
        qualitySlider.addEventListener('input', (e) => {
            this.conversionSettings.quality = parseInt(e.target.value);
            document.getElementById('quality-value').textContent = e.target.value;
        });

        // Resize checkbox
        document.getElementById('enable-resize').addEventListener('change', (e) => {
            this.conversionSettings.enableResize = e.target.checked;
            this.toggleResizeControls(e.target.checked);
        });

        // Resize inputs
        document.getElementById('resize-width').addEventListener('input', (e) => {
            this.conversionSettings.resizeWidth = e.target.value ? parseInt(e.target.value) : null;
            if (this.conversionSettings.maintainAspect) {
                this.updateAspectRatio('width');
            }
        });

        document.getElementById('resize-height').addEventListener('input', (e) => {
            this.conversionSettings.resizeHeight = e.target.value ? parseInt(e.target.value) : null;
            if (this.conversionSettings.maintainAspect) {
                this.updateAspectRatio('height');
            }
        });

        // Maintain aspect ratio
        document.getElementById('maintain-aspect').addEventListener('change', (e) => {
            this.conversionSettings.maintainAspect = e.target.checked;
        });        // Options checkboxes
        document.getElementById('remove-metadata').addEventListener('change', (e) => {
            this.conversionSettings.removeMetadata = e.target.checked;
        });

        document.getElementById('progressive-jpeg').addEventListener('change', (e) => {
            this.conversionSettings.progressiveJpeg = e.target.checked;
        });

        document.getElementById('optimize-png').addEventListener('change', (e) => {
            this.conversionSettings.optimizePng = e.target.checked;
        });

        // Convert button
        document.getElementById('convert-btn').addEventListener('click', () => {
            this.startConversion();
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('drop-zone').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('drop-zone').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('drop-zone').classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        this.selectedFiles = files;
        this.showImagePreviews();
        this.showControls();
    }

    showImagePreviews() {
        const imageList = document.getElementById('image-list');
        imageList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'input-group p-4';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imageItem.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <img src="${e.target.result}" alt="Preview" class="w-16 h-16 object-cover rounded">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-gray-900 truncate">${file.name}</h4>
                            <p class="text-sm text-gray-600">${this.getImageFormat(file)} • ${this.formatFileSize(file.size)}</p>
                            <div class="text-xs text-gray-500" id="image-${index}-dimensions">Loading...</div>
                        </div>
                        <div class="text-right">
                            <button onclick="removeImage(${index})" class="text-red-600 hover:text-red-700">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                // Get image dimensions
                const img = new Image();
                img.onload = () => {
                    document.getElementById(`image-${index}-dimensions`).textContent = `${img.width} × ${img.height}`;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            imageList.appendChild(imageItem);
        });
    }

    showControls() {
        document.getElementById('format-selection').classList.remove('hidden');
        document.getElementById('quality-settings').classList.remove('hidden');
        document.getElementById('conversion-options').classList.remove('hidden');
        document.getElementById('convert-section').classList.remove('hidden');

        // Select JPEG by default
        this.selectFormat('jpeg');
    }

    selectFormat(format) {
        this.selectedFormat = format;
        
        // Update UI
        document.querySelectorAll('.format-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-format="${format}"]`).classList.add('selected');

        // Show/hide quality slider based on format
        const qualityContainer = document.getElementById('quality-slider-container');
        if (format === 'png' || format === 'gif') {
            qualityContainer.style.display = 'none';
        } else {
            qualityContainer.style.display = 'block';
        }

        // Update progressive JPEG option visibility
        const progressiveOption = document.getElementById('progressive-jpeg').parentElement;
        progressiveOption.style.display = format === 'jpeg' ? 'block' : 'none';

        // Update PNG optimization option visibility
        const optimizePngOption = document.getElementById('optimize-png').parentElement;
        optimizePngOption.style.display = format === 'png' ? 'block' : 'none';
    }

    toggleResizeControls(show) {
        const resizeControls = document.getElementById('resize-controls');
        if (show) {
            resizeControls.classList.remove('hidden');
        } else {
            resizeControls.classList.add('hidden');
        }
    }

    updateAspectRatio(changedDimension) {
        if (!this.selectedFiles.length) return;

        // Use first image for aspect ratio calculation
        const firstImage = new Image();
        firstImage.onload = () => {
            const aspectRatio = firstImage.width / firstImage.height;
            
            if (changedDimension === 'width') {
                const width = this.conversionSettings.resizeWidth;
                if (width) {
                    const height = Math.round(width / aspectRatio);
                    document.getElementById('resize-height').value = height;
                    this.conversionSettings.resizeHeight = height;
                }
            } else {
                const height = this.conversionSettings.resizeHeight;
                if (height) {
                    const width = Math.round(height * aspectRatio);
                    document.getElementById('resize-width').value = width;
                    this.conversionSettings.resizeWidth = width;
                }
            }
        };
        
        const reader = new FileReader();
        reader.onload = (e) => {
            firstImage.src = e.target.result;
        };
        reader.readAsDataURL(this.selectedFiles[0]);
    }

    async startConversion() {
        if (this.selectedFiles.length === 0) {
            alert('Please select images to convert');
            return;
        }

        this.showConversionProgress();
        this.convertedImages = [];

        try {
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                this.updateProgress(i, this.selectedFiles.length, `Converting ${file.name}...`);
                
                const convertedImage = await this.convertSingleImage(file);
                this.convertedImages.push(convertedImage);
                
                // Small delay for visual feedback
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            this.updateProgress(this.selectedFiles.length, this.selectedFiles.length, 'Conversion complete!');
            setTimeout(() => {
                this.showResults();
            }, 500);

        } catch (error) {
            console.error('Conversion error:', error);
            alert('An error occurred during conversion: ' + error.message);
            this.hideConversionProgress();
        }
    }

    async convertSingleImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calculate dimensions
                    let { width, height } = this.calculateDimensions(img.width, img.height);
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to desired format
                    let mimeType, quality;
                    
                    switch (this.selectedFormat) {
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            quality = this.conversionSettings.quality / 100;
                            break;
                        case 'png':
                            mimeType = 'image/png';
                            quality = undefined; // PNG is lossless
                            break;
                        case 'webp':
                            mimeType = 'image/webp';
                            quality = this.conversionSettings.quality / 100;
                            break;
                        case 'gif':
                            mimeType = 'image/gif';
                            quality = undefined;
                            break;
                        default:
                            mimeType = 'image/jpeg';
                            quality = 0.9;
                    }
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve({
                                originalName: file.name,
                                newName: this.generateFileName(file.name, this.selectedFormat),
                                blob: blob,
                                originalSize: file.size,
                                newSize: blob.size,
                                format: this.selectedFormat,
                                dimensions: { width, height }
                            });
                        } else {
                            reject(new Error(`Failed to convert ${file.name}`));
                        }
                    }, mimeType, quality);
                    
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                reject(new Error(`Failed to load image: ${file.name}`));
            };

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    calculateDimensions(originalWidth, originalHeight) {
        if (!this.conversionSettings.enableResize) {
            return { width: originalWidth, height: originalHeight };
        }

        let width = this.conversionSettings.resizeWidth || originalWidth;
        let height = this.conversionSettings.resizeHeight || originalHeight;

        if (this.conversionSettings.maintainAspect) {
            const aspectRatio = originalWidth / originalHeight;
            
            if (this.conversionSettings.resizeWidth && !this.conversionSettings.resizeHeight) {
                height = Math.round(width / aspectRatio);
            } else if (this.conversionSettings.resizeHeight && !this.conversionSettings.resizeWidth) {
                width = Math.round(height * aspectRatio);
            } else if (this.conversionSettings.resizeWidth && this.conversionSettings.resizeHeight) {
                // Use the dimension that maintains aspect ratio and fits within bounds
                const widthScale = width / originalWidth;
                const heightScale = height / originalHeight;
                const scale = Math.min(widthScale, heightScale);
                
                width = Math.round(originalWidth * scale);
                height = Math.round(originalHeight * scale);
            }
        }

        return { width, height };
    }

    generateFileName(originalName, newFormat) {
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const extension = newFormat === 'jpeg' ? 'jpg' : newFormat;
        return `${nameWithoutExt}.${extension}`;
    }

    showConversionProgress() {
        document.getElementById('conversion-progress').classList.remove('hidden');
        document.getElementById('download-results').classList.add('hidden');
    }

    hideConversionProgress() {
        document.getElementById('conversion-progress').classList.add('hidden');
    }

    updateProgress(current, total, text) {
        const percentage = Math.round((current / total) * 100);
        document.getElementById('progress-bar').style.width = percentage + '%';
        document.getElementById('progress-text').textContent = text;
        document.getElementById('progress-count').textContent = `${current} / ${total}`;
        document.getElementById('current-file').textContent = text;
    }

    showResults() {
        this.hideConversionProgress();
        document.getElementById('download-results').classList.remove('hidden');
        
        // Update success count
        document.getElementById('success-count').textContent = this.convertedImages.length;
        
        // Generate download links
        const downloadLinksContainer = document.getElementById('download-links');
        downloadLinksContainer.innerHTML = '';
        
        this.convertedImages.forEach((image, index) => {
            const linkItem = document.createElement('div');
            linkItem.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg';
            
            const compressionRatio = ((image.originalSize - image.newSize) / image.originalSize * 100).toFixed(1);
            
            linkItem.innerHTML = `
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 truncate">${image.newName}</h4>
                    <p class="text-sm text-gray-600">
                        ${this.formatFileSize(image.newSize)} 
                        ${compressionRatio > 0 ? `(${compressionRatio}% smaller)` : ''}
                        • ${image.dimensions.width} × ${image.dimensions.height}
                    </p>
                </div>
                <button onclick="downloadSingle(${index})" class="ml-3 px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-all text-sm">
                    <i class="fas fa-download mr-1"></i>Download
                </button>
            `;
            
            downloadLinksContainer.appendChild(linkItem);
        });
    }

    downloadSingle(index) {
        const image = this.convertedImages[index];
        if (image) {
            const url = URL.createObjectURL(image.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = image.newName;
            link.click();
            URL.revokeObjectURL(url);
        }
    }

    async downloadAll() {
        if (this.convertedImages.length === 0) return;

        // For a real implementation, you'd use a library like JSZip
        // For now, we'll download files individually
        this.convertedImages.forEach((image, index) => {
            setTimeout(() => {
                this.downloadSingle(index);
            }, index * 500); // Stagger downloads
        });
    }

    removeImage(index) {
        this.selectedFiles.splice(index, 1);
        if (this.selectedFiles.length === 0) {
            this.resetInterface();
        } else {
            this.showImagePreviews();
        }
    }

    resetInterface() {
        document.getElementById('format-selection').classList.add('hidden');
        document.getElementById('quality-settings').classList.add('hidden');
        document.getElementById('conversion-options').classList.add('hidden');
        document.getElementById('convert-section').classList.add('hidden');
        document.getElementById('conversion-progress').classList.add('hidden');
        document.getElementById('download-results').classList.add('hidden');
        
        // Reset image list
        const imageList = document.getElementById('image-list');
        imageList.innerHTML = `
            <div class="image-preview p-8 text-center">
                <i class="fas fa-images text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Upload images to see preview</p>
            </div>
        `;
    }

    getImageFormat(file) {
        return file.type.split('/')[1].toUpperCase();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Global functions for HTML onclick handlers
function startConversion() {
    formatConverter.startConversion();
}

function downloadSingle(index) {
    formatConverter.downloadSingle(index);
}

function downloadAll() {
    formatConverter.downloadAll();
}

function removeImage(index) {
    formatConverter.removeImage(index);
}

// Initialize when DOM is loaded
let formatConverter;
document.addEventListener('DOMContentLoaded', () => {
    formatConverter = new ImageFormatConverter();
});
