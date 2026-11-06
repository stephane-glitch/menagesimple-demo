"use client";

// Fenêtre par-dessus la page, pour une tâche courte (alerte de zone, message à relire).

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Fenetre({ titre, ouverte, onFermer, children, large = false }: {
  titre: string;
  ouverte: boolean;
  onFermer: () => void;
  children: React.ReactNode;
  large?: boolean;
}) {
  const t = useT();
  const boite = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouverte) return;
    const avant = document.activeElement as HTMLElement | null;
    boite.current?.focus();
    const echap = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    document.addEventListener("keydown", echap);
    const defilement = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", echap);
      document.body.style.overflow = defilement;
      avant?.focus();
    };
  }, [ouverte, onFermer]);

  if (!ouverte) return null;
  return (
    <div className="fixed inset-0 z-[1400] flex items-end justify-center bg-encre/45 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onFermer()}>
      <div
        ref={boite}
        role="dialog"
        aria-modal="true"
        aria-label={titre}
        tabIndex={-1}
        className={`arriver max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-[0_30px_70px_-20px_rgba(23,21,43,0.55)] outline-none sm:rounded-2xl sm:p-7 ${large ? "sm:max-w-[760px]" : "sm:max-w-[520px]"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-extrabold leading-tight">{titre}</h2>
          <button type="button" onClick={onFermer} aria-label={t("Fermer", "Close")} className="-mr-1 -mt-1 rounded-full p-2 text-encre-2 hover:bg-sapin-clair hover:text-encre">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
