import {
  FileText, GraduationCap, LayoutDashboard, LogOut, Mail, Menu, MonitorPlay,
  ScrollText, Sparkles, Ticket, TrendingUp, Trophy, Users as UsersIcon, X, Drama,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { roleLabel } from "@/lib/format";
import { useAuthStore } from "@/store/auth";

const NAV = [
  { to: "/admin", label: "Tableau de bord", Icon: LayoutDashboard, end: true },
  { to: "/admin/galas", label: "Galas", Icon: Drama },
  { to: "/admin/categories", label: "Catégories", Icon: Trophy },
  { to: "/admin/nominees", label: "Nominés", Icon: Sparkles },
  { to: "/admin/tickets", label: "Tickets", Icon: Ticket },
  { to: "/admin/students", label: "Étudiants ESATIC", Icon: GraduationCap },
  { to: "/admin/users", label: "Utilisateurs", Icon: UsersIcon },
  { to: "/admin/reports", label: "Rapports", Icon: TrendingUp },
  { to: "/admin/certificates", label: "Certificats", Icon: FileText },
  { to: "/admin/notifications", label: "Notifications", Icon: Mail },
  { to: "/admin/audit", label: "Journal des scans", Icon: ScrollText },
  { to: "/live", label: "Grand écran", Icon: MonitorPlay },
];

const TITLES: Record<string, string> = {
  "/admin": "Tableau de bord",
  "/admin/galas": "Galas",
  "/admin/categories": "Catégories",
  "/admin/nominees": "Nominés",
  "/admin/tickets": "Tickets",
  "/admin/students": "Étudiants ESATIC",
  "/admin/users": "Utilisateurs",
  "/admin/reports": "Rapports",
  "/admin/certificates": "Certificats",
  "/admin/notifications": "Notifications",
  "/admin/audit": "Journal des scans",
};

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    nav("/");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={`bg-bg-elev border-r border-line lg:sticky lg:top-0 lg:h-screen lg:flex flex-col ${
          open ? "fixed inset-0 z-50 flex" : "hidden lg:flex"
        }`}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
          <Logo subtitle="Administration" />
          <button onClick={() => setOpen(false)} className="lg:hidden text-ink-muted hover:text-ink" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-1">
          <p className="px-3.5 pt-2 pb-2 text-[11px] uppercase tracking-widest text-ink-faint font-semibold">Gestion</p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <item.Icon size={18} strokeWidth={1.8} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-4 pt-3 border-t border-line shrink-0">
          <div className="flex items-center gap-3 p-2.5 bg-bg border border-line rounded-xl">
            {user && <Avatar name={user.full_name} />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.full_name}</p>
              <p className="text-xs text-ink-muted">{user ? roleLabel(user.role) : ""}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Déconnexion"
              className="w-9 h-9 grid place-items-center rounded-lg border border-line hover:border-red-500/40 hover:text-red-400 transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg-elev/85 border-b border-line">
          <div className="flex items-center justify-between px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="lg:hidden w-9 h-9 grid place-items-center rounded-lg border border-line"
                aria-label="Ouvrir le menu"
              >
                <Menu size={18} />
              </button>
              <h1 className="font-semibold text-base">{TITLES[loc.pathname] ?? "Admin"}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-ink-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]" />
                Système opérationnel
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm"
                title="Déconnexion"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
