import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Empty({
  Icon = Inbox,
  title,
  hint,
  action,
}: {
  Icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 px-6">
      <span className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-bg-elev2 border border-line text-ink-muted mb-4">
        <Icon size={28} strokeWidth={1.5} />
      </span>
      <p className="text-base font-medium">{title}</p>
      {hint ? <p className="text-sm text-ink-muted mt-1.5 max-w-sm mx-auto">{hint}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
