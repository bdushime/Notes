import * as auth from './auth.js';

const signupForm = document.querySelector('.auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
    }

    try {
        auth.registerUser(email, password);
        alert('Account created! Please login.');
        window.location.href = 'login.html';
    } catch (error) {
        alert(error.message);
    }
});