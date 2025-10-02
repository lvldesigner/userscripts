/**
 * ============================================================================
 * TEMPLATE PARSER & REGEX COMPILER
 * ============================================================================
 * 
 * Converts user-friendly templates like "\${show} - S\${season:##}E\${episode:##}"
 * into regex patterns that extract structured data from torrent filenames.
 * 
 * CORE FEATURES:
 * - Variables: \${varName} or \${varName:hint}
 * - Optional blocks: {?optional content with \${vars}?}
 * - Hints: validation/transformation patterns (regex, simple patterns, maps)
 * - Smart boundary detection: figures out where variables end without explicit delimiters
 * 
 * COMPILATION FLOW:
 * 1. Parse template structure (identify optionals vs required parts)
 * 2. Escape special chars and replace variables with placeholders
 * 3. Generate capture groups with boundary detection
 * 4. Replace placeholders with actual capture groups
 * 5. Restore escaped characters
 * 
 * KNOWN EDGE CASES & LIMITATIONS:
 * - Adjacent variables without delimiters produce arbitrary splits
 *   Fix: Add hints like variable1:letters and variable2:numbers
 * 
 * - Variable content contains the boundary character
 *   Fix: Use complex regex hint to match content properly
 * 
 * - Nested optional blocks are forbidden
 *   Fix: Flatten structure or use multiple templates
 * 
 * - Optional at end before last variable may cause greedy matching issues
 *   → Fix: Add hint to last variable to constrain it
 * 
 * For maintainers: This is a heuristic system optimized for common torrent naming 
 * patterns. Edge cases require explicit hints to disambiguate.
 * ============================================================================
 */

const MAX_VARIABLE_NAME_LENGTH = 50;

/**
 * Splits "${varName:hint}" into separate components
 * Example: "season:##+" → {varName: "season", hint: "##+"} 
 */
export function parseVariableWithHint(varString) {
  const colonIndex = varString.indexOf(':');
  if (colonIndex === -1) {
    return { varName: varString, hint: null };
  }
  return {
    varName: varString.substring(0, colonIndex),
    hint: varString.substring(colonIndex + 1)
  };
}

/**
 * Parses hint syntax into typed objects
 * Hint types:
 * - regex: /\d{4}/ → Raw regex pattern
 * - pattern: ##, @@, *, ? → Simple pattern syntax (converted to regex)
 * - map: Named hint with value mappings (e.g., "1080p" → "Full HD")
 * - unknown: Unrecognized hint (treated as literal pattern)
 */
export function parseHint(hintString, availableHints = {}) {
  if (!hintString) {
    return { type: 'none', data: null };
  }

  if (hintString.startsWith('/')) {
    const regexPattern = hintString.slice(1).replace(/\/$/, '');
    return { type: 'regex', data: regexPattern };
  }

  if (/[*#@?]/.test(hintString)) {
    return { type: 'pattern', data: hintString };
  }

  const namedHint = availableHints[hintString];
  if (namedHint) {
    return { type: namedHint.type, data: namedHint };
  }

  return { type: 'unknown', data: hintString };
}

export function compileHintToRegex(hint, availableHints = {}) {
  const parsed = parseHint(hint, availableHints);
  
  switch (parsed.type) {
    case 'regex':
      return typeof parsed.data === 'string' ? parsed.data : parsed.data.pattern;
    
    case 'pattern':
      return compileSimplePattern(parsed.data);
    
    case 'map':
      const mappings = typeof parsed.data === 'object' && parsed.data.mappings 
        ? parsed.data.mappings 
        : parsed.data;
      const keys = Object.keys(mappings || {});
      if (keys.length === 0) return '.+';
      const escapedKeys = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      return `(?:${escapedKeys.join('|')})`;
    
    case 'unknown':
    case 'none':
    default:
      return null;
  }
}

function escapeSpecialChars(text) {
  return text
    .replace(/\\\$/g, "___ESCAPED_DOLLAR___")
    .replace(/\\\{/g, "___ESCAPED_LBRACE___")
    .replace(/\\\}/g, "___ESCAPED_RBRACE___")
    .replace(/\\\\/g, "___ESCAPED_BACKSLASH___");
}

function unescapeSpecialChars(text) {
  return text
    .replace(/___ESCAPED_DOLLAR___/g, "\\$")
    .replace(/___ESCAPED_LBRACE___/g, "\\{")
    .replace(/___ESCAPED_RBRACE___/g, "\\}")
    .replace(/___ESCAPED_BACKSLASH___/g, "\\\\");
}

function extractVariablePlaceholders(text, startIndex = 0) {
  const variablePlaceholders = [];
  let placeholderIndex = startIndex;
  
  const result = text.replace(/\$\{([^}]+)\}/g, (match, varString) => {
    const placeholder = `___VAR_PLACEHOLDER_${placeholderIndex}___`;
    variablePlaceholders.push({ placeholder, varString, match });
    placeholderIndex++;
    return placeholder;
  });
  
  return { result, variablePlaceholders };
}

