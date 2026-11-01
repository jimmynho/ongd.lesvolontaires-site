/* =====================================================================
   ONGD Les Volontaires — éléments communs à toutes les pages publiques
   En-tête, langues (traduction IA), assistant IA, bandeau « en direct »,
   annonces payantes, paiement manuel, mode hors réseau.
   ===================================================================== */
(function () {
  const { esc, api, montant, message, lire, ecrire } = outils;
  const $ = s => document.querySelector(s);

  /* ---------- En-tête commun (pages qui contiennent <header data-commun>) ---------- */
  const LIENS = [
    ['./#activites', 'Activités'], ['formations.html', 'Formations'], ['boutique.html', 'Boutique'],
    ['dialogue.html', 'Dialogue'], ['direct.html', 'En direct'], ['./#partenariat', 'Partenariat'], ['./#contact', 'Contact'],
  ];
  const hote = $('header[data-commun]');
  if (hote) {
    const page = location.pathname.split('/').pop();
    hote.className = 'entete';
    hote.innerHTML = `
      <div class="conteneur">
        <a class="marque" href="./"><img src="logo.svg" alt=""><span><small>ONGD</small>Les Volontaires</span></a>
        <nav class="menu" aria-label="Menu principal">
          ${LIENS.map(([h, t]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
          <a class="btn btn-don" href="./#don">Faire un don</a>
        </nav>
        <button class="burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>
      <nav class="tiroir" id="tiroir" aria-label="Menu mobile">
        <a href="./">Accueil</a>${LIENS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}
        <a href="annonces.html">Publier une annonce</a><a href="./#don">Faire un don</a><a href="volontaire.html">Espace volontaire</a>
      </nav>`;
    $('#burger').onclick = () => { const o = $('#tiroir').classList.toggle('ouvert'); $('#burger').setAttribute('aria-expanded', o); };
  }

  /* ---------- Pied de page commun ---------- */
  const pied = $('footer[data-commun]');
  if (pied) {
    pied.className = 'pied';
    pied.innerHTML = `<div class="conteneur"><div class="grille">
      <div><h3>ONGD Les Volontaires</h3><p>${esc(ONGD.slogan)}</p></div>
      <div><h3>Liens</h3><p><a href="./#don">Faire un don</a><br><a href="formations.html">Formations et événements</a><br><a href="boutique.html">Boutique</a><br><a href="annonces.html">Publier une annonce</a><br><a href="volontaire.html">Espace volontaire</a></p></div>
      <div><h3>Nous trouver</h3><p>${esc(ONGD.siege)}</p><p>WhatsApp : <a href="https://wa.me/${ONGD.whatsapp}">${esc(ONGD.telephoneAffiche)}</a></p></div>
    </div><div class="bas">© ${new Date().getFullYear()} ONGD Les Volontaires · Site relié à <a href="https://eaji.org">eaji.org</a></div></div>`;
  }

  /* ---------- Petit message flottant ---------- */
  function toast(t, duree = 3500) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
    el.textContent = t; el.classList.add('visible');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('visible'), duree);
  }

  /* ================= TRADUCTION AUTOMATIQUE ================= */
  const Trad = {
    langue: lire('ongd_langue') || 'fr',
    originaux: new Map(),      // nœud texte → texte français d'origine
    attrs: new Map(),          // élément → { placeholder, aria-label, title } d'origine
    cache: {},
    chargerCache() { try { this.cache = JSON.parse(lire('ongd_trad_' + this.langue) || '{}'); } catch { this.cache = {}; } },
    sauverCache() {
      try { const s = JSON.stringify(this.cache); if (s.length < 1500000) ecrire('ongd_trad_' + this.langue, s); } catch {}
    },
  };
  const AIGNORER = 'script,style,noscript,textarea,code,[data-no-tr]';
  function collecter(racine) {
    const textes = [], attrs = [];
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentElement && !n.parentElement.closest(AIGNORER) && /\p{L}{2}/u.test(n.nodeValue)) ? 1 : 2,
    });
    while (w.nextNode()) textes.push(w.currentNode);
    if (racine.querySelectorAll) racine.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el => { if (!el.closest('[data-no-tr]')) attrs.push(el); });
    return { textes, attrs };
  }
  async function traduire(racine = document.body) {
    const { textes, attrs } = collecter(racine);
    for (const n of textes) if (!Trad.originaux.has(n)) Trad.originaux.set(n, n.nodeValue);
    for (const el of attrs) if (!Trad.attrs.has(el)) Trad.attrs.set(el, Object.fromEntries(['placeholder', 'aria-label', 'title'].filter(a => el.hasAttribute(a)).map(a => [a, el.getAttribute(a)])));
    if (Trad.langue === 'fr') {
      for (const n of textes) n.nodeValue = Trad.originaux.get(n);
      for (const el of attrs) for (const [a, v] of Object.entries(Trad.attrs.get(el) || {})) el.setAttribute(a, v);
      return;
    }
    const cles = new Set();
    for (const n of textes) cles.add(Trad.originaux.get(n).trim());
    for (const el of attrs) Object.values(Trad.attrs.get(el) || {}).forEach(v => /\p{L}{2}/u.test(v) && cles.add(v.trim()));
    const manquantes = [...cles].filter(k => k && !(k in Trad.cache));
    const langue = Trad.langue;
    for (let i = 0; i < manquantes.length; i += 100) {
      try {
        const d = await api('/traduire', { method: 'POST', body: JSON.stringify({ langue, textes: manquantes.slice(i, i + 100) }) });
        Object.assign(Trad.cache, d.traductions);
        if (!Object.keys(d.traductions).length && i === 0) toast('La traduction n\'est pas disponible pour le moment.');
      } catch (e) { toast(e.message); break; }
    }
    if (langue !== Trad.langue) return;               // la langue a changé pendant le chargement
    Trad.sauverCache();
    for (const n of textes) {
      const o = Trad.originaux.get(n), k = o.trim();
      if (Trad.cache[k]) n.nodeValue = o.replace(k, Trad.cache[k]);
    }
    for (const el of attrs) for (const [a, v] of Object.entries(Trad.attrs.get(el) || {})) if (Trad.cache[v.trim()]) el.setAttribute(a, Trad.cache[v.trim()]);
  }
  async function changerLangue(l) {
    Trad.langue = l; ecrire('ongd_langue', l); Trad.chargerCache();
    document.documentElement.lang = l === 'lua' ? 'lu' : l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    if (l !== 'fr') toast('Traduction en cours…', 2000);
    await traduire();
  }
  // Nouveau contenu ajouté par la page (activités, produits…) → traduit à son tour
  let enAttente = [], minuterie = null;
  new MutationObserver(mut => {
    if (Trad.langue === 'fr') return;
    for (const m of mut) m.addedNodes.forEach(n => { if (n.nodeType === 1 || n.nodeType === 3) enAttente.push(n.nodeType === 3 ? n.parentElement : n); });
    clearTimeout(minuterie);
    minuterie = setTimeout(() => { const l = enAttente.filter(n => n && n.isConnected); enAttente = []; l.forEach(n => traduire(n)); }, 350);
  }).observe(document.body, { childList: true, subtree: true });

  // Sélecteur de langue dans l'en-tête
  const barre = $('.entete .conteneur');
  if (barre) {
    const sel = document.createElement('select');
    sel.className = 'langue'; sel.setAttribute('aria-label', 'Langue'); sel.setAttribute('data-no-tr', '');
    sel.innerHTML = ONGD.langues.map(([c, n]) => `<option value="${c}">${n}</option>`).join('');
    sel.value = Trad.langue;
    sel.onchange = () => changerLangue(sel.value);
    barre.insertBefore(sel, $('#burger'));
  }
  Trad.chargerCache();
  if (Trad.langue !== 'fr') window.addEventListener('load', () => changerLangue(Trad.langue));

  /* ================= ASSISTANT IA ================= */
  const bouton = document.createElement('button');
  bouton.className = 'bulle-ia'; bouton.setAttribute('aria-label', 'Assistant');
  bouton.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
  const panneau = document.createElement('div');
  panneau.className = 'panneau-ia'; panneau.hidden = true;
  panneau.innerHTML = `
    <div class="ia-tete"><strong>Assistant de l'ONGD</strong><button class="ia-fermer" aria-label="Fermer">×</button></div>
    <div class="ia-fil" data-no-tr></div>
    <form class="ia-form"><input placeholder="Posez votre question…" maxlength="1500" aria-label="Votre question"><button class="btn btn-vert btn-petit">Envoyer</button></form>
    <p class="ia-note">Réponses automatiques : vérifiez les informations importantes auprès de l'équipe.</p>`;
  document.body.append(bouton, panneau);
  let fil = [];
  try { fil = JSON.parse(sessionStorage.getItem('ongd_ia') || '[]'); } catch {}
  const zone = panneau.querySelector('.ia-fil');
  function dessinerFil() {
    zone.innerHTML = (fil.length ? fil : [{ role: 'assistant', content: 'Bonjour ! Je peux vous renseigner sur l\'ONGD, les dons, les formations, la boutique ou le volontariat. Écrivez dans votre langue.' }])
      .map(m => `<div class="ia-msg ${m.role}">${esc(m.content).replace(/\n/g, '<br>')}</div>`).join('');
    zone.scrollTop = zone.scrollHeight;
  }
  bouton.onclick = () => { panneau.hidden = !panneau.hidden; if (!panneau.hidden) { dessinerFil(); panneau.querySelector('input').focus(); } };
  panneau.querySelector('.ia-fermer').onclick = () => panneau.hidden = true;
  panneau.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const champ = e.target.querySelector('input'), texte = champ.value.trim();
    if (!texte) return;
    champ.value = '';
    fil.push({ role: 'user', content: texte }); dessinerFil();
    zone.insertAdjacentHTML('beforeend', '<div class="ia-msg assistant ia-attente">…</div>'); zone.scrollTop = zone.scrollHeight;
    try { const d = await api('/ia/chat', { method: 'POST', body: JSON.stringify({ messages: fil.slice(-10) }) }); fil.push({ role: 'assistant', content: d.reponse }); }
    catch (err) { fil.push({ role: 'assistant', content: err.message }); }
    fil = fil.slice(-20);
    try { sessionStorage.setItem('ongd_ia', JSON.stringify(fil)); } catch {}
    dessinerFil();
  };

  /* ================= BANDEAU « EN DIRECT » ================= */
  if (!location.pathname.endsWith('direct.html')) {
    api('/directs').then(d => {
      const live = d.directs.find(x => x.statut === 'en_cours');
      if (!live) return;
      const b = document.createElement('a');
      b.className = 'bandeau-direct'; b.href = 'direct.html';
      b.innerHTML = `<span class="point-rouge"></span> En direct : <strong>${esc(live.titre)}</strong> — Regarder`;
      document.body.prepend(b);
    }).catch(() => {});
  }

  /* ================= ANNONCES PAYANTES ================= */
  document.querySelectorAll('[data-annonces]').forEach(async boite => {
    try {
      const { annonces } = await api('/annonces/actives');
      if (!annonces.length) { boite.innerHTML = `<p class="petit annonce-vide">Espace publicitaire disponible — <a href="annonces.html">publiez votre annonce ici</a>.</p>`; return; }
      boite.innerHTML = `<div class="annonces">${annonces.map(a => `
        <a class="annonce" ${a.lien ? `href="${esc(a.lien)}" target="_blank" rel="sponsored noopener"` : ''}>
          ${a.a_image ? `<img src="${ONGD.api}/media/annonce/${a.id}" alt="" loading="lazy">` : ''}
          <span><small>Annonce · ${esc(a.annonceur)}</small><strong>${esc(a.titre)}</strong>${a.texte ? `<em>${esc(a.texte)}</em>` : ''}</span>
        </a>`).join('')}</div><p class="petit"><a href="annonces.html">Publier une annonce</a></p>`;
    } catch { boite.hidden = true; }
  });

  /* ================= PAIEMENT (en ligne ou manuel) ================= */
  // reponse = résultat du serveur ({ reference, montant, devise, mode, payment_url })
  function paiement(conteneur, reponse) {
    if (reponse.payment_url) { toast('Redirection vers le paiement sécurisé…'); location.href = reponse.payment_url; return; }
    const comptes = ONGD.mobileMoney.filter(m => m.numero), b = ONGD.banque, wa = 'https://wa.me/' + ONGD.whatsapp;
    const lignes = comptes.map(m => `<li><strong>${esc(m.operateur)}</strong> : ${esc(m.numero)}</li>`);
    if (b.compte) lignes.push(`<li><strong>Virement</strong> : ${esc(b.banque)}, compte ${esc(b.compte)}${b.swift ? ', SWIFT ' + esc(b.swift) : ''} (${esc(b.titulaire)})</li>`);
    if (!lignes.length) lignes.push(`<li>Écrivez-nous sur <a href="${wa}?text=${encodeURIComponent('Bonjour, je souhaite payer. Référence : ' + reponse.reference)}" target="_blank" rel="noopener">WhatsApp (${esc(ONGD.telephoneAffiche)})</a> : nous vous indiquons comment payer.</li>`);
    const ops = [...comptes.map(m => m.operateur), ...(b.compte ? ['Virement bancaire'] : []), 'Autre'];
    conteneur.innerHTML = `
      <div class="reception">
        <h3>Finalisez votre paiement</h3>
        ${reponse.info ? `<div class="alerte info">${esc(reponse.info)}</div>` : ''}
        <p>Votre référence :</p><span class="ref" data-no-tr>${esc(reponse.reference)}</span>
        <p>Montant : <strong>${montant(reponse.montant, reponse.devise)}</strong>${comptes.length || b.compte ? ', à envoyer sur l\'un de ces comptes de l\'ONGD avec la référence :' : ''}</p>
        <ul>${lignes.join('')}</ul>
        <form novalidate>
          <div class="deux">
            <div class="champ"><label>Moyen utilisé</label><select name="op">${ops.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select></div>
            <div class="champ"><label>Référence de votre envoi</label><input name="ref" required placeholder="ex. code reçu par SMS"></div>
          </div>
          <button class="btn btn-vert" style="width:100%">J'ai payé</button>
          <div class="alerte" hidden></div>
        </form>
        <p class="petit">Suivre ce paiement : <a href="paiement.html?ref=${esc(reponse.reference)}">page de suivi</a></p>
      </div>`;
    const f = conteneur.querySelector('form');
    f.onsubmit = async e => {
      e.preventDefault();
      const msg = f.querySelector('.alerte'), btn = f.querySelector('button');
      btn.disabled = true;
      try {
        const d = await api(`/paiements/${reponse.reference}/declarer`, { method: 'POST', body: JSON.stringify({ operateur: f.op.value, ref_paiement: f.ref.value }) });
        message(msg, d.message, 'ok'); f.querySelectorAll('input,select,button').forEach(x => x.disabled = true); return;
      } catch (err) { message(msg, err.message, 'erreur'); }
      btn.disabled = false;
    };
    conteneur.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ================= HORS RÉSEAU ================= */
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  const horsLigne = () => {
    let b = $('#hors-ligne');
    if (navigator.onLine) { b && b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'hors-ligne'; b.className = 'hors-ligne'; document.body.prepend(b); }
    b.textContent = 'Pas de réseau : vous consultez la dernière version enregistrée sur ce téléphone.';
  };
  window.addEventListener('online', horsLigne); window.addEventListener('offline', horsLigne); horsLigne();

  window.commun = { toast, paiement, traduire: () => traduire(), langue: () => Trad.langue };
})();
