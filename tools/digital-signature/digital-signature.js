// Advanced Digital Signature Tool with Multiple Creation Methods and PDF Integration
class DigitalSignature {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.currentColor = '#000000';
    this.currentSize = 3;
    this.signatures = [];
    this.currentPDF = null;
    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 1;
    this.signatureData = null;
    this.init();
  }

  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupPDFJS();
  }

  setupCanvas() {
    this.canvas = document.getElementById('signature-pad');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.setupCanvasEvents();
  }

  setupCanvasEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.signature-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Drawing controls
    document.getElementById('pen-size').addEventListener('input', (e) => {
      this.currentSize = e.target.value;
      document.getElementById('pen-size-value').textContent = `${e.target.value}px`;
    });

    document.querySelectorAll('.color-picker').forEach(picker => {
      picker.addEventListener('click', (e) => this.selectColor(e.target.dataset.color));
    });

    document.getElementById('clear-signature').addEventListener('click', () => this.clearCanvas());

    // Typing controls
    document.getElementById('signature-text').addEventListener('input', () => this.updateTypedSignature());
    document.getElementById('font-style').addEventListener('change', () => this.updateTypedSignature());
    document.getElementById('font-size').addEventListener('input', (e) => {
      document.getElementById('font-size-value').textContent = `${e.target.value}px`;
      this.updateTypedSignature();
    });

    // Upload controls
    document.getElementById('signature-upload').addEventListener('change', (e) => this.handleSignatureUpload(e));

    // Signature actions
    document.getElementById('save-signature').addEventListener('click', () => this.saveSignature());
    document.getElementById('download-signature').addEventListener('click', () => this.downloadSignature());
    document.getElementById('copy-signature').addEventListener('click', () => this.copySignature());

    // PDF controls
    document.getElementById('pdf-upload').addEventListener('change', (e) => this.handlePDFUpload(e));
    document.getElementById('prev-page').addEventListener('click', () => this.changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => this.changePage(1));
    document.getElementById('add-signature-to-pdf').addEventListener('click', () => this.showPositionControls());
    document.getElementById('apply-signature').addEventListener('click', () => this.applySignatureToPDF());
    document.getElementById('download-signed-pdf').addEventListener('click', () => this.downloadSignedPDF());
    document.getElementById('reset-tool').addEventListener('click', () => this.resetTool());

    // Position controls
    ['sig-x', 'sig-y', 'sig-width', 'sig-page'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => this.updateSignaturePreview());
    });

    // Drag and drop
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const dropzones = [document.getElementById('signature-dropzone'), document.getElementById('pdf-dropzone')];
    
    dropzones.forEach(dropzone => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, this.preventDefaults, false);
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.add('active'), false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => dropzone.classList.remove('active'), false);
      });
    });

    document.getElementById('signature-dropzone').addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files);
      if (files[0] && files[0].type.startsWith('image/')) {
        this.processUploadedSignature(files[0]);
      }
    });

    document.getElementById('pdf-dropzone').addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files);
      if (files[0] && files[0].type === 'application/pdf') {
        this.processPDFFile(files[0]);
      }
    });
  }

  setupPDFJS() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.signature-tab').forEach(tab => {
      tab.classList.remove('active', 'bg-blue-600', 'text-white');
      tab.classList.add('text-gray-600');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active', 'bg-blue-600', 'text-white');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-600');

    // Show/hide tab content
    document.querySelectorAll('.signature-tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');

    // Clear previous signature data when switching tabs
    this.signatureData = null;
  }

  // Drawing functions
  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.ctx.lineWidth = this.currentSize;
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.ctx.beginPath();
      this.signatureData = this.canvas.toDataURL();
    }
  }

  selectColor(color) {
    this.currentColor = color;
    
    document.querySelectorAll('.color-picker').forEach(picker => {
      picker.classList.remove('active');
    });
    
    document.querySelector(`[data-color="${color}"]`).classList.add('active');
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.signatureData = null;
  }

  // Typed signature functions
  updateTypedSignature() {
    const text = document.getElementById('signature-text').value;
    const fontStyle = document.getElementById('font-style').value;
    const fontSize = document.getElementById('font-size').value;
    const preview = document.getElementById('typed-signature-preview');

    if (text.trim()) {
      preview.innerHTML = `<span style="font-family: ${fontStyle}; font-size: ${fontSize}px; color: ${this.currentColor};">${text}</span>`;
      
      // Create signature data from typed text
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 600;
      tempCanvas.height = 200;
      const tempCtx = tempCanvas.getContext('2d');
      
      tempCtx.font = `${fontSize}px ${fontStyle}`;
      tempCtx.fillStyle = this.currentColor;
      tempCtx.textAlign = 'center';
      tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
      
      this.signatureData = tempCanvas.toDataURL();
    } else {
      preview.innerHTML = '<span class="text-gray-400">Your signature will appear here</span>';
      this.signatureData = null;
    }
  }

  // Upload signature functions
  handleSignatureUpload(e) {
    const file = e.target.files[0];
    if (file) {
      this.processUploadedSignature(file);
    }
  }

  processUploadedSignature(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.getElementById('uploaded-signature');
      img.src = e.target.result;
      document.getElementById('uploaded-signature-preview').classList.remove('hidden');
      this.signatureData = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Signature actions
  saveSignature() {
    if (!this.signatureData) {
      this.showError('Please create a signature first.');
      return;
    }

    const signature = {
      id: Date.now(),
      data: this.signatureData,
      timestamp: new Date().toISOString(),
      type: document.querySelector('.signature-tab.active').dataset.tab
    };

    this.signatures.push(signature);
    localStorage.setItem('signatures', JSON.stringify(this.signatures));
    this.showSuccess('Signature saved successfully!');
  }

  downloadSignature() {
    if (!this.signatureData) {
      this.showError('Please create a signature first.');
      return;
    }

    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.png`;
    link.href = this.signatureData;
    link.click();
  }

  async copySignature() {
    if (!this.signatureData) {
      this.showError('Please create a signature first.');
      return;
    }

    try {
      const response = await fetch(this.signatureData);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      this.showSuccess('Signature copied to clipboard!');
    } catch (error) {
      this.showError('Failed to copy signature to clipboard.');
    }
  }

  // PDF functions
  handlePDFUpload(e) {
    const file = e.target.files[0];
    if (file) {
      this.processPDFFile(file);
    }
  }

  async processPDFFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.currentPDF = arrayBuffer;
      
      const loadingTask = pdfjsLib.getDocument(arrayBuffer);
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      
      document.getElementById('pdf-info').textContent = 
        `${file.name} • ${this.totalPages} page${this.totalPages !== 1 ? 's' : ''}`;
      
      document.getElementById('sig-page').max = this.totalPages;
      
      await this.renderPDFPage();
      document.getElementById('pdf-preview-section').classList.remove('hidden');
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showError('Failed to load PDF. Please try a different file.');
    }
  }

  async renderPDFPage() {
    const page = await this.pdfDoc.getPage(this.currentPage);
    const viewport = page.getViewport({ scale: 1.5 });
    
    const canvas = document.getElementById('pdf-canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    
    // Update navigation buttons
    document.getElementById('prev-page').disabled = this.currentPage <= 1;
    document.getElementById('next-page').disabled = this.currentPage >= this.totalPages;
  }

  changePage(delta) {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage = newPage;
      this.renderPDFPage();
      document.getElementById('sig-page').value = this.currentPage;
    }
  }

  showPositionControls() {
    if (!this.signatureData) {
      this.showError('Please create a signature first.');
      return;
    }

    document.getElementById('position-controls').classList.remove('hidden');
    document.getElementById('final-actions').classList.remove('hidden');
    this.updateSignaturePreview();
  }

  updateSignaturePreview() {
    const overlay = document.getElementById('signature-overlay');
    const canvas = document.getElementById('pdf-canvas');
    
    const x = document.getElementById('sig-x').value;
    const y = document.getElementById('sig-y').value;
    const width = document.getElementById('sig-width').value;
    const page = document.getElementById('sig-page').value;
    
    // Clear overlay
    overlay.innerHTML = '';
    
    // Only show preview on current page
    if (parseInt(page) === this.currentPage) {
      const img = document.createElement('img');
      img.src = this.signatureData;
      img.style.position = 'absolute';
      img.style.left = `${x}%`;
      img.style.top = `${y}%`;
      img.style.width = `${width}%`;
      img.style.opacity = '0.8';
      img.style.border = '2px dashed #3b82f6';
      img.style.borderRadius = '4px';
      
      overlay.appendChild(img);
    }
  }

  async applySignatureToPDF() {
    if (!this.currentPDF || !this.signatureData) {
      this.showError('Please upload a PDF and create a signature first.');
      return;
    }

    try {
      const pdfDoc = await PDFLib.PDFDocument.load(this.currentPDF);
      const pages = pdfDoc.getPages();
      
      const x = parseFloat(document.getElementById('sig-x').value);
      const y = parseFloat(document.getElementById('sig-y').value);
      const width = parseFloat(document.getElementById('sig-width').value);
      const pageNumber = parseInt(document.getElementById('sig-page').value);
      
      if (pageNumber > 0 && pageNumber <= pages.length) {
        const page = pages[pageNumber - 1];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Convert signature to PDF format
        const signatureImage = await pdfDoc.embedPng(this.signatureData);
        const signatureDims = signatureImage.scale(0.5);
        
        // Calculate position and size
        const sigWidth = (pageWidth * width) / 100;
        const sigHeight = (sigWidth * signatureDims.height) / signatureDims.width;
        const sigX = (pageWidth * x) / 100;
        const sigY = pageHeight - (pageHeight * y) / 100 - sigHeight;
        
        page.drawImage(signatureImage, {
          x: sigX,
          y: sigY,
          width: sigWidth,
          height: sigHeight,
        });
      }
      
      this.signedPDFBytes = await pdfDoc.save();
      this.showSuccess('Signature applied successfully!');
      
    } catch (error) {
      console.error('Error applying signature:', error);
      this.showError('Failed to apply signature to PDF.');
    }
  }

  downloadSignedPDF() {
    if (!this.signedPDFBytes) {
      this.showError('Please apply the signature first.');
      return;
    }

    const blob = new Blob([this.signedPDFBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `signed-document-${Date.now()}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  resetTool() {
    // Clear signature
    this.clearCanvas();
    this.signatureData = null;
    
    // Reset form inputs
    document.getElementById('signature-text').value = '';
    document.getElementById('uploaded-signature-preview').classList.add('hidden');
    
    // Reset PDF
    this.currentPDF = null;
    this.pdfDoc = null;
    this.signedPDFBytes = null;
    document.getElementById('pdf-preview-section').classList.add('hidden');
    document.getElementById('position-controls').classList.add('hidden');
    document.getElementById('final-actions').classList.add('hidden');
    
    // Reset to first tab
    this.switchTab('draw');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700';
    const icon = type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle';
    
    notification.className = `fixed top-4 right-4 ${bgColor} px-6 py-4 rounded-lg border shadow-lg z-50 max-w-md`;
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${icon} mr-2"></i>
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
}

// Initialize the Digital Signature tool when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new DigitalSignature();
});
