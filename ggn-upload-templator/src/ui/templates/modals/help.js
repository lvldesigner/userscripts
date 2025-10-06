import { html, raw, map } from '../../template-engine.js';

export const HELP_MODAL_HTML = (sections, currentVersion) => {
  const sectionsList = Object.entries(sections).map(([id, section]) => ({
    id,
    ...section
  }));

  return html`
    <div class="gut-modal">
      <div class="gut-modal-content gut-help-modal">
        <div class="gut-modal-header">
          <button class="gut-modal-close-btn" id="modal-close-x" title="Close">&times;</button>
          <h2 style="margin: 0; flex: 1; text-align: center;">Help & Documentation</h2>
        </div>

        <div class="gut-modal-body">
          <div class="gut-help-subheader">
            <button class="gut-btn gut-btn-secondary" id="help-toc-toggle" title="Toggle table of contents" style="padding: 8px 12px;">☰ Topics</button>
            <input type="text" id="help-search-input" class="gut-help-search" placeholder="Search help..." autocomplete="off" style="flex: 1;">
          </div>

          <div class="gut-help-container">
            <div class="gut-help-toc" id="help-toc" style="display: none;">
              <div class="gut-help-toc-content">
                ${map(sectionsList, section => html`
                  <div class="gut-help-toc-item" data-section="${section.id}">
                    ${section.title}
                  </div>
                `)}
              </div>
            </div>

            <div class="gut-help-content" id="help-content">
              <div class="gut-help-search-info" id="help-search-info" style="display: none;">
                <span id="help-search-count"></span>
                <button class="gut-btn gut-btn-secondary gut-btn-small" id="help-clear-search">Clear Search</button>
              </div>
              
              ${map(sectionsList, section => html`
                <div class="gut-help-section" data-section-id="${section.id}">
                  <h2 class="gut-help-section-title">${section.title}</h2>
                  <div class="gut-help-section-content">
                    ${raw(section.content)}
                  </div>
                </div>
              `)}
            </div>
          </div>
        </div>

        <div class="gut-modal-footer" style="display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 12px; color: #888;">
          <span>GGn Upload Templator v${currentVersion}</span>
          <span>•</span>
          <span>Press <kbd style="padding: 2px 6px; background: #1a1a1a; border-radius: 3px; font-family: monospace;">?</kbd> to toggle help</span>
        </div>
      </div>
    </div>
  `;
};
