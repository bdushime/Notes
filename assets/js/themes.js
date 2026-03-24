// themes.js
import * as storage from './storage.js';

/**
 * 1. Initialization: Loads saved preferences from localStorage 
 * and applies them to the DOM as soon as any page starts.
 */
export const initializeThemes = () => {
    const prefs = storage.loadPreferences();
    // Default to 'dark' and 'sans-serif' if no preferences exist
    applyTheme(prefs.theme || 'dark');
    applyFont(prefs.font || 'sans-serif');
};

/**
 * 2. Apply Color Theme: Updates the <html> attribute.
 * @param {string} themeName - 'light', 'dark', or 'system'
 */
export const applyTheme = (themeName) => {
    // DOM Manipulation: Set the data-theme attribute on the root <html> element
    document.documentElement.setAttribute('data-theme', themeName);

    // Save choice to localStorage so it persists after refresh
    const prefs = storage.loadPreferences();
    prefs.theme = themeName;
    storage.savePreferences(prefs);
};

/**
 * 3. Apply Font Theme: Updates the <html> attribute. (Requirement F)
 * @param {string} fontName - 'sans-serif', 'serif', or 'monospace'
 */
export const applyFont = (fontName) => {
    // DOM Manipulation: Set the data-font attribute on the root <html> element
    document.documentElement.setAttribute('data-font', fontName);
    
    // Persist choice to localStorage
    const prefs = storage.loadPreferences();
    prefs.font = fontName;
    storage.savePreferences(prefs);
};

/**
 * 4. Settings Listeners: Connects the 'Apply' buttons in settings.html to the functions above.
 */
export const setupSettingsListeners = () => {
    // A. Sync UI State: Ensure radio buttons match current saved settings when page opens
    const prefs = storage.loadPreferences();
    
    const activeThemeRadio = document.querySelector(`input[name="color-theme"][value="${prefs.theme || 'dark'}"]`);
    if (activeThemeRadio) activeThemeRadio.checked = true;

    const activeFontRadio = document.querySelector(`input[name="font-theme"][value="${prefs.font || 'sans-serif'}"]`);
    if (activeFontRadio) activeFontRadio.checked = true;

    // B. Get Button Elements
    const applyThemeBtn = document.getElementById('apply-theme-btn');
    const applyFontBtn = document.getElementById('apply-font-btn');

    // C. Listener for Color Theme
    applyThemeBtn?.addEventListener('click', () => {
        const selectedTheme = document.querySelector('input[name="color-theme"]:checked')?.value;
        if (selectedTheme) {
            applyTheme(selectedTheme);
            alert('Color theme updated successfully!');
        }
    });

    // D. Listener for Font Theme (Requirement F)
    applyFontBtn?.addEventListener('click', () => {
        const selectedFont = document.querySelector('input[name="font-theme"]:checked')?.value;
        if (selectedFont) {
            applyFont(selectedFont);
            alert('Font theme updated successfully!');
        }
    });
};