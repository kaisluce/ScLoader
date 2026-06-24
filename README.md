# SC Downloader

Application desktop et web pour télécharger de la musique depuis SoundCloud en MP3.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![Electron](https://img.shields.io/badge/Electron-32-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js)

---

## Fonctionnalités

- **Recherche** — par artiste, titre ou lien SoundCloud direct
- **Filtres** — titres, playlists, albums
- **Vue grille / liste** — avec densité ajustable
- **Téléchargement MP3** — 3 niveaux de qualité : `96k` / `160k` / `320k`
- **Playlists & albums** — téléchargement en un clic
- **File de téléchargement** — plusieurs téléchargements simultanés
- **Choix du dossier** — sélecteur de dossier natif
- **Mini player** — précoute avant téléchargement
- **Historique** — suivi des téléchargements
- **Logs** — vue temps réel des événements serveur
- **Thème** — couleur d'accent personnalisable

---

## Versions

SC Downloader existe en deux versions :

| | Version Web | Version Desktop |
|---|---|---|
| Statut | 🚧 En développement | ✅ Production |
| Accès | Navigateur | macOS / Windows / Linux |
| Téléchargement | Fichier unique, déclenché par le navigateur | Dossier de destination personnalisé, file de téléchargement |
| Serveur | Proxy déployé sur Render | Express embarqué dans l'app |

---

## Installation

### Version desktop

Télécharge le fichier correspondant à ton OS depuis la page [Releases](https://github.com/kaisluce/ScLoader/releases) :

| Plateforme | Fichier |
|---|---|
| macOS | `.dmg` |
| Windows | `.exe` |
| Linux | `.AppImage` |

---

## Développement local

**Prérequis** : Node.js 18+

```bash
git clone https://github.com/kaisluce/ScLoader.git
cd ScLoader
```

### Version desktop (Electron)

```bash
# Installer les dépendances
npm install
cd client && npm install && cd ..

# Lancer (Electron + Vue dev server en parallèle)
npm run electron:dev
```

> Les modifications Vue sont appliquées instantanément sans redémarrer Electron.  
> Seuls les changements dans `electron/main.js` nécessitent un redémarrage manuel.

### Version web

```bash
# Terminal 1 — backend
cd server && npm install && node index.js

# Terminal 2 — frontend
cd client && npm install && npm run serve
```

> L'application web est accessible sur `http://localhost:8080`.  
> Le serveur Express tourne sur `http://localhost:3000`.  
> Pour pointer vers le serveur local, assure-toi que `client/.env.development` ne définit pas `VUE_APP_API_BASE_URL` (ou le mettre à `http://localhost:3000/api`).

---

## Build

```bash
# Builder l'app desktop pour la plateforme courante
npm run electron:build
```

Le build est généré dans `dist-electron/`.

### CI/CD

Chaque **pull request** vers `Electron-app` déclenche un build automatique sur les 3 OS via GitHub Actions.  
Chaque **merge** vers `Electron-app` crée une GitHub Release avec les fichiers `.dmg`, `.exe` et `.AppImage`.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Vue 3, Vue Router |
| Backend | Node.js, Express |
| Desktop | Electron 32 |
| Audio | FFmpeg (ffmpeg-static) |
| Build | electron-builder |
| CI/CD | GitHub Actions |

---

## Structure

```
├── client/          # Frontend Vue 3
├── server/          # Backend Express (proxy SoundCloud + downloader)
├── electron/        # Main process Electron
│   ├── main.js
│   └── preload.js
└── .github/
    └── workflows/   # CI/CD GitHub Actions
```
