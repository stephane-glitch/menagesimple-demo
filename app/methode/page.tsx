"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { Page, TitrePage } from "@/components/ui";

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-trait py-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.6fr)]">
      <h2 className="text-[1.45rem] font-extrabold leading-tight">{titre}</h2>
      <div className="min-w-0 max-w-[72ch] space-y-3 text-encre-2 [&_strong]:text-encre">{children}</div>
    </section>
  );
}

export default function Methode() {
  const t = useT();
  const [ia, setIa] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/ia").then((r) => r.json()).then((d: { ia: boolean }) => setIa(d.ia)).catch(() => setIa(false));
  }, []);

  const lignes: [string, string, string][] = [
    [t("Recherche travail.swiss", "travail.swiss search"), t("Réelle, en direct", "Real, live"), t("Page publique job-room.ch, sans compte. Seuls des champs anonymes sont lus ; rien n'est stocké ; chaque profil renvoie à sa fiche officielle.", "Public job-room.ch page, no account. Only anonymous fields are read; nothing is stored; each profile links to its official page.")],
    [t("Décomposition des 43,90 CHF", "CHF 43.90 breakdown"), t("Réelle", "Real"), t("Publiée par MénageSimple sur sa page d'accueil (consultée le 05/11/2026).", "Published by MénageSimple on its home page (viewed 05/11/2026).")],
    [t("Agents, clients, passages, candidatures, notes", "Cleaners, clients, visits, applications, ratings"), t("Fictifs", "Fictional"), t("Générés avec une graine fixe : mêmes données à chaque lancement. Communes et coordonnées réelles, personnes et adresses inventées.", "Generated with a fixed seed: same data every run. Real towns and coordinates, invented people and addresses.")],
    [t("Notes vocales d'exemple", "Sample voice notes"), t("Synthétiques", "Synthetic"), t("Voix de synthèse ElevenLabs lisant un texte fictif ; transcription vérifiée avec Whisper.", "ElevenLabs synthetic voices reading fictional text; transcript checked with Whisper.")],
    [t("Courriels, SMS, notifications", "Emails, texts, notifications"), t("Simulés", "Simulated"), t("Inscrits au journal des envois après validation ; rien ne part.", "Written to the send log after approval; nothing is sent.")],
    [t("Textes de l'IA", "AI texts"), ia === null ? "…" : ia ? t("En direct", "Live") : t("Règles simples", "Simple rules"), t("Un modèle d'IA branché par une clé côté serveur ; sans clé, des règles simples prennent le relais.", "An AI model connected through a server-side key; without one, simple rules take over.")],
  ];

  return (
    <Page>
      <TitrePage
        titre={t("Méthode, hypothèses et limites", "Method, assumptions and limits")}
        intro={t("Ce qui est réel, ce qui est simulé, comment l'IA est encadrée et comment le vérifier soi-même.", "What is real, what is simulated, how the AI is kept in check and how to verify it yourself.")}
      />

      <Bloc titre={t("Le problème choisi", "The problem chosen")}>
        <p>{t("Sur les quatre sociétés du groupe, MénageSimple fait l'essentiel du chiffre d'affaires et se comprend avec des données publiques. Son prix publié le montre : sur 43,90 CHF de l'heure, 4,00 CHF paient l'organisation (recrutement, accompagnement, service client, remplacements, encaissement, sinistres) et il reste 0,80 CHF.", "Of the group's four companies, MénageSimple brings in most of the revenue and can be understood from public data. Its published price shows why: out of CHF 43.90 an hour, CHF 4.00 pays for operations (recruitment, support, customer service, cover, billing, claims) and CHF 0.80 is left.")}</p>
        <p>{t("Chaque centime gagné sur l'organisation va au bénéfice : 0,40 CHF de moins par heure, c'est +50 %. Ces briques visent donc les tâches qui pèsent dans ces 4,00 CHF : trouver des agents là où l'on perd des réservations, les garder et les former, maintenir le service quand quelqu'un manque, et transmettre ce que l'on sait de chaque client.", "Every cent saved on operations goes to the margin: CHF 0.40 less per hour is +50%. Relève therefore targets the tasks that weigh on that CHF 4.00: finding cleaners where bookings are lost, keeping and training them, keeping the service going when someone is missing, and passing on what is known about each client.")}</p>
        <p>{t("Site, offres d'emploi et conditions générales de MénageSimple montrent un recrutement permanent (moins de 5 % des candidatures retenues), des demandes perdues faute d'agent disponible, et un parrainage réservé aux clients.", "MénageSimple's site, job ads and terms show constant recruiting (fewer than 5% of applicants hired), requests lost for lack of an available cleaner, and a referral scheme for clients only.")}</p>
      </Bloc>

      <Bloc titre={t("Réel, fictif ou simulé", "Real, fictional or simulated")}>
        <div className="overflow-x-auto rounded-xl border border-trait bg-surface">
          <table className="w-full min-w-[540px] text-left text-sm">
            <tbody className="divide-y divide-trait">
              {lignes.map(([a, b, c]) => (
                <tr key={a}><th className="w-48 px-3 py-3 align-top font-semibold text-encre">{a}</th><td className="w-32 px-3 py-3 align-top font-semibold text-sapin">{b}</td><td className="px-3 py-3 align-top">{c}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloc>

      <Bloc titre={t("L'IA, et la personne qui valide", "The AI, and the person who approves")}>
        <p>{t("L'IA intervient à sept endroits : critères de recherche, classement des profils, message à l'ORP, présélection des candidatures, reformulation des notes vocales, assistant ménage, messages après une mauvaise note. Toutes ses réponses structurées passent par un schéma JSON puis une validation (zod) ; un identifiant de profil inventé est rejeté.", "The AI is used in seven places: search criteria, profile ranking, job-centre message, application screening, voice-note rewriting, cleaning assistant, messages after a bad rating. All its structured answers go through a JSON schema then validation (zod); an invented profile ID is rejected.")}</p>
        <p><strong>{t("Aucun texte ne part vers un client, un agent, un candidat ou un ORP sans un clic humain.", "No text goes to a client, cleaner, candidate or job centre without a human click.")}</strong> {t("Le texte reste modifiable ; le journal note s'il a été corrigé avant l'envoi, ce qui mesure la qualité des brouillons dans le temps. La présélection propose « appeler » ou « à voir », jamais un refus automatique, et la consigne interdit d'utiliser l'origine, l'âge supposé ou la langue maternelle comme critère.", "The text stays editable; the log records whether it was corrected before sending, which measures draft quality over time. Screening suggests “call” or “to review”, never an automatic rejection, and the instructions forbid using origin, assumed age or mother tongue as a criterion.")}</p>
        <p>{t("Si la clé manque, si le modèle refuse ou si sa réponse est mal formée, des règles simples répondent à sa place et la démonstration continue.", "If the key is missing, the model declines, or its answer is malformed, simple rules answer instead and the demo carries on.")}</p>
      </Bloc>

      <Bloc titre={t("Tests et reproductibilité", "Tests and reproducibility")}>
        <p>{t("À chaque modification, 55 tests automatiques vérifient que les règles donnent le bon résultat : primes de parrainage, alerte après une mauvaise note, distance pour déclarer son arrivée, journée qui tient ou non, choix des remplaçants. Ils vérifient aussi que la recherche travail.swiss envoie les bons critères et ne garde aucune donnée personnelle, et que chaque écran existe en français et en anglais. D'autres tests vérifient les protections du serveur : seules les pages du site peuvent l'appeler, et le nombre d'appels est limité.",
          "On every change, 55 automated tests check that the rules give the right result: referral bonuses, alert after a bad rating, distance for declaring arrival, whether a day works, choice of substitutes. They also check that the travail.swiss search sends the right criteria and keeps no personal data, and that every screen exists in French and English.")}</p>
        <p>{t("Les parcours complets ont aussi été rejoués dans un vrai navigateur : de la recherche travail.swiss au message validé, de la note vocale à la fiche mise à jour, d'une note d'une étoile à l'alerte.",
          "The full journeys were also replayed in a real browser: from the travail.swiss search to the approved message, from the voice note to the updated sheet, from a one-star rating to the alert.")}</p>
        <p>{t("Pour tout relancer sur un ordinateur :", "To run it all again on a computer:")}</p>
        <pre className="overflow-x-auto rounded-lg bg-encre p-4 text-sm text-fond">npm install{"\n"}npm test{"\n"}npm run dev   # GEMINI_API_KEY=… {t("facultatif", "optional")}</pre>
      </Bloc>

      <Bloc titre={t("Hypothèses à valider avec MénageSimple", "Assumptions to check with MénageSimple")}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{t("Volumes : 2 000 clients et 380 CHF par mois et par client (chiffres du site et du blog), soit environ 210 000 heures par an.", "Volumes: 2,000 clients and CHF 380 per client per month (figures from their site and blog), about 210,000 hours a year.")}</li>
          <li>{t("Ce que fait déjà l'application « MénageSimple Pro » côté agents : ces briques sont prévues pour s'y brancher.", "What the “MénageSimple Pro” cleaner app already does: these blocks are designed to plug into it.")}</li>
          <li>{t("Montants des primes (parrainage, urgence), qui les verse et comment elles se déclarent, les agents étant placés chez des clients employeurs.", "Bonus amounts (referral, urgency), who pays them and how they are declared, since cleaners are placed with client employers.")}</li>
          <li>{t("Offre et demande par commune : simulées ici, à calculer depuis leurs réservations et les disponibilités des agents.", "Supply and demand by town: simulated here, to be computed from their bookings and cleaners' availability.")}</li>
        </ul>
      </Bloc>

      <Bloc titre={t("Limites et suite", "Limits and next steps")}>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>{t("travail.swiss : les conditions d'utilisation soumettent la reprise de contenus à une autorisation écrite du SECO. Pour un usage réel, MénageSimple demande le compte « placeur privé » de Job-Room et passe par lui.", "travail.swiss: the terms of use require written SECO permission to reuse content. For real use, MénageSimple requests the Job-Room “private placement agency” account and goes through it.")}</li>
          <li>{t("Arrivée et départ : seule la position au moment de la déclaration, avec l'accord de l'agent ; à valider au regard de la loi sur la protection des données (nLPD).", "Arrival and departure: only the position at the moment of declaring, with the cleaner's consent; to be checked against the data protection act (nLPD).")}</li>
          <li>{t("Trajets estimés localement (vol d'oiseau × 1,35) : une API d'itinéraires précise les temps réels en production.", "Routes estimated locally (crow-flies × 1.35): a routing API would give real times in production.")}</li>
          <li>{t("L'état de la démonstration vit dans le navigateur ; en production, base de données, comptes et droits par rôle.", "The demo state lives in the browser; in production, a database, accounts and role-based access.")}</li>
        </ul>
      </Bloc>
    </Page>
  );
}
