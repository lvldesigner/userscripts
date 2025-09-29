import { getCurrentFormData } from "../utils/form.js";
import { TorrentUtils } from "../utils/torrent.js";
import {
  parseTemplate,
  interpolate,
  findMatchingOption,
  validateMaskVariables,
} from "../utils/template.js";
import { TEMPLATE_CREATOR_HTML, MAIN_UI_HTML, VARIABLES_MODAL_HTML } from "./template.js";

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
        commentVariables = TorrentUtils.parseCommentVariables(torrentData.comment);
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

  document.body.appendChild(modal);

  // Setup live preview
  const maskInput = modal.querySelector("#torrent-mask");
  const sampleInput = modal.querySelector("#sample-torrent");
  const templateInputs = modal.querySelectorAll(".template-input");

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

  const updatePreviews = () => {
    const mask = maskInput.value;
    const sample = sampleInput.value;
    const greedyMatching = modal.querySelector("#greedy-matching").checked;
    const saveButton = modal.querySelector("#save-template");
    
    const validation = validateMaskVariables(mask);
    const validationWarning = modal.querySelector("#mask-validation-warning");
    
    if (!validation.valid) {
      validationWarning.classList.add("visible");
      validationWarning.textContent = `Invalid variable names: ${validation.invalidVars.map(v => `\${${v}}`).join(', ')}. Variable names starting with "_" are reserved for comment variables.`;
      saveButton.disabled = true;
    } else {
      validationWarning.classList.remove("visible");
      saveButton.disabled = false;
    }
    
    const maskExtracted = parseTemplate(mask, sample, greedyMatching);

    // Merge comment variables first, then mask variables
    const allVariables = { ...commentVariables, ...maskExtracted };

    // Update extracted variables section
    const extractedVarsContainer = modal.querySelector("#extracted-variables");
    if (Object.keys(allVariables).length === 0) {
      extractedVarsContainer.innerHTML =
        '<div class="gut-no-variables">No variables defined yet. Add variables like ${name} to your mask.</div>';
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
    input.addEventListener("change", updatePreviews); // For select elements
  });

  // Initialize previews on modal open
  updatePreviews();

  // Update visibility when checkboxes change
  modal.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      if (e.target.id === "greedy-matching") {
        updatePreviews(); // Update previews when greedy matching changes
      } else {
        filterFields(); // Re-apply all visibility rules including filter
      }
    }
  });

  // Event handlers
  modal.querySelector("#cancel-template").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.querySelector("#save-template").addEventListener("click", () => {
    instance.saveTemplate(modal, editTemplateName);
  });

  // Close on background click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Close on Esc key
  const handleEscKey = (e) => {
    if (e.key === "Escape" && document.body.contains(modal)) {
      document.body.removeChild(modal);
      document.removeEventListener("keydown", handleEscKey);
    }
  };
  document.addEventListener("keydown", handleEscKey);

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
      document.body.removeChild(modal);
      instance.showTemplateAndSettingsManager();
    });
  }
}

export function showVariablesModal(instance, variables) {
  const modal = document.createElement("div");
  modal.className = "gut-modal";
  modal.innerHTML = VARIABLES_MODAL_HTML(variables);

  document.body.appendChild(modal);

  modal.querySelector("#close-variables-modal").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  const handleEscKey = (e) => {
    if (e.key === "Escape" && document.body.contains(modal)) {
      document.body.removeChild(modal);
      document.removeEventListener("keydown", handleEscKey);
    }
  };
  document.addEventListener("keydown", handleEscKey);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
