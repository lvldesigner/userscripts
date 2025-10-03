import { loadModalWidth, saveModalWidth } from './storage.js';

class ModalStackManager {
  constructor() {
    this.stack = [];
    this.baseZIndex = 10000;
    this.keybindingRecorderActive = false;
    this.escapeHandlers = [];
    this.resizeHandleWidth = 10;
    this.isResizing = false;
    this.currentResizeModal = null;
    this.resizeStartX = 0;
    this.resizeStartWidth = 0;
    this.resizeSide = null;
    this.setupGlobalHandlers();
  }

  push(element, options = {}) {
    if (!element) {
      console.error("ModalStack.push: element is required");
      return;
    }

    const type = options.type || "stack";

    if (type !== "stack" && type !== "replace") {
      console.error('ModalStack.push: type must be "stack" or "replace"');
      return;
    }

    if (type === "replace" && this.stack.length > 0) {
      const current = this.stack[this.stack.length - 1];
      if (current.element && document.body.contains(current.element)) {
        this.removeResizeHandles(current.element);
        document.body.removeChild(current.element);
      }
    }

    const entry = {
      element,
      type,
      onClose: options.onClose || null,
      canGoBack: options.canGoBack || false,
      backFactory: options.backFactory || null,
      metadata: options.metadata || {},
      originalDimensions: null,
    };

    this.stack.push(entry);

    if (!document.body.contains(element)) {
      document.body.appendChild(element);
    }

    if (this.stack.length === 1) {
      document.body.style.overflow = 'hidden';
    }

    this.updateZIndices();
    this.updateResizeHandles();
  }

  replace(element, options = {}) {
    this.push(element, { ...options, type: "replace" });
  }

  pop() {
    if (this.stack.length === 0) {
      return null;
    }

    const entry = this.stack.pop();

    if (entry.onClose) {
      entry.onClose();
    }

    if (entry.element && document.body.contains(entry.element)) {
      this.removeResizeHandles(entry.element);
      document.body.removeChild(entry.element);
    }

    if (this.stack.length === 0) {
      this.clearEscapeHandlers();
      document.body.style.overflow = '';
    }

    this.updateZIndices();
    this.updateResizeHandles();

    return entry;
  }

  back() {
    if (this.stack.length === 0) {
      return;
    }

    const current = this.stack[this.stack.length - 1];

    if (
      current.type !== "replace" ||
      !current.canGoBack ||
      !current.backFactory
    ) {
      console.warn(
        "ModalStack.back: current modal does not support back navigation",
      );
      return;
    }

    this.pop();

    current.backFactory();
  }

  clear() {
    while (this.stack.length > 0) {
      this.pop();
    }
    this.clearEscapeHandlers();
  }

  getCurrentModal() {
    return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
  }

  getStackDepth() {
    return this.stack.length;
  }

  setKeybindingRecorderActive(active) {
    this.keybindingRecorderActive = active;
  }

  isKeybindingRecorderActive() {
    return this.keybindingRecorderActive;
  }

  pushEscapeHandler(handler) {
    if (typeof handler !== "function") {
      console.error("ModalStack.pushEscapeHandler: handler must be a function");
      return;
    }
    this.escapeHandlers.push(handler);
  }

  popEscapeHandler() {
    return this.escapeHandlers.pop();
  }

  clearEscapeHandlers() {
    this.escapeHandlers = [];
  }

  hasEscapeHandlers() {
    return this.escapeHandlers.length > 0;
  }

  isResizingModal() {
    console.log('[ModalStack] isResizingModal check:', this.isResizing);
    return this.isResizing;
  }

