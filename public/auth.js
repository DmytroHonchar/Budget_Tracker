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

                const messageDiv = document.getElementById('message');

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    messageDiv.textContent = 'Registration successful!';
                    messageDiv.className = 'success';
                    messageDiv.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = 'income.html'; // Redirect to income.html after 2 seconds
                    }, 2000);
                } else {
                    const errorText = await response.text();
                    messageDiv.textContent = `${errorText}`;
                    messageDiv.className = 'error';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = `An error occurred: ${error.message}`;
                messageDiv.className = 'error';
                messageDiv.style.display = 'block';
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

                const messageDiv = document.getElementById('message');

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    console.log('Login successful');
                    window.location.href = 'income.html'; // Redirect to income.html after login
                } else {
                    const errorText = await response.text();
                    if (response.status === 401) {
                        messageDiv.textContent = 'Invalid credentials. Please check your email and password.';
                    } else {
                        messageDiv.textContent = `Login failed: ${errorText}`;
                    }
                    messageDiv.className = 'error';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = `An error occurred: ${error.message}`;
                messageDiv.className = 'error';
                messageDiv.style.display = 'block';
            }
        });
    }

    // Request Password Reset Form Submission
    const requestResetForm = document.getElementById('requestResetForm');
    if (requestResetForm) {
        requestResetForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;

            try {
                const response = await fetch('http://localhost:3000/request-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const messageDiv = document.getElementById('message');

                if (response.ok) {
                    messageDiv.textContent = 'Password reset email sent';
                    messageDiv.className = 'success';
                    messageDiv.style.display = 'block';
                } else {
                    const errorText = await response.text();
                    messageDiv.textContent = `Password reset request failed: ${errorText}`;
                    messageDiv.className = 'error';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = `An error occurred during password reset request: ${error.message}`;
                messageDiv.className = 'error';
                messageDiv.style.display = 'block';
            }
        });
    }

    // Reset Password Form Submission
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');

            try {
                const response = await fetch('http://localhost:3000/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword }),
                });

                const messageDiv = document.getElementById('message');

                if (response.ok) {
                    messageDiv.textContent = 'Password has been reset successfully';
                    messageDiv.className = 'success';
                    messageDiv.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    const errorText = await response.text();
                    messageDiv.textContent = `Password reset failed: ${errorText}`;
                    messageDiv.className = 'error';
                    messageDiv.style.display = 'block';
                }
            } catch (error) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = `An error occurred during password reset: ${error.message}`;
                messageDiv.className = 'error';
                messageDiv.style.display = 'block';
            }
        });
    }
});
