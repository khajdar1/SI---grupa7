# SI---grupa7

Repozitorij projekta "Sistem za upravljanje servisnim intervencijama".

Dokumentacija sprintova ostaje u postojećim `SPRINT1/` do `SPRINT4/` folderima, a implementacioni skeleton je smješten u `SPRINT4/projekat/`.

## Kontekst projekta

Rješenje je planirano kao web sistem za prijavu, praćenje i upravljanje servisnim intervencijama. MVP pokriva prijavu kvara, dodjelu i praćenje intervencija, upravljanje korisničkim računima, historiju, notifikacije i osnovnu administraciju.

## Kako je organizovan skeleton

- `SPRINT4/projekat/frontend/` je Next.js App Router aplikacija i predstavlja prezentacioni sloj sistema.
- `SPRINT4/projekat/backend/` je Node.js + Express API u TypeScriptu i predstavlja poslovni sloj i pristup podacima.
- `SPRINT4/projekat/backend/src/modules/attachments/` je početni file-storage/attachment stub za metapodatke i buduću S3 integraciju.
- `SPRINT1/` do `SPRINT4/` sadrže projektnu dokumentaciju, odluke i planove.
- `SPRINT4/projekat/infra/mysql/init/` je rezervisan za buduće MySQL init skripte koje se montiraju kroz Docker Compose.
- `SPRINT4/projekat/package.json` koristi npm workspaces za zajedničke skripte i build/typecheck tokove.

## Inicijalna struktura repozitorija

Razvojni workflow koristi GitFlow. `master` je rezervisan za stabilne release/hotfix mergeove i deployment, `develop` je integraciona grana, `feature/*` grane nose pojedinačne user story stavke, `fix/*` služi za obične bugfixeve iz razvoja, `other/*` pokriva chore i sitne tehničke zadatke, `release/*` služi za stabilizaciju verzija, a `hotfix/*` za hitne produkcijske ispravke. Detalji su opisani u [SPRINT4/inicijalna-struktura-repozitorija-i-tehnicki-setup.md](SPRINT4/inicijalna-struktura-repozitorija-i-tehnicki-setup.md).

## Tehnički setup

- Frontend: Next.js 15, React 18, TypeScript, Axios, Socket.IO client
- Backend: Node.js 20, Express, TypeScript, MySQL, Socket.IO, Zod, Helmet, CORS, dotenv
- [SPRINT4/projekat/docker-compose.yml](SPRINT4/projekat/docker-compose.yml) diže frontend, backend i MySQL iz istog fajla
- Razvojni alati: npm workspaces u [SPRINT4/projekat/package.json](SPRINT4/projekat/package.json), `tsx` za backend development server, `tsc` za build i typecheck

## Lokalni start

1. Uđi u `SPRINT4/projekat`.
2. Kopiraj `.env.example` u `.env` i po potrebi promijeni `PUBLIC_HOST`.
3. Pokreni `npm install`.
4. Pokreni cijeli stack sa `npm run compose:up`.

Frontend, backend i MySQL se dižu iz istog `docker-compose.yml` fajla.

Ako želiš ugasiti stack, pokreni `npm run compose:down`.