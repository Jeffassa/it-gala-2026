import { Check, Edit, Plus, Sparkles, Trash2, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { StudentAutocomplete } from "@/components/StudentAutocomplete";
import { apiError, assetUrl, categoryApi, galaApi, nomineeApi } from "@/lib/api";
import type { Category, Gala, Nominee } from "@/lib/types";
import { toast } from "@/store/toast";

const IT_PROMOTIONS = Array.from({ length: 14 }, (_, i) => `IT${i + 1}`);

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
                  ? <img src={assetUrl(n.photo_url)} alt={n.name} className="w-full h-full object-cover" />
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
    setPhotoFile(null);
  }, [initial, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let nominee: Nominee;
      if (initial) {
        nominee = await nomineeApi.update(initial.id, form);
      } else {
        nominee = await nomineeApi.create({ ...form, category_id: categoryId });
      }

      if (photoFile) {
        await nomineeApi.uploadPhoto(nominee.id, photoFile);
      }

      toast.success(initial ? "Nominé mis à jour" : "Nominé ajouté");
      onSaved();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={initial ? "Modifier le nominé" : "Nouveau nominé"}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nom complet</label>
            <StudentAutocomplete
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              onPick={(s) => setForm({
                ...form,
                name: s.full_name,
                school_promotion: s.promotion ?? form.school_promotion,
                contact_email: s.email ?? form.contact_email,
              })}
              placeholder="Tapez le nom (auto-completion ESATIC)…"
              required
            />
            <p className="text-[11px] text-ink-faint mt-1">
              Saisissez 2+ caractères : suggestions filtrées sur la liste ESATIC.
            </p>
          </div>
          <div>
            <label className="label">Promotion / École <span className="text-ink-faint normal-case tracking-normal">(optionnel)</span></label>
            <select className="input" value={form.school_promotion} onChange={(e) => setForm({ ...form, school_promotion: e.target.value })}>
              <option value="">Sélectionner...</option>
              {IT_PROMOTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label !mb-0">
              Photo du nominé <span className="text-ink-faint normal-case tracking-normal">(optionnel)</span>
            </label>
            {(!!photoFile || !!form.photo_url.trim()) && (
              <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1">
                <Check size={12} /> Photo prête
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                type="file"
                accept="image/*"
                className="input py-1.5"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              <p className="text-[11px] text-ink-faint mt-1">Uploadez un fichier (jpg/png/webp)</p>
            </div>
            <div>
              <input
                className="input"
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://…"
                disabled={!!photoFile}
              />
              <p className="text-[11px] text-ink-faint mt-1">… ou collez une URL directe</p>
            </div>
          </div>
          {initial?.photo_url && !photoFile && !form.photo_url.trim() && (
            <p className="text-[11px] text-ink-muted mt-2">
              ✓ Photo actuelle conservée — laissez vide pour ne pas la changer.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div><label className="label">Email de contact</label><input className="input max-w-sm" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
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
