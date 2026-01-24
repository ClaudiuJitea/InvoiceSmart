// Modal component
import { icons } from '../icons.js';

class ModalManager {
  constructor() {
    this.overlay = null;
    this.modal = null;
  }

  show({ title, content, size = 'default', onClose = null }) {
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';

    const sizeClass = size === 'lg' ? 'modal-lg' : size === 'xl' ? 'modal-xl' : '';

    this.overlay.innerHTML = `
      <div class="modal ${sizeClass}">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" aria-label="Close">
            ${icons.close}
          </button>
        </div>
        <div class="modal-content">
          ${typeof content === 'string' ? content : ''}
        </div>
      </div>
    `;

    // If content is an element, append it
    if (typeof content !== 'string') {
      this.overlay.querySelector('.modal-content').appendChild(content);
    }

    // Close handlers
    const closeBtn = this.overlay.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.close());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // ESC key to close
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.escHandler);

    this.onClose = onClose;

    document.body.appendChild(this.overlay);

    // Trigger animation
    requestAnimationFrame(() => {
      this.overlay.classList.add('open');
    });

    return this;
  }

  close() {
    if (!this.overlay) return;

    this.overlay.classList.remove('open');
    document.removeEventListener('keydown', this.escHandler);

    setTimeout(() => {
      this.overlay.remove();
      this.overlay = null;
      if (this.onClose) this.onClose();
    }, 300);
  }

  // Static method for confirm dialogs
  static confirm({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
    const modal = new ModalManager();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <p style="margin-bottom: var(--space-6)">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-text cancel-btn">${cancelText}</button>
        <button class="btn btn-danger confirm-btn">${confirmText}</button>
      </div>
    `;

    wrapper.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.close();
      if (onCancel) onCancel();
    });

    wrapper.querySelector('.confirm-btn').addEventListener('click', () => {
      modal.close();
      if (onConfirm) onConfirm();
    });

    modal.show({ title, content: wrapper });
    return modal;
  }
}

export const modal = new ModalManager();
export const confirm = ModalManager.confirm;
export default modal;