/**
 * Converts simple pattern syntax to regex
 * Pattern syntax:
 * - * → .*? (any characters, non-greedy)
 * - # or ## or #+ → \d or \d{n} or \d+ (digits)
 * - @ or @@ or @+ → [a-zA-Z] or [a-zA-Z]{n} or [a-zA-Z]+ (letters)
 * - ? → . (any single character)
 * - Other chars → Escaped as literals
 */
function compileSimplePattern(pattern) {
  let regex = '';
  let i = 0;
  
  while (i < pattern.length) {
    const char = pattern[i];
    const nextChar = pattern[i + 1];
    
    if (char === '*') {
      regex += '.*?';
      i++;
    } else if (char === '#') {
      if (nextChar === '+') {
        regex += '\\d+';
        i += 2;
      } else {
        let count = 1;
        while (pattern[i + count] === '#') {
          count++;
        }
        if (count > 1) {
          regex += `\\d{${count}}`;
          i += count;
        } else {
          regex += '\\d';
          i++;
        }
      }
    } else if (char === '@') {
      if (nextChar === '+') {
        regex += '[a-zA-Z]+';
        i += 2;
      } else {
        let count = 1;
        while (pattern[i + count] === '@') {
          count++;
        }
        if (count > 1) {
          regex += `[a-zA-Z]{${count}}`;
          i += count;
        } else {
          regex += '[a-zA-Z]';
          i++;
        }
      }
    } else if (char === '?') {
      regex += '.';
      i++;
    } else {
      regex += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      i++;
    }
  }
  
  return regex;
}

function determineCaptureGroup(varName, hint, isLastVariable, afterPlaceholder, availableHints = {}) {
  const hintPattern = hint ? compileHintToRegex(hint, availableHints) : null;
  
  if (hintPattern) {
    return `(?<${varName}>${hintPattern})`;
  }
  
  if (isLastVariable || !afterPlaceholder) {
    return `(?<${varName}>.+)`;
  }
  
  const nextTwoChars = afterPlaceholder.substring(0, 2);
  const nextChar = nextTwoChars[0];
  
  if (nextChar === ' ') {
    const afterSpace = afterPlaceholder.substring(1);
    const boundaryMatch = afterSpace.match(/^(\\?.)/);
    const boundaryChar = boundaryMatch ? boundaryMatch[1] : null;
    
    if (boundaryChar && boundaryChar.startsWith('\\') && boundaryChar.length === 2) {
      const actualChar = boundaryChar[1];
      if (actualChar === ']') {
        return `(?<${varName}>[^\\]]+)`;
      }
      return `(?<${varName}>[^\\${actualChar}]+)`;
    }
    if (boundaryChar) {
      return `(?<${varName}>[^${boundaryChar}]+)`;
    }
    return `(?<${varName}>[^ ]+)`;
  }
  
  if (nextTwoChars.startsWith('\\') && nextTwoChars.length >= 2) {
    const escapedChar = nextTwoChars[1];
    if (escapedChar === ']') {
      return `(?<${varName}>[^\\]]+)`;
    }
    if (escapedChar === '[' || escapedChar === '(' || escapedChar === ')' || escapedChar === '.' || escapedChar === '-' || escapedChar === '_') {
      return `(?<${varName}>[^\\${escapedChar}]+)`;
    }
  }
  
  return `(?<${varName}>.+?)`;
}

