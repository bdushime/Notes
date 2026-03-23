import * as ui from './ui.js';
import * as noteManager from './noteManager.js';
import * as themes from './themes.js';
import * as storage from './storage.js';

// --- Global App State ---
let currentFilter = { type: 'all', value: null }; 
let activeNoteId = null; 

// --- 1. Initialization (The "Wake Up" Sequence) ---

document.addEventListener('DOMContentLoaded', async () => {
    // A. IMMEDIATE THEME CHECK (Requirement F)
    // This must happen before anything else to prevent the "white flash"
    themes.initializeThemes();
    
    // B. PAGE-SPECIFIC LOGIC
    // Check if we are on the settings page or the main index page
    const isSettingsPage = window.location.pathname.includes('settings.html');

    if (isSettingsPage) {
        // Initialize Settings listeners only on the settings page
        themes.setupSettingsListeners();
    } else {
        // Initialize Notes App logic only on the index page
        await noteManager.initializeNotes();
        updateUI();
        setupEventListeners();
        recoverDraft();
    }
});

/**
 * Re-evaluates state and updates the UI accordingly.
 */
function updateUI() {
    let notesToDisplay = [];
    const titleElement = document.querySelector('.page-title');
    
    if (!titleElement) return; // Guard clause for settings page

    if (currentFilter.type === 'archived') {
        notesToDisplay = noteManager.getArchivedNotes();
        titleElement.textContent = 'Archived Notes';
    } else if (currentFilter.type === 'tag') {
        notesToDisplay = noteManager.filterByTag(currentFilter.value);
        titleElement.textContent = `Notes Tagged: ${currentFilter.value}`;
    } else {
        notesToDisplay = noteManager.getAllNotes(false);
        titleElement.textContent = 'All Notes';
    }

    ui.renderNotesList(notesToDisplay, activeNoteId);
    ui.renderTagsList(noteManager.getAllUniqueTags());
}

// --- 2. Event Listener Orchestration ---

function setupEventListeners() {
    const { titleInput, themeToggleBtn } = ui.elements;
    const notesListContainer = document.querySelector('.notes-scroll-area');
    const noteForm = document.querySelector('#note-form');
    const searchInput = document.querySelector('.search-input');

    // Navigation
    document.querySelector('.sidebar')?.addEventListener('click', handleNavigation);
    document.querySelector('.mobile-nav')?.addEventListener('click', handleNavigation);

    // Note Selection
    notesListContainer?.addEventListener('click', handleNoteSelection);

    // Create Note
    ui.elements.createBtns.forEach(btn => btn.addEventListener('click', startNewNote));

    // Title Validation
    titleInput?.addEventListener('input', () => {
        const isValid = titleInput.value.trim().length > 0;
        ui.toggleSaveButton(isValid);
    });

    // Form Actions
    noteForm?.addEventListener('submit', handleSaveNote);
    
    // Header Settings Icon: Use this to Navigate to settings.html
    themeToggleBtn?.addEventListener('click', () => {
        window.location.href = 'settings.html';
    });

    // Global Shortcuts
    window.addEventListener('keydown', handleKeyboardShortcuts);

    // Cancel/Back
    ui.elements.btnCancel.forEach(btn => btn.addEventListener('click', handleCancel));
    if (ui.elements.backBtn) ui.elements.backBtn.addEventListener('click', handleCancel);

    // Actions
    document.querySelectorAll('.mobile-editor-actions, #desktop-meta-actions')
            .forEach(w => w.addEventListener('click', handleNoteActions));

    // Search
    if (searchInput) searchInput.addEventListener('input', handleSearch);

    // Auto-Drafting
    const inputs = [ui.elements.titleInput, ui.elements.contentInput, ui.elements.tagsInput];
    inputs.forEach(input => {
        if(input) input.addEventListener('input', handleAutoDraft);
    });
}

// --- 3. Helper Functions ---

