// Login Page Component
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { authService } from '../db/services/authService.js';
import { router } from '../router.js';

export function renderLogin() {
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
                    <h1 class="auth-brand-title">Manage your invoices with ease</h1>
                    <p class="auth-brand-subtitle">Professional invoice management for modern businesses. Create, track, and organize all your invoices in one place.</p>
                    
                    <div class="auth-features">
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.invoice}</div>
                            <div class="auth-feature-text">
                                <strong>Create Beautiful Invoices</strong>
                                <span>Professional templates ready to use</span>
                            </div>
                        </div>
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.clients}</div>
                            <div class="auth-feature-text">
                                <strong>Manage Clients</strong>
                                <span>Keep track of all your clients</span>
                            </div>
                        </div>
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.chart}</div>
                            <div class="auth-feature-text">
                                <strong>Detailed Reports</strong>
                                <span>Insights into your business</span>
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

            <!-- Right side - Login Form -->
            <div class="auth-form-container">
                <div class="auth-form-wrapper">
                    <div class="auth-form-header">
                        <h2 class="auth-form-title">Welcome back</h2>
                        <p class="auth-form-subtitle">Sign in to continue to your dashboard</p>
                    </div>

                    <form id="loginForm" class="auth-form">
                        <div class="auth-alert auth-alert-error" id="loginError" style="display: none;">
                            <span class="auth-alert-icon">${icons.close}</span>
                            <span class="auth-alert-message" id="loginErrorMessage"></span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="username">Username or Email</label>
                            <div class="input-with-icon">
                                <span class="input-icon">${icons.user}</span>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    class="input input-icon-left" 
                                    placeholder="Enter your username or email"
                                    autocomplete="username"
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
                                    placeholder="Enter your password"
                                    autocomplete="current-password"
                                    required
                                >
                                <button type="button" class="password-toggle" id="passwordToggle">
                                    ${icons.eye}
                                </button>
                            </div>
                        </div>

                        <div class="form-group form-row-inline">
                            <label class="checkbox-label">
                                <input type="checkbox" id="rememberMe" name="rememberMe">
                                <span class="checkbox-custom"></span>
                                <span>Remember me</span>
                            </label>
                        </div>

                        <button type="submit" class="btn btn-primary" id="loginBtn">
                            <span class="btn-text">Sign In</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span>
                                Signing in...
                            </span>
                        </button>
                    </form>

                    <div class="auth-form-footer">
                        <p class="auth-footer-text">
                            Don't have an account? 
                            <a href="#/register" class="auth-link">Create account</a>
                        </p>
                    </div>

                    <div class="auth-demo-credentials">
                        <p>Demo Login</p>
                        <code>Username: admin | Password: admin123</code>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function initLogin() {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');
    const errorMessage = document.getElementById('loginErrorMessage');
    const loginBtn = document.getElementById('loginBtn');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');

    if (!form) return;

    // Password visibility toggle
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            passwordToggle.classList.toggle('active', type === 'text');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showError('Please enter username and password');
            return;
        }

        // Show loading state
        setLoading(true);
        hideError();

        try {
            await authService.login(username, password);

            // Redirect to dashboard
            window.dispatchEvent(new CustomEvent('auth:login'));
            router.navigate('/');
        } catch (error) {
            showError(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorDiv.style.display = 'flex';
        errorDiv.classList.add('shake');
        setTimeout(() => errorDiv.classList.remove('shake'), 500);
    }

    function hideError() {
        errorDiv.style.display = 'none';
    }

    function setLoading(loading) {
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');

        loginBtn.disabled = loading;
        btnText.style.display = loading ? 'none' : 'inline';
        btnLoading.style.display = loading ? 'inline-flex' : 'none';
    }
}
