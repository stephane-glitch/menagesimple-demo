import type { NextConfig } from "next";

// En-têtes de sécurité envoyés avec chaque page.
// - CSP : scripts, styles et appels seulement vers ce site ; images en plus depuis les tuiles OpenStreetMap.
//   Les scripts en ligne restent permis : Next.js en a besoin pour des pages statiques (sans nonce).
// - Pas d'affichage dans un cadre d'un autre site, pas de devinette du type de fichier.
// - Navigateur : position et micro seulement pour ce site (déclaration d'arrivée, dictée), le reste coupé.
const developpement = process.env.NODE_ENV === "development";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${developpement ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self'${developpement ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const entetes = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), microphone=(self), camera=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:chemin*", headers: entetes }];
  },
  cacheComponents: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
