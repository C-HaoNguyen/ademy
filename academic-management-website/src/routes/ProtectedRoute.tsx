import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { extractRole, isLoggedIn } from "@/utils/AuthUtils";

type ProtectedRouteProps = {
    children: ReactNode;
    allowedRoles?: string[];
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const location = useLocation();

    if (!isLoggedIn()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles?.length) {
        const currentRole = extractRole()?.toUpperCase();
        const isAllowed = currentRole && allowedRoles.includes(currentRole);

        if (!isAllowed) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
