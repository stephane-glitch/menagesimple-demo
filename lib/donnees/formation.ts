// Modules de formation courts et base de connaissances de l'assistant ménage
// (utilisée sans clé d'IA). Contenus métier relus : règles de sécurité classiques
// du nettoyage domestique, sans marque de produit.

type T = { fr: string; en: string };

export type Question = { question: T; choix: T[]; bonne: number; explication: T };

export type Module = {
  id: string;
  titre: T;
  minutes: number;
  points: T[];
  quiz: Question[];
  lienNotation?: string; // critère de notation qui recommande ce module
};

export const MODULES: Module[] = [
  {
    id: "securite",
    titre: { fr: "Produits et sécurité", en: "Products and safety" },
    minutes: 4,
    lienNotation: "general",
    points: [
      { fr: "Ne jamais mélanger javel et vinaigre, détartrant ou ammoniaque : le mélange dégage des gaz toxiques.", en: "Never mix bleach with vinegar, descaler or ammonia: the mixture releases toxic gases." },
      { fr: "Aérer la pièce pendant l'utilisation d'un produit fort.", en: "Ventilate the room while using a strong product." },
      { fr: "Porter des gants, et garder chaque produit dans son flacon d'origine, étiquette lisible.", en: "Wear gloves and keep every product in its original, labelled bottle." },
      { fr: "Lire les pictogrammes de danger avant d'utiliser un produit inconnu du client.", en: "Read the hazard pictograms before using a product you do not know." },
    ],
    quiz: [
      {
        question: { fr: "Le client propose du vinaigre pour finir la douche que vous venez de traiter à la javel. Que faites-vous ?", en: "The client suggests vinegar to finish the shower you just cleaned with bleach. What do you do?" },
        choix: [
          { fr: "Je rince abondamment à l'eau claire et je n'ajoute pas de vinaigre aujourd'hui", en: "I rinse thoroughly with clean water and add no vinegar today" },
          { fr: "Je mélange les deux pour gagner du temps", en: "I mix both to save time" },
          { fr: "J'ajoute le vinaigre directement", en: "I add the vinegar straight away" },
        ],
        bonne: 0,
        explication: { fr: "Javel et acide ne doivent jamais se rencontrer, même sur une surface.", en: "Bleach and acid must never meet, even on a surface." },
      },
      {
        question: { fr: "Un produit a été transvasé dans une bouteille d'eau sans étiquette. Vous…", en: "A product was poured into an unlabelled water bottle. You…" },
        choix: [
          { fr: "L'utilisez si l'odeur rappelle un produit connu", en: "Use it if the smell reminds you of a known product" },
          { fr: "Ne l'utilisez pas et signalez-le au client et au bureau", en: "Don't use it and report it to the client and the office" },
          { fr: "Le versez dans l'évier", en: "Pour it down the sink" },
        ],
        bonne: 1,
        explication: { fr: "Sans étiquette, on ne connaît ni le produit ni ses dangers.", en: "Without a label you know neither the product nor its hazards." },
      },
    ],
  },
  {
    id: "calcaire",
    titre: { fr: "Salle de bain et calcaire", en: "Bathroom and limescale" },
    minutes: 5,
    lienNotation: "salle-de-bain",
    points: [
      { fr: "Le calcaire s'enlève avec un produit acide (vinaigre blanc, acide citrique) sur la robinetterie, le verre et la céramique.", en: "Limescale comes off with an acid (white vinegar, citric acid) on taps, glass and ceramic." },
      { fr: "Jamais d'acide sur la pierre naturelle (marbre, calcaire, travertin) : il la ronge. Utiliser un produit au pH neutre.", en: "Never use acid on natural stone (marble, limestone, travertine): it etches it. Use a pH-neutral product." },
      { fr: "Laisser agir quelques minutes, frotter sans abrasif, rincer, puis essuyer pour éviter les traces.", en: "Let it act for a few minutes, scrub without abrasives, rinse, then wipe dry to avoid marks." },
      { fr: "Joints noircis : brosse et produit adapté ; si la moisissure revient, le signaler (problème d'aération).", en: "Darkened grout: brush and a suitable product; if mould comes back, report it (ventilation issue)." },
    ],
    quiz: [
      {
        question: { fr: "La douche du client est en marbre. Pour le calcaire, vous utilisez…", en: "The client's shower is marble. For limescale, you use…" },
        choix: [
          { fr: "Du vinaigre blanc pur", en: "Pure white vinegar" },
          { fr: "Un nettoyant au pH neutre et un chiffon microfibre", en: "A pH-neutral cleaner and a microfibre cloth" },
          { fr: "Une éponge abrasive", en: "An abrasive sponge" },
        ],
        bonne: 1,
        explication: { fr: "L'acide attaque le marbre et laisse des marques mates définitives.", en: "Acid attacks marble and leaves permanent dull marks." },
      },
      {
        question: { fr: "Après avoir détartré une paroi en verre, il reste des traces. Il manque…", en: "After descaling a glass panel, marks remain. What is missing?" },
        choix: [
          { fr: "Un deuxième produit", en: "A second product" },
          { fr: "Le rinçage et le séchage", en: "Rinsing and drying" },
          { fr: "Plus de temps de pose", en: "More contact time" },
        ],
        bonne: 1,
        explication: { fr: "Rincer puis essuyer à la raclette ou à la microfibre évite les traces.", en: "Rinse, then squeegee or wipe with microfibre to avoid marks." },
      },
    ],
  },
  {
    id: "materiaux",
    titre: { fr: "Matériaux délicats", en: "Delicate materials" },
    minutes: 5,
    lienNotation: "sols",
    points: [
      { fr: "Parquet huilé ou vitrifié : serpillière juste humide, bien essorée ; jamais d'eau en flaque.", en: "Oiled or lacquered parquet: a barely damp, well-wrung mop; never standing water." },
      { fr: "Inox : chiffon humide dans le sens du brossage, puis chiffon sec.", en: "Stainless steel: damp cloth along the grain, then a dry cloth." },
      { fr: "Plaque vitrocéramique ou induction : grattoir à lame pour les résidus, pas d'éponge abrasive.", en: "Ceramic or induction hob: blade scraper for residue, no abrasive sponge." },
      { fr: "Bois brut ou ciré (table, plan de travail) : demander au client avant tout produit.", en: "Raw or waxed wood (table, worktop): ask the client before using any product." },
    ],
    quiz: [
      {
        question: { fr: "Le salon a un parquet huilé. Vous…", en: "The living room has oiled parquet. You…" },
        choix: [
          { fr: "Lavez à grande eau avec un produit dégraissant", en: "Wash with lots of water and a degreaser" },
          { fr: "Aspirez, puis passez une serpillière à peine humide", en: "Vacuum, then use a barely damp mop" },
          { fr: "Utilisez un nettoyeur vapeur", en: "Use a steam cleaner" },
        ],
        bonne: 1,
        explication: { fr: "L'eau en excès fait gonfler le bois et abîme l'huile.", en: "Excess water swells the wood and damages the oil finish." },
      },
    ],
  },
  {
    id: "fin-de-bail",
    titre: { fr: "Nettoyage de fin de bail", en: "End-of-lease cleaning" },
    minutes: 6,
    lienNotation: "fin-de-bail",
    points: [
      { fr: "Les régies vérifient les recoins : intérieur des armoires, dessus des portes, plinthes, interrupteurs.", en: "Property managers check corners: inside cupboards, tops of doors, skirting boards, switches." },
      { fr: "Fenêtres : vitres, cadres, joints et rails ; stores et volets si le client l'a demandé.", en: "Windows: glass, frames, seals and tracks; blinds and shutters if the client asked." },
      { fr: "Cuisine : four, plaques, hotte et filtre, frigo dégivré et ouvert, sous l'évier.", en: "Kitchen: oven, hob, hood and filter, fridge defrosted and left open, under the sink." },
      { fr: "Noter ce qui est abîmé avant de commencer et le signaler : ce n'est pas un défaut de nettoyage.", en: "Note any damage before starting and report it: it is not a cleaning fault." },
    ],
    quiz: [
      {
        question: { fr: "Vous trouvez une plinthe cassée en arrivant. Vous…", en: "You find a broken skirting board on arrival. You…" },
        choix: [
          { fr: "Ne dites rien, ce n'est pas votre faute", en: "Say nothing, it's not your fault" },
          { fr: "Prenez une photo de la plinthe seule et prévenez le bureau", en: "Take a photo of the board only and inform the office" },
          { fr: "Essayez de la recoller", en: "Try to glue it back" },
        ],
        bonne: 1,
        explication: { fr: "Signaler tout de suite protège le client et l'agent lors de l'état des lieux.", en: "Reporting immediately protects both client and cleaner at the inspection." },
      },
    ],
  },
  {
    id: "discretion",
    titre: { fr: "Relation client et discrétion", en: "Client relations and discretion" },
    minutes: 3,
    lienNotation: "discretion",
    points: [
      { fr: "Ce qu'on voit chez un client reste chez lui : pas de photos du logement, pas de récit à des tiers.", en: "What you see at a client's stays there: no photos of the home, no stories to others." },
      { fr: "Une casse se signale le jour même : l'assurance responsabilité civile couvre les dommages.", en: "Report any breakage the same day: liability insurance covers damage." },
      { fr: "Clés et codes : jamais notés avec l'adresse, rendus au bureau en fin de contrat.", en: "Keys and codes: never written down with the address, returned to the office when the contract ends." },
    ],
    quiz: [
      {
        question: { fr: "Vous cassez un verre de la cliente. Vous…", en: "You break the client's glass. You…" },
        choix: [
          { fr: "Le remplacez discrètement par un autre", en: "Quietly replace it with another" },
          { fr: "Le signalez le jour même au client et au bureau", en: "Report it the same day to the client and the office" },
          { fr: "Attendez qu'elle s'en aperçoive", en: "Wait for her to notice" },
        ],
        bonne: 1,
        explication: { fr: "La transparence garde la confiance, et l'assurance est là pour ça.", en: "Transparency keeps trust, and the insurance is there for that." },
      },
    ],
  },
  {
    id: "methode",
    titre: { fr: "Méthode et posture", en: "Method and posture" },
    minutes: 4,
    lienNotation: "general",
    points: [
      { fr: "Du haut vers le bas, du sec vers l'humide, du propre vers le sale.", en: "Top to bottom, dry before wet, clean areas before dirty ones." },
      { fr: "Des chiffons de couleurs différentes : un pour les sanitaires, jamais réutilisé ailleurs.", en: "Colour-coded cloths: one for toilets, never used elsewhere." },
      { fr: "Plier les genoux pour les charges, manche de balai à bonne hauteur, pauses courtes entre deux logements.", en: "Bend your knees when lifting, mop handle at the right height, short breaks between homes." },
    ],
    quiz: [
      {
        question: { fr: "Dans quel ordre nettoyer une pièce ?", en: "In what order do you clean a room?" },
        choix: [
          { fr: "Sols, puis meubles, puis plafonniers", en: "Floors, then furniture, then ceiling lights" },
          { fr: "Du haut vers le bas, sols en dernier", en: "Top to bottom, floors last" },
          { fr: "Peu importe", en: "It doesn't matter" },
        ],
        bonne: 1,
        explication: { fr: "La poussière tombe : les sols se font en dernier.", en: "Dust falls: floors come last." },
      },
    ],
  },
];

