/**
 * @fileoverview Manages application-wide user interface preferences.
 * Handles the application of CSS themes, fonts, and the interactivity
 * of the Settings master-detail page layout.
 */

import * as storage from './storage.js';
import * as auth from './auth.js';

/**
 * Executes immediately on page load to apply cached user CSS preferences.
 */
export const initializeThemes = () => {
    const prefs = storage.loadPreferences();

    applyTheme(prefs.theme || 'dark');
    applyFont(prefs.font || 'sans-serif');
};

/**
 * Mutates the root HTML element's data attribute to trigger global CSS theme repaints.
 * @param {string} themeName - The targeted theme identifier ('light', 'dark').
 */
export const applyTheme = (themeName) => {

    document.documentElement.setAttribute('data-theme', themeName);

    const prefs = storage.loadPreferences();
    prefs.theme = themeName;
    storage.savePreferences(prefs);
};

/**
 * Mutates the root HTML element's data attribute to trigger global CSS typography swaps.
 * @param {string} fontName - The targeted font identifier (e.g., 'sans-serif').
 */
export const applyFont = (fontName) => {

    document.documentElement.setAttribute('data-font', fontName);

    const prefs = storage.loadPreferences();
    prefs.font = fontName;
    storage.savePreferences(prefs);
};

/**
 * Binds all interactive event handlers explicitly for the Settings page DOM controls.
 */
export const setupSettingsListeners = () => {

    const prefs = storage.loadPreferences();
    
    const activeThemeRadio = document.querySelector(`input[name="color-theme"][value="${prefs.theme || 'dark'}"]`);
    if (activeThemeRadio) activeThemeRadio.checked = true;

    const activeFontRadio = document.querySelector(`input[name="font-theme"][value="${prefs.font || 'sans-serif'}"]`);
    if (activeFontRadio) activeFontRadio.checked = true;

    const applyThemeBtn = document.getElementById('apply-theme-btn');
    const applyFontBtn = document.getElementById('apply-font-btn');

    applyThemeBtn?.addEventListener('click', () => {
        const selectedTheme = document.querySelector('input[name="color-theme"]:checked')?.value;
        if (selectedTheme) {
            applyTheme(selectedTheme);
            alert('Color theme updated successfully!');
        }
    });

    applyFontBtn?.addEventListener('click', () => {
        const selectedFont = document.querySelector('input[name="font-theme"]:checked')?.value;
        if (selectedFont) {
            applyFont(selectedFont);
            alert('Font theme updated successfully!');
        }
    });

    const layout = document.getElementById('settings-layout');
    const backBtn = document.getElementById('settings-back-btn');
    const titleEl = document.getElementById('settings-pane-title');
    
    document.querySelectorAll('.settings-menu-item[data-pane]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.settings-menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const targetPane = item.dataset.pane;
            document.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'));
            const pane = document.getElementById('pane-' + targetPane);
            if (pane) pane.classList.add('active');
            
            if (titleEl) titleEl.textContent = item.querySelector('span')?.textContent || 'Settings';
            
            if (window.innerWidth < 1024 && layout && backBtn) {
                layout.classList.add('viewing-detail');
                backBtn.style.display = 'flex';
            }
        });
    });

    if (backBtn && layout) {
        backBtn.addEventListener('click', () => {
            layout.classList.remove('viewing-detail');
            backBtn.style.display = 'none';
        });
    }

    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = btn.previousElementSibling;
            const img = btn.querySelector('img');
            
            if (input && input.type === 'password') {
                input.type = 'text';
                if (img) { img.src = './assets/images/icon-hide-password.svg'; img.alt = 'Hide Password'; }
            } else if (input) {
                input.type = 'password';
                if (img) { img.src = './assets/images/icon-show-password.svg'; img.alt = 'Show Password'; }
            }
        });
    });

    const logoutBtn = document.getElementById('logout-menu-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', auth.logout);
    }

    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const oldPass = document.getElementById('old-password').value;
            const newPass = document.getElementById('new-password').value;
            const confirmPass = document.getElementById('confirm-password');
            
            if (newPass !== confirmPass.value) {
                confirmPass.setCustomValidity('Passwords do not match');
                confirmPass.reportValidity();
                return;
            }
            
            confirmPass.setCustomValidity(''); 
            
            try {
                const currentUserEmail = auth.checkAuth();
                if (currentUserEmail) {
                    auth.changePassword(currentUserEmail, oldPass, newPass);
                    alert('Password successfully updated!');
                    passwordForm.reset(); 
                }
            } catch (err) {
                alert(err.message);
            }
        });

        document.getElementById('confirm-password')?.addEventListener('input', (e) => {
            e.target.setCustomValidity('');
        });
    }
};