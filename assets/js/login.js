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

document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = btn.previousElementSibling;
        const img = btn.querySelector('img');
        
        if (input && input.type === 'password') {
            input.type = 'text';
            if (img) { img.src = '../assets/images/icon-hide-password.svg'; img.alt = 'Hide Password'; }
        } else if (input) {
            input.type = 'password';
            if (img) { img.src = '../assets/images/icon-show-password.svg'; img.alt = 'Show Password'; }
        }
    });
});