import { loadModalWidth, saveModalWidth } from "./storage.js";

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

    const overlayClickHandler = (e) => {
      if (e.target === element && !this.isResizing) {
        this.pop();
      }
    };

    element.addEventListener('click', overlayClickHandler);

    const closeButtons = element.querySelectorAll('.gut-modal-close-btn, #modal-close-x, [data-modal-action="close"]');
    const closeButtonHandlers = [];
    
    closeButtons.forEach(btn => {
      const handler = () => this.pop();
      btn.addEventListener('click', handler);
      closeButtonHandlers.push({ button: btn, handler });
    });

    const keyboardHandler = options.keyboardHandler || null;
    if (keyboardHandler) {
      document.addEventListener('keydown', keyboardHandler);
    }

    const entry = {
      element,
      type,
      onClose: options.onClose || null,
      canGoBack: options.canGoBack || false,
      backFactory: options.backFactory || null,
      metadata: options.metadata || {},
      originalDimensions: null,
      overlayClickHandler,
      closeButtonHandlers,
      keyboardHandler,
    };

    this.stack.push(entry);

    if (!document.body.contains(element)) {
      document.body.appendChild(element);
    }

    if (this.stack.length === 1) {
      document.body.style.overflow = "hidden";
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

    if (entry.overlayClickHandler && entry.element) {
      entry.element.removeEventListener('click', entry.overlayClickHandler);
    }

    if (entry.closeButtonHandlers) {
      entry.closeButtonHandlers.forEach(({ button, handler }) => {
        button.removeEventListener('click', handler);
      });
    }

    if (entry.keyboardHandler) {
      document.removeEventListener('keydown', entry.keyboardHandler);
    }

    if (entry.element && document.body.contains(entry.element)) {
      this.removeResizeHandles(entry.element);
      document.body.removeChild(entry.element);
    }

    if (this.stack.length === 0) {
      this.clearEscapeHandlers();
      document.body.style.overflow = "";
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
    return this.isResizing;
  }

  parseDimensionWithUnit(value) {
    if (!value || value === 'auto' || value === 'none') {
      return { value: null, unit: null };
    }
    
    const match = value.match(/^([\d.]+)(px|vh|vw|%)?$/);
    if (match) {
      return {
        value: parseFloat(match[1]),
        unit: match[2] || 'px'
      };
    }
    
    return {
      value: parseFloat(value),
      unit: 'px'
    };
  }

  detectViewportUnit(computedValue, dimension) {
    if (!computedValue) return null;
    
    const pxValue = parseFloat(computedValue);
    if (isNaN(pxValue)) return null;
    
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    if (dimension === 'height' || dimension === 'maxHeight') {
      const percentOfVh = (pxValue / vh) * 100;
      if (Math.abs(percentOfVh - 90) < 0.5) return { value: 90, unit: 'vh' };
      if (Math.abs(percentOfVh - 85) < 0.5) return { value: 85, unit: 'vh' };
      if (Math.abs(percentOfVh - 80) < 0.5) return { value: 80, unit: 'vh' };
    }
    
    if (dimension === 'width' || dimension === 'maxWidth') {
      const percentOfVw = (pxValue / vw) * 100;
      if (Math.abs(percentOfVw - 90) < 0.5) return { value: 90, unit: 'vw' };
      if (Math.abs(percentOfVw - 85) < 0.5) return { value: 85, unit: 'vw' };
      if (Math.abs(percentOfVw - 80) < 0.5) return { value: 80, unit: 'vw' };
    }
    
    return null;
  }

  formatDimension(value, unit) {
    return `${value}${unit}`;
  }

  updateZIndices() {
    let previousWidth = null;
    let previousMaxWidth = null;
    let previousHeight = null;
    let previousMaxHeight = null;
    let previousWidthUnit = 'px';
    let previousMaxWidthUnit = 'px';
    let previousHeightUnit = 'px';
    let previousMaxHeightUnit = 'px';
    let previousAlpha = 0.4;

    this.stack.forEach((entry, index) => {
      if (entry.element) {
        entry.element.style.zIndex = this.baseZIndex + index * 10;

        const isStacked = index > 0 && entry.type === "stack";

        if (isStacked) {
          const stackDepth = this.stack.slice(0, index).filter(e => e.type === "stack").length + 1;
          const alpha = Math.max(0.05, previousAlpha * 0.5);
          entry.element.style.background = `rgba(0, 0, 0, ${alpha})`;
          previousAlpha = alpha;
        } else {
          entry.element.style.background = "rgba(0, 0, 0, 0.4)";
          previousAlpha = 0.4;
        }

        const modalContent = entry.element.querySelector(".gut-modal-content");

        if (isStacked && modalContent) {
          entry.element.classList.add("gut-modal-stacked");

          if (!entry.originalDimensions) {
            const inlineStyle = modalContent.style;
            entry.originalDimensions = {
              width: inlineStyle.width || null,
              maxWidth: inlineStyle.maxWidth || null,
              height: inlineStyle.height || null,
              maxHeight: inlineStyle.maxHeight || null,
            };
            
            if (!entry.originalDimensions.width) {
              const computedStyle = window.getComputedStyle(modalContent);
              entry.originalDimensions.width = computedStyle.width;
            }
            if (!entry.originalDimensions.maxWidth) {
              const computedStyle = window.getComputedStyle(modalContent);
              entry.originalDimensions.maxWidth = computedStyle.maxWidth;
            }
            if (!entry.originalDimensions.height) {
              const computedStyle = window.getComputedStyle(modalContent);
              entry.originalDimensions.height = computedStyle.height;
            }
            if (!entry.originalDimensions.maxHeight) {
              const computedStyle = window.getComputedStyle(modalContent);
              entry.originalDimensions.maxHeight = computedStyle.maxHeight;
            }
          }

          const stackDepth = this.stack.slice(0, index).filter(e => e.type === "stack").length + 1;
          const offsetAmount = stackDepth * 20;

          let targetWidth = previousWidth;
          let targetMaxWidth = previousMaxWidth;
          let targetHeight = previousHeight;
          let targetMaxHeight = previousMaxHeight;
          let targetWidthUnit = previousWidthUnit;
          let targetMaxWidthUnit = previousMaxWidthUnit;
          let targetHeightUnit = previousHeightUnit;
          let targetMaxHeightUnit = previousMaxHeightUnit;

          if (targetWidth === null) {
            const parsed = this.parseDimensionWithUnit(entry.originalDimensions.width);
            targetWidth = parsed.value;
            targetWidthUnit = parsed.unit;
          }
          if (targetMaxWidth === null) {
            const parsed = this.parseDimensionWithUnit(entry.originalDimensions.maxWidth);
            targetMaxWidth = parsed.value;
            targetMaxWidthUnit = parsed.unit;
          }
          if (targetHeight === null) {
            const parsed = this.parseDimensionWithUnit(entry.originalDimensions.height);
            targetHeight = parsed.value;
            targetHeightUnit = parsed.unit;
          }
          if (targetMaxHeight === null) {
            const parsed = this.parseDimensionWithUnit(entry.originalDimensions.maxHeight);
            targetMaxHeight = parsed.value;
            targetMaxHeightUnit = parsed.unit;
          }

          const scaledWidth = targetWidth * 0.95;
          const scaledMaxWidth = targetMaxWidth * 0.95;
          const scaledHeight = targetHeight * 0.9;
          const scaledMaxHeight = targetMaxHeight * 0.9;

          if (
            entry.originalDimensions.width &&
            entry.originalDimensions.width !== "auto"
          ) {
            modalContent.style.width = this.formatDimension(scaledWidth, targetWidthUnit);
            previousWidth = scaledWidth;
            previousWidthUnit = targetWidthUnit;
          }

          if (
            entry.originalDimensions.maxWidth &&
            entry.originalDimensions.maxWidth !== "none"
          ) {
            modalContent.style.maxWidth = this.formatDimension(scaledMaxWidth, targetMaxWidthUnit);
            previousMaxWidth = scaledMaxWidth;
            previousMaxWidthUnit = targetMaxWidthUnit;
          }

          if (
            entry.originalDimensions.height &&
            entry.originalDimensions.height !== "auto"
          ) {
            modalContent.style.height = this.formatDimension(scaledHeight, targetHeightUnit);
            previousHeight = scaledHeight;
            previousHeightUnit = targetHeightUnit;
          }

          if (
            entry.originalDimensions.maxHeight &&
            entry.originalDimensions.maxHeight !== "none"
          ) {
            modalContent.style.maxHeight = this.formatDimension(scaledMaxHeight, targetMaxHeightUnit);
            previousMaxHeight = scaledMaxHeight;
            previousMaxHeightUnit = targetMaxHeightUnit;
          }

          modalContent.style.marginTop = `${offsetAmount}px`;
        } else {
          entry.element.classList.remove("gut-modal-stacked");
          if (modalContent) {
            const savedWidth = loadModalWidth();

            modalContent.style.width = "";
            modalContent.style.height = "";
            modalContent.style.marginTop = "";

            if (savedWidth) {
              modalContent.style.maxWidth = `${savedWidth}px`;
            } else {
              modalContent.style.maxWidth = "";
            }

            const computedStyle = window.getComputedStyle(modalContent);
            const inlineStyle = modalContent.style;
            
            let widthParsed = this.parseDimensionWithUnit(inlineStyle.width);
            if (!widthParsed.value && computedStyle.width) {
              const detected = this.detectViewportUnit(computedStyle.width, 'width');
              widthParsed = detected || this.parseDimensionWithUnit(computedStyle.width);
            }
            
            let maxWidthParsed = this.parseDimensionWithUnit(inlineStyle.maxWidth || (savedWidth ? `${savedWidth}px` : null));
            if (!maxWidthParsed.value && computedStyle.maxWidth) {
              const detected = this.detectViewportUnit(computedStyle.maxWidth, 'maxWidth');
              maxWidthParsed = detected || this.parseDimensionWithUnit(computedStyle.maxWidth);
            }
            
            let heightParsed = this.parseDimensionWithUnit(inlineStyle.height);
            if (!heightParsed.value && computedStyle.height) {
              const detected = this.detectViewportUnit(computedStyle.height, 'height');
              heightParsed = detected || this.parseDimensionWithUnit(computedStyle.height);
            }
            
            let maxHeightParsed = this.parseDimensionWithUnit(inlineStyle.maxHeight);
            if (!maxHeightParsed.value && computedStyle.maxHeight) {
              const detected = this.detectViewportUnit(computedStyle.maxHeight, 'maxHeight');
              maxHeightParsed = detected || this.parseDimensionWithUnit(computedStyle.maxHeight);
            }
            
            previousWidth = widthParsed.value;
            previousWidthUnit = widthParsed.unit;
            previousMaxWidth = maxWidthParsed.value;
            previousMaxWidthUnit = maxWidthParsed.unit;
            previousHeight = heightParsed.value;
            previousHeightUnit = heightParsed.unit;
            previousMaxHeight = maxHeightParsed.value;
            previousMaxHeightUnit = maxHeightParsed.unit;
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

    const modalContent = modalElement.querySelector(".gut-modal-content");
    if (!modalContent) return;

    if (modalContent.querySelector(".gut-resize-handle")) {
      return;
    }

    const leftHandle = document.createElement("div");
    leftHandle.className = "gut-resize-handle gut-resize-handle-left";
    leftHandle.dataset.side = "left";

    const rightHandle = document.createElement("div");
    rightHandle.className = "gut-resize-handle gut-resize-handle-right";
    rightHandle.dataset.side = "right";

    modalContent.appendChild(leftHandle);
    modalContent.appendChild(rightHandle);

    [leftHandle, rightHandle].forEach((handle) => {
      handle.addEventListener("mouseenter", () => {
        if (!this.isResizing) {
          handle.classList.add("gut-resize-handle-hover");
        }
      });

      handle.addEventListener("mouseleave", () => {
        if (!this.isResizing) {
          handle.classList.remove("gut-resize-handle-hover");
        }
      });

      handle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.startResize(e, modalContent, handle.dataset.side);
      });
    });
  }

  removeResizeHandles(modalElement) {
    if (!modalElement) return;

    const modalContent = modalElement.querySelector(".gut-modal-content");
    if (!modalContent) return;

    const handles = modalContent.querySelectorAll(".gut-resize-handle");
    handles.forEach((handle) => handle.remove());
  }

  startResize(e, modalContent, side) {
    this.isResizing = true;
    this.currentResizeModal = modalContent;
    this.resizeStartX = e.clientX;
    this.resizeSide = side;

    const computedStyle = window.getComputedStyle(modalContent);
    this.resizeStartWidth = parseFloat(computedStyle.width);

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const handles = modalContent.querySelectorAll(".gut-resize-handle");
    handles.forEach((handle) =>
      handle.classList.add("gut-resize-handle-active"),
    );
  }

  handleResize(e) {
    if (!this.isResizing || !this.currentResizeModal) return;

    const deltaX = e.clientX - this.resizeStartX;
    const adjustedDelta = this.resizeSide === "left" ? -deltaX : deltaX;
    const newWidth = Math.max(
      400,
      Math.min(2000, this.resizeStartWidth + adjustedDelta),
    );

    this.currentResizeModal.style.maxWidth = `${newWidth}px`;
  }

  endResize() {
    if (!this.isResizing || !this.currentResizeModal) return;

    const computedStyle = window.getComputedStyle(this.currentResizeModal);
    const finalWidth = parseFloat(computedStyle.maxWidth);

    saveModalWidth(Math.round(finalWidth));

    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    const handles =
      this.currentResizeModal.querySelectorAll(".gut-resize-handle");
    handles.forEach((handle) => {
      handle.classList.remove("gut-resize-handle-active");
      handle.classList.remove("gut-resize-handle-hover");
    });

    setTimeout(() => {
      this.isResizing = false;
      this.currentResizeModal = null;
      this.resizeSide = null;
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

    document.addEventListener("mousemove", (e) => {
      this.handleResize(e);
    });

    document.addEventListener("mouseup", () => {
      this.endResize();
    });
  }
}

export const ModalStack = new ModalStackManager();

export function createModal(htmlContent, options = {}) {
  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  const modal = container.firstElementChild;
  ModalStack.push(modal, options);
  return modal;
}
