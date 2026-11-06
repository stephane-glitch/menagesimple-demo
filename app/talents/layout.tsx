"use client";

import { Page, TitrePage } from "@/components/ui";
import { useT } from "@/lib/i18n";

export default function MiseEnPageTalents({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <Page>
      <TitrePage
        titre={t("Le téléphone de l'agent, et ce qu'il fait gagner au bureau", "The cleaner's phone, and what it saves the office")}
        intro={t(
          "Le mardi 10 novembre, vu depuis le téléphone des agents et depuis le bureau. Chaque écran montre aussi ce que le bureau y gagne.",
          "Tuesday 10 November, seen from the cleaners' phones and from the office. Each screen also shows what the office gains.",
        )}
      />
      <div>{children}</div>
    </Page>
  );
}
