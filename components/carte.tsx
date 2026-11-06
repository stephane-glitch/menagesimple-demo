"use client";

// Carte Leaflet sur fond OpenStreetMap (gratuit, sans clé). Chargée côté navigateur seulement.
//
// Leaflet est piloté directement, sans react-leaflet : Next garde en mémoire, masquées,
// les pages déjà visitées, et réaffiche la même zone de la page au retour. La carte est
// donc créée quand la page s'affiche et détruite quand elle est masquée ; sinon Leaflet
// refuse de se réinstaller (« Map container is being reused by another instance »).

import "leaflet/dist/leaflet.css";
import L, { type LatLngBoundsExpression } from "leaflet";
import { useEffect, useRef } from "react";

export type PointCarte = {
  id: string;
  lat: number;
  lon: number;
  rayon: number;
  couleur: string;
  remplissage: string;
  etiquette: string;
  permanent?: boolean;
  actif?: boolean;
};

export type Zone = { lat: number; lon: number; rayonM: number; couleur: string };

const AUCUNE_ZONE: Zone[] = [];

export default function Carte({
  points, trace, limites, hauteur = 420, onChoisir, zones = AUCUNE_ZONE,
}: {
  points: PointCarte[];
  zones?: Zone[];
  trace?: [number, number][];
  limites: LatLngBoundsExpression;
  hauteur?: number;
  onChoisir?: (id: string) => void;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const carte = useRef<L.Map | null>(null);
  const calque = useRef<L.LayerGroup | null>(null);
  const choisir = useRef(onChoisir);

  useEffect(() => {
    choisir.current = onChoisir;
  }, [onChoisir]);

  // Création à l'affichage, destruction au masquage ou au démontage.
  useEffect(() => {
    if (!cadre.current) return;
    const m = L.map(cadre.current, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m);
    m.fitBounds(limites, { padding: [28, 28] });
    calque.current = L.layerGroup().addTo(m);
    carte.current = m;
    return () => {
      m.remove();
      carte.current = null;
      calque.current = null;
    };
    // Les limites initiales suffisent à la création ; leurs changements sont suivis plus bas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carte.current?.fitBounds(limites, { padding: [28, 28] });
  }, [limites]);

  // Dessin des cercles, du trajet et des points ; refait quand les données changent.
  useEffect(() => {
    const groupe = calque.current;
    if (!groupe) return;
    groupe.clearLayers();
    for (const z of zones) {
      L.circle([z.lat, z.lon], { radius: z.rayonM, color: z.couleur, fillColor: z.couleur, fillOpacity: 0.12, weight: 2, dashArray: "4 5" }).addTo(groupe);
    }
    if (trace && trace.length > 1) {
      L.polyline(trace, { color: "#17152b", weight: 3, dashArray: "6 7" }).addTo(groupe);
    }
    for (const p of points) {
      const marqueur = L.circleMarker([p.lat, p.lon], {
        radius: p.rayon, color: p.couleur, fillColor: p.remplissage, fillOpacity: 0.85, weight: p.actif ? 4 : 2,
      })
        .bindTooltip(p.etiquette, { direction: "top", offset: [0, -p.rayon], permanent: p.permanent })
        .addTo(groupe);
      marqueur.on("click", () => choisir.current?.(p.id));
    }
  }, [points, zones, trace]);

  return <div ref={cadre} style={{ height: hauteur }} className="overflow-hidden rounded-xl border border-trait" />;
}
