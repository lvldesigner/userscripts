import { version } from "../package.json";
import { DEFAULT_CONFIG } from "./config.js";
import { logDebug } from "./utils/log.js";
import {
  injectUI,
  showTemplateCreator,
  showVariablesModal,
} from "./ui/manager.js";
import {
  loadTemplates,
  loadSelectedTemplate,
  loadHideUnselected,
  loadSettings,
  loadSandboxSets,
  loadCurrentSandboxSet,
} from "./storage.js";
import {
  saveTemplate,
  deleteTemplate,
  cloneTemplate,
  editTemplate,
  selectTemplate,
  updateTemplateSelector,
} from "./template-operations.js";
import {
  getCurrentVariables,
  updateVariableCount,
  applyTemplate,
  checkAndApplyToExistingTorrent,
  watchFileInputs,
  applyTemplateToCurrentTorrent,
} from "./form-operations.js";
import {
  setupSubmitKeybinding,
  setupApplyKeybinding,
  setupHelpKeybinding,
} from "./keybinding-setup.js";
import {
  showTemplateAndSettingsManager,
  showSandboxWithMask,
} from "./modal-manager.js";
import { loadHints, saveHints } from "./hint-storage.js";
import { parseTemplateWithOptionals } from "./utils/template.js";
import { initializeHelpTooltips } from "./help-tooltip.js";
import { checkAndShowIntro } from "./intro-modal.js";
import style from "./style.css?raw";

const firaCodeFont = `
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap');
`;

GM_addStyle(firaCodeFont);
GM_addStyle(style);

class GGnUploadTemplator {
  constructor() {
    this.templates = loadTemplates();
    this.selectedTemplate = loadSelectedTemplate();
    this.hideUnselectedFields = loadHideUnselected();
    this.config = {
      ...DEFAULT_CONFIG,
      ...loadSettings(),
    };
    this.sandboxSets = loadSandboxSets();
    this.currentSandboxSet = loadCurrentSandboxSet();
    this.hints = loadHints();

    logDebug("Initialized core state", {
      templates: Object.keys(this.templates),
      selectedTemplate: this.selectedTemplate,
      hideUnselectedFields: this.hideUnselectedFields,
      config: this.config,
      hints: Object.keys(this.hints),
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
      watchFileInputs(this);
    } catch (error) {
      console.error("File input watching setup failed:", error);
    }

    if (this.config.SUBMIT_KEYBINDING) {
      try {
        setupSubmitKeybinding(this);
      } catch (error) {
        console.error("Submit keybinding setup failed:", error);
      }
    }

    if (this.config.APPLY_KEYBINDING) {
      try {
        setupApplyKeybinding(this);
      } catch (error) {
        console.error("Apply keybinding setup failed:", error);
      }
    }

    if (this.config.HELP_KEYBINDING) {
      try {
        setupHelpKeybinding(this);
      } catch (error) {
        console.error("Help keybinding setup failed:", error);
      }
    }

    try {
      initializeHelpTooltips();
    } catch (error) {
      console.error("Help tooltips initialization failed:", error);
    }

    try {
      checkAndShowIntro();
    } catch (error) {
      console.error("Intro modal check failed:", error);
    }

    logDebug("Initialized");
  }

  async showTemplateCreator(editTemplateName = null, editTemplate = null) {
    await showTemplateCreator(this, editTemplateName, editTemplate);
  }

  async getCurrentVariables() {
    return await getCurrentVariables(this);
  }

  async showVariablesModal() {
    const variables = await this.getCurrentVariables();
    
    const fileInputs = this.config.TARGET_FORM_SELECTOR
      ? document.querySelectorAll(
          `${this.config.TARGET_FORM_SELECTOR} input[type="file"]`,
        )
      : document.querySelectorAll('input[type="file"]');
    
    let torrentName = "";
    for (const input of fileInputs) {
      if (
        input.files &&
        input.files[0] &&
        input.files[0].name.toLowerCase().endsWith(".torrent")
      ) {
        try {
          const { TorrentUtils } = await import("./utils/torrent.js");
          const torrentData = await TorrentUtils.parseTorrentFile(input.files[0]);
          torrentName = torrentData.name || "";
          break;
        } catch (error) {
          console.warn("Could not parse torrent file:", error);
        }
      }
    }
    
    const mask = this.selectedTemplate && this.templates[this.selectedTemplate] 
      ? this.templates[this.selectedTemplate].mask 
      : "";
    
    showVariablesModal(this, variables.all, torrentName, mask);
  }

  async updateVariableCount() {
    await updateVariableCount(this);
  }

  saveTemplate(modal, editingTemplateName = null) {
    saveTemplate(this, modal, editingTemplateName);
  }

  updateTemplateSelector() {
    updateTemplateSelector(this);
  }

  selectTemplate(templateName) {
    selectTemplate(this, templateName);
  }

  applyTemplate(templateName, torrentName, commentVariables = {}) {
    applyTemplate(this, templateName, torrentName, commentVariables);
  }

  async checkAndApplyToExistingTorrent(templateName) {
    await checkAndApplyToExistingTorrent(this, templateName);
  }

  async applyTemplateToCurrentTorrent() {
    await applyTemplateToCurrentTorrent(this);
  }

  showTemplateAndSettingsManager() {
    showTemplateAndSettingsManager(this);
  }

  deleteTemplate(templateName) {
    deleteTemplate(this, templateName);
  }

  cloneTemplate(templateName) {
    cloneTemplate(this, templateName);
  }

  editTemplate(templateName) {
    editTemplate(this, templateName);
  }

  showSandboxWithMask(mask, sample) {
    showSandboxWithMask(this, mask, sample);
  }

  saveHints(hints) {
    this.hints = hints;
    return saveHints(hints);
  }

  getHints() {
    return this.hints;
  }

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

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

logDebug("Script loaded (readyState:", document.readyState, ")");

let ggnInstance = null;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    logDebug("Initializing after DOMContentLoaded");
    try {
      ggnInstance = new GGnUploadTemplator();
    } catch (error) {
      console.error("Failed to initialize:", error);
    }
  });
} else {
  logDebug("Initializing immediately (DOM already ready)");
  try {
    ggnInstance = new GGnUploadTemplator();
  } catch (error) {
    console.error("Failed to initialize:", error);
  }
}

