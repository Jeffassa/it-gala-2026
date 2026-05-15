import QRCode from "qrcode";
import { useEffect, useRef } from "react";

import type { Gala, Ticket } from "@/lib/types";

/**
 * Ticket IT Gala 2026 « Behind the mask ».
 *
 * Le design (photo, titres, date, lieu, heure, label « Prix : » et cadre dore)
 * est porte par l'image /public/ticket_gala NT.png (1654 x 472 px).
 *
 * 3 overlays dynamiques :
 *   1. Numero du ticket apres "Ticket N°"  — Poppins ExtraLight Italic 9pt VA -10
 *   2. Prix dans le cadre dore             — Poppins Medium Italic
 *   3. QR code centre sur la zone blanche  — + code alphanum juste en dessous
 *
 * Le meme rendu est genere cote serveur (PIL) pour le PDF et l'email :
 * voir backend/app/services/ticket_image.py.
 */

// Positions calibrees sur la template (1654 x 472 px).
// Texte complet "Ticket N°{id}" : le template ne le contient pas.
const POS_NUMBER = { left: "33%", top: "12%" };
const POS_PRICE = { left: "66%", top: "84%" }; // centre du cadre dore
const POS_QR = { right: "5.5%", top: "49%", width: "15%" }; // centre sur l'espace blanc

const DEBUG_OVERLAYS = false;

export function TicketQR({ ticket }: { ticket: Ticket; gala?: Gala | null }) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!qrRef.current) return;
    QRCode.toCanvas(qrRef.current, ticket.code, {
      width: 280,
      margin: 1,
      color: { dark: "#1a0a05", light: "#FFFFFF" },
    });
  }, [ticket.code]);

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 1300 }}>
      <div
        className="relative w-full"
        style={{
          aspectRatio: "1654 / 472",
          backgroundImage: "url('/ticket_gala%20NT.png')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* 1. "Ticket N°{id}" — Poppins ExtraLight Italic, VA -10 */}
        <span
          className="absolute"
          style={{
            left: POS_NUMBER.left,
            top: POS_NUMBER.top,
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 200,
            fontStyle: "italic",
            fontSize: "11pt",
            letterSpacing: "-0.01em",
            color: "#f7e7c4",
            lineHeight: 1,
            whiteSpace: "nowrap",
            outline: DEBUG_OVERLAYS ? "2px solid #ff3b3b" : undefined,
          }}
        >
          Ticket N°{ticket.id}
        </span>

        {/* 2. Prix — Poppins Medium Italic, 3 tailles (chiffres / F / cfa) */}
        <span
          className="absolute"
          style={{
            left: POS_PRICE.left,
            top: POS_PRICE.top,
            transform: "translate(-50%, -50%)",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontStyle: "italic",
            color: "#f7e7c4",
            whiteSpace: "nowrap",
            lineHeight: 1,
            textAlign: "center",
            outline: DEBUG_OVERLAYS ? "2px solid #3bb6ff" : undefined,
          }}
        >
          <span style={{ fontSize: "27px", verticalAlign: "baseline" }}>
            {new Intl.NumberFormat("fr-FR").format(Math.round(ticket.price))}
          </span>
          <span style={{ fontSize: "23px", verticalAlign: "baseline" }}>
            {" F"}
          </span>
          <span style={{ fontSize: "22px", verticalAlign: "baseline" }}>
            cfa
          </span>
        </span>

        {/* 3. QR code + code alphanum, centres sur la zone blanche */}
        <div
          className="absolute"
          style={{
            right: POS_QR.right,
            top: POS_QR.top,
            transform: "translateY(-50%)",
            width: POS_QR.width,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            outline: DEBUG_OVERLAYS ? "2px solid #4eff5b" : undefined,
          }}
        >
          <canvas
            ref={qrRef}
            style={{
              width: "100%",
              height: "auto",
              imageRendering: "pixelated",
              display: "block",
            }}
          />
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(6px, 0.7vw, 9px)",
              color: "#1a0a05",
              fontWeight: 700,
              textAlign: "center",
              marginTop: 4,
              wordBreak: "break-all",
              lineHeight: 1.15,
              letterSpacing: "0.05em",
            }}
          >
            {ticket.code}
          </p>
        </div>
      </div>
    </div>
  );
}
