import {
  ArrowLeft, ArrowRight, Award, Check, Gem, GraduationCap, Heart, Rocket,
  ShieldAlert, Smartphone, Smile, Sparkles, Trophy, User, Vote,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppHeader } from "@/components/AppHeader";
import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { apiError, categoryApi, galaApi, nomineeApi, voteApi } from "@/lib/api";
import type { Category, Gala, MyVote, Nominee } from "@/lib/types";
import { toast } from "@/store/toast";

const ICON_MAP: Record<string, any> = {
  "graduation-cap": GraduationCap, "heart": Heart, "smile": Smile,
  "rocket": Rocket, "smartphone": Smartphone, "gem": Gem, "trophy": Trophy,
};

function CategoryIconCmp({ name, size = 28 }: { name?: string | null; size?: number }) {
  const Cmp = name ? (ICON_MAP[name] ?? Trophy) : Trophy;
  return <Cmp size={size} strokeWidth={1.6} />;
}

export default function VoteRoomPage() {
  const [gala, setGala] = useState<Gala | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [active, setActive] = useState<Category | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [myVotes, setMyVotes] = useState<MyVote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { galaApi.active().then(setGala); }, []);
  useEffect(() => {
    if (!gala) return;
    Promise.all([categoryApi.list(gala.id), voteApi.mine()])
      .then(([c, v]) => { setCats(c); setMyVotes(v); setLoading(false); });
  }, [gala]);

  async function loadNominees(c: Category) {
    setActive(c);
    setNominees([]);
    const list = await nomineeApi.list(c.id);
    setNominees(list);
  }

  async function castVote(n: Nominee) {
    try {
      await voteApi.cast(n.id);
      toast.success(`Vote enregistré pour ${n.name}`);
      const [v, list] = await Promise.all([voteApi.mine(), nomineeApi.list(n.category_id)]);
      setMyVotes(v); setNominees(list);
    } catch (err) { toast.error(apiError(err)); }
  }

  const myVoteByCat = useMemo(() => {
    const m = new Map<number, number>();
    myVotes.forEach((v) => m.set(v.category_id, v.nominee_id));
    return m;
  }, [myVotes]);

  if (loading) return (
    <div className="min-h-screen bg-bg">
      <AppHeader subtitle="Salle de vote" />
      <div className="grid place-items-center py-32"><Spinner size={32} /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader subtitle="Salle de vote" />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-4xl font-bold">Salle de vote</h1>
            <p className="text-ink-muted mt-1">{gala ? `${gala.name} · ${gala.edition_year}` : ""}</p>
          </div>
          <Link to="/me" className="btn btn-ghost">
            <ArrowLeft size={16} /> Retour
          </Link>
        </div>

        {gala && !gala.voting_open && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm flex items-center gap-3">
            <ShieldAlert size={18} className="shrink-0" />
            <span>Les votes sont actuellement fermés. Vous pouvez consulter les nominés mais pas voter.</span>
          </div>
        )}

        {!active ? (
          cats.length === 0 ? (
            <Empty Icon={Trophy} title="Aucune catégorie pour le moment" hint="Les catégories seront publiées bientôt." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cats.map((c) => {
                const voted = myVoteByCat.has(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => loadNominees(c)}
                    className="text-left p-7 bg-gradient-to-br from-bg-elev to-bg-elev2 border border-line rounded-2xl hover:border-accent transition hover:-translate-y-1 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <span className="icon-tile icon-tile-primary w-14 h-14 group-hover:scale-110 transition">
                        <CategoryIconCmp name={c.icon} size={26} />
                      </span>
                      {voted ? (
                        <span className="badge badge-success"><Check size={12} /> Voté</span>
                      ) : (
                        <span className="badge badge-accent">À voter</span>
                      )}
                    </div>
                    <h3 className="font-serif text-2xl font-bold mb-2">{c.name}</h3>
                    {c.description && <p className="text-sm text-ink-muted mb-4 line-clamp-3">{c.description}</p>}
                    <p className="text-xs text-accent flex items-center gap-1.5 font-semibold">
                      {c.nominees_count} nominé(s) · {c.total_votes} votes
                      <ArrowRight size={12} className="ml-auto opacity-0 group-hover:opacity-100 transition" />
                    </p>
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <CategoryVoteView
            category={active}
            nominees={nominees}
            myNomineeId={myVoteByCat.get(active.id) ?? null}
            votingOpen={gala?.voting_open ?? true}
            onBack={() => setActive(null)}
            onVote={castVote}
          />
        )}
      </main>
    </div>
  );
}

function CategoryVoteView({
  category, nominees, myNomineeId, votingOpen, onBack, onVote,
}: {
  category: Category;
  nominees: Nominee[];
  myNomineeId: number | null;
  votingOpen: boolean;
  onBack: () => void;
  onVote: (n: Nominee) => void;
}) {
  const [detail, setDetail] = useState<Nominee | null>(null);
  const totalVotes = nominees.reduce((s, n) => s + n.votes_count, 0) || 1;
  const sorted = [...nominees].sort((a, b) => b.votes_count - a.votes_count);

  return (
    <div className="space-y-6">
      <div>
        <button onClick={onBack} className="text-sm text-ink-muted hover:text-accent transition mb-3 inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Toutes les catégories
        </button>
        <div className="flex items-center gap-4">
          <span className="icon-tile icon-tile-primary w-16 h-16">
            <CategoryIconCmp name={category.icon} size={28} />
          </span>
          <div>
            <h2 className="font-serif text-3xl font-bold">{category.name}</h2>
            {category.description && <p className="text-ink-muted mt-1 max-w-2xl">{category.description}</p>}
          </div>
        </div>
      </div>

      {nominees.length === 0 ? (
        <Empty Icon={Sparkles} title="Pas encore de nominés" hint="Les candidatures arrivent bientôt." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {sorted.map((n) => {
            const voted = myNomineeId === n.id;
            const pct = (n.votes_count / totalVotes) * 100;
            return (
              <div
                key={n.id}
                className={`bg-bg-elev border rounded-2xl overflow-hidden transition hover:-translate-y-1 ${
                  voted ? "border-accent shadow-glow" : "border-line hover:border-accent/60"
                }`}
              >
                <button
                  onClick={() => setDetail(n)}
                  className="block w-full aspect-square bg-gradient-to-br from-bg-elev2 to-bg-elev3 grid place-items-center text-ink-muted overflow-hidden"
                >
                  {n.photo_url
                    ? <img src={n.photo_url} alt={n.name} className="w-full h-full object-cover hover:scale-105 transition" />
                    : <User size={56} strokeWidth={1.4} className="text-accent/40" />}
                </button>
                <div className="p-4">
                  <button onClick={() => setDetail(n)} className="block w-full text-left">
                    <p className="font-semibold mb-0.5 truncate hover:text-accent transition">{n.name}</p>
                    <p className="text-xs text-ink-muted mb-3 truncate">{n.school_promotion ?? "—"}</p>
                  </button>
                  <div className="h-1.5 bg-bg-elev3 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full bg-accent-gradient transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-ink-muted mb-3">{n.votes_count} vote(s)</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setDetail(n)} className="btn btn-secondary btn-sm flex-1">Profil</button>
                    <button
                      onClick={() => onVote(n)}
                      disabled={!votingOpen}
                      className={`btn btn-sm flex-1 ${voted ? "btn-success" : "btn-primary"}`}
                    >
                      {voted ? <><Check size={14} /> Voté</> : "Voter"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NomineeDetailModal
        nominee={detail}
        onClose={() => setDetail(null)}
        votingOpen={votingOpen}
        isMyVote={detail ? myNomineeId === detail.id : false}
        onVote={(n) => { setDetail(null); onVote(n); }}
      />
    </div>
  );
}

function NomineeDetailModal({
  nominee, onClose, votingOpen, isMyVote, onVote,
}: {
  nominee: Nominee | null;
  onClose: () => void;
  votingOpen: boolean;
  isMyVote: boolean;
  onVote: (n: Nominee) => void;
}) {
  if (!nominee) return null;
  return (
    <Modal open={!!nominee} onClose={onClose} size="lg">
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <div className="aspect-square w-full bg-gradient-to-br from-bg-elev2 to-bg-elev3 rounded-2xl grid place-items-center overflow-hidden">
          {nominee.photo_url
            ? <img src={nominee.photo_url} alt={nominee.name} className="w-full h-full object-cover" />
            : <User size={64} className="text-accent/40" strokeWidth={1.4} />}
        </div>
        <div>
          <h3 className="font-serif text-3xl font-bold">{nominee.name}</h3>
          {nominee.school_promotion && <p className="text-ink-muted mt-1">{nominee.school_promotion}</p>}
          {nominee.description && <p className="font-serif italic text-accent mt-3">« {nominee.description} »</p>}
          <span className="badge badge-accent mt-4">{nominee.votes_count} vote(s)</span>
        </div>
      </div>

      {nominee.biography && (
        <section className="mt-6">
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-2 font-semibold">Biographie</p>
          <p className="text-ink leading-relaxed whitespace-pre-line">{nominee.biography}</p>
        </section>
      )}

      {nominee.achievements && (
        <section className="mt-6">
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-2 font-semibold flex items-center gap-2">
            <Award size={14} /> Réalisations
          </p>
          <p className="text-ink leading-relaxed whitespace-pre-line">{nominee.achievements}</p>
        </section>
      )}

      <div className="flex justify-end gap-2 pt-5 mt-6 border-t border-line">
        <button onClick={onClose} className="btn btn-secondary">Fermer</button>
        <button
          onClick={() => onVote(nominee)}
          disabled={!votingOpen}
          className={`btn ${isMyVote ? "btn-success" : "btn-primary"}`}
        >
          {isMyVote ? <><Check size={16} /> Mon vote</> : <><Vote size={16} /> Voter pour ce nominé</>}
        </button>
      </div>
    </Modal>
  );
}