const GGnUploadTemplatorAPI = {
  version,
  
  getTemplates() {
    if (!ggnInstance) {
      console.warn("GGnUploadTemplator not initialized yet");
      return [];
    }
    return Object.keys(ggnInstance.templates).map(name => ({
      name,
      mask: ggnInstance.templates[name].mask,
      fieldMappings: ggnInstance.templates[name].fieldMappings,
      variableMatching: ggnInstance.templates[name].variableMatching,
      customUnselectedFields: ggnInstance.templates[name].customUnselectedFields,
    }));
  },
  
  getTemplate(templateName) {
    if (!ggnInstance) {
      console.warn("GGnUploadTemplator not initialized yet");
      return null;
    }
    const template = ggnInstance.templates[templateName];
    if (!template) {
      return null;
    }
    return {
      name: templateName,
      mask: template.mask,
      fieldMappings: template.fieldMappings,
      variableMatching: template.variableMatching,
      customUnselectedFields: template.customUnselectedFields,
    };
  },
  
  extractVariables(templateName, torrentName) {
    if (!ggnInstance) {
      console.warn("GGnUploadTemplator not initialized yet");
      return {};
    }
    
    const template = ggnInstance.templates[templateName];
    if (!template) {
      console.warn(`Template "${templateName}" not found`);
      return {};
    }
    
    return parseTemplateWithOptionals(template.mask, torrentName, ggnInstance.hints);
  },
  
  getInstance() {
    return ggnInstance;
  }
};

if (typeof unsafeWindow !== "undefined") {
  unsafeWindow.GGnUploadTemplator = GGnUploadTemplatorAPI;
} else {
  window.GGnUploadTemplator = GGnUploadTemplatorAPI;
}
