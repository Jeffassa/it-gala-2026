export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
  const cls = size === "lg" ? "w-14 h-14 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <span className={`inline-grid place-items-center rounded-full bg-primary-gradient text-white font-bold border border-primary-soft/40 ${cls}`}>
      {initials || "?"}
    </span>
  );
}
