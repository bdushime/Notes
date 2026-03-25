/**
 * @fileoverview Simulates a user database using Web Storage.
 * Handles user registration, login, session management, and password updates.
 */

const USERS_KEY = 'notes_app_users';
const SESSION_KEY = 'notes_app_logged_in_user';

/**
 * Registers a new user into the local database if the email is available.
 */
export const registerUser = (email, password) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    if (users.find(u => u.email === email)) {
        throw new Error('User already exists with this email.');
    }

    users.push({ email, password });
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * Validates user credentials and initiates a browser session.
 */
export const loginUser = (email, password) => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        throw new Error('Invalid email or password.');
    }

    sessionStorage.setItem(SESSION_KEY, email);
    return user;
};

/**
 * Verifies the old password and updates it with the new password.
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
 * Destroys the active user session and returns to login.
 */
export const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = './auth/login.html';
};

/**
 * Enforces authentication state, redirecting unauthorized users.
 */
export const checkAuth = () => {
    const user = sessionStorage.getItem(SESSION_KEY);
    if (!user) {
        window.location.href = './auth/login.html';
    }
    return user;
};