# AI Usage Log

- **Datum:** 26.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** Google Gemini (LLM)
- **Svrha korištenja:** Debugging Keycloak integracije i modifikacija autentifikacijske logike.
- **Kratak opis zadatka ili upita:** Ispravka greške pri registraciji korisnika. Zadatak je obuhvatio rješavanje "Table User does not exist" greške u bazi i popravku "403 Forbidden" greške u komunikaciji sa Keycloak-om.
- **Šta je AI predložio ili generisao:**
    - Modifikaciju `auth.service.ts` (dodavanje detaljnih logova).
    - Komande za Prisma sinhronizaciju baze (`prisma db push`) unutar Docker kontejnera.
    - Uputstvo za konfiguraciju Keycloak klijenta (dodjela `manage-users` role kroz Service Account Roles).
- **Šta je tim prihvatio:** Sve predložene izmjene koda u backendu, Prisma komande za bazu i korake za Keycloak administraciju.
- **Šta je tim izmijenio:** Prilagođen je put do "Filter by clients" opcije u Keycloak interfejsu verzije 26.6.1.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Inicijalna greška 403 u Keycloak-u bila je uzrokovana nedostatkom permisija za klijenta; rizik od nekonzistentnosti podataka između Keycloak-a i lokalne baze ako Prisma upis ne uspije (riješeno dodavanjem logova).
- **Ko je koristio alat:** Iman Šehić

---

- **Datum:** 26.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Ispravka import putanja, dizajn i implementacija Keycloak register integracije, debugging frontend grešaka.
- **Kratak opis zadatka ili upita:** Tim je radio na implementaciji registracije korisnika kroz vlastiti UI koji koristi Keycloak kao identity provider. Zadaci su obuhvatili: ispravku TypeScript import putanja između modula, refaktorisanje `auth.service.ts` da koristi Keycloak Admin REST API umjesto lokalnog čuvanja lozinki, dijagnozu i ispravku `TypeError: s.map is not a function` greške na register stranici, uputstvo za pokretanje i konfiguraciju Keycloaka u Dockeru, te finalnu provjeru ispravnosti svih fajlova.
- **Šta je AI predložio ili generisao:**
    - Kompletnu refaktorisanu verziju `auth.service.ts`: uklanjanje `password` i `role` iz lokalne baze, dodavanje `getKeycloakAdminToken()` i `createKeycloakUser()` funkcija koje komuniciraju s Keycloak Admin REST API-jem, kreiranje `ExternalIdentity` zapisa uz `prisma.user.create`, novi `KeycloakError` class.
    - Dijagnozu uzroka `s.map is not a function` greške — `companiesRouter` vraćao mock JSON objekat umjesto arraya — i ispravku s `prisma.company.findMany()` te type guardom `Array.isArray(res.data) ? res.data : []` u `useRegister.ts`.
    - Aktiviranje Keycloak servisa u `docker-compose.yml`, dodavanje env varijabli za backend (`KEYCLOAK_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`).
    - Preporuku da se doda `depends_on: keycloak` u backend servis u `docker-compose.yml`.
    - Identifikaciju tehničkih dugova: rollback strategija za Keycloak orphan korisnike, pregled skeleton ruta koje vraćaju mock podatke, fallback vrijednost za `KEYCLOAK_CLIENT_SECRET`.
- **Šta je tim prihvatio:**
    - Kompletnu Keycloak integraciju u `auth.service.ts`.
    - Type guard u `useRegister.ts`.
    - Docker i Keycloak konfiguraciju.
    - `depends_on: keycloak` u docker-composeu.
- **Šta je tim izmijenio:**
    - Dodan detaljni `console.log` logging kroz `auth.service.ts` za lakše debugiranje.
    - `companyId` postavljen kao opcionalan umjesto obaveznog.
    - Kombinovana provjera duplikata u jednom `findFirst` umjesto dva odvojena upita.
    - Naziv realma promijenjen u `service-system` umjesto predloženog `servisni-sistem`.
    - Tim je naknadno odlučio ukloniti `companyId` s register forme potpuno.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:**
    - Mock podaci u skeleton rutama identificirani kao sistemski rizik — sve skeleton rute trebaju biti pregledane prije produkcije.
    - Rollback strategija za Keycloak orphan korisnike nije implementirana u ovoj fazi — evidentirana kao tehnički dug.
    - Bez `:-placeholder` fallbacka za `KEYCLOAK_CLIENT_SECRET`, backend pada kod ostalih članova tima koji nemaju Keycloak lokalno pokrenut.
- **Ko je koristio alat:** Iman Šehić

---