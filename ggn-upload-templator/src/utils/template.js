// Parse torrent name using template mask
export function parseTemplate(mask, torrentName, greedyMatching = true) {
  if (!mask || !torrentName) return {};

  // Convert template mask to regex with named groups
  // Support ${var_name} syntax with escaping for literal $, {, }
  let regexPattern = mask
    // First, temporarily replace escaped characters with placeholders
    .replace(/\\\$/g, "___ESCAPED_DOLLAR___")
    .replace(/\\\{/g, "___ESCAPED_LBRACE___")
    .replace(/\\\}/g, "___ESCAPED_RBRACE___")
    .replace(/\\\\/g, "___ESCAPED_BACKSLASH___")
    // Escape all regex special characters
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Convert ${field} to named groups
    // Use greedy or non-greedy based on the greedyMatching parameter
    .replace(/\\\$\\\{([^}]+)\\\}/g, (match, varName, offset, string) => {
      if (greedyMatching) {
        // When greedy matching is enabled, use greedy quantifiers for all variables
        return `(?<${varName}>.+)`;
      } else {
        // Default behavior: non-greedy for variables with more variables after them, greedy for the last
        const remainingString = string.slice(offset + match.length);
        const hasMoreVariables = /\\\$\\\{[^}]+\\\}/.test(remainingString);

        if (hasMoreVariables) {
          return `(?<${varName}>.*?)`; // Non-greedy for variables with more variables after them
        } else {
          return `(?<${varName}>.+)`; // Greedy for the last variable (requires at least 1 char)
        }
      }
    })
    // Restore escaped characters as literal matches
    .replace(/___ESCAPED_DOLLAR___/g, "\\$")
    .replace(/___ESCAPED_LBRACE___/g, "\\{")
    .replace(/___ESCAPED_RBRACE___/g, "\\}")
    .replace(/___ESCAPED_BACKSLASH___/g, "\\\\");

  try {
    const regex = new RegExp(regexPattern, "i");
    const match = torrentName.match(regex);
    return match?.groups || {};
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
    const varName = match[1];
    if (varName.startsWith('_')) {
      invalidVars.push(varName);
    }
  }
  
  return {
    valid: invalidVars.length === 0,
    invalidVars
  };
}

export function validateMaskWithDetails(mask) {
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
    const varName = match[1].trim();
    const position = match.index;

    if (varName !== match[1]) {
      warnings.push({ type: 'warning', message: `Variable "\${${match[1]}}" has leading or trailing whitespace`, position });
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

    if (/^\d/.test(varName)) {
      warnings.push({ type: 'warning', message: `Variable "\${${varName}}" starts with a number (potentially confusing)`, position });
    }

    if (varName.length > 50) {
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

function generateCombinationsDescending(count) {
  const total = Math.pow(2, count);
  const combinations = [];
  
  for (let i = total - 1; i >= 0; i--) {
    const combo = [];
    for (let j = 0; j < count; j++) {
      combo.push((i & (1 << j)) !== 0);
    }
    combinations.push(combo);
  }
  
  return combinations;
}

function buildMaskFromCombination(parts, combo) {
  let result = '';
  let optionalIndex = 0;
  
  for (const part of parts) {
    if (part.type === 'required') {
      result += part.content;
    } else if (part.type === 'optional') {
      if (combo[optionalIndex]) {
        result += part.content;
      }
      optionalIndex++;
    }
  }
  
  return result;
}

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
  
  if (optionalCount > 8) {
    throw new Error(`Too many optional blocks (${optionalCount}). Maximum is 8.`);
  }
  
  return { parts, optionalCount };
}

export function parseTemplateWithOptionals(mask, torrentName) {
  try {
    const parsed = parseMaskStructure(mask);
    
    if (parsed.optionalCount === 0) {
      return parseTemplate(mask, torrentName);
    }
    
    const combinations = generateCombinationsDescending(parsed.optionalCount);
    
    for (const combo of combinations) {
      const maskVariant = buildMaskFromCombination(parsed.parts, combo);
      const extracted = parseTemplate(maskVariant, torrentName);
      
      if (Object.keys(extracted).length > 0) {
        return {
          ...extracted,
          _matchedOptionals: combo,
          _optionalCount: parsed.optionalCount
        };
      }
    }
    
    return {};
  } catch (e) {
    throw e;
  }
}

export function testMaskAgainstSamples(mask, sampleNames) {
  const validation = validateMaskWithDetails(mask);
  const sampleArray = Array.isArray(sampleNames) ? sampleNames : 
    sampleNames.split('\n').map(s => s.trim()).filter(s => s);
  
  return {
    validation,
    results: sampleArray.map(name => {
      try {
        const parsed = parseTemplateWithOptionals(mask, name);
        const { _matchedOptionals, _optionalCount, ...variables } = parsed;
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
          positions,
          optionalInfo: _matchedOptionals ? {
            matched: _matchedOptionals.filter(x => x).length,
            total: _optionalCount
          } : null
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
