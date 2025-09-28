import { DEFAULT_CONFIG } from "./config.js";
import { logDebug } from "./utils/log.js";
import { injectUI, showTemplateCreator } from "./ui/manager.js";
import { parseTemplate, interpolate } from "./utils/template.js";
import {
  getCurrentFormData,
  findElementByFieldName,
  getFieldLabel,
} from "./utils/form.js";
import { TorrentUtils } from "./utils/torrent.js";
import {
  MODAL_HTML,
  TEMPLATE_SELECTOR_HTML,
  TEMPLATE_LIST_HTML,
} from "./ui/template.js";
import style from "./style.css?raw";

GM_addStyle(style);

class GGnUploadTemplator {
  constructor() {
    // Load templates, selected template, hideUnselectedFields, and config
    try {
      this.templates = JSON.parse(
        localStorage.getItem("ggn-upload-templator-templates") || "{}",
      );
    } catch (error) {
      console.error("Failed to load templates:", error);
      this.templates = {};
    }

    try {
      this.selectedTemplate =
        localStorage.getItem("ggn-upload-templator-selected") || null;
    } catch (error) {
      console.error("Failed to load selected template:", error);
      this.selectedTemplate = null;
    }

    try {
      this.hideUnselectedFields = JSON.parse(
        localStorage.getItem("ggn-upload-templator-hide-unselected") || "true",
      );
    } catch (error) {
      console.error("Failed to load hide unselected setting:", error);
      this.hideUnselectedFields = true;
    }

    // Load user settings or use defaults
    try {
      this.config = {
        ...DEFAULT_CONFIG,
        ...JSON.parse(
          localStorage.getItem("ggn-upload-templator-settings") || "{}",
        ),
      };
    } catch (error) {
      console.error("Failed to load config:", error);
      this.config = { ...DEFAULT_CONFIG };
    }

    logDebug("Initialized core state", {
      templates: Object.keys(this.templates),
      selectedTemplate: this.selectedTemplate,
      hideUnselectedFields: this.hideUnselectedFields,
      config: this.config,
    });
    this.init();
  }

  init() {
    logDebug("Initializing...");

    try {
      injectUI(this);
    } catch (error) {
      console.error("UI injection failed:", error);
    }

    try {
      this.watchFileInputs();
    } catch (error) {
      console.error("File input watching setup failed:", error);
    }

    if (this.config.SUBMIT_KEYBINDING) {
      try {
        this.setupSubmitKeybinding();
      } catch (error) {
        console.error("Submit keybinding setup failed:", error);
      }
    }

    logDebug("Initialized");
  }

  // Show template creation modal
  async showTemplateCreator(editTemplateName = null, editTemplate = null) {
    await showTemplateCreator(this, editTemplateName, editTemplate);
  }

