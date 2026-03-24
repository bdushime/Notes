import * as storage from './storage.js';

// --- State ---
export let notes = []; 

const syncStorage = () => storage.saveNotes(notes);
const sortByDate = (data) => [...data].sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));

// --- Geolocation Logic ---
export const getUserLocation = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            () => {
                resolve(null);
            }
        );
    });
};

// --- Core Actions ---
export const initializeNotes = async () => {
    const rawNotes = await storage.loadNotes();
    
    // FIX: Data Sanitization
    // This ensures that even if old data is a string, it becomes an array
    notes = rawNotes.map(note => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : (note.tags ? note.tags.split(',').map(t => t.trim()) : [])
    }));
    
    return notes;
};

export class Note {
    constructor(title, content, tags = [], location = null) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        this.title = title || 'Untitled Note';
        this.content = content || '';
        // Ensure tags are always an array during creation
        this.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
        this.lastEdited = new Date().toISOString();
        this.isArchived = false;
        this.location = location; 
    }
}

export const getNotes = (criteria = { archived: false }) => {
    const filtered = notes.filter(n => n.isArchived === criteria.archived);
    return sortByDate(filtered);
};

export const getAllNotes = () => getNotes({ archived: false });
export const getArchivedNotes = () => getNotes({ archived: true });

export const getNoteById = (id) => notes.find(n => n.id === id);

export const createNote = (title, content, tags, location = null) => {
    const newNote = new Note(title, content, tags, location);
    notes.push(newNote);
    syncStorage();
    return newNote;
};

export const updateNote = (id, updates) => {
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    // Ensure tags in updates are also handled as an array
    if (updates.tags && !Array.isArray(updates.tags)) {
        updates.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

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

    const results = notes.filter(note => 
        note.title.toLowerCase().includes(q) || 
        note.content.toLowerCase().includes(q) || 
        (Array.isArray(note.tags) && note.tags.some(tag => tag.toLowerCase().includes(q)))
    );
    return sortByDate(results);
};

export const filterByTag = (tag) => {
    const t = tag.toLowerCase().trim();
    return notes.filter(note => 
        Array.isArray(note.tags) && note.tags.map(tag => tag.toLowerCase()).includes(t)
    );
};

export const getAllUniqueTags = () => {
    const allTags = notes.flatMap(note => Array.isArray(note.tags) ? note.tags : []);
    return [...new Set(allTags)].sort((a, b) => a.localeCompare(b));
};