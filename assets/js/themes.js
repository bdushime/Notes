import * as storage from './storage.js';
import * as auth from './auth.js';

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

    // E. Layout Switcher for Master-Detail (Mobile/Tablet)
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

    // Back button returns to menu on mobile
    if (backBtn && layout) {
        backBtn.addEventListener('click', () => {
            layout.classList.remove('viewing-detail');
            backBtn.style.display = 'none';
        });
    }

    // F. Setup password show/hide toggles
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

    // G. Logout Menu Button
    const logoutBtn = document.getElementById('logout-menu-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', auth.logout);
    }

    // H. Password Form Validation & Submission
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
            
            confirmPass.setCustomValidity(''); // Clear error
            
            try {
                const currentUserEmail = auth.checkAuth();
                if (currentUserEmail) {
                    auth.changePassword(currentUserEmail, oldPass, newPass);
                    alert('Password successfully updated!');
                    passwordForm.reset(); // clear fields naturally
                }
            } catch (err) {
                alert(err.message);
            }
        });

        // Clear mismatch validation when user edits the confirm field
        document.getElementById('confirm-password')?.addEventListener('input', (e) => {
            e.target.setCustomValidity('');
        });
    }
};