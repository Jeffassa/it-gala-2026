import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { roleLabel } from "@/lib/format";
import { useAuthStore } from "@/store/auth";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg-elev/85 border-b border-line">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Logo subtitle={subtitle} />
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold leading-tight">{user.full_name}</p>
              <p className="text-xs text-ink-muted">{roleLabel(user.role)}</p>
            </div>
            <Avatar name={user.full_name} />
            <button
              onClick={() => {
                logout();
                nav("/");
              }}
              className="w-10 h-10 grid place-items-center rounded-lg border border-line text-ink-muted hover:border-red-500/40 hover:text-red-400 transition"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
