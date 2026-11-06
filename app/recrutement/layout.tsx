"use client";

import { Page, TitrePage } from "@/components/ui";
import { useT } from "@/lib/i18n";

export default function MiseEnPageRecrutement({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <Page>
      <TitrePage
        titre={t("Recrutement", "Recruitment")}
        intro={t(
          "Les demandes de vos clients, telles que votre outil les reçoit. Un triangle signale une demande dans une zone où vous n'avez pas assez d'agents : cherchez des personnes sur internet ou lancez le parrainage.",
          "Your clients' requests, as your tool receives them. A triangle flags a request in an area where you don't have enough cleaners: search for people online or start a referral drive.",
        )}
      />
      <div>{children}</div>
    </Page>
  );
}
