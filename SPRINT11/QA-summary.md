# QA izvjestaj - finalna predaja

## 1. Svrha

Ovaj dokument objedinjuje zavrsni QA izvjestaj za finalnu predaju. U jednom dokumentu su sazetak testiranja, integracioni testovi, Playwright automation testovi, smoke testovi, komande i dokaz rezultata.

## 2. Vrste testova

| Vrsta testiranja | Lokacija | Pokriva |
| --- | --- | --- |
| Backend unit/service/route testovi | `projekat/backend/test` | Servisi, validacije, autorizacija, route handling, poslovna pravila |
| Finalni integration testovi | `projekat/backend/test/final.integration.test.ts` | Coverage svih funkcionalnih grupa + Settings, feedback i blokiranje kroz HTTP route sloj |
| Reopen integration testovi | `projekat/backend/test/reopen.integration.test.ts` | PBI-059 tok ponovnog otvaranja intervencije |
| Frontend unit/component testovi | `projekat/frontend/src/**/*.test.*` | UI komponente, i18n, feedback/settings tokovi |
| Playwright browser automation | `projekat/e2e/final-ui.spec.ts` | Browser tokovi kroz Chromium |
| Deployment smoke test | `projekat/scripts/smoke-test.mjs` | Backend health i frontend dostupnost |
| Automation runner | `projekat/scripts/automation-test.mjs` | Jedna komanda za Prisma generate, typecheck, Vitest i Playwright |

## 3. Pokretanje testova

Kompletna automatizovana provjera:

```powershell
cd projekat
npx playwright install chromium
npm run test:automation
```

Pojedinacno:

```powershell
npm run test:backend
npm run test:frontend
npm run test:e2e
npm run test:coverage
npm run test:smoke
```

Smoke test sa produkcijskim URL-ovima:

```powershell
$env:BACKEND_HEALTH_URL="https://backend.example.com/api/v1/health"
$env:FRONTEND_URL="https://frontend.example.com"
$env:SMOKE_RETRIES="12"
$env:SMOKE_RETRY_DELAY_MS="10000"
npm run test:smoke
```

## 4. Zadnji dokaz rezultata

Zadnji lokalni run izvrsen je 8. 6. 2026:

```text
npm run test:automation

Backend:
Test Files  43 passed (43)
Tests       703 passed (703)

Frontend:
Test Files  5 passed (5)
Tests       30 passed (30)

Playwright:
4 passed

Automation test suite finished successfully.
Exit code: 0
```

Informativna poruka nakon run-a: DB-backed testovi zahtijevaju Docker/MySQL stack (`npm run compose:up`). To ne obara testove i ne odnosi se na mockane route/integration testove niti Playwright browser automation.

## 5. Integracioni testovi

| ID | Fajl | Scenario |
| --- | --- | --- |
| QA-INT-001 | `final.integration.test.ts` | Coverage matrica provjerava da su sve glavne funkcionalne grupe pokrivene automatizovanim testovima |
| QA-INT-002 | `final.integration.test.ts` | Settings preferences kroz HTTP route: `PUT` i `GET /user-preferences` |
| QA-INT-003 | `final.integration.test.ts` | Feedback lifecycle: kreiranje, zabrana duplikata i koordinatorov pregled |
| QA-INT-004 | `final.integration.test.ts` | Blokiranje i deblokiranje korisnika uz audit |
| QA-INT-005 | `reopen.integration.test.ts` | Kreiranje zahtjeva za ponovno otvaranje |
| QA-INT-006 | `reopen.integration.test.ts` | Zabrana duplog aktivnog reopen zahtjeva |
| QA-INT-007 | `reopen.integration.test.ts` | Koordinator vidi listu reopen zahtjeva |
| QA-INT-008 | `reopen.integration.test.ts` | Prihvatanje zahtjeva vraca intervenciju u aktivni status |
| QA-INT-009 | `reopen.integration.test.ts` | Odbijanje zahtjeva zahtijeva komentar i salje obavijest |

Integration testovi ukljucuju Express route sloj, validacijski middleware, service sloj, mockanu Prismu, notifikacije, audit i error handling.

## 6. Playwright automation testovi

| ID | Scenario | Provjera |
| --- | --- | --- |
| UI-AUTO-001 | Login validacija | Browser otvara `/login`, klikne Login bez podataka i provjerava validaciju polja |
| UI-AUTO-002 | Settings | Browser otvara `/settings`, mocka preferences API i provjerava snimanje postavki |
| UI-AUTO-003 | Interventions | Browser otvara `/interventions`, prikazuje red i navigira na `/interventions/new` |
| UI-AUTO-004 | Core module browser smoke | Browser obilazi `/dashboard`, `/fault-reports`, `/reports`, `/assignments`, `/management` i `/blocked-users` |

Playwright koristi Chromium i `playwright.config.ts` automatski pokrece frontend preko `npm run dev:frontend`.

## 7. Rucno provjereni kljucni tokovi

| Tok | Status |
| --- | --- |
| Login i role-based navigacija | Pass |
| Prijava kvara i kreiranje intervencije | Pass |
| Dodjela servisera | Pass |
| Promjena statusa intervencije | Pass |
| Feedback nakon zavrsene intervencije | Pass |
| Settings i promjena jezika | Pass |
| Analitika feedbacka | Pass |
| Dostupnost servisera | Pass |
| Promjena termina intervencije | Pass |
| Baza znanja | Pass |
| Evidencija materijala | Pass |
| Eskalacije | Pass |
| Ponovno otvaranje intervencije | Pass |
| Evidencija dolaska servisera | Pass |
| Digitalna potvrda izvrsenja | Pass |
| Pauziranje intervencije | Pass |

## 8. Poznati testni propusti i ogranicenja

| Ogranicenje | Utjecaj |
| --- | --- |
| Playwright koristi mockane API odgovore za stabilne UI tokove | Ne testira svaki browser tok kroz zivu bazu |
| DB-backed testovi zahtijevaju Docker/MySQL stack | Za potpunu baznu provjeru pokrenuti `npm run compose:up` |
| Smoke test zahtijeva dostupne backend/frontend URL-ove | Bez URL-ova test ocekivano pada ili se preskace u CI |
| Email tokovi zavise od Gmail OAuth konfiguracije | Bez Gmail secretsa testira se in-app dio, ne stvarno slanje emaila |

## 9. QA zakljucak

Finalna predaja ima provjerljive testove za backend, frontend, integracione tokove, Playwright browser automation i deployment smoke provjeru. `npm run test:automation` je glavni dokaz za automatsko testiranje, a `release.yml` ga pokrece prije produkcijskog deploya.
