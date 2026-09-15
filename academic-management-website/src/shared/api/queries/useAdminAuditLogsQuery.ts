import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/constants";
import { apiClient } from "@/shared/api/client";

export type AdminAuditLog = {
    id: number;
    actorUserId: number | null;
    actorUsername: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    success: boolean;
    metadata: string | null;
    createdAt: string;
};

export type AdminAuditLogFilters = {
    actorUsername?: string;
    action?: string;
    // ISO LocalDateTime string ("yyyy-MM-ddTHH:mm:ss") — khớp @DateTimeFormat(iso = DATE_TIME) ở
    // AdminAuditLogController, không phải "startDate"/"endDate".
    from?: string;
    to?: string;
};

export const adminAuditLogsQueryKey = (filters: AdminAuditLogFilters) =>
    ["admin", "audit-logs", filters] as const;

export function useAdminAuditLogsQuery(filters: AdminAuditLogFilters) {
    return useQuery({
        queryKey: adminAuditLogsQueryKey(filters),
        queryFn: async (): Promise<AdminAuditLog[]> => {
            const params = new URLSearchParams();
            if (filters.actorUsername) params.set("actorUsername", filters.actorUsername);
            if (filters.action) params.set("action", filters.action);
            if (filters.from) params.set("from", filters.from);
            if (filters.to) params.set("to", filters.to);

            const query = params.toString();
            const res = await apiClient(`${API_ENDPOINTS.AUDIT_LOGS.SEARCH}${query ? `?${query}` : ""}`);

            if (!res.ok) {
                throw new Error(`Failed to load audit logs (${res.status})`);
            }

            return res.json();
        },
    });
}
