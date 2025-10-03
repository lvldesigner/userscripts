import { getCurrentFormData } from "../utils/form.js";
import { TorrentUtils } from "../utils/torrent.js";
import {
  parseTemplateWithOptionals,
  interpolate,
  findMatchingOption,
  validateMaskVariables,
  validateMaskWithDetails,
  testMaskAgainstSamples,
} from "../utils/template.js";
import {
  updateMaskHighlighting,
  renderStatusMessages,
} from "../utils/highlighting.js";
import {
  TEMPLATE_CREATOR_HTML,
  MAIN_UI_HTML,
  VARIABLES_MODAL_HTML,
} from "./template.js";
import { ModalStack } from "../modal-stack.js";

// Reusable mask validation and cursor info setup
export function setupMaskValidation(maskInput, cursorInfoElement, statusContainer, overlayElement, onValidationChange = null, availableHints = {}) {
  let autocompleteDropdown = null;
  let selectedIndex = -1;
  let filteredHints = [];
  
  const closeAutocomplete = () => {
    if (autocompleteDropdown) {
      autocompleteDropdown.remove();
      autocompleteDropdown = null;
      selectedIndex = -1;
      filteredHints = [];
      // Pop the escape handler when closing autocomplete
      ModalStack.popEscapeHandler();
    }
  };
  
  const showAutocomplete = (hints, cursorPos) => {
    closeAutocomplete();
    
    if (hints.length === 0) return;
    
    filteredHints = hints;
    selectedIndex = 0;
    
    autocompleteDropdown = document.createElement("div");
    autocompleteDropdown.className = "gut-hint-autocomplete";
    
    const rect = maskInput.getBoundingClientRect();
    const inputContainer = maskInput.parentElement;
    const containerRect = inputContainer.getBoundingClientRect();
    
    autocompleteDropdown.style.position = "absolute";
    autocompleteDropdown.style.top = `${rect.bottom - containerRect.top + 2}px`;
    autocompleteDropdown.style.left = `${rect.left - containerRect.left}px`;
    autocompleteDropdown.style.minWidth = `${rect.width}px`;
    
    hints.forEach((hint, index) => {
      const item = document.createElement("div");
      item.className = "gut-hint-autocomplete-item";
      if (index === 0) item.classList.add("selected");
      
      item.innerHTML = `
        <div class="gut-hint-autocomplete-name">${escapeHtml(hint.name)}</div>
        <div class="gut-hint-autocomplete-type">${hint.type}</div>
        <div class="gut-hint-autocomplete-desc">${escapeHtml(hint.description || '')}</div>
      `;
      
      item.addEventListener("mouseenter", () => {
        autocompleteDropdown.querySelectorAll(".gut-hint-autocomplete-item").forEach(i => i.classList.remove("selected"));
        item.classList.add("selected");
        selectedIndex = index;
      });
      
      item.addEventListener("click", () => {
        insertHint(hint.name);
        closeAutocomplete();
      });
      
      autocompleteDropdown.appendChild(item);
    });
    
    inputContainer.style.position = "relative";
    inputContainer.appendChild(autocompleteDropdown);
    
    // Push escape handler to prevent closing the modal when autocomplete is visible
    ModalStack.pushEscapeHandler(() => {
      closeAutocomplete();
      return true; // Handled the escape
    });
  };
  
  const insertHint = (hintName) => {
    const value = maskInput.value;
    const cursorPos = maskInput.selectionStart;
    const beforeCursor = value.substring(0, cursorPos);
    const afterCursor = value.substring(cursorPos);
    
    const match = beforeCursor.match(/\$\{([a-zA-Z0-9_]+):([a-zA-Z0-9_]*)$/);
    if (match) {
      const [fullMatch, varName, partialHint] = match;
      const newValue = beforeCursor.substring(0, beforeCursor.length - partialHint.length) + hintName + afterCursor;
      maskInput.value = newValue;
      maskInput.selectionStart = maskInput.selectionEnd = cursorPos - partialHint.length + hintName.length;
      maskInput.dispatchEvent(new Event('input'));
    }
  };
  
  const updateAutocomplete = () => {
    const cursorPos = maskInput.selectionStart;
    const value = maskInput.value;
    const beforeCursor = value.substring(0, cursorPos);
    
    const match = beforeCursor.match(/\$\{([a-zA-Z0-9_]+):([a-zA-Z0-9_]*)$/);
    
    if (match) {
      const [, varName, partialHint] = match;
      
      const hints = Object.entries(availableHints)
        .filter(([name]) => name.toLowerCase().startsWith(partialHint.toLowerCase()))
        .map(([name, hint]) => ({
          name,
          type: hint.type,
          description: hint.description || ''
        }))
        .slice(0, 10);
      
      if (hints.length > 0) {
        showAutocomplete(hints, cursorPos);
      } else {
        closeAutocomplete();
      }
    } else {
      closeAutocomplete();
    }
  };
  
  const handleKeyDown = (e) => {
    if (!autocompleteDropdown) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredHints.length - 1);
      updateSelection();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < filteredHints.length) {
        e.preventDefault();
        insertHint(filteredHints[selectedIndex].name);
        closeAutocomplete();
      }
    } else if (e.key === "Escape") {
      // Escape handling is now managed by the escape handler stack
      return;
    } else if (e.key === "Tab") {
      if (selectedIndex >= 0 && selectedIndex < filteredHints.length) {
        e.preventDefault();
        insertHint(filteredHints[selectedIndex].name);
        closeAutocomplete();
      }
    }
  };
  
  const updateSelection = () => {
    if (!autocompleteDropdown) return;
    
    const items = autocompleteDropdown.querySelectorAll(".gut-hint-autocomplete-item");
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add("selected");
        item.scrollIntoView({ block: "nearest" });
      } else {
        item.classList.remove("selected");
      }
    });
  };
  
  const updateCursorInfo = (validation) => {
    if (!validation || validation.errors.length === 0) {
      cursorInfoElement.textContent = "";
      cursorInfoElement.style.display = "none";
      return;
    }

    const firstError = validation.errors[0];
    const errorPos =
      firstError.position !== undefined ? firstError.position : null;

    if (errorPos === null) {
      cursorInfoElement.textContent = "";
      cursorInfoElement.style.display = "none";
      return;
    }

    const pos = maskInput.selectionStart;
    const maskValue = maskInput.value;

    cursorInfoElement.style.display = "block";

    const errorRangeEnd =
      firstError.rangeEnd !== undefined ? firstError.rangeEnd : errorPos + 1;

    if (pos >= errorPos && pos < errorRangeEnd) {
      const charAtError =
        errorPos < maskValue.length ? maskValue[errorPos] : "";
      cursorInfoElement.innerHTML = `<span style="color: #f44336;">⚠ Error at position ${errorPos}${charAtError ? ` ('${escapeHtml(charAtError)}')` : " (end)"}</span>`;
    } else {
      const charAtPos =
        pos !== null && pos < maskValue.length ? maskValue[pos] : "";
      const charAtError =
        errorPos < maskValue.length ? maskValue[errorPos] : "";
      cursorInfoElement.innerHTML = `Cursor: ${pos}${charAtPos ? ` ('${escapeHtml(charAtPos)}')` : " (end)"} | <span style="color: #f44336;">Error: ${errorPos}${charAtError ? ` ('${escapeHtml(charAtError)}')` : " (end)"}</span>`;
    }
  };

  const performValidation = () => {
    const validation = validateMaskWithDetails(maskInput.value, availableHints);
    updateMaskHighlighting(maskInput, overlayElement);
    renderStatusMessages(statusContainer, validation);
    updateCursorInfo(validation);
    updateAutocomplete();
    
    if (onValidationChange) {
      onValidationChange(validation);
    }
    
    return validation;
  };

  // Set up event listeners
  maskInput.addEventListener("input", performValidation);
  maskInput.addEventListener("click", () => {
    const validation = validateMaskWithDetails(maskInput.value, availableHints);
    updateCursorInfo(validation);
    updateAutocomplete();
  });
  maskInput.addEventListener("keyup", (e) => {
    if (!["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab"].includes(e.key)) {
      const validation = validateMaskWithDetails(maskInput.value, availableHints);
      updateCursorInfo(validation);
      updateAutocomplete();
    }
  });
  maskInput.addEventListener("keydown", handleKeyDown);
  maskInput.addEventListener("focus", () => {
    const validation = validateMaskWithDetails(maskInput.value, availableHints);
    updateCursorInfo(validation);
    updateAutocomplete();
  });
  maskInput.addEventListener("blur", () => {
    setTimeout(closeAutocomplete, 200);
  });

  // Return the validation function for initial setup
  return performValidation;
}

