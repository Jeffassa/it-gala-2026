import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ArrowLeft, ArrowRight, Check, Lock, ShieldAlert } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { apiError, authApi } from "@/lib/api";
import { toast } from "@/store/toast";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const nav = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      toast.success("Mot de passe modifié avec succès !");
    } catch (err) {
      const msg = apiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/15 grid place-items-center">
            <ShieldAlert size={28} className="text-red-400" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-3">Lien invalide</h1>
          <p className="text-ink-muted mb-6">
            Ce lien de réinitialisation est invalide. Veuillez refaire une demande depuis la page de connexion.
          </p>
          <Link to="/forgot-password" className="btn btn-primary">
            Demander un nouveau lien <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual */}
      <div
        className="relative hidden lg:flex items-center justify-center p-16 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(123, 2, 2, 0.45), transparent 60%), radial-gradient(ellipse at bottom right, rgba(240, 165, 12, 0.18), transparent 60%), linear-gradient(135deg, #1A1010 0%, #0E0808 100%)",
        }}
      >
        <div className="absolute inset-0 glow-grid" />
        <div className="relative max-w-md text-center">
          <p className="font-serif italic text-3xl leading-snug mb-8 text-balance">
            La nuit où la <span className="primary-text">tech ivoirienne</span> se met en lumière.
          </p>
          <p className="text-ink-muted text-sm tracking-wider">— Comité d'organisation, IT Gala 2026</p>
          <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent-soft/50 text-xs text-accent-bright tracking-[0.2em]">
            ÉDITION 2026 · 06 JUIN · ABIDJAN
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Logo />
          </div>

          {!done ? (
            <>
              <h1 className="font-serif text-4xl font-bold mb-3">
                Nouveau<br />
                <em className="not-italic primary-text">mot de passe</em>
              </h1>
              <p className="text-ink-muted mb-8">
                Choisissez un nouveau mot de passe pour votre compte IT Gala.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5 text-sm text-red-300 flex items-start gap-2.5">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                      <Lock size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      className="input pl-11"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Confirmer le mot de passe</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                      <Lock size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      className="input pl-11"
                      type="password"
                      required
                      minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? (
                    <Spinner size={18} />
                  ) : (
                    <>
                      Réinitialiser le mot de passe
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="bg-bg-elev border border-line rounded-2xl p-7 text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-green-500/15 grid place-items-center">
                <Check size={24} className="text-green-400" />
              </div>
              <h2 className="font-serif text-xl font-bold mb-3">Mot de passe modifié !</h2>
              <p className="text-ink-muted text-sm leading-relaxed mb-6">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg w-full">
                Se connecter <ArrowRight size={18} />
              </Link>
            </div>
          )}

          <div className="mt-6 text-sm text-ink-muted text-center">
            <Link to="/login" className="hover:text-accent transition inline-flex items-center gap-1">
              <ArrowLeft size={14} /> Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
