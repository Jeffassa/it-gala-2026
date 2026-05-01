import { Search, Ticket } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Spinner } from "@/components/Spinner";
import { ticketApi } from "@/lib/api";
import { formatDateTime, formatMoney, ticketTypeLabel } from "@/lib/format";
import type { Ticket as TicketT } from "@/lib/types";

export default function AdminTickets() {
  const [tickets, setTickets] = useState<TicketT[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try { setTickets(await ticketApi.list({ q: q || undefined, limit: 200 })); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Tickets</h2>
          <p className="text-ink-muted mt-1">Tous les tickets vendus, scannés ou en attente.</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input className="input pl-10" placeholder="Rechercher (nom, email, code)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? <Spinner /> : tickets.length === 0 ? (
        <Empty Icon={Ticket} title="Aucun ticket" hint="Quand la caisse vendra des tickets, ils apparaîtront ici." />
      ) : (
        <div className="table-wrap overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Acheteur</th>
                <th>Type</th>
                <th>Statut</th>
                <th className="text-right">Prix</th>
                <th>Vendu le</th>
                <th>Scanné le</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{t.code}</td>
                  <td>
                    <div>{t.buyer_full_name}</div>
                    <div className="text-xs text-ink-muted">{t.buyer_email}</div>
                  </td>
                  <td>
                    <span className="badge">{ticketTypeLabel(t.type)}</span>
                    {t.attendee_status === "esoteric" && <span className="badge badge-purple ml-1.5">Ésotérique</span>}
                  </td>
                  <td>
                    {t.status === "scanned" ? <span className="badge badge-success">Scanné</span> :
                     t.status === "cancelled" ? <span className="badge badge-danger">Annulé</span> :
                     <span className="badge badge-info">Vendu</span>}
                  </td>
                  <td className="text-right tabular-nums">{formatMoney(t.price)}</td>
                  <td className="text-ink-muted">{formatDateTime(t.sold_at)}</td>
                  <td className="text-ink-muted">{t.scanned_at ? formatDateTime(t.scanned_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
