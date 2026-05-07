import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { studentApi } from "@/lib/api";
import type { Student } from "@/lib/types";

import { Spinner } from "./Spinner";

/**
 * Champ texte avec auto-completion sur les etudiants ESATIC.
 * - L'utilisateur tape un nom / matricule / email / classe
 * - Un dropdown s'affiche avec les correspondances
 * - Au clic sur une suggestion : onPick est appele avec le Student complet
 *   et value est mis a jour avec son nom complet
 *
 * Le parent peut aussi modifier la valeur librement (mode saisie manuelle).
 *
 * Props :
 *   value      : texte actuel (controle)
 *   onChange   : callback texte (saisie libre)
 *   onPick     : callback Student (sur selection d'une suggestion)
 *   placeholder, required, autoFocus, className : pass-through
 */
export function StudentAutocomplete({
  value, onChange, onPick, placeholder = "Tapez un nom, matricule, classe…",
  required, autoFocus, className = "input",
}: {
  value: string;
  onChange: (v: string) => void;
  onPick: (s: Student) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const [results, setResults] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search 200 ms
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const list = await studentApi.list({ q, limit: 8 });
        setResults(list);
        setOpen(list.length > 0);
        setHighlight(0);
      } catch {
        setResults([]); setOpen(false);
      } finally { setSearching(false); }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  // Click outside -> close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(s: Student) {
    onPick(s);
    onChange(s.full_name);
    setOpen(false);
    setResults([]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(results[highlight]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
        <input
          className={`${className} pl-10 pr-10`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size={14} />
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-bg-elev2 border border-line rounded-xl shadow-xl divide-y divide-line/60"
          role="listbox"
        >
          {results.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => pick(s)}
              className={`w-full text-left px-3.5 py-2.5 transition flex items-center gap-3 ${i === highlight ? "bg-accent/10" : "hover:bg-bg-elev3"}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{s.full_name}</p>
                <p className="text-[11px] text-ink-muted truncate">
                  <span className="font-mono">{s.matricule}</span>
                  {s.classe && <> · {s.classe}</>}
                  {s.promotion && <> · {s.promotion}</>}
                </p>
              </div>
              {s.gender && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${s.gender === "M" ? "bg-blue-500/15 text-blue-300" : "bg-pink-500/15 text-pink-300"}`}>
                  {s.gender}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
