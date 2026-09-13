import { API_URL } from "@/config/constants";
import { getAccessToken, isTokenExpired, logout } from "@/utils/AuthUtils";

export async function apiClient(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getAccessToken();

    // token đã hết hạn hoặc không parse được (bị sửa/hỏng) → logout luôn, không gửi request
    if (token) {
        let expired: boolean;
        try {
            expired = isTokenExpired();
        } catch {
            expired = true;
        }

        if (expired) {
            logout();
            throw new Error("Access token expired");
        }
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    // chỉ auto-logout khi request có token nhưng bị server từ chối
    // (không phải khi gọi ẩn danh và endpoint yêu cầu quyền cao hơn)
    if (token && response.status === 401) {
        logout();
        throw new Error("Unauthorized");
    }

    return response;
}

// Đọc message lỗi an toàn bất kể backend trả JSON (`ErrorResponse` từ GlobalExceptionHandler) hay
// String thô (một số service, ví dụ UserService.createUser()/inviteTeacher(), trả thẳng
// `ResponseEntity.badRequest().body("...")` — Spring serialize thành text/plain, không phải JSON).
// Dùng thay cho việc đoán `res.json()`/`res.text()` ở từng call site.
export async function readErrorMessage(res: Response, fallback: string): Promise<string> {
    const text = await res.text().catch(() => "");
    if (!text) return fallback;

    try {
        const data = JSON.parse(text);
        return typeof data?.message === "string" && data.message ? data.message : text;
    } catch {
        return text;
    }
}