  // Save template from modal
  saveTemplate(modal, editingTemplateName = null) {
    const name = modal.querySelector("#template-name").value.trim();
    const mask = modal.querySelector("#torrent-mask").value.trim();

    if (!name || !mask) {
      alert("Please provide both template name and torrent mask.");
      return;
    }

    // If editing and name changed, or creating new and name exists
    if (
      (editingTemplateName &&
        name !== editingTemplateName &&
        this.templates[name]) ||
      (!editingTemplateName && this.templates[name])
    ) {
      if (!confirm(`Template "${name}" already exists. Overwrite?`)) {
        return;
      }
    }

    const fieldMappings = {};
    const variableMatchingConfig = {};
    const checkedFields = modal.querySelectorAll(
      '.gut-field-row input[type="checkbox"]:checked',
    );

    checkedFields.forEach((checkbox) => {
      const fieldName = checkbox.dataset.field;
      const templateInput = modal.querySelector(
        `[data-template="${fieldName}"]`,
      );
      if (templateInput) {
        if (templateInput.type === "checkbox") {
          fieldMappings[fieldName] = templateInput.checked;
        } else if (templateInput.tagName.toLowerCase() === "select") {
          // Check if this select field is in variable mode
          const variableToggle = modal.querySelector(
            `.gut-variable-toggle[data-field="${fieldName}"]`,
          );
          const isVariableMode =
            variableToggle && variableToggle.dataset.state === "on";

          if (isVariableMode) {
            // Store variable matching configuration
            const variableInput = modal.querySelector(
              `.gut-variable-input[data-field="${fieldName}"]`,
            );
            const matchTypeSelect = modal.querySelector(
              `.gut-match-type[data-field="${fieldName}"]`,
            );

            variableMatchingConfig[fieldName] = {
              variableName: variableInput ? variableInput.value.trim() : "",
              matchType: matchTypeSelect ? matchTypeSelect.value : "exact",
            };

            // Store the variable input value instead of selected option
            fieldMappings[fieldName] = variableInput
              ? variableInput.value.trim()
              : "";
          } else {
            // Static mode - store the selected value
            fieldMappings[fieldName] = templateInput.value;
          }
        } else {
          fieldMappings[fieldName] = templateInput.value;
        }
      }
    });

    // Capture custom unselected fields (different from default ignored list)
    const allFieldRows = modal.querySelectorAll(".gut-field-row");
    const customUnselectedFields = [];

    allFieldRows.forEach((row) => {
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (checkbox) {
        const fieldName = checkbox.dataset.field;
        const isDefaultIgnored = this.config.IGNORED_FIELDS_BY_DEFAULT.includes(
          fieldName.toLowerCase(),
        );
        const isCurrentlyChecked = checkbox.checked;

        // If this field differs from the default behavior, track it
        if (
          (isDefaultIgnored && isCurrentlyChecked) ||
          (!isDefaultIgnored && !isCurrentlyChecked)
        ) {
          customUnselectedFields.push({
            field: fieldName,
            selected: isCurrentlyChecked,
          });
        }
      }
    });

    // If editing and the name changed, delete the old template
    if (editingTemplateName && name !== editingTemplateName) {
      delete this.templates[editingTemplateName];
      if (this.selectedTemplate === editingTemplateName) {
        this.selectedTemplate = name;
        localStorage.setItem("ggn-upload-templator-selected", name);
      }
    }

    const greedyMatching = modal.querySelector("#greedy-matching").checked;

    this.templates[name] = {
      mask,
      fieldMappings,
      greedyMatching,
      customUnselectedFields:
        customUnselectedFields.length > 0 ? customUnselectedFields : undefined,
      variableMatching:
        Object.keys(variableMatchingConfig).length > 0
          ? variableMatchingConfig
          : undefined,
    };

    localStorage.setItem(
      "ggn-upload-templator-templates",
      JSON.stringify(this.templates),
    );
    this.updateTemplateSelector();

    const action = editingTemplateName ? "updated" : "saved";
    this.showStatus(`Template "${name}" ${action} successfully!`);

    document.body.removeChild(modal);
  }

  // Update template selector dropdown
  updateTemplateSelector() {
    const selector = document.getElementById("template-selector");
    if (!selector) return;

    selector.innerHTML = TEMPLATE_SELECTOR_HTML(this);

    // Update edit button visibility
    this.updateEditButtonVisibility();
  }

  // Update edit button visibility based on selected template
  updateEditButtonVisibility() {
    const editBtn = document.getElementById("edit-selected-template-btn");
    if (!editBtn) return;

    const shouldShow =
      this.selectedTemplate &&
      this.selectedTemplate !== "none" &&
      this.templates[this.selectedTemplate];

    editBtn.style.display = shouldShow ? "" : "none";
  }

  // Select template
  selectTemplate(templateName) {
    this.selectedTemplate = templateName || null;

    if (templateName) {
      localStorage.setItem("ggn-upload-templator-selected", templateName);
    } else {
      localStorage.removeItem("ggn-upload-templator-selected");
    }

    // Update edit button visibility
    this.updateEditButtonVisibility();

    if (templateName === "none") {
      this.showStatus("No template selected - auto-fill disabled");
    } else if (templateName) {
      this.showStatus(`Template "${templateName}" selected`);

      // Check if there's already a torrent file selected and apply template immediately
      this.checkAndApplyToExistingTorrent(templateName);
    }
  }

