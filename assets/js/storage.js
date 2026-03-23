// storage.js

const STORAGE_KEY_NOTES = 'notesapp_notes';
const STORAGE_KEY_PREFS = 'notesapp_prefs';
const SESSION_KEY_DRAFT = 'notesapp_draft';

/**
 * Loads notes from localStorage. If they don't exist, fetches the defaults
 * from data.json and populates localStorage.
 * Returns a Promise resolving to an array of notes.
 */
export const loadNotes = async () => {
    const rawData = localStorage.getItem(STORAGE_KEY_NOTES);
    if (rawData) {
        return JSON.parse(rawData);
    }
    
    // Fallback: load defaults from data.json
    try {
        const response = await fetch('./data.json');
        if (!response.ok) throw new Error('Failed to fetch default notes');
        const data = await response.json();
        
        // Give each imported note a unique ID since it's missing in the raw JSON
        const notesWithIds = data.notes.map(note => ({
             ...note,
             id: generateId()
        }));

        saveNotes(notesWithIds);
        return notesWithIds;
    } catch (e) {
        console.error('Error loading default notes:', e);
        return []; // Return empty array if all fails
    }
};

/**
 * Saves exactly the provided notes array to localStorage.
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
 * Loads user preferences (themes, fonts)
 * Returns object: { theme: 'dark', font: 'sans-serif' }
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
 * Saves preferences
 */
export const savePreferences = (prefs) => {
    localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(prefs));
};

/**
 * Auto-Saves draft to sessionStorage
 */
export const saveDraft = (draft) => {
    sessionStorage.setItem(SESSION_KEY_DRAFT, JSON.stringify(draft));
};

export const loadDraft = () => {
    const draft = sessionStorage.getItem(SESSION_KEY_DRAFT);
    return draft ? JSON.parse(draft) : null;
};

export const clearDraft = () => {
    sessionStorage.removeItem(SESSION_KEY_DRAFT);
};

// Simple ID Generator helper
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
