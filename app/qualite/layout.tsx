"use client";

import { Page, TitrePage } from "@/components/ui";
import { useT } from "@/lib/i18n";

export default function MiseEnPageQualite({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <Page>
      <TitrePage
        titre={t("Garder les clients, passage après passage", "Keep clients, visit after visit")}
        intro={t(
          "Ce que l'agent apprend chez un client ne doit plus rester dans sa tête : il le dicte en sortant, et sa note devient une fiche que lira le prochain remplaçant. Les notes vont dans les deux sens, et une mauvaise note prévient tout de suite les bonnes personnes.",
          "What a cleaner learns at a client's home shouldn't stay in their head: they dictate it on the way out, and the note becomes a sheet the next substitute will read. Ratings go both ways, and a bad rating alerts the right people at once.",
        )}
      />
      <div>{children}</div>
    </Page>
  );
}
