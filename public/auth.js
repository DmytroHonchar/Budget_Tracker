document.addEventListener('DOMContentLoaded', () => {
    console.log("auth.js loaded");

    // Relative API URL (browser automatically uses the same host and port)
    const apiUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:8080'
        : 'https://gopocket.co.uk';

    // Function to make a fetch request with credentials included (for cookies)
    async function fetchWithAuth(url, options = {}) {
        options.credentials = 'include'; // Ensure cookies are included
        let response = await fetch(url, options);
        if (response.status === 401 || response.status === 403) {
            // Redirect to login if unauthorized
            window.location.href = '/login';
        }
        return response;
    }

    // Show Password Toggle
    const showPasswordCheckbox = document.getElementById('show-password');
    if (showPasswordCheckbox) {
        showPasswordCheckbox.addEventListener('change', function () {
            const passwordField = document.getElementById('password');
            if (this.checked) {
                passwordField.type = 'text';
            } else {
                passwordField.type = 'password';
            }
        });
    }

    // Password validation rules
    const passwordSchema = {
        minLength: 8,
        hasUpperCase: /[A-Z]/,
        hasLowerCase: /[a-z]/,
        hasDigit: /\d/,
        noSpaces: /^\S*$/,
    };

    // Function to check password strength
    function checkPasswordStrength(password) {
        const checks = {
            minLength: password.length >= passwordSchema.minLength,
            hasUpperCase: passwordSchema.hasUpperCase.test(password),
            hasLowerCase: passwordSchema.hasLowerCase.test(password),
            hasDigit: passwordSchema.hasDigit.test(password),
            noSpaces: passwordSchema.noSpaces.test(password),
        };

        let feedback = '';
        let isValid = true;

        if (!checks.minLength) {
            feedback += 'Must be at least 8 characters long.<br>';
            isValid = false;
        }
        if (!checks.hasUpperCase) {
            feedback += 'Must contain at least one uppercase letter.<br>';
            isValid = false;
        }
        if (!checks.hasLowerCase) {
            feedback += 'Must contain at least one lowercase letter.<br>';
            isValid = false;
        }
        if (!checks.hasDigit) {
            feedback += 'Must contain at least one digit.<br>';
            isValid = false;
        }
        if (!checks.noSpaces) {
            feedback += 'Must not contain spaces.<br>';
            isValid = false;
        }

        return { isValid, feedback };
    }

    // Password input validation listener
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const passwordFeedback = document.getElementById('passwordFeedback');

if (passwordInput && passwordFeedback && submitBtn) {
    passwordInput.addEventListener('input', (event) => {
        const password = event.target.value;
        const { isValid, feedback } = checkPasswordStrength(password);

        if (isValid) {
            passwordFeedback.innerHTML = 'Password looks good!';
            passwordFeedback.classList.add('valid');
            passwordFeedback.classList.add('show');
            submitBtn.disabled = false;
        } else {
            passwordFeedback.innerHTML = feedback;  // Use innerHTML to display feedback with <br> tags
            passwordFeedback.classList.remove('valid');
            passwordFeedback.classList.add('show');
            submitBtn.disabled = true;
        }
    });
}

    // Function to show messages
    function showMessage(message, isError = false, messageId = 'message') {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) {
            console.error(`Element with id '${messageId}' not found.`);
            return;
        }

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

    // Register Form Submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetchWithAuth(`${apiUrl}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                if (response.ok) {
                    showMessage('Registration successful!', false, 'registerMessage');
                    setTimeout(() => {
                        window.location.href = '/income';  // Redirect after successful registration
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

    // Login Form Submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetchWithAuth(`${apiUrl}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (response.ok) {
                    console.log('Login successful');
                    window.location.href = '/income'; // Redirect to income.html after login
                } else {
                    const errorText = await response.text();
                    if (response.status === 401) {
                        showMessage('Please check your email and password.', true, 'loginMessage');
                    } else {
                        showMessage(`Login failed: ${errorText}`, true, 'loginMessage');
                    }
                }
            } catch (error) {
                showMessage(`An error occurred: ${error.message}`, true, 'loginMessage');
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
                const response = await fetchWithAuth(`${apiUrl}/request-reset`, {
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
                const response = await fetchWithAuth(`${apiUrl}/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword }),
                });

                if (response.ok) {
                    showMessage('Password has been reset successfully', false, 'resetPasswordMessage');
                    setTimeout(() => {
                        window.location.href = '/login';
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
                const response = await fetchWithAuth(`${apiUrl}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
