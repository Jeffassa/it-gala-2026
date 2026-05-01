import { Check, Edit, Plus, Search, Trash2, Users as UsersIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { Spinner } from "@/components/Spinner";
import { apiError, userApi } from "@/lib/api";
import { formatMoney, roleLabel } from "@/lib/format";
import type { Role, UserWithSpend } from "@/lib/types";
import { toast } from "@/store/toast";

const ROLE_BADGE: Record<Role, string> = {
  super_admin: "badge-accent",
  cashier: "badge-info",
  controller: "badge-purple",
  participant: "badge",
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithSpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserWithSpend | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try { setUsers(await userApi.list()); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = users.filter(
    (u) => !q || u.full_name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())
  );

  async function toggle(u: UserWithSpend) {
    try {
      if (u.is_active) await userApi.suspend(u.id);
      else await userApi.activate(u.id);
      toast.success(u.is_active ? "Compte suspendu" : "Compte réactivé");
      load();
    } catch (err) { toast.error(apiError(err)); }
  }

  async function remove(u: UserWithSpend) {
    if (!confirm(`Supprimer ${u.full_name} ?`)) return;
    try { await userApi.remove(u.id); toast.success("Utilisateur supprimé"); load(); }
    catch (err) { toast.error(apiError(err)); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Utilisateurs</h2>
          <p className="text-ink-muted mt-1">Caissières, contrôleurs, super admins et participants.</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative max-w-xs w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input pl-10" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button onClick={() => { setEditing(null); setOpen(true); }} className="btn btn-primary">
            <Plus size={16} /> Nouvel utilisateur
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <Empty Icon={UsersIcon} title="Aucun utilisateur" />
      ) : (
        <div className="table-wrap overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th className="text-right">Tickets</th>
                <th className="text-right">Total payé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.full_name} size="sm" />
                      <div>
                        <div className="font-medium">{u.full_name}</div>
                        <div className="text-xs text-ink-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{roleLabel(u.role)}</span></td>
                  <td>
                    {u.is_active ? <span className="badge badge-success">Actif</span> : <span className="badge badge-danger">Suspendu</span>}
                  </td>
                  <td className="text-right tabular-nums">{u.tickets_count}</td>
                  <td className="text-right tabular-nums font-semibold">{formatMoney(u.total_spent)}</td>
                  <td>
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => { setEditing(u); setOpen(true); }} className="btn btn-secondary btn-sm">
                        <Edit size={14} /> Modifier
                      </button>
                      <button onClick={() => toggle(u)} className="btn btn-ghost btn-sm">{u.is_active ? "Suspendre" : "Activer"}</button>
                      {u.role !== "super_admin" && (
                        <button onClick={() => remove(u)} className="btn btn-sm border border-red-500/30 text-red-400 hover:bg-red-500/10">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserForm open={open} onClose={() => setOpen(false)} initial={editing} onSaved={() => { setOpen(false); load(); }} />
    </div>
  );
}

function UserForm({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial: UserWithSpend | null; onSaved: () => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "participant" as Role, school_promotion: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) setForm({ full_name: initial.full_name, email: initial.email, password: "", role: initial.role, school_promotion: initial.school_promotion ?? "" });
    else setForm({ full_name: "", email: "", password: "", role: "participant", school_promotion: "" });
  }, [initial, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) {
        const payload: any = { full_name: form.full_name, email: form.email, role: form.role, school_promotion: form.school_promotion || null };
        if (form.password) payload.password = form.password;
        await userApi.update(initial.id, payload);
      } else {
        await userApi.create({ full_name: form.full_name, email: form.email, password: form.password, role: form.role, school_promotion: form.school_promotion || undefined });
      }
      toast.success(initial ? "Utilisateur mis à jour" : "Utilisateur créé");
      onSaved();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier l'utilisateur" : "Nouvel utilisateur"}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Nom complet</label><input className="input" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div>
          <label className="label">{initial ? "Nouveau mot de passe (laisser vide pour conserver)" : "Mot de passe"}</label>
          <input className="input" type="password" required={!initial} minLength={initial ? 0 : 6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Rôle</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="participant">Participant</option>
              <option value="cashier">Caissière</option>
              <option value="controller">Contrôleur</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="label">Promotion</label>
            <input className="input" value={form.school_promotion} onChange={(e) => setForm({ ...form, school_promotion: e.target.value })} />
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
