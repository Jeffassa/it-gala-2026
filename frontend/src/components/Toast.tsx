import { Check, Info, TriangleAlert, X } from "lucide-react";

import { useToastStore } from "@/store/toast";

const VARIANT: Record<string, { className: string; Icon: any }> = {
  default: { className: "border-l-accent text-accent", Icon: Info },
  success: { className: "border-l-emerald-500 text-emerald-300", Icon: Check },
  danger: { className: "border-l-red-500 text-red-300", Icon: X },
  warning: { className: "border-l-amber-500 text-amber-300", Icon: TriangleAlert },
};

export function ToastStack() {
  const items = useToastStore((s) => s.items);
  return (
    <div className="fixed bottom-6 right-6 z-[2000] flex flex-col gap-2.5">
      {items.map((t) => {
        const v = VARIANT[t.variant] ?? VARIANT.default;
        return (
          <div
            key={t.id}
            className={`min-w-[280px] flex items-start gap-3 px-5 py-3.5 rounded-xl bg-bg-elev2 border border-line border-l-[3px] text-sm shadow-elev animate-fade-in ${v.className}`}
          >
            <span className="mt-0.5 shrink-0">
              <v.Icon size={18} strokeWidth={2} />
            </span>
            <span className="text-ink leading-snug">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
