import { AppConfig } from "../../../config/appConfig.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getApiTarget(target) {
    const t = AppConfig.api.targets[target];

    if (!t || !t.baseUrl) {
        throw new Error("Api targets missing or unknown!");
    }

    return t;
}

export async function apiRequest(target, path, options = {}) {
    const targetConfig = getApiTarget(target);
    const url = `${targetConfig.baseUrl}${path}`;

    const method = (options.method ?? "GET").toUpperCase();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers ?? {})
    };

    if (shouldAttachCsrfToken(method)) {
        const csrfToken = readCookie(AppConfig.auth.csrfCookieName);

        if (csrfToken) {
            headers[AppConfig.auth.csrfHeaderName] = csrfToken;
        }
    }

    const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        credentials: AppConfig.api.credentials
    });

    const data = await readResponse(response);

    if (!response.ok) {
        console.error("API request failed:", {
            url,
            status: response.status,
            data
        });

        throw new Error(`API request failed. Response: ${response.status}`);
    }

    return data;
}

function shouldAttachCsrfToken(method) {
    return AppConfig.auth?.scheme === "cookie"
        && UNSAFE_METHODS.has(method)
        && typeof AppConfig.auth.csrfCookieName === "string"
        && typeof AppConfig.auth.csrfHeaderName === "string";
}

function readCookie(cookieName) {
    const cookies = document.cookie
        .split(";")
        .map(cookie => cookie.trim());

    const cookie = cookies.find(cookie =>
        cookie.startsWith(`${cookieName}=`)
    );

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.substring(cookieName.length + 1));
}

async function readResponse(response) {
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
        return await response.json();
    }

    return await response.text();
}