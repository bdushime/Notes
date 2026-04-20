/**
 * @fileoverview Primary Rendering Engine.
 * Responsible for constructing DOM nodes, manipulating CSS classes, 
 * and reflecting state variables onto the visual viewport interface.
 */

import * as noteManager from './noteManager.js';

/** Cache of heavy DOM node searches to prevent performance bottlenecking. */
export const elements = {
    notesListContainer: document.querySelector('.notes-scroll-area'),
    sidebarTagsList: document.getElementById('sidebar-tags-list'),
    sidebarCategoriesList: document.getElementById('sidebar-categories-list'),

    editorCol: document.querySelector('.note-editor-col'),
    noteForm: document.getElementById('note-form'),
    titleInput: document.querySelector('.editor-title-input'),
    titleError: document.getElementById('title-error'),
    tagsInput: document.querySelector('.metadata-item input[placeholder="Add tags separated by commas"]'),
    categorySelect: document.getElementById('note-category-select'),
    contentInput: document.getElementById('note-content-editor'),
    timestampDisplay: document.querySelector('.timestamp'),
    saveBtn: document.querySelector('.btn-save, .editor-actions .btn-primary'),

    layoutContainer: document.querySelector('.notes-layout'),
    backBtn: document.querySelector('.back-btn'),
    btnCancel: document.querySelectorAll('.btn-cancel, .btn-secondary'),
    createBtns: document.querySelectorAll('.create-note-btn, .create-note-fab'),

    themeToggleBtn: document.querySelector('.settings-btn'),

    // Modals
    deleteModalOverlay: document.getElementById('delete-modal-overlay'),
    catModalOverlay: document.getElementById('category-modal-overlay'),
    catModalInput: document.getElementById('new-category-name'),
    catModalCancelBtn: document.getElementById('cat-modal-cancel-btn'),
    catModalCreateBtn: document.getElementById('cat-modal-create-btn')
};

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not yet saved';

/**
 * Isolates and wraps query terminology within mark tags for native visual highlighting.
 * @param {string} text - The haystack string to process.
 * @param {string} query - The needle variable being searched.
 */
const highlightText = (text, query) => {
    if (!query || !query.trim()) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

export const showSuccessMessage = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
};

export const toggleSaveButton = (isValid) => {
    if (elements.saveBtn) {
        elements.saveBtn.disabled = !isValid;
        elements.saveBtn.style.opacity = isValid ? '1' : '0.5';
    }
};

/**
 * Overrides visible state validations onto designated input fields dynamically.
 * @param {boolean} show - Controls error rendering toggle boolean flag.
 */
export const toggleTitleError = (show) => {
    if (elements.titleError) {
        elements.titleError.classList.toggle('hidden', !show);
    }
    if (elements.titleInput) {
        elements.titleInput.classList.toggle('input-error', show);
        
        if (show) {
            elements.titleInput.classList.add('shake');
            setTimeout(() => elements.titleInput.classList.remove('shake'), 400);
        }
    }
};

/**
 * Maps the Archive toggle actions across dynamic DOM node texts and SVGs reliably.
 * @param {boolean} isArchived - Evaluated archival state.
 */
export const updateArchiveStatusUI = (isArchived) => {
    const actionButtons = document.querySelectorAll('.mobile-editor-actions button, #desktop-meta-actions button');
    
    actionButtons.forEach(btn => {
        const img = btn.querySelector('img');
        const isArchiveBtn = (img && img.src.includes('archive')) || 
                           (img && img.src.includes('restore')) || 
                           btn.textContent.includes('Archive') || 
                           btn.textContent.includes('Restore');

        if (isArchiveBtn) {
            if (isArchived) {
                if (img) img.src = './assets/images/icon-restore.svg';
                btn.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Note')) {
                        node.textContent = ' Restore Note';
                    }
                });
                if (btn.textContent.trim() === 'Archive Note') btn.textContent = 'Restore Note';
            } else {
                if (img) img.src = './assets/images/icon-archive.svg';
                btn.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Note')) {
                        node.textContent = ' Archive Note';
                    }
                });
                if (btn.textContent.trim() === 'Restore Note') btn.textContent = 'Archive Note';
            }
        }
    });
};

/**
 * Re-renders the core note collection sidebar array completely.
 * @param {Array} notes - Collection payload mapping.
 * @param {string|null} activeNoteId - Identification tracker focusing specific selection elements.
 * @param {string} searchQuery - Interpolates query markings actively within generated titles.
 */