/** Réponses de l'assistant ménage quand aucune clé d'IA n'est configurée. */
export type FicheConseil = { motsCles: string[]; titre: T; etapes: T[]; precaution: T };

export const CONSEILS: FicheConseil[] = [
  {
    motsCles: ["calcaire", "douche", "paroi", "robinet", "limescale", "shower", "tap"],
    titre: { fr: "Calcaire sur paroi de douche ou robinet", en: "Limescale on shower glass or taps" },
    etapes: [
      { fr: "Vérifier la surface : verre, chrome ou céramique seulement.", en: "Check the surface: glass, chrome or ceramic only." },
      { fr: "Vaporiser du vinaigre blanc (ou un détartrant), laisser agir 5 minutes.", en: "Spray white vinegar (or descaler), leave for 5 minutes." },
      { fr: "Frotter avec une éponge non abrasive, rincer à l'eau claire.", en: "Scrub with a non-abrasive sponge, rinse with clean water." },
      { fr: "Sécher à la raclette ou à la microfibre.", en: "Dry with a squeegee or microfibre." },
    ],
    precaution: { fr: "Jamais d'acide sur la pierre naturelle, et jamais après de la javel sans rincer.", en: "Never acid on natural stone, and never after bleach without rinsing." },
  },
  {
    motsCles: ["vin", "tache", "canapé", "tapis", "wine", "stain", "sofa", "carpet"],
    titre: { fr: "Tache de vin rouge sur un tissu", en: "Red wine stain on fabric" },
    etapes: [
      { fr: "Tamponner avec un papier absorbant, sans frotter.", en: "Blot with paper towel, without rubbing." },
      { fr: "Tamponner avec de l'eau froide et un peu de liquide vaisselle.", en: "Dab with cold water and a little washing-up liquid." },
      { fr: "Rincer en tamponnant à l'eau claire, laisser sécher à l'air.", en: "Rinse by dabbing with clean water, let it air dry." },
    ],
    precaution: { fr: "Tester d'abord sur une partie cachée. Pour la soie, le velours ou une tache ancienne : prévenir le client, ne pas insister.", en: "Test on a hidden spot first. For silk, velvet or an old stain: tell the client, don't push it." },
  },
  {
    motsCles: ["four", "graisse", "oven", "grease"],
    titre: { fr: "Four encrassé", en: "Dirty oven" },
    etapes: [
      { fr: "Four froid et débranché si possible.", en: "Oven cold, and unplugged if possible." },
      { fr: "Pâte de bicarbonate et d'eau sur les parois, laisser agir au moins 30 minutes.", en: "Baking soda and water paste on the walls, leave at least 30 minutes." },
      { fr: "Retirer avec une éponge humide, finir au chiffon.", en: "Remove with a damp sponge, finish with a cloth." },
    ],
    precaution: { fr: "Pas de produit décapant sur un four à catalyse (parois rugueuses) : demander au client.", en: "No oven cleaner on a catalytic oven (rough walls): ask the client." },
  },
  {
    motsCles: ["moisissure", "joint", "noir", "mould", "mold", "grout"],
    titre: { fr: "Joints noircis ou moisissure", en: "Darkened grout or mould" },
    etapes: [
      { fr: "Aérer la pièce.", en: "Ventilate the room." },
      { fr: "Brosser les joints avec un produit anti-moisissure adapté, en suivant l'étiquette.", en: "Brush the grout with a suitable anti-mould product, following the label." },
      { fr: "Rincer et sécher.", en: "Rinse and dry." },
    ],
    precaution: { fr: "Si la moisissure revient vite ou couvre un mur, le signaler au bureau : c'est un problème d'humidité, pas de ménage.", en: "If mould returns quickly or covers a wall, report it: it's a damp problem, not a cleaning one." },
  },
  {
    motsCles: ["parquet", "bois", "sol", "wood", "floor"],
    titre: { fr: "Parquet", en: "Parquet floor" },
    etapes: [
      { fr: "Aspirer ou balayer d'abord.", en: "Vacuum or sweep first." },
      { fr: "Serpillière à peine humide, très bien essorée.", en: "Barely damp, well-wrung mop." },
      { fr: "Ne pas laisser d'eau stagner ; sécher les traces.", en: "Don't leave standing water; dry any marks." },
    ],
    precaution: { fr: "Pas de nettoyeur vapeur ni de produit gras sur un parquet vitrifié.", en: "No steam cleaner or oily product on lacquered parquet." },
  },
  {
    motsCles: ["inox", "frigo", "évier", "stainless", "fridge", "sink"],
    titre: { fr: "Inox (frigo, évier, hotte)", en: "Stainless steel (fridge, sink, hood)" },
    etapes: [
      { fr: "Chiffon microfibre humide avec une goutte de liquide vaisselle.", en: "Damp microfibre cloth with a drop of washing-up liquid." },
      { fr: "Essuyer dans le sens du brossage.", en: "Wipe along the grain." },
      { fr: "Finir avec un chiffon sec.", en: "Finish with a dry cloth." },
    ],
    precaution: { fr: "Pas d'éponge abrasive ni de javel sur l'inox.", en: "No abrasive sponge or bleach on stainless steel." },
  },
  {
    motsCles: ["vitre", "fenêtre", "miroir", "window", "mirror", "glass"],
    titre: { fr: "Vitres et miroirs sans traces", en: "Streak-free windows and mirrors" },
    etapes: [
      { fr: "Dépoussiérer cadre et rebord.", en: "Dust the frame and sill." },
      { fr: "Eau tiède et une goutte de liquide vaisselle, ou nettoyant vitres.", en: "Lukewarm water with a drop of washing-up liquid, or glass cleaner." },
      { fr: "Raclette de haut en bas, essuyer la lame à chaque passage, finir à la microfibre sèche.", en: "Squeegee top to bottom, wipe the blade each pass, finish with dry microfibre." },
    ],
    precaution: { fr: "Éviter le plein soleil : le produit sèche trop vite et laisse des traces. Jamais de travail en hauteur sans appui sûr.", en: "Avoid direct sun: product dries too fast and streaks. Never work at height without safe footing." },
  },
];

export function chercherConseil(question: string): FicheConseil | null {
  const q = question.toLowerCase();
  let meilleur: FicheConseil | null = null;
  let meilleurScore = 0;
  for (const c of CONSEILS) {
    const score = c.motsCles.filter((m) => q.includes(m)).length;
    if (score > meilleurScore) {
      meilleur = c;
      meilleurScore = score;
    }
  }
  return meilleur;
}
