// ==UserScript==
// @name         Upload Buddy - Torrent Template Manager
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto-fill upload forms using torrent file data with configurable templates
// @author       leveldesigner
// @icon         https://gazellegames.net/favicon.ico
// @match        https://*.gazellegames.net/upload.php*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const TARGET_FORM_SELECTOR = "#upload_table";
  const SUBMIT_KEYBINDING = true; // Set to true to enable Ctrl+Enter form submission

  // Fields to ignore by default (user can still enable them manually)
  const IGNORED_FIELDS_BY_DEFAULT = [
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
  ];

  // CSS Styles - Dark Theme with Explicit Styles
  const UI_STYLES = `
    #upload-buddy-ui {
        background: #1a1a1a !important;
        border: 1px solid #404040 !important;
        border-radius: 6px !important;
        padding: 15px !important;
        margin: 15px 0 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        color: #e0e0e0 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    }

    .upload-buddy-controls {
        display: flex !important;
        gap: 10px !important;
        align-items: center !important;
        flex-wrap: wrap !important;
    }

    .ub-btn {
        padding: 8px 16px !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
        text-decoration: none !important;
        outline: none !important;
        box-sizing: border-box !important;
        height: auto !important;
    }

    .ub-btn-primary {
        background: #0d7377 !important;
        color: #ffffff !important;
        border: 1px solid #0d7377 !important;
    }

    .ub-btn-primary:hover {
        background: #0a5d61 !important;
        border-color: #0a5d61 !important;
        transform: translateY(-1px) !important;
    }

    .ub-btn-danger {
        background: #d32f2f !important;
        color: #ffffff !important;
        border: 1px solid #d32f2f !important;
    }

    .ub-btn-danger:hover:not(:disabled) {
        background: #b71c1c !important;
        border-color: #b71c1c !important;
        transform: translateY(-1px) !important;
    }

    .ub-btn:disabled {
        opacity: 0.5 !important;
        cursor: not-allowed !important;
        transform: none !important;
    }

    .ub-btn:not(:disabled):active {
        transform: translateY(0) !important;
    }

    .ub-select {
        padding: 8px 12px !important;
        border: 1px solid #404040 !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        min-width: 200px !important;
        background: #2a2a2a !important;
        color: #e0e0e0 !important;
        box-sizing: border-box !important;
        outline: none !important;
        height: auto !important;
    }

    .ub-select:focus {
        border-color: #0d7377 !important;
        box-shadow: 0 0 0 2px rgba(13, 115, 119, 0.2) !important;
    }

    .ub-modal {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background: rgba(0, 0, 0, 0.8) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 10000 !important;
        padding: 20px !important;
        box-sizing: border-box !important;
    }

    .ub-modal-content {
        background: #1a1a1a !important;
        border: 1px solid #404040 !important;
        border-radius: 8px !important;
        padding: 24px !important;
        max-width: 800px !important;
        max-height: 80vh !important;
        overflow-y: auto !important;
        width: 90% !important;
        color: #e0e0e0 !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
        box-sizing: border-box !important;
    }

    .ub-modal h2 {
        margin: 0 0 20px 0 !important;
        color: #ffffff !important;
        font-size: 24px !important;
        font-weight: 600 !important;
        text-align: left !important;
    }

    .ub-form-group {
        margin-bottom: 15px !important;
    }

    .ub-form-group label {
        display: block !important;
        margin-bottom: 5px !important;
        font-weight: 500 !important;
        color: #b0b0b0 !important;
        font-size: 14px !important;
    }

    .ub-form-group input, .ub-form-group textarea {
        width: 100% !important;
        padding: 8px 12px !important;
        border: 1px solid #404040 !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        box-sizing: border-box !important;
        background: #2a2a2a !important;
        color: #e0e0e0 !important;
        outline: none !important;
        transition: border-color 0.2s ease !important;
        height: auto !important;
    }

    .ub-form-group input:focus, .ub-form-group textarea:focus {
        border-color: #0d7377 !important;
        box-shadow: 0 0 0 2px rgba(13, 115, 119, 0.2) !important;
    }

    .ub-form-group input::placeholder, .ub-form-group textarea::placeholder {
        color: #666666 !important;
    }

    .ub-field-list {
        max-height: 300px !important;
        overflow-y: auto !important;
        border: 1px solid #404040 !important;
        border-radius: 4px !important;
        padding: 10px !important;
        background: #0f0f0f !important;
    }

    .ub-field-row {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        margin-bottom: 8px !important;
        padding: 8px !important;
        background: #2a2a2a !important;
        border-radius: 4px !important;
        border: 1px solid #404040 !important;
    }

    .ub-field-row:hover {
        background: #333333 !important;
    }

    .ub-field-row:not(:has(input[type="checkbox"]:checked)) {
        opacity: 0.6 !important;
    }

    .ub-field-row.ub-hidden {
        display: none !important;
    }

    .ub-field-row input[type="checkbox"] {
        width: auto !important;
        margin: 0 !important;
        accent-color: #0d7377 !important;
        cursor: pointer !important;
    }

    .ub-field-row label {
        min-width: 150px !important;
        margin: 0 !important;
        font-size: 13px !important;
        color: #b0b0b0 !important;
        cursor: help !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
    }

    .ub-field-row input[type="text"], .ub-field-row select {
        flex: 1 !important;
        margin: 0 !important;
        padding: 6px 8px !important;
        border: 1px solid #404040 !important;
        border-radius: 3px !important;
        background: #1a1a1a !important;
        color: #e0e0e0 !important;
        font-size: 12px !important;
        outline: none !important;
        height: auto !important;
    }

    .ub-field-row input[type="text"]:focus {
        border-color: #0d7377 !important;
        box-shadow: 0 0 0 1px rgba(13, 115, 119, 0.3) !important;
    }

    .ub-preview {
        color: #888888 !important;
        font-style: italic !important;
        font-size: 11px !important;
        min-width: 100px !important;
        word-break: break-all !important;
        text-align: right !important;
    }

    .ub-preview.active {
        color: #4dd0e1 !important;
        font-weight: bold !important;
        font-style: normal !important;
    }

    .ub-modal-actions {
        display: flex !important;
        gap: 10px !important;
        justify-content: flex-end !important;
        margin-top: 20px !important;
        padding-top: 20px !important;
        border-top: 1px solid #404040 !important;
    }

    .ub-status {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #2e7d32 !important;
        color: #ffffff !important;
        padding: 12px 20px !important;
        border-radius: 6px !important;
        z-index: 10001 !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        border: 1px solid #4caf50 !important;
        animation: slideInRight 0.3s ease-out !important;
    }

    .ub-status.error {
        background: #d32f2f !important;
        border-color: #f44336 !important;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%) !important;
            opacity: 0 !important;
        }
        to {
            transform: translateX(0) !important;
            opacity: 1 !important;
        }
    }

    .ub-template-list {
        max-height: 400px !important;
        overflow-y: auto !important;
        border: 1px solid #404040 !important;
        border-radius: 4px !important;
        background: #0f0f0f !important;
    }

    .ub-template-item {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 12px 16px !important;
        border-bottom: 1px solid #404040 !important;
        background: #2a2a2a !important;
        transition: background-color 0.2s ease !important;
    }

    .ub-template-item:hover {
        background: #333333 !important;
    }

    .ub-template-item:last-child {
        border-bottom: none !important;
    }

    .ub-template-name {
        font-weight: 500 !important;
        color: #e0e0e0 !important;
        flex: 1 !important;
        margin-right: 10px !important;
    }

    .ub-template-actions {
        display: flex !important;
        gap: 8px !important;
    }

    .ub-btn-small {
        padding: 6px 12px !important;
        font-size: 12px !important;
        min-width: auto !important;
    }

    .ub-btn-secondary {
        background: #555555 !important;
        color: #ffffff !important;
        border: 1px solid #555555 !important;
    }

    .ub-btn-secondary:hover:not(:disabled) {
        background: #666666 !important;
        border-color: #666666 !important;
        transform: translateY(-1px) !important;
    }

    /* Scrollbar styling for webkit browsers */
    .ub-field-list::-webkit-scrollbar,
    .ub-modal-content::-webkit-scrollbar {
        width: 8px !important;
    }

    .ub-field-list::-webkit-scrollbar-track,
    .ub-modal-content::-webkit-scrollbar-track {
        background: #0f0f0f !important;
        border-radius: 4px !important;
    }

    .ub-field-list::-webkit-scrollbar-thumb,
    .ub-modal-content::-webkit-scrollbar-thumb {
        background: #404040 !important;
        border-radius: 4px !important;
    }

    .ub-field-list::-webkit-scrollbar-thumb:hover,
    .ub-modal-content::-webkit-scrollbar-thumb:hover {
        background: #555555 !important;
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

  class UploadBuddy {
    constructor() {
      this.templates = JSON.parse(
        localStorage.getItem("upload-buddy-templates") || "{}",
      );
      this.selectedTemplate =
        localStorage.getItem("upload-buddy-selected") || null;
      this.hideUnselectedFields = JSON.parse(
        localStorage.getItem("upload-buddy-hide-unselected") || "true",
      ); // Remember toggle state across page reloads
      this.init();
    }

    init() {
      this.injectUI();
      this.watchFileInputs();
      if (SUBMIT_KEYBINDING) {
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
      const formSelector = TARGET_FORM_SELECTOR || "form";
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

      // Find a good place to inject the UI (near form or file input)
      const formSelector = TARGET_FORM_SELECTOR || "form";
      const form = document.querySelector(formSelector);
      const fileInput = TARGET_FORM_SELECTOR
        ? form?.querySelector('input[type="file"]')
        : document.querySelector('input[type="file"]');
      const targetElement = fileInput || form;

      if (!targetElement) return;

      // Create UI container
      const uiContainer = document.createElement("div");
      uiContainer.id = "upload-buddy-ui";
      uiContainer.innerHTML = `
                <div class="upload-buddy-controls">
                    <button type="button" id="create-template-btn" class="ub-btn ub-btn-primary">⚙️ Create Template</button>
                    <select id="template-selector" class="ub-select">
                        <option value="">Select Template</option>
                        <option value="none" ${this.selectedTemplate === "none" ? "selected" : ""}>None</option>
                        ${Object.keys(this.templates)
                          .map(
                            (name) =>
                              `<option value="${name}" ${name === this.selectedTemplate ? "selected" : ""}>${name}</option>`,
                          )
                          .join("")}
                    </select>
                    <button id="manage-templates-btn" type="button" class="ub-btn ub-btn-primary" title="Manage Templates">⚙️</button>
                </div>
            `;

      targetElement.parentNode.insertBefore(uiContainer, targetElement);

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
        .addEventListener("click", () => this.showTemplateManager());
    }

    // Inject CSS styles
    injectStyles() {
      if (document.getElementById("upload-buddy-styles")) return;

      const styles = document.createElement("style");
      styles.id = "upload-buddy-styles";
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
      const fileInputs = TARGET_FORM_SELECTOR
        ? document.querySelectorAll(
            `${TARGET_FORM_SELECTOR} input[type="file"]`,
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
      modal.className = "ub-modal";
      modal.innerHTML = `
                <div class="ub-modal-content">
                    <h2>${editTemplateName ? "Edit Template" : "Create Template"}</h2>

                    <div class="ub-form-group">
                        <label for="template-name">Template Name:</label>
                        <input type="text" id="template-name" placeholder="e.g., Magazine Template" value="${editTemplateName ? this.escapeHtml(editTemplateName) : ""}">
                    </div>

                    <div class="ub-form-group">
                        <label for="torrent-mask">Torrent Name Mask:</label>
                        <input type="text" id="torrent-mask" placeholder="e.g., {magazine} - Issue {issue} - {month}-{year}.{ext}" value="${editTemplate ? this.escapeHtml(editTemplate.mask) : ""}">
                    </div>

                    <div class="ub-form-group">
                        <label for="sample-torrent">Sample Torrent Name (for preview):</label>
                        <input type="text" id="sample-torrent" value="${this.escapeHtml(selectedTorrentName)}" placeholder="e.g., PCWorld - Issue 05 - 01-2024.zip">
                    </div>

                    <div class="ub-form-group">
                        <label>Form Fields:</label>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span></span>
                            <button type="button" class="ub-btn" id="toggle-unselected">Show Unselected</button>
                        </div>
                        <div class="ub-field-list">
                              ${Object.entries(formData)
                                .map(([name, fieldData]) => {
                                  const isIgnoredByDefault =
                                    IGNORED_FIELDS_BY_DEFAULT.includes(
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
                                 <div class="ub-field-row ${isIgnoredByDefault && !isInTemplate && !shouldBeChecked ? "ub-hidden" : ""}">
                                     <input type="checkbox" ${shouldBeChecked ? "checked" : ""} data-field="${name}">
                                     <label title="${name}">${fieldData.label}:</label>
                                      ${
                                        fieldData.type === "select"
                                          ? `<select data-template="${name}" class="template-input ub-select">
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
                                              ? `<select data-template="${name}" class="template-input ub-select">
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
                                     <span class="ub-preview" data-preview="${name}"></span>
                                 </div>
                            `;
                                })
                                .join("")}
                        </div>
                    </div>

                    <div class="ub-modal-actions">
                        <button class="ub-btn" id="cancel-template">Cancel</button>
                        <button class="ub-btn ub-btn-primary" id="save-template">${editTemplateName ? "Update Template" : "Save Template"}</button>
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
      const toggleUnselectedFields = () => {
        this.hideUnselectedFields = !this.hideUnselectedFields;
        localStorage.setItem(
          "upload-buddy-hide-unselected",
          JSON.stringify(this.hideUnselectedFields),
        );

        toggleBtn.textContent = this.hideUnselectedFields
          ? "Show Unselected"
          : "Hide Unselected";

        const fieldRows = modal.querySelectorAll(".ub-field-row");
        fieldRows.forEach((row) => {
          const checkbox = row.querySelector('input[type="checkbox"]');
          if (!checkbox.checked) {
            if (this.hideUnselectedFields) {
              row.classList.add("ub-hidden");
            } else {
              row.classList.remove("ub-hidden");
            }
          }
        });
      };

      // Initialize button text and field visibility based on current state
      toggleBtn.textContent = this.hideUnselectedFields
        ? "Show Unselected"
        : "Hide Unselected";

      // Apply initial visibility state
      const fieldRows = modal.querySelectorAll(".ub-field-row");
      fieldRows.forEach((row) => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (!checkbox.checked) {
          if (this.hideUnselectedFields) {
            row.classList.add("ub-hidden");
          } else {
            row.classList.remove("ub-hidden");
          }
        }
      });

      toggleBtn.addEventListener("click", toggleUnselectedFields);

      const updatePreviews = () => {
        const mask = maskInput.value;
        const sample = sampleInput.value;
        const extracted = this.parseTemplate(mask, sample);

        templateInputs.forEach((input) => {
          const fieldName = input.dataset.template;
          const preview = modal.querySelector(`[data-preview="${fieldName}"]`);

          if (input.type === "checkbox") {
            preview.textContent = input.checked ? "✓ checked" : "✗ unchecked";
            preview.className = "ub-preview";
          } else {
            const inputValue = input.value || "";
            const interpolated = this.interpolate(inputValue, extracted);

            if (inputValue.includes("{") && Object.keys(extracted).length > 0) {
              preview.textContent = `→ ${interpolated}`;
              preview.className = "ub-preview active";
            } else {
              preview.textContent = "";
              preview.className = "ub-preview";
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
        if (e.target.type === "checkbox" && this.hideUnselectedFields) {
          const row = e.target.closest(".ub-field-row");
          if (row) {
            if (e.target.checked) {
              row.classList.remove("ub-hidden");
            } else {
              row.classList.add("ub-hidden");
            }
          }
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
        '.ub-field-row input[type="checkbox"]:checked',
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
      const allFieldRows = modal.querySelectorAll(".ub-field-row");
      const customUnselectedFields = [];

      allFieldRows.forEach((row) => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (checkbox) {
          const fieldName = checkbox.dataset.field;
          const isDefaultIgnored = IGNORED_FIELDS_BY_DEFAULT.includes(
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
          localStorage.setItem("upload-buddy-selected", name);
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
        "upload-buddy-templates",
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
        localStorage.setItem("upload-buddy-selected", templateName);
      } else {
        localStorage.removeItem("upload-buddy-selected");
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

      const fileInputs = TARGET_FORM_SELECTOR
        ? document.querySelectorAll(
            `${TARGET_FORM_SELECTOR} input[type="file"]`,
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

          const targetForm = document.querySelector(TARGET_FORM_SELECTOR);
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

    // Show template manager modal
    showTemplateManager() {
      if (Object.keys(this.templates).length === 0) {
        alert("No templates found. Create a template first.");
        return;
      }

      const modal = document.createElement("div");
      modal.className = "ub-modal";
      modal.innerHTML = `
                <div class="ub-modal-content">
                    <h2>Manage Templates</h2>
                    <div class="ub-template-list">
                        ${Object.keys(this.templates)
                          .map(
                            (name) => `
                            <div class="ub-template-item">
                                <span class="ub-template-name">${this.escapeHtml(name)}</span>
                                <div class="ub-template-actions">
                                    <button class="ub-btn ub-btn-secondary ub-btn-small" data-action="edit" data-template="${this.escapeHtml(name)}">Edit</button>
                                    <button class="ub-btn ub-btn-secondary ub-btn-small" data-action="clone" data-template="${this.escapeHtml(name)}">Clone</button>
                                    <button class="ub-btn ub-btn-danger ub-btn-small" data-action="delete" data-template="${this.escapeHtml(name)}">Delete</button>
                                </div>
                            </div>
                          `,
                          )
                          .join("")}
                    </div>
                    <div class="ub-modal-actions">
                        <button class="ub-btn" id="close-manager">Close</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);

      // Bind events
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
              // Refresh the modal content instead of closing
              this.refreshTemplateManager(modal);
              break;
            case "delete":
              if (confirm(`Delete template "${templateName}"?`)) {
                this.deleteTemplate(templateName);
                // Refresh the modal content instead of closing
                this.refreshTemplateManager(modal);
              }
              break;
          }
        }
      });

      modal.querySelector("#close-manager").addEventListener("click", () => {
        document.body.removeChild(modal);
      });
    }

    // Delete template by name
    deleteTemplate(templateName) {
      delete this.templates[templateName];
      localStorage.setItem(
        "upload-buddy-templates",
        JSON.stringify(this.templates),
      );

      if (this.selectedTemplate === templateName) {
        this.selectedTemplate = null;
        localStorage.removeItem("upload-buddy-selected");
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
        "upload-buddy-templates",
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
      const templateList = modal.querySelector(".ub-template-list");
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
          <div class="ub-template-item">
              <span class="ub-template-name">${this.escapeHtml(name)}</span>
              <div class="ub-template-actions">
                  <button class="ub-btn ub-btn-secondary ub-btn-small" data-action="edit" data-template="${this.escapeHtml(name)}">Edit</button>
                  <button class="ub-btn ub-btn-secondary ub-btn-small" data-action="clone" data-template="${this.escapeHtml(name)}">Clone</button>
                  <button class="ub-btn ub-btn-danger ub-btn-small" data-action="delete" data-template="${this.escapeHtml(name)}">Delete</button>
              </div>
          </div>
        `,
        )
        .join("");
    }

    // Watch file inputs for changes
    watchFileInputs() {
      const fileInputs = TARGET_FORM_SELECTOR
        ? document.querySelectorAll(
            `${TARGET_FORM_SELECTOR} input[type="file"]`,
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
          const formPrefix = TARGET_FORM_SELECTOR
            ? `${TARGET_FORM_SELECTOR} `
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
      const existing = document.querySelector(".ub-status");
      if (existing) existing.remove();

      const status = document.createElement("div");
      status.className = "ub-status";
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
    document.addEventListener("DOMContentLoaded", () => new UploadBuddy());
  } else {
    new UploadBuddy();
  }
})();
