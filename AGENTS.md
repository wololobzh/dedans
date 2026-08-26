# GitHub Copilot agent collaboration protocol

Ce fichier décrit comment les **agents de développement GitHub Copilot** collaborent pour construire l'ERP.

Important : ces agents ne font pas partie de l'application exécutée. L'ERP ne contient aucun agent IA runtime.

## Équipe d'agents

- **product** : clarifie les besoins métier et les critères d'acceptation.
- **architect** : définit les frontières, contrats, dépendances et impacts d'une feature.
- **database** : conçoit le modèle de données, contraintes, index et migrations.
- **backend** : implémente domaine, application et API.
- **frontend** : implémente l'expérience utilisateur.
- **qa** : conçoit et implémente les tests importants.
- **reviewer** : challenge la solution et cherche les défauts, risques et régressions.

## Ordre de travail par défaut

Pour une nouvelle feature :

1. **product** clarifie le besoin métier et les critères d'acceptation.
2. **architect** découpe la solution et identifie les domaines impactés.
3. **database** valide les données, contraintes, index et migration éventuelle.
4. **backend** implémente domaine, application et API.
5. **frontend** implémente l'expérience utilisateur.
6. **qa** ajoute les tests importants et vérifie les cas limites.
7. **reviewer** cherche activement les défauts, régressions, couplages et risques.

Tous les rôles ne sont pas obligatoires pour chaque changement. L'architecte peut réduire la chaîne pour une modification simple.

## Règles de handoff

Chaque agent doit produire :

- ce qu'il a compris ;
- les fichiers qu'il propose de modifier ;
- les hypothèses prises ;
- les risques ou questions ouvertes ;
- les critères permettant de considérer son travail terminé.

## Règles d'architecture

- Lire `docs/product/glossary.md` avant d'introduire un concept métier.
- Ne pas créer deux noms pour le même concept.
- La logique métier vit dans `packages/domain` et `packages/application`.
- `apps/web` ne contient pas de règles métier.
- `apps/api` expose les use cases, il ne devient pas le domaine.
- `packages/database` est le seul package propriétaire de l'infrastructure Prisma.
- Toute nouvelle métrique doit être définie dans `docs/domains/analytics.md`.
- Toute décision structurante doit créer ou mettre à jour un ADR.
- Ne pas introduire d'agent IA runtime, LLM, Copilot SDK ou orchestration de prompts dans l'ERP sans décision produit explicite future.

## Definition of Done

Une feature n'est terminée que si :

- critères d'acceptation satisfaits ;
- types et validation présents ;
- permissions considérées ;
- tests du comportement critique présents ;
- documentation métier mise à jour si nécessaire ;
- aucun accès direct DB depuis le frontend ;
- reviewer n'a pas de blocage critique restant ;
- `docker compose up` permet toujours de lancer l'application complète.

## Docker-first delivery contract

All agents must preserve the local developer contract: from a fresh clone, `docker compose up` starts the complete application with default development configuration. If a feature adds an infrastructure dependency, the implementing agent must update Docker Compose, readiness/health checks, and documentation in the same change. Do not introduce mandatory host-side setup commands for normal application startup.
