export class CustomSelect {
    constructor(selectElement) {
        if (!selectElement) return;
        this.select = selectElement;
        this.container = null;
        this.trigger = null;
        this.optionsContainer = null;
        this.optionsList = null;
        this.searchInput = null;
        this.isSearchable = false;
        this.labelSpan = null;
        this.isOpen = false;
        this.overflowWrapper = null;
        this.handleTriggerClick = null;
        this.handleDocumentClick = null;
        this.handleSelectChange = null;

        this.init();
    }

    init() {
        this.isSearchable = this.select.dataset.searchable === 'true';

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

        if (this.isSearchable) {
            const searchWrapper = document.createElement('div');
            searchWrapper.classList.add('custom-select-search');

            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.classList.add('custom-select-search-input');
            this.searchInput.placeholder = this.select.dataset.searchPlaceholder || 'Search...';
            this.searchInput.addEventListener('input', () => this.filterOptions(this.searchInput.value));

            searchWrapper.appendChild(this.searchInput);
            this.optionsContainer.appendChild(searchWrapper);
        }

        this.optionsList = document.createElement('div');
        this.optionsList.classList.add('custom-select-options-list');
        this.optionsContainer.appendChild(this.optionsList);

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
        if (!this.optionsList) return;
        this.optionsList.innerHTML = '';

        Array.from(this.select.options).forEach(opt => {
            // Hide the placeholder option from the dropdown list when searchable.
            // It stays visible as the trigger label when nothing is selected.
            if (this.isSearchable && opt.value === '') {
                return;
            }

            const optionDiv = document.createElement('div');
            optionDiv.classList.add('custom-option');
            optionDiv.textContent = opt.textContent;
            optionDiv.dataset.value = opt.value;
            optionDiv.dataset.label = (opt.textContent || '').toLowerCase();

            if (opt.selected) {
                optionDiv.classList.add('selected');
            }

            optionDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(opt.value);
            });

            this.optionsList.appendChild(optionDiv);
        });
    }

    filterOptions(query) {
        if (!this.optionsList) return;
        const q = String(query || '').trim().toLowerCase();
        this.optionsList.querySelectorAll('.custom-option').forEach((optionEl) => {
            const label = optionEl.dataset.label || '';
            optionEl.style.display = !q || label.includes(q) ? '' : 'none';
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

        // Prevent clipping when select is inside scroll/overflow wrappers (e.g. invoice items table)
        this.overflowWrapper = this.select.closest('.table-wrapper, .table-container');
        if (this.overflowWrapper) {
            this.overflowWrapper.classList.add('allow-overflow');
        }

        this.container.classList.add('open');
        this.trigger.classList.add('open');
        this.isOpen = true;
        if (this.searchInput) {
            this.searchInput.value = '';
            this.filterOptions('');
            setTimeout(() => this.searchInput?.focus(), 0);
        }
    }

    close() {
        this.container.classList.remove('open');
        this.trigger.classList.remove('open');
        if (this.overflowWrapper) {
            this.overflowWrapper.classList.remove('allow-overflow');
            this.overflowWrapper = null;
        }
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
