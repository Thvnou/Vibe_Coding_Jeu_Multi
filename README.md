# Vibe.io

Projet "Vibe Coding" — jeu multijoueur `.io` en temps réel, développé en pilotant un agent IA (Claude Code) de bout en bout.

**Auteur :** Ethan Machoro
**Dépôt :** https://github.com/Thvnou/Vibe_Coding_Jeu_Multi
**URL de production (client) :** https://thvnou.github.io/Vibe_Coding_Jeu_Multi/ _(déployé automatiquement via GitHub Actions à chaque push sur `main`)_
**URL de production (serveur WebSocket) :** _à compléter après connexion du dépôt sur Render — voir `render.yaml`_

## Le jeu

Un agar.io-like : on contrôle une cellule avec la souris, on mange des pastilles bonus (+score, +taille) en évitant les malus, et on peut manger les joueurs plus petits que soi (ratio de taille ≥ 1.1). Le serveur est autoritaire (tick à 30Hz) et diffuse l'état du monde à tous les clients connectés via Socket.io. Un leaderboard temps réel et un HUD affichent le score.

## Lancer en local

Prérequis : Node.js 20+.

```bash
npm install
npm run dev
```

- Client sur http://localhost:5173
- Serveur WebSocket sur http://localhost:3001
- Ouvrir l'URL du client dans deux onglets pour tester le multijoueur.

Autres commandes utiles :

```bash
npm run lint        # ESLint sur tout le monorepo
npm run typecheck    # tsc --noEmit sur les 3 packages
npm test             # Vitest (logique métier serveur)
npm run build         # build shared + server + client
```

## Architecture

Monorepo npm workspaces : `packages/shared` (types et contrats réseau partagés), `packages/server` (Node + Socket.io), `packages/client` (Vite + Canvas 2D).

- **SRP** : le moteur de jeu (`server/src/game/`) ignore tout du réseau ; le réseau (`server/src/index.ts`) ignore tout de la physique ; le rendu client (`client/src/render/`) ne fait que dessiner un `GameStateSnapshot`, sans logique de jeu.
- **Logique métier en fonctions pures** : `physics.ts` (collisions, déplacement) et `rules.ts` (rayon/vitesse/seuil pour manger un joueur) sont des fonctions pures, testées indépendamment de l'état du `GameRoom`.
- **Validation aux frontières** : `validation.ts` ne fait jamais confiance aux payloads socket entrants (un client malveillant peut envoyer n'importe quel JSON malgré les types TypeScript, qui ne sont vérifiés qu'à la compilation).
- **Atomic Design côté client** : `ui/atoms` (ScoreBadge) → `ui/molecules` (JoinForm) → `ui/organisms` (Menu, Hud, Leaderboard).
- **Design Tokens** : toutes les couleurs/espacements/typographies viennent de `client/src/styles/tokens.css`, jamais codés en dur dans un composant.

Détail des règles architecturales imposées à l'IA : voir [`CLAUDE.md`](./CLAUDE.md).

## Qualité, tests, sécurité

- ESLint (flat config) + Prettier + TypeScript strict configurés sur les 3 packages.
- 35 tests unitaires Vitest sur la logique critique : règles de scoring/taille (`rules.test.ts`), collisions et mouvement (`physics.test.ts`), orchestration du `GameRoom` — y compris des scénarios déterministes de "qui mange qui" malgré le spawn aléatoire (`GameRoom.test.ts`) — et validation réseau (`validation.test.ts`).
- Durcissement serveur : validation stricte des payloads socket (`join`, `input`), rejet des `NaN`/`Infinity` qui casseraient la simulation, cap à 50 joueurs par room, rate limiting basique sur les événements `input` (anti-spam).
- CI/CD : GitHub Actions (`.github/workflows/ci.yml`) lance lint + typecheck + test + build sur chaque push/PR, puis déploie automatiquement le client sur GitHub Pages depuis `main`.

## Arsenal IA & Écosystème Agentique

