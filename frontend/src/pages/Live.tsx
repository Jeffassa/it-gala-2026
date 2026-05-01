import { Crown, Gem, GraduationCap, Heart, Radio, Rocket, Smartphone, Smile, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Countdown } from "@/components/Countdown";
import { liveApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { LiveResults } from "@/lib/types";

const CAT_ICON: Record<string, any> = {
  "graduation-cap": GraduationCap, "heart": Heart, "smile": Smile,
  "rocket": Rocket, "smartphone": Smartphone, "gem": Gem, "trophy": Trophy,
};

export default function LivePage() {
  const [data, setData] = useState<LiveResults | null>(null);
  const [tick, setTick] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchLoop() {
      try {
        const r = await liveApi.results();
        if (mounted) setData(r);
      } catch {/* ignore */}
      if (mounted) timerRef.current = window.setTimeout(fetchLoop, 3000);
    }
    fetchLoop();
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => {
      mounted = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(t);
    };
  }, []);

  if (!data || !data.gala) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-ink-muted">
        Chargement des résultats…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(123, 2, 2, 0.45), transparent 60%), radial-gradient(ellipse at bottom right, rgba(240, 165, 12, 0.18), transparent 60%), #050203",
      }}
    >
      <div className="absolute inset-0 glow-grid opacity-50" />

      <header className="relative max-w-[1800px] mx-auto px-10 py-8 flex items-center justify-between flex-wrap gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-accent mb-2 inline-flex items-center gap-2">
            <Radio size={14} className="animate-pulse" /> Grand écran · Direct
          </p>
          <h1 className="font-serif text-5xl xl:text-6xl font-black">
            <span className="primary-text">{data.gala.name}</span> {data.gala.edition_year}
          </h1>
          <p className="font-serif italic text-2xl text-ink-muted mt-2">« {data.gala.theme} »</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">Le compte à rebours</p>
          <Countdown target={data.gala.event_date} compact />
          <p className="text-xs text-ink-muted mt-3">{formatDate(data.gala.event_date)} · {data.gala.location}</p>
          <p className="text-[11px] text-ink-faint mt-1 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor] animate-pulse" />
            Données mises à jour il y a {tick % 3} s
          </p>
        </div>
      </header>

      <main className="relative max-w-[1800px] mx-auto px-10 pb-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.categories.map((c) => {
          const leader = c.nominees[0];
          const Icon = c.category_icon ? (CAT_ICON[c.category_icon] ?? Trophy) : Trophy;
          return (
            <section key={c.category_id} className="bg-black/60 backdrop-blur border border-line rounded-3xl p-7 shadow-elev">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <span className="icon-tile icon-tile-primary w-12 h-12">
                    <Icon size={22} />
                  </span>
                  <h2 className="font-serif text-2xl font-bold">{c.category_name}</h2>
                </div>
                <span className="badge badge-accent">{c.total_votes} votes</span>
              </div>

              {leader && c.total_votes > 0 && (
                <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-accent/15 via-accent/5 to-transparent border border-accent-soft/40">
                  <p className="text-[11px] uppercase tracking-widest text-accent mb-1.5 inline-flex items-center gap-1.5">
                    <Crown size={12} /> En tête
                  </p>
                  <p className="font-serif text-2xl font-bold">{leader.name}</p>
                  <p className="text-sm text-ink-muted">{leader.school_promotion ?? ""}</p>
                  <p className="font-mono text-3xl accent-text font-black mt-2">{Math.round(leader.share * 100)}%</p>
                </div>
              )}

              <ul className="space-y-2.5">
                {c.nominees.slice(0, 5).map((n, i) => (
                  <li key={n.id} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-faint w-5">{i + 1}.</span>
                    <span className="flex-1 truncate text-sm">{n.name}</span>
                    <div className="w-32 h-2 bg-bg-elev3 rounded-full overflow-hidden">
                      <div className="h-full bg-accent-gradient transition-all duration-700" style={{ width: `${(n.share || 0) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs text-ink-muted tabular-nums w-8 text-right">{n.votes}</span>
                  </li>
                ))}
                {c.nominees.length === 0 && (
                  <li className="text-sm text-ink-muted text-center py-4">Aucun nominé enregistré</li>
                )}
              </ul>
            </section>
          );
        })}
      </main>

      <footer className="relative max-w-[1800px] mx-auto px-10 pb-8 flex justify-between text-xs text-ink-faint flex-wrap gap-3">
        <span className="inline-flex items-center gap-2">
          <Radio size={12} /> IT Gala — Mise à jour automatique toutes les 3 secondes
        </span>
        <span>Powered by IT Gala Platform</span>
      </footer>
    </div>
  );
}
