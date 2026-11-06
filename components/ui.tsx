"use client";

// Petits éléments partagés par tous les écrans.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-10">{children}</div>;
}

export function TitrePage({ titre, intro, children }: { titre: string; intro?: string; children?: React.ReactNode }) {
  return (
    <div className="pb-6 pt-6 lg:pt-10">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{titre}</h1>
      {intro && <p className="mt-1 max-w-2xl text-[15px] text-encre-2">{intro}</p>}
      {children}
    </div>
  );
}

export function SousNavigation({ liens }: { liens: { href: string; fr: string; en: string }[] }) {
  const t = useT();
  const chemin = usePathname();
  return (
    <nav aria-label={t("Dans cette section", "In this section")} className="-mx-1 flex gap-1 overflow-x-auto border-b border-trait pb-px">
      {liens.map((l) => {
        const actif = chemin === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={actif ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-[0.95rem] font-medium transition ${
              actif ? "border-sapin text-encre" : "border-transparent text-encre-2 hover:border-trait-fort hover:text-encre"
            }`}
          >
            {t(l.fr, l.en)}
          </Link>
        );
      })}
    </nav>
  );
}

export function Etoiles({ valeur, taille = "h-4 w-4" }: { valeur: number; taille?: string }) {
  return (
    <span className="inline-flex" aria-label={`${valeur}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${taille} ${n <= Math.round(valeur) ? "fill-encre text-encre" : "text-trait-fort"}`} strokeWidth={1.6} />
      ))}
    </span>
  );
}

export function Bouton({
  children, variante = "plein", className = "", ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "plein" | "contour" | "citron" | "discret" | "danger" }) {
  const styles = {
    plein: "bg-sapin text-sur-sapin shadow-sm hover:bg-sapin-fonce",
    contour: "border border-trait-fort bg-surface text-encre hover:bg-sunken",
    citron: "bg-sapin-clair text-sapin hover:bg-sapin/15",
    discret: "text-encre-2 hover:bg-sunken hover:text-encre",
    danger: "bg-alerte text-white hover:bg-alerte/90",
  }[variante];
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex min-h-10 select-none items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Pastille({ children, ton = "neutre" }: { children: React.ReactNode; ton?: "neutre" | "ok" | "alerte" | "attention" | "sapin" }) {
  const styles = {
    neutre: "bg-sunken text-encre-2",
    ok: "bg-ok-fond text-ok",
    alerte: "bg-alerte-fond text-alerte",
    attention: "bg-attention-fond text-attention",
    sapin: "bg-sapin-clair text-sapin",
  }[ton];
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>{children}</span>;
}

/** Appel aux routes d'IA de l'application. */
export async function appelerIA<T>(corps: Record<string, unknown>): Promise<{ donnees: T; source: "ia" | "regles"; erreur?: string }> {
  const r = await fetch("/api/ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
  if (!r.ok) throw new Error(`IA ${r.status}`);
  return r.json();
}
