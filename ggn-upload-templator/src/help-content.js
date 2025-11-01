import { html, raw } from "./ui/template-engine.js";
import { HELP_ICON_HTML } from "./ui/templates/components/help-icon.js";

export const HELP_SECTIONS = {
  "quick-start": {
    title: "Quick Start",
    content: html`
      <h3>Welcome to GGn Upload Templator</h3>
      <p>
        This userscript helps automate your torrent upload workflow by
        extracting information from torrent filenames and auto-filling form
        fields.
      </p>

      <h4>Basic Workflow</h4>
      <ol>
        <li>
          <strong>Create a Template:</strong> Click "+ Create Template" and
          define a mask pattern that matches your torrent naming convention
        </li>
        <li>
          <strong>Define Variables:</strong> Use
          <code>\${variable}</code> syntax in your mask to extract data from
          torrent names
        </li>
        <li>
          <strong>Map Fields:</strong> Choose which form fields should be filled
          with which variables
        </li>
        <li>
          <strong>Apply Template:</strong> Select your template and click "Apply
          Template" to auto-fill the form
        </li>
      </ol>

      <h4>Example</h4>
      <p>For a torrent named: <code>PCWorld - Issue 05 - 01-2024.zip</code></p>
      <p>
        You could create a mask:
        <code>\${magazine} - Issue \${issue} - \${month}-\${year}.\${ext}</code>
      </p>
      <p>
        This extracts: magazine="PCWorld", issue="05", month="01", year="2024",
        ext="zip"
      </p>
    `,
    keywords: ["getting started", "begin", "tutorial", "intro", "basics"],
  },

  templates: {
    title: "Templates",
    content: html`
      <h3>Creating and Managing Templates</h3>
      <p>
        Templates define how to extract information from torrent names and which
        form fields to fill.
      </p>

      <h4>Creating a Template</h4>
      <ol>
        <li>Click "+ Create Template" button</li>
        <li>Enter a descriptive template name</li>
        <li>
          Paste a sample torrent name (or select a torrent first and we'll use
          the extracted filename)
        </li>
        <li>Define your mask pattern (see Masks & Variables section)</li>
        <li>Select which form fields to fill and with what values</li>
        <li>Click "Save Template"</li>
      </ol>

      <h4>Editing Templates</h4>
      <p>
        Click "Manage" button, then click "Edit" next to any template. You can
        update the mask, field mappings, and other settings.
      </p>

      <h4>Cloning Templates</h4>
      <p>
        Use the "Clone" button to create a copy of an existing template as a
        starting point for a new one.
      </p>

      <h4>Field Selection</h4>
      <p>
        Use the "Show Unselected" button to see ignored fields. Check/uncheck
        fields to include or exclude them from the template.
      </p>
    `,
    keywords: ["template", "create", "edit", "manage", "clone", "delete"],
  },

  masks: {
    title: "Masks & Variables",
    content: html`
      <h3>Torrent Name Masks</h3>
      <p>
        Masks define patterns to extract variables from torrent filenames.
        Variables are defined using <code>\${variable_name}</code> syntax.
      </p>

      <h4>Variable Sources</h4>
      <p>Variables can be extracted from two sources:</p>
      <ul>
        <li>
          <strong>Torrent filename:</strong> The primary source for variable
          extraction using masks
        </li>
        <li>
          <strong>Torrent comment field:</strong> Define variables in the
          torrent file's comment using <code>variable=value</code> format
          (separated by semicolons, e.g. <code>var1=value1;var2=value2</code>)
        </li>
      </ul>

      <h4>Variable Syntax</h4>
      <p>
        <code>\${variable}</code> - Extracts any characters (non-greedy by
        default)
      </p>
      <p>
        <code>\${variable:pattern}</code> - Extracts characters matching a
        specific pattern. The pattern can be defined inline or in a named
        variable hint (see Variable Hints section for more details)
      </p>

      <h4>Pattern Types</h4>
      <ul>
        <li><code>#</code> - Matches a single digit (0-9)</li>
        <li><code>@</code> - Matches a single letter (a-z, A-Z)</li>
        <li><code>*</code> - Matches any alphanumeric character</li>
        <li><code>##</code> - Matches exactly 2 digits</li>
        <li><code>@@@</code> - Matches exactly 3 letters</li>
      </ul>

      <h4>Examples</h4>
      <p><code>\${artist} - \${album} [\${year:####}]</code></p>
      <p>Matches: "Artist Name - Album Title [2024]"</p>

      <p><code>\${magazine} Issue \${issue:##}</code></p>
      <p>Matches: "PCWorld Issue 05"</p>

      <h4>Literal Text</h4>
      <p>
        Any text outside of <code>\${...}</code> is treated as literal text that
        must match exactly.
      </p>

      <h4>Testing Masks</h4>
      <p>
        Use the Mask Sandbox tab to test your masks against multiple torrent
        names at once.
      </p>
    `,
    keywords: [
      "mask",
      "variable",
      "pattern",
      "${",
      "syntax",
      "extract",
      "regex",
      "comment",
      "torrent",
    ],
  },

  hints: {
    title: "Variable Hints",
    content: html`
      <h3>Variable Hints</h3>
      <p>
        Hints help disambiguate extracted variables by validating or
        transforming them based on patterns or mappings.
      </p>

      <h4>Hint Types</h4>

      <h5>Pattern Hints</h5>
      <p>Validate that a variable matches a specific pattern:</p>
      <ul>
        <li><code>##</code> - Two digits</li>
        <li><code>####</code> - Four digits (year)</li>
        <li><code>@@@@</code> - Four letters</li>
      </ul>

      <h5>Regex Hints</h5>
      <p>Validate using regular expressions:</p>
      <ul>
        <li><code>v\\d+(\\.\\d+)*</code> - Version numbers like v1.2.3</li>
        <li><code>[A-Z]{2,4}</code> - 2-4 uppercase letters</li>
      </ul>

      <h5>Value Maps</h5>
      <p>Transform input values to output values:</p>
      <ul>
        <li>Input: "en" → Output: "English"</li>
        <li>Input: "fr" → Output: "French"</li>
      </ul>
      <p>
        Maps can be strict (reject unknown values) or non-strict (pass through
        unknown values).
      </p>

      <h4>Creating Hints</h4>
      <ol>
        <li>Go to "Variable Hints" tab</li>
        <li>Click "+ Add Hint"</li>
        <li>Name your hint (use the variable name it applies to)</li>
        <li>Choose hint type and define the pattern or mappings</li>
        <li>Save the hint</li>
      </ol>

      <h4>Mass Editing Maps</h4>
      <p>
        For value map hints, use "Mass Edit" or "Import" to quickly add many
        mappings in CSV or other delimited formats.
      </p>
    `,
    keywords: [
      "hint",
      "pattern",
      "regex",
      "map",
      "validation",
      "transform",
      "disambiguation",
    ],
  },

  "optional-variables": {
    title: "Optional Variables",
    content: html`
      <h3>Optional Sections</h3>
      <p>
        Optional sections allow parts of your mask to be present or absent in
        torrent names.
      </p>

      <h4>Syntax</h4>
      <p>
        <code>{?optional content?}</code> - Everything between
        <code>{?</code> and <code>?}</code> is optional
      </p>

      <h4>Use Cases</h4>
      <ul>
        <li>
          Optional year in brackets: <code>\${title} {?[\${year}]?}</code>
        </li>
        <li>Optional version: <code>\${software} {?v\${version}?}</code></li>
        <li>
          Optional episode info:
          <code>\${series} {?S\${season}E\${episode}?}</code>
        </li>
      </ul>

      <h4>Examples</h4>
      <p>
        <strong>Mask:</strong>
        <code>\${artist} - \${album} {?[\${year}]?}</code>
      </p>
      <p><strong>Matches:</strong></p>
      <ul>
        <li>
          "Artist - Album [2024]" → artist="Artist", album="Album", year="2024"
        </li>
        <li>
          "Artist - Album" → artist="Artist", album="Album", year=undefined
        </li>
      </ul>
    `,
    keywords: ["optional", "{?", "?}", "conditional", "maybe"],
  },

  "form-operations": {
    title: "Form Operations",
    content: html`
      <h3>Applying Templates</h3>
      <p>
        Once you've created a template, you can apply it to auto-fill form
        fields.
      </p>

      <h4>Applying a Template</h4>
      <ol>
        <li>Select your template from the dropdown</li>
        <li>Click "Apply Template" button (or use the keybinding)</li>
        <li>Review the changes in the confirmation dialog</li>
        <li>Confirm to apply changes to the form</li>
      </ol>

      <h4>Variable Interpolation</h4>
      <p>Form field values can reference extracted variables:</p>
      <ul>
        <li><code>\${variable}</code> - Insert variable value</li>
        <li>
          <code>Static text \${variable}</code> - Mix static text with variables
        </li>
        <li><code>\${var1} - \${var2}</code> - Combine multiple variables</li>
      </ul>

      <h4>Variable Matching for Selects</h4>
      <p>
        For select/dropdown fields, you can match options based on extracted
        variables:
      </p>
      <ol>
        <li>Click "Match from variable: OFF" link next to a select field</li>
        <li>Choose match type (exact, contains, starts with, ends with)</li>
        <li>Enter the variable name (e.g., <code>\${category}</code>)</li>
        <li>
          The template will automatically select the matching option when
          applied
        </li>
      </ol>

      <h4>Field Previews</h4>
      <p>
        When creating/editing a template, field previews show what the final
        value will look like with sample data.
      </p>

      <h4>Confirmation Dialog</h4>
      <p>
        Before applying changes, you'll see which fields will be modified and
        their new values. This prevents accidental overwrites.
      </p>
    `,
    keywords: [
      "apply",
      "form",
      "field",
      "mapping",
      "interpolation",
      "variable",
      "select",
      "dropdown",
    ],
  },

  sandbox: {
    title: "Mask Sandbox",
    content: html`
      <h3>Testing Masks</h3>
      <p>
        The Mask Sandbox lets you test mask patterns against multiple torrent
        names to verify they work correctly.
      </p>

      <h4>Using the Sandbox</h4>
      <ol>
        <li>Go to "Mask Sandbox" tab in the manager</li>
        <li>Enter your mask pattern</li>
        <li>Enter sample torrent names (one per line)</li>
        <li>View match results showing extracted variables</li>
      </ol>

      <h4>Match Results</h4>
      <p>For each sample, you'll see:</p>
      <ul>
        <li><strong>✓ Match:</strong> Variables successfully extracted</li>
        <li><strong>✗ No Match:</strong> Pattern didn't match</li>
        <li>
          <strong>Variable Values:</strong> All extracted variables with their
          values
        </li>
      </ul>

      <h4>Compiled Regex View</h4>
      <p>
        Click "Show compiled regex" to see the actual regular expression
        generated from your mask. Useful for debugging complex patterns.
      </p>

      <h4>Saving Test Sets</h4>
      <p>Save your mask and sample names as a test set for later reuse:</p>
      <ol>
        <li>Enter your mask and samples</li>
        <li>Click "Save" button</li>
        <li>Enter a name for your test set</li>
        <li>Load it later from the dropdown</li>
      </ol>

      <h4>Quick Testing from Template Creator</h4>
      <p>
        When creating/editing a template, click "Test mask in sandbox →" to jump
        directly to the sandbox with your current mask pre-filled.
      </p>
    `,
    keywords: ["sandbox", "test", "mask", "preview", "debug", "sample"],
  },

  settings: {
    title: "Settings",
    content: html`
      <h3>Configuration Options</h3>

      <h4>Target Form Selector</h4>
      <p>
        CSS selector for the upload form. Default: <code>#upload_table</code>
      </p>
      <p>
        Change this if the form has a different ID or selector on your tracker.
      </p>

      <h4>Keybindings</h4>
      <p>
        <strong>Form Submission:</strong> Quickly submit the form (default:
        Ctrl+Enter)
      </p>
      <p>
        <strong>Apply Template:</strong> Apply selected template (default:
        Ctrl+Shift+A)
      </p>
      <p><strong>Help:</strong> Open help modal (default: ?)</p>
      <p>
        Click "Record" to set a custom keybinding - press your desired key
        combination when prompted.
      </p>

      <h4>Custom Field Selectors</h4>
      <p>
        Additional CSS selectors to find form fields beyond standard inputs. One
        selector per line.
      </p>
      <p>
        Example: <code>div[data-field]</code> for custom field implementations.
      </p>

      <h4>Ignored Fields</h4>
      <p>Field names to exclude from templates by default. One per line.</p>
      <p>
        These won't show up in the field list when creating templates unless you
        click "Show Unselected".
      </p>

      <h4>Reset to Defaults</h4>
      <p>Restores all settings to their default values.</p>

      <h4>Delete All Local Config</h4>
      <p>
        ⚠️ Deletes ALL local data including templates, hints, settings, and test
        sets. Cannot be undone.
      </p>
    `,
    keywords: [
      "settings",
      "config",
      "keybinding",
      "shortcut",
      "selector",
      "ignored",
      "fields",
    ],
  },

  "keyboard-shortcuts": {
    title: "Keyboard Shortcuts",
    content: html`
      <h3>Keyboard Shortcuts</h3>
      <p>Speed up your workflow with these keyboard shortcuts.</p>

      <h4>Global Shortcuts</h4>
      <table class="gut-help-table">
        <tr>
          <td><strong>?</strong></td>
          <td>Open help modal (configurable)</td>
        </tr>
        <tr>
          <td><strong>Ctrl+Enter</strong></td>
          <td>Submit upload form (configurable)</td>
        </tr>
        <tr>
          <td><strong>Ctrl+Shift+A</strong></td>
          <td>Apply selected template (configurable)</td>
        </tr>
      </table>

      <h4>Modal Shortcuts</h4>
      <table class="gut-help-table">
        <tr>
          <td><strong>Esc</strong></td>
          <td>Close current modal or go back</td>
        </tr>
        <tr>
          <td><strong>Tab</strong></td>
          <td>Navigate between fields</td>
        </tr>
      </table>

      <h4>Help Modal Shortcuts</h4>
      <table class="gut-help-table">
        <tr>
          <td><strong>Enter</strong></td>
          <td>Cycle through search results</td>
        </tr>
      </table>

      <h4>Customizing Shortcuts</h4>
      <p>
        Go to Settings tab → Click "Record" next to any keybinding → Press your
        desired key combination.
      </p>
    `,
    keywords: ["keyboard", "shortcuts", "keybinding", "hotkey", "keys"],
  },

  api: {
    title: "API for Other Userscripts",
    content: html`
      <h3>Userscript API</h3>
      <p>
        Other userscripts can interact with GGn Upload Templator
        programmatically.
      </p>

      <h4>Accessing the API</h4>
      <p>
        The API is available at:
        <code>window.GGnUploadTemplator</code>
      </p>

      <h4>Key Methods</h4>

      <p><strong>Get API version:</strong></p>
      <pre
        class="gut-help-pre"
      ><code>const version = window.GGnUploadTemplator.version;</code></pre>

      <p><strong>Get all templates:</strong></p>
      <pre
        class="gut-help-pre"
      ><code>const templates = window.GGnUploadTemplator.getTemplates();
// Returns array of template objects with name, mask, fieldMappings, etc.</code></pre>

      <p><strong>Get specific template:</strong></p>
      <pre
        class="gut-help-pre"
      ><code>const template = window.GGnUploadTemplator.getTemplate('Template Name');
// Returns template object or null if not found</code></pre>

      <p><strong>Extract variables from torrent name:</strong></p>
      <pre
        class="gut-help-pre"
      ><code>const vars = window.GGnUploadTemplator.extractVariables(
  'Template Name',
  'torrent-name.zip'
);
// Returns object with extracted variables</code></pre>

      <p><strong>Get instance for advanced usage:</strong></p>
      <pre
        class="gut-help-pre"
      ><code>const instance = window.GGnUploadTemplator.getInstance();
// Returns the internal GGnUploadTemplator instance</code></pre>

      <h4>Full API Documentation</h4>
      <p>
        See
        <a
          href="https://github.com/lvldesigner/userscripts/blob/main/ggn-upload-templator/docs/api.md"
          target="_blank"
          class="gut-link"
          >API Documentation</a
        >
        for complete details.
      </p>
    `,
    keywords: ["api", "userscript", "integration", "programming", "event"],
  },

  changelog: {
    title: "Changelog",
    content: "",
    keywords: ["changelog", "version", "release", "updates", "history"],
  },
};

