import { html } from '../../template-engine.js';

export const HELP_ICON_HTML = (tooltipKey, customClass = '') => {
  const classes = customClass ? `gut-help-icon ${customClass}` : 'gut-help-icon';
  return html`<span class="${classes}" data-tooltip="${tooltipKey}">?</span>`;
};
