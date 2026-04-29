# AI Usage Log — PBI-003 (Bosanski)

- Datum: 2026-04-29
- Agent: GitHub Copilot

## Svrha korištenja
Kratko dokumentovati rad izvršen tokom implementacije PBI-003 ("Prijava kvara") tako da tim ima jasnu evidenciju koji su fajlovi promijenjeni, koje su odluke donesene i koje provjere su izvršene.

## Kratak opis upita / zadatka
Zadatak je bio: omogućiti pouzdanu prijavu kvara sa sljedećim principima — neregistrirani korisnik može poslati hitnu prijavu (s obaveznim kontakt podacima), prijavljeni korisnik može podnijeti redovnu prijavu i upload-ovati priloge, a sistem automatski kreira intervenciju nakon uspješne prijave.

## Šta je preuzeto, šta prilagođeno, a šta odbačeno
- Preuzeto: postojeći API endpointi, model prijave (lokacija, opis, kategorija, attachments) i postojeća stranica za prijavu kvara kao početna tačka.
- Prilagođeno: validacija polja (npr. `location` prihvata praznu vrijednost za hitne prijave), poslovna pravila autorizacije (redovna prijava zahtijeva autentifikaciju), payload builder i frontend UI (default ponašanje, onemogućavanje opcije za goste, uklanjanje duplog preview-a).
- Odbačeno: razvojne ili testne improvizacije u payloadu i UI koje nisu dio produkcijskog ponašanja.

## Sažetak izvršenih zadataka (kratko)
1. Ažurirana validacija polja na ruti za prijavu kvara i pojednostavljen payload builder.
2. Poslovna pravila su prilagođena tako da su redovne prijave vezane uz autentifikaciju, dok hitne prijave mogu doći od gostiju uz obavezne kontakt podatke.
3. Frontend forma je izmijenjena: gost automatski vidi hitan mod, opcija za redovnu prijavu je onemogućena za neregistrirane korisnike, uklonjen je duplicirani quick overview.
4. Testovi su ažurirani i izvršeni; napravljen je frontend build i lokalno je verifikovano da backend vraća `201 Created` za validan zahtjev.

## Kompletan commit — izmijenjene datoteke i kratki opis izmjena
- `projekat/backend/src/modules/fault-reports/fault-reports.route.ts` — izmjena Zod sheme: `location` sada može biti prazno ili imati >= 3 znaka; koristi se čist payload builder.
- `projekat/backend/src/modules/fault-reports/fault-reports.payload.ts` — pojednostavljen builder payloada; vraća normaliziran objekt.
- `projekat/backend/src/modules/fault-reports/fault-reports.service.ts` — ažurirana poslovna pravila: `regular` prijave su dopuštene samo autentificiranim korisnicima; `emergency` prijave od gostiju zahtijevaju `reporterName` i `reporterPhone`.
- `projekat/backend/src/modules/fault-reports/*.test.ts` — testovi su ažurirani i usklađeni s promijenjenom validacijom i autorizacijom.
- `projekat/frontend/src/app/fault-reports/page.tsx` — UI prilagodbe: uklonjen quick overview; default za goste je `emergency`; opcija `regular` onemogućena za goste; forma više ne šalje razvojna polja.
- `projekat/frontend/src/app/interventions/page.tsx` — stranica sada vadi i prikazuje stvarne intervencije s backend-a kako bi nove intervencije bile odmah vidljive koordinatoru.
- `projekat/test-payload.ps1` — skripta za testiranje HTTP POST zahtjeva korištena pri verifikaciji.
- `SPRINT5/AI-usage-log-PBI-003.md` — ova dokumentacija (ažurirana i prevedena na bosanski).

## Tačne komande koje su pokrenute tokom rada (dokaz izvršenja)
```powershell
# Backend typecheck
cd projekat/backend
npm run typecheck

# Pokretanje testova za fault-reports modul
npx vitest run src/modules/fault-reports --run --reporter dot

# Rekompajliranje i restart backend kontejnera (lokalno)
cd ..
docker compose up -d --build backend

# Frontend build
cd projekat/frontend
npm run build

# Test HTTP POST (PowerShell skripta)
.\test-payload.ps1
```

## Rezultati testova i build-a
- TypeScript typecheck (backend i frontend): prošao.
- Vitest unit testovi za `fault-reports`: svi relevantni testovi su prošli.
- Frontend build: prošao; rute `/fault-reports` i `/interventions` su prisutne i kompajliraju se.
- Docker rebuild backend: kontejner se pokrenuo lokalno i odgovorio na testni POST sa statusom `201 Created` (generisani `referenceNumber`).

## Rizici i problemi koje je tim uočio
- Potencijalna potreba za ažuriranjem QA skripti i integracija koje koriste raniji oblik payloada.
- Moguća konfuzija u testnim scenarijima ako se ne usklade testne skripte s novim ponašanjem.

Preporuke:
- Pokrenuti end-to-end test sa stvarnim auth providerom (Keycloak) prije objave u produkciju.
- Ažurirati dokumentaciju API-ja kako bi potrošači znali o izmjenama u poljima i autorizaciji.

---

Ovaj zapis je kreiran tokom implementacije PBI-003 i sadrži kompletan pregled commita, komandi i verifikacija izvršenih lokalno.