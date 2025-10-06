import { html, raw, map, when } from '../../template-engine.js';
import { DEFAULT_HINTS } from '../../../hint-storage.js';
import { HELP_ICON_HTML } from '../components/help-icon.js';

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

  return html`
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
            value="${isEdit ? hintName : ""}"
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
          >${hint.description || ""}</textarea>
        </div>

        <div class="gut-form-group">
          <label>Hint Type * ${raw(HELP_ICON_HTML('hint-types'))}</label>
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
            ${raw(hint.type === "pattern" ? HELP_ICON_HTML('hint-pattern-syntax') : hint.type === "regex" ? HELP_ICON_HTML('hint-regex-syntax') : '')}
          </label>
          <input
            type="text"
            id="hint-editor-pattern"
            class="gut-input"
            placeholder="${hint.type === "regex" ? "e.g., v\\d+(?:\\.\\d+)*" : "e.g., ##.##.####"}"
            value="${hint.type !== "map" ? (hint.pattern || "") : ""}"
          >
        </div>

        <div class="gut-form-group" id="hint-mappings-group" style="display: ${hint.type === "map" ? "block" : "none"};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <label style="margin: 0;">Value Mappings * ${raw(HELP_ICON_HTML('hint-value-mappings'))}</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <a href="#" class="gut-link" id="hint-editor-import-btn">Import</a>
              <a href="#" class="gut-link" id="hint-editor-mass-edit-btn">Mass Edit</a>
            </div>
          </div>
          <label class="gut-checkbox-label" style="margin-top: 10px;">
            <input type="checkbox" id="hint-editor-strict" ${hint.strict === false ? "" : "checked"}>
            <span class="gut-checkbox-text">Strict mode (reject values not in map) ${raw(HELP_ICON_HTML('hint-strict-mode'))}</span>
          </label>
          <div id="hint-mappings-table">
            <div class="gut-mappings-table-header">
              <span style="flex: 1;">Input Value</span>
              <span style="flex: 1;">Output Value</span>
              <span style="width: 40px;"></span>
            </div>
            <div id="hint-mappings-rows">
              ${map(mappingsArray, ([key, value], idx) => html`
                <div class="gut-mappings-row" data-row-index="${idx}">
                  <input type="text" class="gut-input gut-mapping-key" placeholder="e.g., en" value="${key}">
                  <input type="text" class="gut-input gut-mapping-value" placeholder="e.g., English" value="${value}">
                  <button class="gut-btn gut-btn-danger gut-btn-small gut-remove-mapping" title="Remove">−</button>
                </div>
              `)}
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
