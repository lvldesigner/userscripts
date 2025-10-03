import {
  saveTemplates,
  saveSelectedTemplate,
  removeSelectedTemplate,
} from "./storage.js";
import { TEMPLATE_SELECTOR_HTML, TEMPLATE_LIST_HTML } from "./ui/template.js";
import { ModalStack } from "./modal-stack.js";

export function saveTemplate(instance, modal, editingTemplateName = null) {
  const name = modal.querySelector("#template-name").value.trim();
  const mask = modal.querySelector("#torrent-mask").value.trim();

  if (!name || !mask) {
    alert("Please provide both template name and torrent mask.");
    return;
  }

  if (
    (editingTemplateName &&
      name !== editingTemplateName &&
      instance.templates[name]) ||
    (!editingTemplateName && instance.templates[name])
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
        const variableToggle = modal.querySelector(
          `.gut-variable-toggle[data-field="${fieldName}"]`,
        );
        const isVariableMode =
          variableToggle && variableToggle.dataset.state === "on";

        if (isVariableMode) {
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

          fieldMappings[fieldName] = variableInput
            ? variableInput.value.trim()
            : "";
        } else {
          fieldMappings[fieldName] = templateInput.value;
        }
      } else {
        fieldMappings[fieldName] = templateInput.value;
      }
    }
  });

  const allFieldRows = modal.querySelectorAll(".gut-field-row");
  const customUnselectedFields = [];

  allFieldRows.forEach((row) => {
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox) {
      const fieldName = checkbox.dataset.field;
      const isDefaultIgnored = instance.config.IGNORED_FIELDS_BY_DEFAULT.includes(
        fieldName.toLowerCase(),
      );
      const isCurrentlyChecked = checkbox.checked;

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

  if (editingTemplateName && name !== editingTemplateName) {
    delete instance.templates[editingTemplateName];
    if (instance.selectedTemplate === editingTemplateName) {
      instance.selectedTemplate = name;
      saveSelectedTemplate(name);
    }
  }

  instance.templates[name] = {
    mask,
    fieldMappings,
    customUnselectedFields:
      customUnselectedFields.length > 0 ? customUnselectedFields : undefined,
    variableMatching:
      Object.keys(variableMatchingConfig).length > 0
        ? variableMatchingConfig
        : undefined,
  };

  saveTemplates(instance.templates);
  updateTemplateSelector(instance);
  instance.updateVariableCount();

  const action = editingTemplateName ? "updated" : "saved";
  instance.showStatus(`Template "${name}" ${action} successfully!`);

  ModalStack.pop();
}

export function deleteTemplate(instance, templateName) {
  delete instance.templates[templateName];
  saveTemplates(instance.templates);

  if (instance.selectedTemplate === templateName) {
    instance.selectedTemplate = null;
    removeSelectedTemplate();
  }

  updateTemplateSelector(instance);
  instance.showStatus(`Template "${templateName}" deleted`);
}

export function cloneTemplate(instance, templateName) {
  const originalTemplate = instance.templates[templateName];
  if (!originalTemplate) return;

  const cloneName = `${templateName} (Clone)`;
  instance.templates[cloneName] = {
    mask: originalTemplate.mask,
    fieldMappings: { ...originalTemplate.fieldMappings },
    customUnselectedFields: originalTemplate.customUnselectedFields
      ? [...originalTemplate.customUnselectedFields]
      : undefined,
    variableMatching: originalTemplate.variableMatching
      ? { ...originalTemplate.variableMatching }
      : undefined,
  };

  saveTemplates(instance.templates);

  updateTemplateSelector(instance);
  instance.showStatus(`Template "${cloneName}" created`);
}

export function editTemplate(instance, templateName) {
  const template = instance.templates[templateName];
  if (!template) return;

  instance.showTemplateCreator(templateName, template);
}

export function selectTemplate(instance, templateName) {
  instance.selectedTemplate = templateName || null;

  if (templateName) {
    saveSelectedTemplate(templateName);
  } else {
    removeSelectedTemplate();
  }

  updateEditButtonVisibility(instance);

  instance.updateVariableCount();

  if (templateName === "none") {
    instance.showStatus("No template selected - auto-fill disabled");
  } else if (templateName) {
    instance.showStatus(`Template "${templateName}" selected`);

    instance.checkAndApplyToExistingTorrent(templateName);
  }
}

export function updateTemplateSelector(instance) {
  const selector = document.getElementById("template-selector");
  if (!selector) return;

  selector.innerHTML = TEMPLATE_SELECTOR_HTML(instance);

  updateEditButtonVisibility(instance);
}

export function updateEditButtonVisibility(instance) {
  const editBtn = document.getElementById("edit-selected-template-btn");
  if (!editBtn) return;

  const shouldShow =
    instance.selectedTemplate &&
    instance.selectedTemplate !== "none" &&
    instance.templates[instance.selectedTemplate];

  editBtn.style.display = shouldShow ? "" : "none";
}

export function refreshTemplateManager(instance, modal) {
  const templateList = modal.querySelector(".gut-template-list");
  if (!templateList) return;

  templateList.innerHTML = TEMPLATE_LIST_HTML(instance);
}
