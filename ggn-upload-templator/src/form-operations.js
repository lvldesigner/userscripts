import { parseTemplateWithOptionals, interpolate } from "./utils/template.js";
import { findElementByFieldName, getFieldLabel } from "./utils/form.js";
import { TorrentUtils } from "./utils/torrent.js";
import { showApplyConfirmationModal } from "./modal-manager.js";

export async function getCurrentVariables(instance) {
  const commentVariables = {};
  const maskVariables = {};
  let hasBothConditions = false;

  if (instance.selectedTemplate && instance.selectedTemplate !== "none") {
    const template = instance.templates[instance.selectedTemplate];
    if (template) {
      const fileInputs = instance.config.TARGET_FORM_SELECTOR
        ? document.querySelectorAll(
            `${instance.config.TARGET_FORM_SELECTOR} input[type="file"]`,
          )
        : document.querySelectorAll('input[type="file"]');

      for (const input of fileInputs) {
        if (
          input.files &&
          input.files[0] &&
          input.files[0].name.toLowerCase().endsWith(".torrent")
        ) {
          hasBothConditions = true;
          try {
            const torrentData = await TorrentUtils.parseTorrentFile(
              input.files[0],
            );

            Object.assign(
              commentVariables,
              TorrentUtils.parseCommentVariables(torrentData.comment),
            );

            const parseResult = parseTemplateWithOptionals(
              template.mask,
              torrentData.name,
              instance.hints,
            );
            const { _matchedOptionals, _optionalCount, ...extracted } =
              parseResult;
            Object.assign(maskVariables, extracted);

            break;
          } catch (error) {
            console.warn("Could not parse torrent file:", error);
          }
        }
      }
    }
  }

  return {
    all: { ...commentVariables, ...maskVariables },
    comment: commentVariables,
    mask: maskVariables,
    hasBothConditions,
  };
}

export async function updateVariableCount(instance) {
  const variables = await getCurrentVariables(instance);
  const commentCount = Object.keys(variables.comment).length;
  const maskCount = Object.keys(variables.mask).length;
  const totalCount = commentCount + maskCount;

  const variablesRow = document.getElementById("variables-row");

  if (variablesRow) {
    if (!variables.hasBothConditions) {
      variablesRow.style.display = "none";
    } else {
      variablesRow.style.display = "";

      if (totalCount === 0) {
        variablesRow.innerHTML = `Available variables: 0`;
        variablesRow.style.cursor = "default";
        variablesRow.style.opacity = "0.6";
      } else {
        const parts = [];
        if (commentCount > 0) {
          parts.push(`Comment [${commentCount}]`);
        }
        if (maskCount > 0) {
          parts.push(`Mask [${maskCount}]`);
        }

        variablesRow.innerHTML = `Available variables: ${parts.join(", ")}`;
        variablesRow.style.cursor = "pointer";
        variablesRow.style.opacity = "1";
      }
    }
  }
}

export function applyTemplate(
  instance,
  templateName,
  torrentName,
  commentVariables = {},
) {
  const template = instance.templates[templateName];
  if (!template) return;

  const extracted = parseTemplateWithOptionals(template.mask, torrentName, instance.hints);
  let appliedCount = 0;

  Object.entries(template.fieldMappings).forEach(
    ([fieldName, valueTemplate]) => {
      const firstElement = findElementByFieldName(fieldName, instance.config);

      if (firstElement && firstElement.type === "radio") {
        const formPrefix = instance.config.TARGET_FORM_SELECTOR
          ? `${instance.config.TARGET_FORM_SELECTOR} `
          : "";
        const radioButtons = document.querySelectorAll(
          `${formPrefix}input[name="${fieldName}"][type="radio"]`,
        );
        const newValue = interpolate(
          String(valueTemplate),
          extracted,
          commentVariables,
        );

        radioButtons.forEach((radio) => {
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
        if (firstElement.hasAttribute("disabled")) {
          firstElement.removeAttribute("disabled");
        }

        if (firstElement.type === "checkbox") {
          let newChecked;
          if (typeof valueTemplate === "boolean") {
            newChecked = valueTemplate;
          } else {
            const interpolated = interpolate(
              String(valueTemplate),
              extracted,
              commentVariables,
            );
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
          const interpolated = interpolate(
            String(valueTemplate),
            extracted,
            commentVariables,
          );
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
    instance.showStatus(
      `Template "${templateName}" applied to ${appliedCount} field(s)`,
    );
  }
}

export async function checkAndApplyToExistingTorrent(instance, templateName) {
  if (!templateName || templateName === "none") return;

  const fileInputs = instance.config.TARGET_FORM_SELECTOR
    ? document.querySelectorAll(
        `${instance.config.TARGET_FORM_SELECTOR} input[type="file"]`,
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
        const commentVariables = TorrentUtils.parseCommentVariables(
          torrentData.comment,
        );
        applyTemplate(instance, templateName, torrentData.name, commentVariables);
        return;
      } catch (error) {
        console.warn("Could not parse existing torrent file:", error);
      }
    }
  }
}

export function watchFileInputs(instance) {
  const fileInputs = instance.config.TARGET_FORM_SELECTOR
    ? document.querySelectorAll(
        `${instance.config.TARGET_FORM_SELECTOR} input[type="file"]`,
      )
    : document.querySelectorAll('input[type="file"]');

  fileInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      if (
        e.target.files[0] &&
        e.target.files[0].name.toLowerCase().endsWith(".torrent")
      ) {
        instance.showStatus(
          "Torrent file selected. Click 'Apply Template' to fill form.",
        );

        updateVariableCount(instance);
      }
    });
  });
}

