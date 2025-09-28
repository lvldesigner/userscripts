// src/templates.js
export const MODAL_HTML = (instance) => `
  <div class="gut-modal-content">
    <div class="gut-modal-tabs">
      <button class="gut-tab-btn active" data-tab="templates">Templates</button>
      <button class="gut-tab-btn" data-tab="settings">Settings</button>
    </div>

    <div class="gut-tab-content active" id="templates-tab">
      ${
        Object.keys(instance.templates).length === 0
          ? '<div style="padding: 20px; text-align: center; color: #888;">No templates found. Create a template first.</div>'
          : `<div class="gut-template-list">
            ${Object.keys(instance.templates)
              .map(
                (name) => `
                <div class="gut-template-item">
                  <span class="gut-template-name">${instance.escapeHtml(name)}</span>
                  <div class="gut-template-actions">
                    <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="edit" data-template="${instance.escapeHtml(name)}">Edit</button>
                    <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="clone" data-template="${instance.escapeHtml(name)}">Clone</button>
                    <button class="gut-btn gut-btn-danger gut-btn-small" data-action="delete" data-template="${instance.escapeHtml(name)}">Delete</button>
                  </div>
                </div>
              `,
              )
              .join("")}
          </div>`
      }
    </div>

    <div class="gut-tab-content" id="settings-tab">
      <div class="gut-form-group">
        <label for="setting-form-selector">Target Form Selector:</label>
        <input type="text" id="setting-form-selector" value="${instance.escapeHtml(instance.config.TARGET_FORM_SELECTOR)}" placeholder="#upload_table">
      </div>

      <div class="gut-form-group">
        <label class="gut-checkbox-label">
          <input type="checkbox" id="setting-submit-keybinding" ${instance.config.SUBMIT_KEYBINDING ? "checked" : ""}>
          <span class="gut-checkbox-text">⚡ Enable Ctrl+Enter form submission</span>
        </label>
      </div>

      <div class="gut-form-group">
        <label for="setting-custom-selectors">Custom Field Selectors (one per line):</label>
        <textarea id="setting-custom-selectors" rows="4" placeholder="div[data-field]\n.custom-input[name]\nbutton[data-value]">${(instance.config.CUSTOM_FIELD_SELECTORS || []).join("\n")}</textarea>
        <div style="font-size: 12px; color: #888; margin-top: 5px;">
          Additional CSS selectors to find form fields. e.g: <a href="#" id="ggn-infobox-link" class="gut-link">GGn Infobox</a>
        </div>
      </div>

      <div class="gut-form-group" id="custom-selectors-preview-group" style="display: none;">
        <label id="matched-elements-label">Matched Elements:</label>
        <div id="custom-selectors-matched" class="gut-extracted-vars">
          <div class="gut-no-variables">No elements matched by custom selectors.</div>
        </div>
      </div>

      <div class="gut-form-group">
        <label for="setting-ignored-fields">Ignored Fields (one per line):</label>
        <textarea id="setting-ignored-fields" rows="6" placeholder="linkgroup\ngroupid\napikey">${instance.config.IGNORED_FIELDS_BY_DEFAULT.join("\n")}</textarea>
      </div>

      <div class="gut-form-group">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 10px;">
            <button class="gut-btn gut-btn-primary" id="save-settings">Save Settings</button>
            <button class="gut-btn gut-btn-secondary" id="reset-settings">Reset to Defaults</button>
          </div>
          <button class="gut-btn gut-btn-danger" id="delete-all-config">Delete All Local Config</button>
        </div>
      </div>
    </div>

    <div class="gut-modal-actions">
      <button class="gut-btn" id="close-manager">Close</button>
    </div>
  </div>
`;

export const TEMPLATE_SELECTOR_HTML = (instance) => `
  <option value="">Select Template</option>
  ${Object.keys(instance.templates)
    .map(
      (name) =>
        `<option value="${name}" ${name === instance.selectedTemplate ? "selected" : ""}>${name}</option>`,
    )
    .join("")}
`;

 export const TEMPLATE_LIST_HTML = (instance) =>
   Object.keys(instance.templates).length === 0
     ? '<div style="padding: 20px; text-align: center; color: #888;">No templates found. Close this dialog and create a template first.</div>'
     : `<div class="gut-template-list">
         ${Object.keys(instance.templates)
           .map(
             (name) => `
             <div class="gut-template-item">
               <span class="gut-template-name">${instance.escapeHtml(name)}</span>
               <div class="gut-template-actions">
                 <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="edit" data-template="${instance.escapeHtml(name)}">Edit</button>
                 <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="clone" data-template="${instance.escapeHtml(name)}">Clone</button>
                 <button class="gut-btn gut-btn-danger gut-btn-small" data-action="delete" data-template="${instance.escapeHtml(name)}">Delete</button>
               </div>
             </div>
           `,
           )
           .join("")}
       </div>`;