  // Apply template to form
  applyTemplate(templateName, torrentName) {
    const template = this.templates[templateName];
    if (!template) return;

    const extracted = parseTemplate(
      template.mask,
      torrentName,
      template.greedyMatching !== false,
    );
    let appliedCount = 0;

    Object.entries(template.fieldMappings).forEach(
      ([fieldName, valueTemplate]) => {
        // Find the element using the improved field finder
        const firstElement = findElementByFieldName(fieldName, this.config);

        if (firstElement && firstElement.type === "radio") {
          // For radio buttons, find all radio buttons with the same name
          const formPrefix = this.config.TARGET_FORM_SELECTOR
            ? `${this.config.TARGET_FORM_SELECTOR} `
            : "";
          const radioButtons = document.querySelectorAll(
            `${formPrefix}input[name="${fieldName}"][type="radio"]`,
          );
          const newValue = interpolate(String(valueTemplate), extracted);

          radioButtons.forEach((radio) => {
            // Remove disabled attribute if present
            if (radio.hasAttribute("disabled")) {
              radio.removeAttribute("disabled");
            }

            const shouldBeChecked = radio.value === newValue;
            if (shouldBeChecked !== radio.checked) {
              radio.checked = shouldBeChecked;
              if (shouldBeChecked) {
                radio.dispatchEvent(new Event("input", { bubbles: true }));
                radio.dispatchEvent(new Event("change", { bubbles: true }));
                appliedCount++;
              }
            }
          });
        } else if (firstElement) {
          // Remove disabled attribute if present
          if (firstElement.hasAttribute("disabled")) {
            firstElement.removeAttribute("disabled");
          }

          if (firstElement.type === "checkbox") {
            // For checkboxes, valueTemplate is a boolean or string that needs interpolation
            let newChecked;
            if (typeof valueTemplate === "boolean") {
              newChecked = valueTemplate;
            } else {
              const interpolated = interpolate(
                String(valueTemplate),
                extracted,
              );
              // Convert string to boolean - "true", "1", "yes", "on" are truthy
              newChecked = /^(true|1|yes|on)$/i.test(interpolated);
            }

            if (newChecked !== firstElement.checked) {
              firstElement.checked = newChecked;
              firstElement.dispatchEvent(new Event("input", { bubbles: true }));
              firstElement.dispatchEvent(
                new Event("change", { bubbles: true }),
              );
              appliedCount++;
            }
          } else {
            // For other input types, interpolate the value
            const interpolated = interpolate(String(valueTemplate), extracted);
            if (firstElement.value !== interpolated) {
              firstElement.value = interpolated;
              firstElement.dispatchEvent(new Event("input", { bubbles: true }));
              firstElement.dispatchEvent(
                new Event("change", { bubbles: true }),
              );
              appliedCount++;
            }
          }
        }
      },
    );

    if (appliedCount > 0) {
      this.showStatus(
        `Template "${templateName}" applied to ${appliedCount} field(s)`,
      );
    }
  }

  // Check for existing torrent file and apply template
  async checkAndApplyToExistingTorrent(templateName) {
    if (!templateName || templateName === "none") return;

    const fileInputs = this.config.TARGET_FORM_SELECTOR
      ? document.querySelectorAll(
          `${this.config.TARGET_FORM_SELECTOR} input[type="file"]`,
        )
      : document.querySelectorAll('input[type="file"]');

    for (const input of fileInputs) {
      if (
        input.files &&
        input.files[0] &&
        input.files[0].name.toLowerCase().endsWith(".torrent")
      ) {
        try {
          const torrentData = await TorrentUtils.parseTorrentFile(
            input.files[0],
          );
          this.applyTemplate(templateName, torrentData.name);
          return; // Apply to first found torrent file only
        } catch (error) {
          console.warn("Could not parse existing torrent file:", error);
        }
      }
    }
  }

  // Watch file inputs for changes
  watchFileInputs() {
    const fileInputs = this.config.TARGET_FORM_SELECTOR
      ? document.querySelectorAll(
          `${this.config.TARGET_FORM_SELECTOR} input[type="file"]`,
        )
      : document.querySelectorAll('input[type="file"]');

    fileInputs.forEach((input) => {
      input.addEventListener("change", async (e) => {
        if (
          !this.selectedTemplate ||
          this.selectedTemplate === "none" ||
          !e.target.files[0]
        )
          return;

        const file = e.target.files[0];
        if (!file.name.toLowerCase().endsWith(".torrent")) return;

        try {
          const torrentData = await TorrentUtils.parseTorrentFile(file);
          this.applyTemplate(this.selectedTemplate, torrentData.name);
        } catch (error) {
          console.error("Error processing torrent file:", error);
          this.showStatus("Error processing torrent file", "error");
        }
      });
    });
  }

