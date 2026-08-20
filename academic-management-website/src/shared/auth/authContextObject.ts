import { createContext } from "react";

export type LoginData = {
    accessToken: string;
    refreshToken: string;
    role: string;
    username: string;
};

export type AuthState = {
    isLoggedIn: boolean;
    role: string | null;
    username: string | null;
};

export type AuthContextValue = AuthState & {
    login: (data: LoginData) => void;
    logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
