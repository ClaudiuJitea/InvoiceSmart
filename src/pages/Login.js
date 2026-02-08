// Login Page Component
import { t, i18n } from '../i18n/index.js';
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
                    <h1 class="auth-brand-title">${t('login.brandTitle')}</h1>
                    <p class="auth-brand-subtitle">${t('login.brandSubtitle')}</p>
                    
                    <div class="auth-features">
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.invoice}</div>
                            <div class="auth-feature-text">
                                <strong>${t('login.feature1Title')}</strong>
                                <span>${t('login.feature1Desc')}</span>
                            </div>
                        </div>
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.clients}</div>
                            <div class="auth-feature-text">
                                <strong>${t('login.feature2Title')}</strong>
                                <span>${t('login.feature2Desc')}</span>
                            </div>
                        </div>
                        <div class="auth-feature">
                            <div class="auth-feature-icon">${icons.chart}</div>
                            <div class="auth-feature-text">
                                <strong>${t('login.feature3Title')}</strong>
                                <span>${t('login.feature3Desc')}</span>
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
                <div class="auth-language-switch" style="position: absolute; top: 20px; right: 20px; display: flex; gap: 8px;">
                     <button class="lang-btn" data-lang="en" style="background: none; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; opacity: ${i18n.locale === 'en' ? '1' : '0.5'}; font-weight: ${i18n.locale === 'en' ? 'bold' : 'normal'}">🇬🇧 EN</button>
                    <button class="lang-btn" data-lang="ro" style="background: none; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; opacity: ${i18n.locale === 'ro' ? '1' : '0.5'}; font-weight: ${i18n.locale === 'ro' ? 'bold' : 'normal'}">🇷🇴 RO</button>
                </div>

                <div class="auth-form-wrapper">
                    <div class="auth-form-header">
                        <h2 class="auth-form-title">${t('login.welcome')}</h2>
                        <p class="auth-form-subtitle">${t('login.subtitle')}</p>
                    </div>

                    <form id="loginForm" class="auth-form">
                        <div class="auth-alert auth-alert-error" id="loginError" style="display: none;">
                            <span class="auth-alert-icon">${icons.close}</span>
                            <span class="auth-alert-message" id="loginErrorMessage"></span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="username">${t('login.usernameLabel')}</label>
                            <div class="input-with-icon">
                                <span class="input-icon">${icons.user}</span>
                                <input 
                                    type="text" 
                                    id="username" 
                                    name="username" 
                                    class="input input-icon-left" 
                                    placeholder="${t('login.usernamePlaceholder')}"
                                    autocomplete="username"
                                    required
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="password">${t('login.passwordLabel')}</label>
                            <div class="input-with-icon">
                                <span class="input-icon">${icons.lock}</span>
                                <input 
                                    type="password" 
                                    id="password" 
                                    name="password" 
                                    class="input input-icon-left" 
                                    placeholder="${t('login.passwordPlaceholder')}"
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
                                <span>${t('login.rememberMe')}</span>
                            </label>
                        </div>

                        <button type="submit" class="btn btn-primary" id="loginBtn">
                            <span class="btn-text">${t('login.signIn')}</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner"></span>
                                ${t('login.signingIn')}
                            </span>
                        </button>
                    </form>

    <div class="auth-form-footer" style="display: flex; justify-content: center; gap: 8px;">
                        <p class="auth-footer-text">
                            ${t('login.noAccount')} 
                            <a href="#/register" class="auth-link">${t('login.createAccount')}</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function initLogin() {
    const form = document.getElementById('loginForm');

    // Language switcher logic
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const lang = e.target.closest('.lang-btn').dataset.lang;
            if (lang && lang !== i18n.locale) {
                i18n.locale = lang;
                renderLogin(); // Re-render the login page with new language
                initLogin();   // Re-initialize listeners

                // Force app refresh to update other components if needed
                window.dispatchEvent(new CustomEvent('app:refresh'));
            }
        });
    });

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