  updateZIndices() {
    let previousWidth = null;
    let previousMaxWidth = null;
    let previousHeight = null;
    let previousMaxHeight = null;
    let previousAlpha = 0.4;
    let stackDepth = 0;
    
    this.stack.forEach((entry, index) => {
      if (entry.element) {
        entry.element.style.zIndex = this.baseZIndex + index * 10;
        
        if (entry.type === 'stack') {
          stackDepth++;
        } else {
          stackDepth = 0;
        }
        
        const isStacked = stackDepth > 0;
        
        if (isStacked) {
          const alpha = Math.max(0.05, previousAlpha * 0.5);
          entry.element.style.background = `rgba(0, 0, 0, ${alpha})`;
          previousAlpha = alpha;
        } else {
          entry.element.style.background = 'rgba(0, 0, 0, 0.4)';
          previousAlpha = 0.4;
        }
        
        const modalContent = entry.element.querySelector('.gut-modal-content');

        if (isStacked && modalContent) {
          entry.element.classList.add("gut-modal-stacked");
          
          if (!entry.originalDimensions) {
            const computedStyle = window.getComputedStyle(modalContent);
            entry.originalDimensions = {
              width: computedStyle.width,
              maxWidth: computedStyle.maxWidth,
              height: computedStyle.height,
              maxHeight: computedStyle.maxHeight,
            };
          }
          
          const offsetAmount = stackDepth * 20;
          
          let targetWidth = previousWidth;
          let targetMaxWidth = previousMaxWidth;
          let targetHeight = previousHeight;
          let targetMaxHeight = previousMaxHeight;
          
          if (targetWidth === null) {
            targetWidth = parseFloat(entry.originalDimensions.width);
          }
          if (targetMaxWidth === null) {
            targetMaxWidth = parseFloat(entry.originalDimensions.maxWidth);
          }
          if (targetHeight === null) {
            targetHeight = parseFloat(entry.originalDimensions.height);
          }
          if (targetMaxHeight === null) {
            targetMaxHeight = parseFloat(entry.originalDimensions.maxHeight);
          }
          
          const scaledWidth = targetWidth * 0.95;
          const scaledMaxWidth = targetMaxWidth * 0.95;
          const scaledHeight = targetHeight * 0.9;
          const scaledMaxHeight = targetMaxHeight * 0.9;
          
          if (entry.originalDimensions.width && entry.originalDimensions.width !== 'auto') {
            modalContent.style.width = `${scaledWidth}px`;
            previousWidth = scaledWidth;
          }
          
          if (entry.originalDimensions.maxWidth && entry.originalDimensions.maxWidth !== 'none') {
            modalContent.style.maxWidth = `${scaledMaxWidth}px`;
            previousMaxWidth = scaledMaxWidth;
          }
          
          if (entry.originalDimensions.height && entry.originalDimensions.height !== 'auto') {
            modalContent.style.height = `${scaledHeight}px`;
            previousHeight = scaledHeight;
          }
          
          if (entry.originalDimensions.maxHeight && entry.originalDimensions.maxHeight !== 'none') {
            modalContent.style.maxHeight = `${scaledMaxHeight}px`;
            previousMaxHeight = scaledMaxHeight;
          }
          
          modalContent.style.marginTop = `${offsetAmount}px`;
        } else {
          entry.element.classList.remove("gut-modal-stacked");
          if (modalContent) {
            const savedWidth = loadModalWidth();
            
            modalContent.style.width = '';
            modalContent.style.height = '';
            modalContent.style.marginTop = '';
            
            if (savedWidth) {
              modalContent.style.maxWidth = `${savedWidth}px`;
            } else {
              modalContent.style.maxWidth = '';
            }
            
            const computedStyle = window.getComputedStyle(modalContent);
            previousWidth = parseFloat(computedStyle.width);
            previousMaxWidth = savedWidth || parseFloat(computedStyle.maxWidth);
            previousHeight = parseFloat(computedStyle.height);
            previousMaxHeight = parseFloat(computedStyle.maxHeight);
          }
        }
      }
    });
  }

  updateResizeHandles() {
    this.stack.forEach((entry, index) => {
      const isTopModal = index === this.stack.length - 1;
      
      if (isTopModal) {
        this.addResizeHandles(entry.element);
      } else {
        this.removeResizeHandles(entry.element);
      }
    });
  }

