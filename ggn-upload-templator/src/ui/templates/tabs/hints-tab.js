import { html, raw, map, when } from '../../template-engine.js';
import { getNewDefaultHints } from '../../../hint-storage.js';

export const HINTS_TAB_HTML = (instance) => {
  const hints = instance.hints || {};

  const renderHintRow = (name, hint) => {
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
          <div style="display: flex; gap: 8px; align-items: center;">
            <a href="#" class="gut-link" data-action="mass-edit-mappings" data-hint="${name}">Mass Edit</a>
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
      <div class="gut-hint-item" data-hint="${name}">
        <div class="gut-hint-header">
          <div class="gut-hint-name-group">
            <span class="gut-hint-name">${name}</span>
            <span class="gut-hint-type-badge">${hint.type}</span>
          </div>
          <div class="gut-hint-actions">
            <a href="#" class="gut-link" data-action="edit-hint">Edit</a>
            <span class="gut-hint-actions-separator">•</span>
            <a href="#" class="gut-link gut-link-danger" data-action="delete-hint">Delete</a>
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
    <div class="gut-tab-content" id="hints-tab">
      <div class="gut-form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;">
          <input type="text" id="hint-filter-input" class="gut-input" placeholder="Filter hints by name, description, pattern..." style="flex: 1;">
          <button class="gut-btn gut-btn-primary gut-btn-small" id="add-hint-btn">+ Add Hint</button>
        </div>
        <div id="hint-filter-count" style="font-size: 11px; color: #888; margin-top: 5px;"></div>
      </div>

      <div class="gut-form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label>Hints</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${raw((() => {
              const newHints = getNewDefaultHints(instance.hints);
              const newHintCount = Object.keys(newHints).length;
              return newHintCount > 0
                ? `<a href="#" class="gut-link" id="import-new-hints-btn">Import New Hints (${newHintCount})</a>`
                : '';
            })())}
            <a href="#" class="gut-link" id="reset-defaults-btn">Reset Defaults</a>
            <a href="#" class="gut-link" id="delete-all-hints-btn" style="color: #f44336;">Delete All</a>
          </div>
        </div>
        <div class="gut-hints-list" id="hints-list">
          ${map(Object.entries(hints), ([name, hint]) => raw(renderHintRow(name, hint)))}
        </div>
      </div>
    </div>
  `;
};
