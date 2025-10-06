import { html, map } from '../../template-engine.js';

export const TEMPLATE_LIST_HTML = (instance) =>
  Object.keys(instance.templates).length === 0
    ? html`<div style="padding: 20px; text-align: center; color: #888;">No templates found. Close this dialog and create a template first.</div>`
    : html`<div class="gut-template-list">
         ${map(Object.keys(instance.templates), (name) => html`
             <div class="gut-template-item">
               <span class="gut-template-name">${name}</span>
               <div class="gut-template-actions">
                 <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="edit" data-template="${name}">Edit</button>
                 <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="clone" data-template="${name}">Clone</button>
                 <button class="gut-btn gut-btn-danger gut-btn-small" data-action="delete" data-template="${name}">Delete</button>
               </div>
             </div>
           `)}
       </div>`;
