// Fully Functional Image Format Converter
class ImageFormatConverterNew {
    constructor() {
        this.selectedFiles = [];
        this.convertedImages = [];
        this.selectedFormat = 'jpeg';
        this.quality = 90;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // File input
        const fileInput = document.getElementById('file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Format selection buttons
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectFormat(e.currentTarget.dataset.format);
            });
        });        // Quality slider
        const qualitySlider = document.getElementById('quality-slider');
        if (qualitySlider) {
            qualitySlider.addEventListener('input', (e) => {
                this.quality = parseInt(e.target.value);
                const qualityValue = document.getElementById('quality-value');
                if (qualityValue) qualityValue.textContent = e.target.value + '%';
                
                // Update real-time preview
                if (this.selectedFiles.length > 0) {
                    this.showCurrentPreview(this.selectedFiles[0]);
                }
            });
        }

        // Convert button
        const convertBtn = document.getElementById('convert-btn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.startConversion());
        }
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('drop-zone');
        if (!dropZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Highlight drop area
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            if (files.length > 0) {
                this.processFiles(files);
            }
        });

        // Click to browse
        dropZone.addEventListener('click', () => {
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.click();
        });
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
        if (files.length > 0) {
            this.processFiles(files);
        }
    }    processFiles(files) {
        this.selectedFiles = files;
        this.showImagePreviews();
        this.showControls();
        
        // Show real-time preview of first image
        if (files.length > 0) {
            this.showCurrentPreview(files[0]);
        }
    }

    showCurrentPreview(file) {
        const currentPreview = document.getElementById('current-preview');
        const previewContainer = document.getElementById('preview-container');
        
        if (!currentPreview || !previewContainer) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = `
                <div class="space-y-3">
                    <img src="${e.target.result}" alt="Current Image" 
                         style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #00d4ff;">
                    <div class="text-sm space-y-1">
                        <div class="flex justify-between">
                            <span class="text-gray-400">File:</span>
                            <span class="text-white">${file.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Size:</span>
                            <span class="text-white">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Type:</span>
                            <span class="text-white">${file.type}</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Get image dimensions
            const img = new Image();
            img.onload = () => {
                const dimensionInfo = previewContainer.querySelector('.text-sm');
                if (dimensionInfo) {
                    dimensionInfo.innerHTML += `
                        <div class="flex justify-between">
                            <span class="text-gray-400">Dimensions:</span>
                            <span class="text-white">${img.width} × ${img.height}px</span>
                        </div>
                    `;
                }
                
                // Show real-time conversion preview
                this.showConversionPreview(file, img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        currentPreview.classList.remove('hidden');
    }

    showConversionPreview(file, originalImage) {
        // Show what the converted image will look like
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);
        
        // Get preview based on current settings
        let mimeType, quality;
        switch (this.selectedFormat) {
            case 'jpeg':
                mimeType = 'image/jpeg';
                quality = this.quality / 100;
                break;
            case 'png':
                mimeType = 'image/png';
                quality = 1;
                break;
            case 'webp':
                mimeType = 'image/webp';
                quality = this.quality / 100;
                break;
            default:
                mimeType = 'image/jpeg';
                quality = 0.9;
        }
        
        const previewDataUrl = canvas.toDataURL(mimeType, quality);
        const estimatedSize = Math.round((previewDataUrl.length * 3/4));
        const compressionRatio = Math.round(((file.size - estimatedSize) / file.size) * 100);
        
        const conversionResults = document.getElementById('conversion-results');
        const convertedPreview = document.getElementById('converted-preview');
        
        if (conversionResults && convertedPreview) {
            convertedPreview.innerHTML = `
                <div class="space-y-3">
                    <img src="${previewDataUrl}" alt="Converted Preview" 
                         style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #00ff88;">
                    <div class="text-sm space-y-1">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Format:</span>
                            <span class="text-green-400">${this.selectedFormat.toUpperCase()}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Quality:</span>
                            <span class="text-green-400">${this.quality}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Est. Size:</span>
                            <span class="text-green-400">${(estimatedSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Compression:</span>
                            <span class="text-green-400">${compressionRatio}%</span>
                        </div>
                    </div>
                </div>
            `;
            conversionResults.classList.remove('hidden');
        }
    }

    showImagePreviews() {
        const imageList = document.getElementById('image-list');
        if (!imageList) return;

        imageList.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'input-group p-4';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imageItem.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <img src="${e.target.result}" alt="Preview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        <div class="flex-1">
                            <div class="font-medium text-white">${file.name}</div>
                            <div class="text-sm text-gray-400">${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                            <div class="text-sm text-gray-400" id="image-${index}-dimensions">Loading...</div>
                        </div>
                        <div class="text-right">
                            <button onclick="window.formatConverter.removeImage(${index})" class="text-red-400 hover:text-red-300">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                
                // Get image dimensions
                const img = new Image();
                img.onload = () => {
                    const dimensionEl = document.getElementById(`image-${index}-dimensions`);
                    if (dimensionEl) {
                        dimensionEl.textContent = `${img.width} × ${img.height}px`;
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            
            imageList.appendChild(imageItem);
        });

        window.formatConverter = this; // Make accessible for remove button
    }

    removeImage(index) {
        this.selectedFiles.splice(index, 1);
        this.showImagePreviews();
        
        if (this.selectedFiles.length === 0) {
            this.hideControls();
        }
    }

    showControls() {
        const formatSelection = document.getElementById('format-selection');
        const qualitySettings = document.getElementById('quality-settings');
        const convertSection = document.getElementById('convert-section');

        if (formatSelection) formatSelection.classList.remove('hidden');
        if (qualitySettings) qualitySettings.classList.remove('hidden');
        if (convertSection) convertSection.classList.remove('hidden');

        // Select JPEG by default
        this.selectFormat('jpeg');
    }

    hideControls() {
        const formatSelection = document.getElementById('format-selection');
        const qualitySettings = document.getElementById('quality-settings');
        const convertSection = document.getElementById('convert-section');

        if (formatSelection) formatSelection.classList.add('hidden');
        if (qualitySettings) qualitySettings.classList.add('hidden');
        if (convertSection) convertSection.classList.add('hidden');
    }    selectFormat(format) {
        this.selectedFormat = format;
        
        // Update UI
        document.querySelectorAll('.format-option').forEach(option => {
            option.classList.remove('border-cyan-400', 'bg-cyan-50');
        });
        const selectedOption = document.querySelector(`[data-format="${format}"]`);
        if (selectedOption) {
            selectedOption.classList.add('border-cyan-400', 'bg-cyan-50');
        }

        // Show/hide quality slider based on format
        const qualityContainer = document.getElementById('quality-slider-container');
        if (qualityContainer) {
            if (format === 'png') {
                qualityContainer.style.display = 'none';
            } else {
                qualityContainer.style.display = 'block';
            }
        }
        
        // Update real-time preview if image is loaded
        if (this.selectedFiles.length > 0) {
            this.showCurrentPreview(this.selectedFiles[0]);
        }
    }

    async startConversion() {
        if (this.selectedFiles.length === 0) {
            this.showStatus('Please select images to convert', 'error');
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
            this.showStatus('An error occurred during conversion: ' + error.message, 'error');
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
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to desired format
                    let mimeType, quality;
                    
                    switch (this.selectedFormat) {
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            quality = this.quality / 100;
                            break;
                        case 'png':
                            mimeType = 'image/png';
                            quality = 1;
                            break;
                        case 'webp':
                            mimeType = 'image/webp';
                            quality = this.quality / 100;
                            break;
                        default:
                            mimeType = 'image/jpeg';
                            quality = 0.9;
                    }
                    
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    
                    // Create result object
                    const result = {
                        originalName: file.name,
                        convertedName: this.generateFileName(file.name, this.selectedFormat),
                        dataUrl: dataUrl,
                        originalSize: file.size,
                        convertedSize: Math.round((dataUrl.length * 3/4)),
                        format: this.selectedFormat,
                        dimensions: `${img.width} × ${img.height}px`
                    };
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    generateFileName(originalName, format) {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
        const extension = format === 'jpeg' ? 'jpg' : format;
        return `${nameWithoutExt}.${extension}`;
    }

    showConversionProgress() {
        const progressSection = document.getElementById('progress-section');
        if (progressSection) {
            progressSection.classList.remove('hidden');
        }
    }

    hideConversionProgress() {
        const progressSection = document.getElementById('progress-section');
        if (progressSection) {
            progressSection.classList.add('hidden');
        }
    }

    updateProgress(current, total, message) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        const percentage = Math.round((current / total) * 100);
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = message;
        }
    }

    showResults() {
        this.hideConversionProgress();
        
        const resultsSection = document.getElementById('results-section');
        const resultsList = document.getElementById('results-list');
        
        if (!resultsSection || !resultsList) return;
        
        resultsSection.classList.remove('hidden');
        resultsList.innerHTML = '';

        this.convertedImages.forEach((result, index) => {
            const resultItem = document.createElement('div');
            resultItem.className = 'output-details p-4';
            
            const compressionRatio = Math.round(((result.originalSize - result.convertedSize) / result.originalSize) * 100);
            
            resultItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="font-medium text-white">${result.convertedName}</div>
                        <div class="text-sm text-gray-400">${result.dimensions}</div>
                        <div class="text-sm text-gray-400">
                            ${(result.originalSize / 1024 / 1024).toFixed(2)} MB → 
                            ${(result.convertedSize / 1024 / 1024).toFixed(2)} MB 
                            (${compressionRatio}% reduction)
                        </div>
                    </div>
                    <div class="ml-4">
                        <button onclick="window.formatConverter.downloadSingle(${index})" class="download-btn">
                            <i class="fas fa-download mr-2"></i>Download
                        </button>
                    </div>
                </div>
            `;
            
            resultsList.appendChild(resultItem);
        });

        // Add download all button
        const downloadAllBtn = document.getElementById('download-all-btn');
        if (downloadAllBtn) {
            downloadAllBtn.classList.remove('hidden');
            downloadAllBtn.onclick = () => this.downloadAll();
        }
    }

    downloadSingle(index) {
        const result = this.convertedImages[index];
        if (result) {
            const link = document.createElement('a');
            link.download = result.convertedName;
            link.href = result.dataUrl;
            link.click();
        }
    }

    downloadAll() {
        this.convertedImages.forEach((result, index) => {
            setTimeout(() => {
                this.downloadSingle(index);
            }, index * 500); // Stagger downloads
        });
    }

    showStatus(message, type) {
        const statusEl = document.createElement('div');
        statusEl.className = `status-message status-${type}`;
        statusEl.textContent = message;

        const container = document.querySelector('.output-section') || document.body;
        container.appendChild(statusEl);

        setTimeout(() => {
            statusEl.remove();
        }, 3000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.formatConverter = new ImageFormatConverterNew();
});