function determineCaptureGroupWithOptionals(varName, hint, isLastVariable, afterPlaceholder, availableHints = {}) {
  const hintPattern = hint ? compileHintToRegex(hint, availableHints) : null;
  
  if (hintPattern) {
    return `(?<${varName}>${hintPattern})`;
  }
  
  if (isLastVariable || !afterPlaceholder) {
    return `(?<${varName}>.+)`;
  }
  
  const nextFourChars = afterPlaceholder.substring(0, 4);
  const nextTwoChars = afterPlaceholder.substring(0, 2);
  
  const atEndOfOptional = nextTwoChars === ')?';
  
  if (atEndOfOptional) {
    const afterOptional = afterPlaceholder.substring(2);
    if (afterOptional.startsWith('(?:')) {
      const nextOptionalMatch = afterOptional.match(/^\(\?:\(\?<_opt\d+>\)(.+?)\)\?/);
      if (nextOptionalMatch) {
        const nextOptionalContent = nextOptionalMatch[1];
        const literalMatch = nextOptionalContent.match(/^([^_]+?)___VAR/);
        const firstLiteral = literalMatch ? literalMatch[1] : nextOptionalContent;
        
        if (firstLiteral && firstLiteral.trim()) {
          const escapedLiteral = firstLiteral.replace(/\\/g, '\\');
          return `(?<${varName}>(?:(?!${escapedLiteral}).)+)`;
        }
      }
    }
    return `(?<${varName}>.+)`;
  }
  
  if (nextFourChars.startsWith('(?:')) {
    const boundaries = [];
    let remaining = afterPlaceholder;
    
    while (remaining.startsWith('(?:')) {
      const optionalMatch = remaining.match(/^\(\?:\(\?<_opt\d+>\)(.+?)\)\?/);
      if (optionalMatch) {
        const optionalContent = optionalMatch[1];
        const literalMatch = optionalContent.match(/^([^_]+?)___VAR/);
        const firstLiteral = literalMatch ? literalMatch[1] : optionalContent.substring(0, 10);
        
        if (firstLiteral && firstLiteral.trim()) {
          boundaries.push(firstLiteral.replace(/\\/g, '\\'));
        }
        
        remaining = remaining.substring(optionalMatch[0].length);
      } else {
        break;
      }
    }
    
    if (boundaries.length > 0) {
      const lookaheads = boundaries.map(b => `(?!${b})`).join('');
      return `(?<${varName}>(?:${lookaheads}.)+)`;
    }
    return `(?<${varName}>.+?)`;
  }
  
  return determineCaptureGroup(varName, hint, false, afterPlaceholder, availableHints);
}

/**
 * Applies value transformations using map hints
 * If a variable has a map hint, transforms extracted values through the mapping.
 * Example: With hint "qualityMap" mapping {"1080p": "Full HD"}, 
 *          extracted value "1080p" becomes "Full HD"
 */
export function applyValueMap(variables, mask, availableHints = {}) {
  const mapped = {};
  const varPattern = /\$\{([^}]+)\}/g;
  let match;
  
  while ((match = varPattern.exec(mask)) !== null) {
    const { varName, hint } = parseVariableWithHint(match[1]);
    
    if (hint && variables[varName] !== undefined) {
      const parsed = parseHint(hint, availableHints);
      
      if (parsed.type === 'map' && parsed.data.mappings) {
        const mappedValue = parsed.data.mappings[variables[varName]];
        if (mappedValue !== undefined) {
          mapped[varName] = mappedValue;
        } else if (parsed.data.strict === false) {
          mapped[varName] = variables[varName];
        }
      } else {
        mapped[varName] = variables[varName];
      }
    } else if (variables[varName] !== undefined) {
      mapped[varName] = variables[varName];
    }
  }
  
  return mapped;
}

/**
 * Compiles template mask to regex pattern (simple templates only)
 * 
 * For templates with optional blocks, use compileMaskToRegexPatternWithOptionals instead.
 * This function is used as a fallback when optional parsing fails.
 * 
 * BOUNDARY DETECTION STRATEGY:
 * Without hints, we need to infer where each variable ends by looking at what follows it.
 * 
 * Problem: Template "${show}.${year}" could match "Breaking.Bad.2008" incorrectly as:
 *   show="Breaking.Bad.200" year="8" (greedy .+ eats too much)
 * 
 * Solutions by context:
 * 1. Last variable: Use greedy .+ (nothing after to conflict with)
 * 2. Followed by punctuation (. - _): Use negated char class [^X]+ (stop at boundary)
 * 3. Followed by space then punctuation: Look past space to real boundary
 * 4. Uncertain: Use non-greedy .+? (match as little as possible)
 * 
 * This is heuristic-based and can fail if variable content contains the boundary character.
 * Users should add hints for ambiguous cases to constrain variable matching.
 */
