import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[1000] grid place-items-center p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${size === "lg" ? "max-w-3xl" : "max-w-lg"} bg-bg-elev border border-line rounded-2xl p-7 shadow-elev max-h-[90vh] overflow-y-auto`}
      >
        {title ? (
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl font-serif font-bold">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 grid place-items-center rounded-lg text-ink-muted hover:bg-bg-elev2 hover:text-ink transition"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
