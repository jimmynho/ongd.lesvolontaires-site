/* =====================================================================
   ONGD Les Volontaires — RÉGLAGES DU SITE
   Modifiez seulement les textes entre guillemets ci-dessous.
   ===================================================================== */
window.ONGD = {
  nom: 'ONGD Les Volontaires',

  // Adresse du serveur Eaji (Railway) — ne pas changer sauf si le serveur change
  api: 'https://eajimmy-production.up.railway.app/api/ongd',

  slogan: 'Agir ensemble, là où on a besoin de nous.',

  // ⚠️ À RELIRE ET ADAPTER : texte de présentation de l'ONGD
  mission: "L'ONGD Les Volontaires rassemble des femmes et des hommes qui donnent de leur temps et de leurs compétences pour améliorer la vie des communautés, à Mbandaka, dans la province de l'Équateur et au-delà.",

  // ⚠️ À ADAPTER : vos domaines d'action réels
  domaines: [
    { titre: 'Solidarité', texte: 'Aide aux familles vulnérables, aux personnes âgées et aux enfants.' },
    { titre: 'Éducation', texte: 'Soutien scolaire, sensibilisation et formation des jeunes.' },
    { titre: 'Santé et hygiène', texte: "Campagnes de sensibilisation, assainissement et accès à l'eau." },
    { titre: 'Environnement', texte: 'Salubrité des quartiers et protection de notre environnement.' },
  ],

  siege: "Avenue Mobutu, Mbandaka, province de l'Équateur, RD Congo",
  whatsapp: '243850171480',            // numéro WhatsApp sans le +
  telephoneAffiche: '+243 850 171 480',
  email: '',                            // ex. 'lesvolontaires@eaji.org' (laisser vide pour masquer)
  facebook: '',                         // lien de la page Facebook (laisser vide pour masquer)

  // Dons manuels (affichés si le paiement en ligne n'est pas disponible).
  // Remplissez les numéros Mobile Money AU NOM DE L'ONGD ; une ligne vide est masquée.
  mobileMoney: [
    { operateur: 'M-Pesa', numero: '' },
    { operateur: 'Orange Money', numero: '' },
    { operateur: 'Airtel Money', numero: '' },
  ],
  banque: { banque: '', titulaire: 'ONGD Les Volontaires', compte: '', swift: '' },

  // Projets que le donateur peut choisir (laisser vide [] pour masquer le choix)
  projets: [],

  plaquette: 'plaquette-partenariat.pdf',

  // Langues proposées dans le sélecteur (traduction automatique par l'IA)
  langues: [
    ['fr', 'Français'], ['en', 'English'], ['ln', 'Lingála'], ['sw', 'Kiswahili'], ['kg', 'Kikongo'],
    ['lua', 'Tshiluba'], ['pt', 'Português'], ['es', 'Español'], ['ar', 'العربية'],
  ],
};

/* ===================== Outils communs (ne pas modifier) ===================== */
window.outils = {
  esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  async api(chemin, opts = {}, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    let r;
    try { r = await fetch(ONGD.api + chemin, { ...opts, headers }); }
    catch { throw new Error('Pas de connexion internet. Réessayez.'); }
    let d = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) { const e = new Error(d.erreur || 'Une erreur est survenue. Réessayez.'); e.status = r.status; throw e; }
    return d;
  },
  photo(id, token) { return ONGD.api + '/photos/' + id + (token ? '?t=' + token : ''); },
  date(iso) {
    if (!iso) return '';
    const d = new Date(String(iso).length === 10 ? iso + 'T12:00:00' : iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  },
  montant(n, devise) {
    return devise === 'USD' ? Number(n).toLocaleString('fr-FR') + ' $' : Number(n).toLocaleString('fr-FR') + ' FC';
  },
  lire(cle) { try { return localStorage.getItem(cle); } catch { return null; } },
  ecrire(cle, v) { try { v == null ? localStorage.removeItem(cle) : localStorage.setItem(cle, v); } catch {} },
  // Réduit une photo (max 1280 px, JPEG) avant l'envoi pour économiser les données mobiles
  reduire(fichier) {
    return new Promise((ok, ko) => {
      const img = new Image(), url = URL.createObjectURL(fichier);
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('Cette image ne peut pas être lue.')); };
      img.src = url;
    });
  },
  // Affiche un message sous un formulaire
  message(el, texte, type = 'ok') { el.className = 'alerte ' + type; el.textContent = texte; el.hidden = false; },
};
