# SI---grupa7

Repozitorij projekta "Sistem za upravljanje servisnim intervencijama".

Dokumentacija sprintova ostaje u postojećim `SPRINT1/` do `SPRINT4/` folderima, a implementacioni skeleton je smješten u `SPRINT4/projekat/`.

## Kontekst projekta

Rješenje je planirano kao web sistem za prijavu, praćenje i upravljanje servisnim intervencijama. Prema prethodnim sprint dokumentima, MVP pokriva prijavu kvara, dodjelu i praćenje intervencija, upravljanje korisničkim računima, historiju, notifikacije i osnovnu administraciju.

## Kako je organizovan skeleton

- `SPRINT4/projekat/frontend/` je Next.js App Router aplikacija i predstavlja prezentacioni sloj sistema.
- `SPRINT4/projekat/backend/` je Node.js + Express API u TypeScriptu i predstavlja poslovni sloj i pristup podacima.
- `SPRINT1/` do `SPRINT4/` sadrže projektnu dokumentaciju, odluke i planove.
- `SPRINT4/projekat/infra/mysql/init/` je rezervisan za buduće MySQL init skripte koje se montiraju kroz Docker Compose.
- `SPRINT4/projekat/package.json` koristi npm workspaces za zajedničke skripte i build/typecheck tokove.

## Inicijalna struktura repozitorija

Razvojni workflow koristi GitHub Flow. Detalji su opisani u [SPRINT4/inicijalna-struktura-repozitorija-i-tehnicki-setup.md](SPRINT4/inicijalna-struktura-repozitorija-i-tehnicki-setup.md).

## Tehnički setup

- Frontend: Next.js 15, React 18, TypeScript, Axios, Socket.IO client
- Backend: Node.js 20, Express, TypeScript, MySQL, Socket.IO, Zod, Helmet, CORS, dotenv
- Lokalna baza: MySQL 8 kroz [SPRINT4/projekat/docker-compose.yml](SPRINT4/projekat/docker-compose.yml), uz Adminer za pregled podataka
- Razvojni alati: npm workspaces u [SPRINT4/projekat/package.json](SPRINT4/projekat/package.json), `tsx` za backend development server, `tsc` za build i typecheck

## Lokalni start

1. Uđi u `SPRINT4/projekat`.
2. Pokreni `npm install`.
3. Pokreni bazu sa `docker compose up -d`.
4. Pokreni backend sa `npm run dev:backend`.
5. Pokreni frontend sa `npm run dev:frontend`.

Frontend je sada baziran na Next.js App Router-u i koristi standardni Next razvojni server.