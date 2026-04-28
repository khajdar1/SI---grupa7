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

- **Datum:** 25.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** GitHub Copilot (LLM) / GPT-5.3-Codex
- **Svrha korištenja:** Implementacija PBI-041 (Inicijalna Prisma migracija za trenutne modele).
- **Kratak opis zadatka ili upita:** Usklađivanje Prisma schema i početne migracije sa trenutnim modelima baze, uklanjanje lokalnog čuvanja lozinke i dodavanje veze za eksterni identitet korisnika.
- **Šta je AI predložio ili generisao:**
    - Izmjene u `schema.prisma` za uklanjanje `passwordHash` i dodavanje `ExternalIdentity` modela.
    - Početnu migraciju SQL-a usklađenu sa trenutnim modelima.
    - Dopune Prisma dokumentacije za novi auth workflow bez lokalnih lozinki.
- **Šta je tim prihvatio:** Promjene schema i migracije, kao i dokumentacijska pojašnjenja za novi auth model.
- **Šta je tim izmijenio:** Prilagođen je naziv i struktura relacije eksternog identiteta kako bi ostala provider-agnostic, a auth model je ostao vođen backend logikom za role i permisije.
- **Šta je tim odbacio:** Lokalno čuvanje lozinki i bilo kakvo uvođenje password-based auth toka u ovom PBI-ju.
- **Rizici, problemi ili greške koje su uočene:** Rizik od nekonzistentnosti između schema.prisma, migracije i seed-a ako se ne ažuriraju zajedno; zbog toga je dokumentacija odmah sinhronizovana.
- **Ko je koristio alat:** Kerim Hajdar

---

- **Datum:** 25.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** GitHub Copilot (LLM) / GPT-5.3-Codex
- **Svrha korištenja:** Implementacija PBI-042 (Početni seed podaci za razvoj i demo).
- **Kratak opis zadatka ili upita:** Kreiranje determinističnog seed seta za razvoj i demo podatke, uključujući kompaniju, kategorije, SLA konfiguracije, korisnike i njihove eksterne identitete.
- **Šta je AI predložio ili generisao:**
    - `seed.ts` sa idempotentnim `upsert` logikama za demo podatke.
    - Seed testove koji provjeravaju broj zapisa, veze između entiteta i idempotentno pokretanje seed-a.
    - Usklađivanje seed podataka sa provider-first auth modelom i eksternim identitetima.
- **Šta je tim prihvatio:** Kompletan seed flow, testove i idempotentno ponašanje pri ponovnom pokretanju.
- **Šta je tim izmijenio:** Hard-coded numerički identifikatori za eksterni identitet su zamijenjeni prirodnim ključevima, a seed-only uloga je preimenovana u demo persona radi jasnijeg značenja.
- **Šta je tim odbacio:** Local password seed podaci i bilo kakvo dupliranje auth podataka izvan lokalnog profila i eksternog identiteta.
- **Rizici, problemi ili greške koje su uočene:** Seed mora ostati sinhronizovan sa schema.prisma i dokumentacijom; ako se promijeni auth model, seed i testovi moraju biti ažurirani zajedno.
- **Ko je koristio alat:** Kerim Hajdar
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

**Sprint broj:** Sprint 5

**Alat koji je korišten:** Claude (Anthropic)

**Svrha korištenja:** Arhitekturalna analiza i refaktorisanje SLA konfiguracijskog modula na osnovu code review povratne informacije.

**Kratak opis zadatka ili upita:** Tim je radio na poboljšanju kvalitete SLA modula kroz separaciju odgovornosti i standardizaciju grešaka. Zadaci su obuhvatili:

- Premještanje input validacije iz servisa u request layer
- Kreiranja tipiziranih audit event modela umjesto generičkog logiranja
- Simplifikaciju frontend state managementa
- Stroga validacija u validator funkcijama
- Error field mapping između backendu i frontendu

**Šta je AI predložio ili generisao:**

1. **Backend refaktorisanje (sla.service.ts):**
   - Uklanjanje duplog validiranja iz servisa (array format, field types, priority enums, value ranges)
   - Zadržavanje samo business invarianti (duplicate priority detection)
   - Uklanjanje `ValidationError` klase (prebačeno u request layer)
   - Fokus na core business logic: audit logging, data operations

2. **Audit Service typing (audit.service.ts):**
   - Kreiranja `SlaConfigurationChangeEvent` interfejsa koji ekstenduje `AuditLogEntry`
   - Uklanjanje `Record<string, any>` tipova u favour specifičnih struktura
   - Dokumentacija pattern-a za buduće event tipove

3. **Frontend state management (page.tsx):**
   - Promjena `formData` tipa sa `Record<string, string | number>` na `Record<string, string>`
   - Konverzija brojeva u stringove samo na submit vremenu
   - `mapBackendErrors()` helper funkcija za mapiranje backend error ključeva na frontend polja

