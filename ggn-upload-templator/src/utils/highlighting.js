export function updateMaskHighlighting(maskInput, overlayDiv) {
  if (!maskInput || !overlayDiv) return;

  const text = maskInput.value;
  const varPattern = /\$\{([^}]*)\}?/g;
  let highlightedHTML = '';
  let lastIndex = 0;
  let match;

  while ((match = varPattern.exec(text)) !== null) {
    const beforeMatch = text.slice(lastIndex, match.index);
    highlightedHTML += escapeHtml(beforeMatch);

    const varName = match[1];
    const fullMatch = match[0];
    const isUnclosed = !fullMatch.endsWith('}');
    const isEmpty = varName.trim() === '';
    const isInvalid = varName && !/^[a-zA-Z0-9_]+$/.test(varName.trim());
    const isReserved = varName.trim().startsWith('_');

    let className = 'gut-highlight-variable';
    if (isUnclosed || isEmpty) {
      className = 'gut-highlight-error';
    } else if (isInvalid) {
      className = 'gut-highlight-error';
    } else if (isReserved) {
      className = 'gut-highlight-warning';
    }

    highlightedHTML += `<span class="${className}">${escapeHtml(fullMatch)}</span>`;
    lastIndex = match.index + fullMatch.length;
  }

  highlightedHTML += escapeHtml(text.slice(lastIndex));
  overlayDiv.innerHTML = highlightedHTML;

  overlayDiv.scrollTop = maskInput.scrollTop;
  overlayDiv.scrollLeft = maskInput.scrollLeft;
}

const ICON_ERROR = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const ICON_WARNING = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 5.5V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="10" r="0.5" fill="currentColor"/></svg>';
const ICON_INFO = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M7 6.5V10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="4.5" r="0.5" fill="currentColor"/></svg>';
const ICON_SUCCESS = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M4 7L6 9L10 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function renderStatusMessages(container, validation) {
  if (!container || !validation) return;

  const { errors, warnings, info, valid } = validation;
  const messages = [...errors, ...warnings, ...info];

  if (messages.length === 0 && valid) {
    container.innerHTML = `<div class="gut-status-message gut-status-info">${ICON_INFO} Add variables like \${name} to extract data.</div>`;
    container.classList.add('visible');
    return;
  }

  if (messages.length === 0) {
    container.innerHTML = '';
    container.classList.remove('visible');
    return;
  }

  const sortedMessages = messages.sort((a, b) => {
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position;
    }
    if (a.position !== undefined) return -1;
    if (b.position !== undefined) return 1;
    
    const priority = { error: 0, warning: 1, info: 2 };
    return priority[a.type] - priority[b.type];
  });

  const priorityMessage = sortedMessages.slice(0, 3);

  const html = priorityMessage.map(msg => {
    let className = 'gut-status-message';
    let icon = '';
    
    switch(msg.type) {
      case 'error':
        className += ' gut-status-error';
        icon = ICON_ERROR;
        break;
      case 'warning':
        className += ' gut-status-warning';
        icon = ICON_WARNING;
        break;
      case 'info':
        className += ' gut-status-info';
        icon = ICON_INFO;
        break;
    }

    return `<div class="${className}">${icon} ${escapeHtml(msg.message)}</div>`;
  }).join('');

  if (sortedMessages.length > 3) {
    const remaining = sortedMessages.length - 3;
    const remainingHtml = `<div class="gut-status-message gut-status-info">+ ${remaining} more message${remaining === 1 ? '' : 's'}</div>`;
    container.innerHTML = html + remainingHtml;
  } else {
    container.innerHTML = html;
  }

  container.classList.add('visible');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
