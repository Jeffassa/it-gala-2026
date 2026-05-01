export function formatMoney(value: number, currency = "FCFA"): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} ${currency}`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export function roleLabel(role: string): string {
  return {
    super_admin: "Super Admin",
    cashier: "Caissière",
    controller: "Contrôleur",
    participant: "Participant",
  }[role] ?? role;
}

export function ticketTypeLabel(t: string): string {
  return { solo: "Solo", duo: "Duo", gbonhi: "Gbonhi" }[t] ?? t;
}
