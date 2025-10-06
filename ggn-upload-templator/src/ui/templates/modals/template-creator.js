import { html, raw, map, when } from '../../template-engine.js';

const renderSelectFieldVariableToggle = (name, editTemplate) => {
  const hasVariableMatching =
    editTemplate &&
    editTemplate.variableMatching &&
    editTemplate.variableMatching[name];
  const isVariableMode = hasVariableMatching;

  return html`
    <div style="display: flex; align-items: flex-start; width: 100%;">
      <a href="#" class="gut-link gut-variable-toggle" data-field="${name}" data-state="${isVariableMode ? "on" : "off"}">Match from variable: ${isVariableMode ? "ON" : "OFF"}</a>
    </div>
  `;
};

const renderSelectFieldInput = (name, fieldData, templateValue, editTemplate) => {
  const hasVariableMatching =
    editTemplate &&
    editTemplate.variableMatching &&
    editTemplate.variableMatching[name];
  const variableConfig = hasVariableMatching
    ? editTemplate.variableMatching[name]
    : null;
  const isVariableMode = hasVariableMatching;

  return html`
    <div class="gut-select-container" style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
      <div style="display: flex; flex-direction: column; align-items: flex-end;">
        <select data-template="${name}" class="template-input gut-select select-static-mode" style="width: 100%; ${raw(isVariableMode ? "display: none;" : "")}">
          ${map(fieldData.options, (option) => {
            const selected = templateValue && templateValue === option.value ? true : option.selected;
            return html`<option value="${option.value}" ${raw(selected ? "selected" : "")}>${option.text}</option>`;
          })}
        </select>
      </div>
      <div class="gut-variable-controls" data-field="${name}" style="display: ${raw(isVariableMode ? "flex" : "none")}; gap: 8px;">
        <select class="gut-match-type" data-field="${name}" style="padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #1a1a1a; color: #e0e0e0; font-size: 12px;">
          <option value="exact" ${raw(variableConfig && variableConfig.matchType === "exact" ? "selected" : "")}>Is exactly</option>
          <option value="contains" ${raw(variableConfig && variableConfig.matchType === "contains" ? "selected" : "")}>Contains</option>
          <option value="starts" ${raw(variableConfig && variableConfig.matchType === "starts" ? "selected" : "")}>Starts with</option>
          <option value="ends" ${raw(variableConfig && variableConfig.matchType === "ends" ? "selected" : "")}>Ends with</option>
        </select>
        <input type="text" class="gut-variable-input" data-field="${name}" placeholder="\${variable_name}" value="${variableConfig ? variableConfig.variableName : ""}" style="flex: 1; padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #1a1a1a; color: #e0e0e0; font-size: 12px;">
      </div>
    </div>
  `;
};

const renderFieldInput = (name, fieldData, templateValue, editTemplate) => {
  if (fieldData.type === "select") {
    return renderSelectFieldInput(name, fieldData, templateValue, editTemplate);
  } else if (fieldData.inputType === "checkbox") {
    const checked = templateValue !== null ? templateValue : fieldData.value;
    return html`<input type="checkbox" ${raw(checked ? "checked" : "")} data-template="${name}" class="template-input">`;
  } else if (fieldData.inputType === "radio") {
    return html`
      <select data-template="${name}" class="template-input gut-select">
        ${map(fieldData.radioOptions, (option) => {
          const selected = templateValue && templateValue === option.value ? true : option.checked;
          return html`<option value="${option.value}" ${raw(selected ? "selected" : "")}>${option.label}</option>`;
        })}
      </select>
    `;
  } else if (fieldData.type === "textarea") {
    const value = templateValue !== null ? String(templateValue) : String(fieldData.value);
    return html`<textarea data-template="${name}" class="template-input" rows="4" style="resize: vertical; width: 100%;">${value}</textarea>`;
  } else {
    const value = templateValue !== null ? String(templateValue) : String(fieldData.value);
    return html`<input type="text" value="${value}" data-template="${name}" class="template-input">`;
  }
};

export const TEMPLATE_CREATOR_HTML = (
  formData,
  instance,
  editTemplateName,
  editTemplate,
  selectedTorrentName,
) => {
  const renderFieldRow = ([name, fieldData]) => {
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

    const hiddenClass = isIgnoredByDefault && !isInTemplate && !shouldBeChecked ? " gut-hidden" : "";

    return html`
      <div class="gut-field-row${raw(hiddenClass)}">
        ${raw(when(fieldData.type === "select", raw(renderSelectFieldVariableToggle(name, editTemplate))))}
        <input type="checkbox" ${raw(shouldBeChecked ? "checked" : "")} data-field="${name}">
        <label title="${name}">${fieldData.label}:</label>
        ${raw(renderFieldInput(name, fieldData, templateValue, editTemplate))}
        <span class="gut-preview" data-preview="${name}"></span>
      </div>
    `;
  };

  return html`
    <div class="gut-modal-content">
      <div class="gut-modal-header">
        <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
        <h2>
          ${raw(when(editTemplateName, raw('<button class="gut-modal-back-btn" id="back-to-manager" title="Back to Template Manager">&lt;</button>')))}
          ${editTemplateName ? "Edit Template" : "Create Template"}
        </h2>
      </div>

      <div class="gut-modal-body">

      <div class="gut-form-group">
        <label for="template-name">Template Name:</label>
        <input type="text" id="template-name" placeholder="e.g., Magazine Template" value="${editTemplateName || ""}">
      </div>

      <div class="gut-form-group">
        <label for="sample-torrent">Sample Torrent Name (for preview):</label>
        <input type="text" id="sample-torrent" value="${selectedTorrentName}" placeholder="e.g., PCWorld - Issue 05 - 01-2024.zip">
      </div>

      <div class="gut-form-group" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <label for="torrent-mask" style="margin-bottom: 0;">Torrent Name Mask:</label>
          <a href="#" id="test-mask-sandbox-link" class="gut-link" style="font-size: 11px;">Test mask in sandbox →</a>
        </div>
        <div class="gut-mask-input-container">
          <div class="gut-mask-highlight-overlay" id="mask-highlight-overlay"></div>
          <input type="text" id="torrent-mask" autocomplete="off" class="gut-mask-input" placeholder="e.g., \${magazine} - Issue \${issue} - \${month}-\${year}.\${ext}" value="${editTemplate ? editTemplate.mask : ""}">
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
          ${map(Object.entries(formData), renderFieldRow)}
        </div>
      </div>
      </div>

      <div class="gut-modal-footer">
        <button class="gut-btn" id="cancel-template">Cancel</button>
        <button class="gut-btn gut-btn-primary" id="save-template">${editTemplateName ? "Update Template" : "Save Template"}</button>
      </div>
    </div>
  `;
};
