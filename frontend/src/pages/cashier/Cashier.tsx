import { useEffect, useMemo, useState } from "react";

import { Check, Edit3, GraduationCap, Heart, Mail, Search, Ticket as TicketIcon, User as UserIcon, Users, Wallet, X } from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { TicketQR } from "@/components/TicketQR";
import { apiError, galaApi, studentApi, ticketApi } from "@/lib/api";
import { formatDateTime, formatMoney, ticketTypeLabel } from "@/lib/format";
import type { AttendeeStatus, Gala, Student, Ticket, TicketType } from "@/lib/types";
import { toast } from "@/store/toast";

const PRICE_TABLE: Record<TicketType, number> = {
  solo: 15000,
  duo: 25000,
  gbonhi: 65000,
};

const TICKET_TYPES: { type: TicketType; label: string; Icon: any; desc: string }[] = [
  { type: "solo", label: "Ticket Solo", Icon: TicketIcon, desc: "Une place individuelle" },
  { type: "duo", label: "Ticket Duo", Icon: Heart, desc: "Deux places côte-à-côte" },
  { type: "gbonhi", label: "Ticket Gbonhi", Icon: Users, desc: "Pack groupe d'amis (5 places)" },
];

export default function CashierPage() {
  const [gala, setGala] = useState<Gala | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedType, setSelectedType] = useState<TicketType | null>(null);
  const [issued, setIssued] = useState<Ticket | null>(null);

  useEffect(() => { galaApi.active().then(setGala); }, []);

  async function loadTickets() {
    setLoading(true);
    try { setTickets(await ticketApi.list({ q: q || undefined, gala_id: gala?.id, limit: 50 })); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (gala) loadTickets(); }, [gala]);
  useEffect(() => {
    if (!gala) return;
    const t = setTimeout(loadTickets, 300);
    return () => clearTimeout(t);
  }, [q, gala]);

  const todayStats = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayTickets = tickets.filter((t) => new Date(t.sold_at) >= today);
    return {
      count: todayTickets.length,
      revenue: todayTickets.reduce((s, t) => s + t.price, 0),
    };
  }, [tickets]);

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader subtitle="Caisse — Vente de tickets" />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-bold">Vente de tickets</h1>
          <p className="text-ink-muted mt-1">Sélectionnez un type de ticket pour enregistrer un acheteur.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Aujourd'hui" value={`${todayStats.count}`} hint="tickets vendus" />
          <Stat label="Recettes du jour" value={formatMoney(todayStats.revenue)} accent />
          <Stat label="Récents" value={`${tickets.length}`} hint="50 derniers" />
          <Stat label="Édition" value={gala ? `${gala.edition_year}` : "—"} hint={gala?.name} />
        </div>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Types de tickets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TICKET_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => setSelectedType(t.type)}
                disabled={!gala}
                className="text-left bg-gradient-to-br from-bg-elev to-bg-elev2 border border-line rounded-2xl p-7 transition hover:border-accent hover:-translate-y-1 disabled:opacity-50 disabled:pointer-events-none group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/0 group-hover:bg-accent/15 rounded-full blur-2xl transition" />
                <span className="icon-tile icon-tile-primary w-12 h-12 mb-4 relative">
                  <t.Icon size={22} />
                </span>
                <p className="text-xs uppercase tracking-widest text-accent mb-1.5 font-semibold relative">{t.label}</p>
                <p className="font-serif text-3xl font-bold accent-text mb-1 relative">{formatMoney(PRICE_TABLE[t.type])}</p>
                <p className="text-xs text-ink-muted relative">{t.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
            <h2 className="font-serif text-2xl font-bold">Tickets récents</h2>
            <div className="relative max-w-xs w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                className="input pl-10"
                placeholder="Rechercher un acheteur, email, code…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {loading ? <Spinner /> : tickets.length === 0 ? (
            <Empty Icon={TicketIcon} title="Aucun ticket vendu pour le moment" hint="Sélectionnez un type ci-dessus pour démarrer." />
          ) : (
            <div className="table-wrap overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Acheteur</th>
                    <th>Type</th>
                    <th className="text-right">Prix</th>
                    <th>Vendu</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="font-mono text-xs">{t.code}</td>
                      <td>
                        <div className="font-medium">{t.buyer_full_name}</div>
                        <div className="text-xs text-ink-muted">{t.buyer_email}</div>
                      </td>
                      <td>
                        <span className="badge">{ticketTypeLabel(t.type)}</span>
                        {t.attendee_status === "esoteric" && <span className="badge badge-purple ml-1">Éso.</span>}
                      </td>
                      <td className="text-right tabular-nums">{formatMoney(t.price)}</td>
                      <td className="text-ink-muted">{formatDateTime(t.sold_at)}</td>
                      <td>
                        {t.status === "scanned"
                          ? <span className="badge badge-success">Scanné</span>
                          : <span className="badge badge-info">Vendu</span>}
                      </td>
                      <td className="text-right">
                        <button onClick={() => setIssued(t)} className="btn btn-secondary btn-sm">Voir QR</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <SellModal
        type={selectedType}
        gala={gala}
        onClose={() => setSelectedType(null)}
        onSold={(t) => { setSelectedType(null); setIssued(t); loadTickets(); }}
      />

      <Modal open={!!issued} onClose={() => setIssued(null)}>
        {issued && (
          <>
            <TicketQR ticket={issued} gala={gala} />
            <p className="text-center text-xs text-ink-muted mt-5 inline-flex items-center justify-center gap-1.5 w-full">
              <Mail size={13} /> Une copie a été envoyée à {issued.buyer_email}
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-gradient-to-br from-accent/15 to-bg-elev border-accent-soft/40" : "bg-bg-elev border-line"}`}>
      <p className="text-xs uppercase tracking-wider text-ink-muted mb-2">{label}</p>
      <p className="font-serif text-2xl font-bold leading-none">{value}</p>
      {hint && <p className="text-xs text-ink-muted mt-1.5">{hint}</p>}
    </div>
  );
}

function SellModal({ type, gala, onClose, onSold }: { type: TicketType | null; gala: Gala | null; onClose: () => void; onSold: (t: Ticket) => void }) {
  const [form, setForm] = useState({
    buyer_full_name: "", buyer_email: "", buyer_phone: "",
    partner_full_name: "", group_size: 5,
    attendee_status: "regular" as AttendeeStatus,
  });
  const [saving, setSaving] = useState(false);

  // Etat du picker etudiant
  const [pickedStudent, setPickedStudent] = useState<Student | null>(null);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    if (type) {
      setForm({ buyer_full_name: "", buyer_email: "", buyer_phone: "", partner_full_name: "", group_size: 5, attendee_status: "regular" });
      setPickedStudent(null);
      setStudentQuery("");
      setStudentResults([]);
      setManualMode(false);
    }
  }, [type]);

  // Recherche etudiants debouncee
  useEffect(() => {
    if (manualMode || pickedStudent) return;
    if (!studentQuery.trim()) {
      setStudentResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await studentApi.list({ q: studentQuery.trim(), limit: 12 });
        setStudentResults(res);
      } catch { /* silent */ }
      finally { setSearching(false); }
    }, 250);
    return () => clearTimeout(handle);
  }, [studentQuery, manualMode, pickedStudent]);

  function selectStudent(s: Student) {
    setPickedStudent(s);
    setForm({
      ...form,
      buyer_full_name: s.full_name,
      buyer_email: s.email ?? "",
      buyer_phone: s.phone ?? "",
    });
    setStudentResults([]);
    setStudentQuery("");
  }

  function clearStudent() {
    setPickedStudent(null);
    setForm({ ...form, buyer_full_name: "", buyer_email: "", buyer_phone: "" });
  }

  function switchToManual() {
    setManualMode(true);
    setPickedStudent(null);
    setStudentResults([]);
  }

  function switchToPicker() {
    setManualMode(false);
    setForm({ ...form, buyer_full_name: "", buyer_email: "", buyer_phone: "" });
  }

  if (!type) return null;
  const price = PRICE_TABLE[type];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!gala) return;
    setSaving(true);
    try {
      const ticket = await ticketApi.create({
        gala_id: gala.id,
        type: type as TicketType,
        attendee_status: form.attendee_status,
        price,
        buyer_full_name: form.buyer_full_name,
        buyer_email: form.buyer_email,
        buyer_phone: form.buyer_phone || null,
        partner_full_name: type === "duo" ? form.partner_full_name : null,
        group_size: type === "gbonhi" ? form.group_size : null,
      });
      toast.success("Ticket émis");
      onSold(ticket);
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  }

  const title = `Nouveau ticket ${type === "solo" ? "Solo" : type === "duo" ? "Duo" : "Gbonhi"}`;

  return (
    <Modal open={!!type} onClose={onClose} size="lg" title={title}>
      <form onSubmit={submit} className="space-y-4">

        {/* PICKER ETUDIANT */}
        {!manualMode && !pickedStudent && (
          <div className="bg-bg-elev2 border border-line rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-accent font-semibold inline-flex items-center gap-1.5">
                <GraduationCap size={14} /> Sélectionner un étudiant ESATIC
              </span>
              <button type="button" onClick={switchToManual} className="text-xs text-ink-muted hover:text-accent inline-flex items-center gap-1">
                <Edit3 size={12} /> Saisir manuellement
              </button>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                className="input pl-10"
                placeholder="Rechercher par matricule, nom ou email..."
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                autoFocus
              />
              {searching && <Spinner size={14} />}
            </div>
            {studentResults.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto border border-line rounded-lg divide-y divide-line">
                {studentResults.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className="w-full text-left p-3 hover:bg-bg-elev3 transition flex items-center gap-3"
                  >
                    <span className="icon-tile icon-tile-primary w-9 h-9 shrink-0">
                      <UserIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.full_name}</p>
                      <p className="text-xs text-ink-muted truncate">
                        <span className="font-mono">{s.matricule}</span>
                        {s.promotion ? ` · ${s.promotion}` : ""}
                        {s.email ? ` · ${s.email}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {studentQuery && !searching && studentResults.length === 0 && (
              <p className="text-xs text-ink-muted mt-2">
                Aucun étudiant trouvé. <button type="button" onClick={switchToManual} className="text-accent hover:underline">Saisir manuellement</button>.
              </p>
            )}
          </div>
        )}

        {pickedStudent && (
          <div className="bg-accent/10 border border-accent-soft/40 rounded-xl p-4 flex items-center gap-3">
            <span className="icon-tile icon-tile-accent w-10 h-10 shrink-0">
              <UserIcon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{pickedStudent.full_name}</p>
              <p className="text-xs text-ink-muted truncate">
                <span className="font-mono">{pickedStudent.matricule}</span>
                {pickedStudent.promotion ? ` · ${pickedStudent.promotion}` : ""}
              </p>
            </div>
            <button type="button" onClick={clearStudent} className="btn btn-ghost btn-sm">
              <X size={14} /> Changer
            </button>
          </div>
        )}

        {manualMode && (
          <div className="flex items-center justify-end">
            <button type="button" onClick={switchToPicker} className="text-xs text-accent hover:underline inline-flex items-center gap-1">
              <GraduationCap size={12} /> Sélectionner un étudiant pré-importé
            </button>
          </div>
        )}

        {/* CHAMPS DU FORMULAIRE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Nom complet de l'acheteur</label><input className="input" required value={form.buyer_full_name} onChange={(e) => setForm({ ...form, buyer_full_name: e.target.value })} readOnly={!!pickedStudent} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Téléphone (optionnel)</label><input className="input" value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} /></div>
          <div>
            <label className="label">Statut de l'acheteur</label>
            <select className="input" value={form.attendee_status} onChange={(e) => setForm({ ...form, attendee_status: e.target.value as AttendeeStatus })}>
              <option value="regular">Régulier</option>
              <option value="esoteric">Ésotérique (tarif spécial)</option>
            </select>
          </div>
        </div>

        {type === "duo" && (
          <div>
            <label className="label">Nom du partenaire <span className="text-ink-faint normal-case tracking-normal">(optionnel)</span></label>
            <input className="input" value={form.partner_full_name} onChange={(e) => setForm({ ...form, partner_full_name: e.target.value })} placeholder="Laissez vide si inconnu" />
          </div>
        )}
        {type === "gbonhi" && (
          <div><label className="label">Nombre de personnes dans le gbonhi</label><input className="input" type="number" min={2} max={20} value={form.group_size} onChange={(e) => setForm({ ...form, group_size: +e.target.value })} /></div>
        )}

        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-accent/10 to-transparent border border-accent-soft/30 rounded-xl">
          <span className="text-sm text-ink-muted uppercase tracking-wider flex items-center gap-2">
            <Wallet size={16} /> Total à encaisser
          </span>
          <span className="font-serif text-3xl font-bold accent-text">{formatMoney(price)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-line">
          <button type="button" onClick={onClose} className="btn btn-secondary">Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={saving || (!form.buyer_full_name || !form.buyer_email)}>
            {saving ? <Spinner size={16} /> : <><Check size={16} /> Émettre le ticket</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
