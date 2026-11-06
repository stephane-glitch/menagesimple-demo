// Parcours complet : paramètres -> recherche réelle -> classement -> message ORP -> validation.
const { chromium } = require('playwright');
const dossier = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:3000') + '/recrutement/travail-swiss?commune=Nyon', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: /Lancer la recherche/ }).click();
  await p.getByText(/profils$/).first().waitFor({ timeout: 40000 });
  await p.getByRole('button', { name: /Préparer le message/ }).waitFor({ timeout: 40000 });
  const total = await p.getByText(/profils$/).first().innerText();
  const liens = await p.locator('a[href^="https://www.job-room.ch/candidate-search/"]').count();
  console.log('total affiché:', total.replace(/\s+/g, ' '), '| liens vers fiches:', liens);
  await p.getByRole('button', { name: /Préparer le message/ }).click();
  await p.getByRole('button', { name: /valider l'envoi/ }).waitFor({ timeout: 30000 });
  const corps = await p.getByRole('dialog').locator('textarea').last().inputValue();
  console.log('message ORP (début):', corps.slice(0, 160).replace(/\n/g, ' / '));
  console.log('liens dans le message:', (corps.match(/https:\/\/www\.job-room\.ch\/candidate-search\//g) || []).length);
  await p.screenshot({ path: `${dossier}/parcours-jobroom.png`, fullPage: true });
  await p.getByRole('button', { name: /valider l'envoi/ }).click();
  await p.getByText(/Validé et envoyé/).waitFor();
  console.log('validation: ok', erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : '');
  await b.close();
})().catch(e => { console.error('ÉCHEC', e.message); process.exit(1); });
