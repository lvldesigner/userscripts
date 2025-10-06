import { html, raw, map } from '../../template-engine.js';
import { HELP_ICON_HTML } from '../components/help-icon.js';

export const SANDBOX_TAB_HTML = (instance) => {
  const savedSets = instance.sandboxSets || {};
  const currentSet = instance.currentSandboxSet || "";

  return html`
    <div class="gut-tab-content" id="sandbox-tab">
      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <select id="sandbox-set-select" class="gut-select" style="flex: 1;">
            <option value="">New test set</option>
            ${map(Object.keys(savedSets), (name) => html`<option value="${name}" ${raw(name === currentSet ? "selected" : "")}>${name}</option>`)}
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
          <label for="sandbox-mask-input" style="margin-bottom: 0;">Mask: ${raw(HELP_ICON_HTML('mask-syntax'))}</label>
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
        <label for="sandbox-sample-input">Sample Torrent Names (one per line): ${raw(HELP_ICON_HTML('mask-sandbox'))}</label>
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
