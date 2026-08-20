import { useCallback, useEffect, useState, type ReactNode } from "react";
import { STORAGE_KEYS } from "@/config/constants";
import {
    extractRole,
    getUsername,
    isLoggedIn as checkIsLoggedIn,
    logout as authLogout,
} from "@/utils/AuthUtils";
import { AuthContext, type AuthState, type LoginData } from "./authContextObject";

function readAuthState(): AuthState {
    return {
        isLoggedIn: checkIsLoggedIn(),
        role: extractRole(),
        username: getUsername(),
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>(readAuthState);

    useEffect(() => {
        const handleStorage = () => setState(readAuthState());
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const login = useCallback((data: LoginData) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, data.role);
        localStorage.setItem(STORAGE_KEYS.USERNAME, data.username);
        setState(readAuthState());
    }, []);

    const logout = useCallback(() => {
        authLogout();
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
