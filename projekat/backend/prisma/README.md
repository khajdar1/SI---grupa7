# Prisma workflow

Ovaj folder sadrži Prisma schema, migracije i seed za backend bazu.

Schema model ne čuva lozinke. Korisnik ima lokalni profil u aplikaciji, a prvi eksterni identitetski provajder u ovoj fazi je Microsoft Entra.

Prisma CLI koristi `../prisma.config.ts` i očekuje `DATABASE_URL` iz `.env` konfiguracije (npr. `projekat/.env` prema `projekat/.env.example`).

## Komande

1. `npm run prisma:generate --workspace backend` nakon svake izmjene `schema.prisma`.
2. `npm run prisma:migrate --workspace backend` za kreiranje i primjenu migracija nad lokalnom bazom.
3. `npm run prisma:seed --workspace backend` nakon migracije, za punjenje razvojnih i demo podataka.

## Seed ponašanje

Seed koristi `upsert` operacije po prirodnim ključevima, tako da se može pokrenuti više puta bez dupliranja kompanije, kategorija, SLA konfiguracija, demo korisnika ili njihovih eksternih identiteta. Za `ExternalIdentity` koristi se kompozitni ključ `provider + providerSubject`. Demo korisnici se povezuju sa Microsoft Entra identitetom.
