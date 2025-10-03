// src/templates.js
export const MODAL_HTML = (instance) => `
  <div class="gut-modal-content">
    <div class="gut-modal-header">
      <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
      <div class="gut-modal-tabs">
        <button class="gut-tab-btn active" data-tab="templates">Templates</button>
        <button class="gut-tab-btn" data-tab="hints">Variable Hints</button>
        <button class="gut-tab-btn" data-tab="sandbox">Mask Sandbox</button>
        <button class="gut-tab-btn" data-tab="settings">Settings</button>
      </div>
    </div>

    <div class="gut-modal-body">
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
         <div class="gut-keybinding-controls">
           <label class="gut-checkbox-label">
             <input type="checkbox" id="setting-submit-keybinding" ${instance.config.SUBMIT_KEYBINDING ? "checked" : ""}>
             <span class="gut-checkbox-text">⚡ Enable form submission keybinding: <span class="gut-keybinding-text">${instance.config.CUSTOM_SUBMIT_KEYBINDING || "Ctrl+Enter"}</span></span>
           </label>
           <button type="button" id="record-submit-keybinding-btn" class="gut-btn gut-btn-secondary gut-btn-small">Record</button>
         </div>
         <input type="hidden" id="custom-submit-keybinding-input" value="${instance.config.CUSTOM_SUBMIT_KEYBINDING || "Ctrl+Enter"}">
       </div>

       <div class="gut-form-group">
         <div class="gut-keybinding-controls">
           <label class="gut-checkbox-label">
             <input type="checkbox" id="setting-apply-keybinding" ${instance.config.APPLY_KEYBINDING ? "checked" : ""}>
             <span class="gut-checkbox-text">⚡ Enable apply template keybinding: <span class="gut-keybinding-text">${instance.config.CUSTOM_APPLY_KEYBINDING || "Ctrl+Shift+A"}</span></span>
           </label>
           <button type="button" id="record-apply-keybinding-btn" class="gut-btn gut-btn-secondary gut-btn-small">Record</button>
         </div>
         <input type="hidden" id="custom-apply-keybinding-input" value="${instance.config.CUSTOM_APPLY_KEYBINDING || "Ctrl+Shift+A"}">
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

    ${HINTS_TAB_HTML(instance)}

    ${SANDBOX_TAB_HTML(instance)}
    </div>

    <div class="gut-modal-footer">
      <button class="gut-btn" id="close-manager">Close</button>
    </div>
  </div>
`;

