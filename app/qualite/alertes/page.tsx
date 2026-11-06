"use client";

import { Mail, MessageSquareText, RotateCcw, Smartphone } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation";
import { Bouton, Pastille } from "@/components/ui";
import { roleLisible } from "@/components/en-tete";

const ICONES = { email: Mail, sms: MessageSquareText, push: Smartphone };

export default function Alertes() {
  const t = useT();
  const { langue } = useLangue();
  const { etat, envoyer } = useSimulation();
  const date = (iso: string) => new Date(iso).toLocaleString(langue === "fr" ? "fr-CH" : "en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const modifies = etat.envois.filter((e) => e.modifieAvantEnvoi).length;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-bold">{t("Alertes qualité", "Quality alerts")}</h2>
        {etat.alertes.length === 0 ? (
          <p className="mt-3 text-encre-2">{t("Aucune alerte pour l'instant. Donnez une note de 1 ou 2 étoiles dans « Notation dans les deux sens ».", "No alerts yet. Give a 1 or 2 star rating in “Two-way ratings”.")}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {etat.alertes.map((a) => (
              <li key={a.id} className="rounded-xl border border-trait bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-alerte">{a.titre}</p>
                  <span className="text-xs text-encre-3">{date(a.date)}</span>
                </div>
                <p className="mt-1 text-sm text-encre-2">{a.detail}</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {a.destinataires.map((d, i) => {
                    const Icone = ICONES[d.canal];
                    return <li key={i}><Pastille><Icone className="h-3 w-3" />{roleLisible(d.role, t)}</Pastille></li>;
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold">{t("Journal des envois validés", "Log of approved sends")}</h2>
        <p className="mt-1 text-sm text-encre-2">
          {t(`${etat.envois.length} envoi(s) simulé(s), dont ${modifies} modifié(s) avant l'envoi. Ce taux de correction mesure la qualité des brouillons.`,
            `${etat.envois.length} simulated send(s), ${modifies} edited before sending. This correction rate measures the quality of the drafts.`)}
        </p>
        <ul className="mt-3 space-y-3">
          {etat.envois.map((e) => {
            const Icone = ICONES[e.canal];
            return (
              <li key={e.id} className="rounded-xl border border-trait bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Icone className="h-4 w-4 text-sapin" />
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{e.destinataire}</p>
                  <span className="text-xs text-encre-3">{date(e.date)}</span>
                </div>
                {e.objet && <p className="mt-2 text-sm font-medium">{e.objet}</p>}
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm text-encre-2">{e.corps}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {e.modifieAvantEnvoi && <Pastille ton="attention">{t("modifié avant l'envoi", "edited before sending")}</Pastille>}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-8 border-t border-trait pt-5">
          <Bouton variante="contour" onClick={() => { if (confirm(t("Effacer les alertes, notes, envois et fiches modifiées de cette démonstration ?", "Clear this demo's alerts, ratings, sends and edited sheets?"))) envoyer({ type: "reinitialiser" }); }}>
            <RotateCcw className="h-4 w-4" /> {t("Remettre la démonstration à zéro", "Reset the demo")}
          </Bouton>
        </div>
      </section>
    </div>
  );
}
