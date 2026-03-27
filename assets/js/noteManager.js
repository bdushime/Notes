/**
 * @fileoverview Orchestrates data transformations for Note objects.
 * Handles generation, filtering, searching, and structural management of note entities.
 */
import * as storage from './storage.js';

export let notes = [];
export let categories = [];

const syncStorage = () => storage.saveNotes(notes);
const syncCategories = () => storage.saveCategories(categories);
const sortByDate = (data) => [...data].sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited));

/**
 * Probes the browser for geographical coordinates using the HTML5 API.
 */
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

/**
 * Boots the initial memory state from local storage and normalizes backward-compatible data schemas.
 */
export const initializeNotes = async () => {
    const rawNotes = await storage.loadNotes();
    
    notes = rawNotes.map(note => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : (note.tags ? note.tags.split(',').map(t => t.trim()) : [])
    }));
    
    return notes;
};

/**
 * Boots the categories array from localStorage.
 */
export const initializeCategories = () => {
    categories = storage.loadCategories();
    return categories;
};

/**
 * Blueprint for dynamically instantiating universally unique Note data objects.
 */
export class Note {
    constructor(title, content, tags = [], location = null) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substring(2);
        this.title = title || 'Untitled Note';
        this.content = content || '';
        this.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
        this.lastEdited = new Date().toISOString();
        this.isArchived = false;
        this.location = location; 
    }
}

/**
 * Queries the memory base for universally matching note collections.
 */
export const getNotes = (criteria = { archived: false }) => {
    const filtered = notes.filter(n => n.isArchived === criteria.archived);
    return sortByDate(filtered);
};

export const getAllNotes = () => getNotes({ archived: false });
export const getArchivedNotes = () => getNotes({ archived: true });

export const getNoteById = (id) => notes.find(n => n.id === id);

/**
 * Generates and commits a fresh Note item into the structural array.
 */
export const createNote = (title, content, tags, location = null) => {
    const newNote = new Note(title, content, tags, location);
    notes.push(newNote);
    syncStorage();
    return newNote;
};

/**
 * Overwrites properties of established notes using an update payload map.
 */
export const updateNote = (id, updates) => {
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

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

/**
 * Obliterates a note dynamically out of memory state permanently.
 */
export const deleteNote = (id) => {
    notes = notes.filter(n => n.id !== id);
    syncStorage();
};

/**
 * Swaps a specific note's archive visibility status.
 */
export const toggleArchive = (id) => {
    const note = getNoteById(id);
    if (note) {
        note.isArchived = !note.isArchived;
        syncStorage();
        return note.isArchived;
    }
    return false;
};

/**
 * Evaluates active string checks against titles, contents, and integrated tag variables.
 */
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

/**
 * Intercepts subset maps based exclusively on internal tag references.
 */
export const filterByTag = (tag) => {
    const t = tag.toLowerCase().trim();
    return notes.filter(note => 
        Array.isArray(note.tags) && note.tags.map(tag => tag.toLowerCase()).includes(t)
    );
};

/**
 * Isolates, strips duplicates, and returns absolutely every unique tag loaded.
 */
export const getAllUniqueTags = () => {
    const allTags = notes.flatMap(note => Array.isArray(note.tags) ? note.tags : []);
    return [...new Set(allTags)].sort((a, b) => a.localeCompare(b));
};

// ─── CATEGORY FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Returns the full categories array.
 */
export const getCategories = () => categories;

/**
 * Creates a new category if it doesn't already exist.
 * @param {string} name
 * @returns {boolean} true if created, false if duplicate.
 */
export const createCategory = (name) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return false;
    categories.push(trimmed);
    syncCategories();
    return true;
};

/**
 * Removes a category and unassigns it from all notes.
 * @param {string} name
 */
export const deleteCategory = (name) => {
    categories = categories.filter(c => c !== name);
    notes = notes.map(n => ({
        ...n,
        category: n.category === name ? null : n.category
    }));
    syncCategories();
    syncStorage();
};

/**
 * Assigns a category to a note by ID.
 * @param {string} noteId
 * @param {string|null} category
 */
export const assignCategory = (noteId, category) => {
    const index = notes.findIndex(n => n.id === noteId);
    if (index === -1) return;
    notes[index] = { ...notes[index], category: category || null };
    syncStorage();
};

/**
 * Returns notes that belong to a specific category.
 * @param {string} category
 */
export const filterByCategory = (category) => {
    return sortByDate(notes.filter(n => n.category === category && !n.isArchived));
};