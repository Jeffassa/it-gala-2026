import { ArrowRight, Calendar, Drama, MapPin, Shirt, Sparkles, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AppHeader } from "@/components/AppHeader";
import { Countdown } from "@/components/Countdown";
import { categoryApi, galaApi, voteApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Category, Gala } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

export default function ParticipantPage() {
  const user = useAuthStore((s) => s.user);
  const [gala, setGala] = useState<Gala | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [myVotes, setMyVotes] = useState<number>(0);

  useEffect(() => { galaApi.active().then(setGala); }, []);
  useEffect(() => {
    if (!gala) return;
    categoryApi.list(gala.id).then(setCats);
  }, [gala]);
  useEffect(() => { voteApi.mine().then((v) => setMyVotes(v.length)); }, []);

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader subtitle="Mon espace de vote" />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        <section className="relative overflow-hidden rounded-3xl border border-primary-soft/40 p-10 bg-gradient-to-br from-primary/30 via-primary-deep/40 to-bg-elev">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/20 blur-3xl rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/30 blur-3xl rounded-full" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3 font-semibold inline-flex items-center gap-2">
              <Sparkles size={14} /> Bonsoir, {user?.full_name?.split(" ")[0]}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-balance">
              Bienvenue dans votre <em className="not-italic accent-text">espace de vote</em>
            </h1>
            <p className="text-ink-muted text-lg max-w-2xl mb-6">
              Découvrez les nominés et faites entendre votre voix dans chaque catégorie. Un seul vote par catégorie.
            </p>
            <div className="flex gap-3 flex-wrap items-center">
              <Link to="/me/vote" className="btn btn-accent btn-lg">
                <Vote size={18} /> Salle de vote
                <ArrowRight size={16} />
              </Link>
              {gala && (
                <span className="badge badge-accent">{myVotes} / {cats.length} catégories votées</span>
              )}
            </div>
          </div>
        </section>

        {gala && (
          <section className="bg-bg-elev border border-line rounded-3xl p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-5 text-center inline-flex items-center gap-2 mx-auto justify-center w-full">
              <Calendar size={14} /> Le compte à rebours
            </p>
            <Countdown target={gala.event_date} />
          </section>
        )}

        {gala && (
          <section>
            <h2 className="font-serif text-2xl font-bold mb-4">Le gala en bref</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info Icon={Calendar} label="Date" value={formatDate(gala.event_date)} />
              <Info Icon={MapPin} label="Lieu" value={gala.location} />
              <Info Icon={Drama} label="Thème" value={`« ${gala.theme} »`} />
              <Info Icon={Shirt} label="Tenue" value={gala.dress_code ?? "Tenue de soirée"} />
            </div>
            {gala.program && (
              <div className="mt-4 bg-bg-elev border border-line rounded-2xl p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-3 font-semibold">Programme de la soirée</p>
                <p className="whitespace-pre-line text-ink-muted leading-relaxed">{gala.program}</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function Info({ Icon, label, value }: { Icon: any; label: string; value: string }) {
  return (
    <div className="bg-bg-elev border border-line rounded-2xl p-5 flex items-center gap-4">
      <span className="icon-tile icon-tile-accent w-12 h-12 shrink-0">
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-ink-muted mb-1">{label}</p>
        <p className="font-serif text-lg font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
