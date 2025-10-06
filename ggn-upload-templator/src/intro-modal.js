import { CURRENT_VERSION, INTRO_CONTENT } from './help-content.js';
import { INTRO_MODAL_HTML } from './ui/template.js';
import { openHelpModal } from './help-modal.js';
import { ModalStack, createModal } from './modal-stack.js';

const STORAGE_KEY = 'gut_last_seen_version';

let introModal = null;

export function checkAndShowIntro() {
  const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
  
  if (!lastSeenVersion) {
    showIntroModal('welcome');
  } else if (lastSeenVersion !== CURRENT_VERSION) {
    showIntroModal('update');
  }
}

export function showIntroModal(mode = 'welcome') {
  if (introModal) {
    closeIntroModal();
  }
  
  const isNewUser = mode === 'welcome';
  const content = isNewUser ? INTRO_CONTENT['new-user'] : INTRO_CONTENT[`v${CURRENT_VERSION}`];
  
  introModal = createModal(INTRO_MODAL_HTML(content, isNewUser, CURRENT_VERSION), {
    keyboardHandler: handleIntroKeyboard,
    onClose: () => {
      localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
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
