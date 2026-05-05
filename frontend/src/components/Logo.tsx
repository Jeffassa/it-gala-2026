import { Link } from "react-router-dom";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <img 
        src="/logo.png" 
        alt="IT Gala Logo" 
        className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
      />
      {subtitle && (
        <span className="leading-tight border-l border-line pl-3 hidden sm:block">
          <span className="block text-[10px] text-ink-muted font-sans tracking-[0.2em] uppercase whitespace-nowrap">
            {subtitle}
          </span>
        </span>
      )}
    </Link>
  );
}
