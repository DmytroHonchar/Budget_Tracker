document.addEventListener('DOMContentLoaded', () => {
    // Toggle password visibility
    const showPasswordCheckbox = document.getElementById('show-password');
    if (showPasswordCheckbox) {
        showPasswordCheckbox.addEventListener('change', () => {
            const passwordInput = document.getElementById('password');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
            } else {
                passwordInput.type = 'password';
            }
        });
    }

    // Register Form Submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://127.0.0.1:3000/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    console.log('Registration successful');
                    registerForm.reset();
                } else {
                    console.log('Registration failed');
                }
            } catch (error) {
                console.error('Error:', error);
                console.log('An error occurred during registration');
            }
        });
    }

    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://127.0.0.1:3000/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    console.log('Login successful');
                    window.location.href = 'income.html'; // Redirect to income.html after login
                } else {
                    console.log('Login failed');
                }
            } catch (error) {
                console.error('Error:', error);
                console.log('An error occurred during login');
            }
        });
    }
});
