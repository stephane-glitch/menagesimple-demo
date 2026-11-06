"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, ExternalLink, Loader2, MessageCircle, PhoneCall, X } from "lucide-react";
import { formaterNombre, useLangue, useT } from "@/lib/i18n";
import { AGENTS, agent, zonesEnManque, tauxCouverture } from "@/lib/donnees";
import { CANDIDATURES, type Candidature } from "@/lib/donnees/recrutement";
import { codeParrainage, primesDues, PRIME_AUGMENTEE_CHF, SEUIL_HEURES, type EtapeFilleul } from "@/lib/regles/parrainage";
import { useSimulation } from "@/lib/simulation";
import { appelerIA, Bouton, Pastille } from "@/components/ui";

const ANA = AGENTS[0];

function libelleEtape(e: EtapeFilleul, t: (fr: string, en: string) => string) {
  return {
    invite: t("Invité", "Invited"), candidature: t("Candidature reçue", "Application received"), retenu: t("Retenu", "Hired"),
    refuse: t("Non retenu", "Not hired"), actif: t("En poste", "Working"),
  }[e];
}
function tonEtape(e: EtapeFilleul) {
  return ({ invite: "neutre", candidature: "attention", retenu: "sapin", refuse: "neutre", actif: "ok" } as const)[e];
}

type Preselection = { resume: string; pointsForts: string[]; aVerifier: string[]; questions: string[]; suggestion: "appeler" | "a-voir" };

