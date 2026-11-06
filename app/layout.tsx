import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { FournisseurLangue } from "@/lib/i18n";
import { FournisseurSimulation } from "@/lib/simulation";
import { Cadre } from "@/components/en-tete";
import { Notifications } from "@/components/notifications";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Propositions pour MénageSimple",
  description: "Des briques à ajouter à l'outil de MénageSimple : recrutement, gestion des talents, suivi qualité.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="min-h-screen">
        <FournisseurLangue>
          <FournisseurSimulation>
            <Cadre>{children}</Cadre>
            <Notifications />
          </FournisseurSimulation>
        </FournisseurLangue>
      </body>
    </html>
  );
}
