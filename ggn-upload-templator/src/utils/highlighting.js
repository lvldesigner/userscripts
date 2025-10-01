export function updateMaskHighlighting(maskInput, overlayDiv) {
  if (!maskInput || !overlayDiv) return;

  const text = maskInput.value;
  const varPattern = /\$\{([^}]*)\}?/g;
  
  const optionalBlocks = findOptionalBlocks(text);
  const nestedOptionalErrors = findNestedOptionalErrors(text);
  const varMatches = [];
  let match;
  
  while ((match = varPattern.exec(text)) !== null) {
    varMatches.push({ match, index: match.index });
  }
  
  let highlightedHTML = buildLayeredHighlighting(text, optionalBlocks, varMatches, nestedOptionalErrors);
  overlayDiv.innerHTML = highlightedHTML;

  overlayDiv.scrollTop = maskInput.scrollTop;
  overlayDiv.scrollLeft = maskInput.scrollLeft;
}

function buildLayeredHighlighting(text, optionalBlocks, varMatches, nestedOptionalErrors) {
  let result = '';
  let pos = 0;
  
  const segments = [];
  
  for (let i = 0; i < text.length; i++) {
    const inOptional = optionalBlocks.find(block => i >= block.start && i < block.end);
    const varMatch = varMatches.find(v => i >= v.index && i < v.index + v.match[0].length);
    const inNestedError = nestedOptionalErrors.find(err => i >= err.start && i < err.end);
    
    const currentSegment = segments[segments.length - 1];
    
    if (currentSegment && 
        currentSegment.inOptional === !!inOptional && 
        currentSegment.varMatch === varMatch &&
        currentSegment.inNestedError === !!inNestedError) {
      currentSegment.end = i + 1;
    } else {
      segments.push({
        start: i,
        end: i + 1,
        inOptional: !!inOptional,
        varMatch: varMatch,
        inNestedError: !!inNestedError
      });
    }
  }
  
  for (const segment of segments) {
    const content = text.slice(segment.start, segment.end);
    let html = escapeHtml(content);
    
    if (segment.inNestedError) {
      if (segment.inOptional) {
        html = `<span class="gut-highlight-optional"><span class="gut-highlight-error">${html}</span></span>`;
      } else {
        html = `<span class="gut-highlight-error">${html}</span>`;
      }
    } else if (segment.varMatch) {
      const varName = segment.varMatch.match[1];
      const fullMatch = segment.varMatch.match[0];
      const isUnclosed = !fullMatch.endsWith('}');
      const isEmpty = varName.trim() === '';
      const isInvalid = varName && !/^[a-zA-Z0-9_]+$/.test(varName.trim());
      const isReserved = varName.trim().startsWith('_');

      let varClass = 'gut-highlight-variable';
      if (isUnclosed || isEmpty) {
        varClass = 'gut-highlight-error';
      } else if (isInvalid) {
        varClass = 'gut-highlight-error';
      } else if (isReserved) {
        varClass = 'gut-highlight-warning';
      }
      
      if (segment.inOptional) {
        html = `<span class="gut-highlight-optional"><span class="${varClass}">${html}</span></span>`;
      } else {
        html = `<span class="${varClass}">${html}</span>`;
      }
    } else if (segment.inOptional) {
      html = `<span class="gut-highlight-optional">${html}</span>`;
    }
    
    result += html;
  }
  
  return result;
}

function findOptionalBlocks(text) {
  const blocks = [];
  let i = 0;
  
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      i += 2;
      continue;
    }
    
    if (text[i] === '{' && text[i + 1] === '?') {
      const start = i;
      i += 2;
      let depth = 1;
      
      while (i < text.length && depth > 0) {
        if (text[i] === '\\' && i + 1 < text.length) {
          i += 2;
          continue;
        }
        
        if (text[i] === '{' && text[i + 1] === '?') {
          depth++;
          i += 2;
        } else if (text[i] === '?' && text[i + 1] === '}') {
          depth--;
          if (depth === 0) {
            i += 2;
            blocks.push({ start, end: i });
            break;
          }
          i += 2;
        } else {
          i++;
        }
      }
      
      if (depth > 0) {
        blocks.push({ start, end: text.length });
      }
    } else {
      i++;
    }
  }
  
  return blocks;
}

function findNestedOptionalErrors(text) {
  const errors = [];
  let i = 0;
  let inOptional = false;
  
  while (i < text.length) {
    if (text[i] === '\\' && i + 1 < text.length) {
      i += 2;
      continue;
    }
    
    if (text[i] === '{' && text[i + 1] === '?') {
      if (inOptional) {
        const nestedStart = i;
        i += 2;
        
        let nestedEnd = i;
        while (nestedEnd < text.length) {
          if (text[nestedEnd] === '\\' && nestedEnd + 1 < text.length) {
            nestedEnd += 2;
            continue;
          }
          
          if (text[nestedEnd] === '?' && text[nestedEnd + 1] === '}') {
            nestedEnd += 2;
            break;
          }
          
          nestedEnd++;
        }
        
        errors.push({ start: nestedStart, end: nestedEnd });
        continue;
      }
      inOptional = true;
      i += 2;
      continue;
    }
    
    if (text[i] === '?' && text[i + 1] === '}') {
      inOptional = false;
      i += 2;
      continue;
    }
    
    i++;
  }
  
  return errors;
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
