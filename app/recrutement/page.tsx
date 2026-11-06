"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, TriangleAlert, Users } from "lucide-react";
import { formaterNombre, useLangue, useT } from "@/lib/i18n";
import { DEMANDES, PRESTATIONS, zoneDe, type Demande } from "@/lib/donnees/demandes";
import { Pastille } from "@/components/ui";
import { Fenetre } from "@/components/fenetre";

function Alerte({ demande, onOuvrir }: { demande: Demande; onOuvrir: () => void }) {
  const t = useT();
  const z = zoneDe(demande)!;
  const id = `infobulle-${demande.id}`;
  // Info-bulle en position fixe, hors du tableau : elle n'est jamais coupée par son cadre.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const montrer = (e: React.SyntheticEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 128), window.innerWidth - 128), y: r.top });
  };
  return (
    <span className="inline-flex">
      <button
        type="button"
        onClick={onOuvrir}
        onMouseEnter={montrer}
        onMouseLeave={() => setPos(null)}
        onFocus={montrer}
        onBlur={() => setPos(null)}
        aria-describedby={id}
        aria-label={t(`Pas assez d'agents à ${demande.commune}`, `Not enough cleaners in ${demande.commune}`)}
        className="grid h-8 w-8 place-items-center rounded-full text-attention transition hover:bg-attention-fond focus-visible:bg-attention-fond"
      >
        <TriangleAlert className="h-5 w-5" strokeWidth={2} />
      </button>
      {pos && createPortal(<span
        id={id}
        role="tooltip"
        style={{ left: pos.x, top: pos.y - 8 }}
        className="pointer-events-none fixed z-[2000] w-60 -translate-x-1/2 -translate-y-full rounded-lg bg-encre px-3 py-2 text-xs leading-snug text-fond shadow-lg"
      >
        {t(`Pas assez de monde à ${demande.commune} : vos agents couvrent ${z.couverture} % des heures demandées cette semaine. Cliquez pour agir.`,
          `Not enough people in ${demande.commune}: your cleaners cover ${z.couverture}% of the hours requested this week. Click to act.`)}
      </span>, document.body)}
    </span>
  );
}

const STATUTS = {
  "a-attribuer": { fr: "À attribuer", en: "To assign", ton: "attention" as const },
  attribuee: { fr: "Attribuée", en: "Assigned", ton: "ok" as const },
  "en-attente": { fr: "En attente du client", en: "Awaiting client", ton: "neutre" as const },
};