  addResizeHandles(modalElement) {
    if (!modalElement) return;
    
    const modalContent = modalElement.querySelector('.gut-modal-content');
    if (!modalContent) return;
    
    if (modalContent.querySelector('.gut-resize-handle')) {
      return;
    }
    
    const leftHandle = document.createElement('div');
    leftHandle.className = 'gut-resize-handle gut-resize-handle-left';
    leftHandle.dataset.side = 'left';
    
    const rightHandle = document.createElement('div');
    rightHandle.className = 'gut-resize-handle gut-resize-handle-right';
    rightHandle.dataset.side = 'right';
    
    modalContent.appendChild(leftHandle);
    modalContent.appendChild(rightHandle);
    
    [leftHandle, rightHandle].forEach(handle => {
      handle.addEventListener('mouseenter', () => {
        if (!this.isResizing) {
          handle.classList.add('gut-resize-handle-hover');
        }
      });
      
      handle.addEventListener('mouseleave', () => {
        if (!this.isResizing) {
          handle.classList.remove('gut-resize-handle-hover');
        }
      });
      
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.startResize(e, modalContent, handle.dataset.side);
      });
    });
  }

  removeResizeHandles(modalElement) {
    if (!modalElement) return;
    
    const modalContent = modalElement.querySelector('.gut-modal-content');
    if (!modalContent) return;
    
    const handles = modalContent.querySelectorAll('.gut-resize-handle');
    handles.forEach(handle => handle.remove());
  }

  startResize(e, modalContent, side) {
    console.log('[ModalStack] startResize - setting isResizing = true');
    this.isResizing = true;
    this.currentResizeModal = modalContent;
    this.resizeStartX = e.clientX;
    this.resizeSide = side;
    
    const computedStyle = window.getComputedStyle(modalContent);
    this.resizeStartWidth = parseFloat(computedStyle.width);
    
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    const handles = modalContent.querySelectorAll('.gut-resize-handle');
    handles.forEach(handle => handle.classList.add('gut-resize-handle-active'));
  }

  handleResize(e) {
    if (!this.isResizing || !this.currentResizeModal) return;
    
    const deltaX = e.clientX - this.resizeStartX;
    const adjustedDelta = this.resizeSide === 'left' ? -deltaX : deltaX;
    const newWidth = Math.max(400, Math.min(2000, this.resizeStartWidth + adjustedDelta));
    
    this.currentResizeModal.style.maxWidth = `${newWidth}px`;
  }

  endResize() {
    console.log('[ModalStack] endResize - isResizing was:', this.isResizing);
    if (!this.isResizing || !this.currentResizeModal) return;
    
    const computedStyle = window.getComputedStyle(this.currentResizeModal);
    const finalWidth = parseFloat(computedStyle.maxWidth);
    
    saveModalWidth(Math.round(finalWidth));
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    const handles = this.currentResizeModal.querySelectorAll('.gut-resize-handle');
    handles.forEach(handle => {
      handle.classList.remove('gut-resize-handle-active');
      handle.classList.remove('gut-resize-handle-hover');
    });
    
    setTimeout(() => {
      this.isResizing = false;
      this.currentResizeModal = null;
      this.resizeSide = null;
      console.log('[ModalStack] endResize - set isResizing = false (after delay)');
    }, 50);
  }

  setupGlobalHandlers() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.stack.length > 0) {
        if (this.isKeybindingRecorderActive()) {
          return;
        }

        if (this.hasEscapeHandlers()) {
          const handler = this.escapeHandlers[this.escapeHandlers.length - 1];
          const result = handler(e);
          if (result === true) {
            return;
          }
        }

        const current = this.stack[this.stack.length - 1];

        if (current.type === "stack") {
          this.pop();
        } else if (current.type === "replace") {
          if (current.canGoBack) {
            this.back();
          } else {
            this.pop();
          }
        }
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      this.handleResize(e);
    });
    
    document.addEventListener('mouseup', () => {
      this.endResize();
    });
  }
}

export const ModalStack = new ModalStackManager();
