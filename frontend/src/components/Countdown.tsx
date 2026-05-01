import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  return { days, hours, minutes, seconds, finished: ms <= 0 };
}

export function Countdown({ target, compact = false }: { target: Date | string; compact?: boolean }) {
  const t = typeof target === "string" ? new Date(target) : target;
  const [d, setD] = useState(diff(t));

  useEffect(() => {
    setD(diff(t));
    const id = setInterval(() => setD(diff(t)), 1000);
    return () => clearInterval(id);
  }, [t]);

  if (d.finished) {
    return (
      <div className="text-center inline-flex items-center gap-3 justify-center">
        <Sparkles size={22} className="text-accent" />
        <p className="font-serif text-3xl accent-text font-bold">C'est le grand soir</p>
        <Sparkles size={22} className="text-accent" />
      </div>
    );
  }

  const cells = [
    { label: "Jours", value: d.days },
    { label: "Heures", value: d.hours },
    { label: "Minutes", value: d.minutes },
    { label: "Secondes", value: d.seconds },
  ];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-3 font-mono text-sm tabular-nums">
        {cells.map((c) => (
          <span key={c.label} className="flex items-baseline gap-1">
            <span className="font-bold accent-text text-lg">{String(c.value).padStart(2, "0")}</span>
            <span className="text-ink-muted text-xs uppercase">{c.label.slice(0, 1)}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-5 justify-center">
      {cells.map((c) => (
        <div key={c.label} className="flex-1 max-w-[110px] bg-bg-elev2 border border-line rounded-2xl p-4 sm:p-5 text-center">
          <p className="font-serif text-3xl sm:text-5xl font-black accent-text leading-none tabular-nums">
            {String(c.value).padStart(2, "0")}
          </p>
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-ink-muted mt-2">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