function compileMaskToRegexPattern(mask, useNonGreedy = true, availableHints = {}) {
  let regexPattern = escapeSpecialChars(mask);
  const { result, variablePlaceholders } = extractVariablePlaceholders(regexPattern);
  regexPattern = result;

  regexPattern = regexPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  for (let i = 0; i < variablePlaceholders.length; i++) {
    const { placeholder, varString } = variablePlaceholders[i];
    const { varName, hint } = parseVariableWithHint(varString);
    
    const isLastVariable = i === variablePlaceholders.length - 1;
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const placeholderPos = regexPattern.indexOf(escapedPlaceholder);
    const afterPlaceholder = regexPattern.substring(placeholderPos + escapedPlaceholder.length);
    
    const captureGroup = determineCaptureGroup(varName, hint, isLastVariable, afterPlaceholder, availableHints);
    regexPattern = regexPattern.replace(escapedPlaceholder, captureGroup);
  }

  regexPattern = unescapeSpecialChars(regexPattern);

  return regexPattern;
}

export function parseTemplate(mask, torrentName, useNonGreedy = true, availableHints = {}) {
  if (!mask || !torrentName) return {};

  const regexPattern = compileMaskToRegexPattern(mask, useNonGreedy, availableHints);

  try {
    const regex = new RegExp(regexPattern, "i");
    const match = torrentName.match(regex);
    const extracted = match?.groups || {};
    
    return applyValueMap(extracted, mask, availableHints);
  } catch (e) {
    console.warn("Invalid template regex:", e);
    return {};
  }
}

export function validateMaskVariables(mask) {
  if (!mask) return { valid: true, invalidVars: [] };
  
  const invalidVars = [];
  const varPattern = /\$\{([^}]+)\}/g;
  let match;
  
  while ((match = varPattern.exec(mask)) !== null) {
    const { varName } = parseVariableWithHint(match[1]);
    if (varName.startsWith('_')) {
      invalidVars.push(varName);
    }
  }
  
  return {
    valid: invalidVars.length === 0,
    invalidVars
  };
}