export const renderNotesList = (notes, activeNoteId = null, searchQuery = "") => {
    const container = elements.notesListContainer;
    if (!notes?.length) {
        container.innerHTML = `<div class="empty-state"><p>No notes found.</p></div>`;
        return;
    }

    container.innerHTML = notes.map(note => {

        const highlightedTitle = highlightText(note.title || 'Untitled', searchQuery);
        
        // Strip HTML for the preview snippet to avoid showing raw tags or breaking highlighting
        const plainContent = stripHTML(note.content || '');
        const preview = plainContent.substring(0, 70) + (plainContent.length > 70 ? '...' : '');
        const highlightedPreview = highlightText(preview, searchQuery);

        return `
            <div class="note-item ${note.id === activeNoteId ? 'active' : ''}" 
                 data-note-id="${note.id}" 
                 tabindex="0" 
                 role="button" 
                 aria-label="View note: ${note.title || 'Untitled'}">
                <h3 class="note-title">${highlightedTitle}</h3>
                <div class="note-tags">
                    ${(note.tags || []).map(tag => {
                        const highlightedTag = highlightText(tag, searchQuery);
                        return `<span class="tag-badge">${highlightedTag}</span>`;
                    }).join('')}
                    ${note.category ? `<span class="category-badge">${note.category}</span>` : ''}
                </div>
                <p class="note-preview">${highlightedPreview}</p>
                <div class="note-meta-row">
                    <span class="note-date">${formatDate(note.lastEdited)}</span>
                    ${note.location ? `<span class="location-badge">📍 Loc: ${note.location.lat.toFixed(2)}, ${note.location.lng.toFixed(2)}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
};

export const renderTagsList = (tags) => {
    if (!elements.sidebarTagsList) return;
    elements.sidebarTagsList.innerHTML = tags.map(tag => `
        <li class="nav-item">
            <a href="#" class="nav-link" data-filter-tag="${tag}">
                <img src="./assets/images/icon-tag.svg" alt="" class="nav-icon" aria-hidden="true">
                <span>${tag}</span>
            </a>
        </li>
    `).join('');
};

export const renderMobileTagsMenu = (tags) => {
    const container = elements.notesListContainer;
    if (!tags?.length) {
        container.innerHTML = `<div class="empty-state"><p>No tags found.</p></div>`;
        return;
    }

    container.innerHTML = tags.map(tag => `
        <div class="note-item" style="display: flex; align-items: center; gap: 12px; padding: 1.25rem 1rem;" data-filter-tag="${tag}" tabindex="0" role="button">
            <img src="./assets/images/icon-tag.svg" alt="" style="width: 24px; filter: invert(0.6);" />
            <span style="font-weight: 600; font-size: 1.1rem; color: var(--text-color);">${tag}</span>
        </div>
    `).join('');
};

/**
 * Pushes interactive note property states forcefully backwards into active editing DOM node inputs.
 * @param {Object|null} note 
 */
export const populateEditor = (note = null) => {
    const { titleInput, tagsInput, contentInput, timestampDisplay, noteForm, categorySelect } = elements;
    
    noteForm.dataset.editingId = note?.id || '';
    titleInput.value = note?.title || '';
    tagsInput.value = Array.isArray(note?.tags) ? note.tags.join(', ') : '';
    contentInput.innerHTML = note?.content || '';
    timestampDisplay.textContent = formatDate(note?.lastEdited);
    if (categorySelect) categorySelect.value = note?.category || '';

    toggleTitleError(false);
    
    updateArchiveStatusUI(note?.isArchived || false);
    toggleSaveButton(!!titleInput.value.trim());
};

export const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
};

export const showEditorOnMobile = () => elements.layoutContainer.classList.add('viewing-note');
export const hideEditorOnMobile = () => elements.layoutContainer.classList.remove('viewing-note');

export const showValidationError = (input, message) => {
    input.setCustomValidity(message);
    input.reportValidity();
};

export const clearValidation = (input) => input.setCustomValidity('');

/**
 * Renders the sidebar categories navigation list.
 * @param {string[]} categories
 * @param {string|null} activeCategory
 */
export const renderCategoriesList = (categories, activeCategory = null) => {
    const list = elements.sidebarCategoriesList;
    if (!list) return;
    if (!categories.length) {
        list.innerHTML = `<li class="nav-item"><span class="nav-section-empty">No categories yet</span></li>`;
        return;
    }
    list.innerHTML = categories.map(cat => `
        <li class="nav-item">
            <a href="#" class="nav-link ${cat === activeCategory ? 'active' : ''}" data-filter-category="${cat}">
                <img src="./assets/images/icon-tag.svg" alt="" class="nav-icon" aria-hidden="true">
                <span>${cat}</span>
            </a>
        </li>
    `).join('');
};

/**
 * Rebuilds the category <select> dropdown options in the note editor.
 * @param {string[]} categories
 */
export const renderCategoriesDropdown = (categories) => {
    const select = elements.categorySelect;
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">No Category</option>` +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    select.value = categories.includes(current) ? current : '';
};

 * Utility to strip HTML tags from a string for plain text previews.
 * @param {string} html - The HTML string to strip.
 * @returns {string} - Cleaned plain text.
 */
export const stripHTML = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};