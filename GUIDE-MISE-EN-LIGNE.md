# Mise en ligne — site ONGD Les Volontaires (version complète)

Adresse finale : **https://lesvolontaires.eaji.org**
Le site utilise le **même serveur Eaji (Railway)** et le **même compte CinetPay** (au nom de l'ONGD). Dons, ventes, inscriptions et annonces sont enregistrés dans des tables à part (`ongd_…`), séparées des revenus d'Eaji.

Deux fichiers ZIP :
- **ONGD-serveur.zip** → 2 fichiers pour le dépôt EAjimmy
- **ONGD-site.zip** → 19 fichiers pour le dépôt du site (plus ce guide)

---

## Étape 1 — Le serveur (dépôt EAjimmy)

1. Décompressez **ONGD-serveur.zip** et ajoutez **`ongd-routes.js`** et **`ongd-extensions.js`** à côté de `server.js` (remplacez l'ancien `ongd-routes.js` si vous l'aviez déjà mis).
2. Dans `server.js`, juste **sous** la ligne `const app = express();`, il faut cette seule ligne (ne l'ajoutez pas deux fois) :
   ```js
   require('./ongd-routes')(app);
   ```
3. Sur **Railway → Variables**, vérifiez ou ajoutez :

   | Nom | Valeur |
   |---|---|
   | `ONGD_ADMIN_PASSWORD` | mot de passe solide, 10 caractères minimum |
   | `ANTHROPIC_API_KEY` | votre clé Anthropic (celle d'Eajimmy AI convient) : active l'assistant, la traduction et les réponses automatiques |

   `DATABASE_URL`, `CINETPAY_APIKEY` et `CINETPAY_SITE_ID` sont déjà là pour Eaji.
4. Dans les journaux (Logs), vous devez voir : `[ONGD] Les Volontaires : tables prêtes`.
5. Vérification : `https://eajimmy-production.up.railway.app/api/ongd/sante` → `{"ok":true,"paiement_en_ligne":…,"ia":true}`.

## Étape 2 — Le site (dépôt `lesvolontaires-site`)

1. Décompressez **ONGD-site.zip** et envoyez **tous** les fichiers dans le dépôt (remplacez les anciens).
2. **Settings → Pages** : branche `main`, dossier `/ (root)`, domaine `lesvolontaires.eaji.org`, **Enforce HTTPS** coché.

## Étape 3 — Le sous-domaine (Porkbun) — si ce n'est pas déjà fait

Porkbun → eaji.org → DNS → **CNAME**, Host `lesvolontaires`, Answer `jimmynho.github.io`.

## Étape 4 — Premiers réglages dans l'administration

Ouvrez `lesvolontaires.eaji.org/admin.html` :
1. **Sécurité → Activer la double authentification** avec Google Authenticator. Ensuite, chaque connexion demande le code à 6 chiffres.
   *Téléphone perdu ?* Ajoutez `ONGD_2FA_SECOURS=1` dans Railway, connectez-vous, désactivez puis réactivez la double authentification, et **retirez aussitôt** cette variable.
2. **Réglages** : taux du dollar en FC, prix des annonces, informations pour l'assistant IA (horaires, projets, questions fréquentes), mots interdits.
3. Créez vos premières **Formations** (avec leurs étapes), vos **Produits**, et une **réunion** dans **Direct**.

Dans `config.js` : relisez la mission et les domaines, ajoutez les numéros Mobile Money de l'ONGD, l'e-mail.

---

## Ce que fait chaque partie

| Fonction | Page | Comment ça marche |
|---|---|---|
| **Formations (étapes)** | `formations.html` | Inscription → code à 6 caractères → la personne suit la formation étape par étape et coche sa progression. |
| **Enregistrements / réservations** | `formations.html` | Événements avec nombre de places ; complet = inscriptions fermées. Contrôle à l'entrée par code dans l'admin. |
| **Annonces payantes** | `annonces.html` | L'annonceur paie, vous validez, l'annonce s'affiche sur le site pendant la durée choisie. |
| **Zone de dialogue** | `dialogue.html` | Sujets et réponses publics, liens bloqués, modération dans l'admin. |
| **Réunions virtuelles** | `direct.html` | Salle Jitsi Meet créée automatiquement, avec code d'accès si besoin. |
| **Lives des activités** | `direct.html` + espace volontaire | Lien YouTube/Facebook Live (lecteur sur le site) ou salle Jitsi ; un bandeau rouge « En direct » apparaît sur tout le site. |
| **Assistance IA** | bulle orange, toutes les pages | Répond aux visiteurs à partir des infos de l'ONGD, des formations et de la boutique. |
| **Réponses automatiques** | contact, partenariat, dialogue | Réponse immédiate rédigée par l'IA ; l'équipe complète ensuite. |
| **Hors réseau** | tout le site | Les pages déjà visitées s'ouvrent sans réseau. Les volontaires remplissent leurs activités sans réseau : elles partent seules au retour du réseau. |
| **Espace de vente** | `boutique.html` | Panier, paiement, stock mis à jour, commandes à livrer dans l'admin. |
| **Traduction** | sélecteur de langue | Français, anglais, lingala, swahili, kikongo, tshiluba, portugais, espagnol, arabe. Chaque phrase n'est traduite (et payée) qu'une seule fois. |
| **Sécurité renforcée** | admin | Double authentification, blocage après 5 erreurs, journal de sécurité, session admin limitée à l'onglet ouvert, vérification des images, protection anti-robots, déconnexion de tous les appareils. |

## Bon à savoir

- **Jitsi Meet** : la première personne qui ouvre une salle peut devoir se connecter (Google ou GitHub) pour en devenir l'animatrice. Les participants n'ont besoin de rien.
- **Traduction** : bonne en anglais, portugais, espagnol et swahili ; à faire relire par un locuteur natif pour le lingala, le kikongo et le tshiluba.
- **Prix** : saisis en dollars (nombres entiers) ; le prix en FC se calcule avec le taux des Réglages.
- **Annonce refusée** : remboursez l'annonceur vous-même (Mobile Money), le site ne rembourse pas automatiquement.
- **Mise à jour du site** : après avoir changé des fichiers, ouvrez `sw.js` et changez `ongd-v2` en `ongd-v3` (puis v4…), sinon les téléphones gardent l'ancienne version un moment.
- **Si l'adresse du serveur change**, modifiez-la dans `config.js` **et** dans la ligne `Content-Security-Policy` en haut de chaque page `.html`.
