import { RefreshCw, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Spinner } from "@/components/Spinner";
import { auditApi } from "@/lib/api";
import { formatDateTime, ticketTypeLabel } from "@/lib/format";
import type { ScanLogEntry } from "@/lib/types";

export default function AdminAudit() {
  const [logs, setLogs] = useState<ScanLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setLogs(await auditApi.scans({ limit: 500 })); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Journal des scans</h2>
          <p className="text-ink-muted mt-1">Traçabilité complète des entrées pour la gestion des litiges.</p>
        </div>
        <button onClick={load} className="btn btn-secondary">
          <RefreshCw size={16} /> Actualiser
        </button>
      </div>

      {loading ? <Spinner /> : logs.length === 0 ? (
        <Empty Icon={ScrollText} title="Aucun scan enregistré" />
      ) : (
        <div className="table-wrap overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Date / Heure</th>
                <th>Code ticket</th>
                <th>Acheteur</th>
                <th>Type</th>
                <th>Contrôleur</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap">{formatDateTime(s.scanned_at)}</td>
                  <td className="font-mono text-xs">{s.ticket_code}</td>
                  <td>{s.ticket_buyer}</td>
                  <td><span className="badge">{ticketTypeLabel(s.ticket_type)}</span></td>
                  <td>
                    <div>{s.controller_name}</div>
                    <div className="text-xs text-ink-muted">{s.controller_email}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
