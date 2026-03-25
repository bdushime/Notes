// --- User "Database" Keys ---
const USERS_KEY = 'notes_app_users';
const SESSION_KEY = 'notes_app_logged_in_user';

// --- Core Auth Functions ---

/**
 * Register a new user
 */
export const registerUser = (email, password) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        throw new Error('User already exists with this email.');
    }

    users.push({ email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Login a user
 */
export const loginUser = (email, password) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    // Store the email in sessionStorage to keep them logged in for this tab
    sessionStorage.setItem(SESSION_KEY, email);
    return user;
};

/**
 * Change Password
 */
export const changePassword = (email, oldPassword, newPassword) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex(u => u.email === email && u.password === oldPassword);

    if (userIndex === -1) {
        throw new Error('Incorrect old password.');
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Logout
 */
export const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = './auth/login.html';
};

/**
 * Guard: Check if user is logged in (used on index.html)
 */
export const checkAuth = () => {
    const user = sessionStorage.getItem(SESSION_KEY);
    if (!user) {
        window.location.href = './auth/login.html';
    }
    return user;
};