export function getChangelogContent() {
  const changelogEntries = Object.entries(INTRO_CONTENT.changelog).sort(
    ([versionA], [versionB]) => {
      const parseVersion = (v) => {
        const parts = v.replace("v", "").split(".").map(Number);
        return parts[0] * 10000 + (parts[1] || 0) * 100 + (parts[2] || 0);
      };
      return parseVersion(versionB) - parseVersion(versionA);
    },
  );

  let content = "<div>";

  for (const [version, entry] of changelogEntries) {
    content += `
      <div class="gut-changelog-entry">
        <h3 class="gut-changelog-version">${version}</h3>
        <div class="gut-changelog-content">
          ${entry.content}
        </div>
      </div>
    `;
  }

  content += "</div>";

  return content;
}

export const HELP_TOOLTIPS = {
  "mask-syntax": {
    text: "Define patterns to extract variables from torrent names using <code>${variable}</code> syntax",
    example: "${title} - ${episode}",
    helpSection: "masks",
  },
  "optional-syntax": {
    text: "Wrap optional sections in <code>{?...?}</code> to handle variations in torrent names",
    example: "${title} {?[${year}]?}",
    helpSection: "optional-variables",
  },
  "extracted-variables": {
    text: "Variables extracted from the sample torrent name using your mask. Use these in form field values with <code>${variable}</code> syntax",
    example: "If mask extracts 'year', use ${year} in fields",
    helpSection: "masks",
  },
  "field-mappings": {
    text: "Map form fields to variables or static values. Use <code>${variable}</code> to reference extracted data",
    example: "Title: ${magazine} Issue ${issue}",
    helpSection: "form-operations",
  },
  "variable-hints": {
    text: "Hints validate or transform variables using patterns, regex, or value mappings to ensure correct data extraction",
    example: "year → ####, language → en=English",
    helpSection: "hints",
  },
  "hint-types": {
    text: "<strong>Pattern:</strong> Simple patterns (#=digit, @=letter)<br><strong>Regex:</strong> Full regex support<br><strong>Map:</strong> Input→Output value transformations",
    example: "",
    helpSection: "hints",
  },
  "hint-pattern-syntax": {
    text: "Use # for digits, @ for letters, * for alphanumeric. Repeat for exact length",
    example: "#### = 4 digits (2024), @@ = 2 letters (EN)",
    helpSection: "hints",
  },
  "hint-regex-syntax": {
    text: "Full JavaScript regex support for complex patterns. Use capturing groups, quantifiers, and anchors",
    example: "v\\d+(\\.\\d+)* = v1.2.3, [A-Z]{2,4} = 2-4 uppercase letters",
    helpSection: "hints",
  },
  "hint-value-mappings": {
    text: "Map input values to output values. Useful for transforming abbreviations to full names",
    example: "en → English, fr → French, de → German",
    helpSection: "hints",
  },
  "hint-strict-mode": {
    text: "When enabled, rejects values not in the mapping. When disabled, passes through unknown values unchanged",
    example: "",
    helpSection: "hints",
  },
  "variable-matching": {
    text: "Automatically select dropdown options by matching against extracted variable values",
    example: 'If ${format}="FLAC", select "FLAC" option',
    helpSection: "form-operations",
  },
  "mask-sandbox": {
    text: "Test your mask patterns against sample torrent names to verify they extract variables correctly",
    example: "",
    helpSection: "sandbox",
  },
  "form-selector": {
    text: "CSS selector to identify the upload form on the page",
    example: "#upload_table or .upload-form",
    helpSection: "settings",
  },
  "custom-selectors": {
    text: "Additional CSS selectors to find custom form fields beyond standard inputs",
    example: "div[data-field], .custom-input",
    helpSection: "settings",
  },
  "ignored-fields": {
    text: "Field names excluded from templates by default. These won't appear unless you click 'Show Unselected'",
    example: "submit, csrf_token, form_id",
    helpSection: "settings",
  },
  "help-icon-example": {
    text: "Yep, this is one of those help icons! Click any of them throughout the UI for context-specific help",
    example: "",
    helpSection: "quick-start",
  },
};