export async function applyTemplateToCurrentTorrent(instance) {
  if (!instance.selectedTemplate || instance.selectedTemplate === "none") {
    instance.showStatus("No template selected", "error");
    return;
  }

  const fileInputs = instance.config.TARGET_FORM_SELECTOR
    ? document.querySelectorAll(
        `${instance.config.TARGET_FORM_SELECTOR} input[type="file"]`,
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
        const commentVariables = TorrentUtils.parseCommentVariables(
          torrentData.comment,
        );

        const changes = detectFieldChanges(
          instance,
          instance.selectedTemplate,
          torrentData.name,
          commentVariables,
        );

        if (changes.length > 0) {
          showApplyConfirmationModal(instance, changes, () => {
            applyTemplate(
              instance,
              instance.selectedTemplate,
              torrentData.name,
              commentVariables,
            );
          });
        } else {
          applyTemplate(
            instance,
            instance.selectedTemplate,
            torrentData.name,
            commentVariables,
          );
        }
        return;
      } catch (error) {
        console.error("Error processing torrent file:", error);
        instance.showStatus("Error processing torrent file", "error");
      }
    }
  }

  instance.showStatus("No torrent file selected", "error");
}

export function detectFieldChanges(
  instance,
  templateName,
  torrentName,
  commentVariables = {},
) {
  const template = instance.templates[templateName];
  if (!template) return [];

  const extracted = parseTemplateWithOptionals(
    template.mask,
    torrentName,
    instance.hints,
  );
  const changes = [];

  Object.entries(template.fieldMappings).forEach(
    ([fieldName, valueTemplate]) => {
      const firstElement = findElementByFieldName(fieldName, instance.config);

      if (firstElement && firstElement.type === "radio") {
        const formPrefix = instance.config.TARGET_FORM_SELECTOR
          ? `${instance.config.TARGET_FORM_SELECTOR} `
          : "";
        const radioButtons = document.querySelectorAll(
          `${formPrefix}input[name="${fieldName}"][type="radio"]`,
        );
        const newValue = interpolate(
          String(valueTemplate),
          extracted,
          commentVariables,
        );

        const currentlyChecked = Array.from(radioButtons).find(
          (radio) => radio.checked,
        );
        const currentValue = currentlyChecked ? currentlyChecked.value : "";

        if (currentValue !== newValue) {
          changes.push({
            fieldName,
            label: getFieldLabel(firstElement, instance.config),
            currentValue: currentValue || "(empty)",
            newValue,
            fieldType: "radio",
          });
        }
      } else if (firstElement) {
        if (firstElement.type === "checkbox") {
          let newChecked;
          if (typeof valueTemplate === "boolean") {
            newChecked = valueTemplate;
          } else {
            const interpolated = interpolate(
              String(valueTemplate),
              extracted,
              commentVariables,
            );
            newChecked = /^(true|1|yes|on)$/i.test(interpolated);
          }

          const currentChecked = firstElement.checked;

          if (currentChecked !== newChecked) {
            changes.push({
              fieldName,
              label: getFieldLabel(firstElement, instance.config),
              currentValue: currentChecked ? "Checked" : "Unchecked",
              newValue: newChecked ? "Checked" : "Unchecked",
              fieldType: "checkbox",
            });
          }
        } else {
          const interpolated = interpolate(
            String(valueTemplate),
            extracted,
            commentVariables,
          );
          const currentValue = firstElement.value || "";

          if (currentValue !== interpolated) {
            changes.push({
              fieldName,
              label: getFieldLabel(firstElement, instance.config),
              currentValue: currentValue || "(empty)",
              newValue: interpolated,
              fieldType: firstElement.tagName.toLowerCase() === "select" 
                ? "select" 
                : firstElement.type || "text",
            });
          }
        }
      }
    },
  );

  return changes;
}
