// Simple hash-based router
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.params = {};

        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    // Register a route
    on(path, handler) {
        this.routes[path] = handler;
        return this;
    }

    // Navigate to a path
    navigate(path) {
        window.location.hash = path;
    }

    // Get current path
    getPath() {
        return window.location.hash.slice(1) || '/';
    }

    // Parse route parameters
    parseParams(routePath, actualPath) {
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');
        const params = {};

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                const paramName = routeParts[i].slice(1);
                params[paramName] = actualParts[i];
            }
        }

        return params;
    }

    // Check if route matches
    matchRoute(routePath, actualPath) {
        const routeParts = routePath.split('/');
        const actualParts = actualPath.split('/');

        if (routeParts.length !== actualParts.length) {
            return false;
        }

        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                continue; // Parameter, always matches
            }
            if (routeParts[i] !== actualParts[i]) {
                return false;
            }
        }

        return true;
    }

    // Handle route change
    handleRoute() {
        const path = this.getPath();

        // Find matching route
        for (const routePath in this.routes) {
            if (this.matchRoute(routePath, path)) {
                this.currentRoute = routePath;
                this.params = this.parseParams(routePath, path);
                this.routes[routePath](this.params);
                return;
            }
        }

        // Default route
        if (this.routes['/']) {
            this.routes['/']({});
        }
    }

    // Get current params
    getParams() {
        return this.params;
    }
}

export const router = new Router();
export default router;
