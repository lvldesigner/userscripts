import { html, raw } from '../../template-engine.js';
import { TEMPLATE_LIST_HTML } from '../components/template-list.js';
import { HINTS_TAB_HTML } from '../tabs/hints-tab.js';
import { SANDBOX_TAB_HTML } from '../tabs/sandbox-tab.js';
import { HELP_ICON_HTML } from '../components/help-icon.js';

export const MODAL_HTML = (instance) => html`
  <div class="gut-modal">
    <div class="gut-modal-content">
    <div class="gut-modal-header">
      <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
      <div class="gut-modal-tabs">
        <button class="gut-tab-btn active" data-tab="templates">Templates</button>
        <button class="gut-tab-btn" data-tab="hints">Variable Hints</button>
        <button class="gut-tab-btn" data-tab="sandbox">Mask Sandbox</button>
        <button class="gut-tab-btn" data-tab="settings">Settings</button>
      </div>
    </div>

    <div class="gut-modal-body">
      <div class="gut-tab-content active" id="templates-tab">
      ${raw(TEMPLATE_LIST_HTML(instance))}
    </div>

    <div class="gut-tab-content" id="settings-tab">
      <div class="gut-form-group">
        <label for="setting-form-selector">Target Form Selector: ${raw(HELP_ICON_HTML('form-selector'))}</label>
        <input type="text" id="setting-form-selector" value="${instance.config.TARGET_FORM_SELECTOR}" placeholder="#upload_table">
      </div>

       <div class="gut-form-group">
         <div class="gut-keybinding-controls">
           <label class="gut-checkbox-label">
             <input type="checkbox" id="setting-submit-keybinding" ${raw(instance.config.SUBMIT_KEYBINDING ? "checked" : "")}>
             <span class="gut-checkbox-text">⚡ Enable form submission keybinding: <span class="gut-keybinding-text">${instance.config.CUSTOM_SUBMIT_KEYBINDING || "Ctrl+Enter"}</span></span>
           </label>
           <button type="button" id="record-submit-keybinding-btn" class="gut-btn gut-btn-secondary gut-btn-small">Record</button>
         </div>
         <input type="hidden" id="custom-submit-keybinding-input" value="${instance.config.CUSTOM_SUBMIT_KEYBINDING || "Ctrl+Enter"}">
       </div>

       <div class="gut-form-group">
         <div class="gut-keybinding-controls">
           <label class="gut-checkbox-label">
             <input type="checkbox" id="setting-apply-keybinding" ${raw(instance.config.APPLY_KEYBINDING ? "checked" : "")}>
             <span class="gut-checkbox-text">⚡ Enable apply template keybinding: <span class="gut-keybinding-text">${instance.config.CUSTOM_APPLY_KEYBINDING || "Ctrl+Shift+A"}</span></span>
           </label>
           <button type="button" id="record-apply-keybinding-btn" class="gut-btn gut-btn-secondary gut-btn-small">Record</button>
         </div>
         <input type="hidden" id="custom-apply-keybinding-input" value="${instance.config.CUSTOM_APPLY_KEYBINDING || "Ctrl+Shift+A"}">
       </div>

       <div class="gut-form-group">
         <div class="gut-keybinding-controls">
           <label class="gut-checkbox-label">
             <input type="checkbox" id="setting-help-keybinding" ${raw(instance.config.HELP_KEYBINDING ? "checked" : "")}>
             <span class="gut-checkbox-text">⚡ Enable help modal keybinding: <span class="gut-keybinding-text">${instance.config.CUSTOM_HELP_KEYBINDING || "?"}</span></span>
           </label>
           <button type="button" id="record-help-keybinding-btn" class="gut-btn gut-btn-secondary gut-btn-small">Record</button>
         </div>
         <input type="hidden" id="custom-help-keybinding-input" value="${instance.config.CUSTOM_HELP_KEYBINDING || "?"}">
       </div>

      <div class="gut-form-group">
        <label for="setting-custom-selectors">Custom Field Selectors (one per line): ${raw(HELP_ICON_HTML('custom-selectors'))}</label>
        <textarea id="setting-custom-selectors" rows="4" placeholder="div[data-field]\n.custom-input[name]\nbutton[data-value]">${(instance.config.CUSTOM_FIELD_SELECTORS || []).join("\n")}</textarea>
        <div style="font-size: 12px; color: #888; margin-top: 5px;">
          Additional CSS selectors to find form fields. e.g: <a href="#" id="ggn-infobox-link" class="gut-link">GGn Infobox</a>
        </div>
      </div>

      <div class="gut-form-group" id="custom-selectors-preview-group" style="display: none;">
        <label id="matched-elements-label">Matched Elements:</label>
        <div id="custom-selectors-matched" class="gut-extracted-vars">
          <div class="gut-no-variables">No elements matched by custom selectors.</div>
        </div>
      </div>

      <div class="gut-form-group">
        <label for="setting-ignored-fields">Ignored Fields (one per line): ${raw(HELP_ICON_HTML('ignored-fields'))}</label>
        <textarea id="setting-ignored-fields" rows="6" placeholder="linkgroup\ngroupid\napikey">${instance.config.IGNORED_FIELDS_BY_DEFAULT.join("\n")}</textarea>
      </div>

      <div class="gut-form-group">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 10px;">
            <button class="gut-btn gut-btn-primary" id="save-settings">Save Settings</button>
            <button class="gut-btn gut-btn-secondary" id="reset-settings">Reset to Defaults</button>
          </div>
          <button class="gut-btn gut-btn-danger" id="delete-all-config">Delete All Local Config</button>
        </div>
      </div>
    </div>

    ${raw(HINTS_TAB_HTML(instance))}

    ${raw(SANDBOX_TAB_HTML(instance))}
    </div>

    <div class="gut-modal-footer">
      <button class="gut-btn" id="close-manager">Close</button>
    </div>
    </div>
  </div>
`;
