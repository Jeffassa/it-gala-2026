import { Html5Qrcode } from "html5-qrcode";
import { Camera, Check, CheckCircle2, ScanLine, ShieldAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { Modal } from "@/components/Modal";
import { apiError, galaApi, scanApi } from "@/lib/api";
import { formatDate, formatDateTime, ticketTypeLabel } from "@/lib/format";
import type { Gala, ScanResult, Ticket } from "@/lib/types";
import { toast } from "@/store/toast";

// Beep court pour feedback audio sur scan reussi
function beep(freq = 880, ms = 120) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.value = 0.15;
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close(); }, ms);
  } catch { /* ignore */ }
}

export default function ControllerPage() {
  const [gala, setGala] = useState<Gala | null>(null);
  const [stats, setStats] = useState({ total_tickets: 0, scanned_tickets: 0, remaining: 0, my_scans: 0 });
  const [recent, setRecent] = useState<Ticket[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const qrRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  // Cache local des codes deja scannes : feedback instantane sans round-trip serveur
  const localCacheRef = useRef<Map<string, ScanResult>>(new Map());

  useEffect(() => { galaApi.active().then(setGala); }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    try {
      const [s, r] = await Promise.all([scanApi.stats(), scanApi.recent(10)]);
      setStats(s); setRecent(r);
    } catch {/* ignore */}
  }

  async function handleCode(code: string) {
    const now = Date.now();
    // Anti-doublon de scan dans une fenetre courte
    if (lastScanRef.current?.code === code && now - lastScanRef.current.at < 1200) return;
    lastScanRef.current = { code, at: now };

    // Cache local : si code deja vu cette session, feedback instantane (pas de round-trip)
    const cached = localCacheRef.current.get(code);
    if (cached) {
      // On affiche immediatement comme "deja scanne"
      const instant: ScanResult = cached.ok
        ? { ok: false, message: "Ticket déjà scanné dans cette session", ticket: cached.ticket, already_scanned: true }
        : cached;
      setLastResult(instant);
      if (instant.already_scanned) toast.warn(instant.message);
      else if (!instant.ok) toast.error(instant.message);
      beep(440, 80);
      return;
    }

    try {
      const res = await scanApi.scan(code);
      localCacheRef.current.set(code, res);
      setLastResult(res);
      if (res.ok) { toast.success(res.message); beep(880, 100); }
      else if (res.already_scanned) { toast.warn(res.message); beep(440, 80); }
      else { toast.error(res.message); beep(220, 200); }
      refresh();
    } catch (err) { toast.error(apiError(err)); beep(220, 300); }
  }

  async function startCamera() {
    setScanning(true);
    try {
      const qr = new Html5Qrcode("scanner-region");
      qrRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        {
          fps: 20,                                   // 2x plus reactif
          qrbox: { width: 280, height: 280 },
          aspectRatio: 1.333,
          disableFlip: false,
        },
        (decoded) => handleCode(decoded.trim()),
        () => undefined
      );
    } catch (err) {
      setScanning(false);
      toast.error("Impossible d'activer la caméra");
    }
  }

  async function stopCamera() {
    try { await qrRef.current?.stop(); await qrRef.current?.clear(); } catch {/* ignore */}
    qrRef.current = null;
    setScanning(false);
  }

  useEffect(() => () => { stopCamera(); }, []);

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleCode(manualCode.trim().toUpperCase());
    setManualCode("");
  }

  return (
    <div className="min-h-screen bg-bg">
      <AppHeader subtitle="Contrôle d'accès" />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="font-serif text-4xl font-bold">Contrôle des tickets</h1>
          <p className="text-ink-muted mt-1">
            {gala ? <>{gala.name} · {formatDate(gala.event_date)} · {gala.location}</> : "Chargement…"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Tickets scannés" value={stats.scanned_tickets} accent />
          <Stat label="Restants" value={stats.remaining} />
          <Stat label="Mes scans" value={stats.my_scans} hint="cette session" />
          <Stat label="Total émis" value={stats.total_tickets} />
        </div>

        <section className="bg-bg-elev border border-line rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl font-bold">Scanner</h2>
            {scanning ? (
              <button onClick={stopCamera} className="btn btn-danger">
                <X size={16} /> Arrêter
              </button>
            ) : (
              <button onClick={startCamera} className="btn btn-primary btn-lg">
                <Camera size={18} /> Contrôler
              </button>
            )}
          </div>

          <div className="relative aspect-[4/3] max-w-2xl mx-auto bg-black rounded-2xl overflow-hidden border border-line">
            <div id="scanner-region" className="absolute inset-0" />
            {!scanning && (
              <div className="absolute inset-0 grid place-items-center text-ink-muted text-center p-8">
                <div className="flex flex-col items-center">
                  <span className="w-16 h-16 grid place-items-center rounded-2xl bg-bg-elev2 border border-line text-ink-muted mb-4">
                    <Camera size={28} strokeWidth={1.5} />
                  </span>
                  <p className="font-medium">Cliquez sur « Contrôler » pour activer la caméra</p>
                  <p className="text-xs mt-2">Le scan QR se fait en temps réel.</p>
                </div>
              </div>
            )}
            {scanning && (
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square border-2 border-accent rounded-xl"
                  style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }}
                >
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-[3px] border-l-[3px] border-accent-bright" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-[3px] border-r-[3px] border-accent-bright" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-[3px] border-l-[3px] border-accent-bright" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-[3px] border-r-[3px] border-accent-bright" />
                  <div
                    className="absolute inset-x-0 h-0.5 animate-scan-line"
                    style={{ background: "linear-gradient(90deg, transparent, #FBC23A, transparent)" }}
                  />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={submitManual} className="mt-5 max-w-md mx-auto flex gap-2">
            <input
              className="input flex-1 font-mono"
              placeholder="Saisie manuelle: GIA-XXXXXX"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            />
            <button type="submit" className="btn btn-secondary">
              <ScanLine size={16} /> Valider
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Derniers tickets validés</h2>
          {recent.length === 0 ? (
            <p className="text-center py-8 text-ink-muted">Aucun ticket scanné pour l'instant.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 bg-bg-elev border border-line rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 grid place-items-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Check size={18} />
                    </span>
                    <div>
                      <p className="font-medium">{t.buyer_full_name}</p>
                      <p className="text-xs text-ink-muted">
                        <span className="font-mono">{t.code}</span> · {ticketTypeLabel(t.type)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-ink-muted">{t.scanned_at ? formatDateTime(t.scanned_at) : ""}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <ResultModal result={lastResult} onClose={() => setLastResult(null)} />
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: number | string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "bg-gradient-to-br from-accent/15 to-bg-elev border-accent-soft/40" : "bg-bg-elev border-line"}`}>
      <p className="text-xs uppercase tracking-wider text-ink-muted mb-2">{label}</p>
      <p className="font-serif text-3xl font-bold">{value}</p>
      {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

function ResultModal({ result, onClose }: { result: ScanResult | null; onClose: () => void }) {
  if (!result) return null;
  const status = result.ok ? "ok" : result.already_scanned ? "warn" : "err";
  const colors = {
    ok: { bg: "from-emerald-500/20", iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40", Icon: CheckCircle2 },
    warn: { bg: "from-amber-500/20", iconBg: "bg-amber-500/15 text-amber-400 border-amber-500/40", Icon: ShieldAlert },
    err: { bg: "from-red-500/20", iconBg: "bg-red-500/15 text-red-400 border-red-500/40", Icon: X },
  }[status];

  return (
    <Modal open={true} onClose={onClose}>
      <div className={`text-center py-4 -mt-2 -mx-2 rounded-xl bg-gradient-to-b ${colors.bg} to-transparent`}>
        <div className={`w-20 h-20 mx-auto rounded-full grid place-items-center border ${colors.iconBg}`}>
          <colors.Icon size={40} strokeWidth={1.6} />
        </div>
        <h3 className="font-serif text-2xl font-bold mt-4">{result.message}</h3>
        {result.ticket && (
          <div className="mt-6 text-left bg-bg-elev2 rounded-xl p-5 space-y-1.5 text-sm">
            <Row k="Acheteur" v={result.ticket.buyer_full_name} />
            <Row k="Type" v={ticketTypeLabel(result.ticket.type)} />
            <Row k="Code" v={result.ticket.code} mono />
            {result.ticket.scanned_at && <Row k="Scanné le" v={formatDateTime(result.ticket.scanned_at)} />}
          </div>
        )}
        <button onClick={onClose} className="btn btn-primary btn-lg mt-6 w-full">Continuer</button>
      </div>
    </Modal>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-muted">{k}</span>
      <span className={mono ? "font-mono" : "font-medium"}>{v}</span>
    </div>
  );
}
