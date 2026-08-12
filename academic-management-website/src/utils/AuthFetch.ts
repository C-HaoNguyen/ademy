import { getAccessToken, isTokenExpired, logout } from "./AuthUtils";

export async function authFetch(
    url: string,
    options: RequestInit = {}
) {
    // token hết hạn → logout luôn
    if (isTokenExpired()) {
        logout();
        throw new Error("Access token expired");
    }

    const token = getAccessToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    // backend trả 401 → token không hợp lệ
    if (response.status === 401) {
        logout();
        throw new Error("Unauthorized");
    }

    return response;
}
