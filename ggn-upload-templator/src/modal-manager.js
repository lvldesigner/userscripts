import { DEFAULT_CONFIG } from "./config.js";
import {
  saveSettings,
  removeSettings,
  deleteAllConfig as deleteAllConfigFromStorage,
  saveSandboxSets,
  saveCurrentSandboxSet,
} from "./storage.js";
import { MODAL_HTML } from "./ui/template.js";
import {
  renderSandboxResults,
  setupMaskValidation,
} from "./ui/manager.js";
import { testMaskAgainstSamples } from "./utils/template.js";
import { getFieldLabel } from "./utils/form.js";
import { updateMaskHighlighting } from "./utils/highlighting.js";
import { buildKeybindingFromEvent } from "./utils/keyboard.js";
import {
  deleteTemplate,
  cloneTemplate,
  editTemplate,
  refreshTemplateManager,
} from "./template-operations.js";

export function showTemplateAndSettingsManager(instance) {
  const modal = document.createElement("div");
  modal.className = "gut-modal";
  modal.innerHTML = MODAL_HTML(instance);

  document.body.appendChild(modal);

  modal.querySelectorAll(".gut-tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tabName = e.target.dataset.tab;

      modal
        .querySelectorAll(".gut-tab-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      modal
        .querySelectorAll(".gut-tab-content")
        .forEach((c) => c.classList.remove("active"));
      modal.querySelector(`#${tabName}-tab`).classList.add("active");
    });
  });

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

    const originalSelectors = instance.config.CUSTOM_FIELD_SELECTORS;
    instance.config.CUSTOM_FIELD_SELECTORS = selectors;

    if (selectors.length === 0) {
      previewGroup.style.display = "none";
      instance.config.CUSTOM_FIELD_SELECTORS = originalSelectors;
      return;
    }

    previewGroup.style.display = "block";

    let matchedElements = [];
    const formSelector =
      modal.querySelector("#setting-form-selector").value.trim() ||
      instance.config.TARGET_FORM_SELECTOR;
    const targetForm = document.querySelector(formSelector);

    selectors.forEach((selector) => {
      try {
        const elements = targetForm
          ? targetForm.querySelectorAll(selector)
          : document.querySelectorAll(selector);

        Array.from(elements).forEach((element) => {
          const tagName = element.tagName.toLowerCase();
          const id = element.id;
          const name = element.name || element.getAttribute("name");
          const classes = element.className || "";
          const label = getFieldLabel(element, instance.config);

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
              <span class="gut-variable-name">${instance.escapeHtml(displayName)}</span>
              <span class="gut-variable-value">${instance.escapeHtml(displayInfo)}</span>
            </div>
          `;
        })
        .join("");
    }

    instance.config.CUSTOM_FIELD_SELECTORS = originalSelectors;
  };

  updateCustomSelectorsPreview();

  customSelectorsTextarea.addEventListener(
    "input",
    updateCustomSelectorsPreview,
  );

  modal
    .querySelector("#setting-form-selector")
    .addEventListener("input", updateCustomSelectorsPreview);

  modal.querySelector("#ggn-infobox-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    const currentValue = customSelectorsTextarea.value.trim();
    const ggnInfoboxSelector = ".infobox-input-holder input";

    if (!currentValue.includes(ggnInfoboxSelector)) {
      const newValue = currentValue
        ? `${currentValue}\n${ggnInfoboxSelector}`
        : ggnInfoboxSelector;
      customSelectorsTextarea.value = newValue;
      updateCustomSelectorsPreview();
    }
  });

  modal.querySelector("#save-settings")?.addEventListener("click", () => {
    saveSettingsFromModal(instance, modal);
  });

  modal.querySelector("#reset-settings")?.addEventListener("click", () => {
    if (
      confirm(
        "Reset all settings to defaults? This will require a page reload.",
      )
    ) {
      resetSettings(instance, modal);
    }
  });

  modal.querySelector("#delete-all-config")?.addEventListener("click", () => {
    if (
      confirm(
        "⚠️ WARNING: This will permanently delete ALL GGn Upload Templator data including templates, settings, and selected template.\n\nThis action CANNOT be undone!\n\nAre you sure you want to continue?",
      )
    ) {
      deleteAllConfig(instance);
    }
  });

  const sandboxMaskInput = modal.querySelector("#sandbox-mask-input");
  const sandboxMaskDisplay = modal.querySelector("#sandbox-mask-display");
  const sandboxSampleInput = modal.querySelector("#sandbox-sample-input");
  const sandboxResultsContainer = modal.querySelector("#sandbox-results");
  const sandboxSetSelect = modal.querySelector("#sandbox-set-select");
  const saveBtn = modal.querySelector("#save-sandbox-set");
  const renameBtn = modal.querySelector("#rename-sandbox-set");
  const deleteBtn = modal.querySelector("#delete-sandbox-set");
  const sandboxCursorInfo = modal.querySelector("#sandbox-mask-cursor-info");
  const sandboxStatusContainer = modal.querySelector("#sandbox-mask-status");

  let sandboxDebounceTimeout = null;
  let currentLoadedSet = instance.currentSandboxSet || "";
  
  const updateButtonStates = () => {
    if (currentLoadedSet && currentLoadedSet !== "") {
      saveBtn.textContent = "Update";
      renameBtn.style.display = "";
      deleteBtn.style.display = "";
    } else {
      saveBtn.textContent = "Save";
      renameBtn.style.display = "none";
      deleteBtn.style.display = "none";
    }
  };
  
  updateButtonStates();

  const updateSandboxTest = () => {
    const mask = sandboxMaskInput.value;
    const sampleText = sandboxSampleInput.value.trim();
    const samples = sampleText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s);

    if (!mask || samples.length === 0) {
      sandboxResultsContainer.innerHTML =
        '<div class="gut-no-variables">Enter a mask and sample torrent names to test.</div>';
      return;
    }

    const result = testMaskAgainstSamples(mask, samples, instance.hints);
    renderSandboxResults(modal, result);
  };

  const debouncedUpdateSandboxTest = () => {
    if (sandboxDebounceTimeout) {
      clearTimeout(sandboxDebounceTimeout);
    }
    sandboxDebounceTimeout = setTimeout(updateSandboxTest, 300);
  };

  const performSandboxValidation = setupMaskValidation(
    sandboxMaskInput,
    sandboxCursorInfo,
    sandboxStatusContainer,
    sandboxMaskDisplay,
    () => {
      debouncedUpdateSandboxTest();
    },
    instance.hints
  );

  sandboxMaskInput?.addEventListener("scroll", () => {
    sandboxMaskDisplay.scrollTop = sandboxMaskInput.scrollTop;
    sandboxMaskDisplay.scrollLeft = sandboxMaskInput.scrollLeft;
  });

  sandboxSampleInput?.addEventListener("input", debouncedUpdateSandboxTest);

  sandboxSetSelect?.addEventListener("change", () => {
    const value = sandboxSetSelect.value;
    
    if (!value || value === "") {
      currentLoadedSet = "";
      instance.currentSandboxSet = "";
      updateButtonStates();
      return;
    }

    const sets = JSON.parse(
      localStorage.getItem("ggn-upload-templator-sandbox-sets") || "{}",
    );
    const data = sets[value];

    if (data) {
      sandboxMaskInput.value = data.mask || "";
      sandboxSampleInput.value = data.samples || "";
      updateMaskHighlighting(sandboxMaskInput, sandboxMaskDisplay);
      updateSandboxTest();
      currentLoadedSet = value;
      instance.currentSandboxSet = value;
      localStorage.setItem("ggn-upload-templator-sandbox-current", value);
      updateButtonStates();
    }
  });

  saveBtn?.addEventListener("click", () => {
    if (currentLoadedSet && currentLoadedSet !== "") {
      const data = {
        mask: sandboxMaskInput.value,
        samples: sandboxSampleInput.value,
      };
      
      saveSandboxSet(instance, currentLoadedSet, data);
      instance.showStatus(`Test set "${currentLoadedSet}" updated successfully!`);
    } else {
      const name = prompt("Enter a name for this test set:");
      if (name && name.trim()) {
        const trimmedName = name.trim();
        const data = {
          mask: sandboxMaskInput.value,
          samples: sandboxSampleInput.value,
        };
        
        saveSandboxSet(instance, trimmedName, data);
        instance.currentSandboxSet = trimmedName;
        currentLoadedSet = trimmedName;
        localStorage.setItem("ggn-upload-templator-sandbox-current", trimmedName);
        
        const existingOption = sandboxSetSelect.querySelector(`option[value="${trimmedName}"]`);
        if (existingOption) {
          existingOption.selected = true;
        } else {
          const newOption = document.createElement("option");
          newOption.value = trimmedName;
          newOption.textContent = trimmedName;
          sandboxSetSelect.appendChild(newOption);
          newOption.selected = true;
        }
        
        updateButtonStates();
        instance.showStatus(`Test set "${trimmedName}" saved successfully!`);
      }
    }
  });

  deleteBtn?.addEventListener("click", () => {
    if (!currentLoadedSet || currentLoadedSet === "") {
      return;
    }

    if (confirm(`Delete test set "${currentLoadedSet}"?`)) {
      deleteSandboxSet(instance, currentLoadedSet);

      const option = sandboxSetSelect.querySelector(
        `option[value="${currentLoadedSet}"]`,
      );
      if (option) {
        option.remove();
      }

      sandboxSetSelect.value = "";
      currentLoadedSet = "";
      instance.currentSandboxSet = "";
      localStorage.setItem("ggn-upload-templator-sandbox-current", "");
      sandboxMaskInput.value = "";
      sandboxSampleInput.value = "";
      sandboxResultsContainer.innerHTML =
        '<div class="gut-no-variables">Enter a mask and sample torrent names to test.</div>';
      
      updateButtonStates();
      instance.showStatus(`Test set deleted successfully!`);
    }
  });

  renameBtn?.addEventListener("click", () => {
    if (!currentLoadedSet || currentLoadedSet === "") {
      return;
    }

    const newName = prompt(`Rename test set "${currentLoadedSet}" to:`, currentLoadedSet);
    if (!newName || !newName.trim() || newName.trim() === currentLoadedSet) {
      return;
    }

    const trimmedName = newName.trim();

    if (instance.sandboxSets[trimmedName]) {
      alert(`A test set named "${trimmedName}" already exists.`);
      return;
    }

    const data = instance.sandboxSets[currentLoadedSet];
    instance.sandboxSets[trimmedName] = data;
    delete instance.sandboxSets[currentLoadedSet];
    localStorage.setItem(
      "ggn-upload-templator-sandbox-sets",
      JSON.stringify(instance.sandboxSets),
    );

    const option = sandboxSetSelect.querySelector(
      `option[value="${currentLoadedSet}"]`,
    );
    if (option) {
      option.value = trimmedName;
      option.textContent = trimmedName;
      option.selected = true;
    }

    currentLoadedSet = trimmedName;
    instance.currentSandboxSet = trimmedName;
    localStorage.setItem("ggn-upload-templator-sandbox-current", trimmedName);

    instance.showStatus(`Test set renamed to "${trimmedName}" successfully!`);
  });

  const resetFieldsLink = modal.querySelector("#reset-sandbox-fields");
  resetFieldsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    sandboxMaskInput.value = "";
    sandboxSampleInput.value = "";
    sandboxResultsContainer.innerHTML =
      '<div class="gut-no-variables">Enter a mask and sample names to see match results.</div>';
    const resultsLabel = modal.querySelector("#sandbox-results-label");
    if (resultsLabel) {
      resultsLabel.textContent = "Match Results:";
    }
    updateMaskHighlighting(sandboxMaskInput, sandboxMaskDisplay);
  });

  if (sandboxMaskInput && currentLoadedSet && currentLoadedSet !== "") {
    const sets = JSON.parse(
      localStorage.getItem("ggn-upload-templator-sandbox-sets") || "{}",
    );
    const data = sets[currentLoadedSet];
    
    if (data) {
      sandboxMaskInput.value = data.mask || "";
      sandboxSampleInput.value = data.samples || "";
      updateMaskHighlighting(sandboxMaskInput, sandboxMaskDisplay);
      updateSandboxTest();
    }
  } else if (sandboxMaskInput) {
    updateMaskHighlighting(sandboxMaskInput, sandboxMaskDisplay);
    if (sandboxMaskInput.value && sandboxSampleInput.value) {
      updateSandboxTest();
    }
  }

  let isRecording = false;

  const setupRecordKeybindingHandler = (
    inputSelector,
    keybindingSpanIndex,
    recordBtnSelector,
  ) => {
    modal.querySelector(recordBtnSelector)?.addEventListener("click", () => {
      const input = modal.querySelector(inputSelector);
      const keybindingSpans = modal.querySelectorAll(".gut-keybinding-text");
      const keybindingSpan = keybindingSpans[keybindingSpanIndex];
      const recordBtn = modal.querySelector(recordBtnSelector);

      recordBtn.textContent = "Press keys...";
      recordBtn.disabled = true;
      isRecording = true;

      const handleKeydown = (e) => {
        e.preventDefault();
        const isModifierKey = ["Control", "Alt", "Shift", "Meta"].includes(
          e.key,
        );

        if (e.key === "Escape") {
          recordBtn.textContent = "Record";
          recordBtn.disabled = false;
          isRecording = false;
          document.removeEventListener("keydown", handleKeydown);
          return;
        }

        if (!isModifierKey) {
          const keybinding = buildKeybindingFromEvent(e);
          input.value = keybinding;
          if (keybindingSpan) {
            keybindingSpan.textContent = keybinding;
          }

          recordBtn.textContent = "Record";
          recordBtn.disabled = false;
          isRecording = false;

          document.removeEventListener("keydown", handleKeydown);
        }
      };

      document.addEventListener("keydown", handleKeydown);
    });
  };

  setupRecordKeybindingHandler(
    "#custom-submit-keybinding-input",
    0,
    "#record-submit-keybinding-btn",
  );
  setupRecordKeybindingHandler(
    "#custom-apply-keybinding-input",
    1,
    "#record-apply-keybinding-btn",
  );

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
          editTemplate(instance, templateName);
          break;
        case "clone":
          cloneTemplate(instance, templateName);
          refreshTemplateManager(instance, modal);
          break;
        case "delete":
          if (confirm(`Delete template "${templateName}"?`)) {
            deleteTemplate(instance, templateName);
            refreshTemplateManager(instance, modal);
          }
          break;
      }
    }
  });

  modal.querySelectorAll('[data-action="delete-hint"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const hintItem = e.target.closest(".gut-hint-item");
      const hintName = hintItem?.dataset.hint;
      if (hintName && confirm(`Delete hint "${hintName}"?`)) {
        const { saveHints } = require("./hint-storage.js");
        delete instance.hints[hintName];
        saveHints(instance.hints);
        hintItem.remove();
      }
    });
  });

  modal.querySelectorAll('[data-action="view-mappings"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const hintItem = e.target.closest(".gut-hint-item");
      const hintName = hintItem?.dataset.hint;
      if (hintName && instance.hints[hintName]?.mappings) {
        const mappings = instance.hints[hintName].mappings;
        const mappingText = Object.entries(mappings)
          .map(([key, value]) => `${key} → ${value}`)
          .join('\n');
        alert(`Mappings for "${hintName}":\n\n${mappingText}`);
      }
    });
  });

  const addHintBtn = modal.querySelector("#add-hint-btn");
  if (addHintBtn) {
    addHintBtn.addEventListener("click", () => {
      const name = prompt("Enter hint name (e.g., 'my_hint'):");
      if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
        alert("Invalid hint name. Use only letters, numbers, and underscores.");
        return;
      }
      if (instance.hints[name]) {
        alert(`Hint "${name}" already exists.`);
        return;
      }
      
      const type = prompt("Enter hint type:\n1. pattern (e.g., v*)\n2. regex (e.g., /v\\d+/)\n3. map (key-value mappings)\n\nEnter 1, 2, or 3:");
      
      let hintDef;
      if (type === '1') {
        const pattern = prompt("Enter pattern (use *, #, @, ?):");
        if (!pattern) return;
        hintDef = { type: 'pattern', pattern, description: prompt("Description (optional):") || '' };
      } else if (type === '2') {
        const regex = prompt("Enter regex pattern (without slashes):");
        if (!regex) return;
        try {
          new RegExp(regex);
          hintDef = { type: 'regex', pattern: regex, description: prompt("Description (optional):") || '' };
        } catch (e) {
          alert(`Invalid regex: ${e.message}`);
          return;
        }
      } else if (type === '3') {
        alert("Map hints must be created by editing the config directly for now.");
        return;
      } else {
        alert("Invalid type selection.");
        return;
      }
      
      const { saveHints } = require("./hint-storage.js");
      instance.hints[name] = hintDef;
      saveHints(instance.hints);
      
      document.body.removeChild(modal);
      showTemplateAndSettingsManager(instance);
      modal.querySelector('[data-tab="hints"]')?.click();
    });
  }

  modal.querySelector("#close-manager").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  const handleEscKey = (e) => {
    if (e.key === "Escape" && document.body.contains(modal) && !isRecording) {
      document.body.removeChild(modal);
      document.removeEventListener("keydown", handleEscKey);
    }
  };
  document.addEventListener("keydown", handleEscKey);
}

export function saveSettingsFromModal(instance, modal) {
  const formSelector = modal
    .querySelector("#setting-form-selector")
    .value.trim();
  const submitKeybinding = modal.querySelector(
    "#setting-submit-keybinding",
  ).checked;
  const customSubmitKeybinding = modal
    .querySelector("#custom-submit-keybinding-input")
    .value.trim();
  const applyKeybinding = modal.querySelector(
    "#setting-apply-keybinding",
  ).checked;
  const customApplyKeybinding = modal
    .querySelector("#custom-apply-keybinding-input")
    .value.trim();
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

  instance.config = {
    TARGET_FORM_SELECTOR: formSelector || DEFAULT_CONFIG.TARGET_FORM_SELECTOR,
    SUBMIT_KEYBINDING: submitKeybinding,
    CUSTOM_SUBMIT_KEYBINDING:
      customSubmitKeybinding || DEFAULT_CONFIG.CUSTOM_SUBMIT_KEYBINDING,
    APPLY_KEYBINDING: applyKeybinding,
    CUSTOM_APPLY_KEYBINDING:
      customApplyKeybinding || DEFAULT_CONFIG.CUSTOM_APPLY_KEYBINDING,
    CUSTOM_FIELD_SELECTORS:
      customSelectors.length > 0
        ? customSelectors
        : DEFAULT_CONFIG.CUSTOM_FIELD_SELECTORS,
    IGNORED_FIELDS_BY_DEFAULT:
      ignoredFields.length > 0
        ? ignoredFields
        : DEFAULT_CONFIG.IGNORED_FIELDS_BY_DEFAULT,
  };

  saveSettings(instance.config);
  instance.showStatus(
    "Settings saved successfully! Reload the page for some changes to take effect.",
  );
}

export function resetSettings(instance, modal) {
  removeSettings();
  instance.config = { ...DEFAULT_CONFIG };

  modal.querySelector("#setting-form-selector").value =
    instance.config.TARGET_FORM_SELECTOR;
  modal.querySelector("#setting-submit-keybinding").checked =
    instance.config.SUBMIT_KEYBINDING;
  modal.querySelector("#custom-submit-keybinding-input").value =
    instance.config.CUSTOM_SUBMIT_KEYBINDING;
  modal.querySelector("#setting-apply-keybinding").checked =
    instance.config.APPLY_KEYBINDING;
  modal.querySelector("#custom-apply-keybinding-input").value =
    instance.config.CUSTOM_APPLY_KEYBINDING;
  modal.querySelector("#setting-custom-selectors").value =
    instance.config.CUSTOM_FIELD_SELECTORS.join("\n");
  modal.querySelector("#setting-ignored-fields").value =
    instance.config.IGNORED_FIELDS_BY_DEFAULT.join("\n");

  const submitKeybindingSpan = modal.querySelector(".gut-keybinding-text");
  submitKeybindingSpan.textContent = instance.config.CUSTOM_SUBMIT_KEYBINDING;
  const applyKeybindingSpans = modal.querySelectorAll(".gut-keybinding-text");
  if (applyKeybindingSpans.length > 1) {
    applyKeybindingSpans[1].textContent = instance.config.CUSTOM_APPLY_KEYBINDING;
  }

  instance.showStatus(
    "Settings reset to defaults! Reload the page for changes to take effect.",
  );
}

export function deleteAllConfig(instance) {
  deleteAllConfigFromStorage();

  instance.templates = {};
  instance.selectedTemplate = null;
  instance.hideUnselectedFields = true;
  instance.config = { ...DEFAULT_CONFIG };

  instance.updateTemplateSelector();

  instance.showStatus(
    "All local configuration deleted! Reload the page for changes to take full effect.",
    "success",
  );
}

export function saveSandboxSet(instance, name, data) {
  instance.sandboxSets[name] = data;
  saveSandboxSets(instance.sandboxSets);
}

export function deleteSandboxSet(instance, name) {
  delete instance.sandboxSets[name];
  saveSandboxSets(instance.sandboxSets);
  if (instance.currentSandboxSet === name) {
    instance.currentSandboxSet = "";
    saveCurrentSandboxSet("");
  }
}

export function showSandboxWithMask(instance, mask, sample) {
  showTemplateAndSettingsManager(instance);

  setTimeout(() => {
    const modal = document.querySelector(".gut-modal");
    if (!modal) return;

    const sandboxTabBtn = modal.querySelector('[data-tab="sandbox"]');
    if (sandboxTabBtn) {
      sandboxTabBtn.click();
    }

    setTimeout(() => {
      const sandboxMaskInput = modal.querySelector("#sandbox-mask-input");
      const sandboxMaskDisplay = modal.querySelector("#sandbox-mask-display");
      const sandboxSampleInput = modal.querySelector("#sandbox-sample-input");

      if (sandboxMaskInput && sandboxSampleInput) {
        sandboxMaskInput.value = mask;
        sandboxSampleInput.value = sample;

        updateMaskHighlighting(sandboxMaskInput, sandboxMaskDisplay);

        sandboxMaskInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, 50);
  }, 50);
}
