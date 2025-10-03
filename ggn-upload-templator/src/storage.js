export function loadTemplates() {
  try {
    return JSON.parse(
      localStorage.getItem("ggn-upload-templator-templates") || "{}",
    );
  } catch (error) {
    console.error("Failed to load templates:", error);
    return {};
  }
}

export function saveTemplates(templates) {
  try {
    localStorage.setItem(
      "ggn-upload-templator-templates",
      JSON.stringify(templates),
    );
  } catch (error) {
    console.error("Failed to save templates:", error);
  }
}

export function loadSelectedTemplate() {
  try {
    return localStorage.getItem("ggn-upload-templator-selected") || null;
  } catch (error) {
    console.error("Failed to load selected template:", error);
    return null;
  }
}

export function saveSelectedTemplate(name) {
  try {
    localStorage.setItem("ggn-upload-templator-selected", name);
  } catch (error) {
    console.error("Failed to save selected template:", error);
  }
}

export function removeSelectedTemplate() {
  try {
    localStorage.removeItem("ggn-upload-templator-selected");
  } catch (error) {
    console.error("Failed to remove selected template:", error);
  }
}

export function loadHideUnselected() {
  try {
    return JSON.parse(
      localStorage.getItem("ggn-upload-templator-hide-unselected") || "true",
    );
  } catch (error) {
    console.error("Failed to load hide unselected setting:", error);
    return true;
  }
}

export function saveHideUnselected(value) {
  try {
    localStorage.setItem(
      "ggn-upload-templator-hide-unselected",
      JSON.stringify(value),
    );
  } catch (error) {
    console.error("Failed to save hide unselected setting:", error);
  }
}

export function loadSettings() {
  try {
    return JSON.parse(
      localStorage.getItem("ggn-upload-templator-settings") || "{}",
    );
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {};
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(
      "ggn-upload-templator-settings",
      JSON.stringify(settings),
    );
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export function removeSettings() {
  try {
    localStorage.removeItem("ggn-upload-templator-settings");
  } catch (error) {
    console.error("Failed to remove settings:", error);
  }
}

export function loadSandboxSets() {
  try {
    return JSON.parse(
      localStorage.getItem("ggn-upload-templator-sandbox-sets") || "{}",
    );
  } catch (error) {
    console.error("Failed to load sandbox sets:", error);
    return {};
  }
}

export function saveSandboxSets(sets) {
  try {
    localStorage.setItem(
      "ggn-upload-templator-sandbox-sets",
      JSON.stringify(sets),
    );
  } catch (error) {
    console.error("Failed to save sandbox sets:", error);
  }
}

export function loadCurrentSandboxSet() {
  try {
    return localStorage.getItem("ggn-upload-templator-sandbox-current") || "";
  } catch (error) {
    console.error("Failed to load current sandbox set:", error);
    return "";
  }
}

export function saveCurrentSandboxSet(name) {
  try {
    localStorage.setItem("ggn-upload-templator-sandbox-current", name);
  } catch (error) {
    console.error("Failed to save current sandbox set:", error);
  }
}

export function deleteAllConfig() {
  try {
    localStorage.removeItem("ggn-upload-templator-templates");
    localStorage.removeItem("ggn-upload-templator-selected");
    localStorage.removeItem("ggn-upload-templator-hide-unselected");
    localStorage.removeItem("ggn-upload-templator-settings");
  } catch (error) {
    console.error("Failed to delete config:", error);
  }
}

export function loadModalWidth() {
  try {
    const width = localStorage.getItem("ggn-upload-templator-modal-width");
    return width ? parseInt(width, 10) : null;
  } catch (error) {
    console.error("Failed to load modal width:", error);
    return null;
  }
}

export function saveModalWidth(width) {
  try {
    localStorage.setItem("ggn-upload-templator-modal-width", width.toString());
  } catch (error) {
    console.error("Failed to save modal width:", error);
  }
}
