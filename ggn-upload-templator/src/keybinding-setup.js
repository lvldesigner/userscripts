import { parseKeybinding, matchesKeybinding } from "./utils/keyboard.js";

export function setupSubmitKeybinding(instance) {
  const keybinding = instance.config.CUSTOM_SUBMIT_KEYBINDING || "Ctrl+Enter";
  const keys = parseKeybinding(keybinding);

  document.addEventListener("keydown", (e) => {
    if (matchesKeybinding(e, keys)) {
      e.preventDefault();

      const targetForm = document.querySelector(
        instance.config.TARGET_FORM_SELECTOR,
      );
      if (targetForm) {
        const submitButton =
          targetForm.querySelector(
            'input[type="submit"], button[type="submit"]',
          ) ||
          targetForm.querySelector(
            'input[name*="submit"], button[name*="submit"]',
          ) ||
          targetForm.querySelector(".submit-btn, #submit-btn");

        if (submitButton) {
          instance.showStatus(`Form submitted via ${keybinding}`);
          submitButton.click();
        } else {
          instance.showStatus(`Form submitted via ${keybinding}`);
          targetForm.submit();
        }
      }
    }
  });
}

export function setupApplyKeybinding(instance) {
  const keybinding = instance.config.CUSTOM_APPLY_KEYBINDING || "Ctrl+Shift+A";
  const keys = parseKeybinding(keybinding);

  document.addEventListener("keydown", (e) => {
    if (matchesKeybinding(e, keys)) {
      e.preventDefault();
      instance.applyTemplateToCurrentTorrent();
    }
  });
}