// Create and inject UI elements
export function injectUI(instance) {
  // Always find the first file input on the page for UI injection
  const fileInput = document.querySelector('input[type="file"]');
  if (!fileInput) {
    console.warn("No file input found on page, UI injection aborted");
    return;
  }

  // Check if UI already exists
  const existingUI = document.getElementById("ggn-upload-templator-ui");
  if (existingUI) {
    existingUI.remove();
  }

  // Create UI container
  const uiContainer = document.createElement("div");
  uiContainer.id = "ggn-upload-templator-ui";
  uiContainer.innerHTML = MAIN_UI_HTML(instance);

  try {
    fileInput.parentNode.insertBefore(uiContainer, fileInput);
  } catch (error) {
    console.error("Failed to insert UI container:", error);
    return;
  }

  // Bind events
  try {
    const createBtn = document.getElementById("create-template-btn");
    const templateSelector = document.getElementById("template-selector");
    const manageBtn = document.getElementById("manage-templates-btn");
    const editBtn = document.getElementById("edit-selected-template-btn");
    const applyBtn = document.getElementById("apply-template-btn");

    if (createBtn) {
      createBtn.addEventListener(
        "click",
        async () => await instance.showTemplateCreator(),
      );
    }

    if (templateSelector) {
      templateSelector.addEventListener("change", (e) =>
        instance.selectTemplate(e.target.value),
      );
    }

    if (manageBtn) {
      manageBtn.addEventListener("click", () =>
        instance.showTemplateAndSettingsManager(),
      );
    }

    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.preventDefault();
        instance.editTemplate(instance.selectedTemplate);
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", () =>
        instance.applyTemplateToCurrentTorrent(),
      );
    }

    const variablesRow = document.getElementById("variables-row");
    if (variablesRow) {
      variablesRow.addEventListener("click", () => {
        instance.showVariablesModal();
      });
    }
  } catch (error) {
    console.error("Failed to bind UI events:", error);
  }
}