export const INTRO_CONTENT = {
  "new-user": {
    title: "Welcome to GGn Upload Templator!",
    content: html`
      <p>
        Automate your torrent upload workflow with templates that extract data
        from filenames and auto-fills the form for you.
      </p>

      <div class="gut-intro-section-box">
        <h4 class="gut-intro-section-title">Key Features</h4>
        <ul class="gut-intro-section-list">
          <li>
            Create templates from torrent filenames with variable extraction
          </li>
          <li>
            Define variables in torrent comment fields for additional metadata
          </li>
          <li>Auto-fill form fields with extracted variables</li>
          <li>Support for complex patterns and optional sections</li>
          <li>Test your masks in the built-in sandbox</li>
          <li>Variable hints for validation and transformation</li>
        </ul>
      </div>
    `,
  },
  changelog: {
    "v0.14.2": {
      title: "What's New in v0.14.2?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              <strong>Bug Fix:</strong> Support fields that only have an
              <code>id</code> attribute (no <code>name</code> attribute)
            </li>
            <li>
              <strong>Bug Fix:</strong> Improved label detection for fields where
              the label is a clickable link
            </li>
            <li>
              <strong>Bug Fix:</strong> Exclude the templator's own UI elements
              from field selection
            </li>
            <li>
              <strong>UX Improvement:</strong> Long field labels are now truncated
              with hover tooltips showing the full text
            </li>
          </ul>
        </div>
      `,
    },
    "v0.14.1": {
      title: "What's New in v0.14.1?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              <strong>Bug Fix:</strong> Checkboxes are now applied correctly
              when a form has both a hidden input and checkbox with the same
              name attribute
            </li>
          </ul>
        </div>
      `,
    },
    "v0.14": {
      title: "What's New in v0.14?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Added Select All / Select None to form fields list in template
              creator/editor modal
            </li>
            <li>
              Fix help modal default keybinding (?) now functions properly
            </li>
          </ul>
        </div>
      `,
    },
    "v0.13": {
      title: "What's New in v0.13?",
      content: html`
        <p>
          This version introduces a comprehensive help system to make using the
          templator easier.
        </p>

        <img
          src="https://files.catbox.moe/en4jfi.png"
          alt="v0.13 screenshot"
          style="max-width: 100%; height: auto; margin-bottom: 1em;"
        />
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              <strong>Built-in Help System:</strong> Access contextual help via
              ${raw(
                HELP_ICON_HTML("help-icon-example", "gut-help-icon-no-margin"),
              )}
              icons or press <kbd class="gut-kbd">?</kbd> anytime
            </li>
            <li>
              <strong>Rich Tooltips:</strong> Hover over help icons for quick
              explanations
            </li>
            <li>
              <strong>Searchable Help Modal:</strong> Find answers quickly with
              full-text search
            </li>
            <li>
              <strong>First-Run Experience:</strong> Welcome modal for new users
              and version updates
            </li>
            <li>
              <strong>Unsaved Changes Warning:</strong> Show warning modal on
              close if there are unsaved changes
            </li>
          </ul>
        </div>
      `,
    },
    "v0.12": {
      title: "What's New in v0.12?",
      content: html`
        <img
          src="https://files.catbox.moe/kkbd0a.png"
          alt="v0.12 screenshot"
          style="max-width: 100%; height: auto; margin-bottom: 1em;"
        />
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Other scripts can now use the API exposed via
              <code>window.GGnUploadTemplator</code>, see API section for
              details
            </li>
            <li>
              Ask for confirmation before applying the template, show preview of
              value changes
            </li>
            <li>Show variable hint information when editing a mask</li>
            <li>
              Managing variable hints is now more flexible: they can be reset to
              default / all deleted / only import new ones
            </li>
          </ul>
        </div>
      `,
    },
    "v0.11": {
      title: "What's New in v0.11?",
      content: html`
        <p>This is mostly a UX/UI fixes and improvements release.</p>
        <img
          src="https://files.catbox.moe/mum36l.png"
          alt="v0.11 screenshot"
          style="max-width: 100%; height: auto; margin-bottom: 1em;"
        />
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              All variable hints are now treated equally, there's no more
              default/custom hints, this allows editing/deleting any hint,
              including previously default ones. You can reset to default using
              the new button
            </li>
            <li>
              Matched variable values are now truncated to sane lengths, hover
              over them to see full match highlighted in the torrent name
            </li>
            <li>
              Fix match highlights not working properly when the matched value
              is too long
            </li>
            <li>
              Modals get scaled down the further up the stack you go, i.e: if
              you have one modal open then you open another on top of it, that
              gets scaled down so you visually distinguish there are two modals
            </li>
            <li>
              Modal width can be resized to your liking by dragging on the
              left/right edge
            </li>
            <li>
              Show number of extracted variables under the template selector,
              even if the number is 0
            </li>
            <li>
              Fix regression: Changing selected template MUST NOT automatically
              apply the template
            </li>
          </ul>
        </div>
      `,
    },
    "v0.10": {
      title: "What's New in v0.10?",
      content: html`
        <img
          src="https://files.catbox.moe/qtnzfw.png"
          alt="v0.10 screenshot"
          style="max-width: 100%; height: auto; margin-bottom: 1em;"
        />
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Add variable hints that allows for variable disambiguation and
              advanced pattern matching
            </li>
            <li>Toggle to show compiled regex in Mask Sandbox</li>
            <li>Fix: Allow optionals to consist of white space</li>
            <li>UX: Modals have fixed headers and footers now</li>
          </ul>
        </div>
      `,
    },
    "v0.9": {
      title: "What's New in v0.9?",
      content: html`
        <img
          src="https://files.catbox.moe/g4mclk.png"
          alt="v0.9 screenshot"
          style="max-width: 100%; height: auto; margin-bottom: 1em;"
        />
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Add Mask Sandbox for testing masks against multiple sample names
            </li>
          </ul>
        </div>
      `,
    },
    "v0.8": {
      title: "What's New in v0.8?",
      content: html`
        <img
          src="https://files.catbox.moe/7xkrsw.png"
          alt="v0.8 screenshot"
          style="max-width: 100%; height: auto; margin-bottom: 1em;"
        />
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Add optional variables with <code>{? ... ?}</code> syntax for
              flexible filename matching
            </li>
            <li>
              Remove greedy matching setting (now uses smart non-greedy parsing
              by default)
            </li>
          </ul>
        </div>
      `,
    },
    "v0.7": {
      title: "What's New in v0.7?",
      content: html`
        <img
          src="https://files.catbox.moe/snd92p.png"
          alt="v0.7 screenshot"
          style="max-width: 100%; height: auto; margin-bottom: 1em;"
        />
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>Add mask validation and highlighting with helpful messages</li>
            <li>
              Fix: No longer inserts <code>\${varname}</code> in fields if
              <code>\${varname}</code> is empty/not found
            </li>
          </ul>
        </div>
      `,
    },
    "v0.6": {
      title: "What's New in v0.6?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Added support for variables defined in the comment field of a
              torrent file. These are extracted as <code>\${_foo}</code>,
              <code>\${_bar}</code>, starting with an underscore. Mask variables
              cannot be defined with an underscore in the beginning of their
              name
            </li>
            <li>
              The format for variables in the comment field is:
              <code>foo=value1;bar=value2;</code>
            </li>
            <li>
              Show variable count under the template selector. Clicking it shows
              a modal with all variables and their values
            </li>
          </ul>
        </div>
      `,
    },
    "v0.5.1": {
      title: "What's New in v0.5.1?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Fix: Use textarea for textarea fields instead of text input,
              respect newlines
            </li>
          </ul>
        </div>
      `,
    },
    "v0.5": {
      title: "What's New in v0.5?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              <strong>BREAKING CHANGE:</strong> Templates are no longer
              auto-applied when a file is selected. You have to either press the
              new Apply Template button or use the default keybinding:
              Ctrl+Shift+A
            </li>
            <li>
              You can now customize keybindings for Form submission and Apply
              Template in the settings
            </li>
          </ul>
        </div>
      `,
    },
    "v0.4.1": {
      title: "What's New in v0.4.1?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Going forward, posting the unminified version of the userscript
            </li>
          </ul>
        </div>
      `,
    },
    "v0.4": {
      title: "What's New in v0.4?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Added support for choosing select field values based on extracted
              variables
            </li>
          </ul>
        </div>
      `,
    },
    "v0.3": {
      title: "What's New in v0.3?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>
              Added support for extra custom fields to be included in the
              template (e.g: GGn Infobox Builder)
            </li>
          </ul>
        </div>
      `,
    },
    "v0.2": {
      title: "What's New in v0.2?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>Changed variable format from {var} to \${var}</li>
            <li>Added support to escape special characters, e.g: $ { }</li>
            <li>Added section to show list of extracted variables</li>
            <li>Add edit shortcut for selected template</li>
          </ul>
        </div>
      `,
    },
    "v0.1": {
      title: "What's New in v0.1?",
      content: html`
        <div class="gut-intro-section-box">
          <ul class="gut-intro-section-list">
            <li>Initial version</li>
          </ul>
        </div>
      `,
    },
  },
};
