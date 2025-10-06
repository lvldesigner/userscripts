import { html, raw, map } from '../../template-engine.js';

export const TEMPLATE_SELECTOR_HTML = (instance) => html`
  <option value="">Select Template</option>
  ${map(Object.keys(instance.templates), (name) => html`<option value="${name}" ${raw(name === instance.selectedTemplate ? "selected" : "")}>${name}</option>`)}
`;
