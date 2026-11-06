// Drapeau anglais -> textes en anglais sur tous les écrans, persistant au rechargement, puis retour au français.
const { chromium } = require('playwright');
const chemins = ['/', '/recrutement', '/recrutement/travail-swiss', '/recrutement/parrainage', '/rejoindre', '/talents', '/talents/arrivee', '/talents/absences', '/talents/connaissances', '/talents/assistant', '/qualite', '/qualite/notation', '/qualite/alertes', '/methode'];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:3000') + '/talents', { waitUntil: 'networkidle' });
  await p.getByRole('button', { name: 'English' }).click();
  await p.waitForTimeout(300);
  console.log('après clic :', await p.locator('h1').innerText(), '| lang =', await p.evaluate(() => document.documentElement.lang));
  const restes = [];
  for (const c of chemins) {
    await p.goto((process.env.BASE || 'http://localhost:3000') + '' + c, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    const texte = await p.locator('main').innerText();
    // mots français fréquents qui ne devraient plus apparaître dans l'interface anglaise
    const suspects = (texte.match(/\b(le|la|les|des|une|pour|avec|dans|sans|vous|votre)\b/g) || []).length;
    restes.push(`${c}: ${suspects}`);
  }
  console.log('mots français restants par écran (données fictives exclues à la main) :', restes.join(' · '));
  await p.getByRole('button', { name: 'Français' }).click();
  await p.waitForTimeout(300);
  console.log('retour :', await p.locator('h1').innerText(), erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : '');
  await b.close();
})().catch(e => { console.error('ÉCHEC', e.message); process.exit(1); });
