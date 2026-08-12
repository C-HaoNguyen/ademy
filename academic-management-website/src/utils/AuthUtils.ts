import { jwtDecode } from "jwt-decode";
import { STORAGE_KEYS } from "@/config/constants";

interface JwtPayload {
    sub: string;
    role?: string;
    roles?: string[];
    authorities?: string[];
    exp?: number;
}

export function isLoggedIn() {
    const token = getAccessToken();
    if (!token) return false;

    return !isTokenExpired();
}

export function getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getUsername() {
    const token = getAccessToken();
    if (!token) return null;

    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.sub;
}

export function extractRole(): string | null {
    const token = getAccessToken();
    if (!token) return null;

    const decoded = jwtDecode<JwtPayload>(token);

    if (decoded.role) return decoded.role;

    if (decoded.roles?.length) {
        return decoded.roles[0].toUpperCase().replace("ROLE_", "");
    }

    if (decoded.authorities?.length) {
        return decoded.authorities[0].toUpperCase().replace("ROLE_", "");
    }

    return null;
}

export function isTokenExpired() {
    const token = getAccessToken();
    if (!token) return true;

    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return false;

    return decoded.exp * 1000 < Date.now();
}

export function logout() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
    window.location.href = "/login";
}
