import { useState } from "react";
import { Link } from "react-router-dom";

import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/Spinner";
import { apiError, authApi } from "@/lib/api";
import { toast } from "@/store/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      toast.success("Si un compte existe, un email de réinitialisation a été envoyé.");
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
            "radial-gradient(ellipse at top, rgba(123, 2, 2, 0.45), transparent 60%), radial-gradient(ellipse at bottom right, rgba(245, 157, 152, 0.18), transparent 60%), linear-gradient(135deg, #1A1010 0%, #0E0808 100%)",
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
            Mot de passe<br />
            <em className="not-italic primary-text">oublié ?</em>
          </h1>

          {!sent ? (
            <>
              <p className="text-ink-muted mb-8">
                Entrez l'adresse email de votre compte et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="label">Adresse email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
                      <Mail size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      className="input pl-11"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@email.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                  {loading ? (
                    <Spinner size={18} />
                  ) : (
                    <>
                      Envoyer le lien
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="bg-bg-elev border border-line rounded-2xl p-7 text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent/15 grid place-items-center">
                <Mail size={24} className="text-accent" />
              </div>
              <h2 className="font-serif text-xl font-bold mb-3">Vérifiez votre boîte mail</h2>
              <p className="text-ink-muted text-sm leading-relaxed mb-5">
                Si un compte existe avec l'adresse <strong className="text-ink">{email}</strong>, vous recevrez un email avec un lien de réinitialisation valable 30 minutes.
              </p>
              <p className="text-ink-faint text-xs">
                Pensez à vérifier vos spams si vous ne voyez rien.
              </p>
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
