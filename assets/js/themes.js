// themes.js
import * as storage from './storage.js';

/**
 * 1. Initialization: Loads saved preferences from localStorage 
 * and applies them to the DOM as soon as the app starts.
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
 * 3. Apply Font: Updates the CSS variable for the font family.
 * @param {string} fontName - 'sans-serif', 'serif', or 'monospace'
 */
export const applyFont = (fontName) => {
    const root = document.documentElement;
    
    // Logic to determine the font stack
    let fontValue = "'Inter', sans-serif"; // Default
    if (fontName === 'serif') fontValue = "'Noto Serif', serif";
    else if (fontName === 'monospace') fontValue = "'Source Code Pro', monospace";

    // Directly update the CSS Variable defined in your :root
    root.style.setProperty('--ff-sans', fontValue);
    
    // Save choice to localStorage
    const prefs = storage.loadPreferences();
    prefs.font = fontName;
    storage.savePreferences(prefs);
};

/**
 * 4. Settings Listeners: Connects the 'Apply' buttons in settings.html to the functions above.
 */
export const setupSettingsListeners = () => {
    // Sync UI to match current preferences
    const prefs = storage.loadPreferences();
    
    // Sync Theme Radio
    const activeThemeRadio = document.querySelector(`input[name="color-theme"][value="${prefs.theme || 'dark'}"]`);
    if (activeThemeRadio) activeThemeRadio.checked = true;

    // Sync Font Radio
    const activeFontRadio = document.querySelector(`input[name="font-theme"][value="${prefs.font || 'sans-serif'}"]`);
    if (activeFontRadio) activeFontRadio.checked = true;

    const applyThemeBtn = document.getElementById('apply-theme-btn');
    const applyFontBtn = document.getElementById('apply-font-btn');

    // Listener for Color Theme
    applyThemeBtn?.addEventListener('click', () => {
        // Find which radio button is currently checked
        const selectedTheme = document.querySelector('input[name="color-theme"]:checked')?.value;
        if (selectedTheme) {
            applyTheme(selectedTheme);
            alert('Theme updated successfully!');
        }
    });

    // Listener for Font Theme
    applyFontBtn?.addEventListener('click', () => {
        const selectedFont = document.querySelector('input[name="font-theme"]:checked')?.value;
        if (selectedFont) {
            applyFont(selectedFont);
            alert('Font updated successfully!');
        }
    });
};