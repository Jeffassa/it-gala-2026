import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { Modal } from "./Modal";
import { roleLabel } from "@/lib/format";
import { useAuthStore } from "@/store/auth";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { user, logout } = useAuthStore();
  const nav = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    setShowConfirm(false);
    logout();
    nav("/");
  };
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
              onClick={() => setShowConfirm(true)}
              className="w-10 h-10 grid place-items-center rounded-lg border border-line text-ink-muted hover:border-red-500/40 hover:text-red-400 transition"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut size={16} />
            </button>

            <Modal
              open={showConfirm}
              onClose={() => setShowConfirm(false)}
              title="Confirmer la déconnexion"
            >
              <div className="space-y-6">
                <p className="text-ink-muted">
                  Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre espace.
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={() => setShowConfirm(false)} className="btn btn-secondary">
                    Annuler
                  </button>
                  <button onClick={handleLogout} className="btn btn-danger">
                    Se déconnecter
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        )}
      </div>
    </header>
  );
}
