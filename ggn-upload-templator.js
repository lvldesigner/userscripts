// ==UserScript==
// @name         GGn Upload Templator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto-fill upload forms using torrent file data with configurable templates
// @author       leveldesigner
// @license      Unlicense
// @icon         https://gazellegames.net/favicon.ico
// @match        https://*.gazellegames.net/upload.php*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Default configuration - can be overridden by user settings
  const DEFAULT_CONFIG = {
    TARGET_FORM_SELECTOR: "#upload_table",
    SUBMIT_KEYBINDING: true,
    IGNORED_FIELDS_BY_DEFAULT: [
      "linkgroup",
      "groupid",
      "apikey",
      "type",
      "amazonuri",
      "googleplaybooksuri",
      "goodreadsuri",
      "isbn",
      "scan_dpi",
      "other_dpi",
      "release_desc",
      "anonymous",
      "dont_check_rules",
      "title",
      "tags",
      "image",
      "gameswebsiteuri",
      "wikipediauri",
      "album_desc",
      "submit_upload",
    ],
  };

  // CSS Styles - Dark Theme with Explicit Styles
  const UI_STYLES = `
    #ggn-upload-templator-ui {
        background: #1a1a1a;
        border: 1px solid #404040;
        border-radius: 6px;
        padding: 15px;
        margin: 15px 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #e0e0e0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .ggn-upload-templator-controls {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
    }

    .gut-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
        outline: none;
        box-sizing: border-box;
        height: auto;
    }

    .gut-btn-primary {
        background: #0d7377;
        color: #ffffff;
        border: 1px solid #0d7377;
    }

    .gut-btn-primary:hover {
        background: #0a5d61;
        border-color: #0a5d61;
        transform: translateY(-1px);
    }

    .gut-btn-danger {
        background: #d32f2f;
        color: #ffffff;
        border: 1px solid #d32f2f;
    }

    .gut-btn-danger:hover:not(:disabled) {
        background: #b71c1c;
        border-color: #b71c1c;
        transform: translateY(-1px);
    }

    .gut-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    .gut-btn:not(:disabled):active {
        transform: translateY(0);
    }

    .gut-select {
        padding: 8px 12px;
        border: 1px solid #404040;
        border-radius: 4px;
        font-size: 14px;
        min-width: 200px;
        background: #2a2a2a;
        color: #e0e0e0;
        box-sizing: border-box;
        outline: none;
        height: auto;
        margin: 0 !important;
    }

    .gut-select:focus {
        border-color: #0d7377;
        box-shadow: 0 0 0 2px rgba(13, 115, 119, 0.2);
    }

    .gut-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
        box-sizing: border-box;
    }

    .gut-modal-content {
        background: #1a1a1a;
        border: 1px solid #404040;
        border-radius: 8px;
        padding: 24px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        width: 90%;
        color: #e0e0e0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        box-sizing: border-box;
    }

    .gut-modal h2 {
        margin: 0 0 20px 0;
        color: #ffffff;
        font-size: 24px;
        font-weight: 600;
        text-align: left;
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .gut-modal-back-btn {
        background: none;
        border: none;
        color: #e0e0e0;
        font-size: 16px;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        transition: color 0.2s ease, background-color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        font-family: monospace;
        font-weight: bold;
    }

    .gut-modal-back-btn:hover {
        color: #ffffff;
        background-color: #333333;
    }

    .gut-form-group {
        margin-bottom: 15px;
    }

    .gut-form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #b0b0b0;
        font-size: 14px;
    }

    .gut-form-group input, .gut-form-group textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #404040;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
        background: #2a2a2a;
        color: #e0e0e0;
        outline: none;
        transition: border-color 0.2s ease;
        height: auto;
    }

    .gut-form-group input:focus, .gut-form-group textarea:focus {
        border-color: #0d7377;
        box-shadow: 0 0 0 2px rgba(13, 115, 119, 0.2);
    }

    .gut-form-group input::placeholder, .gut-form-group textarea::placeholder {
        color: #666666;
    }

    .gut-field-list {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 10px;
        background: #0f0f0f;
    }

    .gut-field-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        padding: 8px;
        background: #2a2a2a;
        border-radius: 4px;
        border: 1px solid #404040;
    }

    .gut-field-row:hover {
        background: #333333;
    }

    .gut-field-row:not(:has(input[type="checkbox"]:checked)) {
        opacity: 0.6;
    }

    .gut-field-row.gut-hidden {
        display: none;
    }

    .gut-field-row input[type="checkbox"] {
        width: auto;
        margin: 0;
        accent-color: #0d7377;
        cursor: pointer;
    }

    .gut-field-row label {
        min-width: 150px;
        margin: 0;
        font-size: 13px;
        color: #b0b0b0;
        cursor: help;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .gut-field-row input[type="text"], .gut-field-row select {
        flex: 1;
        margin: 0;
        padding: 6px 8px;
        border: 1px solid #404040;
        border-radius: 3px;
        background: #1a1a1a;
        color: #e0e0e0;
        font-size: 12px;
        outline: none;
        height: auto;
    }

    .gut-field-row input[type="text"]:focus {
        border-color: #0d7377;
        box-shadow: 0 0 0 1px rgba(13, 115, 119, 0.3);
    }

    .gut-preview {
        color: #888888;
        font-style: italic;
        font-size: 11px;
        min-width: 100px;
        word-break: break-all;
        text-align: right;
    }

    .gut-preview.active {
        color: #4dd0e1;
        font-weight: bold;
        font-style: normal;
    }

    .gut-modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #404040;
    }

    .gut-status {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2e7d32;
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10001;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        border: 1px solid #4caf50;
        animation: slideInRight 0.3s ease-out;
    }

    .gut-status.error {
        background: #d32f2f;
        border-color: #f44336;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .gut-template-list {
        max-height: 400px;
        overflow-y: auto;
        border: 1px solid #404040;
        border-radius: 4px;
        background: #0f0f0f;
    }

    .gut-template-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #404040;
        background: #2a2a2a;
        transition: background-color 0.2s ease;
    }

    .gut-template-item:hover {
        background: #333333;
    }

    .gut-template-item:last-child {
        border-bottom: none;
    }

    .gut-template-name {
        font-weight: 500;
        color: #e0e0e0;
        flex: 1;
        margin-right: 10px;
    }

    .gut-template-actions {
        display: flex;
        gap: 8px;
    }

    .gut-btn-small {
        padding: 6px 12px;
        font-size: 12px;
        min-width: auto;
    }

    .gut-btn-secondary {
        background: #555555;
        color: #ffffff;
        border: 1px solid #555555;
    }

    .gut-btn-secondary:hover:not(:disabled) {
        background: #666666;
        border-color: #666666;
        transform: translateY(-1px);
    }

    /* Tab styles for modal */
    .gut-modal-tabs {
        display: flex;
        border-bottom: 1px solid #404040;
        margin-bottom: 20px;
    }

    .gut-tab-btn {
        padding: 12px 20px;
        background: transparent;
        border: none;
        color: #b0b0b0;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        height: auto;
    }

    .gut-tab-btn:hover {
        color: #e0e0e0;
        background: #2a2a2a;
    }

    .gut-tab-btn.active {
        color: #ffffff;
        border-bottom-color: #0d7377;
    }

    .gut-tab-content {
        display: none;
    }

    .gut-tab-content.active {
        display: block;
    }

    /* Checkbox label styling */
    .gut-checkbox-label {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 8px 12px !important;
        background: #2a2a2a !important;
        border: 1px solid #404040 !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        transition: border-color 0.2s ease !important;
        margin: 0 !important;
    }

    .gut-checkbox-label:hover {
        border-color: #0d7377 !important;
    }

    .gut-checkbox-label input[type="checkbox"] {
        width: auto !important;
        margin: 0 !important;
        accent-color: #0d7377 !important;
        cursor: pointer !important;
    }

    .gut-checkbox-text {
        font-size: 14px !important;
        font-weight: 500 !important;
        color: #b0b0b0 !important;
        user-select: none !important;
    }

    /* Scrollbar styling for webkit browsers */
    .gut-field-list::-webkit-scrollbar,
    .gut-modal-content::-webkit-scrollbar {
        width: 8px;
    }

    .gut-field-list::-webkit-scrollbar-track,
    .gut-modal-content::-webkit-scrollbar-track {
        background: #0f0f0f;
        border-radius: 4px;
    }

    .gut-field-list::-webkit-scrollbar-thumb,
    .gut-modal-content::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 4px;
    }

    .gut-field-list::-webkit-scrollbar-thumb:hover,
    .gut-modal-content::-webkit-scrollbar-thumb:hover {
        background: #555555;
    }
  `;

  // Torrent utility class
  class TorrentUtils {
    // Parse torrent file for metadata
    static async parseTorrentFile(file) {
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      try {
        const [torrent] = TorrentUtils.decodeBencode(data);
        return {
          name: torrent.info?.name || file.name,
          files: torrent.info?.files?.map((f) => ({
            path: f.path.join("/"),
            length: f.length,
          })) || [
            {
              path: torrent.info?.name || file.name,
              length: torrent.info?.length,
            },
          ],
        };
      } catch (e) {
        console.warn("Could not parse torrent file:", e);
        return { name: file.name, files: [] };
      }
    }

    // Simple bencode decoder
    static decodeBencode(data, offset = 0) {
      const char = String.fromCharCode(data[offset]);

      if (char === "d") {
        const dict = {};
        offset++;
        while (data[offset] !== 101) {
          const [key, newOffset1] = TorrentUtils.decodeBencode(data, offset);
          const [value, newOffset2] = TorrentUtils.decodeBencode(
            data,
            newOffset1,
          );
          dict[key] = value;
          offset = newOffset2;
        }
        return [dict, offset + 1];
      }

      if (char === "l") {
        const list = [];
        offset++;
        while (data[offset] !== 101) {
          const [value, newOffset] = TorrentUtils.decodeBencode(data, offset);
          list.push(value);
          offset = newOffset;
        }
        return [list, offset + 1];
      }

      if (char === "i") {
        offset++;
        let num = "";
        while (data[offset] !== 101) {
          num += String.fromCharCode(data[offset]);
          offset++;
        }
        return [parseInt(num), offset + 1];
      }

      if (char >= "0" && char <= "9") {
        let lengthStr = "";
        while (data[offset] !== 58) {
          lengthStr += String.fromCharCode(data[offset]);
          offset++;
        }
        const length = parseInt(lengthStr);
        offset++;

        const str = new TextDecoder("utf-8", { fatal: false }).decode(
          data.slice(offset, offset + length),
        );
        return [str, offset + length];
      }

      throw new Error("Invalid bencode data");
    }
  }

  class GGnUploadTemplator {
    constructor() {
      this.templates = JSON.parse(
        localStorage.getItem("ggn-upload-templator-templates") || "{}",
      );
      this.selectedTemplate =
        localStorage.getItem("ggn-upload-templator-selected") || null;
      this.hideUnselectedFields = JSON.parse(
        localStorage.getItem("ggn-upload-templator-hide-unselected") || "true",
      );

      // Load user settings or use defaults
      this.config = {
        ...DEFAULT_CONFIG,
        ...JSON.parse(
          localStorage.getItem("ggn-upload-templator-settings") || "{}",
        ),
      };

      this.init();
    }

    init() {
      this.injectUI();
      this.watchFileInputs();
      if (this.config.SUBMIT_KEYBINDING) {
        this.setupSubmitKeybinding();
      }
    }

    // Parse torrent name using template mask
    parseTemplate(mask, torrentName) {
      if (!mask || !torrentName) return {};

      // Convert template mask to regex with named groups
      const regexPattern = mask
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special chars
        .replace(/\\{([^}]+)\\}/g, "(?<$1>.+?)"); // Convert {field} to named groups (non-greedy)

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
    interpolate(template, data) {
      if (!template || !data) return template;
      return template.replace(
        /\{([^}]+)\}/g,
        (match, key) => data[key] || match,
      );
    }

    // Get current form data
    getCurrentFormData() {
      const formData = {};
      const formSelector = this.config.TARGET_FORM_SELECTOR || "form";
      const targetForm = document.querySelector(formSelector);
      const inputs = targetForm
        ? targetForm.querySelectorAll(
            "input[name], select[name], textarea[name]",
          )
        : document.querySelectorAll(
            "input[name], select[name], textarea[name]",
          );

      inputs.forEach((input) => {
        if (
          input.name &&
          input.type !== "file" &&
          input.type !== "button" &&
          input.type !== "submit"
        ) {
          // For radio buttons, only process if we haven't seen this group yet
          if (input.type === "radio" && formData[input.name]) {
            return; // Skip, already processed this radio group
          }

          const fieldInfo = {
            value:
              input.type === "checkbox" || input.type === "radio"
                ? input.checked
                : input.value || "",
            label: this.getFieldLabel(input),
            type: input.tagName.toLowerCase(),
            inputType: input.type,
          };

          // For radio buttons, we need to handle them specially - group by name
          if (input.type === "radio") {
            const radioGroup = document.querySelectorAll(
              `input[name="${input.name}"][type="radio"]`,
            );
            fieldInfo.radioOptions = Array.from(radioGroup).map((radio) => ({
              value: radio.value,
              checked: radio.checked,
              label: this.getFieldLabel(radio) || radio.value,
            }));
            // Find the selected value from the group
            const selectedRadio = Array.from(radioGroup).find(
              (radio) => radio.checked,
            );
            fieldInfo.selectedValue = selectedRadio ? selectedRadio.value : "";
            fieldInfo.value = fieldInfo.selectedValue; // Override value for radio groups
          }

          // For select elements, capture all options and current selection
          if (input.tagName.toLowerCase() === "select") {
            fieldInfo.options = Array.from(input.options).map((option) => ({
              value: option.value,
              text: option.textContent.trim(),
              selected: option.selected,
            }));
            fieldInfo.selectedValue = input.value;
          }

          formData[input.name] = fieldInfo;
        }
      });

      return formData;
    }

    // Get field label from parent table structure
    getFieldLabel(input) {
      // For radio buttons, look for associated label elements first
      if (input.type === "radio" && input.id) {
        const parentTd = input.closest("td");
        if (parentTd) {
          const associatedLabel = parentTd.querySelector(
            `label[for="${input.id}"]`,
          );
          if (associatedLabel) {
            return associatedLabel.textContent.trim() || input.value;
          }
        }
      }

      const parentRow = input.closest("tr");
      if (parentRow) {
        const labelCell = parentRow.querySelector("td.label");
        if (labelCell) {
          const labelText = labelCell.textContent.trim();
          return labelText ? `${labelText} (${input.name})` : input.name;
        }
      }
      return input.name;
    }

    // Create and inject UI elements
    injectUI() {
      this.injectStyles();

      // Always find the first file input on the page for UI injection
      const fileInput = document.querySelector('input[type="file"]');

      if (!fileInput) return;

      // Create UI container
      const uiContainer = document.createElement("div");
      uiContainer.id = "ggn-upload-templator-ui";
      uiContainer.innerHTML = `
                <div class="ggn-upload-templator-controls" style="align-items: flex-end;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label for="template-selector" style="font-size: 12px; color: #b0b0b0; margin: 0;">Select template</label>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <select id="template-selector" class="gut-select">
                                <option value="">Select Template</option>
                                <option value="none" ${this.selectedTemplate === "none" ? "selected" : ""}>None</option>
                                ${Object.keys(this.templates)
                                  .map(
                                    (name) =>
                                      `<option value="${name}" ${name === this.selectedTemplate ? "selected" : ""}>${name}</option>`,
                                  )
                                  .join("")}
                            </select>
                        </div>
                    </div>
                    <button type="button" id="create-template-btn" class="gut-btn gut-btn-primary">+ Create Template</button>
                     <button id="manage-templates-btn" type="button" class="gut-btn gut-btn-secondary" title="Manage Templates & Settings">Settings</button>
                </div>
            `;

      fileInput.parentNode.insertBefore(uiContainer, fileInput);

      // Bind events
      document
        .getElementById("create-template-btn")
        .addEventListener(
          "click",
          async () => await this.showTemplateCreator(),
        );
      document
        .getElementById("template-selector")
        .addEventListener("change", (e) => this.selectTemplate(e.target.value));
      document
        .getElementById("manage-templates-btn")
        .addEventListener("click", () => this.showTemplateAndSettingsManager());
    }

    // Inject CSS styles
    injectStyles() {
      if (document.getElementById("ggn-upload-templator-styles")) return;

      const styles = document.createElement("style");
      styles.id = "ggn-upload-templator-styles";
      styles.textContent = UI_STYLES;

      document.head.appendChild(styles);
    }

    // Show template creation modal
    async showTemplateCreator(editTemplateName = null, editTemplate = null) {
      const formData = this.getCurrentFormData();

      if (Object.keys(formData).length === 0) {
        alert("No form fields found on this page.");
        return;
      }

      // Check if there's already a torrent file selected and parse it
      let selectedTorrentName = "";
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
            selectedTorrentName = torrentData.name || "";
            break;
          } catch (error) {
            console.warn("Could not parse selected torrent file:", error);
          }
        }
      }

      const modal = document.createElement("div");
      modal.className = "gut-modal";
      modal.innerHTML = `
                <div class="gut-modal-content">
                    <h2>
                        ${editTemplateName ? '<button class="gut-modal-back-btn" id="back-to-manager" title="Back to Template Manager">&lt;</button>' : ""}
                        ${editTemplateName ? "Edit Template" : "Create Template"}
                    </h2>

                    <div class="gut-form-group">
                        <label for="template-name">Template Name:</label>
                        <input type="text" id="template-name" placeholder="e.g., Magazine Template" value="${editTemplateName ? this.escapeHtml(editTemplateName) : ""}">
                    </div>

                    <div class="gut-form-group">
                        <label for="torrent-mask">Torrent Name Mask:</label>
                        <input type="text" id="torrent-mask" placeholder="e.g., {magazine} - Issue {issue} - {month}-{year}.{ext}" value="${editTemplate ? this.escapeHtml(editTemplate.mask) : ""}">
                    </div>

                    <div class="gut-form-group">
                        <label for="sample-torrent">Sample Torrent Name (for preview):</label>
                        <input type="text" id="sample-torrent" value="${this.escapeHtml(selectedTorrentName)}" placeholder="e.g., PCWorld - Issue 05 - 01-2024.zip">
                    </div>

                    <div class="gut-form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px;">
                            <label style="margin: 0;">Form Fields:</label>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="text" id="field-filter" placeholder="Filter fields..." style="padding: 6px 8px; border: 1px solid #404040; border-radius: 3px; background: #2a2a2a; color: #e0e0e0; font-size: 12px; min-width: 150px;">
                                <button type="button" class="gut-btn gut-btn-secondary" id="toggle-unselected" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;">Show Unselected</button>
                            </div>
                        </div>
                        <div class="gut-field-list">
                              ${Object.entries(formData)
                                .map(([name, fieldData]) => {
                                  const isIgnoredByDefault =
                                    this.config.IGNORED_FIELDS_BY_DEFAULT.includes(
                                      name.toLowerCase(),
                                    );

                                  // When editing, check if this field is in the template
                                  const isInTemplate =
                                    editTemplate &&
                                    editTemplate.fieldMappings.hasOwnProperty(
                                      name,
                                    );
                                  const templateValue = isInTemplate
                                    ? editTemplate.fieldMappings[name]
                                    : null;

                                  // Check if there's custom selection state for this field
                                  let shouldBeChecked =
                                    isInTemplate || !isIgnoredByDefault;
                                  if (
                                    editTemplate &&
                                    editTemplate.customUnselectedFields
                                  ) {
                                    const customField =
                                      editTemplate.customUnselectedFields.find(
                                        (f) => f.field === name,
                                      );
                                    if (customField) {
                                      shouldBeChecked = customField.selected;
                                    }
                                  }

                                  return `
                                 <div class="gut-field-row ${isIgnoredByDefault && !isInTemplate && !shouldBeChecked ? "gut-hidden" : ""}">
                                     <input type="checkbox" ${shouldBeChecked ? "checked" : ""} data-field="${name}">
                                     <label title="${name}">${fieldData.label}:</label>
                                      ${
                                        fieldData.type === "select"
                                          ? `<select data-template="${name}" class="template-input gut-select">
                                           ${fieldData.options
                                             .map((option) => {
                                               let selected = option.selected;
                                               if (
                                                 templateValue &&
                                                 templateValue === option.value
                                               ) {
                                                 selected = true;
                                               }
                                               return `<option value="${this.escapeHtml(option.value)}" ${selected ? "selected" : ""}>${this.escapeHtml(option.text)}</option>`;
                                             })
                                             .join("")}
                                         </select>`
                                          : fieldData.inputType === "checkbox"
                                            ? `<input type="checkbox" ${templateValue !== null ? (templateValue ? "checked" : "") : fieldData.value ? "checked" : ""} data-template="${name}" class="template-input">`
                                            : fieldData.inputType === "radio"
                                              ? `<select data-template="${name}" class="template-input gut-select">
                                           ${fieldData.radioOptions
                                             .map((option) => {
                                               let selected = option.checked;
                                               if (
                                                 templateValue &&
                                                 templateValue === option.value
                                               ) {
                                                 selected = true;
                                               }
                                               return `<option value="${this.escapeHtml(option.value)}" ${selected ? "selected" : ""}>${this.escapeHtml(option.label)}</option>`;
                                             })
                                             .join("")}
                                         </select>`
                                              : `<input type="text" value="${templateValue !== null ? this.escapeHtml(String(templateValue)) : this.escapeHtml(String(fieldData.value))}" data-template="${name}" class="template-input">`
                                      }
                                     <span class="gut-preview" data-preview="${name}"></span>
                                 </div>
                            `;
                                })
                                .join("")}
                        </div>
                    </div>

                    <div class="gut-modal-actions">
                        <button class="gut-btn" id="cancel-template">Cancel</button>
                        <button class="gut-btn gut-btn-primary" id="save-template">${editTemplateName ? "Update Template" : "Save Template"}</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);

      // Setup live preview
      const maskInput = modal.querySelector("#torrent-mask");
      const sampleInput = modal.querySelector("#sample-torrent");
      const templateInputs = modal.querySelectorAll(".template-input");

      // Toggle unselected fields visibility
      const toggleBtn = modal.querySelector("#toggle-unselected");
      const filterInput = modal.querySelector("#field-filter");

      // Field filtering functionality
      const filterFields = () => {
        const filterValue = filterInput.value.toLowerCase();
        const fieldRows = modal.querySelectorAll(".gut-field-row");
        const fieldList = modal.querySelector(".gut-field-list");
        let visibleCount = 0;

        // Remove existing no-results message
        const existingMessage = fieldList.querySelector(".gut-no-results");
        if (existingMessage) {
          existingMessage.remove();
        }

        fieldRows.forEach((row) => {
          const checkbox = row.querySelector('input[type="checkbox"]');
          const label = row.querySelector("label");
          const fieldName = checkbox.dataset.field.toLowerCase();
          const labelText = label.textContent.toLowerCase();

          // Check if field matches filter (substring search on field name and label)
          const matchesFilter =
            !filterValue ||
            fieldName.includes(filterValue) ||
            labelText.includes(filterValue);

          // Apply visibility rules: filter + unselected visibility
          const shouldShowBasedOnSelection =
            checkbox.checked || !this.hideUnselectedFields;
          const shouldShow = matchesFilter && shouldShowBasedOnSelection;

          if (shouldShow) {
            row.classList.remove("gut-hidden");
            visibleCount++;
          } else {
            row.classList.add("gut-hidden");
          }
        });

        // Show no results message if filter is active and no fields are visible
        if (filterValue && visibleCount === 0) {
          const noResultsMessage = document.createElement("div");
          noResultsMessage.className = "gut-no-results";
          noResultsMessage.style.cssText =
            "padding: 20px; text-align: center; color: #888; font-style: italic;";
          noResultsMessage.textContent = `No fields found matching "${filterValue}"`;
          fieldList.appendChild(noResultsMessage);
        }
      };

      const toggleUnselectedFields = () => {
        this.hideUnselectedFields = !this.hideUnselectedFields;
        localStorage.setItem(
          "ggn-upload-templator-hide-unselected",
          JSON.stringify(this.hideUnselectedFields),
        );

        toggleBtn.textContent = this.hideUnselectedFields
          ? "Show Unselected"
          : "Hide Unselected";

        // Re-apply filter which will handle all visibility logic
        filterFields();
      };

      // Initialize button text and field visibility based on current state
      toggleBtn.textContent = this.hideUnselectedFields
        ? "Show Unselected"
        : "Hide Unselected";

      // Apply initial visibility state
      filterFields();

      toggleBtn.addEventListener("click", toggleUnselectedFields);
      filterInput.addEventListener("input", filterFields);

      const updatePreviews = () => {
        const mask = maskInput.value;
        const sample = sampleInput.value;
        const extracted = this.parseTemplate(mask, sample);

        templateInputs.forEach((input) => {
          const fieldName = input.dataset.template;
          const preview = modal.querySelector(`[data-preview="${fieldName}"]`);

          if (input.type === "checkbox") {
            preview.textContent = input.checked ? "✓ checked" : "✗ unchecked";
            preview.className = "gut-preview";
          } else {
            const inputValue = input.value || "";
            const interpolated = this.interpolate(inputValue, extracted);

            if (inputValue.includes("{") && Object.keys(extracted).length > 0) {
              preview.textContent = `→ ${interpolated}`;
              preview.className = "gut-preview active";
            } else {
              preview.textContent = "";
              preview.className = "gut-preview";
            }
          }
        });
      };

      [maskInput, sampleInput, ...templateInputs].forEach((input) => {
        input.addEventListener("input", updatePreviews);
        input.addEventListener("change", updatePreviews); // For select elements
      });

      // Initialize previews on modal open
      updatePreviews();

      // Update visibility when checkboxes change
      modal.addEventListener("change", (e) => {
        if (e.target.type === "checkbox") {
          filterFields(); // Re-apply all visibility rules including filter
        }
      });

      // Event handlers
      modal.querySelector("#cancel-template").addEventListener("click", () => {
        document.body.removeChild(modal);
      });

      modal.querySelector("#save-template").addEventListener("click", () => {
        this.saveTemplate(modal, editTemplateName);
      });

      // Close on background click
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });

      // Close on Esc key
      const handleEscKey = (e) => {
        if (e.key === "Escape" && document.body.contains(modal)) {
          document.body.removeChild(modal);
          document.removeEventListener("keydown", handleEscKey);
        }
      };
      document.addEventListener("keydown", handleEscKey);

      // Back to template manager button
      const backBtn = modal.querySelector("#back-to-manager");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          document.body.removeChild(modal);
          this.showTemplateAndSettingsManager();
        });
      }
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
          const isDefaultIgnored =
            this.config.IGNORED_FIELDS_BY_DEFAULT.includes(
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

      this.templates[name] = {
        mask,
        fieldMappings,
        customUnselectedFields:
          customUnselectedFields.length > 0
            ? customUnselectedFields
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

      selector.innerHTML = `
                <option value="">Select Template</option>
                <option value="none" ${this.selectedTemplate === "none" ? "selected" : ""}>None</option>
                ${Object.keys(this.templates)
                  .map(
                    (name) =>
                      `<option value="${name}" ${name === this.selectedTemplate ? "selected" : ""}>${name}</option>`,
                  )
                  .join("")}
            `;
    }

    // Select template
    selectTemplate(templateName) {
      this.selectedTemplate = templateName || null;

      if (templateName) {
        localStorage.setItem("ggn-upload-templator-selected", templateName);
      } else {
        localStorage.removeItem("ggn-upload-templator-selected");
      }

      if (templateName === "none") {
        this.showStatus("No template selected - auto-fill disabled");
      } else if (templateName) {
        this.showStatus(`Template "${templateName}" selected`);

        // Check if there's already a torrent file selected and apply template immediately
        this.checkAndApplyToExistingTorrent(templateName);
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
      modal.innerHTML = `
                <div class="gut-modal-content">
                    <div class="gut-modal-tabs">
                        <button class="gut-tab-btn active" data-tab="templates">Templates</button>
                        <button class="gut-tab-btn" data-tab="settings">Settings</button>
                    </div>

                    <div class="gut-tab-content active" id="templates-tab">
                        ${
                          Object.keys(this.templates).length === 0
                            ? '<div style="padding: 20px; text-align: center; color: #888;">No templates found. Create a template first.</div>'
                            : `<div class="gut-template-list">
                            ${Object.keys(this.templates)
                              .map(
                                (name) => `
                                <div class="gut-template-item">
                                    <span class="gut-template-name">${this.escapeHtml(name)}</span>
                                    <div class="gut-template-actions">
                                        <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="edit" data-template="${this.escapeHtml(name)}">Edit</button>
                                        <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="clone" data-template="${this.escapeHtml(name)}">Clone</button>
                                        <button class="gut-btn gut-btn-danger gut-btn-small" data-action="delete" data-template="${this.escapeHtml(name)}">Delete</button>
                                    </div>
                                </div>
                              `,
                              )
                              .join("")}
                          </div>`
                        }
                    </div>

                    <div class="gut-tab-content" id="settings-tab">
                        <div class="gut-form-group">
                            <label for="setting-form-selector">Target Form Selector:</label>
                            <input type="text" id="setting-form-selector" value="${this.escapeHtml(this.config.TARGET_FORM_SELECTOR)}" placeholder="#upload_table">
                        </div>

                        <div class="gut-form-group">
                            <label class="gut-checkbox-label">
                                <input type="checkbox" id="setting-submit-keybinding" ${this.config.SUBMIT_KEYBINDING ? "checked" : ""}>
                                <span class="gut-checkbox-text">⚡ Enable Ctrl+Enter form submission</span>
                            </label>
                        </div>

                        <div class="gut-form-group">
                            <label for="setting-ignored-fields">Ignored Fields (one per line):</label>
                            <textarea id="setting-ignored-fields" rows="8" placeholder="linkgroup&#10;groupid&#10;apikey">${this.config.IGNORED_FIELDS_BY_DEFAULT.join("\n")}</textarea>
                        </div>

                        <div class="gut-form-group">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; gap: 10px;">
                                    <button class="gut-btn gut-btn-primary" id="save-settings">Save Settings</button>
                                    <button class="gut-btn gut-btn-secondary" id="reset-settings">Reset to Defaults</button>
                                </div>
                                <button class="gut-btn gut-btn-danger" id="delete-all-config">Delete All Local Config</button>
                            </div>
                        </div>
                    </div>

                    <div class="gut-modal-actions">
                        <button class="gut-btn" id="close-manager">Close</button>
                    </div>
                </div>
            `;

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

      modal
        .querySelector("#delete-all-config")
        ?.addEventListener("click", () => {
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
      const ignoredFieldsText = modal
        .querySelector("#setting-ignored-fields")
        .value.trim();
      const ignoredFields = ignoredFieldsText
        .split("\n")
        .map((field) => field.trim())
        .filter((field) => field);

      this.config = {
        TARGET_FORM_SELECTOR:
          formSelector || DEFAULT_CONFIG.TARGET_FORM_SELECTOR,
        SUBMIT_KEYBINDING: submitKeybinding,
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

      if (Object.keys(this.templates).length === 0) {
        templateList.innerHTML = `
          <div style="padding: 20px; text-align: center; color: #888;">
            No templates found. Close this dialog and create a template first.
          </div>
        `;
        return;
      }

      templateList.innerHTML = Object.keys(this.templates)
        .map(
          (name) => `
          <div class="gut-template-item">
              <span class="gut-template-name">${this.escapeHtml(name)}</span>
              <div class="gut-template-actions">
                  <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="edit" data-template="${this.escapeHtml(name)}">Edit</button>
                  <button class="gut-btn gut-btn-secondary gut-btn-small" data-action="clone" data-template="${this.escapeHtml(name)}">Clone</button>
                  <button class="gut-btn gut-btn-danger gut-btn-small" data-action="delete" data-template="${this.escapeHtml(name)}">Delete</button>
              </div>
          </div>
        `,
        )
        .join("");
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

    // Apply template to form
    applyTemplate(templateName, torrentName) {
      const template = this.templates[templateName];
      if (!template) return;

      const extracted = this.parseTemplate(template.mask, torrentName);
      let appliedCount = 0;

      Object.entries(template.fieldMappings).forEach(
        ([fieldName, valueTemplate]) => {
          const formPrefix = this.config.TARGET_FORM_SELECTOR
            ? `${this.config.TARGET_FORM_SELECTOR} `
            : "";

          // First check if this is a radio button field
          const firstElement = document.querySelector(
            `${formPrefix}[name="${fieldName}"]`,
          );

          if (firstElement && firstElement.type === "radio") {
            // For radio buttons, find all radio buttons with the same name
            const radioButtons = document.querySelectorAll(
              `${formPrefix}input[name="${fieldName}"][type="radio"]`,
            );
            const newValue = this.interpolate(String(valueTemplate), extracted);

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
                const interpolated = this.interpolate(
                  String(valueTemplate),
                  extracted,
                );
                // Convert string to boolean - "true", "1", "yes", "on" are truthy
                newChecked = /^(true|1|yes|on)$/i.test(interpolated);
              }

              if (newChecked !== firstElement.checked) {
                firstElement.checked = newChecked;
                firstElement.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
                firstElement.dispatchEvent(
                  new Event("change", { bubbles: true }),
                );
                appliedCount++;
              }
            } else {
              const newValue = this.interpolate(
                String(valueTemplate),
                extracted,
              );
              if (newValue !== firstElement.value) {
                firstElement.value = newValue;
                firstElement.dispatchEvent(
                  new Event("input", { bubbles: true }),
                );
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
          `Applied template "${templateName}" - ${appliedCount} fields updated`,
        );
      }
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

    // Utility: Escape HTML
    escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => new GGnUploadTemplator(),
    );
  } else {
    new GGnUploadTemplator();
  }
})();
