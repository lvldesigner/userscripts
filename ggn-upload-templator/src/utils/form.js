// Get current form data
export function getCurrentFormData(config) {
  const formData = {};
  const formSelector = config.TARGET_FORM_SELECTOR || "form";
  const targetForm = document.querySelector(formSelector);

  // Build the field selector with custom selectors
  // Include fields with either name or id attributes to support fields like Steam ID
  const defaultSelector = "input[name], input[id], select[name], select[id], textarea[name], textarea[id]";
  const customSelectors = config.CUSTOM_FIELD_SELECTORS || [];
  const fieldSelector =
    customSelectors.length > 0
      ? `${defaultSelector}, ${customSelectors.join(", ")}`
      : defaultSelector;

  const inputs = targetForm
    ? targetForm.querySelectorAll(fieldSelector)
    : document.querySelectorAll(fieldSelector);

  inputs.forEach((input) => {
    // Exclude fields that are part of our own injected UI
    if (input.closest('#ggn-upload-templator-ui')) {
      return; // Skip our own UI elements
    }

    // Check if this is a custom field element
    const isCustomField = isElementMatchedByCustomSelector(input, config);

    // For custom fields, we need a different validation approach
    // For standard fields, accept either name or id attribute
    const hasValidIdentifier = isCustomField
      ? input.name ||
        input.id ||
        input.getAttribute("data-field") ||
        input.getAttribute("data-name")
      : input.name || input.id;

    // Skip invalid elements
    if (!hasValidIdentifier) return;

    // For standard form elements, apply the original filtering
    if (
      !isCustomField &&
      (input.type === "file" ||
        input.type === "button" ||
        input.type === "submit" ||
        input.type === "hidden")
    ) {
      return;
    }

    // Get the field name/identifier
    const fieldName =
      input.name ||
      input.id ||
      input.getAttribute("data-field") ||
      input.getAttribute("data-name");

    if (fieldName) {
      // For radio buttons, only process if we haven't seen this group yet
      if (input.type === "radio" && formData[fieldName]) {
        return; // Skip, already processed this radio group
      }

      const fieldInfo = {
        value: isCustomField
          ? input.value ||
            input.textContent ||
            input.getAttribute("data-value") ||
            ""
          : input.type === "checkbox" || input.type === "radio"
            ? input.checked
            : input.value || "",
        label: getFieldLabel(input, config),
        type: input.tagName.toLowerCase(),
        inputType: input.type || "custom",
      };

      // For radio buttons, we need to handle them specially - group by name
      if (input.type === "radio") {
        const radioGroup = document.querySelectorAll(
          `input[name="${fieldName}"][type="radio"]`,
        );
        fieldInfo.radioOptions = Array.from(radioGroup).map((radio) => ({
          value: radio.value,
          checked: radio.checked,
          label: getFieldLabel(radio, config) || radio.value,
        }));
        // Find the selected value from the group
        const selectedRadio = Array.from(radioGroup).find(
          (radio) => radio.checked,
        );
        fieldInfo.selectedValue = selectedRadio ? selectedRadio.value : "";
        fieldInfo.value = fieldInfo.selectedValue; // Override value for radio groups
      }

      // For select elements, capture all options and current selection
      if (input.tagName.toLowerCase() === "select") {
        fieldInfo.options = Array.from(input.options).map((option) => ({
          value: option.value,
          text: option.textContent.trim(),
          selected: option.selected,
        }));
        fieldInfo.selectedValue = input.value;
      }

      formData[fieldName] = fieldInfo;
    }
  });

  return formData;
}

// Check if element was matched by a custom selector
export function isElementMatchedByCustomSelector(element, config) {
  const customSelectors = config.CUSTOM_FIELD_SELECTORS || [];
  if (customSelectors.length === 0) return false;

  // Check if element matches any custom selector
  return customSelectors.some((selector) => {
    try {
      return element.matches(selector);
    } catch (e) {
      console.warn(`Invalid custom selector: ${selector}`, e);
      return false;
    }
  });
}

