import * as storage from './storage.js';

// --- State ---
let notes = [];

const syncStorage = () => storage.saveNotes(notes);
const sortByDate = (data) => [...data].sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));

// --- Geolocation Logic (Requirement D - Bonus) ---

/**
 * Uses the Browser Geolocation API to get coordinates.
 * Returns a Promise so we can wait for the user to click "Allow".
 */
export const getUserLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null); // Browser doesn't support it
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success: Return an object with lat and long
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            () => {
                resolve(null); // User denied or error occurred
            }
        );
    });
};

// --- Core Actions ---

export const initializeNotes = async () => {
    notes = await storage.loadNotes();
    return notes;
};

export class Note {
    constructor(title, content, tags = [], location = null) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        this.title = title || 'Untitled Note';
        this.content = content || '';
        this.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
        this.lastEdited = new Date().toISOString();
        this.isArchived = false;
        // NEW: Store location data (lat/lng) directly in the note
        this.location = location; 
    }
}

/**
 * Get notes with a dynamic filter.
 */
export const getNotes = (criteria = { archived: false }) => {
    const filtered = notes.filter(n => n.isArchived === criteria.archived);
    return sortByDate(filtered);
};

export const getAllNotes = () => getNotes({ archived: false });
export const getArchivedNotes = () => getNotes({ archived: true });

export const getNoteById = (id) => notes.find(n => n.id === id);

// NEW: We now accept 'location' as a parameter when creating a note
export const createNote = (title, content, tags, location = null) => {
    const newNote = new Note(title, content, tags, location);
    notes.push(newNote);
    syncStorage();
    return newNote;
};

export const updateNote = (id, updates) => {
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    notes[index] = { 
        ...notes[index], 
        ...updates, 
        lastEdited: new Date().toISOString() 
    };
    syncStorage();
    return notes[index];
};

export const deleteNote = (id) => {
    notes = notes.filter(n => n.id !== id);
    syncStorage();
};

export const toggleArchive = (id) => {
    const note = getNoteById(id);
    if (note) {
        note.isArchived = !note.isArchived;
        syncStorage();
        return note.isArchived;
    }
    return false;
};

// --- Search & Tag Logic ---

export const searchNotes = (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return getAllNotes();

    const results = getAllNotes().filter(note => 
        note.title.toLowerCase().includes(q) || 
        note.content.toLowerCase().includes(q) || 
        note.tags.some(tag => tag.toLowerCase().includes(q))
    );
    return sortByDate(results);
};

export const filterByTag = (tag) => {
    const t = tag.toLowerCase().trim();
    return getAllNotes().filter(note => 
        note.tags.map(tag => tag.toLowerCase()).includes(t)
    );
};

export const getAllUniqueTags = () => {
    const allTags = getAllNotes().flatMap(note => note.tags);
    return [...new Set(allTags)].sort((a, b) => a.localeCompare(b));
};