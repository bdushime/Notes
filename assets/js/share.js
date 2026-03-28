/**
 * @fileoverview Script for the Read-only Shared Note viewer.
 * Responsible for parsing the Note ID from the URL and 
 * displaying the corresponding note content.
 */

import * as storage from './storage.js';

/**
 * Initializes the share view based on the URL's query parameters.
 */
const initShareView = async () => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('id');
    const container = document.getElementById('share-view');

    if (!noteId) {
        showError('No note ID provided.');
        return;
    }

    const rawNotes = await storage.loadNotes();
    const note = rawNotes.find(n => n.id === noteId);

    if (!note) {
        showError('Note not found. It may have been deleted by the owner.');
        return;
    }

    renderNote(note);
};

/**
 * Renders the note content into the sharing container.
 * @param {Object} note - The note data to display.
 */
const renderNote = (note) => {
    const container = document.getElementById('share-view');
    const lastEdited = new Date(note.lastEdited).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });

    container.innerHTML = `
        <header class="share-header">
            <div>
                <h1 class="share-title">${note.title || 'Untitled Note'}</h1>
                <p class="share-meta">Shared on ${lastEdited}</p>
            </div>
            <div class="note-tags">
                ${(note.tags || []).map(tag => `<span class="tag-badge">${tag}</span>`).join('')}
            </div>
        </header>
        <div id="note-content" class="share-content">
            ${note.content || '<i>No content for this note.</i>'}
        </div>
    `;
};

/**
 * Displays an error message in case of missing or invalid note data.
 * @param {string} message - The error message to show.
 */
const showError = (message) => {
    document.getElementById('share-view').innerHTML = `
        <div class="empty-message">
            <h2 style="color: var(--text-color); margin-bottom: 1rem;">Oops!</h2>
            <p>${message}</p>
            <br>
            <a href="index.html" style="color: var(--clr-blue-500); font-weight: 600;">Go to main app</a>
        </div>
    `;
};

// Start initialization
document.addEventListener('DOMContentLoaded', initShareView);