**Outil et LLM :** Claude Code (CLI) piloté par Claude Sonnet 4.6, en accès direct au terminal (PowerShell/Bash), au système de fichiers et à GitHub CLI. Tout le code de ce dépôt — moteur de jeu, réseau, UI, tests, CI/CD — a été écrit par l'agent, dirigé par des prompts en langage naturel et des allers-retours de correction.

**MCP et outils activés pendant le développement :**
- Outils natifs Claude Code : exécution shell (Bash/PowerShell), édition de fichiers, recherche (Grep/Glob), gestion de tâches (TaskCreate/TaskUpdate) pour suivre l'avancement sur les ~15 chantiers du projet.
- `mcp__computer-use` et `mcp__Claude_in_Chrome` ont été sollicités pour valider visuellement le jeu dans un navigateur réel. **Résultat en pratique :** le tier de sécurité de `computer-use` interdit le clic/la saisie dans les navigateurs (lecture seule), et l'extension Chrome MCP était déconnectée au moment du test — aucun des deux n'a pu piloter une UI web dans cette session. Voir section "Analyse critique" pour comment ce blocage a été contourné.
- Aucun serveur MCP custom n'a été développé spécifiquement pour ce projet. Avec plus de temps, un MCP exposant l'état live du `GameRoom` (snapshot JSON interrogeable) aurait été utile pour debugger la synchronisation réseau sans instrumenter manuellement le code.
- **Ruleset agentique :** [`CLAUDE.md`](./CLAUDE.md), rédigé après la phase de scaffolding initial pour figer les décisions d'architecture (SRP, fonctions pures, validation aux frontières, Atomic Design, Design Tokens) et les imposer à toute session future sur ce dépôt.

## Ingénierie de Prompt — Master Prompts

**1. Cadrage initial (débloque la décomposition en phases)**
> "avant de réaliser ce projet liste les étapes à réaliser dans l'ordre"
Appliqué au brief PDF du projet, ce prompt a forcé l'agent à produire un plan en 7 phases (setup → moteur → réseau → UI → DevOps → sécurité → README) *avant* d'écrire la moindre ligne de code. Toute la suite du projet a suivi cette décomposition, ce qui a évité l'écueil classique du Vibe Coding : une IA qui se met à coder un gros bloc monolithique sans plan.

**2. Verrouillage des choix d'architecture (débloque la stack)**
Au moment de configurer l'outillage qualité, plutôt que de laisser l'agent choisir seul, il a été contraint de poser explicitement les questions structurantes (TypeScript vs JS, monorepo vs dossiers séparés, ESLint flat config) avant d'écrire `package.json`. C'est ce prompt-cadre — "passe à la config de qualité" associé à l'exigence de confirmer la stack — qui a permis d'obtenir un monorepo npm workspaces propre dès le départ plutôt qu'une structure à refactoriser plus tard.

