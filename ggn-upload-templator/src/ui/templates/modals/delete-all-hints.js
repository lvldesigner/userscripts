import { html } from '../../template-engine.js';

export const DELETE_ALL_HINTS_MODAL_HTML = (instance) => {
  return html`
    <div class="gut-modal">
      <div class="gut-modal-content" style="max-width: 500px;">
        <div class="gut-modal-header">
          <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
          <h2>Delete All Hints</h2>
        </div>

        <div class="gut-modal-body">
          <div style="padding: 12px; background: #4a2a2a; border-left: 3px solid #f44336; margin-bottom: 16px; border-radius: 4px;">
            <strong style="color: #f44336;">⚠ Critical Warning</strong>
            <p style="margin: 8px 0 0 0; color: #b0b0b0; font-size: 13px;">
              This will permanently delete <strong>ALL</strong> variable hints, including:
            </p>
            <ul style="margin: 8px 0 0 20px; color: #b0b0b0; font-size: 13px;">
              <li>All default hints</li>
              <li>All custom hints you've created</li>
              <li>All edited hints</li>
            </ul>
            <p style="margin: 8px 0 0 0; color: #b0b0b0; font-size: 13px;">
              <strong>This action cannot be undone.</strong> You can restore default hints later, but custom hints will be lost forever.
            </p>
          </div>

          <div style="padding: 12px; background: #1a1a1a; border-radius: 4px;">
            <p style="margin: 0; color: #b0b0b0; font-size: 13px;">
              Are you absolutely sure you want to delete all hints?
            </p>
          </div>
        </div>

        <div class="gut-modal-footer">
          <button class="gut-btn" id="delete-all-hints-cancel-btn">Cancel</button>
          <button class="gut-btn gut-btn-danger" id="delete-all-hints-confirm-btn">Delete All Hints</button>
        </div>
      </div>
    </div>
  `;
};