function CoteAgent({ toutes }: { toutes: Candidature[] }) {
  const t = useT();
  const { langue } = useLangue();
  const { etat } = useSimulation();
  const code = codeParrainage(ANA.prenom, ANA.id);
  const origine = useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");
  const lien = `${origine}/rejoindre?parrain=${code}`;
  const [copie, setCopie] = useState(false);
  const augmentees = [...new Set([...zonesEnManque(75).map((z) => z.commune), ...etat.zonesPrimeDoublee])];
  const mesFilleuls = toutes.filter((c) => c.parrainId === ANA.id);
  const total = mesFilleuls.reduce((s, f) => s + primesDues({ ...f, parrainId: f.parrainId! }).total, 0);
  const texte = t(
    `Je travaille avec MénageSimple depuis 2 ans : ménage chez des particuliers, déclaré et assuré, on choisit ses horaires. Ils cherchent du monde, surtout à ${augmentees.slice(0, 2).join(" et ")}. Pour postuler (3 minutes) : ${lien}`,
    `I've worked with MénageSimple for 2 years: cleaning private homes, declared and insured, you choose your hours. They're hiring, especially in ${augmentees.slice(0, 2).join(" and ")}. To apply (3 minutes): ${lien}`,
  );

  return (
    <div className="telephone mx-auto w-full max-w-[380px] self-start rounded-[2.2rem] border-[10px] border-encre bg-fond p-4 shadow-[0_30px_60px_-30px_rgba(23,21,43,0.6)]">
      <p className="text-center text-xs text-encre-3">{t("Application de l'agent", "Cleaner's app")}</p>
      <p className="mt-3 text-sm text-encre-2">{t("Bonjour", "Hello")} {ANA.prenom},</p>
      <h3 className="text-xl font-extrabold leading-tight">{t("Recommandez quelqu'un de confiance", "Refer someone you trust")}</h3>
      <div className="mt-4 rounded-xl bg-citron p-3.5">
        <p className="text-sm font-bold">{t("Prime augmentée ce mois-ci", "Higher bonus this month")}</p>
        <p className="mt-0.5 text-sm">{augmentees.join(", ")}</p>
        <p className="mt-2 text-xs">
          {t(`${PRIME_AUGMENTEE_CHF} CHF quand la personne est retenue, puis ${PRIME_AUGMENTEE_CHF} CHF après ses ${SEUIL_HEURES} premières heures.`,
            `CHF ${PRIME_AUGMENTEE_CHF} when they're hired, then CHF ${PRIME_AUGMENTEE_CHF} after their first ${SEUIL_HEURES} hours.`)}
        </p>
      </div>
      <div className="mt-4 rounded-xl border border-trait bg-surface p-3.5">
        <p className="text-xs text-encre-2">{t("Votre code", "Your code")}</p>
        <p className="chiffres text-lg font-bold">{code}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Bouton variante="contour" className="text-sm" onClick={() => { navigator.clipboard?.writeText(texte); setCopie(true); setTimeout(() => setCopie(false), 2000); }}>
            {copie ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copie ? t("Copié", "Copied") : t("Copier", "Copy")}
          </Bouton>
          <a href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-sapin text-sm font-semibold text-sur-sapin">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
        <Link href={`/rejoindre?parrain=${code}`} className="mt-3 flex items-center gap-1 text-xs font-semibold text-sapin hover:underline">
          {t("Voir la page que reçoit la personne", "See the page the person receives")} <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <p className="mt-5 text-sm font-bold">{t("Vos filleuls", "Your referrals")}</p>
      <ul className="mt-2 space-y-2">
        {mesFilleuls.map((f) => {
          const p = primesDues({ ...f, parrainId: f.parrainId! });
          return (
            <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 text-sm">
              <span><span className="font-semibold">{f.prenom} {f.initialeNom}</span><br /><span className="text-xs text-encre-3">{libelleEtape(f.etape, t)}</span></span>
              <span className="chiffres text-right text-xs">{p.total > 0 ? <span className="font-bold text-ok">+{p.total} CHF</span> : p.aVenir > 0 ? <span className="text-encre-3">{t("jusqu'à", "up to")} {p.aVenir} CHF</span> : "—"}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-right text-sm">{t("Primes gagnées :", "Bonuses earned:")} <span className="chiffres font-bold">{formaterNombre(total, langue)} CHF</span></p>
    </div>
  );
}

function CoteBureau({ toutes }: { toutes: Candidature[] }) {
  const t = useT();
  const { langue } = useLangue();
  const { etat, envoyer } = useSimulation();
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, Preselection & { source: "ia" | "regles"; erreur?: string }>>({});
  const [charge, setCharge] = useState<string | null>(null);
  const c = toutes.find((x) => x.id === ouverte);

  async function analyser(id: string) {
    const x = toutes.find((y) => y.id === id);
    if (!x) return;
    setCharge(id);
    try {
      const r = await appelerIA<Preselection>({ action: "candidature", candidature: x, langue });
      setAnalyses((a) => ({ ...a, [id]: { ...r.donnees, source: r.source, erreur: r.erreur } }));
    } finally {
      setCharge(null);
    }
  }

  function ouvrir(id: string) {
    setOuverte(id);
    if (!analyses[id] && charge !== id) analyser(id);
  }

  const primesTotal = toutes.filter((x) => x.parrainId).reduce((s, x) => s + primesDues({ ...x, parrainId: x.parrainId! }).total, 0);
  const a = ouverte ? analyses[ouverte] : null;
  const decision = ouverte ? etat.decisions[ouverte] : undefined;

  return (
    <div>
      <dl className="grid grid-cols-3 gap-3">
        {[
          [t("Candidatures", "Applications"), String(toutes.length)],
          [t("Par parrainage", "Via referral"), String(toutes.filter((x) => x.source === "parrainage").length)],
          [t("Primes versées", "Bonuses paid"), `${formaterNombre(primesTotal, langue)} CHF`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-trait bg-surface p-3">
            <dt className="text-xs text-encre-2">{l}</dt>
            <dd className="chiffres mt-1 text-xl font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 overflow-x-auto rounded-xl border border-trait bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-trait text-xs text-encre-2">
            <tr>
              <th className="px-3 py-2.5 font-semibold">{t("Candidat", "Candidate")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("Source", "Source")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("Zones", "Areas")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("Étape", "Stage")}</th>
              <th className="px-3 py-2.5 text-right font-semibold">{t("Prime parrain", "Referrer bonus")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-trait">
            {toutes.map((x) => {
              const p = x.parrainId ? primesDues({ ...x, parrainId: x.parrainId }) : null;
              return (
                <tr key={x.id} onClick={() => ouvrir(x.id)} className={`cursor-pointer transition hover:bg-fond ${ouverte === x.id ? "bg-sapin-clair" : ""}`}>
                  <td className="px-3 py-2.5">
                    <button type="button" className="text-left font-semibold hover:underline" onClick={(e) => { e.stopPropagation(); ouvrir(x.id); }}>{x.prenom} {x.initialeNom}</button>
                    <span className="block text-xs text-encre-3">{x.commune}</span>
                  </td>
                  <td className="px-3 py-2.5 text-encre-2">{x.source === "parrainage" ? `${t("parrainé par", "referred by")} ${agent(x.parrainId!).prenom}` : x.source}</td>
                  <td className="px-3 py-2.5 text-encre-2">{x.zones.slice(0, 2).join(", ")}{x.zoneEnManque && <> <Pastille ton="attention">{t("prime augmentée", "higher bonus")}</Pastille></>}</td>
                  <td className="px-3 py-2.5"><Pastille ton={tonEtape(x.etape)}>{libelleEtape(x.etape, t)}</Pastille></td>
                  <td className="chiffres px-3 py-2.5 text-right">{p ? (p.total ? `${p.total} CHF` : p.aVenir ? <span className="text-encre-3">{t("jusqu'à", "up to")} {p.aVenir}</span> : "—") : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!c && (
        <p className="mt-5 rounded-xl border border-dashed border-trait-fort p-5 text-sm text-encre-2">
          {t("Cliquez sur une candidature : la présélection est prête (points forts, points à vérifier, questions d'entretien), et vous décidez.", "Click an application: the screening is ready (strengths, points to check, interview questions), and you decide.")}
        </p>
      )}
      {c && (
        <section className="arriver mt-5 rounded-2xl border border-trait bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold">{c.prenom} {c.initialeNom}</h3>
              <p className="text-sm text-encre-2">{c.commune} · {c.tauxSouhaite} % · {c.horaires} · {t("permis", "permit")} {c.permis}</p>
            </div>
          </div>
          {c.message && <p className="mt-3 border-l border-trait-fort pl-3 text-sm italic text-encre-2">« {c.message} »</p>}
          {charge === c.id && <p className="mt-4 flex items-center gap-2 text-sm text-encre-2"><Loader2 className="h-4 w-4 animate-spin" />{t("Présélection en cours…", "Screening…")}</p>}
          {a && (
            <div className="mt-4 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-ok">{t("Points forts", "Strengths")}</p>
                <ul className="mt-1.5 space-y-1 text-sm">{a.pointsForts.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-attention">{t("À vérifier", "To check")}</p>
                <ul className="mt-1.5 space-y-1 text-sm">{a.aVerifier.length ? a.aVerifier.map((x) => <li key={x}>{x}</li>) : <li className="text-encre-3">{t("Rien de particulier", "Nothing in particular")}</li>}</ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-sapin">{t("Questions d'entretien", "Interview questions")}</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">{a.questions.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            </div>
          )}
          {a && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-trait pt-4">
              {!decision && (
                <>
                  <Bouton onClick={() => envoyer({ type: "decision", id: c.id, decision: "appeler" })}><PhoneCall className="h-4 w-4" />{t("Appeler pour un entretien", "Call for an interview")}</Bouton>
                  <Bouton variante="contour" onClick={() => envoyer({ type: "decision", id: c.id, decision: "plus-tard" })}>{t("Plus tard", "Later")}</Bouton>
                  <Bouton variante="contour" onClick={() => { envoyer({ type: "decision", id: c.id, decision: "refuser" }); envoyer({ type: "filleul", id: c.id, etape: "refuse" }); }}><X className="h-4 w-4" />{t("Ne pas retenir", "Decline")}</Bouton>
                </>
              )}
              {decision === "appeler" && c.etape === "candidature" && (
                <Bouton variante="citron" onClick={() => envoyer({ type: "filleul", id: c.id, etape: "retenu" })}><Check className="h-4 w-4" />{t("Entretien réussi : retenir", "Interview passed: hire")}</Bouton>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Parrainage() {
  const t = useT();
  const params = useSearchParams();
  const { etat, envoyer } = useSimulation();
  const zone = params.get("zone");
  useEffect(() => {
    if (zone) envoyer({ type: "prime-doublee", commune: zone, active: true });
  }, [zone, envoyer]);

  const toutes = useMemo(() => {
    const base = [...etat.candidatures, ...CANDIDATURES];
    return base.map((c) => ({ ...c, etape: etat.filleuls[c.id] ?? c.etape }));
  }, [etat.candidatures, etat.filleuls]);

  const zonesRouges = zonesEnManque(75);
  return (
    <div>
      {zone && (
        <p className="mb-6 rounded-xl bg-citron px-4 py-3 text-sm font-semibold">
          {t(`Prime de parrainage augmentée pour ${zone} (couverture ${tauxCouverture(zonesRouges.find((z) => z.commune === zone) ?? zonesEnManque(100).find((z) => z.commune === zone)!) } %). Les agents du secteur la voient dans leur application.`,
            `Higher referral bonus for ${zone} (coverage ${tauxCouverture(zonesRouges.find((z) => z.commune === zone) ?? zonesEnManque(100).find((z) => z.commune === zone)!)}%). Cleaners in the area see it in their app.`)}
        </p>
      )}
      <div className="grid gap-10 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div>
          <h2 className="mb-4 text-lg font-bold">{t("Côté agent", "Cleaner side")}</h2>
          <CoteAgent toutes={toutes} />
        </div>
        <div className="min-w-0">
          <h2 className="mb-4 text-lg font-bold">{t("Côté bureau : candidatures et présélection", "Office side: applications and screening")}</h2>
          <CoteBureau toutes={toutes} />
        </div>
      </div>
    </div>
  );
}

export default function PageParrainage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <Parrainage />
    </Suspense>
  );
}