**3. Autonomie complète sous contrainte (débloque l'exécution de bout en bout)**
> "Tu est un étudiant en dev : Réalise l'entèreté du projet, fait attention à prendre compte des critères éliminatoires."
Ce prompt est celui qui a le plus changé la dynamique : il a transformé l'agent d'un mode "répond à une question à la fois" à un mode "exécute un plan de 15 tâches de façon autonome" (tests, durcissement sécurité, CI/CD, déploiement, README), tout en gardant les deux critères éliminatoires (README avec noms clairs, multijoueur fonctionnel à 2+ joueurs) comme garde-fou explicite à chaque étape. C'est ce type de contrainte — autonomie large + invariants non négociables nommés explicitement — qui évite qu'un agent en mode autonome dérive sur des tâches secondaires en oubliant l'objectif principal.

## Analyse Critique & Hallucinations

### Là où l'IA a été efficace
- Scaffolding complet d'un monorepo (workspaces, TS strict, ESLint flat config, Prettier, project references) en quelques minutes, sans erreur de configuration majeure au premier essai.
- Séparation SRP spontanée et cohérente : dès la première version du moteur de jeu, la logique réseau (`index.ts`), la logique de jeu (`GameRoom.ts`) et la physique (`physics.ts`) étaient déjà dans des fichiers distincts, sans qu'il ait fallu le redemander.
- Détection proactive de 7 vulnérabilités npm (`esbuild`/`vite`, `shell-quote`/`concurrently`) juste après l'installation initiale, avec recherche des versions corrigées et mise à jour — sans que ce soit demandé explicitement.
- Quand l'écriture des tests a révélé que `GameRoom` mélangeait formules de jeu et gestion d'état, l'agent a refactorisé de lui-même `rules.ts` (fonctions pures : rayon, vitesse, seuil pour manger) pour rendre la logique testable isolément — une amélioration d'architecture *causée par* l'écriture des tests, pas anticipée à l'avance.

### Là où l'IA s'est trompée (et comment on a repris la main)
- **Test instable (faux négatif).** Le premier test "un joueur plus gros mange un joueur plus petit" échouait environ 1 fois sur 70 : le pellet bonus choisi aléatoirement pour faire grandir le joueur pouvait se trouver à quelques pixels d'un pellet malus, annulant le gain de score au moment de la collecte. L'IA a d'abord cru à un bug du moteur de jeu, a ajouté des `console.log` de debug, recommencé le test plusieurs fois (27/27 puis échec aléatoire), avant d'identifier la vraie cause : un défaut de conception du *test* (dépendance non maîtrisée au hasard du spawn), pas du code. Correction : helpers `findIsolatedBonusPellet` / `expectNoPelletNear` qui garantissent l'absence de pellet parasite avant d'asserter un score exact.
- **Erreur mathématique dans un test.** Un test de "rendements décroissants" sur la formule de rayon (`radiusFromScore`) comparait `radius(400) - radius(100)` à `radius(100) - radius(0)` — des écarts de score non équivalents (300 vs 100), ce qui rendait l'assertion mathématiquement fausse indépendamment du code testé. Corrigé en comparant des écarts de score égaux (100/200/300).
- **Référence TypeScript incomplète.** Le découpage en 3 packages avec `references` TypeScript (`server`/`client` → `shared`) a échoué à la première compilation (`TS6306: must have setting "composite": true`) car `packages/shared/tsconfig.json` n'avait pas été configuré pour être un projet référençable. Corrigé en une ligne, mais révèle que l'IA a généré une structure multi-projets TS sans valider immédiatement qu'elle compilait de bout en bout.
- **Dépendances obsolètes dès l'installation.** Les versions de `vite`, `vitest` et `concurrently` choisies "de mémoire" par l'IA au moment du scaffolding initial étaient déjà vulnérables (`npm audit` : 2 modérées, 2 hautes, 3 critiques) dès le premier `npm install`. Cela montre une limite connue des LLM : les versions de packages "par défaut" dans leurs connaissances ne sont pas toujours les plus récentes ni les plus sûres — un `npm audit` systématique après chaque install reste nécessaire, l'IA ne doit pas être crue sur parole pour les numéros de version.
- **Outils navigateur indisponibles en cours de session.** Pour vérifier visuellement le multijoueur dans un vrai navigateur, l'IA a tenté `computer-use` (bloqué : les navigateurs sont en accès lecture seule pour cet outil, clic/saisie interdits) puis l'extension Chrome MCP (déconnectée). Plutôt que de prétendre avoir testé visuellement, l'IA l'a signalé explicitement et a basculé sur une vérification automatisée équivalente : un script Node temporaire ouvrant deux vraies connexions Socket.io (`socket.io-client`) simulant 2 joueurs, confirmant que les deux se voient dans l'état partagé et que les positions se synchronisent en temps réel — preuve fonctionnelle du critère éliminatoire, bien que sans confirmation visuelle du rendu Canvas.
- **Authentification GitHub CLI expirée.** Le premier `gh auth login` (flux "device code") a expiré avant d'être complété côté utilisateur (~15 minutes de validité), nécessitant de relancer la procédure avec un nouveau code — un rappel que les flux d'auth interactifs ont une fenêtre de validité courte quand ils sont lancés en tâche de fond pendant que l'agent continue à travailler sur autre chose.

## Labels GitHub

`ui`, `network`, `engine`, `docs` utilisés pour catégoriser les Issues/PR du dépôt.
