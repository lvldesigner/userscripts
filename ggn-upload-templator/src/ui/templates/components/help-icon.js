import { html } from '../../template-engine.js';

export const HELP_ICON_HTML = (tooltipKey) => {
  return html`<span class="gut-help-icon" data-tooltip="${tooltipKey}" title="Click for more help">ⓘ</span>`;
};
