/**
 * Universal Tool Enhancements
 * Enhanced version that works with shared utilities
 */

// Add enhanced scrolling and UI features to any tool
function initializeToolEnhancements() {
    // Add scroll-to-top button
    addScrollToTopButton();
    
    // Enhanced scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Auto-resize textareas if any exist
    autoResizeTextareas();
    
    // Enhanced form styling
    enhanceFormInputs();
    
    // Initialize particles if container exists
    if (document.getElementById('particles-js')) {
        ToolUtils.initParticles();
    }
    
    // Add keyboard shortcuts
    addKeyboardShortcuts();
}

// Add scroll-to-top button
function addScrollToTopButton() {
    const scrollButton = document.createElement('button');
    scrollButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollButton.className = 'scroll-to-top-btn';
    scrollButton.style.cssText = `
        position: fixed;
        bottom: 120px;
        right: 30px;
        background: linear-gradient(45deg, #00d4ff, #ff0080);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        font-size: 16px;
    `;

    document.body.appendChild(scrollButton);

    // Show/hide scroll button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            scrollButton.style.opacity = '1';
            scrollButton.style.visibility = 'visible';
        } else {
            scrollButton.style.opacity = '0';
            scrollButton.style.visibility = 'hidden';
        }
    });

    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Auto-resize textareas
function autoResizeTextareas() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.max(this.scrollHeight, 100) + 'px';
        });
    });
}

// Enhance form inputs with better styling
function enhanceFormInputs() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="url"], textarea');
    
    inputs.forEach(input => {
        // Add focus enhancement
        input.addEventListener('focus', function() {
            this.style.borderColor = '#00d4ff';
            this.style.boxShadow = '0 0 10px rgba(0, 212, 255, 0.3)';
        });
        
        input.addEventListener('blur', function() {
            this.style.borderColor = '';
            this.style.boxShadow = '';
        });
        
        // Improve text color and background for better visibility
        if (input.style.color === '' || input.style.color === 'black') {
            input.style.color = '#ffffff';
            input.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
            input.style.border = '2px solid rgba(0, 212, 255, 0.3)';
            input.style.borderRadius = '8px';
            input.style.padding = '10px';
        }
    });
}

// Add keyboard shortcuts
function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+H for Home
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            window.location.href = '../../index.html';
        }
        
        // Ctrl+D for Download (if download button exists)
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const downloadBtn = document.getElementById('download-btn');
            if (downloadBtn && !downloadBtn.disabled) {
                downloadBtn.click();
            }
        }
        
        // Escape to clear any active modals or reset interface
        if (e.key === 'Escape') {
            // Clear any status messages
            const statusMessages = document.querySelectorAll('.status-message');
            statusMessages.forEach(msg => msg.remove());
        }
    });
}

// Enhanced file handling
function enhanceFileHandling() {
    // Prevent page refresh on file drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
}

// Add tool-specific analytics (optional)
function addAnalytics() {
    // Track tool usage (implement if needed)
    const toolName = document.title.split(' - ')[0];
    console.log(`Tool loaded: ${toolName}`);
}

// Add CSS for enhanced scrollbars if not already present
function addEnhancedScrollbarStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Enhanced scrollbar styling */
        ::-webkit-scrollbar {
            width: 12px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
        }

        ::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #00d4ff, #ff0080);
            border-radius: 6px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, #ff0080, #00d4ff);
        }

        /* Smooth scrolling */
        html {
            scroll-behavior: smooth;
        }

        /* Enhanced form inputs */
        input[type="text"]:focus, 
        input[type="password"]:focus, 
        input[type="email"]:focus, 
        input[type="url"]:focus, 
        textarea:focus {
            outline: none !important;
            border-color: #00d4ff !important;
            box-shadow: 0 0 10px rgba(0, 212, 255, 0.3) !important;
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeToolEnhancements();
    addEnhancedScrollbarStyles();
});

// Also initialize if script is loaded after DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeToolEnhancements);
} else {
    initializeToolEnhancements();
    addEnhancedScrollbarStyles();
}