export function validateMaskWithDetails(mask, availableHints = {}) {
  if (!mask) {
    return {
      valid: true,
      errors: [],
      warnings: [],
      info: [],
      variables: { valid: [], invalid: [], reserved: [] }
    };
  }

  const errors = [];
  const warnings = [];
  const info = [];
  const validVars = [];
  const invalidVars = [];
  const reservedVars = [];
  const seenVars = new Set();
  const duplicates = new Set();

  try {
    const parsed = parseMaskStructure(mask);
    
    if (parsed.optionalCount > 0) {
      info.push({ type: 'info', message: `${parsed.optionalCount} optional block${parsed.optionalCount === 1 ? '' : 's'} defined` });
    }
  } catch (e) {
    const posMatch = e.message.match(/position (\d+)/);
    const position = posMatch ? parseInt(posMatch[1], 10) : 0;
    const rangeEnd = e.rangeEnd !== undefined ? e.rangeEnd : position + 2;
    errors.push({ type: 'error', message: e.message, position, rangeEnd });
  }

  const unclosedPattern = /\$\{[^}]*$/;
  if (unclosedPattern.test(mask)) {
    const position = mask.lastIndexOf('${');
    const rangeEnd = mask.length;
    errors.push({ type: 'error', message: 'Unclosed variable: missing closing brace "}"', position, rangeEnd });
  }

  const emptyVarPattern = /\$\{\s*\}/g;
  let emptyMatch;
  while ((emptyMatch = emptyVarPattern.exec(mask)) !== null) {
    const position = emptyMatch.index;
    const rangeEnd = position + emptyMatch[0].length;
    errors.push({ type: 'error', message: 'Empty variable: ${}', position, rangeEnd });
  }

  const nestedPattern = /\$\{[^}]*\$\{/g;
  let nestedMatch;
  while ((nestedMatch = nestedPattern.exec(mask)) !== null) {
    const position = nestedMatch.index;
    const rangeEnd = nestedMatch.index + nestedMatch[0].length;
    errors.push({ type: 'error', message: 'Nested braces are not allowed', position, rangeEnd });
  }

  const varPattern = /\$\{([^}]+)\}/g;
  let match;
  const varPositions = new Map();
  
  while ((match = varPattern.exec(mask)) !== null) {
    const fullVarString = match[1];
    const { varName, hint } = parseVariableWithHint(fullVarString);
    const position = match.index;

    if (fullVarString !== fullVarString.trim()) {
      warnings.push({ type: 'warning', message: `Variable "\${${fullVarString}}" has leading or trailing whitespace`, position });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(varName)) {
      invalidVars.push(varName);
      const rangeEnd = position + match[0].length;
      errors.push({ type: 'error', message: `Invalid variable name "\${${varName}}": only letters, numbers, and underscores allowed`, position, rangeEnd });
      continue;
    }

    if (varName.startsWith('_')) {
      reservedVars.push(varName);
      warnings.push({ type: 'warning', message: `Variable "\${${varName}}" uses reserved prefix "_" (reserved for comment variables)`, position });
      continue;
    }

    if (hint) {
      const parsed = parseHint(hint, availableHints);
      if (parsed.type === 'unknown') {
        warnings.push({ type: 'warning', message: `Unknown hint "${hint}" for variable "\${${varName}}" - will be treated as literal pattern`, position });
      } else if (parsed.type === 'regex') {
        try {
          new RegExp(parsed.data);
        } catch (e) {
          errors.push({ type: 'error', message: `Invalid regex pattern in hint for "\${${varName}}": ${e.message}`, position, rangeEnd: position + match[0].length });
        }
      }
    }

    if (/^\d/.test(varName)) {
      warnings.push({ type: 'warning', message: `Variable "\${${varName}}" starts with a number (potentially confusing)`, position });
    }

    if (varName.length > MAX_VARIABLE_NAME_LENGTH) {
      warnings.push({ type: 'warning', message: `Variable "\${${varName}}" is very long (${varName.length} characters)`, position });
    }

    if (seenVars.has(varName)) {
      duplicates.add(varName);
      if (!varPositions.has(varName)) {
        varPositions.set(varName, position);
      }
    } else {
      seenVars.add(varName);
      varPositions.set(varName, position);
    }

    validVars.push(varName);
  }

  if (duplicates.size > 0) {
    const firstDuplicatePos = Math.min(...Array.from(duplicates).map(v => varPositions.get(v)));
    warnings.push({ type: 'warning', message: `Duplicate variables: ${Array.from(duplicates).map(v => `\${${v}}`).join(', ')}`, position: firstDuplicatePos });
  }

  const totalVars = validVars.length + reservedVars.length;
  if (totalVars > 0) {
    info.push({ type: 'info', message: `${totalVars} variable${totalVars === 1 ? '' : 's'} defined` });
  }

  if (totalVars === 0 && mask.length > 0) {
    info.push({ type: 'info', message: 'No variables defined. Add variables like ${name} to extract data.' });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    variables: { valid: validVars, invalid: invalidVars, reserved: reservedVars }
  };
}

// Interpolate template string with extracted data
export function interpolate(template, data, commentVariables = {}) {
  if (!template) return template;
  const allData = { ...data, ...commentVariables };
  return template.replace(/\$\{([^}]+)\}/g, (match, key) => {
    const value = allData[key];
    return value !== undefined && value !== null && value !== '' ? value : '';
  });
}

// Find matching option based on variable value and match type
export function findMatchingOption(options, variableValue, matchType) {
  if (!options || !variableValue) return null;

  const normalizedValue = variableValue.toLowerCase();

  for (const option of options) {
    const optionText = option.textContent
      ? option.textContent.toLowerCase()
      : option.text.toLowerCase();
    const optionValue = option.value.toLowerCase();

    let matches = false;
    switch (matchType) {
      case "exact":
        matches =
          optionText === normalizedValue || optionValue === normalizedValue;
        break;
      case "contains":
        matches =
          optionText.includes(normalizedValue) ||
          optionValue.includes(normalizedValue);
        break;
      case "starts":
        matches =
          optionText.startsWith(normalizedValue) ||
          optionValue.startsWith(normalizedValue);
        break;
      case "ends":
        matches =
          optionText.endsWith(normalizedValue) ||
          optionValue.endsWith(normalizedValue);
        break;
    }

    if (matches) {
      return {
        value: option.value,
        text: option.textContent || option.text,
      };
    }
  }

  return null;
}



