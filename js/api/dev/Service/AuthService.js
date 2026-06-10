import { authApi } from "../Endpoints/authApi.js";
import { userApi } from "../Endpoints/userApi.js";

export class AuthService {
    constructor(api = authApi, users = userApi) {
        this.api = api;
        this.users = users;
        this.currentUser = null;
    }

    async login(requestBody) {
        const response = await this.api.login(requestBody);

        const user = response.user ?? null;

        this.currentUser = user;

        notifyAuthChanged({
            isAuthenticated: true,
            user
        });

        return {
            user,
            response
        };
    }

    async loginWithGoogleAccessToken(accessToken) {
        const response = await this.api.google(accessToken);

        const user = response.user ?? null;

        this.currentUser = user;

        notifyAuthChanged({
            isAuthenticated: true,
            user
        });

        return {
            user,
            response
        };
    }

    async startGoogleLogin() {
        const response = await this.api.getGoogleUrl();
        const url = response?.url;

        if (!url || typeof url !== "string") {
            throw new Error("Google login URL missing from response.");
        }

        window.location.href = url;
    }

    async logout() {
        try {
            if (typeof this.api.logout === "function") {
                await this.api.logout();
            }
        } finally {
            this.currentUser = null;

            notifyAuthChanged({
                isAuthenticated: false,
                user: null
            });
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async refreshCurrentUser() {
        if (typeof this.api.me !== "function") {
            return this.currentUser;
        }

        try {
            const response = await this.api.me();
            const user = response.user ?? null;

            this.currentUser = user;

            notifyAuthChanged({
                isAuthenticated: user !== null,
                user
            });

            return user;
        } catch {
            this.currentUser = null;

            notifyAuthChanged({
                isAuthenticated: false,
                user: null
            });

            return null;
        }
    }

    async registerAndLogin(requestBody) {
        validateRegisterRequest(requestBody);

        await this.users.create({
            firstName: requestBody.firstName.trim(),
            lastName: requestBody.lastName.trim(),
            email: requestBody.email.trim(),
            password: requestBody.password
        });

        return await this.login({
            email: requestBody.email,
            password: requestBody.password
        });
    }
}

export const authService = new AuthService();

function notifyAuthChanged(detail) {
    window.dispatchEvent(new CustomEvent("authChanged", { detail }));
}

function validateRegisterRequest(requestBody) {
    if (!requestBody || typeof requestBody !== "object") {
        throw new Error("Register request must be an object.");
    }

    assertRequiredString(requestBody.firstName, "firstName");
    assertRequiredString(requestBody.lastName, "lastName");
    assertRequiredString(requestBody.email, "email");
    assertRequiredString(requestBody.password, "password");
}

function assertRequiredString(value, propertyName) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`Auth request property '${propertyName}' must be a non-empty string.`);
    }
}