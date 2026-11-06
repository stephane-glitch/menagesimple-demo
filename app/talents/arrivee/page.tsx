"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { LocateFixed, LogIn, LogOut, MapPin, RotateCcw, ShieldCheck } from "lucide-react";
import { useLangue, useT } from "@/lib/i18n";
import { client, PASSAGES_ANA } from "@/lib/donnees";
import { distanceM, peutPointer, RAYON_POINTAGE_M, type Point } from "@/lib/regles/geo";
import { useSimulation } from "@/lib/simulation";
import { Bouton, Pastille } from "@/components/ui";

const Carte = dynamic(() => import("@/components/carte"), { ssr: false, loading: () => <div className="h-[360px] rounded-xl bg-sapin-clair" /> });

const PASSAGE = PASSAGES_ANA[0];
const LOGEMENT = client(PASSAGE.clientId);

/** Zone autour du logement où la déclaration est acceptée. */
const ZONE_POINTAGE = [{ lat: LOGEMENT.position.lat, lon: LOGEMENT.position.lon, rayonM: RAYON_POINTAGE_M, couleur: "#5b4bdb" }];

const POSITIONS: { cle: string; fr: string; en: string; point: Point }[] = [
  { cle: "rue", fr: "Dans la rue d'à côté", en: "On the next street", point: { lat: 46.5131, lon: 6.6716 } },
  { cle: "porte", fr: "Devant l'immeuble", en: "In front of the building", point: { lat: 46.51216, lon: 6.67035 } },
];