export default function Demandes() {
  const t = useT();
  const { langue } = useLangue();
  const [seulementManque, setSeulementManque] = useState(false);
  const [ouverte, setOuverte] = useState<Demande | null>(null);
  const liste = useMemo(() => (seulementManque ? DEMANDES.filter((d) => zoneDe(d)?.enManque) : DEMANDES), [seulementManque]);
  const nbManque = DEMANDES.filter((d) => zoneDe(d)?.enManque).length;
  const date = (iso: string) => iso.split("-").reverse().slice(0, 2).join(".");
  const zone = ouverte ? zoneDe(ouverte)! : null;
  const manque = zone ? zone.tension.demande - zone.tension.offre : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-encre-2">
          {t(`${DEMANDES.length} demandes reçues cette semaine, dont `, `${DEMANDES.length} requests received this week, `)}
          <span className="font-semibold text-attention">{t(`${nbManque} dans une zone en manque d'agents`, `${nbManque} in areas short of cleaners`)}</span>.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--sapin)]" checked={seulementManque} onChange={(e) => setSeulementManque(e.target.checked)} />
          {t("Seulement les zones en manque", "Short-staffed areas only")}
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-trait bg-surface">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-trait bg-fond text-xs text-encre-2">
            <tr>
              <th className="w-10 px-2 py-3"><span className="sr-only">{t("Alerte", "Alert")}</span></th>
              <th className="px-3 py-3 font-semibold">{t("Reçue", "Received")}</th>
              <th className="px-3 py-3 font-semibold">{t("Client", "Client")}</th>
              <th className="px-3 py-3 font-semibold">{t("Adresse", "Address")}</th>
              <th className="px-3 py-3 font-semibold">{t("Prestation", "Service")}</th>
              <th className="px-3 py-3 font-semibold">{t("Créneau souhaité", "Requested slot")}</th>
              <th className="px-3 py-3 font-semibold">{t("Statut", "Status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-trait">
            {liste.map((d) => {
              const z = zoneDe(d);
              const s = STATUTS[d.statut];
              return (
                <tr key={d.id} className={z?.enManque ? "bg-attention-fond/40" : ""}>
                  <td className="px-2 py-3 text-center">{z?.enManque && <Alerte demande={d} onOuvrir={() => setOuverte(d)} />}</td>
                  <td className="chiffres px-3 py-3 text-encre-2">{date(d.recue)}<span className="block text-xs text-encre-3">{d.id}</span></td>
                  <td className="px-3 py-3 font-semibold">{d.client}</td>
                  <td className="px-3 py-3">{d.rue}<span className="block text-xs text-encre-2">{d.npa} {d.commune}</span></td>
                  <td className="px-3 py-3">
                    {t(PRESTATIONS[d.prestation].fr, PRESTATIONS[d.prestation].en)}
                    <span className="block text-xs text-encre-2">
                      {formaterNombre(d.heures, langue, d.heures % 1 ? 1 : 0)} h · {d.frequence === "hebdomadaire" ? t("chaque semaine", "weekly") : d.frequence === "bimensuel" ? t("toutes les 2 semaines", "every 2 weeks") : t("ponctuel", "one-off")}
                    </span>
                  </td>
                  <td className="px-3 py-3">{t(d.creneau.fr, d.creneau.en)}</td>
                  <td className="px-3 py-3">
                    <Pastille ton={s.ton}>{t(s.fr, s.en)}</Pastille>
                    {d.agent && <span className="mt-1 block text-xs text-encre-2">{d.agent}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-encre-3">{t("Clients et adresses inventés pour la démonstration.", "Clients and addresses invented for the demo.")}</p>

      <Fenetre
        titre={ouverte ? t(`Pas assez d'agents à ${ouverte.commune}`, `Not enough cleaners in ${ouverte.commune}`) : ""}
        ouverte={!!ouverte}
        onFermer={() => setOuverte(null)}
      >
        {ouverte && zone && (
          <>
            <p className="text-encre-2">
              {t(`Demande de ${ouverte.client}, ${ouverte.rue}, ${ouverte.npa} ${ouverte.commune} : ${t(PRESTATIONS[ouverte.prestation].fr, PRESTATIONS[ouverte.prestation].en).toLowerCase()}, ${ouverte.creneau.fr}.`,
                `Request from ${ouverte.client}, ${ouverte.rue}, ${ouverte.npa} ${ouverte.commune}: ${PRESTATIONS[ouverte.prestation].en.toLowerCase()}, ${ouverte.creneau.en}.`)}
            </p>
            <dl className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-surface p-4">
              <div><dt className="text-xs text-encre-2">{t("Heures demandées", "Hours requested")}</dt><dd className="chiffres text-xl font-bold">{zone.tension.demande} h</dd></div>
              <div><dt className="text-xs text-encre-2">{t("Heures disponibles", "Hours available")}</dt><dd className="chiffres text-xl font-bold">{zone.tension.offre} h</dd></div>
              <div><dt className="text-xs text-encre-2">{t("Couvert", "Covered")}</dt><dd className="chiffres text-xl font-bold text-alerte">{zone.couverture} %</dd></div>
            </dl>
            <p className="mt-4 text-sm text-encre-2">
              {t(`Il manque ${manque} heures cette semaine dans la zone de ${ouverte.commune}, surtout le ${zone.tension.creneauCritique.fr}. À 43,90 CHF l'heure, cela fait ${formaterNombre(manque * 43.9, "fr")} CHF de ménages qui ne peuvent pas être vendus.`,
                `${manque} hours are missing this week around ${ouverte.commune}, mostly ${zone.tension.creneauCritique.en}. At CHF 43.90 an hour, that's CHF ${formaterNombre(manque * 43.9, "en")} of cleaning that can't be sold.`)}
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link href={`/recrutement/travail-swiss?commune=${encodeURIComponent(ouverte.commune)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-sapin px-5 font-semibold text-sur-sapin transition hover:bg-sapin-fonce">
                <Search className="h-4 w-4" /> {t("Rechercher de nouveaux agents", "Find new cleaners")}
              </Link>
              <Link href={`/recrutement/parrainage?zone=${encodeURIComponent(ouverte.commune)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-citron px-5 font-semibold text-encre transition hover:bg-citron-fonce">
                <Users className="h-4 w-4" /> {t("Lancer le parrainage", "Start a referral drive")}
              </Link>
            </div>
          </>
        )}
      </Fenetre>
    </div>
  );
}
