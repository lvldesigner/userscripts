/**
 * Auto-resize functionality for textareas
 */

/**
 * Sets up auto-resize functionality for a textarea element
 * @param {HTMLTextAreaElement} textarea - The textarea element to make auto-resizable
 * @param {Object} options - Configuration options
 * @param {number} options.minLines - Minimum number of lines (default: 3)
 * @param {number} options.maxLines - Maximum number of lines (default: 7)
 * @param {boolean} options.initialResize - Whether to perform initial resize (default: true)
 * @returns {Function} - Function to manually trigger resize
 */
export function setupAutoResize(textarea, options = {}) {
  if (!textarea || textarea.tagName !== 'TEXTAREA') {
    console.warn('setupAutoResize: Invalid textarea element provided');
    return () => {};
  }

  const {
    minLines = 3,
    maxLines = 7,
    initialResize = true
  } = options;

  const autoResize = () => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate line height in pixels
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const fontSize = parseFloat(computedStyle.fontSize);
    
    // Handle 'normal' line-height by using a reasonable default
    const actualLineHeight = lineHeight && lineHeight !== 0 ? lineHeight : fontSize * 1.4;
    
    // Calculate height bounds
    const minHeight = actualLineHeight * minLines;
    const maxHeight = actualLineHeight * maxLines;
    const contentHeight = textarea.scrollHeight;
    
    // Set height within bounds
    const newHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
    textarea.style.height = newHeight + 'px';
  };

  // Set up event listeners for both user input and programmatic changes
  textarea.addEventListener('input', autoResize);
  textarea.addEventListener('change', autoResize);

  // Perform initial resize if requested
  if (initialResize) {
    // Use setTimeout to ensure the textarea is properly rendered
    setTimeout(autoResize, 0);
  }

  // Return the resize function for manual triggering
  return autoResize;
}

/**
 * Sets up auto-resize for multiple textareas with the same options
 * @param {NodeList|HTMLTextAreaElement[]} textareas - Array or NodeList of textarea elements
 * @param {Object} options - Configuration options (same as setupAutoResize)
 * @returns {Function[]} - Array of resize functions for each textarea
 */
export function setupAutoResizeMultiple(textareas, options = {}) {
  const resizeFunctions = [];
  
  textareas.forEach(textarea => {
    const resizeFunction = setupAutoResize(textarea, options);
    resizeFunctions.push(resizeFunction);
  });
  
  return resizeFunctions;
}