// Show template creation modal
export async function showTemplateCreator(
  instance,
  editTemplateName = null,
  editTemplate = null,
) {
  const formData = getCurrentFormData(instance.config);

  if (Object.keys(formData).length === 0) {
    alert("No form fields found on this page.");
    return;
  }

  // Check if there's already a torrent file selected and parse it
  let selectedTorrentName = "";
  let commentVariables = {};
  const fileInputs = instance.config.TARGET_FORM_SELECTOR
    ? document.querySelectorAll(
        `${instance.config.TARGET_FORM_SELECTOR} input[type="file"]`,
      )
    : document.querySelectorAll('input[type="file"]');

  for (const input of fileInputs) {
    if (
      input.files &&
      input.files[0] &&
      input.files[0].name.toLowerCase().endsWith(".torrent")
    ) {
      try {
        const torrentData = await TorrentUtils.parseTorrentFile(input.files[0]);
        selectedTorrentName = torrentData.name || "";
        commentVariables = TorrentUtils.parseCommentVariables(
          torrentData.comment,
        );
        break;
      } catch (error) {
        console.warn("Could not parse selected torrent file:", error);
      }
    }
  }

  const modal = document.createElement("div");
  modal.className = "gut-modal";
  modal.innerHTML = TEMPLATE_CREATOR_HTML(
    formData,
    instance,
    editTemplateName,
    editTemplate,
    selectedTorrentName,
  );

  const canGoBack = editTemplateName !== null;
  
  ModalStack.replace(modal, {
    type: 'replace',
    canGoBack: canGoBack,
    backFactory: canGoBack ? () => instance.showTemplateAndSettingsManager() : null,
    metadata: { instance, editTemplateName, editTemplate }
  });

  // Setup live preview
  const maskInput = modal.querySelector("#torrent-mask");
  const sampleInput = modal.querySelector("#sample-torrent");
  const templateInputs = modal.querySelectorAll(".template-input");
  const cursorInfo = modal.querySelector("#mask-cursor-info");

  // Toggle unselected fields visibility
  const toggleBtn = modal.querySelector("#toggle-unselected");
  const filterInput = modal.querySelector("#field-filter");

  // Field filtering functionality
  const filterFields = () => {
    const filterValue = filterInput.value.toLowerCase();
    const fieldRows = modal.querySelectorAll(".gut-field-row");
    const fieldList = modal.querySelector(".gut-field-list");
    let visibleCount = 0;

    // Remove existing no-results message
    const existingMessage = fieldList.querySelector(".gut-no-results");
    if (existingMessage) {
      existingMessage.remove();
    }

    fieldRows.forEach((row) => {
      const checkbox = row.querySelector('input[type="checkbox"]');
      const label = row.querySelector("label");
      const fieldName = checkbox.dataset.field.toLowerCase();
      const labelText = label.textContent.toLowerCase();

      // Check if field matches filter (substring search on field name and label)
      const matchesFilter =
        !filterValue ||
        fieldName.includes(filterValue) ||
        labelText.includes(filterValue);

      // Apply visibility rules: filter + unselected visibility
      const shouldShowBasedOnSelection =
        checkbox.checked || !instance.hideUnselectedFields;
      const shouldShow = matchesFilter && shouldShowBasedOnSelection;

      if (shouldShow) {
        row.classList.remove("gut-hidden");
        visibleCount++;
      } else {
        row.classList.add("gut-hidden");
      }
    });

    // Show no results message if filter is active and no fields are visible
    if (filterValue && visibleCount === 0) {
      const noResultsMessage = document.createElement("div");
      noResultsMessage.className = "gut-no-results";
      noResultsMessage.style.cssText =
        "padding: 20px; text-align: center; color: #888; font-style: italic;";
      noResultsMessage.textContent = `No fields found matching "${filterValue}"`;
      fieldList.appendChild(noResultsMessage);
    }
  };

  const toggleUnselectedFields = () => {
    instance.hideUnselectedFields = !instance.hideUnselectedFields;
    localStorage.setItem(
      "ggn-upload-templator-hide-unselected",
      JSON.stringify(instance.hideUnselectedFields),
    );

    toggleBtn.textContent = instance.hideUnselectedFields
      ? "Show Unselected"
      : "Hide Unselected";

    // Re-apply filter which will handle all visibility logic
    filterFields();
  };

  // Initialize button text and field visibility based on current state
  toggleBtn.textContent = instance.hideUnselectedFields
    ? "Show Unselected"
    : "Hide Unselected";

  // Apply initial visibility state
  filterFields();

  toggleBtn.addEventListener("click", toggleUnselectedFields);
  filterInput.addEventListener("input", filterFields);

  // Setup mask validation with cursor info
  const overlayDiv = modal.querySelector("#mask-highlight-overlay");
  const statusContainer = modal.querySelector("#mask-status-container");
  const saveButton = modal.querySelector("#save-template");
  
  const performValidation = setupMaskValidation(
    maskInput,
    cursorInfo,
    statusContainer,
    overlayDiv,
    (validation) => {
      saveButton.disabled = !validation.valid;
      updatePreviews();
    },
    instance.hints
  );

  const updatePreviews = () => {
    const mask = maskInput.value;
    const sample = sampleInput.value;

    const validation = validateMaskWithDetails(mask, instance.hints);

    const parseResult = parseTemplateWithOptionals(mask, sample, instance.hints);
    const maskExtracted = { ...parseResult };
    delete maskExtracted._matchedOptionals;
    delete maskExtracted._optionalCount;

    const allVariables = { ...commentVariables, ...maskExtracted };

    const extractedVarsContainer = modal.querySelector("#extracted-variables");
    if (Object.keys(allVariables).length === 0) {
      const hasMaskVariables =
        validation.variables.valid.length > 0 ||
        validation.variables.reserved.length > 0;

      if (hasMaskVariables) {
        extractedVarsContainer.innerHTML =
          '<div class="gut-no-variables">Select a torrent file or provide a sample torrent name to extract variables.</div>';
      } else {
        extractedVarsContainer.innerHTML =
          '<div class="gut-no-variables">No variables defined yet. Add variables like ${name} to your mask.</div>';
      }
    } else {
      extractedVarsContainer.innerHTML = Object.entries(allVariables)
        .map(
          ([varName, varValue]) => `
            <div class="gut-variable-item">
              <span class="gut-variable-name">\${${escapeHtml(varName)}}</span>
              <span class="gut-variable-value ${varValue ? "" : "empty"}">${varValue ? escapeHtml(varValue) : "(empty)"}</span>
            </div>
          `,
        )
        .join("");
    }

    if (parseResult._matchedOptionals && parseResult._optionalCount) {
      const matchCount = parseResult._matchedOptionals.filter((x) => x).length;
      const optionalInfo = document.createElement("div");
      optionalInfo.className = "gut-variable-item";
      optionalInfo.style.cssText =
        "background: #2a4a3a; border-left: 3px solid #4caf50;";
      optionalInfo.innerHTML = `
        <span class="gut-variable-name" style="color: #4caf50;">Optional blocks</span>
        <span class="gut-variable-value">Matched ${matchCount}/${parseResult._optionalCount}</span>
      `;
      extractedVarsContainer.appendChild(optionalInfo);
    }

    templateInputs.forEach((input) => {
      const fieldName = input.dataset.template;
      const preview = modal.querySelector(`[data-preview="${fieldName}"]`);

      if (input.type === "checkbox") {
        preview.textContent = input.checked ? "✓ checked" : "✗ unchecked";
        preview.className = "gut-preview";
      } else if (input.tagName.toLowerCase() === "select") {
        // Check if this select field is in variable mode
        const variableToggle = modal.querySelector(
          `.gut-variable-toggle[data-field="${fieldName}"]`,
        );
        const isVariableMode =
          variableToggle && variableToggle.dataset.state === "on";

        if (isVariableMode) {
          // Handle variable matching for select fields
          const variableInput = modal.querySelector(
            `.gut-variable-input[data-field="${fieldName}"]`,
          );
          const matchTypeSelect = modal.querySelector(
            `.gut-match-type[data-field="${fieldName}"]`,
          );
          const variableName = variableInput ? variableInput.value.trim() : "";
          const matchType = matchTypeSelect ? matchTypeSelect.value : "exact";

          if (
            variableName &&
            allVariables[variableName.replace(/^\$\{|\}$/g, "")]
          ) {
            const variableValue =
              allVariables[variableName.replace(/^\$\{|\}$/g, "")];
            const matchedOption = findMatchingOption(
              input.options,
              variableValue,
              matchType,
            );

            if (matchedOption) {
              preview.textContent = `→ "${matchedOption.text}" (matched "${variableValue}" using ${matchType})`;
              preview.className = "gut-preview active visible";
            } else {
              preview.textContent = `→ No match found for "${variableValue}" using ${matchType}`;
              preview.className = "gut-preview visible";
            }
          } else if (variableName) {
            preview.textContent = `→ Variable ${variableName} not found in extracted data`;
            preview.className = "gut-preview visible";
          } else {
            preview.textContent = "";
            preview.className = "gut-preview";
          }
        } else {
          preview.textContent = "";
          preview.className = "gut-preview";
        }
      } else {
        const inputValue = input.value || "";
        const interpolated = interpolate(inputValue, allVariables);

        if (inputValue.includes("${") && Object.keys(allVariables).length > 0) {
          preview.textContent = `→ ${interpolated}`;
          preview.className = "gut-preview active visible";
        } else {
          preview.textContent = "";
          preview.className = "gut-preview";
        }
      }
    });
  };

  [maskInput, sampleInput, ...templateInputs].forEach((input) => {
    input.addEventListener("input", updatePreviews);
    input.addEventListener("change", updatePreviews);
  });

  maskInput.addEventListener("scroll", () => {
    const overlayDiv = modal.querySelector("#mask-highlight-overlay");
    if (overlayDiv) {
      overlayDiv.scrollTop = maskInput.scrollTop;
      overlayDiv.scrollLeft = maskInput.scrollLeft;
    }
  });

  // Initial validation and preview
  performValidation();
  updatePreviews();

  // Update visibility when checkboxes change
  modal.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      filterFields();
    }
  });

  // Event handlers
  modal.querySelector("#cancel-template").addEventListener("click", () => {
    if (canGoBack) {
      ModalStack.back();
    } else {
      ModalStack.pop();
    }
  });

  const closeX = modal.querySelector("#modal-close-x");
  if (closeX) {
    closeX.addEventListener("click", () => {
      if (canGoBack) {
        ModalStack.back();
      } else {
        ModalStack.pop();
      }
    });
  }

  modal.querySelector("#save-template").addEventListener("click", () => {
    instance.saveTemplate(modal, editTemplateName);
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      if (canGoBack) {
        ModalStack.back();
      } else {
        ModalStack.pop();
      }
    }
  });

  // Variable toggle event handlers
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("gut-variable-toggle")) {
      e.preventDefault();
      const fieldName = e.target.dataset.field;
      const currentState = e.target.dataset.state;
      const newState = currentState === "off" ? "on" : "off";

      // Update toggle state and text
      e.target.dataset.state = newState;
      e.target.textContent = `Match from variable: ${newState.toUpperCase()}`;

      // Toggle visibility of controls
      const staticSelect = modal.querySelector(
        `select.select-static-mode[data-template="${fieldName}"]`,
      );
      const variableControls = modal.querySelector(
        `.gut-variable-controls[data-field="${fieldName}"]`,
      );

      if (newState === "on") {
        staticSelect.classList.add("hidden");
        variableControls.classList.add("visible");
      } else {
        staticSelect.classList.remove("hidden");
        variableControls.classList.remove("visible");
      }

      // Trigger preview update
      updatePreviews();
    }
  });

  // Add event listeners for variable inputs to trigger preview updates
  const variableInputs = modal.querySelectorAll(
    ".gut-variable-input, .gut-match-type",
  );
  variableInputs.forEach((input) => {
    input.addEventListener("input", updatePreviews);
    input.addEventListener("change", updatePreviews);
  });

  // Back to template manager button
  const backBtn = modal.querySelector("#back-to-manager");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      ModalStack.back();
    });
  }

  // Test mask in sandbox link
  const sandboxLink = modal.querySelector("#test-mask-sandbox-link");
  if (sandboxLink) {
    sandboxLink.addEventListener("click", (e) => {
      e.preventDefault();
      const mask = maskInput.value;
      const sample = sampleInput.value;
      ModalStack.pop();
      instance.showSandboxWithMask(mask, sample);
    });
  }
}

