import { Check, Drama, Edit, MonitorPlay, Plus, Trash2, Vote } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { apiError, galaApi } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { Gala } from "@/lib/types";
import { toast } from "@/store/toast";

export default function AdminGalas() {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Gala | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try { setGalas(await galaApi.list()); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function onDelete(id: number) {
    if (!confirm("Supprimer ce gala ? Cette action est irréversible.")) return;
    try { await galaApi.remove(id); toast.success("Gala supprimé"); load(); }
    catch (err) { toast.error(apiError(err)); }
  }

  async function toggleActive(g: Gala) {
    try { await galaApi.update(g.id, { is_active: !g.is_active }); load(); }
    catch (err) { toast.error(apiError(err)); }
  }

  async function toggleVoting(g: Gala) {
    try {
      await galaApi.update(g.id, { voting_open: !g.voting_open });
      toast.success(g.voting_open ? "Votes fermés" : "Votes ouverts");
      load();
    } catch (err) { toast.error(apiError(err)); }
  }

  async function toggleLive(g: Gala) {
    try {
      await galaApi.update(g.id, { live_results_visible: !g.live_results_visible });
      toast.success(g.live_results_visible ? "Grand écran masqué" : "Grand écran activé");
      load();
    } catch (err) { toast.error(apiError(err)); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Galas</h2>
          <p className="text-ink-muted mt-1">Configurez chaque édition du gala.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="btn btn-primary">
          <Plus size={16} /> Nouveau gala
        </button>
      </div>

      {loading ? <Spinner /> : galas.length === 0 ? (
        <Empty Icon={Drama} title="Aucun gala configuré" hint="Créez votre première édition pour démarrer."
          action={<button onClick={() => { setEditing(null); setOpen(true); }} className="btn btn-primary"><Plus size={16} /> Créer un gala</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {galas.map((g) => (
            <div key={g.id} className="bg-bg-elev border border-line rounded-2xl p-6 transition hover:border-accent/60">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Édition {g.edition_year}</p>
                  <h3 className="font-serif text-2xl font-bold">{g.name}</h3>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {g.is_active ? <span className="badge badge-success">Active</span> : <span className="badge">Archivée</span>}
                  {g.voting_open ? <span className="badge badge-accent">Votes ouverts</span> : <span className="badge">Votes fermés</span>}
                  {g.live_results_visible ? <span className="badge badge-success">Grand écran ON</span> : <span className="badge">Grand écran OFF</span>}
                </div>
              </div>
              <p className="font-serif italic text-accent mb-3">« {g.theme} »</p>
              <dl className="grid grid-cols-2 gap-3 text-sm mb-5">
                <div><dt className="text-ink-muted text-xs uppercase mb-0.5">Date</dt><dd>{formatDate(g.event_date)}</dd></div>
                <div><dt className="text-ink-muted text-xs uppercase mb-0.5">Lieu</dt><dd>{g.location}</dd></div>
                {g.dress_code && <div className="col-span-2"><dt className="text-ink-muted text-xs uppercase mb-0.5">Tenue</dt><dd>{g.dress_code}</dd></div>}
              </dl>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setEditing(g); setOpen(true); }} className="btn btn-secondary btn-sm"><Edit size={14} /> Modifier</button>
                <button onClick={() => toggleVoting(g)} className="btn btn-ghost btn-sm"><Vote size={14} /> {g.voting_open ? "Fermer votes" : "Ouvrir votes"}</button>
                <button onClick={() => toggleLive(g)} className={`btn btn-sm ${g.live_results_visible ? "btn-accent" : "btn-ghost"}`}>
                  <MonitorPlay size={14} /> {g.live_results_visible ? "Cacher live" : "Activer live"}
                </button>
                <button onClick={() => toggleActive(g)} className="btn btn-ghost btn-sm">{g.is_active ? "Archiver" : "Activer"}</button>
                <button onClick={() => onDelete(g.id)} className="btn btn-sm border border-red-500/30 text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <GalaForm open={open} onClose={() => setOpen(false)} initial={editing} onSaved={() => { setOpen(false); load(); }} />
    </div>
  );
}

function GalaForm({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial: Gala | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", edition_year: new Date().getFullYear() + 1, theme: "",
    event_date: "", location: "", dress_code: "", program: "",
    poster_url: "", video_url: "", tiktok_url: "", telegram_url: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name, edition_year: initial.edition_year, theme: initial.theme,
        event_date: initial.event_date.slice(0, 16),
        location: initial.location, dress_code: initial.dress_code ?? "",
        program: initial.program ?? "", poster_url: initial.poster_url ?? "",
        video_url: initial.video_url ?? "", tiktok_url: initial.tiktok_url ?? "",
        telegram_url: initial.telegram_url ?? "",
      });
    } else {
      setForm({
        name: "IT Gala", edition_year: new Date().getFullYear() + 1, theme: "",
        event_date: "", location: "", dress_code: "", program: "",
        poster_url: "", video_url: "", tiktok_url: "", telegram_url: "",
      });
    }
  }, [initial, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, event_date: new Date(form.event_date).toISOString() };
      if (initial) await galaApi.update(initial.id, payload as any);
      else await galaApi.create(payload as any);
      toast.success(initial ? "Gala mis à jour" : "Gala créé");
      onSaved();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={initial ? "Modifier le gala" : "Nouveau gala"}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Nom</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Année d'édition</label><input className="input" type="number" required value={form.edition_year} onChange={(e) => setForm({ ...form, edition_year: +e.target.value })} /></div>
        </div>
        <div><label className="label">Thème</label><input className="input" required value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Date & heure</label><input className="input" type="datetime-local" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
          <div><label className="label">Lieu</label><input className="input" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        </div>
        <div><label className="label">Code vestimentaire</label><input className="input" value={form.dress_code} onChange={(e) => setForm({ ...form, dress_code: e.target.value })} /></div>
        <div><label className="label">Programme</label><textarea className="input min-h-[100px]" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Lien TikTok</label><input className="input" value={form.tiktok_url} onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })} /></div>
          <div><label className="label">Lien Telegram</label><input className="input" value={form.telegram_url} onChange={(e) => setForm({ ...form, telegram_url: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-line">
          <button type="button" onClick={onClose} className="btn btn-secondary">Annuler</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : <><Check size={16} /> Enregistrer</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
