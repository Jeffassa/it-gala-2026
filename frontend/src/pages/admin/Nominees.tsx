import { Check, Edit, Plus, Sparkles, Trash2, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { apiError, categoryApi, galaApi, nomineeApi } from "@/lib/api";
import type { Category, Gala, Nominee } from "@/lib/types";
import { toast } from "@/store/toast";

export default function AdminNominees() {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [galaId, setGalaId] = useState<number | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [catId, setCatId] = useState<number | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nominee | null>(null);

  useEffect(() => {
    galaApi.list().then((g) => {
      setGalas(g);
      const a = g.find((x) => x.is_active) ?? g[0];
      if (a) setGalaId(a.id);
    });
  }, []);
  useEffect(() => {
    if (!galaId) return;
    categoryApi.list(galaId).then((c) => {
      setCats(c);
      setCatId(c[0]?.id ?? null);
    });
  }, [galaId]);

  async function load() {
    if (!catId) { setNominees([]); setLoading(false); return; }
    setLoading(true);
    try { setNominees(await nomineeApi.list(catId)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [catId]);

  async function onDelete(id: number) {
    if (!confirm("Supprimer ce nominé ?")) return;
    try { await nomineeApi.remove(id); toast.success("Nominé supprimé"); load(); }
    catch (err) { toast.error(apiError(err)); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Nominés</h2>
          <p className="text-ink-muted mt-1">Inscrivez les candidats pour chaque catégorie.</p>
        </div>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="btn btn-primary" disabled={!catId}>
          <Plus size={16} /> Ajouter un nominé
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select className="input max-w-xs" value={galaId ?? ""} onChange={(e) => setGalaId(+e.target.value)}>
          {galas.map((g) => <option key={g.id} value={g.id}>{g.name} {g.edition_year}</option>)}
        </select>
        <select className="input max-w-xs" value={catId ?? ""} onChange={(e) => setCatId(+e.target.value)}>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : !catId ? (
        <Empty Icon={Trophy} title="Aucune catégorie" hint="Créez d'abord une catégorie." />
      ) : nominees.length === 0 ? (
        <Empty Icon={Sparkles} title="Aucun nominé" hint="Ajoutez le premier candidat pour cette catégorie." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {nominees.map((n) => (
            <div key={n.id} className="bg-bg-elev border border-line rounded-2xl overflow-hidden hover:border-accent/60 transition">
              <div className="aspect-square bg-gradient-to-br from-bg-elev2 to-bg-elev3 grid place-items-center overflow-hidden">
                {n.photo_url
                  ? <img src={n.photo_url} alt={n.name} className="w-full h-full object-cover" />
                  : <User size={48} className="text-accent/40" strokeWidth={1.4} />}
              </div>
              <div className="p-4">
                <p className="font-semibold mb-0.5 truncate">{n.name}</p>
                <p className="text-xs text-ink-muted mb-3 truncate">{n.school_promotion ?? "—"}</p>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="badge badge-accent">{n.votes_count} votes</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setEditing(n); setOpen(true); }} className="btn btn-secondary btn-sm flex-1">
                    <Edit size={14} /> Modifier
                  </button>
                  <button onClick={() => onDelete(n.id)} className="btn btn-sm border border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {catId && <NomineeForm open={open} onClose={() => setOpen(false)} initial={editing} categoryId={catId} onSaved={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function NomineeForm({ open, onClose, initial, categoryId, onSaved }: { open: boolean; onClose: () => void; initial: Nominee | null; categoryId: number; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", school_promotion: "", photo_url: "", description: "",
    biography: "", achievements: "", contact_email: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({
      name: initial.name,
      school_promotion: initial.school_promotion ?? "",
      photo_url: initial.photo_url ?? "",
      description: initial.description ?? "",
      biography: initial.biography ?? "",
      achievements: initial.achievements ?? "",
      contact_email: initial.contact_email ?? "",
    });
    else setForm({ name: "", school_promotion: "", photo_url: "", description: "", biography: "", achievements: "", contact_email: "" });
  }, [initial, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) await nomineeApi.update(initial.id, form);
      else await nomineeApi.create({ ...form, category_id: categoryId });
      toast.success(initial ? "Nominé mis à jour" : "Nominé ajouté");
      onSaved();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={initial ? "Modifier le nominé" : "Nouveau nominé"}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Nom complet</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Promotion / École</label><input className="input" value={form.school_promotion} onChange={(e) => setForm({ ...form, school_promotion: e.target.value })} placeholder="L3 GLSI 2026" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">URL photo</label><input className="input" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" /></div>
          <div><label className="label">Email de contact</label><input className="input" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
        </div>
        <div><label className="label">Tagline / Description courte</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Une phrase qui résume le profil" /></div>
        <div><label className="label">Biographie</label><textarea className="input min-h-[120px]" value={form.biography} onChange={(e) => setForm({ ...form, biography: e.target.value })} placeholder="Parcours, valeurs, vision…" /></div>
        <div>
          <label className="label">Réalisations (une par ligne)</label>
          <textarea className="input min-h-[120px]" value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} placeholder="Projet open-source XYZ&#10;Conférence DevFest 2025&#10;Mentor Tech Sisters" />
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