4. **Validator striktnost (sla.validators.ts):**
   - `validateNoDuplicatePriorities()` sada vraća `valid: false` za non-array input umjesto молчећег success

**Šta je tim prihvatio:**

- Kompletna refaktorisanja separacije validacije u request layer
- Tipiziranje audit events umjesto generičkog logiranja
- Frontend state management sa stringovima umjesto mješovitih tipova
- Strika validacija u validator funkcijama

**Šta je tim izmijenio:**

- User je undid route.ts izmjene jer nije bilo spreman za kompletan refactor u tom momentu
- Frontend validator dodano prikazivanje priority labela u error porukama (npr. "Hitan: value cannot be empty")
- Dodan test za duplicate priority business invariant u sla.service.test.ts

**Šta je tim odbacio:**

- N/A

**Rizici, problemi ili greške koje su uočene:**

- Git merge konflikt između lokalne refaktorisane verzije i remote verzije sa starim kodom — riješeno prihvatanjem lokalne verzije
- Undoing route.ts izmjena ostavilo je logiku za `ValidationError` koja više nije potrebna — evidentirana kao tehnički dug
- Frontend error mapping koristi heuristiku (traži priority u error poruci) što može biti fragilan ako se poruke promijene


**Ko je koristio alat:** Lamija Bojić

---

- **Datum:** 27.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** Google Gemini (Antigravity AI)
- **Svrha korištenja:** Implementacija PBI-030 (Kategorije i tipovi kvarova) i audit logging sistema.
- **Kratak opis zadatka ili upita:** Razvoj backend i frontend komponenti za upravljanje kategorijama kvarova. Zadatak je obuhvatio kreiranje Prisma modela, CRUD API ruta, admin panela za upravljanje kategorijama, te integraciju u formu za prijavu kvara.
- **Šta je AI predložio ili generisao:**
    - Modifikaciju `schema.prisma` dodavanjem modela `Category` sa audit poljima (`updatedById`).
    - Backend module `categories.service.ts` i `categories.route.ts` za kompletan CRUD ciklus.
    - Frontend stranicu `/admin/categories/page.tsx` za admin upravljanje (aktivacija/deaktivacija).
    - Rješenja za sinhronizaciju baze podataka (`prisma db push`) nakon problema sa shadow database-om.
- **Šta je tim prihvatio:**
    - Kompletnu šemu baze podataka i relacije sa modelima `FaultReport` i `Intervention`.
    - Logiku da se kategorije ne brišu trajno (soft-deactivate) radi očuvanja integriteta starih podataka.
    - Implementaciju audit logova koji bilježe ko je i kada zadnji put izmijenio kategoriju.
- **Šta je tim izmijenio:**
    - UI komponente u admin panelu su prilagođene da koriste zajedničke stilove aplikacije (vibrant dark mode).
    - Dodana je dodatna validacija na backendu za provjeru jedinstvenosti naziva kategorije prije upisa.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** 
    - Inicijalni problem sa Prisma migracijama zbog nedostatka permisija na shadow bazi (riješeno kroz manualnu sinhronizaciju).
    - Rizik od nekonzistentnosti podataka ako bi se kategorija obrisala dok postoje aktivne intervencije (spriječeno implementacijom `active` statusa).
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 27.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** Google Gemini (LLM)
- **Svrha korištenja:** Implementacija session managementa, zaštita ruta (Middleware) i razvoj logike za Login/Logout.
- **Kratak opis zadatka ili upita:** Razvoj kompletnog protoka za prijavu i odjavu korisnika uz integraciju sa Keycloak-om, prelazak sa LocalStorage na Cookies radi server-side validacije u Middleware-u.
- **Šta je AI predložio ili generisao:**
    - **Login Logika:** Modifikacija `loginController` na backendu da vraća `refreshToken`. Na frontendu, ažuriranje `useLogin` hook-a za simultano upravljanje tokenima.
    - **Logout Logika:** Implementacija potpunog prekida sesije pozivom Keycloak `openid-connect/logout` endpointa uz slanje `refresh_token`-a, te čišćenje svih lokalnih podataka (cookies i localStorage).
    - **Session Management:** Uvođenje `js-cookie` biblioteke i konfiguracija `middleware.ts` za provjeru autentifikacije na nivou servera.
- **Šta je tim prihvatio:** Arhitekturu sesija (Cookies za Middleware, LocalStorage za UI), te backend logiku za revokaciju Keycloak tokena.
- **Šta je tim izmijenio:** Dodana je `/logout` ruta u listu javnih ruta (`PUBLIC_ROUTES`) unutar middleware-a kako bi se izbjegao beskonačni redirect tokom odjave.
- **Rizici, problemi ili greške koje su uočene:** Inicijalno oslanjanje isključivo na `localStorage` blokiralo je rad Next.js Middleware-a jer server nema pristup klijentskom storageu; problem riješen uvođenjem cookija.
- **Ko je koristio alat:** Iman Šehić

---