export const VARIABLES_MODAL_HTML = (variables) => `
  <div class="gut-modal-content">
    <div class="gut-modal-header">
      <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
      <h2>Available Variables</h2>
    </div>

    <div class="gut-modal-body">
      <div class="gut-form-group">
        <div class="gut-extracted-vars">
        ${
          Object.keys(variables).length === 0
            ? '<div class="gut-no-variables">No variables available. Select a template with a torrent name mask to see extracted variables.</div>'
            : Object.entries(variables)
                .map(
                  ([name, value]) => `
                  <div class="gut-variable-item">
                    <span class="gut-variable-name">\${${name}}</span>
                    <span class="gut-variable-value">${value || '<em style="color: #666;">empty</em>'}</span>
                  </div>
                `,
                )
                .join("")
        }
      </div>
    </div>
    </div>

    <div class="gut-modal-footer">
      <button class="gut-btn" id="close-variables-modal">Close</button>
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

export const TEMPLATE_CREATOR_HTML = (
  formData,
  instance,
  editTemplateName,
  editTemplate,
  selectedTorrentName,
) => `
  <div class="gut-modal-content">
    <div class="gut-modal-header">
      <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
      <h2>
        ${editTemplateName ? '<button class="gut-modal-back-btn" id="back-to-manager" title="Back to Template Manager">&lt;</button>' : ""}
        ${editTemplateName ? "Edit Template" : "Create Template"}
      </h2>
    </div>

    <div class="gut-modal-body">

    <div class="gut-form-group">
      <label for="template-name">Template Name:</label>
      <input type="text" id="template-name" placeholder="e.g., Magazine Template" value="${editTemplateName ? instance.escapeHtml(editTemplateName) : ""}">
    </div>

    <div class="gut-form-group">
      <label for="sample-torrent">Sample Torrent Name (for preview):</label>
      <input type="text" id="sample-torrent" value="${instance.escapeHtml(selectedTorrentName)}" placeholder="e.g., PCWorld - Issue 05 - 01-2024.zip">
    </div>

    <div class="gut-form-group" style="margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
        <label for="torrent-mask" style="margin-bottom: 0;">Torrent Name Mask:</label>
        <a href="#" id="test-mask-sandbox-link" class="gut-link" style="font-size: 11px;">Test mask in sandbox →</a>
      </div>
      <div class="gut-mask-input-container">
        <div class="gut-mask-highlight-overlay" id="mask-highlight-overlay"></div>
        <input type="text" id="torrent-mask" autocomplete="off" class="gut-mask-input" placeholder="e.g., \${magazine} - Issue \${issue} - \${month}-\${year}.\${ext}" value="${editTemplate ? instance.escapeHtml(editTemplate.mask) : ""}">
      </div>
      <div class="gut-mask-cursor-info" id="mask-cursor-info"></div>
      <div class="gut-mask-status-container" id="mask-status-container"></div>
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
          <input type="text" id="field-filter" placeholder="Filter fields..." autocomplete="off" style="padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #2a2a2a; color: #e0e0e0; font-size: 12px; min-width: 150px;">
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
            const isInTemplate =
              editTemplate && editTemplate.fieldMappings.hasOwnProperty(name);
            const templateValue = isInTemplate
              ? editTemplate.fieldMappings[name]
              : null;
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
                 ${
                   fieldData.type === "select"
                     ? (() => {
                         const hasVariableMatching =
                           editTemplate &&
                           editTemplate.variableMatching &&
                           editTemplate.variableMatching[name];
                         const variableConfig = hasVariableMatching
                           ? editTemplate.variableMatching[name]
                           : null;
                         const isVariableMode = hasVariableMatching;

                         return `<div style="display: flex; align-items: flex-start; width: 100%;">
                           <a href="#" class="gut-link gut-variable-toggle" data-field="${name}" data-state="${isVariableMode ? "on" : "off"}">Match from variable: ${isVariableMode ? "ON" : "OFF"}</a>
                         </div>`;
                       })()
                     : ""
                 }
                 <input type="checkbox" ${shouldBeChecked ? "checked" : ""} data-field="${name}">
                 <label title="${name}">${fieldData.label}:</label>
                 ${
                   fieldData.type === "select"
                     ? (() => {
                         const hasVariableMatching =
                           editTemplate &&
                           editTemplate.variableMatching &&
                           editTemplate.variableMatching[name];
                         const variableConfig = hasVariableMatching
                           ? editTemplate.variableMatching[name]
                           : null;
                         const isVariableMode = hasVariableMatching;

                         return `<div class="gut-select-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                             <div style="display: flex; flex-direction: column; align-items: flex-end;">
                               <select data-template="${name}" class="template-input gut-select select-static-mode" style="width: 100%; ${isVariableMode ? "display: none;" : ""}">
                                 ${fieldData.options
                                   .map((option) => {
                                     let selected = option.selected;
                                     if (
                                       templateValue &&
                                       templateValue === option.value
                                     ) {
                                       selected = true;
                                     }
                                     return `<option value="${instance.escapeHtml(option.value)}" ${selected ? "selected" : ""}>${instance.escapeHtml(option.text)}</option>`;
                                   })
                                   .join("")}
                               </select>
                             </div>
                            <div class="gut-variable-controls" data-field="${name}" style="display: ${isVariableMode ? "flex" : "none"}; gap: 8px;">
                              <select class="gut-match-type" data-field="${name}" style="padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #1a1a1a; color: #e0e0e0; font-size: 12px;">
                              <option value="exact" ${variableConfig && variableConfig.matchType === "exact" ? "selected" : ""}>Is exactly</option>
                              <option value="contains" ${variableConfig && variableConfig.matchType === "contains" ? "selected" : ""}>Contains</option>
                              <option value="starts" ${variableConfig && variableConfig.matchType === "starts" ? "selected" : ""}>Starts with</option>
                              <option value="ends" ${variableConfig && variableConfig.matchType === "ends" ? "selected" : ""}>Ends with</option>
                            </select>
                            <input type="text" class="gut-variable-input" data-field="${name}" placeholder="\${variable_name}" value="${variableConfig ? instance.escapeHtml(variableConfig.variableName) : ""}" style="flex: 1; padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #1a1a1a; color: #e0e0e0; font-size: 12px;">
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
                                  return `<option value="${instance.escapeHtml(option.value)}" ${selected ? "selected" : ""}>${instance.escapeHtml(option.label)}</option>`;
                                })
                                .join("")}
                            </select>`
                         : fieldData.type === "textarea"
                           ? `<textarea data-template="${name}" class="template-input" rows="4" style="resize: vertical; width: 100%;">${templateValue !== null ? instance.escapeHtml(String(templateValue)) : instance.escapeHtml(String(fieldData.value))}</textarea>`
                           : `<input type="text" value="${templateValue !== null ? instance.escapeHtml(String(templateValue)) : instance.escapeHtml(String(fieldData.value))}" data-template="${name}" class="template-input">`
                 }
                 <span class="gut-preview" data-preview="${name}"></span>
               </div>
             `;
          })
          .join("")}
      </div>
    </div>
    </div>

    <div class="gut-modal-footer">
      <button class="gut-btn" id="cancel-template">Cancel</button>
      <button class="gut-btn gut-btn-primary" id="save-template">${editTemplateName ? "Update Template" : "Save Template"}</button>
    </div>
  </div>
`;

export const HINTS_TAB_HTML = (instance) => {
  const hints = instance.hints || {};

  const isDefaultHint = (name) => {
    const defaultHints = [
      "number",
      "alpha",
      "alnum",
      "version",
      "date_dots",
      "date_dashes",
      "lang_codes",
      "resolution",
    ];
    return defaultHints.includes(name);
  };

  const isOverridden = (name) => {
    return instance.isHintOverridden ? instance.isHintOverridden(name) : false;
  };

  const renderHintRow = (name, hint, isDefault) => {
    const overridden = isOverridden(name);

    const mappingsHtml =
      hint.type === "map" && hint.mappings
        ? `
      <div class="gut-hint-mappings-inline">
        <div class="gut-hint-mappings-header">
          <div style="display: flex; align-items: center; gap: 6px; cursor: pointer;" class="gut-hint-mappings-toggle" data-hint="${instance.escapeHtml(name)}">
            <svg class="gut-hint-caret" width="12" height="12" viewBox="0 0 12 12" style="transition: transform 0.2s ease;">
              <path d="M4 3 L8 6 L4 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${Object.keys(hint.mappings).length} mappings${hint.strict === false ? " (non-strict)" : ""}</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <a href="#" class="gut-link" data-action="mass-edit-mappings" data-hint="${instance.escapeHtml(name)}">Mass Edit</a>
          </div>
        </div>
        <div class="gut-hint-mappings-content" style="display: none; max-height: 0; overflow: hidden; transition: max-height 0.2s ease;">
          <div style="max-height: 200px; overflow-y: auto;">
            ${Object.entries(hint.mappings)
              .map(
                ([key, value]) => `
                <div class="gut-variable-item">
                  <span class="gut-variable-name">${instance.escapeHtml(key)}</span>
                  <span class="gut-variable-value">${instance.escapeHtml(value)}</span>
                </div>
              `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `
        : "";

    return `
      <div class="gut-hint-item" data-hint="${instance.escapeHtml(name)}">
        <div class="gut-hint-header">
          <div class="gut-hint-name-group">
            <span class="gut-hint-name">${instance.escapeHtml(name)}</span>
            <span class="gut-hint-type-badge">${hint.type}</span>
            ${overridden ? '<span class="gut-hint-override-indicator" title="This default hint has been customized">modified</span>' : ""}
          </div>
          <div class="gut-hint-actions">
            ${isDefault && !overridden ? '<a href="#" class="gut-link" data-action="edit-hint">Edit</a>' : ""}
            ${overridden ? '<a href="#" class="gut-link" data-action="edit-hint">Edit</a> | <a href="#" class="gut-link" data-action="reset-hint">Reset to Default</a>' : ""}
            ${!isDefault ? '<a href="#" class="gut-link" data-action="edit-hint">Edit</a> | <a href="#" class="gut-link gut-link-danger" data-action="delete-hint">Delete</a>' : ""}
          </div>
        </div>
        ${hint.description ? `<div class="gut-hint-description">${instance.escapeHtml(hint.description)}</div>` : ""}
        ${hint.type === "pattern" ? `<div class="gut-hint-pattern"><code>${instance.escapeHtml(hint.pattern)}</code></div>` : ""}
        ${hint.type === "regex" ? `<div class="gut-hint-pattern"><code>/${instance.escapeHtml(hint.pattern)}/</code></div>` : ""}
        ${mappingsHtml}
      </div>
    `;
  };

  const defaultHintRows = Object.entries(hints)
    .filter(([name]) => isDefaultHint(name))
    .map(([name, hint]) => renderHintRow(name, hint, true))
    .join("");

  const customHintRows = Object.entries(hints)
    .filter(([name]) => !isDefaultHint(name))
    .map(([name, hint]) => renderHintRow(name, hint, false))
    .join("");

  return `
    <div class="gut-tab-content" id="hints-tab">
      <div class="gut-form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 12px; color: #888;">
            Use hints in your mask to constrain what variables match. Syntax: <span class="gut-variable-name">\${varname:hint}</span>
            <br>Examples: <span class="gut-variable-name">\${version:v*}</span>, <span class="gut-variable-name">\${date:####-##-##}</span>, <span class="gut-variable-name">\${lang:lang_codes}</span>
          </div>
          <button class="gut-btn gut-btn-primary gut-btn-small" id="add-hint-btn">+ Add Custom Hint</button>
        </div>
      </div>

      <div class="gut-form-group">
        <input type="text" id="hint-filter-input" class="gut-input" placeholder="Filter hints by name, description, pattern..." style="width: 100%;">
        <div id="hint-filter-count" style="font-size: 11px; color: #888; margin-top: 5px;"></div>
      </div>

      ${
        customHintRows
          ? `
        <div class="gut-form-group" id="custom-hints-section">
          <label>Custom Hints</label>
          <div class="gut-hints-list" id="custom-hints-list">
            ${customHintRows}
          </div>
        </div>
      `
          : ""
      }

      <div class="gut-form-group">
        <label>Default Hints</label>
        <div class="gut-hints-list" id="default-hints-list">
          ${defaultHintRows}
        </div>
      </div>
    </div>
  `;
};

export const SANDBOX_TAB_HTML = (instance) => {
  const savedSets = instance.sandboxSets || {};
  const currentSet = instance.currentSandboxSet || "";

  return `
    <div class="gut-tab-content" id="sandbox-tab">
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <select id="sandbox-set-select" class="gut-select" style="flex: 1;">
            <option value="">New test set</option>
            ${Object.keys(savedSets)
              .map(
                (name) =>
                  `<option value="${instance.escapeHtml(name)}" ${name === currentSet ? "selected" : ""}>${instance.escapeHtml(name)}</option>`,
              )
              .join("")}
          </select>
          <button class="gut-btn gut-btn-secondary gut-btn-small" id="save-sandbox-set" title="Save or update test set">Save</button>
          <button class="gut-btn gut-btn-secondary gut-btn-small" id="rename-sandbox-set" style="display: none;" title="Rename current test set">Rename</button>
          <button class="gut-btn gut-btn-danger gut-btn-small" id="delete-sandbox-set" style="display: none;" title="Delete current test set">Delete</button>
        </div>
        <div style="display: flex; justify-content: flex-start;">
          <a href="#" id="reset-sandbox-fields" class="gut-link" style="font-size: 11px;">Reset fields</a>
        </div>
      </div>

      <div class="gut-form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <label for="sandbox-mask-input" style="margin-bottom: 0;">Mask:</label>
          <a href="#" id="toggle-compiled-regex" class="gut-link" style="font-size: 11px;">Show compiled regex</a>
        </div>
        <div class="gut-mask-input-container">
          <div class="gut-mask-highlight-overlay" id="sandbox-mask-display"></div>
          <input type="text" id="sandbox-mask-input" autocomplete="off" class="gut-mask-input" placeholder="\${artist} - \${album} {?[\${year}]?}">
        </div>
        <div class="gut-mask-cursor-info" id="sandbox-mask-cursor-info"></div>
        <div class="gut-compiled-regex-display" id="sandbox-compiled-regex"></div>
        <div class="gut-mask-status-container" id="sandbox-mask-status"></div>
      </div>

      <div class="gut-form-group">
        <label for="sandbox-sample-input">Sample Torrent Names (one per line):</label>
        <textarea id="sandbox-sample-input" style="font-family: 'Fira Code', monospace; font-size: 13px; resize: vertical; width: 100%; line-height: 1.4; overflow-y: auto; box-sizing: border-box;" placeholder="Artist Name - Album Title [2024]\nAnother Artist - Some Album\nThird Example - Test [2023]"></textarea>
      </div>

      <div class="gut-form-group">
        <label id="sandbox-results-label">Match Results:</label>
        <div id="sandbox-results" class="gut-sandbox-results">
          <div class="gut-no-variables">Enter a mask and sample names to see match results.</div>
        </div>
      </div>
    </div>
  `;
};

export const HINT_EDITOR_MODAL_HTML = (
  instance,
  hintName = null,
  hintData = null,
) => {
  const isEdit = !!hintName;
  const hint = hintData || {
    type: "pattern",
    pattern: "",
    description: "",
    mappings: {},
    strict: true,
  };

  const mappingsArray =
    hint.type === "map" && hint.mappings
      ? Object.entries(hint.mappings)
      : [["", ""]];

  return `
    <div class="gut-modal">
      <div class="gut-modal-content gut-hint-editor-modal">
        <div class="gut-modal-header">
          <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
          <h2>${isEdit ? "Edit Hint" : "Create New Hint"}</h2>
        </div>

      <div class="gut-modal-body">
        <div class="gut-form-group">
          <label for="hint-editor-name">Hint Name *</label>
          <input
            type="text"
            id="hint-editor-name"
            class="gut-input"
            placeholder="e.g., my_hint"
            value="${isEdit ? instance.escapeHtml(hintName) : ""}"
            ${isEdit ? "readonly" : ""}
            pattern="[a-zA-Z0-9_]+"
          >
          <div style="font-size: 11px; color: #888; margin-top: 4px;">
            Letters, numbers, and underscores only
          </div>
        </div>

        <div class="gut-form-group">
          <label for="hint-editor-description">Description</label>
          <textarea
            id="hint-editor-description"
            class="gut-input"
            rows="1"
            placeholder="Describe what this hint matches"
          >${instance.escapeHtml(hint.description || "")}</textarea>
        </div>

        <div class="gut-form-group">
          <label>Hint Type *</label>
          <div class="gut-hint-type-selector">
            <label class="gut-radio-label" title="Use # for digits, @ for letters, * for alphanumeric">
              <input type="radio" name="hint-type" value="pattern" ${hint.type === "pattern" ? "checked" : ""}>
              <span>Pattern</span>
            </label>
            <label class="gut-radio-label" title="Regular expression pattern">
              <input type="radio" name="hint-type" value="regex" ${hint.type === "regex" ? "checked" : ""}>
              <span>Regex</span>
            </label>
            <label class="gut-radio-label" title="Map input values to output values">
              <input type="radio" name="hint-type" value="map" ${hint.type === "map" ? "checked" : ""}>
              <span>Value Map</span>
            </label>
          </div>
        </div>

        <div class="gut-form-group" id="hint-pattern-group" style="display: ${hint.type === "pattern" || hint.type === "regex" ? "block" : "none"};">
          <label for="hint-editor-pattern">
            <span id="hint-pattern-label">${hint.type === "regex" ? "Regex Pattern" : "Pattern"} *</span>
          </label>
          <input
            type="text"
            id="hint-editor-pattern"
            class="gut-input"
            placeholder="${hint.type === "regex" ? "e.g., v\\d+(?:\\.\\d+)*" : "e.g., ##.##.####"}"
            value="${hint.type !== "map" ? instance.escapeHtml(hint.pattern || "") : ""}"
          >
        </div>

        <div class="gut-form-group" id="hint-mappings-group" style="display: ${hint.type === "map" ? "block" : "none"};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <label style="margin: 0;">Value Mappings *</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <a href="#" class="gut-link" id="hint-editor-import-btn">Import</a>
              <a href="#" class="gut-link" id="hint-editor-mass-edit-btn">Mass Edit</a>
            </div>
          </div>
          <label class="gut-checkbox-label" style="margin-top: 10px;">
            <input type="checkbox" id="hint-editor-strict" ${hint.strict === false ? "" : "checked"}>
            <span class="gut-checkbox-text">Strict mode (reject values not in map)</span>
          </label>
          <div id="hint-mappings-table">
            <div class="gut-mappings-table-header">
              <span style="flex: 1;">Input Value</span>
              <span style="flex: 1;">Output Value</span>
              <span style="width: 40px;"></span>
            </div>
            <div id="hint-mappings-rows">
              ${mappingsArray
                .map(
                  ([key, value], idx) => `
                <div class="gut-mappings-row" data-row-index="${idx}">
                  <input type="text" class="gut-input gut-mapping-key" placeholder="e.g., en" value="${instance.escapeHtml(key)}">
                  <input type="text" class="gut-input gut-mapping-value" placeholder="e.g., English" value="${instance.escapeHtml(value)}">
                  <button class="gut-btn gut-btn-danger gut-btn-small gut-remove-mapping" title="Remove">−</button>
                </div>
              `,
                )
                .join("")}
            </div>
            <button class="gut-btn gut-btn-secondary gut-btn-small" id="hint-add-mapping">+ Add Mapping</button>
          </div>
        </div>
      </div>

      <div class="gut-modal-footer">
        <button class="gut-btn" id="hint-editor-cancel">Cancel</button>
        <button class="gut-btn gut-btn-primary" id="hint-editor-save">${isEdit ? "Save Changes" : "Create Hint"}</button>
      </div>
      </div>
    </div>
  `;
};

export const MAP_IMPORT_MODAL_HTML = (
  instance,
  hintName,
  existingMappings = {},
  mode = "import",
) => {
  const isMassEdit = mode === "mass-edit";
  const prefilledText = isMassEdit
    ? Object.entries(existingMappings)
        .map(([k, v]) => `${k},${v}`)
        .join("\n")
    : "";

  return `
    <div class="gut-modal">
      <div class="gut-modal-content">
        <div class="gut-modal-header">
          <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
          <h2>${isMassEdit ? "Mass Edit" : "Import"} Mappings for "${instance.escapeHtml(hintName)}"</h2>
        </div>

        <div class="gut-modal-body">
          <div class="gut-form-group">
            <label for="import-separator-select">Separator:</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select id="import-separator-select" class="gut-select" style="flex: 1;">
                <option value="," selected>Comma (,)</option>
                <option value="\t">Tab</option>
                <option value=";">Semicolon (;)</option>
                <option value="|">Pipe (|)</option>
                <option value=":">Colon (:)</option>
                <option value="=">Equals (=)</option>
                <option value="custom">Custom...</option>
              </select>
              <input
                type="text"
                id="import-custom-separator"
                class="gut-input"
                placeholder="Enter separator"
                maxlength="3"
                style="display: none; width: 100px;"
              >
            </div>
          </div>

          <div class="gut-form-group">
            <label for="import-mappings-textarea">Mappings (one per line):</label>
            <textarea
              id="import-mappings-textarea"
              class="gut-input"
              placeholder="en,English\nfr,French\nde,German"
              style="font-family: 'Fira Code', monospace; font-size: 13px; resize: vertical; width: 100%; line-height: 1.4;"
            >${prefilledText}</textarea>
            <div style="font-size: 11px; color: #888; margin-top: 4px;">
              Format: key${isMassEdit ? "" : "<separator>"}value (one mapping per line)
            </div>
          </div>

          ${
            !isMassEdit
              ? `
          <div class="gut-form-group">
            <label class="gut-checkbox-label">
              <input type="checkbox" id="import-overwrite-checkbox">
              <span class="gut-checkbox-text">Overwrite existing mappings</span>
            </label>
            <div style="font-size: 11px; color: #888; margin-top: 4px;">
              If unchecked, only new keys will be added (existing keys will be kept)
            </div>
          </div>
          `
              : ""
          }

          <div class="gut-form-group" id="import-preview-group" style="display: none;">
            <label>Preview:</label>
            <div id="import-preview-content" class="gut-extracted-vars" style="max-height: 200px; overflow-y: auto;">
            </div>
            <div id="import-preview-summary" style="font-size: 11px; color: #888; margin-top: 4px;"></div>
          </div>
        </div>

        <div class="gut-modal-footer">
          <button class="gut-btn" id="import-cancel-btn">Cancel</button>
          <button class="gut-btn gut-btn-primary" id="import-confirm-btn">${isMassEdit ? "Apply Changes" : "Import"}</button>
        </div>
      </div>
    </div>
  `;
};

export const MAIN_UI_HTML = (instance) => `
  <div id="ggn-upload-templator-controls" class="ggn-upload-templator-controls" style="align-items: flex-end;">
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
    <button type="button" id="apply-template-btn" class="gut-btn gut-btn-primary">Apply Template</button>
    <button type="button" id="create-template-btn" class="gut-btn gut-btn-primary">+ Create Template</button>
    <button id="manage-templates-btn" type="button" class="gut-btn gut-btn-secondary" title="Manage Templates & Settings">
      Manage
    </button>
  </div>
  <div id="variables-row" style="display: none; padding: 10px 0; font-size: 12px; cursor: pointer; user-select: none;"></div>
`;
