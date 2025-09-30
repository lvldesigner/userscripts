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

  const unclosedPattern = /\$\{[^}]*$/;
  if (unclosedPattern.test(mask)) {
    errors.push({ type: 'error', message: 'Unclosed variable: missing closing brace "}"', position: mask.lastIndexOf('${') });
  }

  const emptyVarPattern = /\$\{\s*\}/g;
  let emptyMatch;
  while ((emptyMatch = emptyVarPattern.exec(mask)) !== null) {
    errors.push({ type: 'error', message: 'Empty variable: ${}', position: emptyMatch.index });
  }

  const nestedPattern = /\$\{[^}]*\$\{/g;
  let nestedMatch;
  while ((nestedMatch = nestedPattern.exec(mask)) !== null) {
    errors.push({ type: 'error', message: 'Nested braces are not allowed', position: nestedMatch.index });
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
      errors.push({ type: 'error', message: `Invalid variable name "\${${varName}}": only letters, numbers, and underscores allowed`, position });
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
  return template.replace(/\$\{([^}]+)\}/g, (match, key) => allData[key] || match);
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
