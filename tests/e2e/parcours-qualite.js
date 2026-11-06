// Parcours qualité : note vocale -> reformulation -> fiche validée ; note 1 étoile -> alerte -> message validé.
const { chromium } = require('playwright');
const dossier = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:3000') + '/qualite', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Reformuler en consignes/ }).click();
  await p.getByRole('button', { name: /mettre à jour la fiche/ }).waitFor({ timeout: 30000 });
  const nouveaux = await p.getByText('nouveau', { exact: true }).count();
  console.log('consignes nouvelles proposées:', nouveaux);
  await p.screenshot({ path: `${dossier}/parcours-preferences.png`, fullPage: true });
  await p.getByRole('button', { name: /mettre à jour la fiche/ }).click();
  await p.getByText(/Fiche mise à jour/).waitFor();
  console.log('fiche: mise à jour');

  await p.goto((process.env.BASE || 'http://localhost:3000') + '/qualite/notation', { waitUntil: 'networkidle' });
  const formulaire = p.locator('section').filter({ hasText: "Famille Rochat note le passage" }).first();
  await formulaire.getByRole('radio', { name: /^1\/5/ }).click();
  await formulaire.locator('textarea').fill('Arrivée avec 40 minutes de retard, salle de bain pas faite.');
  await formulaire.getByRole('button', { name: /Envoyer la note/ }).click();
  await p.getByText(/Alerte envoyée \(simulation\)/).first().waitFor({ timeout: 30000 });
  const toast = await p.locator('[role=status]').count();
  const cloche = await p.locator('header button[aria-label^="Alertes qualité"]').getAttribute('aria-label');
  console.log('notification affichée:', toast > 0, '| cloche:', cloche);
  await p.screenshot({ path: `${dossier}/parcours-notation.png`, fullPage: false });
  await p.getByRole('button', { name: /valider l'envoi/ }).first().click();
  await p.goto((process.env.BASE || 'http://localhost:3000') + '/qualite/alertes', { waitUntil: 'networkidle' });
  const nbAlertes = await p.locator('section').first().locator('li.rounded-xl').count();
  const nbEnvois = await p.locator('section').nth(1).locator('li.rounded-xl').count();
  console.log('alertes:', nbAlertes, '| envois au journal:', nbEnvois, erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : '');
  await p.screenshot({ path: `${dossier}/parcours-alertes.png`, fullPage: true });
  await b.close();
})().catch(e => { console.error('ÉCHEC', e.message); process.exit(1); });
