# GGn Upload Templator - API Documentation

GGn Upload Templator exposes a public API that allows other userscripts to interact with templates and extract variables from torrent names.

## Accessing the API

The API is available globally via:

```javascript
window.GGnUploadTemplator
```

Or in userscripts that support it:

```javascript
unsafeWindow.GGnUploadTemplator
```

## API Reference

### `version`

Returns the API version string.

```javascript
console.log(window.GGnUploadTemplator.version);
// Output: "0.11"
```

---

### `getTemplates()`

Returns an array of all saved templates.

**Returns:** `Array<Template>`

**Template Object:**
```javascript
{
  name: string,                       // Template name
  mask: string,                       // Torrent name pattern (e.g., "${show} - S${season}E${episode}")
  fieldMappings: object,              // Field mappings { fieldName: templateValue }
  variableMatching: object,           // Variable matching config for select fields
  customUnselectedFields: array       // Custom field selection overrides
}
```

**Example:**

```javascript
const templates = window.GGnUploadTemplator.getTemplates();

templates.forEach(template => {
  console.log(template.name);
  console.log(template.mask);
});
```

---

### `getTemplate(templateName)`

Returns details for a specific template, or `null` if not found.

**Parameters:**
- `templateName` (string): The name of the template to retrieve

**Returns:** `Template | null`

**Example:**

```javascript
const template = window.GGnUploadTemplator.getTemplate("TV Shows");

if (template) {
  console.log("Mask:", template.mask);
  console.log("Field mappings:", template.fieldMappings);
} else {
  console.log("Template not found");
}
```

---

### `extractVariables(templateName, torrentName)`

Extracts variables from a torrent name using the specified template's mask pattern.

**Parameters:**
- `templateName` (string): The name of the template to use
- `torrentName` (string): The torrent filename to parse

**Returns:** `object` - Object containing extracted variable names and their values

**Example:**

```javascript
const vars = window.GGnUploadTemplator.extractVariables(
  "TV Shows",
  "Breaking.Bad.S05E14.1080p.BluRay.x264-DEMAND.mkv"
);

console.log(vars);
// Output: { show: "Breaking.Bad", season: "05", episode: "14", quality: "1080p", ... }
```

**With Optional Blocks:**

If the template mask contains optional blocks (e.g., `{?[${version}]?}`), the result includes metadata about which optionals matched:

```javascript
const vars = window.GGnUploadTemplator.extractVariables(
  "Movies",
  "The.Matrix.1999.[Directors.Cut].1080p.mkv"
);

console.log(vars);
// Output: {
//   title: "The.Matrix",
//   year: "1999",
//   edition: "Directors.Cut",
//   quality: "1080p",
//   _matchedOptionals: [true],  // Which optional blocks matched
//   _optionalCount: 1            // Total number of optional blocks
// }
```

---

### `getInstance()`

Returns the internal `GGnUploadTemplator` instance for advanced use cases.

**Returns:** `GGnUploadTemplator | null`

**Example:**

```javascript
const instance = window.GGnUploadTemplator.getInstance();

if (instance) {
  console.log("Selected template:", instance.selectedTemplate);
  console.log("All hints:", instance.hints);
}
```

**Note:** This provides full access to the internal instance. Use with caution.

---

## Complete Example

```javascript
// List all templates
const api = window.GGnUploadTemplator;
const templates = api.getTemplates();

console.log(`Found ${templates.length} templates:`);
templates.forEach(t => console.log(`- ${t.name}: ${t.mask}`));

// Get specific template details
const tvTemplate = api.getTemplate("TV Shows");
if (tvTemplate) {
  console.log("\nTV Shows Template:");
  console.log("Mask:", tvTemplate.mask);
  console.log("Fields:", Object.keys(tvTemplate.fieldMappings));
}

// Extract variables from torrent name
const torrentName = "Game.of.Thrones.S08E06.PROPER.1080p.WEB.H264-MEMENTO.mkv";
const extracted = api.extractVariables("TV Shows", torrentName);

console.log("\nExtracted Variables:");
Object.entries(extracted).forEach(([key, value]) => {
  if (!key.startsWith('_')) {  // Skip metadata fields
    console.log(`  ${key}: ${value}`);
  }
});
```

---

## Error Handling

All API methods handle errors gracefully:

- If the userscript hasn't initialized yet, methods log a warning and return safe defaults
- If a template doesn't exist, `getTemplate()` returns `null` and `extractVariables()` returns `{}`
- If extraction fails, `extractVariables()` returns `{}`

---

## Notes

- The API is synchronous (no async/await required)
- Template data is loaded from localStorage
- Variable extraction uses the same hint system as the main userscript
- Changes made to templates via the UI are immediately reflected in the API
