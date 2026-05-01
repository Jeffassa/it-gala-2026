import { Calendar, MapPin, ScanLine, Sparkles } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef } from "react";

import { formatDate, formatMoney, ticketTypeLabel } from "@/lib/format";
import type { Gala, Ticket } from "@/lib/types";

export function TicketQR({ ticket, gala }: { ticket: Ticket; gala?: Gala | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    QRCode.toCanvas(ref.current, ticket.code, {
      width: 200,
      margin: 1,
      color: { dark: "#0E0808", light: "#FFFFFF" },
    });
  }, [ticket.code]);

  return (
    <div className="relative max-w-sm mx-auto rounded-3xl overflow-hidden border border-accent-soft/40 shadow-elev"
         style={{ background: "linear-gradient(180deg, #1A1010 0%, #0E0808 100%)" }}>
      {/* Decorative accents */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-accent/15 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/30 blur-3xl rounded-full pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 pt-6 pb-2 flex items-center justify-between">
        <div className="font-serif font-bold text-lg">
          IT <span className="accent-text">Gala</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-accent">Édition {gala?.edition_year ?? 2026}</span>
      </div>

      {/* Title */}
      <div className="relative px-6 text-center pt-3 pb-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent mb-2 inline-flex items-center gap-1.5 justify-center">
          <Sparkles size={12} /> Votre billet d'entrée
        </p>
        <h3 className="font-serif text-2xl font-bold leading-tight">
          {gala?.name ?? "IT Gala"}
        </h3>
        <p className="text-[11px] text-ink-muted mt-1 italic">« {gala?.theme ?? "L'innovation au cœur de l'excellence"} »</p>
      </div>

      {/* Ticket type badge */}
      <div className="relative px-6 pb-4 text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-gradient border border-accent-soft/40 text-xs font-bold tracking-[0.2em] uppercase">
          Ticket {ticketTypeLabel(ticket.type)}
        </span>
      </div>

      {/* QR */}
      <div className="relative px-6 pb-3">
        <div className="bg-white rounded-2xl p-4 mx-auto inline-block w-full text-center">
          <canvas ref={ref} className="mx-auto" />
        </div>
        <p className="text-center font-mono text-sm tracking-[0.18em] mt-3 accent-text font-bold">{ticket.code}</p>
        <p className="text-center text-[11px] text-ink-muted mt-1 inline-flex items-center gap-1.5 w-full justify-center">
          <ScanLine size={11} /> À présenter à l'entrée pour validation
        </p>
      </div>

      {/* Dashed divider */}
      <div className="relative px-6 my-2">
        <div className="border-t border-dashed border-accent-soft/30" />
      </div>

      {/* Details */}
      <div className="relative px-6 pb-6 space-y-2 text-sm">
        <Row k="Acheteur" v={ticket.buyer_full_name} />
        {ticket.partner_full_name && <Row k="Partenaire" v={ticket.partner_full_name} />}
        {ticket.group_size && <Row k="Groupe" v={`${ticket.group_size} personnes`} />}
        <Row k="Email" v={ticket.buyer_email} />
        {gala && (
          <Row
            k={
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} /> Date
              </span>
            }
            v={formatDate(gala.event_date)}
          />
        )}
        {gala && (
          <Row
            k={
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} /> Lieu
              </span>
            }
            v={gala.location}
          />
        )}
        <div className="pt-3 mt-3 border-t border-line flex items-center justify-between">
          <span className="text-ink-muted text-xs uppercase tracking-wider">Total payé</span>
          <span className="font-serif accent-text font-bold text-2xl leading-none">{formatMoney(ticket.price)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="relative bg-bg/80 border-t border-line px-6 py-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-faint">© {gala?.edition_year ?? 2026} IT Gala — Strictement personnel</p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-muted text-xs">{k}</span>
      <span className="text-ink font-medium text-right truncate">{v}</span>
    </div>
  );
}
