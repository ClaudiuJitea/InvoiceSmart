export class CustomSelect {
    constructor(selectElement) {
        if (!selectElement) return;
        this.select = selectElement;
        this.container = null;
        this.trigger = null;
        this.optionsContainer = null;
        this.labelSpan = null;
        this.isOpen = false;
        this.handleTriggerClick = null;
        this.handleDocumentClick = null;
        this.handleSelectChange = null;

        this.init();
    }

    init() {
        // Hide original select
        this.select.style.display = 'none';

        // Create container
        this.container = document.createElement('div');
        this.container.classList.add('custom-select-container');
        // Ensure it takes full width of the parent (form-row column)
        this.container.style.width = '100%';

        // Create trigger
        this.trigger = document.createElement('div');
        this.trigger.classList.add('custom-select-trigger');

        // Create label
        this.labelSpan = document.createElement('span');
        this.updateLabel(); // Set initial text
        this.trigger.appendChild(this.labelSpan);

        // Create icon
        const icon = document.createElement('div');
        icon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        this.trigger.appendChild(icon);

        this.container.appendChild(this.trigger);

        // Create options container
        this.optionsContainer = document.createElement('div');
        this.optionsContainer.classList.add('custom-select-options');

        this.renderOptions();

        this.container.appendChild(this.optionsContainer);

        // Insert after select
        this.select.parentNode.insertBefore(this.container, this.select.nextSibling);

        // Event Listeners
        this.handleTriggerClick = (e) => {
            if (this.select.disabled) return;
            e.stopPropagation();
            this.toggle();
        };
        this.trigger.addEventListener('click', this.handleTriggerClick);

        // Close when clicking outside
        this.handleDocumentClick = (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        };
        document.addEventListener('click', this.handleDocumentClick);

        // Listen for external changes to the select (e.g. programmatically changed)
        this.handleSelectChange = () => {
            this.updateLabel();
            this.renderOptions(); // To update 'selected' class
        };
        this.select.addEventListener('change', this.handleSelectChange);
    }

    renderOptions() {
        this.optionsContainer.innerHTML = '';

        Array.from(this.select.options).forEach(opt => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('custom-option');
            optionDiv.textContent = opt.textContent;
            optionDiv.dataset.value = opt.value;

            if (opt.selected) {
                optionDiv.classList.add('selected');
            }

            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(opt.value);
            });

            this.optionsContainer.appendChild(optionDiv);
        });
    }

    selectOption(value) {
        if (this.select.value !== value) {
            this.select.value = value;
            this.updateLabel();

            // Trigger change event on the original select so other listeners fire
            const event = new Event('change', { bubbles: true });
            this.select.dispatchEvent(event);
        }

        this.close();
        this.renderOptions(); // Update selected styling
    }

    updateLabel() {
        const selectedOption = this.select.options[this.select.selectedIndex];
        this.labelSpan.textContent = selectedOption ? selectedOption.textContent : '';
    }

    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    open() {
        // Close other open custom selects? optional but good UX
        document.querySelectorAll('.custom-select-container.open').forEach(el => {
            if (el !== this.container) {
                el.classList.remove('open');
                const trigger = el.querySelector('.custom-select-trigger');
                if (trigger) trigger.classList.remove('open');
            }
        });

        this.container.classList.add('open');
        this.trigger.classList.add('open');
        this.isOpen = true;
    }

    close() {
        this.container.classList.remove('open');
        this.trigger.classList.remove('open');
        this.isOpen = false;
    }

    destroy() {
        if (this.trigger && this.handleTriggerClick) {
            this.trigger.removeEventListener('click', this.handleTriggerClick);
        }
        if (this.select && this.handleSelectChange) {
            this.select.removeEventListener('change', this.handleSelectChange);
        }
        if (this.handleDocumentClick) {
            document.removeEventListener('click', this.handleDocumentClick);
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        if (this.select) {
            this.select.style.display = '';
        }
    }
}
