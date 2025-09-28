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

// Interpolate template string with extracted data
export function interpolate(template, data) {
  if (!template || !data) return template;
  return template.replace(/\$\{([^}]+)\}/g, (match, key) => data[key] || match);
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
