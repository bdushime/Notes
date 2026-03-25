/**
 * @fileoverview Centralizes Web Storage API interactions.
 * Controls data persistence for Notes, User Preferences, and Active Session Drafts.
 */

const STORAGE_KEY_NOTES = 'notesapp_notes';
const STORAGE_KEY_PREFS = 'notesapp_prefs';
const SESSION_KEY_DRAFT = 'notesapp_draft';

/**
 * Fetches notes from localStorage or downloads starter JSON data as a fallback.
 */
export const loadNotes = async () => {
    const rawData = localStorage.getItem(STORAGE_KEY_NOTES);
    if (rawData) {
        return JSON.parse(rawData);
    }
    
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Failed to fetch default notes');
        const data = await response.json();
        
        const notesWithIds = data.notes.map(note => ({
             ...note,
             id: generateId()
        }));

        saveNotes(notesWithIds);
        return notesWithIds;
    } catch (e) {
        console.error('Error loading default notes:', e);
        return [];
    }
};

/**
 * Serializes and overwrites the active notes array into localStorage.
 */
export const saveNotes = (notes) => {
    try {
        localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
        console.error('Failed to save to localStorage. Quota exceeded?', e);
        alert('Failed to save. You may have run out of local storage space.');
    }
};

/**
 * Extracts the user's saved UI theme configurations.
 */
export const loadPreferences = () => {
    const defaultPrefs = { theme: 'dark', font: 'sans-serif' };
    const rawRawPrefs = localStorage.getItem(STORAGE_KEY_PREFS);
    if (rawRawPrefs) {
        return { ...defaultPrefs, ...JSON.parse(rawRawPrefs) };
    }
    return defaultPrefs;
};

/**
 * Persists the user's selected UI theme configurations.
 */
export const savePreferences = (prefs) => {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
};

/**
 * Backs up unsaved active text editor state into the session cache.
 */
export const saveDraft = (draft) => {
    sessionStorage.setItem(SESSION_KEY_DRAFT, JSON.stringify(draft));
};

/**
 * Recovers unsaved text editor states from previous session crashes.
 */
export const loadDraft = () => {
    const draft = sessionStorage.getItem(SESSION_KEY_DRAFT);
    return draft ? JSON.parse(draft) : null;
};

/**
 * Flushes active draft memory.
 */
export const clearDraft = () => {
    sessionStorage.removeItem(SESSION_KEY_DRAFT);
};

/**
 * Utility to generate unique alphanumeric IDs.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
