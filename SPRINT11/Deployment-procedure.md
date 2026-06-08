# Deployment procedura - finalna predaja

## 1. Aplikacija

**Naziv aplikacije:** Sistem za upravljanje servisnim intervencijama

Aplikacija je web sistem za prijavu kvarova, planiranje servisnih intervencija, dodjelu servisera, izvjestaje, feedback, notifikacije, administraciju i menadzment preglede.

## 2. Arhitektura i tehnologije

| Dio sistema | Lokacija | Tehnologije / servis |
| --- | --- | --- |
| Frontend | `projekat/frontend` | Next.js 15, React, TypeScript, Cloudflare Pages |
| Backend API | `projekat/backend` | Node.js 20, Express, TypeScript, Prisma, Railway |
| Baza | Railway MySQL ili Docker MySQL lokalno | MySQL 8 |
| Identitet | Keycloak lokalno / konfigurisan servis | Keycloak 26.6.1 |
| Lokalni full stack | `projekat/docker-compose.yml` | Docker Compose |
| Release pipeline | `.github/workflows/release.yml` | GitHub Actions + Cloudflare Pages + Railway GitHub integration |

## 3. Potrebni alati

| Alat | Verzija / napomena |
| --- | --- |
| Node.js | 20.x |
| npm | Verzija iz Node 20 |
| Git | Za checkout i deployment trigger |
| Docker + Docker Compose v2 | Za lokalni full-stack run |
| Playwright Chromium | Instalira se kroz `npx playwright install chromium` |

## 4. Environment varijable

Lokalni primjer je `projekat/.env.example`; za lokalno pokretanje kopirati u `projekat/.env`.

| Varijabla | Svrha |
| --- | --- |
| `DATABASE_URL` | Prisma/MySQL konekcija |
| `JWT_SECRET` | Potpisivanje JWT tokena |
| `PORT` | Backend port, default `4000` |
| `CORS_ORIGIN` | Dozvoljeni frontend origin |
| `SOCKET_CORS_ORIGIN` | Dozvoljeni Socket.IO origin |
| `NEXT_PUBLIC_API_BASE_URL` | API URL koji se ugradjuje u frontend |
| `NEXT_PUBLIC_SOCKET_URL` | Socket URL koji se ugradjuje u frontend |
| `KEYCLOAK_URL` | URL Keycloak servera |
| `KEYCLOAK_REALM` | Keycloak realm |
| `KEYCLOAK_CLIENT_ID` | Backend service client |
| `KEYCLOAK_CLIENT_SECRET` | Secret za Keycloak service client |
| `RESET_PASSWORD_BASE_URL` | Frontend URL za reset lozinke |
| `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` | Opcionalno, email notifikacije |
| `GMAIL_FROM_EMAIL`, `GMAIL_FROM_NAME` | Opcionalno, email posiljalac |

Za GitHub Actions/Cloudflare/Railway dodatno se koriste:

| Secret / varijabla | Gdje | Svrha |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets | Deploy frontenda na Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub Secrets | Cloudflare account |
| `CLOUDFLARE_PROJECT_NAME` | GitHub Secrets | Cloudflare Pages projekt |
| `BACKEND_HEALTH_URL` | GitHub Secrets | Post-deployment smoke test |
| `FRONTEND_URL` | GitHub Secrets | Post-deployment smoke test |
| Railway environment variables | Railway service | Backend runtime varijable, posebno `DATABASE_URL`, `JWT_SECRET`, Keycloak i CORS vrijednosti |

## 5. Lokalno pokretanje full stacka

```powershell
cd projekat
npm ci
npm run prisma:generate --workspace backend
npm run compose:up
```

Servisi:

| Servis | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend health | `http://localhost:4000/api/v1/health` |
| Keycloak | `http://localhost:8080` |
| MySQL | `localhost:3307` |

Za gasenje:

```powershell
cd projekat
npm run compose:down
```

## 6. Lokalno pokretanje backend-a

Potrebno je da MySQL i Keycloak rade lokalno ili kroz Docker Compose.

```powershell
cd projekat
npm ci
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend
npm run prisma:seed --workspace backend
npm run dev:backend
```

Backend je dostupan na:

```text
http://localhost:4000/api/v1
```

## 7. Lokalno pokretanje frontend-a

Backend mora biti dostupan na `NEXT_PUBLIC_API_BASE_URL`.

```powershell
cd projekat
npm ci
npm run dev:frontend
```

Frontend je dostupan na:

```text
http://localhost:3000
```

## 8. Baza, migracije i seed

Lokalna baza se pokrece kroz Docker Compose. Migracije:

```powershell
cd projekat
npm run prisma:migrate --workspace backend
```

Produkcijske migracije:

```powershell
cd projekat/backend
npx prisma migrate deploy --schema prisma/schema.prisma
```

Backend start skripta takodjer pokrece `prisma migrate deploy`, tako da Railway deployment primjenjuje migracije pri startu backend servisa ako je `DATABASE_URL` ispravno postavljen.

Seed:

```powershell
cd projekat
npm run prisma:seed --workspace backend
npm run prisma:seed:escalations --workspace backend
```

## 9. Testovi

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
npm run test:smoke
```

## 10. Produkcijski deployment

Produkcijski deployment ide kroz release granu:

```text
push na release/*
```

Na push se desavaju dvije stvari:

1. `.github/workflows/release.yml` pokrece build, typecheck, automated testove, Playwright testove, packaging i Cloudflare Pages deploy frontenda.
2. Railway GitHub integracija pokrece deploy backend servisa iz iste release grane.

Frontend se povezuje na Railway backend kroz `NEXT_PUBLIC_API_BASE_URL`, a Socket.IO kroz `NEXT_PUBLIC_SOCKET_URL`.

## 11. Linkovi na deployment

Upisati stvarne produkcijske URL-ove nakon potvrde deploya:

| Servis | URL |
| --- | --- |
| Frontend / Cloudflare Pages | TBD |
| Backend / Railway health | TBD |
| Keycloak/admin | Interno ili zasticeno |

## 12. Poznata ogranicenja

| Ogranicenje | Utjecaj |
| --- | --- |
| Produkcijski URL nije upisan dok tim ne potvrdi finalni javni link | Evaluator moze provjeriti lokalno i kroz GitHub/Railway/Cloudflare konfiguraciju |
| Railway deploy je platform integration, ne poseban Railway CLI step u repo-u | Deployment se pokrece preko GitHub integracije na push u release granu |
| Email notifikacije zavise od Gmail OAuth varijabli | Bez njih in-app funkcionalnosti rade, ali email slanje moze biti ograniceno |
| Keycloak produkcijski secret-i moraju biti pravilno postavljeni | Login/role tokovi zavise od identity konfiguracije |

## 13. Najcesci problemi

| Problem | Rjesenje |
| --- | --- |
| Frontend zove localhost u produkciji | Provjeriti `NEXT_PUBLIC_API_BASE_URL` i `NEXT_PUBLIC_SOCKET_URL` u GitHub/Cloudflare env |
| Backend ne moze bazu | Provjeriti `DATABASE_URL` u Railway environment varijablama |
| Prisma client nema nova polja | Pokrenuti `npm run prisma:generate --workspace backend` |
| Migracije nisu primijenjene | Provjeriti backend logove i `prisma migrate deploy` |
| Smoke test pada | Provjeriti `BACKEND_HEALTH_URL`, `FRONTEND_URL` i dostupnost javnih URL-ova |
