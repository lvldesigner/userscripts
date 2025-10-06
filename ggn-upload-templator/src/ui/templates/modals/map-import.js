import { html, raw, when } from '../../template-engine.js';

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

  return html`
    <div class="gut-modal">
      <div class="gut-modal-content">
        <div class="gut-modal-header">
          <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
          <h2>${isMassEdit ? "Mass Edit" : "Import"} Mappings for "${hintName}"</h2>
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

          ${raw(when(!isMassEdit, html`
          <div class="gut-form-group">
            <label class="gut-checkbox-label">
              <input type="checkbox" id="import-overwrite-checkbox">
              <span class="gut-checkbox-text">Overwrite existing mappings</span>
            </label>
            <div style="font-size: 11px; color: #888; margin-top: 4px;">
              If unchecked, only new keys will be added (existing keys will be kept)
            </div>
          </div>
          `))}

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
