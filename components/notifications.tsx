"use client";

// Affiche, en bas à droite, l'arrivée d'une alerte simulée chez chaque destinataire.

import { useEffect, useRef, useState } from "react";
import { Mail, MessageSquareText, Smartphone, X } from "lucide-react";
import { useSimulation, type Alerte } from "@/lib/simulation";
import { useT } from "@/lib/i18n";
import { roleLisible } from "./en-tete";

const ICONES = { email: Mail, sms: MessageSquareText, push: Smartphone };

export function Notifications() {
  const t = useT();
  const { etat } = useSimulation();
  const [visibles, setVisibles] = useState<Alerte[]>([]);
  const vues = useRef<Set<string> | null>(null);

  useEffect(() => {
    // Au premier rendu, les alertes déjà enregistrées ne sont pas rejouées.
    if (vues.current === null) {
      vues.current = new Set(etat.alertes.map((a) => a.id));
      return;
    }
    const nouvelles = etat.alertes.filter((a) => !vues.current!.has(a.id));
    if (nouvelles.length === 0) return;
    nouvelles.forEach((a) => vues.current!.add(a.id));
    setVisibles((v) => [...nouvelles, ...v].slice(0, 3));
    const ids = nouvelles.map((a) => a.id);
    const minuterie = setTimeout(() => setVisibles((v) => v.filter((a) => !ids.includes(a.id))), 9000);
    return () => clearTimeout(minuterie);
  }, [etat.alertes]);

  if (visibles.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[1300] flex w-[min(92vw,400px)] flex-col gap-3">
      {visibles.map((a) => (
        <div key={a.id} role="status" className="arriver rounded-xl border border-alerte/30 bg-surface p-4 shadow-[0_18px_40px_-12px_rgba(23,21,43,0.35)]">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-alerte" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-alerte">{a.titre}</p>
              <p className="mt-1 text-xs text-encre-2">{t("Alerte envoyée (simulation) à :", "Alert sent (simulated) to:")}</p>
              <ul className="mt-2 space-y-1.5">
                {a.destinataires.map((d, i) => {
                  const Icone = ICONES[d.canal];
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Icone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sapin" strokeWidth={2} />
                      <span>
                        <span className="font-semibold">{roleLisible(d.role, t)}</span>
                        <span className="text-encre-3"> · {d.canal === "email" ? "e-mail" : d.canal === "sms" ? "SMS" : t("notification", "push")}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <button type="button" onClick={() => setVisibles((v) => v.filter((x) => x.id !== a.id))} aria-label={t("Fermer", "Close")} className="rounded p-1 text-encre-3 hover:text-encre">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
