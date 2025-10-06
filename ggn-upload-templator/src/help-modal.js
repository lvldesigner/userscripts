import { HELP_SECTIONS, CURRENT_VERSION } from './help-content.js';
import { HELP_MODAL_HTML } from './ui/template.js';
import { ModalStack, createModal } from './modal-stack.js';

let helpModal = null;
let currentSection = 'quick-start';

export function isHelpModalOpen() {
  return helpModal !== null;
}

export function toggleHelpModal(sectionId = 'quick-start') {
  if (helpModal) {
    closeHelpModal();
    return;
  }
  openHelpModal(sectionId);
}

export function openHelpModal(sectionId = 'quick-start') {
  if (helpModal) {
    closeHelpModal();
  }

  currentSection = sectionId;
  
  helpModal = createModal(HELP_MODAL_HTML(HELP_SECTIONS, CURRENT_VERSION), {
    keyboardHandler: handleHelpKeyboard,
    onClose: () => {
      if (helpModal) {
        helpModal = null;
      }
    }
  });
  
  setupHelpModal();
  showSection(sectionId);
}

export function closeHelpModal() {
  ModalStack.pop();
}

function setupHelpModal() {
  const searchInput = helpModal.querySelector('#help-search-input');
  const tocToggle = helpModal.querySelector('#help-toc-toggle');
  const toc = helpModal.querySelector('#help-toc');
  const tocItems = helpModal.querySelectorAll('.gut-help-toc-item');
  
  searchInput?.addEventListener('input', handleSearch);
  
  tocToggle?.addEventListener('click', () => {
    if (toc) {
      toc.style.display = toc.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  tocItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      showSection(sectionId);
    });
  });
}

function showSection(sectionId) {
  if (!HELP_SECTIONS[sectionId]) {
    sectionId = 'quick-start';
  }
  
  currentSection = sectionId;
  
  const sections = helpModal.querySelectorAll('.gut-help-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  const activeSection = helpModal.querySelector(`[data-section-id="${sectionId}"]`);
  if (activeSection) {
    activeSection.classList.add('active');
  }
  
  const tocItems = helpModal.querySelectorAll('.gut-help-toc-item');
  tocItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === sectionId) {
      item.classList.add('active');
    }
  });
  
  const contentArea = helpModal.querySelector('.gut-help-content');
  if (contentArea) {
    contentArea.scrollTop = 0;
  }
  
  const searchInput = helpModal.querySelector('#help-search-input');
  if (searchInput) {
    searchInput.value = '';
  }
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  
  if (!query) {
    showAllSections();
    return;
  }
  
  const matchingSections = [];
  
  Object.keys(HELP_SECTIONS).forEach(sectionId => {
    const section = HELP_SECTIONS[sectionId];
    const titleMatch = section.title.toLowerCase().includes(query);
    const contentMatch = section.content.toLowerCase().includes(query);
    const keywordMatch = section.keywords?.some(keyword => 
      keyword.toLowerCase().includes(query)
    );
    
    if (titleMatch || contentMatch || keywordMatch) {
      matchingSections.push(sectionId);
    }
  });
  
  const tocItems = helpModal.querySelectorAll('.gut-help-toc-item');
  const sections = helpModal.querySelectorAll('.gut-help-section');
  
  if (matchingSections.length === 0) {
    showNoResults();
    return;
  }
  
  tocItems.forEach(item => {
    const sectionId = item.dataset.section;
    if (matchingSections.includes(sectionId)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
  
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  const firstMatch = matchingSections[0];
  const firstSection = helpModal.querySelector(`[data-section-id="${firstMatch}"]`);
  if (firstSection) {
    firstSection.classList.add('active');
  }
  
  tocItems.forEach(item => {
    item.classList.remove('active');
    if (item.dataset.section === firstMatch) {
      item.classList.add('active');
    }
  });
}

function showAllSections() {
  const tocItems = helpModal.querySelectorAll('.gut-help-toc-item');
  tocItems.forEach(item => {
    item.style.display = 'block';
  });
  
  showSection(currentSection);
}

function showNoResults() {
  const sections = helpModal.querySelectorAll('.gut-help-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  const noResults = helpModal.querySelector('.gut-help-no-results');
  if (noResults) {
    noResults.style.display = 'block';
  }
}

function handleHelpKeyboard(e) {
  if (!helpModal) return;
  
  if (e.key === 'Escape') {
    e.preventDefault();
    closeHelpModal();
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = helpModal.querySelector('#help-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }
}

export function navigateToHelpSection(sectionId) {
  if (!helpModal) {
    openHelpModal(sectionId);
  } else {
    showSection(sectionId);
  }
}