export const TEMPLATE_CREATOR_HTML = (formData, instance, editTemplateName, editTemplate, selectedTorrentName) => `
  <div class="gut-modal-content">
    <h2>
      ${editTemplateName ? '<button class="gut-modal-back-btn" id="back-to-manager" title="Back to Template Manager">&lt;</button>' : ""}
      ${editTemplateName ? "Edit Template" : "Create Template"}
    </h2>

    <div class="gut-form-group">
      <label for="template-name">Template Name:</label>
      <input type="text" id="template-name" placeholder="e.g., Magazine Template" value="${editTemplateName ? instance.escapeHtml(editTemplateName) : ""}">
    </div>

    <div class="gut-form-group">
      <label for="sample-torrent">Sample Torrent Name (for preview):</label>
      <input type="text" id="sample-torrent" value="${instance.escapeHtml(selectedTorrentName)}" placeholder="e.g., PCWorld - Issue 05 - 01-2024.zip">
    </div>

    <div class="gut-form-group" style="margin-bottom: 8px;">
      <label for="torrent-mask">Torrent Name Mask:</label>
      <input type="text" id="torrent-mask" placeholder="e.g., \${magazine} - Issue \${issue} - \${month}-\${year}.\${ext}" value="${editTemplate ? instance.escapeHtml(editTemplate.mask) : ""}">
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
            const isIgnoredByDefault = instance.config.IGNORED_FIELDS_BY_DEFAULT.includes(name.toLowerCase());
            const isInTemplate = editTemplate && editTemplate.fieldMappings.hasOwnProperty(name);
            const templateValue = isInTemplate ? editTemplate.fieldMappings[name] : null;
            let shouldBeChecked = isInTemplate || !isIgnoredByDefault;
            if (editTemplate && editTemplate.customUnselectedFields) {
              const customField = editTemplate.customUnselectedFields.find((f) => f.field === name);
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
                        const hasVariableMatching = editTemplate && editTemplate.variableMatching && editTemplate.variableMatching[name];
                        const variableConfig = hasVariableMatching ? editTemplate.variableMatching[name] : null;
                        const isVariableMode = hasVariableMatching;

                        return `<div class="gut-select-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                          <div style="display: flex; align-items: center; gap: 8px;">
                            <select data-template="${name}" class="template-input gut-select select-static-mode" style="flex: 1; ${isVariableMode ? "display: none;" : ""}">
                              ${fieldData.options
                                .map((option) => {
                                  let selected = option.selected;
                                  if (templateValue && templateValue === option.value) {
                                    selected = true;
                                  }
                                  return `<option value="${instance.escapeHtml(option.value)}" ${selected ? "selected" : ""}>${instance.escapeHtml(option.text)}</option>`;
                                })
                                .join("")}
                            </select>
                            <a href="#" class="gut-link gut-variable-toggle" data-field="${name}" data-state="${isVariableMode ? "on" : "off"}">Match from variable: ${isVariableMode ? "ON" : "OFF"}</a>
                          </div>
                          <div class="gut-variable-controls" data-field="${name}" style="display: ${isVariableMode ? "flex" : "none"}; gap: 8px;">
                            <input type="text" class="gut-variable-input" data-field="${name}" placeholder="\${variable_name}" value="${variableConfig ? instance.escapeHtml(variableConfig.variableName) : ""}" style="flex: 1; padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #1a1a1a; color: #e0e0e0; font-size: 12px;">
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
                                if (templateValue && templateValue === option.value) {
                                  selected = true;
                                }
                                return `<option value="${instance.escapeHtml(option.value)}" ${selected ? "selected" : ""}>${instance.escapeHtml(option.label)}</option>`;
                              })
                              .join("")}
                          </select>`
                        : `<input type="text" value="${templateValue !== null ? instance.escapeHtml(String(templateValue)) : instance.escapeHtml(String(fieldData.value))}" data-template="${name}" class="template-input">`
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

export const MAIN_UI_HTML = (instance) => `
  <div class="ggn-upload-templator-controls" style="align-items: flex-end;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <label for="template-selector" style="font-size: 12px; color: #b0b0b0; margin: 0;">Select template</label>
        <a href="#" id="edit-selected-template-btn" class="gut-link" style="${instance.selectedTemplate && instance.selectedTemplate !== "none" && instance.templates[instance.selectedTemplate] ? "" : "display: none;"}">Edit</a>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <select id="template-selector" class="gut-select">
          <option value="">Select Template</option>
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
