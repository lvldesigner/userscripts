import { getCurrentFormData } from "../utils/formUtils.js";
import { TorrentUtils } from "../utils/torrentUtils.js";
import {
  parseTemplate,
  interpolate,
  findMatchingOption,
} from "../utils/templateUtils.js";

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
  uiContainer.innerHTML = `
    <div class="ggn-upload-templator-controls" style="align-items: flex-end;">
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label for="template-selector" style="font-size: 12px; color: #b0b0b0; margin: 0;">Select template</label>
          <a href="#" id="edit-selected-template-btn" class="gut-link" style="${instance.selectedTemplate && instance.selectedTemplate !== "none" && instance.templates[instance.selectedTemplate] ? "" : "display: none;"}">Edit</a>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <select id="template-selector" class="gut-select">
            <option value="">Select Template</option>
            <option value="none" ${instance.selectedTemplate === "none" ? "selected" : ""}>None</option>
            ${Object.keys(instance.templates)
              .map(
                (name) =>
                  `<option value="${name}" ${name === instance.selectedTemplate ? "selected" : ""}>${name}</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>
      <button type="button" id="create-template-btn" class="gut-btn gut-btn-primary">+ Create Template</button>
      <button id="manage-templates-btn" type="button" class="gut-btn gut-btn-secondary" title="Manage Templates & Settings">Settings</button>
    </div>
  `;

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
        break;
      } catch (error) {
        console.warn("Could not parse selected torrent file:", error);
      }
    }
  }

  const modal = document.createElement("div");
  modal.className = "gut-modal";
  modal.innerHTML = `
    <div class="gut-modal-content">
      <h2>
        ${editTemplateName ? '<button class="gut-modal-back-btn" id="back-to-manager" title="Back to Template Manager">&lt;</button>' : ""}
        ${editTemplateName ? "Edit Template" : "Create Template"}
      </h2>

      <div class="gut-form-group">
        <label for="template-name">Template Name:</label>
        <input type="text" id="template-name" placeholder="e.g., Magazine Template" value="${editTemplateName ? escapeHtml(editTemplateName) : ""}">
      </div>

      <div class="gut-form-group">
        <label for="sample-torrent">Sample Torrent Name (for preview):</label>
        <input type="text" id="sample-torrent" value="${escapeHtml(selectedTorrentName)}" placeholder="e.g., PCWorld - Issue 05 - 01-2024.zip">
      </div>

      <div class="gut-form-group" style="margin-bottom: 8px;">
        <label for="torrent-mask">Torrent Name Mask:</label>
        <input type="text" id="torrent-mask" placeholder="e.g., \${magazine} - Issue \${issue} - \${month}-\${year}.\${ext}" value="${editTemplate ? escapeHtml(editTemplate.mask) : ""}">
      </div>

      <div class="gut-form-group">
        <label style="display: inline-flex; align-items: center; gap: 8px; margin: 0; font-size: 13px; color: #888888; font-weight: normal;" title="When enabled, patterns capture as much text as possible. When disabled, uses smart matching that's usually more precise.">
          <input type="checkbox" id="greedy-matching" ${editTemplate ? (editTemplate.greedyMatching !== false ? "checked" : "") : "checked"} style="margin: 0; accent-color: #0d7377; width: auto;">
          <span>Greedy matching</span>
        </label>
      </div>

      <div class="gut-form-group">
        <label>Extracted Variables:</label>
        <div id="extracted-variables" class="gut-extracted-vars">
          <div class="gut-no-variables">No variables defined yet. Add variables like \${name} to your mask.</div>
        </div>
      </div>

      <div class="gut-form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;">
          <label style="margin: 0;">Form Fields:</label>
          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="text" id="field-filter" placeholder="Filter fields..." style="padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #2a2a2a; color: #e0e0e0; font-size: 12px; min-width: 150px;">
            <button type="button" class="gut-btn gut-btn-secondary" id="toggle-unselected" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;">Show Unselected</button>
          </div>
        </div>
        <div class="gut-field-list">
          ${Object.entries(formData)
            .map(([name, fieldData]) => {
              const isIgnoredByDefault =
                instance.config.IGNORED_FIELDS_BY_DEFAULT.includes(
                  name.toLowerCase(),
                );

              // When editing, check if this field is in the template
              const isInTemplate =
                editTemplate && editTemplate.fieldMappings.hasOwnProperty(name);
              const templateValue = isInTemplate
                ? editTemplate.fieldMappings[name]
                : null;

              // Check if there's custom selection state for this field
              let shouldBeChecked = isInTemplate || !isIgnoredByDefault;
              if (editTemplate && editTemplate.customUnselectedFields) {
                const customField = editTemplate.customUnselectedFields.find(
                  (f) => f.field === name,
                );
                if (customField) {
                  shouldBeChecked = customField.selected;
                }
              }

              return `
                <div class="gut-field-row ${isIgnoredByDefault && !isInTemplate && !shouldBeChecked ? "gut-hidden" : ""}">
                  <input type="checkbox" ${shouldBeChecked ? "checked" : ""} data-field="${name}">
                  <label title="${name}">${fieldData.label}:</label>
                  ${
                    fieldData.type === "select"
                      ? (() => {
                          // Check if this field has variable matching configuration
                          const hasVariableMatching =
                            editTemplate &&
                            editTemplate.variableMatching &&
                            editTemplate.variableMatching[name];
                          const variableConfig = hasVariableMatching
                            ? editTemplate.variableMatching[name]
                            : null;
                          const isVariableMode = hasVariableMatching;

                          return `<div class="gut-select-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <select data-template="${name}" class="template-input gut-select select-static-mode" style="flex: 1; ${isVariableMode ? "display: none;" : ""}">
                              ${fieldData.options
                                .map((option) => {
                                  let selected = option.selected;
                                  if (
                                    templateValue &&
                                    templateValue === option.value
                                  ) {
                                    selected = true;
                                  }
                                  return `<option value="${escapeHtml(option.value)}" ${selected ? "selected" : ""}>${escapeHtml(option.text)}</option>`;
                                })
                                .join("")}
                            </select>
                            <a href="#" class="gut-link gut-variable-toggle" data-field="${name}" data-state="${isVariableMode ? "on" : "off"}">Match from variable: ${isVariableMode ? "ON" : "OFF"}</a>
                          </div>
                          <div class="gut-variable-controls" data-field="${name}" style="display: ${isVariableMode ? "flex" : "none"}; gap: 8px;">
                            <input type="text" class="gut-variable-input" data-field="${name}" placeholder="\${variable_name}" value="${variableConfig ? escapeHtml(variableConfig.variableName) : ""}" style="flex: 1; padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #1a1a1a; color: #e0e0e0; font-size: 12px;">
                            <select class="gut-match-type" data-field="${name}" style="padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #1a1a1a; color: #e0e0e0; font-size: 12px;">
                              <option value="exact" ${variableConfig && variableConfig.matchType === "exact" ? "selected" : ""}>Exact</option>
                              <option value="contains" ${variableConfig && variableConfig.matchType === "contains" ? "selected" : ""}>Contains</option>
                              <option value="starts" ${variableConfig && variableConfig.matchType === "starts" ? "selected" : ""}>Starts with</option>
                              <option value="ends" ${variableConfig && variableConfig.matchType === "ends" ? "selected" : ""}>Ends with</option>
                            </select>
                          </div>
                        </div>`;
                        })()
                      : fieldData.inputType === "checkbox"
                        ? `<input type="checkbox" ${templateValue !== null ? (templateValue ? "checked" : "") : fieldData.value ? "checked" : ""} data-template="${name}" class="template-input">`
                        : fieldData.inputType === "radio"
                          ? `<select data-template="${name}" class="template-input gut-select">
                          ${fieldData.radioOptions
                            .map((option) => {
                              let selected = option.checked;
                              if (
                                templateValue &&
                                templateValue === option.value
                              ) {
                                selected = true;
                              }
                              return `<option value="${escapeHtml(option.value)}" ${selected ? "selected" : ""}>${escapeHtml(option.label)}</option>`;
                            })
                            .join("")}
                        </select>`
                          : `<input type="text" value="${templateValue !== null ? escapeHtml(String(templateValue)) : escapeHtml(String(fieldData.value))}" data-template="${name}" class="template-input">`
                  }
                  <span class="gut-preview" data-preview="${name}"></span>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>

      <div class="gut-modal-actions">
        <button class="gut-btn" id="cancel-template">Cancel</button>
        <button class="gut-btn gut-btn-primary" id="save-template">${editTemplateName ? "Update Template" : "Save Template"}</button>
      </div>
    </div>
  `;

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
    const extracted = parseTemplate(mask, sample, greedyMatching);

    // Update extracted variables section
    const extractedVarsContainer = modal.querySelector("#extracted-variables");
    if (Object.keys(extracted).length === 0) {
      extractedVarsContainer.innerHTML =
        '<div class="gut-no-variables">No variables defined yet. Add variables like ${name} to your mask.</div>';
    } else {
      extractedVarsContainer.innerHTML = Object.entries(extracted)
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
            extracted[variableName.replace(/^\$\{|\}$/g, "")]
          ) {
            const variableValue =
              extracted[variableName.replace(/^\$\{|\}$/g, "")];
            const matchedOption = findMatchingOption(
              input.options,
              variableValue,
              matchType,
            );

            if (matchedOption) {
              preview.textContent = `→ "${matchedOption.text}" (matched "${variableValue}" using ${matchType})`;
              preview.className = "gut-preview active";
              preview.style.display = "block";
            } else {
              preview.textContent = `→ No match found for "${variableValue}" using ${matchType}`;
              preview.className = "gut-preview";
              preview.style.display = "block";
            }
          } else if (variableName) {
            preview.textContent = `→ Variable ${variableName} not found in extracted data`;
            preview.className = "gut-preview";
            preview.style.display = "block";
          } else {
            preview.textContent = "";
            preview.className = "gut-preview";
            preview.style.display = "none";
          }
        } else {
          // Static mode - show selected option
          const selectedOption = Array.from(input.options).find(
            (option) => option.selected,
          );
          if (selectedOption) {
            preview.textContent = `→ "${selectedOption.text}"`;
            preview.className = "gut-preview active";
            preview.style.display = "block";
          } else {
            preview.textContent = "";
            preview.className = "gut-preview";
            preview.style.display = "none";
          }
        }
      } else {
        const inputValue = input.value || "";
        const interpolated = interpolate(inputValue, extracted);

        if (inputValue.includes("${") && Object.keys(extracted).length > 0) {
          preview.textContent = `→ ${interpolated}`;
          preview.className = "gut-preview active";
          preview.style.display = "block";
        } else {
          preview.textContent = "";
          preview.className = "gut-preview";
          preview.style.display = "none";
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
        staticSelect.style.display = "none";
        variableControls.style.display = "flex";
      } else {
        staticSelect.style.display = "block";
        variableControls.style.display = "none";
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

// Helper function for escaping HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
