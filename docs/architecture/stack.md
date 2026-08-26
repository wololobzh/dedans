# Stack technique épinglée

Ce fichier est la référence de version du starter.

| Composant | Version |
|---|---:|
| Node.js | 22.x (image `node:22-alpine`) |
| pnpm | 10.15.0 |
| TypeScript | 6.0.3 |
| NestJS core/common/platform-express | 11.2.1 |
| NestJS application tooling | 11.0.24 |
| Nest schematics | 11.1.0 |
| Next.js | 16.3.3 |
| React / React DOM | 19.2.8 |
| Prisma / Prisma Client | 7.9.1 |
| PostgreSQL | 17 Alpine |

## Contrainte TypeScript

TypeScript 7.0 n'est volontairement pas utilisé tant que le NestJS application tooling dépend de l'API programmatique du compilateur absente de TypeScript 7.0.

Ne pas monter TypeScript vers 7.x sans vérifier explicitement que `nest start`, `nest build`, `docker compose up` et le build Docker fonctionnent.
