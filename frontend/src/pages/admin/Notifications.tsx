import { Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Spinner } from "@/components/Spinner";
import { apiError, notificationApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { NotificationItem } from "@/lib/types";
import { toast } from "@/store/toast";

const STATUS_BADGE: Record<string, string> = {
  sent: "badge-success",
  queued: "badge-info",
  failed: "badge-danger",
};

export default function AdminNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try { setItems(await notificationApi.list()); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function broadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await notificationApi.broadcast(subject, body, role || undefined);
      toast.success(`Message envoyé à ${res.sent}/${res.recipients} destinataires`);
      setSubject(""); setBody(""); setRole("");
      load();
    } catch (err) { toast.error(apiError(err)); }
    finally { setSending(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-bold">Notifications</h2>
        <p className="text-ink-muted mt-1">Diffusez un message aux participants par email.</p>
      </div>

      <form onSubmit={broadcast} className="bg-bg-elev border border-line rounded-2xl p-6 space-y-4">
        <h3 className="font-serif text-xl font-bold">Nouveau message</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="label">Objet</label>
            <input className="input" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Rappel : J-3 avant le gala" />
          </div>
          <div>
            <label className="label">Cible</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Tous les utilisateurs</option>
              <option value="participant">Participants</option>
              <option value="cashier">Caissières</option>
              <option value="controller">Contrôleurs</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Corps du message</label>
          <textarea className="input min-h-[140px]" required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Bonjour, plus que 3 jours avant le grand soir…" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? <Spinner size={16} /> : <><Send size={16} /> Envoyer la diffusion</>}
          </button>
        </div>
        <p className="text-xs text-ink-muted">
          En mode développement (sans SMTP configuré), les emails sont écrits dans la console du backend mais sont enregistrés ici pour audit.
        </p>
      </form>

      <div>
        <h3 className="font-serif text-xl font-bold mb-4">Historique des envois</h3>
        {loading ? <Spinner /> : items.length === 0 ? (
          <Empty Icon={Mail} title="Aucune notification envoyée" />
        ) : (
          <div className="table-wrap overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Canal</th>
                  <th>Destinataire</th>
                  <th>Objet</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id}>
                    <td className="whitespace-nowrap">{formatDateTime(n.created_at)}</td>
                    <td><span className="badge">{n.channel}</span></td>
                    <td>{n.recipient}</td>
                    <td className="max-w-md truncate">{n.subject ?? "—"}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[n.status]}`}>{n.status}</span>
                      {n.error && <span className="ml-2 text-xs text-red-400">{n.error}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
