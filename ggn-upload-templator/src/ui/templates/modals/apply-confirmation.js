import { html, raw, map } from '../../template-engine.js';

export const APPLY_CONFIRMATION_MODAL_HTML = (changes, instance) => {
  const changesCount = changes.length;
  const fieldWord = changesCount === 1 ? "field" : "fields";
  
  return html`
    <div class="gut-modal">
      <div class="gut-modal-content gut-confirmation-modal" style="max-width: 800px;">
        <div class="gut-modal-header">
          <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
          <h2>⚠️ Confirm Template Application</h2>
        </div>

        <div class="gut-modal-body">
          <div style="padding: 10px 12px; background: #4a3a2a; border-left: 3px solid #ff9800; margin-bottom: 12px; border-radius: 4px;">
            <p style="margin: 0; color: #e0e0e0; font-size: 13px;">
              <strong>Warning:</strong> ${changesCount} ${fieldWord} will be overwritten
            </p>
          </div>

          <div class="gut-field-changes-list">
            ${map(changes, change => html`
              <div class="gut-field-change-item">
                <div class="gut-field-change-row">
                  <div class="gut-field-name">
                    <strong title="${change.label || change.fieldName}">${change.label || change.fieldName}</strong>
                    <span class="gut-field-type-badge">${change.fieldType || 'text'}</span>
                  </div>
                  <div class="gut-field-values">
                    <span class="gut-value gut-value-old">${String(change.currentValue)}</span>
                    <span class="gut-value-arrow">→</span>
                    <span class="gut-value gut-value-new">${String(change.newValue)}</span>
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>

        <div class="gut-modal-footer">
          <button class="gut-btn" id="apply-confirm-cancel-btn">Cancel</button>
          <button class="gut-btn gut-btn-primary" id="apply-confirm-apply-btn">Apply Template</button>
        </div>
      </div>
    </div>
  `;
};
