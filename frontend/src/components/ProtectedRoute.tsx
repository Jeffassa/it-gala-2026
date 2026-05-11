import { Navigate, Outlet, useLocation } from "react-router-dom";

import type { Role } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { user, token, hasRole } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  if (!hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
