import {
  Check, Edit, FileSpreadsheet, GraduationCap, Plus, Search, Trash2, Upload, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { apiError, studentApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Student, StudentImportResult } from "@/lib/types";
import { toast } from "@/store/toast";

const MATRICULE_RE = /^\d{2}-ESATIC\d{4}[A-Z]{2}$/;

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [promotions, setPromotions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [promo, setPromo] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const [list, promos] = await Promise.all([
        studentApi.list({ q: q || undefined, promotion: promo || undefined, limit: 1000 }),
        studentApi.promotions(),
      ]);
      setStudents(list);
      setPromotions(promos);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q, promo]);

  async function onImportFile(file: File, defaultPromo?: string) {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await studentApi.importXlsx(file, defaultPromo);
      setImportResult(result);
      const ok = result.created + result.updated;
      toast.success(`${ok} étudiant(s) intégrés (${result.created} nouveaux, ${result.updated} mis à jour)`);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setImporting(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImportFile(file);
    e.target.value = "";
  }

  async function deleteOne(s: Student) {
    if (!confirm(`Supprimer ${s.full_name} (${s.matricule}) ?`)) return;
    try { await studentApi.remove(s.id); toast.success("Étudiant supprimé"); load(); }
    catch (err) { toast.error(apiError(err)); }
  }

  async function deleteAll() {
    const target = promo ? `la promotion « ${promo} »` : "TOUS les étudiants";
    if (!confirm(`Supprimer ${target} ? Cette action est irréversible.`)) return;
    try {
      await studentApi.removeAll(promo || undefined);
      toast.success("Suppression effectuée");
      setPromo("");
      load();
    } catch (err) { toast.error(apiError(err)); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Étudiants ESATIC</h2>
          <p className="text-ink-muted mt-1">
            Annuaire des étudiants — base utilisée pour la billetterie et la validation des comptes.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept=".xlsx,.xlsm" hidden onChange={handleFileChange} />
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
            <Upload size={16} /> Importer un fichier Excel
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn btn-primary">
            <Plus size={16} /> Ajouter manuellement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Étudiants" value={students.length.toString()} />
        <Stat label="Promotions" value={promotions.length.toString()} />
        <Stat label="Avec email" value={students.filter((s) => s.email).length.toString()} />
        <Stat label="Avec téléphone" value={students.filter((s) => s.phone).length.toString()} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            className="input pl-10"
            placeholder="Rechercher (nom, matricule, email)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="input max-w-xs" value={promo} onChange={(e) => setPromo(e.target.value)}>
          <option value="">Toutes les promotions</option>
          {promotions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {(q || promo) && (
          <button onClick={() => { setQ(""); setPromo(""); }} className="btn btn-ghost btn-sm">
            <X size={14} /> Effacer filtres
          </button>
        )}
        <div className="ml-auto">
          <button onClick={deleteAll} className="btn btn-sm border border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Trash2 size={14} /> {promo ? `Vider la promo` : "Tout supprimer"}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : students.length === 0 ? (
        <Empty
          Icon={GraduationCap}
          title={q || promo ? "Aucun résultat" : "Aucun étudiant enregistré"}
          hint={q || promo ? "Essayez d'autres filtres" : "Importez votre premier fichier Excel pour commencer."}
          action={!q && !promo ? (
            <button onClick={() => setShowImportModal(true)} className="btn btn-primary">
              <Upload size={16} /> Importer un fichier Excel
            </button>
          ) : null}
        />
      ) : (
        <div className="table-wrap overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom complet</th>
                <th>Promotion</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.matricule}</td>
                  <td className="font-medium">{s.full_name}</td>
                  <td><span className="badge">{s.promotion}</span></td>
                  <td className="text-ink-muted">{s.email ?? "—"}</td>
                  <td className="text-ink-muted">{s.phone ?? "—"}</td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => { setEditing(s); setShowForm(true); }} className="btn btn-secondary btn-sm">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => deleteOne(s)} className="btn btn-sm border border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ImportModal
        open={showImportModal}
        onClose={() => { setShowImportModal(false); setImportResult(null); }}
        importing={importing}
        result={importResult}
        onImport={async (file, defaultPromo) => { await onImportFile(file, defaultPromo); }}
      />

      <StudentForm
        open={showForm}
        initial={editing}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); load(); }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-bg-elev p-5">
      <p className="text-xs uppercase tracking-wider text-ink-muted mb-2">{label}</p>
      <p className="font-serif text-2xl font-bold leading-none">{value}</p>
    </div>
  );
}

