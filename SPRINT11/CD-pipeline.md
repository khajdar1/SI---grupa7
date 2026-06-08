# CD pipeline - finalna predaja

## 1. Sluzbeni release pipeline

Sluzbeni pipeline za produkcijski release nalazi se u:

```text
.github/workflows/release.yml
```

Ovaj pipeline se pokrece na:

| Trigger | Namjena |
| --- | --- |
| push na `release/*` | Produkcijski release |
| push na `master` | Stabilni build/deploy |

## 2. Sta se deploya

| Komponenta | Nacin deploymenta |
| --- | --- |
| Frontend | GitHub Actions deploy na Cloudflare Pages kroz Wrangler |
| Backend API | Railway GitHub integration na isti release push |
| Baza | Railway MySQL / produkcijska MySQL konekcija kroz `DATABASE_URL` |
| Migracije | Backend start pokrece `prisma migrate deploy` |

## 3. Koraci u `release.yml`

1. Checkout repozitorija.
2. Setup Node.js 20.
3. `npm ci`.
4. Prisma client generation.
5. Instalacija Playwright Chromium browsera.
6. `npm run test:automation`.
7. Build i typecheck root projekta.
8. Build i typecheck backend workspace-a.
9. Build i typecheck frontend workspace-a.
10. Cloudflare Pages output kroz `npx @cloudflare/next-on-pages`.
11. Packaging backend i frontend artefakata.
12. Upload artefakata u GitHub Actions.
13. Deploy frontenda na Cloudflare Pages kroz `wrangler pages deploy`.
14. Opcionalni smoke test ako su postavljeni `BACKEND_HEALTH_URL` i `FRONTEND_URL`.

## 4. Railway dio deploymenta

Railway je povezan direktno sa GitHub repozitorijem. Na push u `release/*` Railway pokrece backend deployment prema svojoj platform konfiguraciji.

Za backend servis u Railway-u treba biti postavljeno:

| Stavka | Vrijednost / napomena |
| --- | --- |
| Root direktorij | `projekat` |
| Backend build | `npm ci && npm run build --workspace backend` ili Docker/Nixpacks ekvivalent |
| Backend start | `npm run start --workspace backend` |
| `DATABASE_URL` | Railway MySQL konekcija |
| `JWT_SECRET` | Produkcijski secret |
| `CORS_ORIGIN` | Cloudflare frontend URL |
| `SOCKET_CORS_ORIGIN` | Cloudflare frontend URL |
| Keycloak varijable | `KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET` |

Backend `start` skripta primjenjuje migracije prije pokretanja servera.

## 5. Cloudflare dio deploymenta

Cloudflare Pages deploy se izvrsava u `release.yml` kroz:

```text
npx wrangler@3 pages deploy ./frontend/.vercel/output/static
```

Potrebni GitHub Secrets:

| Secret | Svrha |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Autorizacija deploya |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account |
| `CLOUDFLARE_PROJECT_NAME` | Pages projekt |
| `NEXT_PUBLIC_API_BASE_URL` | Railway backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Railway backend Socket.IO URL |

Trenutni frontend deployment URL:

```text
https://sigrupa7.pages.dev
```

Trenutni backend health URL:

```text
https://si-grupa7-production.up.railway.app/api/v1/health
```

## 6. Smoke provjera

Ako su postavljeni:

```text
BACKEND_HEALTH_URL
FRONTEND_URL
```

pipeline pokrece:

```powershell
npm run test:smoke
```

Smoke test provjerava backend health endpoint i frontend stranicu. U release pipeline-u koristi retry postavke (`SMOKE_RETRIES=12`, `SMOKE_RETRY_DELAY_MS=10000`) da Cloudflare/Railway imaju vremena da zavrse propagaciju nakon deploya.

## 7. Rizici

| Rizik | Kontrola |
| --- | --- |
| Railway deploy kao platform integration nije direktno definisan u YAML-u | Dokumentovano je da Railway prati release granu i koje env varijable mora imati |
| Backend bi se mogao deployati na Railway prije zavrsetka GitHub testova | U Railway postavkama preporuceno je koristiti release granu i provjeriti branch/check konfiguraciju |
| Smoke test se preskace ako URL secrets nisu postavljeni | Postaviti `BACKEND_HEALTH_URL` i `FRONTEND_URL` za potpunu post-deploy provjeru |
