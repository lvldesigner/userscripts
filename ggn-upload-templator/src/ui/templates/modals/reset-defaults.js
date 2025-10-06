import { html, raw, map, when } from '../../template-engine.js';
import { DEFAULT_HINTS } from '../../../hint-storage.js';

export const RESET_DEFAULTS_MODAL_HTML = (userHints, ignoredHints, deletedHints, instance) => {
  const defaultEntries = Object.entries(DEFAULT_HINTS);
  
  const hintsWithStatus = defaultEntries.map(([name, def]) => {
    const userHint = userHints[name];
    const isDeleted = deletedHints.includes(name);
    const isEdited = userHint && !isDeleted && JSON.stringify(userHint) !== JSON.stringify(def);
    const isMissing = !userHint && !isDeleted;
    const isIgnored = ignoredHints.includes(name);
    
    return { name, def, isEdited, isMissing, isDeleted, isIgnored };
  });
  
  const selectedCount = hintsWithStatus.filter(h => !h.isIgnored).length;
  const buttonText = selectedCount === 0 ? 'Reset Selected' : selectedCount === defaultEntries.length ? 'Reset All' : `Reset ${selectedCount}/${defaultEntries.length} Selected`;
  
  const renderHintRow = (name, hint, isIgnored, statusBadge) => {
    const mappingsHtml =
      hint.type === "map" && hint.mappings
        ? html`
      <div class="gut-hint-mappings-inline">
        <div class="gut-hint-mappings-header">
          <div style="display: flex; align-items: center; gap: 6px; cursor: pointer;" class="gut-hint-mappings-toggle" data-hint="${name}">
            <svg class="gut-hint-caret" width="12" height="12" viewBox="0 0 12 12" style="transition: transform 0.2s ease;">
              <path d="M4 3 L8 6 L4 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>${Object.keys(hint.mappings).length} mappings${hint.strict === false ? " (non-strict)" : ""}</span>
          </div>
        </div>
        <div class="gut-hint-mappings-content" style="display: none; max-height: 0; overflow: hidden; transition: max-height 0.2s ease;">
          <div style="max-height: 200px; overflow-y: auto;">
            ${map(Object.entries(hint.mappings), ([key, value]) => html`
                <div class="gut-variable-item">
                  <span class="gut-variable-name">${key}</span>
                  <span class="gut-variable-value">${value}</span>
                </div>
              `)}
          </div>
        </div>
      </div>
    `
        : "";

    return html`
      <div class="gut-hint-item gut-hint-import-item" data-hint-name="${name}">
        <div class="gut-hint-header">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <input 
              type="checkbox" 
              class="hint-select-checkbox" 
              data-hint-name="${name}"
              ${raw(isIgnored ? '' : 'checked')}
            >
            <div class="gut-hint-name-group">
              <span class="gut-hint-name">${name}</span>
              <span class="gut-hint-type-badge">${hint.type}</span>
              ${raw(statusBadge)}
            </div>
          </div>
          <div class="gut-hint-actions">
            <a 
              href="#" 
              class="gut-link hint-ignore-btn" 
              data-hint-name="${name}"
            >
              ${isIgnored ? 'Unignore' : 'Ignore'}
            </a>
          </div>
        </div>
        ${raw(when(hint.description, html`<div class="gut-hint-description">${hint.description}</div>`))}
        ${raw(when(hint.type === "pattern", html`<div class="gut-hint-pattern"><code>${hint.pattern}</code></div>`))}
        ${raw(when(hint.type === "regex", html`<div class="gut-hint-pattern"><code>/${hint.pattern}/</code></div>`))}
        ${raw(mappingsHtml)}
      </div>
    `;
  };
  
  return html`
    <div class="gut-modal">
      <div class="gut-modal-content" style="max-width: 700px;">
        <div class="gut-modal-header">
          <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
          <h2>Reset Default Hints</h2>
        </div>

        <div class="gut-modal-body">
          <div style="padding: 12px; background: #4a3a2a; border-left: 3px solid #ff9800; margin-bottom: 16px; border-radius: 4px;">
            <strong style="color: #ff9800;">⚠ Warning</strong>
            <p style="margin: 8px 0 0 0; color: #b0b0b0; font-size: 13px;">
              Selected hints will be reset to their default values. This will overwrite any customizations you've made to these hints.
            </p>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 12px; font-size: 12px;">
            <a href="#" class="gut-link" id="reset-select-all-btn">Select All</a>
            <span style="color: #666;">•</span>
            <a href="#" class="gut-link" id="reset-select-none-btn">Select None</a>
          </div>

          <div class="gut-hints-list">
            ${map(hintsWithStatus, ({ name, def, isEdited, isMissing, isDeleted, isIgnored }) => {
              let statusBadge = '';
              if (isDeleted) {
                statusBadge = '<span style="padding: 2px 6px; background: #4a2a2a; color: #f44336; border-radius: 3px; font-size: 11px; font-weight: 500;">Deleted</span>';
              } else if (isMissing) {
                statusBadge = '<span style="padding: 2px 6px; background: #3a2a4a; color: #9c27b0; border-radius: 3px; font-size: 11px; font-weight: 500;">Missing</span>';
              } else if (isEdited) {
                statusBadge = '<span style="padding: 2px 6px; background: #4a3a2a; color: #ff9800; border-radius: 3px; font-size: 11px; font-weight: 500;">Edited</span>';
              }
              
              return raw(renderHintRow(name, def, isIgnored, statusBadge));
            })}
          </div>
        </div>

        <div class="gut-modal-footer">
          <button class="gut-btn" id="reset-hints-cancel-btn">Cancel</button>
          <button class="gut-btn gut-btn-primary" id="reset-hints-confirm-btn" ${raw(selectedCount === 0 ? 'disabled' : '')}>${buttonText}</button>
        </div>
      </div>
    </div>
  `;
};
