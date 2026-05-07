import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { Spinner } from "@/components/Spinner";
import { ToastStack } from "@/components/Toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuthStore } from "@/store/auth";

// Pages publiques chargees immediatement (visiteur arrive sur la home en general)
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";

// Pages chargees a la demande (route accedee uniquement par certains roles)
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPassword"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPassword"));
const LivePage = lazy(() => import("@/pages/Live"));
const CashierPage = lazy(() => import("@/pages/cashier/Cashier"));
const ControllerPage = lazy(() => import("@/pages/controller/Controller"));
const ParticipantPage = lazy(() => import("@/pages/participant/Participant"));
const VoteRoomPage = lazy(() => import("@/pages/participant/VoteRoom"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminGalas = lazy(() => import("@/pages/admin/Galas"));
const AdminCategories = lazy(() => import("@/pages/admin/Categories"));
const AdminNominees = lazy(() => import("@/pages/admin/Nominees"));
const AdminTickets = lazy(() => import("@/pages/admin/Tickets"));
const AdminStudents = lazy(() => import("@/pages/admin/Students"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminReports = lazy(() => import("@/pages/admin/Reports"));
const AdminCertificates = lazy(() => import("@/pages/admin/Certificates"));
const AdminNotifications = lazy(() => import("@/pages/admin/Notifications"));
const AdminAudit = lazy(() => import("@/pages/admin/Audit"));
const AdminSouvenirs = lazy(() => import("@/pages/admin/Souvenirs"));

function PageLoader() {
  return (
    <div className="min-h-screen grid place-items-center bg-bg">
      <Spinner size={32} />
    </div>
  );
}

function HomeOrApp() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <HomePage />;
  switch (user.role) {
    case "super_admin": return <Navigate to="/admin" replace />;
    case "cashier": return <Navigate to="/cashier" replace />;
    case "controller": return <Navigate to="/controller" replace />;
    case "participant": return <Navigate to="/me" replace />;
  }
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeOrApp />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute roles={["super_admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="galas" element={<AdminGalas />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="nominees" element={<AdminNominees />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="certificates" element={<AdminCertificates />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="souvenirs" element={<AdminSouvenirs />} />
            </Route>
          </Route>

          <Route path="/live" element={<LivePage />} />

          <Route element={<ProtectedRoute roles={["super_admin", "cashier"]} />}>
            <Route path="/cashier" element={<CashierPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["super_admin", "controller"]} />}>
            <Route path="/controller" element={<ControllerPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={["super_admin", "cashier", "controller", "participant"]} />}>
            <Route path="/me" element={<ParticipantPage />} />
            <Route path="/me/vote" element={<VoteRoomPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastStack />
    </>
  );
}
