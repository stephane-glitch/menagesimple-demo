"use client";

import { useMemo, useState } from "react";
import { AlarmClock, CircleOff, RotateCcw, UserRoundCheck } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { AGENTS, agent, client, PASSAGES_ANA } from "@/lib/donnees";
import { classerRemplacants, primeUrgence, PRIME_URGENCE_CHF_H, type Candidat } from "@/lib/regles/remplacement";
import { formaterHeure } from "@/lib/regles/itineraire";
import { useSimulation } from "@/lib/simulation";
import { Bouton, Pastille } from "@/components/ui";
import { Brouillon } from "@/components/brouillon";

// Passage concerné : M. Favre, avenue de la Harpe, 11:43 – 13:13 (démonstration).
const PASSAGE = PASSAGES_ANA[2];
const CLIENT = client(PASSAGE.clientId);
const DEBUT = 11 * 60 + 43;

// Situation fictive du jour : qui est déjà pris, qui connaît déjà M. Favre, qui il a refusé.
const OCCUPES = new Set(["A003", "A005", "A009", "A014", "A018", "A022"]);
const CONNAISSENT = new Set(["A011"]);
const REFUSES = new Set(["A006"]);

const RAISONS: Record<string, [string, string]> = {
  connait: ["connaît déjà ce client", "already knows this client"],
  proche: ["à moins de 3 km", "under 3 km away"],
  fiable: ["très fiable", "very reliable"],
  note: ["excellentes notes des clients", "highly rated by clients"],
};

