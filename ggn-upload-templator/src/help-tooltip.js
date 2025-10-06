import { HELP_TOOLTIPS } from './help-content.js';
import { navigateToHelpSection } from './help-modal.js';

let activeTooltip = null;
let tooltipTimeout = null;
let hideTimeout = null;
let currentAnchor = null;
let visibilityCheckInterval = null;

export function initializeHelpTooltips() {
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);
  document.addEventListener('click', handleTooltipClick);
}

function handleMouseOver(e) {
  const helpIcon = e.target.closest('.gut-help-icon');
  const tooltip = e.target.closest('.gut-help-tooltip');
  
  if (tooltip || helpIcon) {
    clearTimeout(hideTimeout);
    clearTimeout(tooltipTimeout);
    
    if (helpIcon) {
      const tooltipId = helpIcon.dataset.tooltip;
      if (!tooltipId || !HELP_TOOLTIPS[tooltipId]) return;
      
      if (activeTooltip && currentAnchor !== helpIcon) {
        hideTooltip();
      }
      
      if (!activeTooltip) {
        tooltipTimeout = setTimeout(() => {
          showTooltip(helpIcon, tooltipId);
        }, 300);
      }
    }
  }
}

function handleMouseOut(e) {
  const helpIcon = e.target.closest('.gut-help-icon');
  const tooltip = e.target.closest('.gut-help-tooltip');
  
  if (tooltip || helpIcon) {
    clearTimeout(hideTimeout);
    clearTimeout(tooltipTimeout);
    
    hideTimeout = setTimeout(() => {
      const stillHoveringIcon = document.querySelector('.gut-help-icon:hover');
      const stillHoveringTooltip = document.querySelector('.gut-help-tooltip:hover');
      
      if (!stillHoveringIcon && !stillHoveringTooltip) {
        hideTooltip();
      }
    }, 300);
  }
}

function handleTooltipClick(e) {
  const helpIcon = e.target.closest('.gut-help-icon');
  if (!helpIcon) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const tooltipId = helpIcon.dataset.tooltip;
  if (!tooltipId || !HELP_TOOLTIPS[tooltipId]) return;
  
  const tooltipData = HELP_TOOLTIPS[tooltipId];
  const sectionId = tooltipData.helpSection || 'quick-start';
  
  hideTooltip();
  navigateToHelpSection(sectionId);
}

function showTooltip(anchorElement, tooltipId) {
  hideTooltip();
  
  const tooltipData = HELP_TOOLTIPS[tooltipId];
  if (!tooltipData) return;
  
  const tooltip = document.createElement('div');
  tooltip.className = 'gut-help-tooltip';
  
  let html = '';
  if (tooltipData.title) {
    html += `<strong>${tooltipData.title}</strong><br>`;
  }
  html += tooltipData.text || tooltipData.content || '';
  if (tooltipData.example) {
    html += `<br><em>Example: ${tooltipData.example}</em>`;
  }
  html += `<div class="gut-tooltip-help-link" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #444; font-size: 11px; color: #888;">Click for more help</div>`;
  
  tooltip.innerHTML = html;
  
  const helpLink = tooltip.querySelector('.gut-tooltip-help-link');
  if (helpLink) {
    helpLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sectionId = tooltipData.helpSection || 'quick-start';
      hideTooltip();
      navigateToHelpSection(sectionId);
    });
  }
  tooltip.style.userSelect = 'text';
  tooltip.style.cursor = 'auto';
  document.body.appendChild(tooltip);
  
  activeTooltip = tooltip;
  currentAnchor = anchorElement;
  
  positionTooltip(tooltip, anchorElement);
  
  window.addEventListener('scroll', () => hideTooltip(), { once: true });
  window.addEventListener('resize', () => hideTooltip(), { once: true });
  
  visibilityCheckInterval = setInterval(() => {
    if (!document.body.contains(currentAnchor) || !isElementVisible(currentAnchor)) {
      hideTooltip();
    }
  }, 100);
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

function isElementVisible(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && 
         window.getComputedStyle(element).visibility !== 'hidden' &&
         window.getComputedStyle(element).display !== 'none';
}

function hideTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
  currentAnchor = null;
  clearTimeout(tooltipTimeout);
  clearTimeout(hideTimeout);
  if (visibilityCheckInterval) {
    clearInterval(visibilityCheckInterval);
    visibilityCheckInterval = null;
  }
}

export function destroyHelpTooltips() {
  document.removeEventListener('mouseover', handleMouseOver);
  document.removeEventListener('mouseout', handleMouseOut);
  document.removeEventListener('click', handleTooltipClick);
  hideTooltip();
}
