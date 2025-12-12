// Initialize modal when API is ready
function initModal() {
  if (!window.modalApi) {
    return;
  }

  window.modalApi.onInit((options) => {
    const { title, message, detail, icon, buttons, responseChannel } = options;

    // Set icon
    const iconEl = document.getElementById('modalIcon');
    if (iconEl) {
      iconEl.className = `modal-icon ${icon || 'warning'}`;
    }

    // Set title
    const titleEl = document.getElementById('modalTitle');
    if (titleEl) {
      titleEl.textContent = title || '';
    }

    // Set message
    const messageEl = document.getElementById('modalMessage');
    if (messageEl) {
      messageEl.textContent = message || '';
    }

    // Set detail
    const detailEl = document.getElementById('modalDetail');
    if (detailEl) {
      if (detail) {
        detailEl.textContent = detail;
      } else {
        detailEl.style.display = 'none';
      }
    }

    // Create buttons
    const buttonsContainer = document.getElementById('modalButtons');
    if (buttonsContainer && buttons) {
      buttonsContainer.innerHTML = '';

      buttons.forEach((btn) => {
        const button = document.createElement('button');
        button.className = `modal-btn ${btn.type || 'default'}`;
        button.textContent = btn.label;
        button.onclick = () => {
          window.modalApi.sendResponse(responseChannel, btn.value);
        };
        buttonsContainer.appendChild(button);
      });
    }
  });
}

// Wait for DOM and preload to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModal);
} else {
  initModal();
}
