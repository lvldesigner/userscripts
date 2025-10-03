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
    };

    this.stack.push(entry);

    if (!document.body.contains(element)) {
      document.body.appendChild(element);
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

    // Clear escape handlers when closing a modal
    if (this.stack.length === 0) {
      this.clearEscapeHandlers();
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
    this.stack.forEach((entry, index) => {
      if (entry.element) {
        entry.element.style.zIndex = this.baseZIndex + index * 10;

        if (index > 0) {
          entry.element.classList.add("gut-modal-stacked");
        } else {
          entry.element.classList.remove("gut-modal-stacked");
        }
      }
    });
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
