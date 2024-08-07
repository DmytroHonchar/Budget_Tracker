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

    // Function to show messages
      function showMessage(message, isError = false, messageId = 'message') {
        const messageDiv = document.getElementById(messageId);
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        if (isError) {
            messageDiv.classList.add('error');
            messageDiv.classList.remove('success');
        } else {
            messageDiv.classList.add('success');
            messageDiv.classList.remove('error');
        }
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000); // Hide after 5 seconds
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
                    const errorText = await response.text();
                    if (response.status === 401) {
                        showMessage('Invalid credentials. Please check your email and password.', true, 'loginMessage');
                    } else {
                        showMessage(`Login failed: ${errorText}`, true, 'loginMessage');
                    }
                }
            } catch (error) {
                showMessage(`An error occurred: ${error.message}`, true, 'loginMessage');
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
                    const data = await response.json();
                    localStorage.setItem('token', data.token);
                    showMessage('Registration successful!', false, 'registerMessage');
                    setTimeout(() => {
                        window.location.href = 'income.html'; // Redirect to income.html after 2 seconds
                    }, 2000);
                } else {
                    const errorText = await response.text();
                    showMessage(`${errorText}`, true, 'registerMessage');
                }
            } catch (error) {
                showMessage(`An error occurred: ${error.message}`, true, 'registerMessage');
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

                if (response.ok) {
                    showMessage('Password reset email sent', false, 'requestResetMessage');
                } else {
                    const errorText = await response.text();
                    showMessage(`Password reset request failed: ${errorText}`, true, 'requestResetMessage');
                }
            } catch (error) {
                showMessage(`An error occurred during password reset request: ${error.message}`, true, 'requestResetMessage');
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

                if (response.ok) {
                    showMessage('Password has been reset successfully', false, 'resetPasswordMessage');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    const errorText = await response.text();
                    showMessage(`Password reset failed: ${errorText}`, true, 'resetPasswordMessage');
                }
            } catch (error) {
                showMessage(`An error occurred during password reset: ${error.message}`, true, 'resetPasswordMessage');
            }
        });
    }

    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            try {
                const response = await fetch('http://localhost:3000/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, message })
                });

                if (response.ok) {
                    showMessage('Message sent successfully', false, 'contactMessage');
                    contactForm.reset();
                } else {
                    showMessage('Failed to send message', true, 'contactMessage');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('An error occurred while sending the message', true, 'contactMessage');
            }
        });
    }
});
