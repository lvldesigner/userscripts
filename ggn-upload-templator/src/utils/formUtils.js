// Get current form data
export function getCurrentFormData(config) {
  const formData = {};
  const formSelector = config.TARGET_FORM_SELECTOR || "form";
  const targetForm = document.querySelector(formSelector);

  // Build the field selector with custom selectors
  const defaultSelector = "input[name], select[name], textarea[name]";
  const customSelectors = config.CUSTOM_FIELD_SELECTORS || [];
  const fieldSelector =
    customSelectors.length > 0
      ? `${defaultSelector}, ${customSelectors.join(", ")}`
      : defaultSelector;

  const inputs = targetForm
    ? targetForm.querySelectorAll(fieldSelector)
    : document.querySelectorAll(fieldSelector);

  inputs.forEach((input) => {
    // Check if this is a custom field element
    const isCustomField = isElementMatchedByCustomSelector(input, config);

    // For custom fields, we need a different validation approach
    const hasValidIdentifier = isCustomField
      ? input.name ||
        input.id ||
        input.getAttribute("data-field") ||
        input.getAttribute("data-name")
      : input.name;

    // Skip invalid elements
    if (!hasValidIdentifier) return;

    // For standard form elements, apply the original filtering
    if (
      !isCustomField &&
      (input.type === "file" ||
        input.type === "button" ||
        input.type === "submit")
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

  // Remove all link tags completely (including their text content)
  const linkElements = tempElement.querySelectorAll("a");
  linkElements.forEach((link) => {
    link.remove();
  });

  // Get the cleaned text content
  let cleanedText = tempElement.textContent || tempElement.innerText || "";

  // Trim whitespace
  cleanedText = cleanedText.trim();

  // Remove trailing colon
  if (cleanedText.endsWith(":")) {
    cleanedText = cleanedText.slice(0, -1).trim();
  }

  return cleanedText;
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

  // Original logic for standard form elements
  // For radio buttons, look for associated label elements first
  if (input.type === "radio" && input.id) {
    const parentTd = input.closest("td");
    if (parentTd) {
      const associatedLabel = parentTd.querySelector(
        `label[for="${input.id}"]`,
      );
      if (associatedLabel) {
        const rawText =
          associatedLabel.innerHTML || associatedLabel.textContent || "";
        const cleanedText = cleanLabelText(rawText);
        return cleanedText || input.value;
      }
    }
  }

  const parentRow = input.closest("tr");
  if (parentRow) {
    const labelCell = parentRow.querySelector("td.label");
    if (labelCell) {
      const rawText = labelCell.innerHTML || labelCell.textContent || "";
      const cleanedText = cleanLabelText(rawText);
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
  const defaultSelector = "input[name], select[name], textarea[name]";
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
    const isCustomField = isElementMatchedByCustomSelector(input, config);

    const hasValidIdentifier = isCustomField
      ? input.name ||
        input.id ||
        input.getAttribute("data-field") ||
        input.getAttribute("data-name")
      : input.name;

    if (!hasValidIdentifier) continue;

    // Skip file, button, submit inputs for standard fields
    if (
      !isCustomField &&
      (input.type === "file" ||
        input.type === "button" ||
        input.type === "submit")
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