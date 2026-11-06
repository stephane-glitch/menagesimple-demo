"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, BookOpen, CalendarClock, CircleOff, FileText, Handshake, House, Inbox, Mail, MapPin, Menu, MessageCircleQuestion, MessageSquareText, Mic, Search, Smartphone, Star, X } from "lucide-react";
import { SelecteurLangue } from "./drapeaux";
import { useT } from "@/lib/i18n";
import { useSimulation } from "@/lib/simulation";

const ICONES = { email: Mail, sms: MessageSquareText, push: Smartphone };

function CentreAlertes() {
  const t = useT();
  const { etat, envoyer, nonLues } = useSimulation();
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (zone.current && !zone.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("mousedown", fermer);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", fermer);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <div className="relative" ref={zone}>
      <button
        type="button"
        onClick={() => {
          setOuvert((o) => !o);
          if (nonLues) envoyer({ type: "lire-alertes" });
        }}
        aria-expanded={ouvert}
        aria-label={t(`Alertes qualité (${nonLues} non lues)`, `Quality alerts (${nonLues} unread)`)}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-encre-2 transition hover:bg-sunken hover:text-encre"
      >
        <Bell className="h-5 w-5" strokeWidth={1.8} />
        {nonLues > 0 && (
          <span className="chiffres absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-alerte px-1 text-[11px] font-bold text-white">
            {nonLues}
          </span>
        )}
      </button>
      {ouvert && (
        <div className="arriver fixed right-3 top-16 z-[1600] w-[min(92vw,380px)] rounded-2xl border border-trait bg-surface p-4 shadow-pop lg:left-[280px] lg:right-auto lg:top-4">
          <p className="text-sm font-bold">{t("Alertes qualité", "Quality alerts")}</p>
          <p className="mt-0.5 text-xs text-encre-3">{t("Envois simulés : rien ne part réellement.", "Simulated sends: nothing is actually sent.")}</p>
          {etat.alertes.length === 0 ? (
            <p className="mt-4 text-sm text-encre-2">
              {t("Aucune alerte. Donnez une note de 1 ou 2 étoiles dans « Notation » pour en déclencher une.", "No alerts. Give a 1 or 2 star rating in “Ratings” to trigger one.")}
            </p>
          ) : (
            <ul className="mt-3 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {etat.alertes.slice(0, 8).map((a) => (
                <li key={a.id} className="rounded-lg border border-trait p-3">
                  <Link href={a.lien} onClick={() => setOuvert(false)} className="text-sm font-semibold text-alerte hover:underline">
                    {a.titre}
                  </Link>
                  <p className="mt-1 text-xs text-encre-2">{a.detail}</p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {a.destinataires.map((d, i) => {
                      const Icone = ICONES[d.canal];
                      return (
                        <li key={i} className="flex items-center gap-1 rounded-full bg-fond px-2 py-0.5 text-[11px] text-encre-2">
                          <Icone className="h-3 w-3" strokeWidth={2} /> {roleLisible(d.role, t)}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <Link href="/qualite/alertes" onClick={() => setOuvert(false)} className="mt-4 inline-block text-sm font-semibold text-sapin hover:underline">
            {t("Toutes les alertes et le journal des envois", "All alerts and the send log")}
          </Link>
        </div>
      )}
    </div>
  );
}

export function roleLisible(role: string, t: (fr: string, en: string) => string) {
  switch (role) {
    case "responsable-qualite": return t("Responsable qualité", "Quality manager");
    case "coordinateur": return t("Coordination", "Coordination");
    case "agent": return t("Agent noté", "Rated cleaner");
    case "client": return t("Client noté", "Rated client");
    default: return role;
  }
}

type Lien = { href: string; fr: string; en: string; icone: React.ComponentType<{ className?: string; strokeWidth?: number }>; compte?: number };

function LienNav({ l, actif, onClick }: { l: Lien; actif: boolean; onClick?: () => void }) {
  const t = useT();
  const Icone = l.icone;
  return (
    <Link
      href={l.href}
      onClick={onClick}
      aria-current={actif ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-[14.5px] font-medium transition-colors ${
        actif ? "bg-sapin-clair text-sapin" : "text-encre hover:bg-sunken"
      }`}
    >
      <Icone className={`h-[18px] w-[18px] shrink-0 ${actif ? "text-sapin" : "text-encre-3 group-hover:text-encre-2"}`} strokeWidth={1.9} />
      <span className="min-w-0 flex-1 truncate">{t(l.fr, l.en)}</span>
      {!!l.compte && <span className={`chiffres rounded-full px-2 py-px text-xs font-semibold ${actif ? "bg-sapin text-white" : "bg-alerte text-white"}`}>{l.compte}</span>}
    </Link>
  );
}

function ContenuNav({ onNaviguer }: { onNaviguer?: () => void }) {
  const t = useT();
  const chemin = usePathname();
  const { nonLues } = useSimulation();
  const groupes: { titre: [string, string]; liens: Lien[] }[] = [
    {
      titre: ["Recrutement", "Recruitment"],
      liens: [
        { href: "/recrutement", fr: "Demandes clients", en: "Client requests", icone: Inbox },
        { href: "/recrutement/travail-swiss", fr: "Recherche nouveaux agents", en: "Find new cleaners", icone: Search },
        { href: "/recrutement/parrainage", fr: "Parrainage", en: "Referrals", icone: Handshake },
      ],
    },
    {
      titre: ["Gestion des talents", "Talent management"],
      liens: [
        { href: "/talents", fr: "Planning et trajets", en: "Schedule and travel", icone: CalendarClock },
        { href: "/talents/arrivee", fr: "Arrivée et départ", en: "Arrival and departure", icone: MapPin },
        { href: "/talents/absences", fr: "Absence et remplacement", en: "Absence and cover", icone: CircleOff },
        { href: "/talents/connaissances", fr: "Connaissance métier", en: "Trade knowledge", icone: BookOpen },
        { href: "/talents/assistant", fr: "Assistant ménage", en: "Cleaning assistant", icone: MessageCircleQuestion },
      ],
    },
    {
      titre: ["Suivi qualité", "Quality follow-up"],
      liens: [
        { href: "/qualite", fr: "Préférences des clients", en: "Client preferences", icone: Mic },
        { href: "/qualite/notation", fr: "Notation dans les deux sens", en: "Two-way ratings", icone: Star },
        { href: "/qualite/alertes", fr: "Alertes et journal", en: "Alerts and log", icone: Bell, compte: nonLues },
      ],
    },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-5">
        <Link href="/" onClick={onNaviguer} className="flex min-w-0 items-center gap-2.5">
          <span className="h-8 w-1.5 shrink-0 rounded-full bg-sapin" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate font-bold leading-tight">MénageSimple</span>
            <span className="block text-xs text-encre-3">{t("Propositions", "Proposals")}</span>
          </span>
        </Link>
        <CentreAlertes />
      </div>
      <nav aria-label={t("Navigation", "Navigation")} className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        <LienNav l={{ href: "/", fr: "Accueil", en: "Home", icone: House }} actif={chemin === "/"} onClick={onNaviguer} />
        {groupes.map((g) => (
          <div key={g.titre[0]}>
            <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-encre-3">{t(g.titre[0], g.titre[1])}</p>
            <div className="space-y-0.5">
              {g.liens.map((l) => <LienNav key={l.href} l={l} actif={chemin === l.href} onClick={onNaviguer} />)}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-trait px-3 py-3">
        <LienNav l={{ href: "/methode", fr: "Méthode et limites", en: "Method and limits", icone: FileText }} actif={chemin === "/methode"} onClick={onNaviguer} />
      </div>
    </div>
  );
}

/** Habillage des pages : barre latérale (ordinateur) ou barre du haut avec tiroir (mobile). L'accueil reste nu. */
export function Cadre({ children }: { children: React.ReactNode }) {
  const t = useT();
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => {
    document.body.style.overflow = ouvert ? "hidden" : "";
  }, [ouvert]);

  if (chemin === "/") {
    return (
      <>
        <div className="fixed right-6 top-5 z-[1200] rounded-xl bg-fond/80 px-2 py-1.5 backdrop-blur">
          <SelecteurLangue />
        </div>
        <div className="h-14" aria-hidden="true" />
        <main>{children}</main>
        <PiedDePage />
      </>
    );
  }

  return (
    <div className="min-h-dvh lg:pl-72">
      <aside className="fixed inset-y-0 left-0 z-[1100] hidden w-72 border-r border-trait lg:block">
        <ContenuNav />
      </aside>
      <header className="sticky top-0 z-[1100] flex h-14 items-center gap-3 border-b border-trait bg-fond/85 px-3 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOuvert(true)} className="rounded-lg p-2 hover:bg-sunken" aria-label={t("Ouvrir le menu", "Open menu")}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="h-6 w-1.5 shrink-0 rounded-full bg-sapin" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-bold">MénageSimple</span>
        <CentreAlertes />
        <SelecteurLangue />
      </header>
      {/* Drapeaux toujours en haut à droite. */}
      <div className="fixed right-6 top-5 z-[1200] hidden rounded-xl bg-fond/80 px-2 py-1.5 backdrop-blur lg:block">
        <SelecteurLangue />
      </div>
      {ouvert && (
        <div className="fixed inset-0 z-[1500] lg:hidden">
          <div className="absolute inset-0 bg-encre/40" onClick={() => setOuvert(false)} />
          <div className="arriver absolute inset-y-0 left-0 w-[86%] max-w-xs bg-surface shadow-pop">
            <button type="button" onClick={() => setOuvert(false)} className="absolute right-2 top-3 z-10 rounded-lg p-2 hover:bg-sunken" aria-label={t("Fermer le menu", "Close menu")}>
              <X className="h-5 w-5" />
            </button>
            <ContenuNav onNaviguer={() => setOuvert(false)} />
          </div>
        </div>
      )}
      <main>{children}</main>
      <PiedDePage />
    </div>
  );
}

function PiedDePage() {
  const t = useT();
  const chemin = usePathname();
  return (
    <footer className="mt-20">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-8 text-sm text-encre-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
        <p>{t("Prototype proposé à MénageSimple par Stéphane Tourigny, novembre 2026.", "Prototype proposed to MénageSimple by Stéphane Tourigny, November 2026.")}</p>
        {chemin === "/" && (
          <Link href="/methode" className="font-semibold text-sapin hover:underline">
            {t("Méthode, hypothèses et limites", "Method, assumptions and limits")}
          </Link>
        )}
      </div>
    </footer>
  );
}
