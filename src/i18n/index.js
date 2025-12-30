// Internationalization (i18n) service
import en from './en.js';
import ro from './ro.js';

const translations = { en, ro };

class I18n {
    constructor() {
        this.currentLocale = localStorage.getItem('locale') || 'en';
        this.listeners = new Set();
    }

    get locale() {
        return this.currentLocale;
    }

    set locale(value) {
        if (translations[value]) {
            this.currentLocale = value;
            localStorage.setItem('locale', value);
            this.notifyListeners();
        }
    }

    // Get translation by key path (e.g., 'nav.dashboard')
    t(keyPath, params = {}) {
        return this.get(keyPath, this.currentLocale, params);
    }

    // Get translation for specific locale
    get(keyPath, locale, params = {}) {
        const keys = keyPath.split('.');
        let result = translations[locale];

        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                // Fallback to English if not found in requested locale
                if (locale !== 'en') {
                    return this.get(keyPath, 'en', params);
                }
                return keyPath; // Return key if not found
            }
        }

        // Replace params like {min}, {max} etc.
        if (typeof result === 'string' && Object.keys(params).length > 0) {
            for (const [key, value] of Object.entries(params)) {
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            }
        }

        return result;
    }

    // Get combined string "Primary / Secondary"
    tDual(keyPath, primaryLang, secondaryLang) {
        // If same language, just return one
        if (primaryLang === secondaryLang) {
            return this.get(keyPath, primaryLang);
        }
        return `${this.get(keyPath, primaryLang)} / ${this.get(keyPath, secondaryLang)}`;
    }

    // Get all available locales
    getLocales() {
        return [
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'ro', name: 'Română', flag: '🇷🇴' },
        ];
    }

    // Subscribe to locale changes
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners() {
        this.listeners.forEach(callback => callback(this.currentLocale));
    }
}

// Singleton instance
export const i18n = new I18n();

// Shorthand for translations
export const t = (keyPath, params) => i18n.t(keyPath, params);
export const tDual = (keyPath, primary, secondary) => i18n.tDual(keyPath, primary, secondary);

export default i18n;