// Clean label text by removing link tags and trailing colons
export function cleanLabelText(text) {
  if (!text) return text;

  // Create a temporary element to parse HTML content
  const tempElement = document.createElement("div");
  tempElement.innerHTML = text;

  // Handle link tags: distinguish between bracketed helper links and standalone label links
  const linkElements = tempElement.querySelectorAll("a");
  linkElements.forEach((link) => {
    const linkText = link.textContent.trim();
    
    // Get surrounding text to check if link is inside brackets
    let parent = link.parentNode;
    if (parent) {
      // Get the full text of parent to check for bracket context
      const parentText = parent.textContent || '';
      const linkIndex = parentText.indexOf(linkText);
      
      // Look for brackets around the link text
      let beforeLink = '';
      let afterLink = '';
      
      // Walk through previous siblings to find bracket
      let prevNode = link.previousSibling;
      while (prevNode) {
        if (prevNode.nodeType === Node.TEXT_NODE) {
          beforeLink = prevNode.textContent + beforeLink;
        }
        prevNode = prevNode.previousSibling;
      }
      
      // Walk through next siblings to find bracket
      let nextNode = link.nextSibling;
      while (nextNode) {
        if (nextNode.nodeType === Node.TEXT_NODE) {
          afterLink += nextNode.textContent;
        }
        nextNode = nextNode.nextSibling;
      }
      
      // Check if link is surrounded by brackets (with optional whitespace)
      const isBracketed = /\[\s*$/.test(beforeLink) && /^\s*\]/.test(afterLink);
      
      if (isBracketed) {
        // This is a helper/action link in brackets - remove it entirely
        link.remove();
      } else {
        // This is a standalone label link - keep its text content
        link.replaceWith(document.createTextNode(linkText));
      }
    } else {
      // No parent, just replace with text
      link.replaceWith(document.createTextNode(linkText));
    }
  });

  // Remove all hidden elements (elements with .hidden class)
  const hiddenElements = tempElement.querySelectorAll(".hidden");
  hiddenElements.forEach((hidden) => {
    hidden.remove();
  });

  // Get the cleaned text content
  let cleanedText = tempElement.textContent || tempElement.innerText || "";

  // Trim whitespace
  cleanedText = cleanedText.trim();

  // Remove empty brackets that result from removed links (e.g., ": []")
  cleanedText = cleanedText.replace(/:\s*\[\s*\]/g, '');
  cleanedText = cleanedText.replace(/\[\s*\]/g, '').trim();

  // Remove trailing colon
  if (cleanedText.endsWith(":")) {
    cleanedText = cleanedText.slice(0, -1).trim();
  }

  return cleanedText;
}

// Get adjacent text node content next to an input
function getAdjacentText(input) {
  const siblings = [];
  let node = input.nextSibling;
  
  // Look at the next few siblings for text content
  let count = 0;
  while (node && count < 3) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text && text !== '&nbsp;') {
        siblings.push(text);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
      // Stop at line breaks
      break;
    }
    node = node.nextSibling;
    count++;
  }
  
  return siblings.join(' ').trim();
}

// Get structural label from nested table hierarchy
function getNestedTableLabel(input) {
  const labelParts = [];
  
  // Find the immediate parent cell
  const parentCell = input.closest('td');
  if (!parentCell) return null;
  
  // Find the parent row
  const parentRow = parentCell.closest('tr');
  if (!parentRow) return null;
  
  // Check if this row is inside a nested table
  const nestedTable = parentRow.closest('table');
  if (!nestedTable) return null;
  
  // Find the outer row that contains this nested table
  const outerCell = nestedTable.closest('td');
  if (!outerCell) return null;
  
  const outerRow = outerCell.closest('tr');
  if (!outerRow) return null;
  
  // Get the main label from td.label in outer row
  const mainLabelCell = outerRow.querySelector('td.label');
  if (mainLabelCell) {
    const mainLabel = cleanLabelText(mainLabelCell.textContent || '');
    if (mainLabel) {
      labelParts.push(mainLabel);
    }
  }
  
  // Get the section label from the same row (e.g., td.weblinksTitle)
  const sectionCell = parentRow.querySelector('td.weblinksTitle, td[class*="Title"]');
  if (sectionCell) {
    // Get only direct text nodes, not link text
    const textNodes = Array.from(sectionCell.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent.trim())
      .filter(text => text && text !== ':')
      .join(' ');
    
    if (textNodes) {
      const sectionLabel = cleanLabelText(textNodes);
      if (sectionLabel) {
        labelParts.push(sectionLabel);
      }
    }
  }
  
  // Get adjacent text that describes this specific input
  const adjacentText = getAdjacentText(input);
  if (adjacentText) {
    labelParts.push(adjacentText);
  }
  
  return labelParts.length > 0 ? labelParts.join(' - ') : null;
}

