class ModalStackManager {
  constructor() {
    this.stack = [];
    this.baseZIndex = 10000;
    this.keybindingRecorderActive = false;
    this.escapeHandlers = [];
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
      document.body.removeChild(entry.element);
    }

    if (this.stack.length === 0) {
      this.clearEscapeHandlers();
      document.body.style.overflow = '';
    }

    this.updateZIndices();

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

  updateZIndices() {
    console.log('[ModalStack] updateZIndices called, stack length:', this.stack.length);
    
    let previousWidth = null;
    let previousMaxWidth = null;
    let previousHeight = null;
    let previousMaxHeight = null;
    
    this.stack.forEach((entry, index) => {
      console.log(`[ModalStack] Modal ${index}: type="${entry.type}", hasElement=${!!entry.element}`);
      
      if (entry.element) {
        entry.element.style.zIndex = this.baseZIndex + index * 10;
        const modalContent = entry.element.querySelector('.gut-modal-content');
        console.log(`[ModalStack] Modal ${index}: found modalContent=${!!modalContent}`);

        if (index > 0 && modalContent) {
          entry.element.classList.add("gut-modal-stacked");
          
          if (!entry.originalDimensions) {
            const computedStyle = window.getComputedStyle(modalContent);
            entry.originalDimensions = {
              width: computedStyle.width,
              maxWidth: computedStyle.maxWidth,
              height: computedStyle.height,
              maxHeight: computedStyle.maxHeight,
            };
            console.log(`[ModalStack] Modal ${index}: Stored original dimensions:`, entry.originalDimensions);
          }
          
          const offsetAmount = index * 20;
          
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
          const scaledHeight = targetHeight * 0.95;
          const scaledMaxHeight = targetMaxHeight * 0.95;
          
          console.log(`[ModalStack] Modal ${index}: Previous width=${targetWidth}px, scaling to ${scaledWidth}px (95%)`);
          console.log(`[ModalStack] Modal ${index}: Previous height=${targetHeight}px, scaling to ${scaledHeight}px (95%)`);
          
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
          console.log(`[ModalStack] Modal ${index}: Applied width="${modalContent.style.width}", maxWidth="${modalContent.style.maxWidth}", height="${modalContent.style.height}", maxHeight="${modalContent.style.maxHeight}"`);
        } else {
          console.log(`[ModalStack] Modal ${index}: NO SCALING (base modal)`);
          entry.element.classList.remove("gut-modal-stacked");
          if (modalContent) {
            modalContent.style.width = '';
            modalContent.style.maxWidth = '';
            modalContent.style.height = '';
            modalContent.style.maxHeight = '';
            modalContent.style.marginTop = '';
            
            const computedStyle = window.getComputedStyle(modalContent);
            previousWidth = parseFloat(computedStyle.width);
            previousMaxWidth = parseFloat(computedStyle.maxWidth);
            previousHeight = parseFloat(computedStyle.height);
            previousMaxHeight = parseFloat(computedStyle.maxHeight);
            console.log(`[ModalStack] Modal ${index}: Base dimensions: width=${previousWidth}px, maxWidth=${previousMaxWidth}px, height=${previousHeight}px, maxHeight=${previousMaxHeight}px`);
          }
        }
      }
    });
    console.log('[ModalStack] updateZIndices complete');
  }

  setupGlobalHandlers() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.stack.length > 0) {
        if (this.isKeybindingRecorderActive()) {
          return;
        }

        // Check if there are escape handlers for functionality inside the current modal
        if (this.hasEscapeHandlers()) {
          const handler = this.escapeHandlers[this.escapeHandlers.length - 1];
          const result = handler(e);
          // If handler returns true, it handled the escape and we should not proceed with modal closing
          if (result === true) {
            return;
          }
          // If handler returns false or undefined, continue with normal modal behavior
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
  }
}

export const ModalStack = new ModalStackManager();