/**
 * Parses template structure to identify optional blocks
 * 
 * Optional block syntax: {?content?}
 * Example: "${show}{?[${version}]?}{?${extra}?}"
 * 
 * Returns: { 
 *   parts: [{type: 'required', content: '...'}, {type: 'optional', content: '...'}],
 *   optionalCount: 2 
 * }
 * 
 * Limitations:
 * - Nested optionals are forbidden (throws error)
 * - Maximum 8 optional blocks per template
 */
export function parseMaskStructure(mask) {
  if (!mask) {
    return { parts: [], optionalCount: 0 };
  }

  const parts = [];
  let current = '';
  let i = 0;
  let optionalCount = 0;
  let inOptional = false;
  let optionalStart = -1;
  
  while (i < mask.length) {
    if (mask[i] === '\\' && i + 1 < mask.length) {
      current += mask.slice(i, i + 2);
      i += 2;
      continue;
    }
    
    if (mask[i] === '{' && mask[i + 1] === '?') {
      if (inOptional) {
        let nestedEnd = i + 2;
        while (nestedEnd < mask.length) {
          if (mask[nestedEnd] === '\\' && nestedEnd + 1 < mask.length) {
            nestedEnd += 2;
            continue;
          }
          if (mask[nestedEnd] === '?' && mask[nestedEnd + 1] === '}') {
            nestedEnd += 2;
            break;
          }
          nestedEnd++;
        }
        const error = new Error(`Nested optional blocks not allowed at position ${i}`);
        error.rangeEnd = nestedEnd;
        throw error;
      }
      
      if (current) {
        parts.push({ type: 'required', content: current });
        current = '';
      }
      
      inOptional = true;
      optionalStart = i;
      i += 2;
      continue;
    }
    
    if (mask[i] === '?' && mask[i + 1] === '}' && inOptional) {
      if (current.trim() === '') {
        throw new Error(`Empty optional block at position ${optionalStart}`);
      }
      
      parts.push({ type: 'optional', content: current });
      current = '';
      inOptional = false;
      optionalCount++;
      i += 2;
      continue;
    }
    
    current += mask[i];
    i++;
  }
  
  if (inOptional) {
    throw new Error(`Unclosed optional block starting at position ${optionalStart}`);
  }
  
  if (current) {
    parts.push({ type: 'required', content: current });
  }
  
  return { parts, optionalCount };
}



/**
 * Primary template parsing function (supports optional blocks)
 * 
 * Extracts variables from torrentName using the template mask.
 * Returns extracted variables plus metadata about which optional blocks matched.
 * 
 * SENTINEL TRACKING:
 * Optional blocks are compiled with marker groups: (?:(?<_opt0>)content)?
 * The empty (?<_opt0>) group exists if the optional matched, undefined if not.
 * This distinguishes "optional didn't match" from "optional matched but variable is empty".
 * 
 * Example: {?[${version}]?} against "Movie.mkv" vs "Movie.[].mkv" vs "Movie.[Remastered].mkv"
 *   Case 1: _opt0=undefined, version=undefined (optional didn't match)
 *   Case 2: _opt0="", version="" (optional matched, empty variable) 
 *   Case 3: _opt0="", version="Remastered" (optional matched with content)
 */
export function parseTemplateWithOptionals(mask, torrentName, availableHints = {}) {
  if (!mask || !torrentName) return {};

  try {
    const parsed = parseMaskStructure(mask);
    
    const regexPattern = compileUserMaskToRegex(mask, availableHints);
    const regex = new RegExp(regexPattern, "i");
    const match = torrentName.match(regex);
    
    if (!match) return {};
    
    const extracted = match.groups || {};
    
    const matchedOptionals = [];
    if (parsed.optionalCount > 0) {
      for (let i = 0; i < parsed.optionalCount; i++) {
        const markerKey = `_opt${i}`;
        matchedOptionals.push(extracted[markerKey] !== undefined);
        delete extracted[markerKey];
      }
    }
    
    const result = applyValueMap(extracted, mask, availableHints);
    
    if (parsed.optionalCount > 0) {
      result._matchedOptionals = matchedOptionals;
      result._optionalCount = parsed.optionalCount;
    }
    
    return result;
  } catch (e) {
    console.warn("Invalid template with optionals:", e);
    return {};
  }
}

