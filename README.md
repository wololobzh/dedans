# School ERP — Copilot Starter v2

Starter TypeScript monorepo pour construire un ERP d'école multi-campus avec une **équipe d'agents GitHub Copilot pour le développement**, sans agent IA embarqué dans l'ERP.

## Démarrage

Prérequis unique : **Docker Desktop** avec Docker Compose.

```bash
docker compose up
```

C'est tout. Au premier lancement, Docker Compose :

1. télécharge/build les images nécessaires ;
2. démarre PostgreSQL ;
3. attend que PostgreSQL soit healthy ;
4. exécute `prisma generate` puis `prisma db push` ;
5. démarre l'API NestJS ;
6. attend que `GET /health` réponde ;
7. démarre le frontend Next.js / React.

### URLs

- Front : http://localhost:3000
- API : http://localhost:3001/health
- PostgreSQL : localhost:5432

### Arrêt

```bash
docker compose down
```

Réinitialisation complète de la base locale :

```bash
docker compose down -v
```

## Versions volontairement épinglées

| Composant | Version |
|---|---:|
| Node.js Docker | 22.x |
| pnpm | 10.15.0 |
| TypeScript | 6.0.3 |
| NestJS | 11.2.1 |
| TypeScript CLI | 11.0.24 |
| Next.js | 16.3.3 |
| React | 19.2.8 |
| Prisma | 7.9.1 |
| PostgreSQL | 17 Alpine |

### Pourquoi TypeScript 6 ?

TypeScript CLI 11 ne peut pas encore utiliser TypeScript 7 pour `nest start` / `nest build`, car TypeScript 7.0 n'expose pas l'API programmatique de compilation attendue par le CLI. Le repo force donc **TypeScript 6.0.3 partout**, y compris dans les dépendances transitives via `pnpm.overrides`.

Le `Dockerfile.dev` contient en plus un garde-fou : le build échoue immédiatement si une autre version de TypeScript est résolue.

## Architecture

```text
apps/
├── api/          NestJS
└── web/          Next.js + React

packages/
├── domain/       règles métier pures
├── application/  use cases / contrats
└── database/     Prisma / PostgreSQL

.github/
├── agents/       agents Copilot de développement uniquement
├── instructions/
├── prompts/
└── skills/
```

Les agents `.github/agents/*` **ne vivent pas dans l'ERP**. Ils servent uniquement à t'aider à concevoir, coder, tester et relire le logiciel.

## Première feature recommandée

Commence par **Campus** : CRUD minimal + liste des campus. Ensuite seulement branche promotions, apprenants, SWE et métriques.

Prompt recommandé dans Copilot :

> Utilise d'abord product puis architect pour concevoir la feature « gestion des campus ». Ensuite implémente la vertical slice database → backend → frontend → qa → reviewer en respectant AGENTS.md et la documentation du repo.

## Contrat Docker

Une feature n'est pas terminée si elle casse cette commande :

```bash
docker compose up
```

Toute nouvelle dépendance d'infrastructure requise localement doit être ajoutée au Compose.

## API compilation strategy

The API is a NestJS application but does **not** depend on `@nestjs/cli` at runtime or in development.
It is compiled with the TypeScript CLI (`tsc`) and started with Node. This deliberately avoids the current Nest CLI incompatibility with TypeScript 7 while the project pins TypeScript 6.0.3.

TypeScript is enforced in `pnpm-workspace.yaml` using pnpm's root `overrides` setting.
