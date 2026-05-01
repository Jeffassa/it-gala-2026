import { Check, Edit, Gem, GraduationCap, Heart, Plus, Rocket, Smartphone, Smile, Trash2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { apiError, categoryApi, galaApi } from "@/lib/api";
import type { Category, Gala } from "@/lib/types";
import { toast } from "@/store/toast";

const ICON_OPTIONS = [
  { name: "trophy", Cmp: Trophy, label: "Trophée" },
  { name: "graduation-cap", Cmp: GraduationCap, label: "Étudiant" },
  { name: "heart", Cmp: Heart, label: "Cœur" },
  { name: "smile", Cmp: Smile, label: "Sourire" },
  { name: "rocket", Cmp: Rocket, label: "Innovation" },
  { name: "smartphone", Cmp: Smartphone, label: "Tech" },
  { name: "gem", Cmp: Gem, label: "Joyau" },
];

const ICON_MAP: Record<string, any> = Object.fromEntries(ICON_OPTIONS.map((i) => [i.name, i.Cmp]));

function CatIcon({ name, size = 22 }: { name?: string | null; size?: number }) {
  const Cmp = name ? (ICON_MAP[name] ?? Trophy) : Trophy;
  return <Cmp size={size} strokeWidth={1.6} />;
}

export default function AdminCategories() {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [galaId, setGalaId] = useState<number | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  useEffect(() => {
    galaApi.list().then((g) => {
      setGalas(g);
      const active = g.find((x) => x.is_active) ?? g[0];
      if (active) setGalaId(active.id);
    });
  }, []);

  async function load() {
    if (!galaId) return;
    setLoading(true);
    try { setCats(await categoryApi.list(galaId)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [galaId]);

  async function onDelete(id: number) {
    if (!confirm("Supprimer cette catégorie et tous ses nominés/votes ?")) return;
    try { await categoryApi.remove(id); toast.success("Catégorie supprimée"); load(); }
    catch (err) { toast.error(apiError(err)); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Catégories</h2>
          <p className="text-ink-muted mt-1">Définissez les trophées de l'édition.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="input min-w-[200px]" value={galaId ?? ""} onChange={(e) => setGalaId(+e.target.value)}>
            {galas.map((g) => <option key={g.id} value={g.id}>{g.name} {g.edition_year}</option>)}
          </select>
          <button onClick={() => { setEditing(null); setOpen(true); }} className="btn btn-primary" disabled={!galaId}>
            <Plus size={16} /> Catégorie
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : cats.length === 0 ? (
        <Empty Icon={Trophy} title="Aucune catégorie" hint="Créez la première catégorie pour ce gala." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map((c) => (
            <div key={c.id} className="bg-bg-elev border border-line rounded-2xl p-6 hover:border-accent/60 transition">
              <div className="flex items-start justify-between mb-3">
                <span className="icon-tile icon-tile-primary w-12 h-12">
                  <CatIcon name={c.icon} size={22} />
                </span>
                <span className="badge badge-accent">{c.total_votes} votes</span>
              </div>
              <h3 className="font-serif text-xl font-bold mb-2">{c.name}</h3>
              {c.description && <p className="text-sm text-ink-muted mb-4 line-clamp-3">{c.description}</p>}
              <div className="flex items-center justify-between text-xs text-ink-muted mb-4">
                <span>{c.nominees_count} nominé(s)</span>
                <span>Ordre #{c.order_index}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(c); setOpen(true); }} className="btn btn-secondary btn-sm flex-1">
                  <Edit size={14} /> Modifier
                </button>
                <button onClick={() => onDelete(c.id)} className="btn btn-sm border border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {galaId && <CategoryForm open={open} onClose={() => setOpen(false)} initial={editing} galaId={galaId} onSaved={() => { setOpen(false); load(); }} />}
    </div>
  );
}

function CategoryForm({ open, onClose, initial, galaId, onSaved }: { open: boolean; onClose: () => void; initial: Category | null; galaId: number; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", description: "", icon: "trophy", order_index: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({ name: initial.name, description: initial.description ?? "", icon: initial.icon ?? "trophy", order_index: initial.order_index });
    else setForm({ name: "", description: "", icon: "trophy", order_index: 0 });
  }, [initial, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) await categoryApi.update(initial.id, form);
      else await categoryApi.create({ ...form, gala_id: galaId });
      toast.success(initial ? "Catégorie mise à jour" : "Catégorie créée");
      onSaved();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier la catégorie" : "Nouvelle catégorie"}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Nom</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Meilleur Étudiant" /></div>
        <div><label className="label">Description</label><textarea className="input min-h-[90px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Icône</label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => setForm({ ...form, icon: opt.name })}
                  title={opt.label}
                  className={`aspect-square grid place-items-center rounded-lg border transition ${
                    form.icon === opt.name
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-line bg-bg-elev hover:border-line-strong text-ink-muted"
                  }`}
                >
                  <opt.Cmp size={20} strokeWidth={1.7} />
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Ordre</label><input className="input" type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: +e.target.value })} /></div>
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
