# Propositions pour MénageSimple

Prototype proposé à Stonks Holding AG pour MénageSimple (exercice du deuxième tour, novembre 2026).
Ces briques s'attaquent aux 4,00 CHF d'organisation compris dans chaque heure de ménage à 43,90 CHF :
recruter là où l'on perd des réservations, gérer les agents, garder les clients.

- **Recrutement** : demandes clients avec alerte sur les zones en manque, recherche réelle sur travail.swiss avec liens directs vers les fiches, message à l'ORP validé par une personne, parrainage entre agents (prime augmentée dans les zones en manque), page de candidature, présélection par l'IA.
- **Gestion des talents** : planning d'une personne avec les trajets (la journée tient-elle ?), déclaration d'arrivée et de départ sur place, absence signalée en un clic et remplacement avec prime d'urgence, connaissance métier (fiches à consulter), assistant ménage.
- **Suivi qualité** : notes vocales des agents reformulées en fiche du logement, notation dans les deux sens, alerte simulée dès 1 ou 2 étoiles, journal des envois.
- Français et anglais sur tous les écrans (drapeaux en haut à droite).

La page « Méthode » de l'application détaille ce qui est réel, fictif ou simulé, les hypothèses et les limites.

## Lancer en local

```bash
npm install
npm test
npm run dev
```

Puis ouvrir http://localhost:3000.

Parcours de bout en bout dans un navigateur (Playwright installé) :

```bash
node tests/e2e/parcours-jobroom.js
node tests/e2e/parcours-qualite.js
node tests/e2e/langue.js
```

`BASE=https://…` pour viser une version déployée.

Sans clé d'API, l'application fonctionne : des règles simples remplacent l'IA et l'écran l'indique.
Pour brancher l'IA, créer un fichier `.env.local` avec l'une des deux clés :

```bash
GEMINI_API_KEY=...          # Gemini, modèle gemini-3.5-flash (GEMINI_MODEL pour en changer)
ANTHROPIC_API_KEY=sk-ant-... # Claude Opus 5.5, prioritaire si les deux clés existent
```

Le choix du fournisseur se fait dans `lib/ia/serveur.ts`.

## Déployer sur Vercel

1. Importer le dépôt dans Vercel (Node 24, fixé dans `package.json`).
2. Ajouter la variable d'environnement `GEMINI_API_KEY` (ou `ANTHROPIC_API_KEY`) en Production et Preview, puis redéployer : une variable ajoutée après coup ne s'applique qu'au déploiement suivant.
3. Déployer. Aucune base de données : l'état de la démonstration vit dans le navigateur de chaque visiteur.

## Organisation du code

- `app/` : les écrans (Next.js 16) et les routes serveur `app/api/jobroom` (recherche travail.swiss) et `app/api/ia` (Gemini ou Claude).
- `lib/regles/` : les règles métier pures, testées (trajets, zone d'arrivée, parrainage, notation, remplacement).
- `lib/ia/` : appels à l'IA (`serveur.ts`, `actions.ts`) et réponses de secours sans IA (`repli.ts`).
- `lib/protection.ts` : routes serveur réservées aux pages du site et nombre d'appels limité.
- `lib/jobroom.ts` : format de la recherche travail.swiss, anonymisation des profils.
- `lib/donnees/` : données fictives à graine fixe.
- `tests/` : tests vitest.

## Sécurité

- En-têtes envoyés avec chaque page (`next.config.ts`) : politique de contenu (CSP) limitée au site et aux tuiles OpenStreetMap, interdiction d'affichage dans un cadre, position et micro réservés au site.
- Routes serveur : refusent les appels venant d'un autre site ou d'un script sans en-têtes de navigateur, valident chaque entrée (zod), limitent la taille des requêtes et le nombre d'appels ; au-delà, l'IA laisse la place aux règles simples.
- Les clés d'API restent côté serveur, jamais envoyées au navigateur. Fixer aussi un plafond de requêtes sur la clé chez le fournisseur d'IA.
- Aucune donnée personnelle stockée : les profils travail.swiss sont anonymisés avant d'arriver au navigateur (ni nom, ni genre, ni coordonnées).

## Données

Personnes, clients, passages, candidatures et notes sont fictifs (adresses e-mail en `exemple.test`).
La recherche travail.swiss est réelle : seuls des champs anonymes sont lus, rien n'est stocké, chaque profil renvoie à sa fiche officielle.
Les conditions de travail.swiss soumettent la reprise de contenus à une autorisation du SECO : pour un usage réel, MénageSimple demande le compte « placeur privé » de Job-Room.
Les notes vocales d'exemple sont des voix de synthèse (ElevenLabs) lisant un texte fictif.
