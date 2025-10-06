export function html(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    if (value === undefined) return result + str;
    
    if (value && typeof value === 'object' && value.__html !== undefined) {
      return result + str + value.__html;
    }
    
    if (typeof value === 'string') {
      return result + str + escapeHtml(value);
    }
    
    if (typeof value === 'boolean') {
      return result + str + (value ? 'true' : 'false');
    }
    
    if (typeof value === 'number') {
      return result + str + String(value);
    }
    
    return result + str + String(value);
  }, '');
}

export function raw(htmlString) {
  return { __html: htmlString, toString: () => htmlString };
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function map(array, fn) {
  if (!array || !Array.isArray(array)) return raw('');
  return raw(array.map(fn).join(''));
}

export function when(condition, truthyValue, falsyValue = '') {
  return condition ? truthyValue : falsyValue;
}

export function join(array, separator = '') {
  if (!array || !Array.isArray(array)) return raw('');
  return raw(array.join(separator));
}
