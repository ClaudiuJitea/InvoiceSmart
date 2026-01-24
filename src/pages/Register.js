// Register Page Component
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { authService } from '../db/services/authService.js';
import { router } from '../router.js';

export function renderRegister() {
    return `
    <div class="auth-page">
        <div class="auth-container">
            <!-- Left side - Branding -->
            <div class="auth-branding">
                <div class="auth-branding-content">
                    <div class="auth-brand-logo">
                        ${icons.logo}
                        <span class="auth-brand-name">InvoiceSmart</span>
                    </div>
                    <h1 class="auth-brand-title">Start your journey today</h1>
                    <p class="auth-brand-subtitle">Join thousands of businesses managing their invoices professionally. Get started in just a few minutes.</p>
                    
                    <div class="auth-features">
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.check}</div>
                            <div class="auth-feature-text">
                                <strong>Free to Use</strong>
                                <span>No credit card required</span>
                            </div>
                        </div>
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.check}</div>
                            <div class="auth-feature-text">
                                <strong>Secure & Private</strong>
                                <span>Your data stays with you</span>
                            </div>
                        </div>
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.check}</div>
                            <div class="auth-feature-text">
                                <strong>Easy Setup</strong>
                                <span>Get started in minutes</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="auth-branding-decoration">
                    <div class="auth-blur-shape auth-blur-1"></div>
                    <div class="auth-blur-shape auth-blur-2"></div>
                    <div class="auth-blur-shape auth-blur-3"></div>
                </div>
            </div>

            <!-- Right side - Register Form -->
            <div class="auth-form-container">
                <div class="auth-form-wrapper">
                    <div class="auth-form-header">
                        <h2 class="auth-form-title">Create your account</h2>
                        <p class="auth-form-subtitle">Fill in your details to get started</p>
                    </div>

                    <form id="registerForm" class="auth-form">
                        <div class="auth-alert auth-alert-error" id="registerError" style="display: none;">
                            <span class="auth-alert-icon">${icons.close}</span>
                            <span class="auth-alert-message" id="registerErrorMessage"></span>
                        </div>

                        <div class="auth-alert auth-alert-success" id="registerSuccess" style="display: none;">
                            <span class="auth-alert-icon">${icons.check}</span>
                            <span class="auth-alert-message">Account created successfully!</span>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label" for="username">Username</label>
                                <div class="input-with-icon">
                                    <span class="input-icon">${icons.user}</span>
                                    <input 
                                        type="text" 
                                        id="username" 
                                        name="username" 
                                        class="input input-icon-left" 
                                        placeholder="Choose a username"
                                        autocomplete="username"
                                        required
                                    >
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="fullName">Full Name</label>
                                <div class="input-with-icon">
                                    <span class="input-icon">${icons.user}</span>
                                    <input 
                                        type="text" 
                                        id="fullName" 
                                        name="fullName" 
                                        class="input input-icon-left" 
                                        placeholder="Your full name"
                                        autocomplete="name"
                                    >
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="email">Email</label>
                            <div class="input-with-icon">
                                <span class="input-icon">${icons.globe}</span>
                                <input 
                                    type="email" 
                                    id="email" 
                                    name="email" 
                                    class="input input-icon-left" 
                                    placeholder="your@email.com"
                                    autocomplete="email"
                                    required
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="password">Password</label>
                            <div class="input-with-icon">
                                <span class="input-icon">${icons.lock}</span>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="input input-icon-left" 
                                    placeholder="At least 6 characters"
                                    autocomplete="new-password"
                                    minlength="6"
                                    required
                                >
                                <button type="button" class="password-toggle" id="passwordToggle">
                                    ${icons.eye}
                                </button>
                            </div>
                            <span class="form-hint">Password must be at least 6 characters</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="confirmPassword">Confirm Password</label>
                            <div class="input-with-icon">
                                <span class="input-icon">${icons.lock}</span>
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    name="confirmPassword" 
                                    class="input input-icon-left" 
                                    placeholder="Confirm your password"
                                    autocomplete="new-password"
                                    required
                                >
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary" id="registerBtn">
                            <span class="btn-text">Create Account</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span>
                                Creating account...
                            </span>
                        </button>
                    </form>

                    <div class="auth-form-footer">
                        <p class="auth-footer-text">
                            Already have an account? 
                            <a href="#/login" class="auth-link">Sign in</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function initRegister() {
    const form = document.getElementById('registerForm');
    const errorDiv = document.getElementById('registerError');
    const errorMessage = document.getElementById('registerErrorMessage');
    const successDiv = document.getElementById('registerSuccess');
    const registerBtn = document.getElementById('registerBtn');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');

    if (!form) return;

    // Password visibility toggle
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            document.getElementById('confirmPassword').type = type;
            passwordToggle.classList.toggle('active', type === 'text');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const fullName = document.getElementById('fullName').value.trim();

        // Validation
        if (!username || !email || !password) {
            showError('Please fill in all required fields');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        // Show loading state
        setLoading(true);
        hideError();

        try {
            await authService.register(username, email, password, fullName);

            // Show success
            successDiv.style.display = 'flex';

            // Redirect after short delay
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('auth:login'));
                router.navigate('/');
            }, 1000);
        } catch (error) {
            showError(error.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    function showError(message) {
        successDiv.style.display = 'none';
        errorMessage.textContent = message;
        errorDiv.style.display = 'flex';
        errorDiv.classList.add('shake');
        setTimeout(() => errorDiv.classList.remove('shake'), 500);
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    function setLoading(loading) {
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoading = registerBtn.querySelector('.btn-loading');

        registerBtn.disabled = loading;
        btnText.style.display = loading ? 'none' : 'inline';
        btnLoading.style.display = loading ? 'inline-flex' : 'none';
    }
}
