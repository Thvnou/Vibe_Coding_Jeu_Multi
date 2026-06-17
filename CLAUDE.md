# Règles du projet — Vibe.io

Contexte pour tout agent IA (Claude Code, Cursor, Copilot...) intervenant sur ce dépôt.

## Stack

- Monorepo npm workspaces : `packages/shared`, `packages/server`, `packages/client`.
- TypeScript strict partout (`tsconfig.base.json`), aucun `any` implicite.
- Client : Vite + Canvas 2D natif (pas de framework de rendu). Serveur : Node + Socket.io.
- `packages/shared` contient les seuls types/contrats partagés entre client et serveur (`events.ts`, `types.ts`). Ni le client ni le serveur n'importent l'un dans l'autre directement.

## Architecture non négociable

- **SRP strict** : un fichier = une responsabilité. Le moteur de jeu (`packages/server/src/game/`) ne connaît rien au réseau ; le réseau (`index.ts`) ne connaît rien à la physique ; le rendu (`render/Renderer.ts`) ne fait que dessiner un `GameStateSnapshot`, jamais de logique de jeu.
- **Logique métier en fonctions pures** quand c'est possible (voir `rules.ts`, `physics.ts`) : pas d'état caché, faciles à tester unitairement sans mock.
- **Validation aux frontières uniquement** : le serveur ne fait jamais confiance aux payloads socket (voir `validation.ts`). Le code interne (GameRoom, etc.) suppose des données déjà saines — ne pas dupliquer la validation partout.
- **Atomic Design côté UI** : `ui/atoms` → `ui/molecules` → `ui/organisms`. Un atome ne connaît pas le DOM global, un organisme orchestre ses molécules/atomes mais ne contient pas de logique réseau.
- **Design Tokens** : toute couleur/espacement/typo passe par une variable CSS définie dans `styles/tokens.css`. Ne jamais coder une couleur en dur dans un composant.

## Style

- DRY/KISS : pas d'abstraction pour un seul cas d'usage, pas de couche générique "au cas où".
- Pas de commentaires qui répètent ce que le code dit déjà — seulement pour une contrainte non évidente (ex: pourquoi un seuil vaut 1.1).
- ESLint + Prettier font foi pour le style ; ne pas discuter du formatage, lancer `npm run format`.

## Tests

- Toute règle de jeu (scoring, rayon, qui mange qui, validation réseau) doit avoir un test unitaire dans `*.test.ts` à côté du fichier testé.
- Les tests ne doivent jamais dépendre du hasard (spawn aléatoire des pellets/joueurs) sans neutraliser ce hasard explicitement (voir les helpers `teleportPlayer` / `findIsolatedBonusPellet` dans `GameRoom.test.ts`).

## Avant de proposer un changement

1. `npm run lint && npm run typecheck && npm test` doivent passer.
2. Si une dépendance est ajoutée, vérifier `npm audit` derrière.
3. Ne pas casser le contrat `packages/shared` sans mettre à jour les deux côtés (client ET serveur).
