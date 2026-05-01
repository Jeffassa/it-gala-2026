import { Crown, FileSpreadsheet, TrendingUp, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { PageLoader, Spinner } from "@/components/Spinner";
import { reportApi } from "@/lib/api";
import { formatMoney, ticketTypeLabel } from "@/lib/format";
import type { FullReport } from "@/lib/types";
import { useAuthStore } from "@/store/auth";
import { toast } from "@/store/toast";

export default function AdminReports() {
  const [report, setReport] = useState<FullReport | null>(null);
  const [exporting, setExporting] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    reportApi.full().then(setReport).catch(() => null);
  }, []);

  if (!report) return <PageLoader />;
  const { stats, tickets_by_type, category_results } = report;

  async function exportXlsx() {
    setExporting(true);
    try {
      const res = await fetch("/api/v1/reports/full.xlsx", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export refusé");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-it-gala-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Rapport Excel téléchargé");
    } catch (err) {
      toast.error("Échec du téléchargement");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold">Rapports</h2>
          <p className="text-ink-muted mt-1">Synthèse complète de l'édition.</p>
        </div>
        <button onClick={exportXlsx} disabled={exporting} className="btn btn-primary">
          {exporting ? <Spinner size={16} /> : <><FileSpreadsheet size={16} /> Exporter en Excel</>}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Recettes" value={formatMoney(stats.total_revenue)} accent />
        <Stat label="Tickets" value={`${stats.total_tickets_sold}`} hint={`${stats.total_tickets_scanned} scannés`} />
        <Stat label="Votes" value={`${stats.total_votes}`} hint={`${stats.total_categories} catégories`} />
        <Stat label="Participants" value={`${stats.total_participants}`} />
      </div>

      <section>
        <h3 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-accent" /> Ventes par type de ticket
        </h3>
        <div className="table-wrap overflow-x-auto">
          <table>
            <thead>
              <tr><th>Type</th><th className="text-right">Nombre</th><th className="text-right">Recettes</th></tr>
            </thead>
            <tbody>
              {tickets_by_type.map((t) => (
                <tr key={t.type}>
                  <td>{ticketTypeLabel(t.type)}</td>
                  <td className="text-right tabular-nums">{t.count}</td>
                  <td className="text-right tabular-nums font-semibold">{formatMoney(t.revenue)}</td>
                </tr>
              ))}
              {tickets_by_type.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-ink-muted">Aucune vente enregistrée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy size={20} className="text-accent" /> Résultats par catégorie
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {category_results.map((c) => (
            <div key={c.category_id} className="bg-bg-elev border border-line rounded-2xl p-5">
              <p className="text-xs text-ink-muted uppercase tracking-wider mb-1">{c.category_name}</p>
              <p className="font-serif text-2xl font-bold mb-2 flex items-center gap-2">
                {c.leader_nominee_name ? (
                  <>
                    <Crown size={18} className="text-accent shrink-0" />
                    {c.leader_nominee_name}
                  </>
                ) : (
                  <span className="text-ink-muted">Aucun vote</span>
                )}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-accent">{c.leader_votes} votes en tête</span>
                <span className="text-ink-muted">{c.total_votes} votes total</span>
              </div>
              {c.total_votes > 0 && (
                <div className="mt-3 h-1.5 bg-bg-elev3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-gradient transition-all duration-700"
                    style={{ width: `${(c.leader_votes / Math.max(c.total_votes, 1)) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-gradient-to-br from-accent/15 to-bg-elev border-accent-soft/40" : "bg-bg-elev border-line"}`}>
      <p className="text-xs uppercase tracking-wider text-ink-muted mb-2">{label}</p>
      <p className="font-serif text-3xl font-bold">{value}</p>
      {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}