function handleNavigation(e) {
    const link = e.target.closest('.nav-link, .mobile-nav-item');
    if (!link) return;
    
    // If user clicks "Settings" in the nav, go to settings page
    if (link.textContent.toLowerCase().includes('settings')) {
        window.location.href = 'settings.html';
        return;
    }

    e.preventDefault();
    document.querySelectorAll('.nav-link, .mobile-nav-item').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    const text = link.textContent.trim().toLowerCase();
    
    if (text.includes('all notes') || text.includes('home')) {
        currentFilter = { type: 'all', value: null };
    } else if (text.includes('archived')) {
        currentFilter = { type: 'archived', value: null };
    } else if (link.dataset.filterTag) {
        currentFilter = { type: 'tag', value: link.dataset.filterTag };
    }

    activeNoteId = null;
    ui.populateEditor(null);
    ui.hideEditorOnMobile();
    updateUI();
}

function handleNoteSelection(e) {
    const noteItem = e.target.closest('.note-item');
    if (!noteItem) return;

    const noteId = noteItem.dataset.noteId;
    const note = noteManager.getNoteById(noteId);
    
    if (note) {
        activeNoteId = noteId;
        ui.populateEditor(note);
        ui.showEditorOnMobile(); 
        updateUI();
    }
}

function startNewNote() {
    activeNoteId = null;
    ui.populateEditor(null);
    currentFilter = { type: 'all', value: null };
    updateUI();
    ui.showEditorOnMobile();
    ui.elements.titleInput.focus();
}

async function handleSaveNote(e) {
    e.preventDefault();
    const title = ui.elements.titleInput.value.trim();
    const tags = ui.elements.tagsInput.value; 
    const content = ui.elements.contentInput.value.trim();

    if (!title) return;

    const editingId = document.querySelector('#note-form').dataset.editingId;

    if (editingId) {
        noteManager.updateNote(editingId, { title, content, tags });
        ui.showSuccessMessage('Note Updated!');
    } else {
        const location = await noteManager.getUserLocation();
        const newNote = noteManager.createNote(title, content, tags, location);
        activeNoteId = newNote.id;
        ui.showSuccessMessage('Note Created Successfully!');
    }

    storage.clearDraft();
    updateUI();
}

function handleNoteActions(e) {
    const btn = e.target.closest('button');
    if (!btn || !activeNoteId) return;

    const isDelete = btn.querySelector('img[src*="icon-delete"]') || btn.textContent.includes('Delete');
    const isArchive = btn.querySelector('img[src*="icon-archive"]') || btn.textContent.includes('Archive');

    if (isDelete && confirm('Are you sure you want to delete this note?')) {
        noteManager.deleteNote(activeNoteId);
        resetEditorAfterAction();
    } else if (isArchive) {
        const archived = noteManager.toggleArchive(activeNoteId);
        ui.showSuccessMessage(archived ? 'Note Archived' : 'Note Unarchived');
        resetEditorAfterAction();
    }
}

function handleSearch(e) {
    const results = noteManager.searchNotes(e.target.value);
    ui.renderNotesList(results, activeNoteId);
}

function handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') handleCancel(e);
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveNote(e);
    }
}

function handleAutoDraft() {
    const editingId = document.querySelector('#note-form')?.dataset.editingId;
    if (editingId) return;
    storage.saveDraft({
        title: ui.elements.titleInput.value,
        content: ui.elements.contentInput.value,
        tags: ui.elements.tagsInput.value
    });
}

function recoverDraft() {
    const savedDraft = storage.loadDraft();
    if (savedDraft && !activeNoteId) {
        ui.elements.titleInput.value = savedDraft.title || '';
        ui.elements.contentInput.value = savedDraft.content || '';
        ui.elements.tagsInput.value = savedDraft.tags || '';
        ui.toggleSaveButton(!!savedDraft.title?.trim());
    }
}

function handleCancel(e) {
    e.preventDefault();
    ui.hideEditorOnMobile();
    const note = activeNoteId ? noteManager.getNoteById(activeNoteId) : null;
    ui.populateEditor(note);
}

function resetEditorAfterAction() {
    activeNoteId = null;
    ui.populateEditor(null);
    ui.hideEditorOnMobile();
    updateUI();
}