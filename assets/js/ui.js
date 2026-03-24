import * as noteManager from './noteManager.js';

// --- DOM Elements ---
export const elements = {
    notesListContainer: document.querySelector('.notes-scroll-area'),
    sidebarTagsList: document.getElementById('sidebar-tags-list'),
    
    // Editor Form
    editorCol: document.querySelector('.note-editor-col'),
    noteForm: document.getElementById('note-form'),
    titleInput: document.querySelector('.editor-title-input'),
    titleError: document.getElementById('title-error'), // Reference for validation
    tagsInput: document.querySelector('.metadata-item input[placeholder="Add tags separated by commas"]'),
    contentInput: document.querySelector('.editor-textarea'),
    timestampDisplay: document.querySelector('.timestamp'),
    saveBtn: document.querySelector('.btn-save, .editor-actions .btn-primary'),
    
    // Layout & Navigation
    layoutContainer: document.querySelector('.notes-layout'),
    backBtn: document.querySelector('.back-btn'),
    btnCancel: document.querySelectorAll('.btn-cancel, .btn-secondary'),
    createBtns: document.querySelectorAll('.create-note-btn, .create-note-fab'),

    themeToggleBtn: document.querySelector('.settings-btn') 
};

// --- Helper Functions ---

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not yet saved';

/**
 * NEW: Wraps matching search terms in <mark> tags (Requirement B Bonus)
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
 * UPDATED: Toggles visible validation error and adds shake animation (Requirement E)
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
 * FIXED: Replaced invalid :has/:contains selectors with standard logic
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

// --- Core Rendering ---

/**
 * UPDATED: Added searchQuery parameter for highlighting (Requirement B)
 */
export const renderNotesList = (notes, activeNoteId = null, searchQuery = "") => {
    const container = elements.notesListContainer;
    if (!notes?.length) {
        container.innerHTML = `<div class="empty-state"><p>No notes found.</p></div>`;
        return;
    }

    container.innerHTML = notes.map(note => {
        // Highlight title and tags based on search query
        const highlightedTitle = highlightText(note.title || 'Untitled', searchQuery);

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
                </div>
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

export const populateEditor = (note = null) => {
    const { titleInput, tagsInput, contentInput, timestampDisplay, noteForm } = elements;
    
    noteForm.dataset.editingId = note?.id || '';
    titleInput.value = note?.title || '';
    tagsInput.value = Array.isArray(note?.tags) ? note.tags.join(', ') : '';
    contentInput.value = note?.content || '';
    timestampDisplay.textContent = formatDate(note?.lastEdited);
    
    // Hide error when switching notes
    toggleTitleError(false);
    
    updateArchiveStatusUI(note?.isArchived || false);
    toggleSaveButton(!!titleInput.value.trim());
};

export const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
};

// --- Mobile View Toggles ---
export const showEditorOnMobile = () => elements.layoutContainer.classList.add('viewing-note');
export const hideEditorOnMobile = () => elements.layoutContainer.classList.remove('viewing-note');

// --- Validation ---
export const showValidationError = (input, message) => {
    input.setCustomValidity(message);
    input.reportValidity();
};

export const clearValidation = (input) => input.setCustomValidity('');