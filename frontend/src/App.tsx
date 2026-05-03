import { Navigate, Route, Routes } from "react-router-dom";

import { ToastStack } from "@/components/Toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import ResetPasswordPage from "@/pages/ResetPassword";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminGalas from "@/pages/admin/Galas";
import AdminCategories from "@/pages/admin/Categories";
import AdminNominees from "@/pages/admin/Nominees";
import AdminTickets from "@/pages/admin/Tickets";
import AdminStudents from "@/pages/admin/Students";
import AdminUsers from "@/pages/admin/Users";
import AdminReports from "@/pages/admin/Reports";
import AdminCertificates from "@/pages/admin/Certificates";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminAudit from "@/pages/admin/Audit";
import LivePage from "@/pages/Live";
import CashierPage from "@/pages/cashier/Cashier";
import ControllerPage from "@/pages/controller/Controller";
import ParticipantPage from "@/pages/participant/Participant";
import VoteRoomPage from "@/pages/participant/VoteRoom";
import { useAuthStore } from "@/store/auth";

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
      <ToastStack />
    </>
  );
}
