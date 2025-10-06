import { html } from '../../template-engine.js';

export const UNSAVED_CHANGES_CONFIRMATION_MODAL_HTML = () => {
  return html`
    <div class="gut-modal">
      <div class="gut-modal-content" style="max-width: 500px;">
        <div class="gut-modal-header">
          <h2>⚠️ Unsaved Changes</h2>
        </div>
        <div class="gut-modal-body">
          <p>You have unsaved changes. Are you sure you want to close without saving?</p>
        </div>
        <div class="gut-modal-footer">
          <button class="gut-btn" id="unsaved-keep-editing">Keep Editing</button>
          <button class="gut-btn gut-btn-danger" id="unsaved-discard">Discard Changes</button>
        </div>
      </div>
    </div>
  `;
};