export function compileUserMaskToRegex(mask, availableHints = {}) {
  if (!mask) return "";
  
  try {
    const parsed = parseMaskStructure(mask);
    
    if (parsed.optionalCount === 0) {
      return compileMaskToRegexPattern(mask, true, availableHints);
    }
    
    const regexPattern = compileMaskToRegexPatternWithOptionals(parsed, availableHints);
    return regexPattern;
  } catch (e) {
    return compileMaskToRegexPattern(mask, true, availableHints);
  }
}

/**
 * Compiles template mask with optional blocks to regex pattern
 * 
 * OPTIONAL BLOCK COMPILATION:
 * Each optional block becomes: (?:(?<_optN>)content)?
 * - (?:...) = Non-capturing group (the optional itself)
 * - (?<_optN>) = Empty named capture "sentinel" - marks that optional matched
 * - content = The actual pattern inside the optional
 * - ? = Make entire block optional (0 or 1 times)
 * 
 * BOUNDARY DETECTION WITH OPTIONALS:
 * Variables before optionals need special handling. Template: "${show}{?[${v}]?}{?(${e})?}"
 * 
 * Problem: Where does ${show} end? Could be before "[", "(", or neither.
 * Solution: Use negative lookahead to avoid consuming optional content.
 * 
 * Generated: (?<show>(?:(?!\[)(?!\().)+) 
 * Meaning: Match any char (.) as long as it's not followed by [ or (
 * 
 * This allows the regex engine to correctly split between variable and optional boundaries.
 */
function compileMaskToRegexPatternWithOptionals(parsed, availableHints = {}) {
  const parts = parsed.parts;
  const processedParts = [];
  let placeholderIndex = 0;
  
  for (const part of parts) {
    const escapedContent = escapeSpecialChars(part.content);
    const { result, variablePlaceholders } = extractVariablePlaceholders(escapedContent, placeholderIndex);
    placeholderIndex += variablePlaceholders.length;
    
    const finalContent = result.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    processedParts.push({
      type: part.type,
      content: finalContent,
      variablePlaceholders
    });
  }
  
  let regexPattern = '';
  let optionalIndex = 0;
  for (const part of processedParts) {
    if (part.type === 'optional') {
      regexPattern += `(?:(?<_opt${optionalIndex}>)${part.content})?`;
      optionalIndex++;
    } else {
      regexPattern += part.content;
    }
  }
  
  const allVariablePlaceholders = processedParts.flatMap(p => p.variablePlaceholders);
  
  for (let i = 0; i < allVariablePlaceholders.length; i++) {
    const { placeholder, varString } = allVariablePlaceholders[i];
    const { varName, hint } = parseVariableWithHint(varString);
    
    const isLastVariable = i === allVariablePlaceholders.length - 1;
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const placeholderPos = regexPattern.indexOf(escapedPlaceholder);
    const afterPlaceholder = regexPattern.substring(placeholderPos + escapedPlaceholder.length);
    
    const captureGroup = determineCaptureGroupWithOptionals(varName, hint, isLastVariable, afterPlaceholder, availableHints);
    regexPattern = regexPattern.replace(escapedPlaceholder, captureGroup);
  }
  
  regexPattern = unescapeSpecialChars(regexPattern);
  
  return regexPattern;
}

export function testMaskAgainstSamples(mask, sampleNames, availableHints = {}) {
  const validation = validateMaskWithDetails(mask, availableHints);
  const sampleArray = Array.isArray(sampleNames) ? sampleNames : 
    sampleNames.split('\n').map(s => s.trim()).filter(s => s);
  
  return {
    validation,
    results: sampleArray.map(name => {
      try {
        const parsed = parseTemplateWithOptionals(mask, name, availableHints);
        const variables = parsed;
        const matched = Object.keys(variables).length > 0;
        
        const positions = {};
        if (matched) {
          for (const [varName, value] of Object.entries(variables)) {
            const index = name.indexOf(value);
            if (index !== -1) {
              positions[varName] = { start: index, end: index + value.length };
            }
          }
        }
        
        return {
          name,
          matched,
          variables,
          positions
        };
      } catch (e) {
        return {
          name,
          matched: false,
          variables: {},
          positions: {},
          error: e.message
        };
      }
    })
  };
}
