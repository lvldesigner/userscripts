import { html } from '../../template-engine.js';

export const VARIABLES_MODAL_HTML = (instance) => html`
  <div class="gut-modal-content">
    <div class="gut-modal-header">
      <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
      <h2>Available Variables</h2>
    </div>

    <div class="gut-modal-body">
      <div class="gut-form-group">
        <div id="variables-results-container" class="gut-extracted-vars">
          <div class="gut-no-variables">No variables available. Select a template with a torrent name mask to see extracted variables.</div>
        </div>
      </div>
    </div>

    <div class="gut-modal-footer">
      <button class="gut-btn" id="close-variables-modal">Close</button>
    </div>
  </div>
`;