export default function ArriveeDepart() {
  const t = useT();
  const { langue } = useLangue();
  const { etat, envoyer } = useSimulation();
  const [position, setPosition] = useState<Point>(POSITIONS[0].point);
  const [sourcePosition, setSourcePosition] = useState<"simulee" | "reelle">("simulee");
  const [messageGeo, setMessageGeo] = useState<string | null>(null);
  const verif = peutPointer(position, LOGEMENT.position);
  const arrivee = etat.pointages.find((p) => p.passageId === PASSAGE.id && p.type === "arrivee");
  const depart = etat.pointages.find((p) => p.passageId === PASSAGE.id && p.type === "depart");
  const heure = (iso: string) => new Date(iso).toLocaleTimeString(langue === "fr" ? "fr-CH" : "en-GB", { hour: "2-digit", minute: "2-digit" });

  function vraiePosition() {
    if (!navigator.geolocation) {
      setMessageGeo(t("Ce navigateur ne donne pas la position.", "This browser does not provide location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lon: p.coords.longitude });
        setSourcePosition("reelle");
        setMessageGeo(t(`Votre vraie position est à ${(distanceM({ lat: p.coords.latitude, lon: p.coords.longitude }, LOGEMENT.position) / 1000).toFixed(1)} km du logement : le bouton reste bloqué, c'est normal.`,
          `Your real position is ${(distanceM({ lat: p.coords.latitude, lon: p.coords.longitude }, LOGEMENT.position) / 1000).toFixed(1)} km from the home: the button stays locked, as expected.`));
      },
      () => setMessageGeo(t("Position refusée ou indisponible : utilisez les positions simulées.", "Location denied or unavailable: use the simulated positions.")),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function declarer(type: "arrivee" | "depart") {
    envoyer({ type: "pointer", pointage: { passageId: PASSAGE.id, type, heure: new Date().toISOString(), distanceM: verif.distanceM } });
  }

  const points = useMemo(() => [
    { id: "logement", lat: LOGEMENT.position.lat, lon: LOGEMENT.position.lon, rayon: 9, couleur: "#17152b", remplissage: "#ffb547", etiquette: LOGEMENT.nom, permanent: true },
    { id: "agent", lat: position.lat, lon: position.lon, rayon: 7, couleur: "#5b4bdb", remplissage: "#5b4bdb", etiquette: "Ana", permanent: true },
  ], [position]);
  const limites = useMemo(() => {
    const lats = [LOGEMENT.position.lat, position.lat];
    const lons = [LOGEMENT.position.lon, position.lon];
    return [[Math.min(...lats) - 0.003, Math.min(...lons) - 0.004], [Math.max(...lats) + 0.003, Math.max(...lons) + 0.004]] as [[number, number], [number, number]];
  }, [position]);

  const dureeDeclaree = arrivee && depart ? Math.round((new Date(depart.heure).getTime() - new Date(arrivee.heure).getTime()) / 60000) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
      <div className="telephone mx-auto w-full max-w-[380px] self-start rounded-[2.2rem] border-[10px] border-encre bg-fond p-4 shadow-[0_30px_60px_-30px_rgba(23,21,43,0.6)]">
        <p className="text-center text-xs text-encre-3">{t("Application de l'agent", "Cleaner's app")}</p>
        <p className="mt-3 text-xs font-semibold text-encre-2">{t("Passage en cours", "Current visit")} · 08:00</p>
        <h3 className="text-xl font-extrabold">{LOGEMENT.nom}</h3>
        <p className="text-sm text-encre-2">{LOGEMENT.adresse}, {LOGEMENT.commune}</p>

        <div className={`mt-4 rounded-xl p-3.5 ${verif.autorise ? "bg-ok-fond" : "bg-surface"}`}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className={`h-4 w-4 ${verif.autorise ? "text-ok" : "text-encre-3"}`} />
            {verif.autorise
              ? t(`Sur place (${verif.distanceM} m)`, `On site (${verif.distanceM} m)`)
              : t(`À ${verif.distanceM >= 1000 ? `${(verif.distanceM / 1000).toFixed(1)} km` : `${verif.distanceM} m`} du logement`, `${verif.distanceM >= 1000 ? `${(verif.distanceM / 1000).toFixed(1)} km` : `${verif.distanceM} m`} from the home`)}
          </p>
          <p className="mt-1 text-xs text-encre-2">{t(`La déclaration s'ouvre à moins de ${RAYON_POINTAGE_M} m du logement.`, `Declaring opens within ${RAYON_POINTAGE_M} m of the home.`)}</p>
        </div>

        <div className="mt-4 grid gap-2">
          {!arrivee ? (
            <Bouton onClick={() => declarer("arrivee")} disabled={!verif.autorise} className="min-h-12 w-full">
              <LogIn className="h-4 w-4" /> {t("Déclarer mon arrivée", "Declare my arrival")}
            </Bouton>
          ) : !depart ? (
            <>
              <p className="text-center text-sm">{t("Arrivée déclarée à", "Arrival declared at")} <span className="chiffres font-bold">{heure(arrivee.heure)}</span></p>
              <Bouton onClick={() => declarer("depart")} disabled={!verif.autorise} variante="citron" className="min-h-12 w-full">
                <LogOut className="h-4 w-4" /> {t("Déclarer mon départ", "Declare my departure")}
              </Bouton>
            </>
          ) : (
            <p className="rounded-xl bg-surface p-3 text-center text-sm">
              {t("Arrivée", "Arrival")} <span className="chiffres font-bold">{heure(arrivee.heure)}</span> · {t("départ", "departure")} <span className="chiffres font-bold">{heure(depart.heure)}</span>
            </p>
          )}
          {arrivee && (
            <button type="button" onClick={() => envoyer({ type: "effacer-pointages", passageId: PASSAGE.id })}
              className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-encre-2 underline-offset-2 hover:underline">
              <RotateCcw className="h-3.5 w-3.5" />{t("Recommencer la démonstration", "Restart the demo")}
            </button>
          )}
        </div>

        <p className="mt-5 text-xs font-semibold text-encre-2">{t("Démonstration : où est Ana ?", "Demo: where is Ana?")}</p>
        <div className="mt-2 grid gap-1.5">
          <button type="button" onClick={vraiePosition} aria-pressed={sourcePosition === "reelle"}
            className={`flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-left text-sm ${sourcePosition === "reelle" ? "border-sapin bg-surface font-semibold" : "border-trait-fort"}`}>
            <LocateFixed className="h-4 w-4" /> {t("Essayer avec ma vraie position", "Try with my real location")}
          </button>
          {POSITIONS.map((p) => (
            <button key={p.cle} type="button" onClick={() => { setPosition(p.point); setSourcePosition("simulee"); setMessageGeo(null); }}
              aria-pressed={sourcePosition === "simulee" && position === p.point}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${sourcePosition === "simulee" && position === p.point ? "border-sapin bg-surface font-semibold" : "border-trait bg-surface/60"}`}>
              {t(p.fr, p.en)} <span className="chiffres text-encre-3">· {Math.round(distanceM(p.point, LOGEMENT.position))} m</span>
            </button>
          ))}
        </div>
        {messageGeo && <p className="mt-2 text-xs text-encre-2">{messageGeo}</p>}
      </div>

      <div className="min-w-0">
        <Carte points={points} zones={ZONE_POINTAGE} limites={limites} hauteur={360} />
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-bold">{t("Côté bureau", "Office side")}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3 rounded-lg border border-trait bg-surface px-3 py-2">
                <span>{LOGEMENT.nom} · 08:00 - 10:30</span>
                {depart ? <Pastille ton="ok">{dureeDeclaree} min</Pastille> : arrivee ? <Pastille ton="sapin">{t("en cours", "in progress")}</Pastille> : <Pastille ton="attention">{t("arrivée non déclarée", "arrival not declared")}</Pastille>}
              </li>
              {PASSAGES_ANA.slice(1, 3).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-trait bg-surface px-3 py-2 text-encre-2">
                  <span>{client(p.clientId).nom}</span><Pastille>{t("à venir", "upcoming")}</Pastille>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-encre-2">
              {t("Si l'arrivée n'est pas déclarée 15 minutes après l'heure prévue, l'équipe de coordination est prévenue et peut lancer un remplacement avant que le client n'appelle.",
                "If no arrival is declared 15 minutes after the planned time, the coordinator is alerted and can arrange cover before the client calls.")}
            </p>
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-sapin" />{t("Vie privée", "Privacy")}</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-encre-2">
              <li>{t("La position n'est lue qu'au moment où l'agent appuie sur le bouton. Aucun suivi continu.", "The location is read only when the cleaner presses the button. No continuous tracking.")}</li>
              <li>{t("L'agent donne son accord et peut déclarer son arrivée sans géolocalisation ; elle est alors marquée « à vérifier ».", "The cleaner gives consent and can declare arrival without location; it is then marked “to verify”.")}</li>
              <li>{t("Les heures déclarées protègent l'agent en cas de litige et servent au calcul des heures.", "Declared times protect the cleaner in a dispute and are used to count hours worked.")}</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
