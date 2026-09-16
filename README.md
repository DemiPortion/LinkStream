# Linktree perso — Marc

Page de liens façon Linktree, à héberger sur GitHub Pages.

## Fichiers

- `index.html` + `script.js` → la page publique (celle que tu partages).
- `admin.html` + `admin.js` → l'espace protégé par mot de passe pour gérer tes liens.
- `links.json` → les données (profil + liste des liens) lues par la page publique.
- `style.css` → le style, partagé par les deux pages.

## ⚠️ Le point important à comprendre

GitHub Pages ne sait servir que des fichiers statiques : il n'y a **pas de base de données**.
Donc quand tu ajoutes/modifies un lien dans `admin.html`, ça part dans le `localStorage`
de **ton navigateur uniquement** — pas dans le fichier `links.json` du site en ligne, et pas
visible par tes visiteurs.

Pour que tes changements soient visibles publiquement, il faut, après avoir édité dans l'admin :

1. Cliquer sur **« Télécharger links.json »**.
2. Remplacer le fichier `links.json` sur ton repo GitHub (upload direct sur github.com, ou `git add / commit / push`).
3. Attendre quelques secondes que GitHub Pages redéploie → c'est en ligne.

Le mot de passe de l'admin, lui aussi, n'est qu'une protection côté navigateur (le code est
visible par n'importe qui qui inspecterait la page). C'est très bien pour éviter qu'un visiteur
lambda tombe sur `/admin.html` par hasard, mais ce n'est **pas** une vraie sécurité — ne mets
rien de sensible dedans.

## Déploiement sur GitHub Pages

1. Crée un repo GitHub (public), par exemple `mes-liens`.
2. Mets-y les 6 fichiers de ce dossier, à la racine du repo.
3. Va dans **Settings → Pages**, source = branche `main`, dossier `/root`.
4. Ton site sera dispo à `https://<ton-pseudo>.github.io/mes-liens/`.
5. Pour gérer tes liens : va sur `https://<ton-pseudo>.github.io/mes-liens/admin.html`
   (garde cette URL pour toi — elle n'est juste pas listée nulle part, mais si quelqu'un
   la devine et devine ton mot de passe, il peut préparer un export ; il ne peut rien
   publier sans accès à ton repo GitHub).

## Tester en local avant de publier

Ouvrir `index.html` directement en double-cliquant ne marchera pas totalement (le
navigateur bloque le `fetch()` de `links.json` en `file://`). Lance un petit serveur local :

```bash
cd mes-liens
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000`.

## Personnaliser

- **Icônes disponibles** : GitHub, LinkedIn, Instagram, X/Twitter, TikTok, YouTube, Discord,
  Twitch, Spotify, Email, Site web, Lien générique. Pour en ajouter d'autres, édite le
  tableau `ICONS` en haut de `admin.js` (les noms viennent de [Font Awesome](https://fontawesome.com/icons), classes `fa-brands` ou `fa-solid`).
- **Couleurs** : tout est piloté par les variables CSS en haut de `style.css` (`--accent-cyan`,
  `--accent-violet`, etc.).
- **Photo de profil** : dans l'admin, colle une URL d'image publique dans « URL d'une photo ».
  Sans URL, ce sont tes initiales qui s'affichent.
