"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, ClipboardCheck, Play, PlayCircle, Smartphone, UserPlus } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { Page } from "@/components/ui";

// La vidéo de présentation s'affiche une fois par visite, avant l'accueil.
const CLE_INTRO = "releve-intro-vue";
const abonnes = new Set<() => void>();
const intro = {
  lire: () => { try { return sessionStorage.getItem(CLE_INTRO) === "1"; } catch { return false; } },
  ecrire: (vue: boolean) => {
    try { if (vue) sessionStorage.setItem(CLE_INTRO, "1"); else sessionStorage.removeItem(CLE_INTRO); } catch {}
    abonnes.forEach((f) => f());
  },
  abonner: (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f); }; },
};

function Presentation({ onEntrer }: { onEntrer: () => void }) {
  const t = useT();
  const { langue } = useLangue();
  const video = useRef<HTMLVideoElement>(null);
  const [lance, setLance] = useState(false);
  function lancer() {
    setLance(true);
    video.current?.play().catch(() => {});
  }
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-12 pt-2 sm:px-6">
      <h1 className="text-center text-[1.6rem] font-extrabold tracking-tight sm:text-[2rem]">{t("Propositions pour MénageSimple", "Proposals for MénageSimple")}</h1>
      <p className="mt-1 text-center text-encre-2">
        {t("Trois minutes de présentation, puis la démonstration à tester.", "A three-minute presentation, then the demo to try.")}
        {langue === "en" && " (Video in French.)"}
      </p>
      <div className="relative mt-6 overflow-hidden rounded-2xl border border-trait bg-encre shadow-pop">
        <video ref={video} controls={lance} preload="metadata" playsInline className="block aspect-[16/10] w-full" onEnded={onEntrer}>
          <source src="/video/presentation.mp4" type="video/mp4" />
        </video>
        {!lance && (
          <button type="button" onClick={lancer} aria-label={t("Lancer la vidéo de présentation", "Play the presentation video")}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-5 bg-sapin text-sur-sapin">
            <span className="grid h-24 w-24 place-items-center rounded-full bg-white text-sapin shadow-[0_18px_40px_-12px_rgba(23,21,43,0.55)] transition group-hover:scale-105 sm:h-28 sm:w-28">
              <Play className="ml-1.5 h-10 w-10 fill-current sm:h-12 sm:w-12" />
            </span>
            <span className="text-xl font-bold sm:text-2xl">{t("Vidéo de présentation", "Presentation video")}</span>
            <span className="-mt-3 text-sm text-sur-sapin-2">3 min</span>
          </button>
        )}
      </div>
      <div className="mt-6 flex justify-center">
        <button type="button" onClick={onEntrer}
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-sapin px-6 text-base font-semibold text-sur-sapin shadow-sm transition-colors hover:bg-sapin-fonce">
          {t("Entrer dans la démonstration", "Enter the demo")} <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function Accueil() {
  const t = useT();
  const vue = useSyncExternalStore(intro.abonner, intro.lire, () => false);
  const blocs = [
    {
      href: "/recrutement",
      titre: t("Recrutement", "Recruitment"),
      texte: t(
        "Repérer les demandes qui tombent dans une zone sans assez d'agents, puis trouver du monde : personnes inscrites à l'ORP sur travail.swiss, et parrainage par vos agents.",
        "Spot requests in areas without enough cleaners, then find people: job seekers registered on travail.swiss, and referrals from your cleaners.",
      ),
      points: [t("Demandes et zones en manque", "Requests and short-staffed areas"), t("Recherche de nouveaux agents", "Finding new cleaners"), t("Parrainage", "Referrals")],
      icone: UserPlus,
      tuile: "bg-sapin-clair text-sapin",
    },
    {
      href: "/talents",
      titre: t("Gestion des talents", "Talent management"),
      texte: t(
        "Ce que l'agent a sur son téléphone : sa journée, la déclaration d'arrivée et de départ, l'absence signalée en un geste, des conseils de métier.",
        "What cleaners have on their phone: their day, declaring arrival and departure, reporting an absence in one tap, trade tips.",
      ),
      points: [t("Planning et trajets", "Schedule and travel"), t("Arrivée et départ", "Arrival and departure"), t("Absence et remplacement", "Absence and cover"), t("Connaissance métier", "Trade knowledge")],
      icone: Smartphone,
      tuile: "bg-[#fde2e6] text-[#c4324a]",
    },
    {
      href: "/qualite",
      titre: t("Suivi qualité", "Quality follow-up"),
      texte: t(
        "Ce que l'agent apprend chez un client est transmis au suivant. Les notes vont dans les deux sens, et une mauvaise note prévient tout de suite le bureau.",
        "What a cleaner learns at a client's home is passed on to the next one. Ratings go both ways, and a bad rating alerts the office at once.",
      ),
      points: [t("Préférences des clients", "Client preferences"), t("Notation dans les deux sens", "Two-way ratings"), t("Alertes", "Alerts")],
      icone: ClipboardCheck,
      tuile: "bg-[#dcf5f2] text-[#147a70]",
    },
  ];

  if (!vue) return <Presentation onEntrer={() => { intro.ecrire(true); window.scrollTo(0, 0); }} />;

  return (
    <Page>
      <div className="pb-8 pt-4 sm:pt-10">
        <h1 className="max-w-[34ch] text-[1.7rem] font-extrabold leading-[1.15] tracking-tight sm:text-[2.2rem]">
          {t(
            "Vous avez déjà votre outil pour gérer clients et agents de ménage. Voici trois briques à y ajouter, là où l'organisation vous coûte le plus de temps.",
            "You already have your tool for managing clients and cleaners. Here are three building blocks to add to it, where running things costs you the most time.",
          )}
        </h1>
        <button type="button" onClick={() => intro.ecrire(false)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sapin hover:underline">
          <PlayCircle className="h-4 w-4" /> {t("Revoir la vidéo de présentation", "Watch the presentation video again")}
        </button>
      </div>
      <div className="grid gap-5 pb-8 md:grid-cols-3">
        {blocs.map((b) => (
          <Link key={b.href} href={b.href} className="group flex min-h-[340px] flex-col rounded-2xl border border-trait bg-surface p-6 transition hover:-translate-y-0.5 hover:border-sapin/40 hover:shadow-pop">
            <span className={`grid h-12 w-12 place-items-center rounded-2xl ${b.tuile}`}><b.icone className="h-6 w-6" strokeWidth={1.9} /></span>
            <h2 className="mt-5 text-xl font-extrabold">{b.titre}</h2>
            <p className="mt-2 text-[15px] text-encre-2">{b.texte}</p>
            <ul className="mt-auto space-y-1 pt-6">
              {b.points.map((p) => (
                <li key={p} className="rounded-lg bg-sunken px-3 py-1.5 text-sm font-medium text-encre-2">{p}</li>
              ))}
            </ul>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sapin">
              {t("Ouvrir", "Open")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </Page>
  );
}
