import { Crown, Download, FileText, Sparkles, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import { Empty } from "@/components/Empty";
import { Spinner } from "@/components/Spinner";
import { categoryApi, certificateApi, galaApi, nomineeApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { Category, Gala, Nominee } from "@/lib/types";

export default function AdminCertificates() {
  const [galas, setGalas] = useState<Gala[]>([]);
  const [galaId, setGalaId] = useState<number | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [catId, setCatId] = useState<number | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    galaApi.list().then((g) => {
      setGalas(g);
      const a = g.find((x) => x.is_active) ?? g[0];
      if (a) setGalaId(a.id);
    });
  }, []);
  useEffect(() => {
    if (!galaId) return;
    categoryApi.list(galaId).then((c) => { setCats(c); setCatId(c[0]?.id ?? null); });
  }, [galaId]);
  useEffect(() => {
    if (!catId) { setNominees([]); setLoading(false); return; }
    setLoading(true);
    nomineeApi.list(catId).then((n) => { setNominees(n); setLoading(false); });
  }, [catId]);

  async function downloadCertificate(url: string, filename: string) {
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) return;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl; a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  const sorted = [...nominees].sort((a, b) => b.votes_count - a.votes_count);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-bold">Certificats</h2>
        <p className="text-ink-muted mt-1">Générez et téléchargez les certificats PDF des nominés et lauréats.</p>
      </div>

      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-2">
          <label className="label">Gala</label>
          <select className="input min-w-[200px]" value={galaId ?? ""} onChange={(e) => setGalaId(+e.target.value)}>
            {galas.map((g) => <option key={g.id} value={g.id}>{g.name} {g.edition_year}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="label">Catégorie</label>
          <select className="input min-w-[200px]" value={catId ?? ""} onChange={(e) => setCatId(+e.target.value)}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {catId && (
          <button
            onClick={() => downloadCertificate(certificateApi.winnerUrl(catId), `certificat-laureat.pdf`)}
            className="btn btn-primary"
          >
            <Crown size={16} /> Certificat du lauréat
          </button>
        )}
      </div>

      {loading ? <Spinner /> : !catId ? (
        <Empty Icon={Trophy} title="Aucune catégorie disponible" />
      ) : sorted.length === 0 ? (
        <Empty Icon={Sparkles} title="Aucun nominé dans cette catégorie" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((n, i) => (
            <div key={n.id} className={`bg-bg-elev border rounded-2xl p-5 ${i === 0 && n.votes_count > 0 ? "border-accent" : "border-line"}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="font-serif text-3xl accent-text font-black w-10">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{n.name}</p>
                  <p className="text-xs text-ink-muted truncate">{n.school_promotion ?? "—"}</p>
                </div>
                {i === 0 && n.votes_count > 0 && (
                  <span className="badge badge-accent inline-flex items-center gap-1"><Crown size={12} /> Lauréat</span>
                )}
              </div>
              <p className="text-xs text-ink-muted mb-4">{n.votes_count} vote(s)</p>
              <button
                onClick={() => downloadCertificate(certificateApi.nomineeUrl(n.id), `certificat-${n.name}.pdf`)}
                className="btn btn-secondary btn-sm w-full"
              >
                <FileText size={14} /> Certificat PDF
                <Download size={14} className="ml-auto" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
