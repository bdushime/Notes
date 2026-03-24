import * as auth from './auth.js';

const loginForm = document.querySelector('.auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    try {
        auth.loginUser(emailInput.value.trim(), passwordInput.value);
        window.location.href = '../index.html'; // Go to app
    } catch (error) {
        alert(error.message);
    }
});