export function showVariablesModal(instance, variables) {
  const modal = document.createElement("div");
  modal.className = "gut-modal";
  modal.innerHTML = VARIABLES_MODAL_HTML(variables);

  ModalStack.push(modal, {
    type: 'stack',
    metadata: { instance, variables }
  });

  modal
    .querySelector("#close-variables-modal")
    .addEventListener("click", () => {
      ModalStack.pop();
    });

  const closeX = modal.querySelector("#modal-close-x");
  if (closeX) {
    closeX.addEventListener("click", () => {
      ModalStack.pop();
    });
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      ModalStack.pop();
    }
  });
}

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function renderSandboxResults(modal, testResults) {
  const resultsContainer = modal.querySelector("#sandbox-results");
  const resultsLabel = modal.querySelector("#sandbox-results-label");

  if (!resultsContainer || !testResults || testResults.results.length === 0) {
    resultsContainer.innerHTML =
      '<div class="gut-no-variables">Enter a mask and sample names to see match results.</div>';
    resultsLabel.textContent = "Match Results:";
    return;
  }

  const matchCount = testResults.results.filter((r) => r.matched).length;
  const totalCount = testResults.results.length;
  resultsLabel.textContent = `Match Results (${matchCount}/${totalCount} matched):`;

  const html = testResults.results
    .map((result, resultIndex) => {
      const isMatch = result.matched;
      const icon = isMatch ? "✓" : "✗";
      const className = isMatch ? "gut-sandbox-match" : "gut-sandbox-no-match";

      let variablesHtml = "";
      if (isMatch && Object.keys(result.variables).length > 0) {
        variablesHtml =
          '<div class="gut-sandbox-variables" style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px;">' +
          Object.entries(result.variables)
            .filter(([key]) => key !== '_matchedOptionals' && key !== '_optionalCount')
            .map(
              ([key, value]) =>
                `<div class="gut-variable-item" style="margin: 0; flex: 0 0 auto; cursor: pointer;" data-result-index="${resultIndex}" data-var-name="${escapeHtml(key)}">
            <span class="gut-variable-name">\${${escapeHtml(key)}}</span><span style="display: inline-block; color: #898989; margin: 0 8px;"> = </span><span class="gut-variable-value">${value ? escapeHtml(value) : "(empty)"}</span>
          </div>`,
            )
            .join("") +
          "</div>";

        if (result.optionalInfo) {
          variablesHtml += `<div style="margin-top: 8px; font-size: 11px; color: #4caf50;">
          Optional blocks: ${result.optionalInfo.matched}/${result.optionalInfo.total} matched
        </div>`;
        }
      }

      return `
      <div class="${className}" style="margin-bottom: 12px; padding: 8px; background: #1e1e1e; border-left: 3px solid ${isMatch ? "#4caf50" : "#f44336"}; border-radius: 4px;" data-result-index="${resultIndex}">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px; color: ${isMatch ? "#4caf50" : "#f44336"};">${icon}</span>
          <span class="gut-sandbox-sample-name" style="flex: 1; font-family: 'Fira Code', monospace; font-size: 13px;" data-result-index="${resultIndex}">${escapeHtml(result.name)}</span>
        </div>
        ${variablesHtml}
      </div>
    `;
    })
    .join("");

  resultsContainer.innerHTML = html;
  
  resultsContainer._testResults = testResults;

  if (!resultsContainer._hasEventListeners) {
    resultsContainer.addEventListener(
      "mouseenter",
      (e) => {
        if (e.target.classList.contains("gut-variable-item")) {
          const resultIndex = parseInt(e.target.dataset.resultIndex);
          const varName = e.target.dataset.varName;
          const currentResults = resultsContainer._testResults;
          
          if (!currentResults || !currentResults.results[resultIndex]) {
            return;
          }
          
          const result = currentResults.results[resultIndex];

          if (result.positions && result.positions[varName]) {
            const sampleNameEl = resultsContainer.querySelector(
              `.gut-sandbox-sample-name[data-result-index="${resultIndex}"]`,
            );
            const pos = result.positions[varName];
            const name = result.name;
            const before = escapeHtml(name.substring(0, pos.start));
            const highlight = escapeHtml(name.substring(pos.start, pos.end));
            const after = escapeHtml(name.substring(pos.end));

            sampleNameEl.innerHTML = `${before}<span style="background: #bb86fc; color: #000; padding: 2px 4px; border-radius: 2px;">${highlight}</span>${after}`;
          }
        }
      },
      true,
    );

    resultsContainer.addEventListener(
      "mouseleave",
      (e) => {
        if (e.target.classList.contains("gut-variable-item")) {
          const resultIndex = parseInt(e.target.dataset.resultIndex);
          const currentResults = resultsContainer._testResults;
          
          if (!currentResults || !currentResults.results[resultIndex]) {
            return;
          }
          
          const result = currentResults.results[resultIndex];
          const sampleNameEl = resultsContainer.querySelector(
            `.gut-sandbox-sample-name[data-result-index="${resultIndex}"]`,
          );
          sampleNameEl.textContent = result.name;
        }
      },
      true,
    );
    
    resultsContainer._hasEventListeners = true;
  }
}
