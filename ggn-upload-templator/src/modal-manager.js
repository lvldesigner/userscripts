import { DEFAULT_CONFIG } from "./config.js";
import {
  saveSettings,
  removeSettings,
  deleteAllConfig as deleteAllConfigFromStorage,
  saveSandboxSets,
  saveCurrentSandboxSet,
} from "./storage.js";
import { 
  saveHints, 
  resetHintToDefault, 
  loadHints 
} from "./hint-storage.js";
import { MODAL_HTML, HINT_EDITOR_MODAL_HTML } from "./ui/template.js";
import {
  renderSandboxResults,
  setupMaskValidation,
} from "./ui/manager.js";
import { testMaskAgainstSamples, compileUserMaskToRegex } from "./utils/template.js";
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
  const toggleCompiledRegexLink = modal.querySelector("#toggle-compiled-regex");
  const sandboxCompiledRegexDisplay = modal.querySelector("#sandbox-compiled-regex");

  let sandboxDebounceTimeout = null;
  let currentLoadedSet = instance.currentSandboxSet || "";
  let showingCompiledRegex = localStorage.getItem("ggn-upload-templator-show-compiled-regex") === "true";
  
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

  const updateCompiledRegex = () => {
    if (showingCompiledRegex) {
      const mask = sandboxMaskInput.value;
      if (mask) {
        try {
          const compiledRegex = compileUserMaskToRegex(mask, instance.hints);
          sandboxCompiledRegexDisplay.textContent = compiledRegex;
        } catch (error) {
          sandboxCompiledRegexDisplay.textContent = `Error: ${error.message}`;
        }
      } else {
        sandboxCompiledRegexDisplay.textContent = "";
      }
    }
  };

  const debouncedUpdateSandboxTest = () => {
    if (sandboxDebounceTimeout) {
      clearTimeout(sandboxDebounceTimeout);
    }
    sandboxDebounceTimeout = setTimeout(() => {
      updateSandboxTest();
      updateCompiledRegex();
    }, 300);
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
      
      if (showingCompiledRegex) {
        updateCompiledRegex();
        sandboxCompiledRegexDisplay.classList.add("visible");
        toggleCompiledRegexLink.textContent = "Hide compiled regex";
      }
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

  toggleCompiledRegexLink?.addEventListener("click", (e) => {
    e.preventDefault();
    showingCompiledRegex = !showingCompiledRegex;
    localStorage.setItem("ggn-upload-templator-show-compiled-regex", showingCompiledRegex);
    
    if (showingCompiledRegex) {
      const mask = sandboxMaskInput.value;
      if (!mask) {
        instance.showStatus("Enter a mask first", "error");
        showingCompiledRegex = false;
        localStorage.setItem("ggn-upload-templator-show-compiled-regex", "false");
        return;
      }
      
      updateCompiledRegex();
      sandboxCompiledRegexDisplay.classList.add("visible");
      toggleCompiledRegexLink.textContent = "Hide compiled regex";
    } else {
      sandboxCompiledRegexDisplay.classList.remove("visible");
      toggleCompiledRegexLink.textContent = "Show compiled regex";
    }
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
    
    if (showingCompiledRegex) {
      updateCompiledRegex();
    }
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
      
      if (showingCompiledRegex) {
        updateCompiledRegex();
        sandboxCompiledRegexDisplay.classList.add("visible");
        toggleCompiledRegexLink.textContent = "Hide compiled regex";
      }
    }
  } else if (sandboxMaskInput) {
    updateMaskHighlighting(sandboxMaskInput, sandboxMaskDisplay);
    if (sandboxMaskInput.value && sandboxSampleInput.value) {
      updateSandboxTest();
    }
    
    if (showingCompiledRegex) {
      updateCompiledRegex();
      sandboxCompiledRegexDisplay.classList.add("visible");
      toggleCompiledRegexLink.textContent = "Hide compiled regex";
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
      e.preventDefault();
      const hintItem = e.target.closest(".gut-hint-item");
      const hintName = hintItem?.dataset.hint;
      if (hintName && confirm(`Delete hint "${hintName}"?`)) {
        delete instance.hints[hintName];
        saveHints(instance.hints);
        hintItem.remove();
        
        const customHintsList = modal.querySelector("#custom-hints-list");
        const customHintsSection = modal.querySelector("#custom-hints-section");
        if (customHintsList && customHintsList.children.length === 0 && customHintsSection) {
          customHintsSection.style.display = "none";
        }
      }
    });
  });

  modal.querySelectorAll('[data-action="edit-hint"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const hintItem = e.target.closest(".gut-hint-item");
      const hintName = hintItem?.dataset.hint;
      if (hintName && instance.hints[hintName]) {
        showHintEditor(instance, modal, hintName, instance.hints[hintName]);
      }
    });
  });

  modal.querySelectorAll('[data-action="reset-hint"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const hintItem = e.target.closest(".gut-hint-item");
      const hintName = hintItem?.dataset.hint;
      if (hintName && confirm(`Reset "${hintName}" to default?`)) {
        if (resetHintToDefault(hintName)) {
          instance.hints = loadHints();
          
          document.body.removeChild(modal);
          showTemplateAndSettingsManager(instance);
          const hintsTab = document.querySelector('.gut-tab-btn[data-tab="hints"]');
          if (hintsTab) hintsTab.click();
        }
      }
    });
  });

  modal.querySelectorAll('.gut-hint-mappings-toggle').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const hintName = e.target.dataset.hint;
      const hintItem = modal.querySelector(`.gut-hint-item[data-hint="${hintName}"]`);
      const content = hintItem?.querySelector('.gut-hint-mappings-content');
      const toggle = e.target;
      
      if (content) {
        if (content.style.display === 'none') {
          content.style.display = 'block';
          toggle.textContent = 'Hide';
        } else {
          content.style.display = 'none';
          toggle.textContent = 'Show';
        }
      }
    });
  });

  const hintFilterInput = modal.querySelector("#hint-filter-input");
  if (hintFilterInput) {
    hintFilterInput.addEventListener("input", (e) => {
      const filterText = e.target.value.toLowerCase().trim();
      const defaultHintsList = modal.querySelector("#default-hints-list");
      const customHintsList = modal.querySelector("#custom-hints-list");
      const customHintsSection = modal.querySelector("#custom-hints-section");
      const filterCount = modal.querySelector("#hint-filter-count");
      
      let visibleCount = 0;
      let totalCount = 0;
      
      const filterHints = (list) => {
        if (!list) return;
        const hintItems = list.querySelectorAll(".gut-hint-item");
        
        hintItems.forEach(item => {
          totalCount++;
          const hintName = item.dataset.hint?.toLowerCase() || "";
          const description = item.querySelector(".gut-hint-description")?.textContent?.toLowerCase() || "";
          const pattern = item.querySelector(".gut-hint-pattern")?.textContent?.toLowerCase() || "";
          const type = item.querySelector(".gut-hint-type-badge")?.textContent?.toLowerCase() || "";
          
          const matches = !filterText || 
            hintName.includes(filterText) || 
            description.includes(filterText) || 
            pattern.includes(filterText) ||
            type.includes(filterText);
          
          if (matches) {
            item.style.display = "";
            visibleCount++;
          } else {
            item.style.display = "none";
          }
        });
      };
      
      filterHints(defaultHintsList);
      filterHints(customHintsList);
      
      if (customHintsSection) {
        const customVisible = customHintsList?.querySelectorAll('.gut-hint-item:not([style*="display: none"])').length || 0;
        customHintsSection.style.display = customVisible > 0 ? "" : "none";
      }
      
      if (filterText) {
        filterCount.textContent = `Showing ${visibleCount} of ${totalCount} hints`;
        filterCount.style.display = "block";
      } else {
        filterCount.style.display = "none";
      }
    });
  }

  const addHintBtn = modal.querySelector("#add-hint-btn");
  if (addHintBtn) {
    addHintBtn.addEventListener("click", () => {
      showHintEditor(instance, modal, null, null);
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

export function showHintEditor(instance, parentModal, hintName = null, hintData = null) {
  const isDefaultHint = (name) => {
    const defaultHints = ['number', 'alpha', 'alnum', 'version', 'date_dots', 'date_dashes', 'lang_codes', 'resolution'];
    return defaultHints.includes(name);
  };
  
  const editorModal = document.createElement("div");
  editorModal.innerHTML = HINT_EDITOR_MODAL_HTML(instance, hintName, hintData);
  document.body.appendChild(editorModal.firstElementChild);
  
  const modal = document.querySelector(".gut-hint-editor-modal");
  const closeBtn = modal.querySelector(".gut-hint-editor-close");
  const cancelBtn = modal.querySelector("#hint-editor-cancel");
  const saveBtn = modal.querySelector("#hint-editor-save");
  const nameInput = modal.querySelector("#hint-editor-name");
  const typeInputs = modal.querySelectorAll('input[name="hint-type"]');
  const patternGroup = modal.querySelector("#hint-pattern-group");
  const mappingsGroup = modal.querySelector("#hint-mappings-group");
  const patternInput = modal.querySelector("#hint-editor-pattern");
  const patternLabel = modal.querySelector("#hint-pattern-label");
  const descriptionInput = modal.querySelector("#hint-editor-description");
  const strictInput = modal.querySelector("#hint-editor-strict");
  const addMappingBtn = modal.querySelector("#hint-add-mapping");
  const mappingsRows = modal.querySelector("#hint-mappings-rows");
  
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  
  typeInputs.forEach(input => {
    input.addEventListener("change", (e) => {
      const type = e.target.value;
      if (type === 'pattern') {
        patternGroup.style.display = 'block';
        mappingsGroup.style.display = 'none';
        patternLabel.textContent = 'Pattern *';
        patternInput.placeholder = 'e.g., ##.##.####';
      } else if (type === 'regex') {
        patternGroup.style.display = 'block';
        mappingsGroup.style.display = 'none';
        patternLabel.textContent = 'Regex Pattern *';
        patternInput.placeholder = 'e.g., v\\d+(?:\\.\\d+)*';
      } else if (type === 'map') {
        patternGroup.style.display = 'none';
        mappingsGroup.style.display = 'block';
      }
    });
  });
  
  addMappingBtn.addEventListener("click", () => {
    const newRow = document.createElement("div");
    newRow.className = "gut-mappings-row";
    newRow.innerHTML = `
      <input type="text" class="gut-input gut-mapping-key" placeholder="e.g., en">
      <input type="text" class="gut-input gut-mapping-value" placeholder="e.g., English">
      <button class="gut-btn gut-btn-danger gut-btn-small gut-remove-mapping" title="Remove">−</button>
    `;
    mappingsRows.appendChild(newRow);
    
    newRow.querySelector(".gut-remove-mapping").addEventListener("click", () => {
      newRow.remove();
    });
  });
  
  mappingsRows.querySelectorAll(".gut-remove-mapping").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const row = e.target.closest(".gut-mappings-row");
      if (mappingsRows.querySelectorAll(".gut-mappings-row").length > 1) {
        row.remove();
      } else {
        alert("You must have at least one mapping row.");
      }
    });
  });
  
  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
      alert("Invalid hint name. Use only letters, numbers, and underscores.");
      return;
    }
    
    if (!hintName && instance.hints[name]) {
      alert(`Hint "${name}" already exists.`);
      return;
    }
    
    const type = modal.querySelector('input[name="hint-type"]:checked').value;
    const description = descriptionInput.value.trim();
    
    let hintDef = { type, description };
    
    if (type === 'pattern' || type === 'regex') {
      const pattern = patternInput.value.trim();
      if (!pattern) {
        alert("Pattern is required.");
        return;
      }
      
      if (type === 'regex') {
        try {
          new RegExp(pattern);
        } catch (e) {
          alert(`Invalid regex: ${e.message}`);
          return;
        }
      }
      
      hintDef.pattern = pattern;
    } else if (type === 'map') {
      const mappings = {};
      const rows = mappingsRows.querySelectorAll(".gut-mappings-row");
      let hasEmptyRow = false;
      
      rows.forEach(row => {
        const key = row.querySelector(".gut-mapping-key").value.trim();
        const value = row.querySelector(".gut-mapping-value").value.trim();
        if (key && value) {
          mappings[key] = value;
        } else if (key || value) {
          hasEmptyRow = true;
        }
      });
      
      if (Object.keys(mappings).length === 0) {
        alert("At least one complete mapping is required.");
        return;
      }
      
      if (hasEmptyRow) {
        if (!confirm("Some mapping rows are incomplete and will be ignored. Continue?")) {
          return;
        }
      }
      
      hintDef.mappings = mappings;
      hintDef.strict = strictInput.checked;
    }
    
    const wasNewCustomHint = !hintName && !isDefaultHint(name);
    
    instance.hints[name] = hintDef;
    saveHints(instance.hints);
    
    closeModal();
    
    document.body.removeChild(parentModal);
    showTemplateAndSettingsManager(instance);
    const hintsTab = document.querySelector('.gut-tab-btn[data-tab="hints"]');
    if (hintsTab) hintsTab.click();
    
    if (wasNewCustomHint) {
      setTimeout(() => {
        const newModal = document.querySelector('.gut-modal');
        const customHintsSection = newModal?.querySelector("#custom-hints-section");
        if (customHintsSection) {
          customHintsSection.style.display = "";
        }
      }, 50);
    }
  });
  
  const handleEscKey = (e) => {
    if (e.key === "Escape" && document.body.contains(modal)) {
      e.stopImmediatePropagation();
      closeModal();
      document.removeEventListener("keydown", handleEscKey);
    }
  };
  document.addEventListener("keydown", handleEscKey);
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