function ImportModal({
  open, onClose, importing, result, onImport,
}: {
  open: boolean;
  onClose: () => void;
  importing: boolean;
  result: StudentImportResult | null;
  onImport: (file: File, defaultPromo?: string) => Promise<void>;
}) {
  const [defaultPromo, setDefaultPromo] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().match(/\.(xlsx|xlsm)$/)) {
      toast.error("Format non supporté — uploadez un .xlsx");
      return;
    }
    await onImport(file, defaultPromo || undefined);
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Importer un fichier Excel">
      {!result ? (
        <div className="space-y-4">
          <div className="bg-bg-elev2 border border-line rounded-xl p-4">
            <p className="text-sm font-semibold mb-2">Format attendu</p>
            <p className="text-xs text-ink-muted mb-3">Le fichier doit contenir une feuille avec les colonnes suivantes (nom de colonne tolérant accents/casse) :</p>
            <ul className="text-xs space-y-1.5 text-ink-muted">
              <li>• <code className="text-accent font-mono">matricule</code> <span className="text-ink-faint">— ex : 22-ESATIC0273DN</span> (obligatoire)</li>
              <li>• <code className="text-accent font-mono">nom</code> ou <code className="text-accent font-mono">nom complet</code> (obligatoire)</li>
              <li>• <code className="text-accent font-mono">promotion</code> ou <code className="text-accent font-mono">classe</code></li>
              <li>• <code className="text-accent font-mono">email</code> (optionnel)</li>
              <li>• <code className="text-accent font-mono">telephone</code> (optionnel)</li>
            </ul>
            <p className="text-xs text-ink-faint mt-3">
              💡 Si la colonne <em>promotion</em> est absente, le nom de la feuille Excel sera utilisé, ou vous pouvez la spécifier ci-dessous.
            </p>
          </div>

          <div>
            <label className="label">Promotion par défaut <span className="text-ink-faint normal-case tracking-normal">(optionnel)</span></label>
            <input
              className="input"
              placeholder="L3 GLSI 2026"
              value={defaultPromo}
              onChange={(e) => setDefaultPromo(e.target.value)}
            />
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer ${
              dragActive ? "border-accent bg-accent/5" : "border-line-strong hover:border-accent"
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {importing ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size={28} />
                <p className="text-sm">Import en cours…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="icon-tile icon-tile-accent w-14 h-14">
                  <FileSpreadsheet size={26} />
                </span>
                <p className="font-medium">Glissez-déposez un fichier Excel ici</p>
                <p className="text-xs text-ink-muted">ou cliquez pour sélectionner</p>
                <p className="text-xs text-ink-faint">.xlsx jusqu'à 10 Mo</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-line">
            <button onClick={onClose} className="btn btn-secondary">Fermer</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ImportStat label="Lignes lues" value={result.total_rows} />
            <ImportStat label="Créés" value={result.created} accent />
            <ImportStat label="Mis à jour" value={result.updated} />
            <ImportStat label="Ignorés" value={result.skipped} danger={result.skipped > 0} />
          </div>

          {result.errors.length > 0 && (
            <div>
              <p className="font-semibold text-sm mb-2 text-amber-300">Erreurs ({result.errors.length})</p>
              <ul className="text-xs text-ink-muted space-y-1 max-h-48 overflow-y-auto bg-bg-elev2 border border-line rounded-xl p-3">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-line">
            <button onClick={onClose} className="btn btn-primary"><Check size={16} /> Terminé</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ImportStat({ label, value, accent, danger }: { label: string; value: number; accent?: boolean; danger?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        accent ? "bg-accent/10 border-accent-soft/40" :
        danger ? "bg-red-500/10 border-red-500/30" :
        "bg-bg-elev2 border-line"
      }`}
    >
      <p className="font-serif text-3xl font-bold leading-none">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-ink-muted mt-1.5">{label}</p>
    </div>
  );
}

function StudentForm({
  open, initial, onClose, onSaved,
}: {
  open: boolean;
  initial: Student | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ matricule: "", full_name: "", promotion: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({
      matricule: initial.matricule,
      full_name: initial.full_name,
      promotion: initial.promotion,
      email: initial.email ?? "",
      phone: initial.phone ?? "",
    });
    else setForm({ matricule: "", full_name: "", promotion: "", email: "", phone: "" });
  }, [initial, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!initial && !MATRICULE_RE.test(form.matricule.trim().toUpperCase())) {
      toast.error("Matricule invalide. Format : AA-ESATIC#### + 2 lettres (ex : 22-ESATIC0273DN)");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        matricule: form.matricule.trim().toUpperCase(),
        full_name: form.full_name,
        promotion: form.promotion,
        email: form.email || null,
        phone: form.phone || null,
      };
      if (initial) {
        const { matricule, ...rest } = payload;
        await studentApi.update(initial.id, rest);
      } else {
        await studentApi.create(payload as any);
      }
      toast.success(initial ? "Étudiant mis à jour" : "Étudiant ajouté");
      onSaved();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={initial ? "Modifier l'étudiant" : "Nouvel étudiant"}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Matricule</label>
            <input
              className="input font-mono"
              required
              disabled={!!initial}
              value={form.matricule}
              onChange={(e) => setForm({ ...form, matricule: e.target.value.toUpperCase() })}
              placeholder="22-ESATIC0273DN"
            />
            <p className="text-xs text-ink-faint mt-1.5">Format : AA-ESATIC#### + 2 lettres</p>
          </div>
          <div>
            <label className="label">Promotion</label>
            <input className="input" required value={form.promotion} onChange={(e) => setForm({ ...form, promotion: e.target.value })} placeholder="L3 GLSI 2026" />
          </div>
        </div>
        <div>
          <label className="label">Nom complet</label>
          <input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="prenom.nom@etu.esatic.ci" />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 07 00 00 00 00" />
          </div>
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
