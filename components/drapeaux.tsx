"use client";

import { useLangue, type Langue } from "@/lib/i18n";

function DrapeauFrance() {
  return (
    <svg viewBox="0 0 3 2" aria-hidden="true" className="h-full w-full">
      <rect width="1" height="2" x="0" fill="#0055A4" />
      <rect width="1" height="2" x="1" fill="#FFFFFF" />
      <rect width="1" height="2" x="2" fill="#EF4135" />
    </svg>
  );
}

function DrapeauRoyaumeUni() {
  return (
    <svg viewBox="0 0 60 40" aria-hidden="true" className="h-full w-full">
      <clipPath id="ru-clip">
        <rect width="60" height="40" />
      </clipPath>
      <g clipPath="url(#ru-clip)">
        <rect width="60" height="40" fill="#012169" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
        <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="12" />
        <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
      </g>
    </svg>
  );
}

const OPTIONS: { code: Langue; nom: string; Drapeau: () => React.JSX.Element }[] = [
  { code: "fr", nom: "Français", Drapeau: DrapeauFrance },
  { code: "en", nom: "English", Drapeau: DrapeauRoyaumeUni },
];

export function SelecteurLangue() {
  const { langue, changer } = useLangue();
  return (
    <div role="group" aria-label={langue === "fr" ? "Langue" : "Language"} className="flex items-center gap-3">
      {OPTIONS.map(({ code, nom, Drapeau }) => {
        const actif = langue === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => changer(code)}
            aria-pressed={actif}
            title={nom}
            className={`relative h-[22px] w-[33px] overflow-hidden rounded-[3px] transition ${
              actif ? "ring-2 ring-sapin ring-offset-2 ring-offset-fond" : "opacity-45 grayscale-[40%] hover:opacity-90 hover:grayscale-0"
            }`}
          >
            <span className="sr-only">{nom}</span>
            <Drapeau />
          </button>
        );
      })}
    </div>
  );
}