  // Setup global Ctrl+Enter keybinding for form submission
  setupSubmitKeybinding() {
    document.addEventListener("keydown", (e) => {
      // Check for Ctrl+Enter (or Cmd+Enter on Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();

        const targetForm = document.querySelector(
          this.config.TARGET_FORM_SELECTOR,
        );
        if (targetForm) {
          // Look for submit button within the form
          const submitButton =
            targetForm.querySelector(
              'input[type="submit"], button[type="submit"]',
            ) ||
            targetForm.querySelector(
              'input[name*="submit"], button[name*="submit"]',
            ) ||
            targetForm.querySelector(".submit-btn, #submit-btn");

          if (submitButton) {
            this.showStatus("Form submitted via Ctrl+Enter");
            submitButton.click();
          } else {
            // Fallback: submit the form directly
            this.showStatus("Form submitted via Ctrl+Enter");
            targetForm.submit();
          }
        }
      }
    });
  }

  // Show combined template and settings manager modal
  showTemplateAndSettingsManager() {
    const modal = document.createElement("div");
    modal.className = "gut-modal";
    modal.innerHTML = MODAL_HTML(this);

    document.body.appendChild(modal);

    // Tab switching
    modal.querySelectorAll(".gut-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tabName = e.target.dataset.tab;

        // Update tab buttons
        modal
          .querySelectorAll(".gut-tab-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        // Update tab content
        modal
          .querySelectorAll(".gut-tab-content")
          .forEach((c) => c.classList.remove("active"));
        modal.querySelector(`#${tabName}-tab`).classList.add("active");
      });
    });

    // Custom selectors preview functionality
    const customSelectorsTextarea = modal.querySelector(
      "#setting-custom-selectors",
    );
    const previewGroup = modal.querySelector("#custom-selectors-preview-group");
    const matchedContainer = modal.querySelector("#custom-selectors-matched");

    const updateCustomSelectorsPreview = () => {
      const selectorsText = customSelectorsTextarea.value.trim();
      const selectors = selectorsText
        .split("\n")
        .map((selector) => selector.trim())
        .filter((selector) => selector);

      // Temporarily update config for preview
      const originalSelectors = this.config.CUSTOM_FIELD_SELECTORS;
      this.config.CUSTOM_FIELD_SELECTORS = selectors;

      if (selectors.length === 0) {
        previewGroup.style.display = "none";
        // Restore original config
        this.config.CUSTOM_FIELD_SELECTORS = originalSelectors;
        return;
      }

      previewGroup.style.display = "block";

      let matchedElements = [];
      const formSelector =
        modal.querySelector("#setting-form-selector").value.trim() ||
        this.config.TARGET_FORM_SELECTOR;
      const targetForm = document.querySelector(formSelector);

      selectors.forEach((selector) => {
        try {
          const elements = targetForm
            ? targetForm.querySelectorAll(selector)
            : document.querySelectorAll(selector);

          Array.from(elements).forEach((element) => {
            // Get element info
            const tagName = element.tagName.toLowerCase();
            const id = element.id;
            const name = element.name || element.getAttribute("name");
            const classes = element.className || "";
            const label = getFieldLabel(element, this.config);

            // Create a unique identifier for deduplication
            const elementId =
              element.id ||
              element.name ||
              `${tagName}-${Array.from(element.parentNode.children).indexOf(element)}`;

            if (!matchedElements.find((e) => e.elementId === elementId)) {
              matchedElements.push({
                elementId,
                element,
                tagName,
                id,
                name,
                classes,
                label,
                selector,
              });
            }
          });
        } catch (e) {
          console.warn(`Invalid custom selector: ${selector}`, e);
        }
      });

      // Update the label with the count
      const matchedElementsLabel = modal.querySelector(
        "#matched-elements-label",
      );
      if (matchedElements.length === 0) {
        matchedElementsLabel.textContent = "Matched Elements:";
        matchedContainer.innerHTML =
          '<div class="gut-no-variables">No elements matched by custom selectors.</div>';
      } else {
        matchedElementsLabel.textContent = `Matched Elements (${matchedElements.length}):`;
        matchedContainer.innerHTML = matchedElements
          .map((item) => {
            const displayName =
              item.label || item.name || item.id || `${item.tagName}`;
            const displayInfo = [
              item.tagName.toUpperCase(),
              item.id ? `#${item.id}` : "",
              item.name ? `name="${item.name}"` : "",
              item.classes
                ? `.${item.classes
                    .split(" ")
                    .filter((c) => c)
                    .join(".")}`
                : "",
            ]
              .filter((info) => info)
              .join(" ");

            return `
              <div class="gut-variable-item">
                <span class="gut-variable-name">${this.escapeHtml(displayName)}</span>
                <span class="gut-variable-value">${this.escapeHtml(displayInfo)}</span>
              </div>
            `;
          })
           .join("");
      }

      // Restore original config
      this.config.CUSTOM_FIELD_SELECTORS = originalSelectors;
    };

    // Initial preview update
    updateCustomSelectorsPreview();

    // Update preview when custom selectors change
    customSelectorsTextarea.addEventListener(
      "input",
      updateCustomSelectorsPreview,
    );

    // Update preview when form selector changes (affects scope)
    modal
      .querySelector("#setting-form-selector")
      .addEventListener("input", updateCustomSelectorsPreview);

    // GGn Infobox link handler
    modal.querySelector("#ggn-infobox-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      const currentValue = customSelectorsTextarea.value.trim();
      const ggnInfoboxSelector = ".infobox-input-holder input";

      // Add the selector if it's not already present
      if (!currentValue.includes(ggnInfoboxSelector)) {
        const newValue = currentValue
          ? `${currentValue}\n${ggnInfoboxSelector}`
          : ggnInfoboxSelector;
        customSelectorsTextarea.value = newValue;
        updateCustomSelectorsPreview();
      }
    });

    // Settings handlers
    modal.querySelector("#save-settings")?.addEventListener("click", () => {
      this.saveSettings(modal);
    });

    modal.querySelector("#reset-settings")?.addEventListener("click", () => {
      if (
        confirm(
          "Reset all settings to defaults? This will require a page reload.",
        )
      ) {
        this.resetSettings(modal);
      }
    });

    modal.querySelector("#delete-all-config")?.addEventListener("click", () => {
      if (
        confirm(
          "⚠️ WARNING: This will permanently delete ALL GGn Upload Templator data including templates, settings, and selected template.\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?",
        )
      ) {
        this.deleteAllConfig();
      }
    });

    // Template actions
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        return;
      }

      const action = e.target.dataset.action;
      const templateName = e.target.dataset.template;

      if (action && templateName) {
        switch (action) {
          case "edit":
            document.body.removeChild(modal);
            this.editTemplate(templateName);
            break;
          case "clone":
            this.cloneTemplate(templateName);
            this.refreshTemplateManager(modal);
            break;
          case "delete":
            if (confirm(`Delete template "${templateName}"?`)) {
              this.deleteTemplate(templateName);
              this.refreshTemplateManager(modal);
            }
            break;
        }
      }
    });

    modal.querySelector("#close-manager").addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Close on Esc key for template manager
    const handleEscKey = (e) => {
      if (e.key === "Escape" && document.body.contains(modal)) {
        document.body.removeChild(modal);
        document.removeEventListener("keydown", handleEscKey);
      }
    };
    document.addEventListener("keydown", handleEscKey);
  }

  // Save settings from modal
  saveSettings(modal) {
    const formSelector = modal
      .querySelector("#setting-form-selector")
      .value.trim();
    const submitKeybinding = modal.querySelector(
      "#setting-submit-keybinding",
    ).checked;
    const customSelectorsText = modal
      .querySelector("#setting-custom-selectors")
      .value.trim();
    const customSelectors = customSelectorsText
      .split("\n")
      .map((selector) => selector.trim())
      .filter((selector) => selector);
    const ignoredFieldsText = modal
      .querySelector("#setting-ignored-fields")
      .value.trim();
    const ignoredFields = ignoredFieldsText
      .split("\n")
      .map((field) => field.trim())
      .filter((field) => field);

    this.config = {
      TARGET_FORM_SELECTOR: formSelector || DEFAULT_CONFIG.TARGET_FORM_SELECTOR,
      SUBMIT_KEYBINDING: submitKeybinding,
      CUSTOM_FIELD_SELECTORS:
        customSelectors.length > 0
          ? customSelectors
          : DEFAULT_CONFIG.CUSTOM_FIELD_SELECTORS,
      IGNORED_FIELDS_BY_DEFAULT:
        ignoredFields.length > 0
          ? ignoredFields
          : DEFAULT_CONFIG.IGNORED_FIELDS_BY_DEFAULT,
    };

    localStorage.setItem(
      "ggn-upload-templator-settings",
      JSON.stringify(this.config),
    );
    this.showStatus(
      "Settings saved successfully! Reload the page for some changes to take effect.",
    );
  }

  // Reset settings to defaults
  resetSettings(modal) {
    localStorage.removeItem("ggn-upload-templator-settings");
    this.config = { ...DEFAULT_CONFIG };

    // Update the form fields
    modal.querySelector("#setting-form-selector").value =
      this.config.TARGET_FORM_SELECTOR;
    modal.querySelector("#setting-submit-keybinding").checked =
      this.config.SUBMIT_KEYBINDING;
    modal.querySelector("#setting-custom-selectors").value =
      this.config.CUSTOM_FIELD_SELECTORS.join("\n");
    modal.querySelector("#setting-ignored-fields").value =
      this.config.IGNORED_FIELDS_BY_DEFAULT.join("\n");

    this.showStatus(
      "Settings reset to defaults! Reload the page for changes to take effect.",
    );
  }

  // Delete all local configuration
  deleteAllConfig() {
    // Remove all localStorage items related to GGn Upload Templator
    localStorage.removeItem("ggn-upload-templator-templates");
    localStorage.removeItem("ggn-upload-templator-selected");
    localStorage.removeItem("ggn-upload-templator-hide-unselected");
    localStorage.removeItem("ggn-upload-templator-settings");

    // Reset instance variables
    this.templates = {};
    this.selectedTemplate = null;
    this.hideUnselectedFields = true;
    this.config = { ...DEFAULT_CONFIG };

    // Update UI
    this.updateTemplateSelector();

    this.showStatus(
      "All local configuration deleted! Reload the page for changes to take full effect.",
      "success",
    );
  }

  // Delete template by name
  deleteTemplate(templateName) {
    delete this.templates[templateName];
    localStorage.setItem(
      "ggn-upload-templator-templates",
      JSON.stringify(this.templates),
    );

    if (this.selectedTemplate === templateName) {
      this.selectedTemplate = null;
      localStorage.removeItem("ggn-upload-templator-selected");
    }

    this.updateTemplateSelector();
    this.showStatus(`Template "${templateName}" deleted`);
  }

  // Clone template
  cloneTemplate(templateName) {
    const originalTemplate = this.templates[templateName];
    if (!originalTemplate) return;

    const cloneName = `${templateName} (Clone)`;
    this.templates[cloneName] = {
      mask: originalTemplate.mask,
      fieldMappings: { ...originalTemplate.fieldMappings },
      customUnselectedFields: originalTemplate.customUnselectedFields
        ? [...originalTemplate.customUnselectedFields]
        : undefined,
    };

    localStorage.setItem(
      "ggn-upload-templator-templates",
      JSON.stringify(this.templates),
    );

    this.updateTemplateSelector();
    this.showStatus(`Template "${cloneName}" created`);
  }

  // Edit template
  editTemplate(templateName) {
    const template = this.templates[templateName];
    if (!template) return;

    // Pre-populate the template creator with existing data
    this.showTemplateCreator(templateName, template);
  }

  // Refresh template manager modal content
  refreshTemplateManager(modal) {
    const templateList = modal.querySelector(".gut-template-list");
    if (!templateList) return;

    templateList.innerHTML = TEMPLATE_LIST_HTML(this);
  }

  // Show status message
  showStatus(message, type = "success") {
    const existing = document.querySelector(".gut-status");
    if (existing) existing.remove();

    const status = document.createElement("div");
    status.className = "gut-status";
    status.textContent = message;
    if (type === "error") {
      status.classList.add("error");
    }

    document.body.appendChild(status);

    setTimeout(() => {
      if (status.parentNode) {
        status.parentNode.removeChild(status);
      }
    }, 3000);
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
logDebug("Script loaded (readyState:", document.readyState, ")");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    logDebug("Initializing after DOMContentLoaded");
    try {
      new GGnUploadTemplator();
    } catch (error) {
      console.error("Failed to initialize:", error);
    }
  });
} else {
  logDebug("Initializing immediately (DOM already ready)");
  try {
    new GGnUploadTemplator();
  } catch (error) {
    console.error("Failed to initialize:", error);
  }
}