// Get field label from parent table structure
export function getFieldLabel(input, config) {
  // Check if this element was matched by a custom selector
  const isCustomField = isElementMatchedByCustomSelector(input, config);

  if (isCustomField) {
    // For custom fields, use the new label detection logic
    const parent = input.parentElement;
    if (parent) {
      // Look for label element in parent
      const labelElement = parent.querySelector("label");
      if (labelElement) {
        const rawText =
          labelElement.innerHTML || labelElement.textContent || "";
        const cleanedText = cleanLabelText(rawText);
        return cleanedText || input.id || input.name || "Custom Field";
      }

      // Look for any element with class containing "label"
      const labelClassElement = parent.querySelector('*[class*="label"]');
      if (labelClassElement) {
        const rawText =
          labelClassElement.innerHTML || labelClassElement.textContent || "";
        const cleanedText = cleanLabelText(rawText);
        return cleanedText || input.id || input.name || "Custom Field";
      }
    }

    // Fallback to field's ID value for custom fields
    return input.id || input.name || "Custom Field";
  }

  // Priority 1: Check for direct <label for="input-id"> (most specific)
  if (input.id) {
    const parentCell = input.closest('td');
    if (parentCell) {
      const directLabel = parentCell.querySelector(`label[for="${input.id}"]`);
      if (directLabel) {
        const rawText = directLabel.innerHTML || directLabel.textContent || "";
        const cleanedText = cleanLabelText(rawText);
        if (cleanedText) {
          // Check if there's a parent row with td.label for context
          const parentRow = input.closest("tr");
          if (parentRow) {
            const labelCell = parentRow.querySelector("td.label");
            if (labelCell) {
              const parentLabelText = labelCell.innerHTML || labelCell.textContent || "";
              const cleanedParentLabel = cleanLabelText(parentLabelText);
              if (cleanedParentLabel) {
                // Combine parent label with direct label for better context
                return `${cleanedParentLabel} - ${cleanedText}`;
              }
            }
          }
          // No parent label found, return just the direct label
          return cleanedText;
        }
      }
    }
  }

  // Priority 2: Check for nested table structure (composite labels)
  const nestedLabel = getNestedTableLabel(input);
  if (nestedLabel) {
    return nestedLabel;
  }

  // Priority 3: Original logic - parent row's td.label
  const parentRow = input.closest("tr");
  if (parentRow) {
    const labelCell = parentRow.querySelector("td.label");
    if (labelCell) {
      const rawText = labelCell.innerHTML || labelCell.textContent || "";
      const cleanedText = cleanLabelText(rawText);
      
      // For simple cases (single input in cell), don't append field name
      const parentCell = input.closest('td');
      if (parentCell) {
        // Count how many non-hidden, non-file inputs are in this cell
        const inputsInCell = parentCell.querySelectorAll('input[name], select[name], textarea[name]');
        const visibleInputs = Array.from(inputsInCell).filter(inp => 
          inp.type !== 'hidden' && inp.type !== 'file'
        );
        
        // If only one visible input, use just the label
        if (visibleInputs.length === 1 && visibleInputs[0] === input) {
          return cleanedText || input.name;
        }
      }
      
      // Multiple inputs or other cases - append field name for clarity
      return cleanedText ? `${cleanedText} (${input.name})` : input.name;
    }
  }
  
  return input.name;
}

// Find form element by field name (supports both standard and custom fields)
export function findElementByFieldName(fieldName, config) {
  const formPrefix = config.TARGET_FORM_SELECTOR
    ? `${config.TARGET_FORM_SELECTOR} `
    : "";

  // Build the field selector with custom selectors
  // Include fields with either name or id attributes to support fields like Steam ID
  const defaultSelector = "input[name], input[id], select[name], select[id], textarea[name], textarea[id]";
  const customSelectors = config.CUSTOM_FIELD_SELECTORS || [];
  const fieldSelector =
    customSelectors.length > 0
      ? `${defaultSelector}, ${customSelectors.join(", ")}`
      : defaultSelector;

  const targetForm = config.TARGET_FORM_SELECTOR
    ? document.querySelector(config.TARGET_FORM_SELECTOR)
    : null;

  const inputs = targetForm
    ? targetForm.querySelectorAll(fieldSelector)
    : document.querySelectorAll(fieldSelector);

  // Find element that matches the fieldName using the same logic as getCurrentFormData
  for (const input of inputs) {
    // Exclude fields that are part of our own injected UI
    if (input.closest('#ggn-upload-templator-ui')) {
      continue; // Skip our own UI elements
    }

    const isCustomField = isElementMatchedByCustomSelector(input, config);

    // For standard fields, accept either name or id attribute
    const hasValidIdentifier = isCustomField
      ? input.name ||
        input.id ||
        input.getAttribute("data-field") ||
        input.getAttribute("data-name")
      : input.name || input.id;

    if (!hasValidIdentifier) continue;

    // Skip file, button, submit, hidden inputs for standard fields
    if (
      !isCustomField &&
      (input.type === "file" ||
        input.type === "button" ||
        input.type === "submit" ||
        input.type === "hidden")
    ) {
      continue;
    }

    // Get the field name/identifier using the same logic as getCurrentFormData
    const elementFieldName =
      input.name ||
      input.id ||
      input.getAttribute("data-field") ||
      input.getAttribute("data-name");

    if (elementFieldName === fieldName) {
      return input;
    }
  }

  return null;
}
