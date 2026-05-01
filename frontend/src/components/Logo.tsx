import { Link } from "react-router-dom";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <Link to="/" className="flex items-center gap-3 font-serif group">
      <span className="relative w-10 h-10 grid place-items-center bg-primary-gradient rounded-xl shadow-primary overflow-hidden border border-primary-soft/40">
        <span className="absolute inset-0 bg-accent-gradient opacity-0 group-hover:opacity-30 transition" />
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent-bright" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-bold tracking-tight">
          IT <em className="not-italic accent-text">Gala</em>
        </span>
        {subtitle ? (
          <span className="block text-[10px] text-ink-muted font-sans tracking-[0.2em] uppercase">{subtitle}</span>
        ) : (
          <span className="block text-[10px] text-ink-faint font-sans tracking-[0.2em] uppercase">Édition 2026</span>
        )}
      </span>
    </Link>
  );
}
