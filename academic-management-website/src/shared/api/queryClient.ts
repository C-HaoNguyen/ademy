import { QueryClient } from "@tanstack/react-query";

// retry: 1 thay vì mặc định 3 — apiClient tự logout() khi request có token bị 401,
// retry mặc định sẽ gọi lại apiClient nhiều lần thừa sau khi đã logout trước khi báo lỗi.
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
        },
    },
});
