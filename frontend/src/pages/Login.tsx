import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ArrowRight, Lock, LogIn, Mail, User } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { apiError, authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [promo, setPromo] = useState("");
  const setSession = useAuthStore((s) => s.setSession);
  const nav = useNavigate();
  const [params] = useSearchParams();

  function redirectByRole(role: string) {
    const next = params.get("next");
    if (next) return nav(next, { replace: true });
    if (role === "super_admin") return nav("/admin", { replace: true });
    if (role === "cashier") return nav("/cashier", { replace: true });
    if (role === "controller") return nav("/controller", { replace: true });
    return nav("/me", { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await authApi.login(email, password);
        setSession(res.access_token, res.user);
        toast.success(`Bienvenue, ${res.user.full_name}`);
        redirectByRole(res.user.role);
      } else {
        await authApi.register(fullName, email, password, promo || undefined);
        toast.success("Compte créé. Connectez-vous pour accéder à votre espace.");
        setMode("login");
        setPassword("");
        setFullName("");
        setPromo("");
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
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

          <h1 className="font-serif text-4xl font-bold mb-3">
            {mode === "login" ? (
              <>
                Mon espace<br />
                <em className="not-italic primary-text">de vote</em>
              </>
            ) : (
              <>
                Créer un<br />
                <em className="not-italic primary-text">compte voteur</em>
              </>
            )}
          </h1>
          <p className="text-ink-muted mb-8">
            {mode === "login"
              ? "Connectez-vous pour voter pour vos favoris."
              : "Rejoignez la communauté et votez pour les nominés du IT Gala 2026."}
          </p>

          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-bg-elev border border-line rounded-xl mb-7">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === "login" ? "bg-primary-gradient text-white shadow-primary" : "text-ink-muted hover:text-ink"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === "register" ? "bg-primary-gradient text-white shadow-primary" : "text-ink-muted hover:text-ink"
              }`}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <Field label="Nom complet" Icon={User}>
                  <input className="input pl-11" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aïcha Koné" />
                </Field>
                <Field label="Promotion / École" Icon={User}>
                  <input className="input pl-11" value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="L3 GLSI 2026" />
                </Field>
              </>
            )}
            <Field label="Adresse email" Icon={Mail}>
              <input
                className="input pl-11"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Mot de passe" Icon={Lock}>
              <input
                className="input pl-11"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </Field>

            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? (
                <Spinner size={18} />
              ) : (
                <>
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-sm text-ink-muted text-center">
            <Link to="/" className="hover:text-accent transition inline-flex items-center gap-1">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, Icon, children }: { label: string; Icon: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
          <Icon size={18} strokeWidth={1.8} />
        </span>
        {children}
      </div>
    </div>
  );
}
