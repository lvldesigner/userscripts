import { HELP_TOOLTIPS } from './help-content.js';

let activeTooltip = null;
let tooltipTimeout = null;

export function initializeHelpTooltips() {
  document.addEventListener('mouseover', handleTooltipShow);
  document.addEventListener('mouseout', handleTooltipHide);
}

function handleTooltipShow(e) {
  const helpIcon = e.target.closest('.gut-help-icon');
  if (!helpIcon) return;
  
  const tooltipId = helpIcon.dataset.tooltip;
  if (!tooltipId || !HELP_TOOLTIPS[tooltipId]) return;
  
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    showTooltip(helpIcon, tooltipId);
  }, 300);
}

function handleTooltipHide(e) {
  const helpIcon = e.target.closest('.gut-help-icon');
  if (!helpIcon) return;
  
  clearTimeout(tooltipTimeout);
  
  setTimeout(() => {
    if (!document.querySelector('.gut-help-icon:hover')) {
      hideTooltip();
    }
  }, 100);
}

function showTooltip(anchorElement, tooltipId) {
  hideTooltip();
  
  const tooltipData = HELP_TOOLTIPS[tooltipId];
  if (!tooltipData) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'gut-help-tooltip';
  
  let html = '';
  if (tooltipData.title) {
    html += `<strong>${tooltipData.title}</strong>`;
  }
  html += tooltipData.content;
  
  tooltip.innerHTML = html;
  document.body.appendChild(tooltip);
  
  activeTooltip = tooltip;
  
  positionTooltip(tooltip, anchorElement);
  
  window.addEventListener('scroll', () => hideTooltip(), { once: true });
  window.addEventListener('resize', () => hideTooltip(), { once: true });
}

function positionTooltip(tooltip, anchor) {
  const anchorRect = anchor.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = anchorRect.left + (anchorRect.width / 2) - (tooltipRect.width / 2);
  let top = anchorRect.bottom + 8;
  
  if (left < 10) {
    left = 10;
  } else if (left + tooltipRect.width > viewportWidth - 10) {
    left = viewportWidth - tooltipRect.width - 10;
  }
  
  if (top + tooltipRect.height > viewportHeight - 10) {
    top = anchorRect.top - tooltipRect.height - 8;
  }
  
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
  clearTimeout(tooltipTimeout);
}

export function destroyHelpTooltips() {
  document.removeEventListener('mouseover', handleTooltipShow);
  document.removeEventListener('mouseout', handleTooltipHide);
  hideTooltip();
}
