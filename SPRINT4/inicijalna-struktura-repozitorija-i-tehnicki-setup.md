# Inicijalna struktura repozitorija i tehnički setup

Ovaj dokument razdvaja tri stvari: fizički skeleton projekta, branching strategiju i osnovni tehnički setup.

## 1. Šta je skeleton projekta

- Skeleton projekta nije samo tekstualni opis, nego stvarna implementacija u workspaceu.
- U ovom repozitoriju skeleton je realizovan kroz `SPRINT4/projekat/`:
  - `SPRINT4/projekat/frontend/` - Next.js App Router aplikacija.
  - `SPRINT4/projekat/backend/` - Express API u TypeScriptu.
  - `SPRINT4/projekat/package.json` i `SPRINT4/projekat/docker-compose.yml` - zajednički workspace i lokalna infrastruktura.
  - `SPRINT1/` do `SPRINT4/` - projektna dokumentacija.
- Klasični MVC nazivi su ovdje mapirani na moderne slojeve:
  - controllers/routes -> `SPRINT4/projekat/backend/src/modules/*/*.route.ts`
  - views -> `SPRINT4/projekat/frontend/src/app/**/page.tsx`
  - models/domain -> domen i pristup bazi kroz backend sloj i MySQL šemu
  - JS/HTML -> u praksi su zamijenjeni TypeScript/TSX komponentama i Next.js stranicama

## 2. Branching strategija: GitHub Flow

Za ovaj projekat je odabran GitHub Flow umjesto GitFlowa.

### Pravila rada

- `main` ostaje stabilna i uvijek spremna za merge i release.
- Svaki novi zadatak se razvija na kratkoživućoj grani tipa `feature/<ime-zadatka>`.
- Završene izmjene prolaze kroz pull request i pregled prije spajanja.
- Pregled obavezno moraju prihvatiti 3 osobe, gdje je 1 od njih uvijek Scrum Master
- Prije merge-a se očekuje provjera builda i typechecka.
- Po potrebi se koriste `fix/` ili `hotfix/` grane za brze ispravke.

### Zašto GitHub Flow

- Ima manje procesnog opterećenja nego GitFlow, što odgovara manjem timu i iterativnom razvoju.
- Omogućava česta spajanja u `main` bez dugotrajnih razvojnih grana.
- Lakše se uklapa u sprint isporuke i brže validacije implementacije.
- Jednostavnije je pratiti historiju promjena i vezati ih za konkretne zadatke ili pull requestove.

## 3. Osnovni tehnički setup

### Tehnologije i alati

- Frontend: Next.js 15, React 18, TypeScript, Axios, Socket.IO client.
- Backend: Node.js 20, Express, TypeScript, mysql2, Socket.IO, Zod, Helmet, CORS, dotenv.
- Baza podataka: MySQL 8.
- Lokalna infrastruktura: Docker Compose i Adminer.
- Development tooling: npm workspaces, `tsx` za backend development server i `tsc` za build/typecheck.

### Zašto ove odluke

- TypeScript na oba sloja smanjuje broj grešaka i olakšava rad na većem broju međusobno povezanih modula.
- Next.js odgovara sistemu koji ima više korisničkih pregleda i treba jasan route-based frontend.
- Express je dovoljno lagan za modularni API i ne uvodi dodatnu kompleksnost.
- MySQL je dobar fit za relacijski model korisnika, intervencija, timova i historije.
- Docker Compose pojednostavljuje lokalni start baze i buduće dodavanje pomoćnih servisa.
- Socket.IO pokriva notifikacije i real-time tokove bez komplikovanja infrastrukture.

### Ciljani način isporuke

- Lokalni razvoj se pokreće kroz Node.js procese za frontend i backend, uz Docker Compose za MySQL.
- Ciljani produkcijski model je Linux server ili Docker host sa jasno razdvojenim servisima.

## 4. Šta je trenutno otvoreno za dalji razvoj

- CI/CD pipeline još nije definisan u ovom dokumentu.
- Migracije i seed skripte za bazu još nisu formalizovane.
- Produženi model autentikacije i autorizacije može se dalje razraditi kada se zaključi finalni auth flow.
- Ovaj dokument prati trenutno stanje u `SPRINT4/projekat/` i može se dopunjavati kako se zatvaraju naredni tehnički detalji.