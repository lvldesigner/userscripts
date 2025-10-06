import { html, raw } from '../../template-engine.js';
import { HELP_ICON_HTML } from '../components/help-icon.js';

export const INTRO_MODAL_HTML = (content, isNewUser, currentVersion) => html`
  <div class="gut-modal">
    <div class="gut-modal-content gut-intro-modal">
      <div class="gut-modal-header">
        <h2 class="gut-intro-modal-header-centered">${content.title}</h2>
      </div>

      <div class="gut-modal-body">
        ${raw(content.content)}
        
        <div class="gut-intro-help-box">
          <p>Help is always available:</p>
          <ul>
            <li>Look for ${raw(HELP_ICON_HTML('help-icon-example', 'gut-help-icon-no-margin'))} icons throughout the UI</li>
            <li>Press <kbd class="gut-kbd">?</kbd> to open the help modal anytime</li>
          </ul>
        </div>
      </div>

      <div class="gut-modal-footer gut-intro-footer-centered">
        <button class="gut-btn gut-btn-primary" id="intro-get-started">Get Started</button>
      </div>
    </div>
  </div>
`;