export default function Absences() {
  const t = useT();
  const { langue } = useLangue();
  const { etat, envoyer } = useSimulation();
  const [motif, setMotif] = useState("");
  const [retard, setRetard] = useState<number | null>(null);
  const declare = etat.absence?.passageId === PASSAGE.id ? etat.absence : null;
  const [choisi, setChoisi] = useState<string | null>(null);

  const propositions = useMemo(() => {
    const candidats: Candidat[] = AGENTS.filter((a) => a.id !== "A001").map((a) => ({
      id: a.id, position: a.position, noteMoyenne: a.noteMoyenne, fiabilite: a.fiabilite,
      connaitLeClient: CONNAISSENT.has(a.id), occupe: OCCUPES.has(a.id), refuseParLeClient: REFUSES.has(a.id),
    }));
    return classerRemplacants(CLIENT.position, candidats, 3);
  }, []);

  const prime = primeUrgence(3, PASSAGE.dureeMin / 60);
  const remplacant = choisi ? agent(choisi) : null;
  const fiche = etat.fiches[CLIENT.id] ?? CLIENT.fiche;

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="telephone mx-auto w-full max-w-[380px] self-start rounded-[2.2rem] border-[10px] border-encre bg-fond p-4 shadow-[0_30px_60px_-30px_rgba(23,21,43,0.6)]">
        <p className="text-center text-xs text-encre-3">{t("Application de l'agent", "Cleaner's app")} · 08:40</p>
        <p className="mt-3 text-xs font-semibold text-encre-2">{t("Prochain passage", "Next visit")} · {formaterHeure(DEBUT)}</p>
        <h3 className="text-xl font-extrabold">{CLIENT.nom}</h3>
        <p className="text-sm text-encre-2">{CLIENT.adresse}, {CLIENT.commune}</p>

        <p className="mt-5 text-sm font-semibold">{t("Un imprévu ?", "Something came up?")}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[15, 30].map((m) => (
            <button key={m} type="button" onClick={() => setRetard(m)} aria-pressed={retard === m}
              className={`flex min-h-14 flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${retard === m ? "border-attention bg-attention-fond text-attention" : "border-trait bg-surface"}`}>
              <AlarmClock className="mb-0.5 h-4 w-4" /> {t("Retard", "Late")} +{m} min
            </button>
          ))}
        </div>
        {retard && !declare && (
          <p className="mt-2 rounded-lg bg-attention-fond px-3 py-2 text-xs text-attention">
            {t(`Le client est prévenu par SMS : « Votre agent arrivera vers ${formaterHeure(DEBUT + retard)}. » (simulation)`, `The client is notified by text: “Your cleaner will arrive around ${formaterHeure(DEBUT + retard)}.” (simulated)`)}
          </p>
        )}
        <p className="mt-4 text-sm font-semibold">{t("Je ne peux pas venir", "I can't come")}</p>
        {declare ? (
          <>
            <p className="mt-2 rounded-lg bg-ok-fond px-3 py-2 text-sm text-ok">{t("Absence transmise au bureau. Vous n'avez rien d'autre à faire.", "Absence sent to the office. Nothing else for you to do.")}</p>
            <button type="button" onClick={() => { envoyer({ type: "absence", absence: null }); setMotif(""); }}
              className="mx-auto mt-2 flex items-center gap-1.5 text-xs font-semibold text-encre-2 underline-offset-2 hover:underline">
              <RotateCcw className="h-3.5 w-3.5" />{t("Recommencer la démonstration", "Restart the demo")}
            </button>
          </>
        ) : (
          <Bouton variante="danger" className="mt-2 w-full"
            onClick={() => envoyer({ type: "absence", absence: { passageId: PASSAGE.id, motif: motif.trim(), remplacantId: null } })}>
            <CircleOff className="h-4 w-4" /> {t("Signaler mon absence", "Report my absence")}
          </Bouton>
        )}
        <label className="mt-3 block text-xs text-encre-2">
          {t("Un mot pour le bureau (facultatif)", "A note for the office (optional)")}
          <textarea value={motif} onChange={(e) => setMotif(e.target.value)} rows={2} disabled={!!declare}
            placeholder={t("ex. ma fille est malade, je dois rester à la maison", "e.g. my daughter is ill, I have to stay home")}
            className="mt-1 w-full rounded-lg border border-trait bg-surface px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-bold">{t("Côté bureau", "Office side")}</h2>
        {!declare ? (
          <div className="mt-3 rounded-2xl border border-dashed border-trait-fort p-6 text-encre-2">
            <p className="max-w-[56ch]">
              {t("Appuyez sur « Signaler mon absence » dans le téléphone, sans rien avoir à écrire : le bureau reçoit l'alerte avec les trois meilleurs remplaçants, et une prime d'urgence si le passage a lieu dans moins de 24 heures.",
                "Press “Report my absence” in the phone, with nothing to type: the office gets the alert with the three best substitutes, and an urgency bonus if the visit is within 24 hours.")}
            </p>
          </div>
        ) : (
          <div className="arriver mt-3 space-y-5">
            <div className="rounded-2xl bg-alerte-fond p-5">
              <p className="font-bold text-alerte">{t("Absence : Ana Ferreira", "Absence: Ana Ferreira")} · {CLIENT.nom}, {formaterHeure(DEBUT)}</p>
              {declare.motif && <p className="mt-1 text-sm text-alerte">« {declare.motif} »</p>}
              <p className="mt-2 text-sm text-encre-2">
                {t(`Passage dans 3 heures : prime d'urgence de ${PRIME_URGENCE_CHF_H} CHF de l'heure pour le remplaçant, soit ${prime} CHF. Moins cher qu'un ménage perdu (65,85 CHF) et qu'un client mécontent.`,
                  `Visit in 3 hours: urgency bonus of CHF ${PRIME_URGENCE_CHF_H} an hour for the substitute, i.e. CHF ${prime}. Cheaper than a lost visit (CHF 65.85) and an unhappy client.`)}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-encre-2">{t("Remplaçants proposés (jamais un agent occupé, à plus de 12 km ou refusé par le client)", "Suggested substitutes (never someone busy, over 12 km away or declined by the client)")}</p>
              <ul className="mt-2 space-y-2">
                {propositions.map((p, i) => {
                  const a = agent(p.id);
                  return (
                    <li key={p.id} className={`flex flex-wrap items-center gap-3 rounded-xl border bg-surface p-3.5 ${choisi === p.id ? "border-sapin" : "border-trait"}`}>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-sapin text-sm font-bold text-sur-sapin">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{a.prenom} {a.nom} <span className="chiffres font-normal text-encre-3">· {p.km} km · {a.noteMoyenne}/5 · {a.fiabilite} %</span></p>
                        <p className="text-sm text-sapin">{p.raisons.map((r) => RAISONS[r][langue === "fr" ? 0 : 1]).join(", ") || t("disponible", "available")}</p>
                      </div>
                      {choisi === p.id ? <Pastille ton="ok"><UserRoundCheck className="h-3.5 w-3.5" />{t("Choisi", "Chosen")}</Pastille> : (
                        <Bouton variante="contour" onClick={() => { setChoisi(p.id); envoyer({ type: "absence", absence: { ...declare, remplacantId: p.id } }); }}>{t("Proposer la mission", "Offer the visit")}</Bouton>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {remplacant && (
              <div className="grid gap-4 xl:grid-cols-2">
                <Brouillon
                  key={`r-${remplacant.id}`}
                  titre={t("Notification au remplaçant", "Notification to the substitute")}
                  destinataire={`${remplacant.prenom} ${remplacant.nom} (${t("application", "app")})`}
                  canal="push"
                  avecObjet={false}
                  source="modele"
                  corpsInitial={t(
                    `Mission urgente aujourd'hui de ${formaterHeure(DEBUT)} à ${formaterHeure(DEBUT + PASSAGE.dureeMin)} : ${CLIENT.nom}, ${CLIENT.adresse}, ${CLIENT.commune}. Prime d'urgence : ${prime} CHF.\n\nÀ savoir avant d'y aller :\n${[...fiche.interdits.map((x) => `- À éviter : ${x}`), ...fiche.routine.map((x) => `- ${x}`), ...fiche.acces.map((x) => `- Accès : ${x}`)].join("\n")}\n\nAccepter ou refuser dans l'application.`,
                    `Urgent visit today from ${formaterHeure(DEBUT)} to ${formaterHeure(DEBUT + PASSAGE.dureeMin)}: ${CLIENT.nom}, ${CLIENT.adresse}, ${CLIENT.commune}. Urgency bonus: CHF ${prime}.\n\nBefore you go:\n${[...fiche.interdits.map((x) => `- Avoid: ${x}`), ...fiche.routine.map((x) => `- ${x}`), ...fiche.acces.map((x) => `- Access: ${x}`)].join("\n")}\n\nAccept or decline in the app.`,
                  )}
                />
                <Brouillon
                  key={`c-${remplacant.id}`}
                  titre={t("Message au client", "Message to the client")}
                  destinataire={`${CLIENT.nom} (SMS)`}
                  canal="sms"
                  avecObjet={false}
                  source="modele"
                  corpsInitial={t(
                    `Bonjour, Ana ne pourra pas venir aujourd'hui. ${remplacant.prenom}, qui a lu vos consignes, assure le passage à ${formaterHeure(DEBUT)} comme prévu. Rien ne change pour vous. MénageSimple`,
                    `Hello, Ana can't come today. ${remplacant.prenom}, who has read your instructions, will cover at ${formaterHeure(DEBUT)} as planned. Nothing changes for you. MénageSimple`,
                  )}
                />
              </div>
            )}
          </div>
        )}
        <p className="mt-6 text-xs text-encre-3">
          {t("Démonstration : disponibilités du jour fictives. Le message au client ne dit pas pourquoi l'agent est absent, et l'agent n'a pas à se justifier.",
            "Demo: today's availability is fictional. The client message doesn't say why the cleaner is absent, and the cleaner doesn't have to explain.")}
        </p>
      </div>
    </div>
  );
}
