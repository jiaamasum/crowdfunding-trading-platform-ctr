
Task name: Set up project infrastructure and environments
Description: User Stories Covered:
As a developer, I need a structured repo, environments, and CI/CD so we can build the CTP-MVP quickly and safely.

Backend Checklist:
Initialize backend service/repo with base API framework and health-check endpoint.
Configure shared environment variables and config management for dev/stage/prod.
Set up database connection boilerplate and migration tooling (no domain models yet).

Frontend Checklist:
Initialize frontend app (SPA) with routing, state management, and basic layout shell.
Configure environment handling and API base URL wiring.
Add placeholder routes for core areas: Auth, Projects, Investor, Admin.

Definition of Done:
Single repo or coordinated repos exist for backend and frontend with build passing.
Environments and CI/CD are configured and verified for at least dev and stage.
Basic testing scaffolding is in place and green on CI.

subtasks: 
Define MVP architecture and select tech stack
Set up repository structure and base modules
Configure environments and secrets management