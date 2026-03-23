import * as noteManager from './noteManager.js';

// --- DOM Elements ---
export const elements = {
    notesListContainer: document.querySelector('.notes-scroll-area'),
    sidebarTagsList: document.getElementById('sidebar-tags-list'),
    
    // Editor Form
    editorCol: document.querySelector('.note-editor-col'),
    noteForm: document.getElementById('note-form'),
    titleInput: document.querySelector('.editor-title-input'),
    tagsInput: document.querySelector('.metadata-item input[placeholder="Add tags separated by commas"]'),
    contentInput: document.querySelector('.editor-textarea'),
    timestampDisplay: document.querySelector('.timestamp'),
    saveBtn: document.querySelector('.btn-save, .editor-actions .btn-primary'),
    
    // Layout & Navigation
    layoutContainer: document.querySelector('.notes-layout'),
    backBtn: document.querySelector('.back-btn'),
    btnCancel: document.querySelectorAll('.btn-cancel, .btn-secondary'),
    createBtns: document.querySelectorAll('.create-note-btn, .create-note-fab'),

    // NEW: Theme Toggle Button
    themeToggleBtn: document.querySelector('.settings-btn') 
};

// --- Helper Functions ---

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not yet saved';

/**
 * NEW: Displays a brief success message (Requirement E)
 */
export const showSuccessMessage = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000); // Remove after 3 seconds
};

/**
 * NEW: Updates the Save button state (Requirement E)
 * Disables button if title is empty.
 */
export const toggleSaveButton = (isValid) => {
    if (elements.saveBtn) {
        elements.saveBtn.disabled = !isValid;
        elements.saveBtn.style.opacity = isValid ? '1' : '0.5';
    }
};

// --- Core Rendering ---

export const renderNotesList = (notes, activeNoteId = null) => {
    const container = elements.notesListContainer;
    if (!notes?.length) {
        container.innerHTML = `<div class="empty-state"><p>No notes found.</p></div>`;
        return;
    }

    // Refactored to use Template Literals + Geolocation Check (Requirement D)
    container.innerHTML = notes.map(note => `
        <div class="note-item ${note.id === activeNoteId ? 'active' : ''}" data-note-id="${note.id}">
            <h3 class="note-title">${note.title || 'Untitled'}</h3>
            <div class="note-tags">
                ${note.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
            </div>
            <div class="note-meta-row">
                <span class="note-date">${formatDate(note.lastEdited)}</span>
                ${note.location ? `<span class="location-badge">📍 Loc: ${note.location.lat.toFixed(2)}, ${note.location.lng.toFixed(2)}</span>` : ''}
            </div>
        </div>
    `).join('');
};

export const renderTagsList = (tags) => {
    if (!elements.sidebarTagsList) return;
    elements.sidebarTagsList.innerHTML = tags.map(tag => `
        <li class="nav-item">
            <a href="#" class="nav-link" data-filter-tag="${tag}">
                <img src="./assets/images/icon-tag.svg" alt="" class="nav-icon">
                <span>${tag}</span>
            </a>
        </li>
    `).join('');
};

export const populateEditor = (note = null) => {
    const { titleInput, tagsInput, contentInput, timestampDisplay, noteForm } = elements;
    
    noteForm.dataset.editingId = note?.id || '';
    titleInput.value = note?.title || '';
    tagsInput.value = note?.tags.join(', ') || '';
    contentInput.value = note?.content || '';
    timestampDisplay.textContent = formatDate(note?.lastEdited);
    
    // Reset validation when populating
    toggleSaveButton(!!titleInput.value.trim());
};

// --- Theme Management (Requirement F) ---

export const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    // If you have a specific icon change for light/dark, do it here
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