import { html, raw, map } from '../../template-engine.js';

export const MAIN_UI_HTML = (instance) => html`
  <div id="ggn-upload-templator-controls" class="ggn-upload-templator-controls" style="align-items: flex-end;">
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <label for="template-selector" style="font-size: 12px; color: #b0b0b0; margin: 0;">Select template</label>
        <a href="#" id="edit-selected-template-btn" class="gut-link" style="${instance.selectedTemplate && instance.selectedTemplate !== "none" && instance.templates[instance.selectedTemplate] ? "" : "display: none;"}">Edit</a>
      </div>
       <div style="display: flex; gap: 10px; align-items: center;">
         <select id="template-selector" class="gut-select">
           <option value="">Select Template</option>
           ${map(Object.keys(instance.templates), (name) => html`<option value="${name}" ${raw(name === instance.selectedTemplate ? "selected" : "")}>${name}</option>`)}
         </select>
       </div>
    </div>
    <button type="button" id="apply-template-btn" class="gut-btn gut-btn-primary">Apply Template</button>
    <button type="button" id="create-template-btn" class="gut-btn gut-btn-primary">+ Create Template</button>
    <button id="manage-templates-btn" type="button" class="gut-btn gut-btn-secondary" title="Manage Templates & Settings">
      Manage
    </button>
  </div>
  <div id="variables-row" style="display: none; padding: 10px 0; font-size: 12px; cursor: pointer; user-select: none;"></div>
`;
