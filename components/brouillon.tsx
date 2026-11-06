"use client";

// Un brouillon n'est jamais envoyé tel quel : une personne le relit,
// peut le modifier, puis le valide. L'envoi est simulé et inscrit au journal.

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useIdentifiant, useSimulation } from "@/lib/simulation";
import { Bouton } from "./ui";
import type { Canal } from "@/lib/regles/notation";

export function Brouillon({
  titre, destinataire, canal, objetInitial, corpsInitial, source, avecObjet = true,
}: {
  titre: string;
  destinataire: string;
  canal: Canal;
  objetInitial?: string;
  corpsInitial: string;
  source: "ia" | "regles" | "modele";
  erreur?: string;
  avecObjet?: boolean;
}) {
  const t = useT();
  const { envoyer } = useSimulation();
  const id = useIdentifiant();
  const [objet, setObjet] = useState(objetInitial ?? "");
  const [corps, setCorps] = useState(corpsInitial);
  const [envoye, setEnvoye] = useState<string | null>(null);
  const modifie = objet !== (objetInitial ?? "") || corps !== corpsInitial;

  function valider() {
    const date = new Date().toISOString();
    envoyer({ type: "envoyer", envoi: { id: id("envoi"), date, canal, destinataire, objet, corps, source: source === "ia" ? "ia" : "regles", modifieAvantEnvoi: modifie } });
    setEnvoye(date);
  }

  return (
    <section className="rounded-xl border border-trait bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold">{titre}</h3>
      </div>
      <p className="mt-1 text-sm text-encre-2">
        {t("À :", "To:")} <span className="font-medium text-encre">{destinataire}</span>
      </p>
      {avecObjet && (
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-encre-2">{t("Objet", "Subject")}</span>
          <input
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            disabled={!!envoye}
            className="mt-1 w-full rounded-lg border border-trait bg-fond px-3 py-2 text-sm disabled:opacity-70"
          />
        </label>
      )}
      <label className="mt-3 block">
        <span className="text-xs font-semibold text-encre-2">{t("Message (modifiable avant l'envoi)", "Message (editable before sending)")}</span>
        <textarea
          value={corps}
          onChange={(e) => setCorps(e.target.value)}
          disabled={!!envoye}
          rows={Math.min(16, Math.max(5, corps.split("\n").length + 1))}
          className="mt-1 w-full resize-y rounded-lg border border-trait bg-fond px-3 py-2 text-sm leading-relaxed disabled:opacity-70"
        />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {envoye ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-ok">
            <Check className="h-4 w-4" />
            {t("Validé et envoyé (simulation). Inscrit au journal des envois.", "Approved and sent (simulated). Added to the send log.")}
          </p>
        ) : (
          <>
            <Bouton onClick={valider}>
              <Send className="h-4 w-4" /> {t("Relu, valider l'envoi", "Reviewed, approve sending")}
            </Bouton>
            <span className="text-xs text-encre-3">
              {modifie ? t("Vous avez modifié le texte : la version modifiée part.", "You edited the text: the edited version will be sent.") : t("Rien ne part sans ce clic.", "Nothing goes out without this click.")}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
