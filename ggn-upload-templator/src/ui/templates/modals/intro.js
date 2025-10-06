import { html, raw } from '../../template-engine.js';

export const INTRO_MODAL_HTML = (content, isNewUser, currentVersion) => html`
  <div class="gut-modal">
    <div class="gut-modal-content gut-intro-modal">
      <div class="gut-modal-header">
        <h2 style="margin: 0; text-align: center; width: 100%;">${content.title}</h2>
      </div>

      <div class="gut-modal-body">
        ${raw(content.content)}
        
        <div style="background: #2a2a2a; border-radius: 6px; padding: 16px; margin-top: 20px;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Help is always available:</p>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Look for <span style="color: #64b5f6;">ⓘ</span> icons throughout the UI</li>
            <li>Press <kbd style="padding: 2px 6px; background: #1a1a1a; border-radius: 3px; font-family: monospace;">?</kbd> to open the help modal anytime</li>
          </ul>
        </div>
      </div>

      <div class="gut-modal-footer" style="display: flex; justify-content: center; gap: 12px;">
        <button class="gut-btn gut-btn-primary" id="intro-get-started" style="min-width: 120px;">Get Started</button>
      </div>
    </div>
  </div>
`;
