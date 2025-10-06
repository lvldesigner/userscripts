import { version } from '../package.json';
import { INTRO_CONTENT } from './help-content.js';
import { INTRO_MODAL_HTML } from './ui/template.js';
import { openHelpModal } from './help-modal.js';
import { ModalStack, createModal } from './modal-stack.js';

const STORAGE_KEY = 'gut_last_seen_version';

let introModal = null;

export function checkAndShowIntro() {
  const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
  
  if (!lastSeenVersion) {
    showIntroModal('welcome');
  } else if (lastSeenVersion !== version) {
    showIntroModal('update');
  }
}

export function showIntroModal(mode = 'welcome') {
  if (introModal) {
    closeIntroModal();
  }
  
  const isNewUser = mode === 'welcome';
  const content = isNewUser ? INTRO_CONTENT['new-user'] : INTRO_CONTENT.changelog[`v${version}`];
  
  introModal = createModal(INTRO_MODAL_HTML(content, isNewUser, version), {
    keyboardHandler: handleIntroKeyboard,
    onClose: () => {
      localStorage.setItem(STORAGE_KEY, version);
      if (introModal) {
        introModal = null;
      }
    }
  });
  
  setupIntroModal(mode);
}

function setupIntroModal(mode) {
  const closeBtn = introModal.querySelector('.gut-modal-close-btn');
  const getStartedBtn = introModal.querySelector('#intro-get-started');
  const learnMoreBtn = introModal.querySelector('#intro-learn-more');
  
  getStartedBtn?.addEventListener('click', () => ModalStack.pop());
  
  learnMoreBtn?.addEventListener('click', () => {
    ModalStack.pop();
    openHelpModal('quick-start');
  });
}

function closeIntroModal() {
  ModalStack.pop();
}

function handleIntroKeyboard(e) {
  if (!introModal) return;
  
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function resetIntroSettings() {
  localStorage.removeItem(STORAGE_KEY);
}
