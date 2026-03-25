import * as ui from './ui.js';
import * as noteManager from './noteManager.js';
import * as themes from './themes.js';
import * as storage from './storage.js';
import * as auth from './auth.js';

// --- Global App State ---
let currentFilter = { type: 'all', value: null }; 
let activeNoteId = null; 

// Modal Memory
let noteIdToProcess = null;
let pendingAction = null; 
let lastFocusedElement; 

// --- DRAFT STATUS TIMER ---
let draftTimer; 


const loggedInUser = auth.checkAuth();
console.log('Welcome, ', loggedInUser);

// --- 1. Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    themes.initializeThemes();
    
    const isSettingsPage = window.location.pathname.includes('settings.html');

    if (isSettingsPage) {
        themes.setupSettingsListeners();
    } else {
        await noteManager.initializeNotes();
        updateUI();
        setupEventListeners();
        recoverDraft();
    }
});

function updateUI() {
    let notesToDisplay = [];
    const titleElement = document.querySelector('.page-title');
    
    if (!titleElement) return;

    if (currentFilter.type === 'tags-menu') {
        titleElement.textContent = 'Tags';
        ui.renderMobileTagsMenu(noteManager.getAllUniqueTags());
        return; // Skip rendering notes list
    } else if (currentFilter.type === 'archived') {
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
    
    const modalOverlay = document.getElementById('delete-modal-overlay');
    const cancelModalBtn = document.getElementById('modal-cancel-btn');
    const confirmModalBtn = document.getElementById('modal-confirm-delete-btn');

    document.querySelector('.sidebar')?.addEventListener('click', handleNavigation);
    document.querySelector('.mobile-nav')?.addEventListener('click', handleNavigation);

    notesListContainer?.addEventListener('click', (e) => {
        const tagItem = e.target.closest('[data-filter-tag]');
        if (tagItem && currentFilter.type === 'tags-menu') {
            currentFilter = { type: 'tag', value: tagItem.dataset.filterTag };
            updateUI();
            return;
        }
        handleNoteSelection(e);
    });

    notesListContainer?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const noteItem = e.target.closest('.note-item');
            if (noteItem) handleNoteSelection({ target: noteItem });
        }
    });

    ui.elements.createBtns.forEach(btn => btn.addEventListener('click', startNewNote));

    // UPDATED: Dynamic validation on input (Requirement E)
    titleInput?.addEventListener('input', () => {
        const isValid = titleInput.value.trim().length > 0;
        ui.toggleSaveButton(isValid);
        if (isValid) ui.toggleTitleError(false); // Hide error while typing
    });

    // NEW: Validation on Blur (Requirement E)
    titleInput?.addEventListener('blur', () => {
        if (!titleInput.value.trim()) {
            ui.toggleTitleError(true);
        }
    });

    noteForm?.addEventListener('submit', handleSaveNote);
    
    themeToggleBtn?.addEventListener('click', () => {
        window.location.href = 'settings.html';
    });

    window.addEventListener('keydown', handleKeyboardShortcuts);

    ui.elements.btnCancel.forEach(btn => btn.addEventListener('click', handleCancel));
    if (ui.elements.backBtn) ui.elements.backBtn.addEventListener('click', handleCancel);

    document.querySelectorAll('.mobile-editor-actions, #desktop-meta-actions')
            .forEach(w => w.addEventListener('click', handleNoteActions));

    if (searchInput) searchInput.addEventListener('input', handleSearch);

    const inputs = [ui.elements.titleInput, ui.elements.contentInput, ui.elements.tagsInput];
    inputs.forEach(input => {
        if(input) input.addEventListener('input', handleAutoDraft);
    });

    cancelModalBtn?.addEventListener('click', closeModal);
    
    confirmModalBtn?.addEventListener('click', () => {
        if (!noteIdToProcess) return;

        if (pendingAction === 'delete') {
            noteManager.deleteNote(noteIdToProcess);
            ui.showSuccessMessage('Note Deleted Permanently');
        } else if (pendingAction === 'archive') {
            const isArchivedNow = noteManager.toggleArchive(noteIdToProcess);
            ui.showSuccessMessage(isArchivedNow ? 'Note Archived' : 'Note Restored');
        }

        resetEditorAfterAction();
        closeModal();
    });

    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    modalOverlay?.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const focusable = modalOverlay.querySelectorAll('button');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
}

// --- 3. Helper Functions ---
function handleNavigation(e) {
    const link = e.target.closest('.nav-link, .mobile-nav-item');
    if (!link) return;
    
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
    } else if (text.includes('tags')) {
        currentFilter = { type: 'tags-menu', value: null };
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

    // UPDATED: Prevent save and show error if title is empty (Requirement E)
    if (!title) {
        ui.toggleTitleError(true);
        ui.elements.titleInput.focus();
        return;
    }

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

    const isDelete = btn.querySelector('img[src*="delete"]') || btn.textContent.includes('Delete');
    const isArchive = btn.querySelector('img[src*="archive"]') || btn.textContent.includes('Archive') || btn.textContent.includes('Restore');

    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const modalIcon = document.getElementById('modal-icon');
    const confirmBtn = document.getElementById('modal-confirm-delete-btn');
    const overlay = document.getElementById('delete-modal-overlay');

    if (!overlay || !modalTitle) return;

    const note = noteManager.getNoteById(activeNoteId);
    noteIdToProcess = activeNoteId;
    lastFocusedElement = document.activeElement; 

    if (isDelete) {
        pendingAction = 'delete';
        modalTitle.textContent = 'Delete Note';
        modalSubtitle.textContent = 'Are you sure you want to permanently delete this note? This action cannot be undone.';
        modalIcon.src = './assets/images/icon-delete.svg';
        confirmBtn.textContent = 'Delete Note';
        confirmBtn.className = 'modal-btn btn-danger'; 
        overlay.classList.remove('hidden');
        setTimeout(() => document.getElementById('modal-cancel-btn').focus(), 10);
    } else if (isArchive) {
        pendingAction = 'archive';
        const isCurrentlyArchived = note?.isArchived;
        
        modalTitle.textContent = isCurrentlyArchived ? 'Restore Note' : 'Archive Note';
        modalSubtitle.textContent = isCurrentlyArchived 
            ? 'Are you sure you want to restore this note? It will appear back in your All Notes section.' 
            : 'Are you sure you want to archive this note? You can find it in the Archived Notes section and restore it anytime.';
        
        modalIcon.src = isCurrentlyArchived ? './assets/images/icon-restore.svg' : './assets/images/icon-archive.svg';
        confirmBtn.textContent = isCurrentlyArchived ? 'Restore Note' : 'Archive Note';
        confirmBtn.className = 'modal-btn btn-archive'; 
        overlay.classList.remove('hidden');
        setTimeout(() => document.getElementById('modal-cancel-btn').focus(), 10);
    }
}

function closeModal() {
    document.getElementById('delete-modal-overlay').classList.add('hidden');
    noteIdToProcess = null;
    pendingAction = null;
    if (lastFocusedElement) lastFocusedElement.focus();
}

function handleSearch(e) {
    const searchTerm = e.target.value;
    const isArchivedView = currentFilter.type === 'archived';
    
    const results = noteManager.searchNotes(searchTerm, isArchivedView);
    
    ui.renderNotesList(results, activeNoteId, searchTerm);
}

function handleKeyboardShortcuts(e) {
    if (e.key === 'Escape') {
        const overlay = document.getElementById('delete-modal-overlay');
        if (overlay && !overlay.classList.contains('hidden')) {
            closeModal();
        } else {
            handleCancel(e);
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveNote(e);
    }
}

function handleAutoDraft() {
    const editingId = document.querySelector('#note-form')?.dataset.editingId;
    if (editingId) return;

    const statusElement = document.getElementById('draft-status');

    storage.saveDraft({
        title: ui.elements.titleInput.value,
        content: ui.elements.contentInput.value,
        tags: ui.elements.tagsInput.value
    });

    if (statusElement) {
        statusElement.textContent = "Saving...";
        statusElement.classList.add('visible');

        clearTimeout(draftTimer);

        draftTimer = setTimeout(() => {
            statusElement.textContent = "Draft saved";
            setTimeout(() => {
                statusElement.classList.remove('visible');
            }, 2000);
        }, 800);
    }
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