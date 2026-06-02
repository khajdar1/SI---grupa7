# AI Usage Log

- **Datum:** 29.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** GitHub Copilot (LLM) / GPT-5.2-Codex
- **Svrha korištenja:** Implementacija PBI-040 (CI/CD pipeline za automatsku provjeru i isporuku) i azuriranje CI/CD dokumentacije.
- **Kratak opis zadatka ili upita:** Postavljanje GitHub Actions workflowa za PR provjere na `develop`, release workflow za `release/1.0` i `master`, izrada verzionisanih artefakata, deploy frontenda na Cloudflare Pages i uskladjivanje dokumentacije sa novim targetima.
- **Šta je AI predložio ili generisao:**
  - `ci.yml` workflow za build i typecheck (root, backend, frontend) na PR prema `develop`.
  - `release.yml` workflow za build, typecheck, verzionisane artefakte i Cloudflare Pages deploy.
  - Dokumentacijsko azuriranje CI/CD, deploy topologije i otvorenih pitanja u tehničkom setup dokumentu.
- **Šta je tim prihvatio:** Workflow fajlove i dokumentacijske izmjene za CI/CD i deploy.
- **Šta je tim izmijenio:** Prihvacen je fallback verzije na `build-<shortsha>` kada commit nema git tag.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Produkcijske vrijednosti za `NEXT_PUBLIC_API_BASE_URL` i `NEXT_PUBLIC_SOCKET_URL` moraju biti postavljene u Cloudflare/Railway okruzenju da frontend ne ostane vezan za lokalni host.
- **Ko je koristio alat:** Kerim Hajdar

---

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
- **Datum:** 29.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** GitHub Copilot
- **Svrha korištenja:** Implementacija PBI-003 (Prijava kvara) i priprema prateće AI usage evidencije.
- **Kratak opis zadatka ili upita:** Zadatak je obuhvatio razvoj backend i frontend podrške za prijavu kvara, prilagodbu validacije i autorizacije, te evidentiranje izvršenih izmjena i verifikacija u skladu s definicijom AI usage loga.
- **Šta je AI predložio ili generisao:**
  - Izmjenu validacije i payload buildera za prijavu kvara.
  - Ažuriranje poslovnih pravila za regularne i emergency prijave.
  - Frontend prilagodbe za goste i autentifikovane korisnike.
  - Prijedlog testova i komandi za verifikaciju backend i frontend promjena.
- **Šta je tim prihvatio:** Sve izmjene koje su direktno podržale PBI-003 i prateću verifikaciju.
- **Šta je tim izmijenio:** Fajl sa zasebnim PBI logom je sadržajno uklopljen u glavni AI usage log.
- **Šta je tim odbacio:** Razvojne i testne improvizacije koje nisu bile dio produkcijskog ponašanja.
- **Rizici, problemi ili greške koje su uočene:** Potreba za naknadnim usklađivanjem QA skripti i integracija koje su zavisile od starog oblika payloada; preporuka za dodatni E2E test sa stvarnim auth providerom prije produkcije.
- **Ko je koristio alat:** Ismail Mujanović

---

- **Datum:** 29.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** GitHub Copilot
- **Svrha korištenja:** Implementacija PBI-032 (Admin upravljanje kategorijama kvarova) i fina UI prilagodba admin panela.
- **Kratak opis zadatka ili upita:** Zadatak je obuhvatio admin pregled i upravljanje kategorijama kvarova, uključujući kreiranje, uređivanje, deaktivaciju i reaktivaciju kategorija, prikaz audit podataka, te dodatne UI prilagodbe za scrollable listu i kompaktniji create panel.
- **Šta je AI predložio ili generisao:**
  - Backend proširenje kategorija s audit poljima i validacijom aktivnog stanja.
  - Slanje admin identiteta kroz zahtjeve radi evidencije izmjena.
  - Frontend prikaz statusa, datuma kreiranja i ko je posljednji mijenjao kategoriju.
  - UI smanjenje visine novog category panela i scrollable lista svih kategorija.
- **Šta je tim prihvatio:** Sve izmjene koje direktno podržavaju PBI-032 i traženo ponašanje admin panela.
- **Šta je tim izmijenio:** Dodatno je ograničeno horizontalno razvlačenje description textarea polja kako ne bi izlazilo iz panela.
- **Šta je tim odbacio:** Preširoke layout izmjene i bilo kakvo rastavljanje postojeće strukture admin stranice koje nisu bile potrebne za ovaj PBI.
- **Rizici, problemi ili greške koje su uočene:** Client-side prenos admin imena je privremeno rješenje dok backend ne dobije server-side user context; zbog toga je označen kao sigurnosni rizik za budući hardening.
- **Ko je koristio alat:** Ismail Mujanović

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

- **Datum:** 27.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Arhitekturalna analiza i refaktorisanje SLA konfiguracijskog modula na osnovu code review povratne informacije.
- **Kratak opis zadatka ili upita:** Tim je radio na poboljšanju kvalitete SLA modula kroz separaciju odgovornosti i standardizaciju grešaka. Zadatak je obuhvatio premještanje input validacije iz servisa u request layer, kreiranje tipiziranih audit event modela umjesto generičkog logiranja, simplifikaciju frontend state managementa, strožu validaciju u validator funkcijama i mapiranje error fieldova između backenda i frontenda.
- **Šta je AI predložio ili generisao:**
  - Refaktorisanje `sla.service.ts` uklanjanjem duplog validiranja iz servisa i zadržavanjem samo business invarianti.
  - Uvođenje tipiziranih audit event modela u `audit.service.ts` umjesto generičkih `Record<string, any>` struktura.
  - Pojednostavljenje frontend state managementa u `page.tsx` korištenjem string vrijednosti i mapiranja backend grešaka na frontend polja.
  - Strožiju validaciju u `sla.validators.ts`, uključujući ispravno odbijanje non-array inputa.
- **Šta je tim prihvatio:** Separaciju validacije u request layer, tipizirane audit evente, pojednostavljen frontend state management i strožu validaciju u validator funkcijama.
- **Šta je tim izmijenio:** Poništene su izmjene u `route.ts` jer kompletan refactor u tom trenutku nije bio spreman; dodat je prikaz priority labela u frontend error porukama i test za duplicate priority business invariant u `sla.service.test.ts`.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Uočen je git merge konflikt između lokalne refaktorisane verzije i remote verzije sa starijim kodom; poništavanje `route.ts` izmjena ostavilo je logiku za `ValidationError` kao tehnički dug; frontend error mapping koristi heuristiku koja može biti fragilna ako se poruke promijene.
- **Ko je koristio alat:** Lamija Bojić

---

- **Datum:** 29.04.2026.
- **Sprint broj:** Sprint 5
- **Alat koji je korišten:** GitHub Copilot (LLM)
- **Svrha korištenja:** Testiranje i provjera PBI-024 (Validacija unosa podataka).
- **Kratak opis zadatka ili upita:** Provjera ispravnosti klijentske i serverske validacije unosa, testiranje ponašanja obaveznih polja, prikaza poruka greške i reakcije sistema na neispravne unose.
- **Šta je AI predložio ili generisao:**
  - Prijedloge test scenarija za obavezna i neispravna polja.
  - Primjere unosa za provjeru validacije na klijentskoj i serverskoj strani.
  - Smjernice za provjeru da se greške pravilno mapiraju i prikazuju korisniku.
- **Šta je tim prihvatio:** Predložene test scenarije i provjere validacije kroz frontend i backend tokove.
- **Šta je tim izmijenio:** Test slučajevi su prilagođeni konkretnim formama i pravilima unosa unutar aplikacije.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Postoji rizik da dio validacije ostane nedovoljno pokriven ako se promjene na backendu ili frontendu ne testiraju zajedno; potrebno je održavati usklađenost poruka greške i validacionih pravila.
- **Ko je koristio alat:** Lamija Bojić

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

**Datum:** 29.04.2026.  
**Sprint broj:** Sprint 5  
**Alat koji je korišten:** GPT-4 / Codex  
**Svrha korištenja:** Implementacija PBI-044 (Centralizovano logovanje i health nadzor) i PBI-045 (Globalni exception handler i standardizacija API grešaka).  
**Kratak opis zadatka ili upita:**  
Implementacija sistema za centralizovano logovanje, health nadzor, te globalni handler za greške sa standardizovanim API odgovorima u backend aplikaciji.

- Implementacija health endpointa za provjeru aplikacije i baze podataka.
- Dodavanje middlewarea za logovanje svakog HTTP zahtjeva.
- Postavljanje globalnog handlera za greške sa standardizovanim odgovorima na greške.
- Konfiguracija logova za startup i greške u aplikaciji.

**Šta je AI predložio ili generisao:**

- Generisao je logger za aplikaciju (`src/shared/logger.ts`) koji koristi strukturirani format logova sa timestamp-om, levelom, i porukama.
- Predložio je middleware za logovanje svakog HTTP zahtjeva (`src/middleware/request-logger.middleware.ts`).
- Predložio implementaciju health endpointa (`src/routes/health.route.ts`) koji provjerava aplikaciju i status baze.
- Predložio rješenje za globalni exception handler sa standardizovanim formatom odgovora u slučaju greške.

**Šta je tim prihvatio:**

- Prihvaćene su sve implementacije vezane za logging i health provjeru, uključujući kod za logovanje HTTP zahtjeva i implementaciju health endpointa.
- Prihvaćen je globalni error handler za sve greške koje se mogu desiti u aplikaciji.
- Tim je prihvatio predloženi način za logovanje startup događaja i grešaka prilikom povezivanja sa bazom.

**Šta je tim izmijenio:**

- Promijenjeni su logovi tako da uključuju više informacija o greškama koje se javljaju tokom startovanja aplikacije i povezivanja sa bazom.

**Šta je tim odbacio:**

- Odbacili smo implementaciju naprednog health provjera (sposobnost praćenja svih servisa), jer su bili fokusirani na provjeru samo aplikacije i baze podataka za ovu fazu.
- Odbačeno je logovanje svih uspješnih HTTP odgovora, jer je odlučeno da logujemo samo greške ili ključne događaje (kao što je start aplikacije).

**Rizici, problemi ili greške koje su uočene:**

- Moguće dupliciranje logova u nekim slučajevima pri bržem pokretanju aplikacije (koje uključuje bazu) gdje health endpoint može izazvati brzo timeout ka bazi.
- Postoji rizik da neki logovi sadrže osjetljive podatke ako ne bude pravilno podešen **logging level** za produkciju.

**Ko je koristio alat:** Lejla Gičević

---

**Datum:** 27.04.2026.

**Sprint broj:** Sprint 5

**Alat koji je korišten:** ChatGPT (OpenAI), Codex (VS Code)

**Svrha korištenja:**
Implementacija reusable authentication i authorization middleware-a, debugging TypeScript grešaka i konfiguracije backend okruženja.

**Kratak opis zadatka ili upita:**
Razvoj middleware-a za provjeru autentifikacije i role-based pristupa (RBAC) u Express backendu. Zadatak je obuhvatio kreiranje authenticate i authorizeRoles funkcija, povezivanje middleware-a sa rutama (auth i users), te testiranje različitih scenarija pristupa (401, 403, 200).

**Šta je AI predložio ili generisao:**

- Strukturu Express middleware-a za autentifikaciju i autorizaciju
- Implementaciju authorizeRoles funkcije sa podrškom za više uloga
- Rješenja za TypeScript greške (RequestHandler, tipovi za req.user)
- Upute za testiranje ruta putem Postman-a (401/403/200 scenariji)
- Pomoć pri konfiguraciji .env i Prisma okruženja

**Šta je tim prihvatio:**

- Osnovnu strukturu middleware-a (authenticate, authorizeRoles)
- Način integracije middleware-a u backend rute
- Predložene test scenarije za validaciju funkcionalnosti

**Šta je tim izmijenio:**

- Prilagođena authorizeRoles funkcija za provjeru više uloga
- Integracija middleware-a u više modula (auth, users) radi reusability
- Dodan mock korisnik za potrebe testiranja (privremeno rješenje)

**Šta je tim odbacio:**
/

**Rizici, problemi ili greške koje su uočene:**

- Problemi sa env konfiguracijom (DATABASE_URL nije bio prepoznat)
- TypeScript greške vezane za tipove (req, res, next)
- Potencijalni rizik jer autentifikacija trenutno koristi mock podatke umjesto stvarnog JWT mehanizma

**Ko je koristio alat:** Dalila Tanković

---

**Datum:** 28.04.2026.

**Sprint broj:** Sprint 5

**Alat koji je korišten:** ChatGPT (OpenAI)

**Svrha korištenja:**
Implementacija centralizovanog validation middleware-a i DTO/schema sloja koristeći Zod.

**Kratak opis zadatka ili upita:**
Razvoj reusable middleware-a za validaciju ulaznih zahtjeva u Express backendu. Zadatak je obuhvatio definisanje Zod schema za validaciju (register, login), integraciju middleware-a u rute, te standardizaciju formata grešaka za neispravne requeste.

**Šta je AI predložio ili generisao:**

- Strukturu `validate` middleware-a koristeći Zod `safeParse`
- Korištenje `flatten().fieldErrors` za frontend-friendly error format
- Primjere Zod schema za register i login
- Način integracije middleware-a u rute bez dupliciranja logike

**Šta je tim prihvatio:**

- Centralizovani pristup validaciji putem middleware-a
- Korištenje Zod biblioteke za schema definicije
- Standardizovan format grešaka za sve validacione slučajeve

**Šta je tim izmijenio:**

- Prilagođen format error response-a (dodano `statusCode`)
- Integracija middleware-a u postojeće auth rute umjesto test handlera

**Šta je tim odbacio:**
/

**Rizici, problemi ili greške koje su uočene:**

- Moguće da neki postojeći endpointi još nisu migrirani na novi validation sloj
- Potreba da frontend pravilno mapira field-level greške

**Ko je koristio alat:** Dalila Tanković

---

**Datum:** 28.04.2026.

**Sprint broj:** Sprint 5

**Alat koji je korišten:** ChatGPT (OpenAI)

**Svrha korištenja:**
Implementacija autentifikacije i autorizacije koristeći Keycloak kao eksterni identity provider.

**Kratak opis zadatka ili upita:**
Razvoj middleware-a za autentifikaciju i role-based autorizaciju (RBAC) koristeći Keycloak access token. Zadatak je obuhvatio dekodiranje JWT tokena, ekstrakciju korisničkih rola, integraciju middleware-a u rute, te rješavanje merge konflikata sa postojećim kodom.

**Šta je AI predložio ili generisao:**

- Strukturu auth middleware-a za parsiranje JWT tokena
- Način ekstrakcije rola iz Keycloak access tokena

**Šta je tim prihvatio:**

- Korištenje Keycloak-a kao eksternog identity provider-a
- Middleware za autentifikaciju i role-based autorizaciju
- Integraciju middleware-a u postojeće rute

**Šta je tim izmijenio:**

- Promijenjen pristup autentifikaciji sa lokalnog (mock) na Keycloak-based
- Prilagođeno dekodiranje JWT payload-a (base64 padding fix)

**Šta je tim odbacio:**
/

**Rizici, problemi ili greške koje su uočene:**

- Problemi sa Keycloak konfiguracijom mogu uticati na testiranje

**Ko je koristio alat:** Dalila Tanković

---

- **Datum:** 07.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je koristen:** Codex / GPT-5
- **Svrha koristenja:** Implementacija i provjera PBI-013 (upravljanje korisnickim racunima - Admin).
- **Prompt koji je koristen:** Implementiraj PBI-013 tako da administrator moze kreirati nove korisnicke racune, izmijeniti postojece podatke, dodijeliti ulogu i firmu, deaktivirati i reaktivirati korisnika, sprijeciti brisanje korisnika sa aktivnim intervencijama i sprijeciti admina da deaktivira ili obrise vlastiti racun. Sacuvaj postojece poslovne tokove, koristi postojece backend/frontend obrasce, dodaj audit log i validaciju, te pokreni dostupne testove, typecheck i build.
- **Kratak opis zadatka ili upita:** Razvoj admin modula za upravljanje lokalnim korisnicima i povezanim Keycloak nalozima, ukljucujuci RBAC za admin pristup, dodjelu rola, dodjelu firme, deaktivaciju/reaktivaciju i zastitu integriteta podataka.
- **Sta je AI predlozio ili generisao:**
  - `UserManagementService` s repository i identity-provider apstrakcijama radi testabilnosti.
  - Backend rute za `GET /users`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/deactivate`, `PATCH /users/:id/activate` i `DELETE /users/:id`.
  - Integraciju s Keycloak admin API-jem za kreiranje naloga, azuriranje podataka, enable/disable status i dodjelu kontrolisanih rola.
  - Validaciju forme za ime, email, username, privremenu lozinku, rolu i firmu.
  - Frontend admin ekran za listu korisnika, kreiranje, izmjenu, deaktivaciju, reaktivaciju i brisanje.
  - Audit log zapise za kreiranje, izmjenu, deaktivaciju, reaktivaciju i brisanje korisnika.
  - Unit testove za mapiranje rola, business pravila i zabrane nad vlastitim admin nalogom.
- **Sta je tim prihvatio:** Backend servis i rute za administraciju korisnika, frontend admin ekran, Keycloak integraciju, audit log i zastite za self-deactivate/self-delete i korisnike povezane s aktivnim intervencijama.
- **Sta je tim izmijenio:** Admin pristup je dodat i u druge operativne tokove gdje admin treba imati prava koordinatora, npr. intervencije, dodjele, komentari i historija.
- **Sta je tim odbacio:** Brisanje historijskih podataka korisnika nije implementirano; korisnici se deaktiviraju/reactiviraju kako bi historijat ostao sacuvan.
- **Rizici, problemi ili greske koje su uocene:** Tok zavisi od ispravne Keycloak konfiguracije i lokalne veze korisnika preko `ExternalIdentity`; stari korisnici bez povezane Keycloak identity veze mogu biti orphaned i zahtijevaju rucnu provjeru ili ponovni seed.
- **Ko je koristio alat:** Kerim Hajdar

---

- **Datum:** 07.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je koristen:** Codex / GPT-5
- **Svrha koristenja:** Zavrsni refaktoring, provjera Sprint 6 scope-a i ispravke regresija prije deploya.
- **Prompt koji je koristen:** Refaktorisi postojece izmjene bez promjene business logike, prodji kroz Sprint 6 sprint goal i backlog, potvrdi po kodu da su PBI-004, PBI-005, PBI-006, PBI-007, PBI-011, PBI-013, PBI-016 i PBI-033 implementirani, popravi male regresije koje sprjecavaju prihvatne kriterije, posebno admin pristup, komentare, historiju, SLA, assignment filtraciju, status ASSIGNED i attachment ovlastenja. Pokreni relevantne build, typecheck i test komande i navedi sta treba rucno provjeriti prije deploya.
- **Kratak opis zadatka ili upita:** Pregled kompletnog Sprint 6 toka kroz backend i frontend kod, uklanjanje regresija u rutama i UI tokovima, uskladjivanje pristupa po rolama i validacija kljucnih user storyja prije deploya.
- **Sta je AI predlozio ili generisao:**
  - Prosirenje admin pristupa za intervencije, komentare i historiju gdje admin treba imati operativna prava.
  - Historiju intervencija koja se ucitava odmah, ima paginaciju i filtere po lokaciji i tipu/kategoriji kvara.
  - Link iz historije na reports shell za intervenciju.
  - Pristup korisnika vlastitim prijavljenim intervencijama i komentarima kroz URL i intervencije tab.
  - Popravku SLA rute tako da backend prihvata `PATCH /api/v1/sla` i payload `{ configurations: [...] }`.
  - Filtere na listi intervencija za status, tip, dodijeljenog servisera i nedodijeljene intervencije.
  - Vracanje `assignments` podataka u `GET /interventions` response radi filtera po serviseru.
  - Automatski prelaz statusa `NEW -> ASSIGNED` pri dodjeli servisera i `ASSIGNED -> NEW` kada se ukloni zadnji serviser.
  - Ogranicenje brisanja attachmenta na admin rolu, dok koordinator/admin mogu pregledati i preuzeti fajlove.
  - Dodatne route/service testove za SLA, historiju, komentare, dodjele i intervencije.
- **Sta je tim prihvatio:** Male ciljane ispravke koje zatvaraju prihvatne kriterije Sprinta 6 bez promjene baze, ruta ili javnih API-ja osim kompatibilnog dodavanja `PATCH /sla`.
- **Sta je tim izmijenio:** Tok dodjele servisera sada mijenja status intervencije u `ASSIGNED` kada je intervencija bila `NEW`; uklanjanje zadnjeg servisera iz `ASSIGNED` intervencije vraca status na `NEW`.
- **Sta je tim odbacio:** Potpuna implementacija servisnog izvjestaja/rezolucije nije dodana jer je dogovoreno da je reports dio shell, a stvarni izvjestaj nije bio eksplicitno planiran za ovaj sprint.
- **Rizici, problemi ili greske koje su uocene:** Frontend build i dalje prikazuje postojece warninge za multiple lockfiles i edge runtime; nisu vezani za refaktoring. Stari zapisi u bazi bez `faultReport.userId` ne mogu se retroaktivno tretirati kao korisnicke vlastite intervencije bez migracije ili ponovnog seeda.
- **Ko je koristio alat:** Kerim Hajdar

---

- **Datum:** 07.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je koristen:** Codex / GPT-5
- **Svrha koristenja:** Implementacija i provjera PBI-013 (upravljanje korisnickim racunima - Admin).
- **Prompt koji je koristen:** Implementiraj PBI-013 tako da administrator moze kreirati nove korisnicke racune, izmijeniti postojece podatke, dodijeliti ulogu i firmu, deaktivirati i reaktivirati korisnika, sprijeciti brisanje korisnika sa aktivnim intervencijama i sprijeciti admina da deaktivira ili obrise vlastiti racun. Sacuvaj postojece poslovne tokove, koristi postojece backend/frontend obrasce, dodaj audit log i validaciju, te pokreni dostupne testove, typecheck i build.
- **Kratak opis zadatka ili upita:** Razvoj admin modula za upravljanje lokalnim korisnicima i povezanim Keycloak nalozima, ukljucujuci RBAC za admin pristup, dodjelu rola, dodjelu firme, deaktivaciju/reaktivaciju i zastitu integriteta podataka.
- **Sta je AI predlozio ili generisao:**
  - `UserManagementService` s repository i identity-provider apstrakcijama radi testabilnosti.
  - Backend rute za `GET /users`, `POST /users`, `PATCH /users/:id`, `PATCH /users/:id/deactivate`, `PATCH /users/:id/activate` i `DELETE /users/:id`.
  - Integraciju s Keycloak admin API-jem za kreiranje naloga, azuriranje podataka, enable/disable status i dodjelu kontrolisanih rola.
  - Validaciju forme za ime, email, username, privremenu lozinku, rolu i firmu.
  - Frontend admin ekran za listu korisnika, kreiranje, izmjenu, deaktivaciju, reaktivaciju i brisanje.
  - Audit log zapise za kreiranje, izmjenu, deaktivaciju, reaktivaciju i brisanje korisnika.
  - Unit testove za mapiranje rola, business pravila i zabrane nad vlastitim admin nalogom.
- **Sta je tim prihvatio:** Backend servis i rute za administraciju korisnika, frontend admin ekran, Keycloak integraciju, audit log i zastite za self-deactivate/self-delete i korisnike povezane s aktivnim intervencijama.
- **Sta je tim izmijenio:** Admin pristup je dodat i u druge operativne tokove gdje admin treba imati prava koordinatora, npr. intervencije, dodjele, komentari i historija.
- **Sta je tim odbacio:** Brisanje historijskih podataka korisnika nije implementirano; korisnici se deaktiviraju/reactiviraju kako bi historijat ostao sacuvan.
- **Rizici, problemi ili greske koje su uocene:** Tok zavisi od ispravne Keycloak konfiguracije i lokalne veze korisnika preko `ExternalIdentity`; stari korisnici bez povezane Keycloak identity veze mogu biti orphaned i zahtijevaju rucnu provjeru ili ponovni seed.
- **Ko je koristio alat:** Kerim Hajdar

---

- **Datum:** 07.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je koristen:** Codex / GPT-5
- **Svrha koristenja:** Zavrsni refaktoring, provjera Sprint 6 scope-a i ispravke regresija prije deploya.
- **Prompt koji je koristen:** Refaktorisi postojece izmjene bez promjene business logike, prodji kroz Sprint 6 sprint goal i backlog, potvrdi po kodu da su PBI-004, PBI-005, PBI-006, PBI-007, PBI-011, PBI-013, PBI-016 i PBI-033 implementirani, popravi male regresije koje sprjecavaju prihvatne kriterije, posebno admin pristup, komentare, historiju, SLA, assignment filtraciju, status ASSIGNED i attachment ovlastenja. Pokreni relevantne build, typecheck i test komande i navedi sta treba rucno provjeriti prije deploya.
- **Kratak opis zadatka ili upita:** Pregled kompletnog Sprint 6 toka kroz backend i frontend kod, uklanjanje regresija u rutama i UI tokovima, uskladjivanje pristupa po rolama i validacija kljucnih user storyja prije deploya.
- **Sta je AI predlozio ili generisao:**
  - Prosirenje admin pristupa za intervencije, komentare i historiju gdje admin treba imati operativna prava.
  - Historiju intervencija koja se ucitava odmah, ima paginaciju i filtere po lokaciji i tipu/kategoriji kvara.
  - Link iz historije na reports shell za intervenciju.
  - Pristup korisnika vlastitim prijavljenim intervencijama i komentarima kroz URL i intervencije tab.
  - Popravku SLA rute tako da backend prihvata `PATCH /api/v1/sla` i payload `{ configurations: [...] }`.
  - Filtere na listi intervencija za status, tip, dodijeljenog servisera i nedodijeljene intervencije.
  - Vracanje `assignments` podataka u `GET /interventions` response radi filtera po serviseru.
  - Automatski prelaz statusa `NEW -> ASSIGNED` pri dodjeli servisera i `ASSIGNED -> NEW` kada se ukloni zadnji serviser.
  - Ogranicenje brisanja attachmenta na admin rolu, dok koordinator/admin mogu pregledati i preuzeti fajlove.
  - Dodatne route/service testove za SLA, historiju, komentare, dodjele i intervencije.
- **Sta je tim prihvatio:** Male ciljane ispravke koje zatvaraju prihvatne kriterije Sprinta 6 bez promjene baze, ruta ili javnih API-ja osim kompatibilnog dodavanja `PATCH /sla`.
- **Sta je tim izmijenio:** Tok dodjele servisera sada mijenja status intervencije u `ASSIGNED` kada je intervencija bila `NEW`; uklanjanje zadnjeg servisera iz `ASSIGNED` intervencije vraca status na `NEW`.
- **Sta je tim odbacio:** Potpuna implementacija servisnog izvjestaja/rezolucije nije dodana jer je dogovoreno da je reports dio shell, a stvarni izvjestaj nije bio eksplicitno planiran za ovaj sprint.
- **Rizici, problemi ili greske koje su uocene:** Frontend build i dalje prikazuje postojece warninge za multiple lockfiles i edge runtime; nisu vezani za refaktoring. Stari zapisi u bazi bez `faultReport.userId` ne mogu se retroaktivno tretirati kao korisnicke vlastite intervencije bez migracije ili ponovnog seeda.
- **Ko je koristio alat:** Kerim Hajdar

---

- **Datum:** 07.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** GitHub Copilot (LLM) / GPT-5.4 mini
- **Svrha korištenja:** Implementacija PBI-006 (dodjela servisera intervencijama) i pripadajuce verifikacije backend/frontend toka.
- **Kratak opis zadatka ili upita:** Razvoj backend i frontend podrške za dodjelu jednog ili vise servisera otvorenoj intervenciji, prikaz serviser liste sortirane po broju aktivnih intervencija, mogucnost izmjene/uklanjanja dodjele, audit evidentiranje i integracija UI elementa unutar detalja intervencije.
- **Sta je AI predlozio ili generisao:**
  - `AssignmentService` za dodjelu, uklanjanje i pregled dodjela, te izracun opterecenja servisera po aktivnim intervencijama.
  - `AssignmentController` i route integraciju za `GET /interventions/:id/assignments`, `GET /interventions/:id/assignments/available`, `POST /interventions/:id/assignments` i `DELETE /interventions/:id/assignments/:userId`.
  - Zod DTO/validation sloj za unos liste `userIds` i response modele za dodjele i dostupne servisere.
  - Frontend API client za assignment pozive, `AssignerModal` komponentu i integraciju u stranicu intervencija.
  - Test scenarije za uspjeh, nepostojecu intervenciju, deaktiviranog servisera, duplikat dodjele, uklanjanje dodjele i prikaz load liste.
- **Sta je tim prihvatio:** Kompletan backend tok za assignment, audit log zapis pri dodjeli i uklanjanju, sortiranje servisera po aktivnom opterecenju, te frontend modal za koordinatora unutar detalja intervencije.
- **Sta je tim izmijenio:** Existing assignments ruta je pretvorena iz shell odgovora u funkcionalan modul; frontend strana intervencije je dobila dugme i modal za dodjelu; aktivne intervencije za load racunaju se kao `NEW`, `ASSIGNED` i `IN_PROGRESS`.
- **Sta je tim odbacio:** Automatske notifikacije pri dodjeli nisu implementirane jer zavise od PBI-012; real-time websocket osvjezavanje nije dodano, nego je koristen refresh/load pri otvaranju modala.
- **Rizici, problemi ili greške koje su uočene:** Testovi backend modula zavise od dostupne baze preko `DATABASE_URL`; lokalni build/test tok je pokazao i postojece TypeScript probleme iz drugih dijelova projekta (npr. pre-existing frontend `Button variant` i neke backend enum neslaganja) koji nisu dio PBI-006, ali uticu na globalnu verifikaciju.
- **Ko je koristio alat:** Ismail Mujanović

---

- **Datum:** 6.5.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Implementacija upravljanja priloženim fajlovima (attachments) za intervencije.
- **Kratak opis zadatka ili upita:** Postavljanje kompletnog modula za upload, download i brisanje priloženih fajlova na intervencijama, uključujući backend servis s repository patternom, validaciju tipa i veličine fajla te frontend prikaz s akcijama po fajlu.
- **Šta je AI predložio ili generisao:**
  - `AttachmentService` klasu s `IAttachmentRepository` interfejsom radi testabilnosti.
  - Endpointe: `POST /interventions/:id/attachments`, `GET /interventions/:id/attachments`, `GET /attachments/:id/download` i `DELETE /attachments/:id`.
  - `DataTable` komponentu na frontendu s Download i Delete akcijama po redu.
  - `ConfirmDialog` komponentu za potvrdu brisanja attachmenta.
  - `formatFileSize` helper funkciju za prikaz veličine fajla.
  - Unit testove za attachment servis.
- **Šta je tim prihvatio:** Kompletnu backend implementaciju s repository patternom, sve API endpointe, frontend prikaz attachmenta s potvrdom brisanja.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Uočen je pre-existing bug u importu unutar route fajla koji je ispravljen tokom implementacije; Cloudflare Pages CI check padao zbog nedostajućeg `export const runtime = 'edge'` na dinamičkim stranicama.
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 06.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Implementacija planiranja intervencija — kreiranje, pregled detalja i uređivanje intervencija od strane koordinatora, uz merge s PBI-033 granom.
- **Kratak opis zadatka ili upita:** Implementacija tri user storije: koordinator kreira intervenciju vezanu za fault report, koordinator kreira preventivnu intervenciju bez fault reporta, koordinator uređuje intervenciju dok je status NEW ili IN_PROGRESS. Uključivalo je i rješavanje merge konflikata s PBI-033 granom.
- **Šta je AI predložio ili generisao:**
  - `InterventionService` klasu s `IInterventionRepository` interfejsom.
  - Zod validacijske sheme s `optionalDateField` helperom za pravilno razlikovanje `undefined` vs `null` pri Prisma update operacijama.
  - `POST /interventions` i `PATCH /interventions/:id` endpointe s autorizacijom za koordinatora i admina.
  - Audit logiranje `INTERVENTION_CREATED` i `INTERVENTION_UPDATED` evenata.
  - Frontend forme za kreiranje i uređivanje intervencija s klijentskom validacijom.
  - Detaljan prikaz intervencije s uslovnim "Edit Intervention" dugmetom ovisno o statusu.
  - 24 unit testa za intervention servis.
  - `wrangler.toml` konfiguraciju i `export const runtime = 'edge'` na svim dinamičkim stranicama za Cloudflare Pages.
- **Šta je tim prihvatio:** Kompletnu backend implementaciju s testovima, sve tri frontend stranice (lista, detalji, nova/uredi forma), Cloudflare Pages ispravke.
- **Šta je tim izmijenio:** Ispravka `KEYCLOAK_CLIENT_SECRET` u `.env` fajlu koji nije odgovarao stvarnoj Keycloak konfiguraciji; proširena seed skripta s testnim intervencijama različitih statusa za lokalno testiranje.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Stranice `/interventions/new` i `/interventions/[id]/edit` nisu bile commitane u git iz prethodne sesije te su rekrearane; `@base-ui/react/select` tipizira `onValueChange` kao `string | null` što je zahtijevalo `?? ''` null-coalescing na svim Select komponentama; Cloudflare Pages native integracija zahtijeva `export const runtime = 'edge'` na svim dinamičkim rutama.
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 06.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Implementacija modula za prioritet intervencije, SLA konfiguraciju i automatska upozorenja o kašnjenju.
- **Kratak opis zadatka ili upita:** Implementacija tri user storije: koordinator dodjeljuje i mijenja prioritet intervencije, administrator konfigurira SLA rokove po prioritetu, sistem automatski signalizira kašnjenje koordinatoru kada intervencija nije riješena unutar definisanog roka.
- **Šta je AI predložio ili generisao:**
  - `SlaService` klasu s metodama za dohvat i ažuriranje SLA konfiguracije po prioritetu s validacijom pozitivnih vrijednosti.
  - Backend endpointe `GET /sla` i `PUT /sla` s autorizacijom za admina i audit logiranjem promjena.
  - `isOverdue` flag na `InterventionListItem` koji se računa na osnovu `createdAt + SLA rok za prioritet`.
  - `PriorityBadge` komponentu s bojom po nivou prioriteta (Hitan = crvena, Visok = narandžasta, Normalan = plava, Nizak = siva).
  - Vizualnu oznaku kašnjenja u listi intervencija bez promjene statusa intervencije.
  - Automatsko sortiranje liste po prioritetu (Hitan > Visok > Normalan > Nizak), unutar istog prioriteta po datumu kreiranja.
  - Admin stranicu `/admin/sla-config` s formom za unos rokova u satima po prioritetu.
  - Unit testove za SLA servis.
- **Šta je tim prihvatio:** Kompletnu backend implementaciju SLA servisa, `PriorityBadge` komponentu, admin stranicu za konfiguraciju, `isOverdue` flag i vizualnu oznaku kašnjenja, sortiranje liste po prioritetu.
- **Šta je tim izmijenio:** Dodat prikaz labela prioriteta u frontend error porukama umjesto generičke poruke; dodat test za duplicate priority business invariant u `sla.service.test.ts`; poništene izmjene u `route.ts` jer kompletan refactor nije bio spreman za merge.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Git merge konflikt između lokalne refaktorisane verzije i remote verzije sa starijim kodom; poništavanje `route.ts` izmjena ostavilo je dio logike za `ValidationError` kao tehnički dug; frontend error mapping koristi heuristiku baziranu na tekstu poruke što može biti fragilno ako se backend poruke promijene; `export const runtime = 'edge'` bio je nedostajući na admin SLA stranici što je uzrokovalo pad Cloudflare Pages builda.
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 05.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Testiranje i implementacija funkcionalnosti za PBI-004.
- **Kratak opis zadatka ili upita:** Implementacija i testiranje funkcionalnosti planiranja intervencija, uključujući dodavanje unit testova za validaciju poslovnih pravila i proširenje mogućnosti upravljanja intervencijama od strane koordinatora.
- **Šta je AI predložio ili generisao:**
  - Generisanje unit testova za validaciju planiranja intervencija.
  - Provjeru poslovnih pravila, uključujući validaciju da datum izvršenja intervencije ne može biti prije datuma početka intervencije.
  - Implementaciju provjere privilegija kako bi koordinator imao mogućnost uređivanja svih intervencija.
  - Zadržavanje automatskog kreiranja intervencija nakon uspješnog evidentiranja kvarova.
  - Omogućavanje koordinatoru kreiranja i uređivanja intervencija koje nisu direktno povezane sa kvarovima, već predstavljaju redovna održavanja sistema.
- **Šta je tim prihvatio:** Tim je prihvatio kompletnu implementaciju, uključujući predložene unit testove i proširenja funkcionalnosti za upravljanje intervencijama.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Nisu uočeni značajni rizici, problemi niti greške tokom implementacije i testiranja funkcionalnosti.
- **Ko je koristio alat:** Lamija Bojić

---

- **Datum:** 07.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** ChatGPT (LLM)
- **Svrha korištenja:** Implementacija i testiranje funkcionalnosti historije intervencija uz debugging Docker, Keycloak i frontend integracije.
- **Kratak opis zadatka ili upita:** Implementacija backend endpointa `/interventions/history` sa filtriranjem po lokaciji i kategoriji, izrada frontend stranice za pregled historije intervencija, dodavanje role-based pristupa kroz navigaciju, te pisanje testova za novu rutu. Tokom implementacije rješavani su problemi sa Docker okruženjem, CORS konfiguracijom, Keycloak autentifikacijom i lokalnom MySQL bazom.
- **Šta je AI predložio ili generisao:**
  - Implementaciju history endpointa u `interventions.route.ts`
  - Frontend `history/page.tsx` sa formom za filtriranje i tabelarnim prikazom rezultata
  - Role-based prikaz History sekcije u `AppNavigation`
  - Unit/integration testove za `/interventions/history` rutu u `interventions.route.test.ts`
- **Šta je tim prihvatio:** Backend i frontend implementaciju history funkcionalnosti, navigacijsku logiku zasnovanu na rolama i predložene testove za rutu historije intervencija.
- **Šta je tim izmijenio:** Prilagođena je frontend navigacija postojećoj strukturi projekta i dodani su test podaci u lokalnu Docker bazu radi validacije funkcionalnosti.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Nisu uočeni značajni rizici, problemi niti greške tokom implementacije i testiranja funkcionalnosti.
- **Ko je koristio alat:** Dalila Tanković

---

- **Datum:** 07.05.2026.
- **Sprint** broj: Sprint 6
- **Alat koji je korišten:** Claude (Anthropic) – claude-sonnet-4-6
- **Svrha korištenja:** Implementacija PBI-016 (Komentari intervencije) — backend ruta, frontend komponenta, seed podaci i testovi.
- **Kratak opis zadatka ili upita:** Razvoj kompletnog modula za komentare na intervencijama: backend API (GET i POST), frontend CommentsSection komponenta uključena u stranicu detalja intervencije, proširenje seed skripte s demo komentarima, te 28 unit/integration testova za backend rutu.
- **Sta je AI predložio ili generisao:**
  Backend comments.route.ts s GET /intervention/:id i POST /intervention/:id; autorizacija se oslanja na req.user.localUserId i req.user.roles iz auth middlewarea (koordinator i serviser), bez povjerenja u client-supplied polja.
  Frontend CommentsSection.tsx komponentu s prikazom liste komentara (Avatar, ime, username, datum/vrijeme, tekst), formom za unos s Ctrl+Enter prečicom i brojačem preostalih znakova.
  Integraciju komponente u /interventions/[id]/page.tsx.
  Test fajl comments.route.test.ts s 28 testova: validacija ID-a, sortiranje, provjera rola autora, zabrana praznih komentara, nepostojeća intervencija, nedostatak localUserId, DB greške, case-insensitive uloge.
- **Sta je tim prihvatio:** Kompletan backend i frontend tok za komentare, prošireni seed, ažurirani shared index i svi testovi.
- **Sta je tim izmijenio:**/
- **Sta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Frontend nije prikazivao podatke nakon pokretanja zbog nedostatka Keycloak korisnika s odgovarajućim ulogama — riješeno uputama za kreiranje test korisnika u Keycloak admin panelu i dodjelu uloge koordinator. Seed kreira korisnike samo u MySQL bazi; Keycloak mora imati iste korisnike kako bi se JWT token s ulogom mogao koristiti za login i prikaz podataka.
- **Ko je koristio alat:** Lejla Gičević

---

- **Datum:** 11.05.2026.
- **Sprint broj:** Sprint 7
- **Alat koji je korišten:** Claude (Anthropic) – claude-sonnet-4-6
- **Svrha korištenja:** Implementacija PBI-010 (Evidencija izvještaja o intervenciji) - ispravka grešaka u backend servisu, ruti i shemi, integracija frontend komponente u stranicu detalja intervencije, debugging 404 greške pri kreiranju izvještaja i usklađivanje test suita.
- **Kratak opis zadatka ili upita:** Pregled i ispravka kompletnog modula za izvještaje: backend `reports.service.ts`, `reports.route.ts`, `reports.schema.ts`, frontend `reports.service.ts`, `ReportSection.tsx` i `/interventions/[id]/page.tsx`. Nakon inicijalne implementacije, nastavljen debugging runtime 404 greške i usklađivanje testova sa produkcijskim kodom.
- **Šta je AI predložio ili generisao:**
  - Ispravku strukturalne greške u `reports.route.ts` - `export default` bio na vrhu fajla prije deklaracije routera (runtime `ReferenceError`), uz uklanjanje duplog exporta i nekorištenih importa.
  - Ekstrakciju `hasSessionRole` i `getSessionRoles` u novi `lib/auth.ts` koji je bio referenciran ali nije postojao.
  - Integraciju `ReportSection` komponente u stranicu detalja intervencije s role-based vidljivošću.
  - Prevod svih Bosnian UI stringova u `ReportSection.tsx` i `page.tsx` na engleski.
  - Ispravku mountanja `reportsRouter` u `app.ts` — bio mountan na `/api/v1/reports` umjesto na `/api/v1/interventions/:interventionId/reports`, zbog čega je svaki POST vraćao 404.
  - Dodavanje mockova za `auth.middleware` (`authenticate`, `optionalAuthenticate`, `authorizeRoles` bez Keycloak poziva), `validate.middleware` (vraća 422) i `AuditService` u route testu - bez toga svi testovi padali sa 500 zbog DNS lookup greške na `keycloak` hostu.
  - Ispravku testa za audit log da provjerava `AuditService.log` direktno umjesto Prisma `auditLogCreateMock`.
- **Šta je tim prihvatio:** Sve ispravke grešaka, integraciju `ReportSection` komponente, prevod UI stringova, ispravku mountanja routera i usklađivanje test suita.
- **Šta je tim izmijenio:** Odbačena privremena izmjena GET handlera da vraća `200 { data: null }` - zadržano originalno `404` ponašanje, razlika riješena u frontend servisu i testovima.
- **Šta je tim odbacio:** Dodavanje novog `InterventionReport` modela u `schema.prisma` — korišten postojeći `Report` model. Trajno mijenjanje HTTP statusa validacijskih grešaka sa `400` na `422` u produkcijskom `validate.middleware`.
- **Rizici, problemi ili greške koje su uočene:** `Report` model nema `updatedAt` polje - UI uvijek prikazuje datum kreiranja, ne posljednje izmjene; preporučuje se dodavanje `updatedAt @updatedAt` u narednom sprintu. `authorizeRoles` middleware u produkcijskom kodu zove Keycloak pri svakom requestu što uzrokuje pad svih testova bez mock okruženja — preporučuje se environment varijabla za isključivanje live role refresh u test/dev okruženju.
- **Ko je koristio alat:** Iman Šehić

---

- **Datum:** 13.05.2026.
- **Sprint broj:** Sprint 7
- **Alat koji je korišten:** GitHub Copilot (LLM) / GPT-5.4 mini
- **Svrha korištenja:** Implementacija i naknadna ispravka PBI-020 (Kalendarski prikaz intervencija) uz pripadaću provjeru kroz frontend testove i typecheck.
- **Kratak opis zadatka ili upita:** Dodavanje kalendarskog prikaza za intervencije, prebacivanje između listnog i kalendarskog prikaza u zaglavlju stranice, prikaz intervencija po `dueAt` datumu uz fallback na `startedAt`, proširenje prikaza na day/week/month modove, lokalno grupisanje po datumu bez UTC pomjeranja, vizualno razlikovanje po prioritetu i otvaranje detalja intervencije klikom na događaj.
- **Šta je AI predložio ili generisao:**
  - `MonthCalendar` komponentu za kalendarski prikaz sa Month, Week i Day modovima i navigacijom između perioda.
  - Toggle u `PageHeader` za prebacivanje između listnog i kalendarskog prikaza.
  - Mapiranje intervencija na lokalne kalendarske datume uz isključivanje zapisa bez definisanog datuma i bez UTC pomjeranja.
  - Vizualno označavanje prioriteta kroz obojene indikatore i navigaciju na detalj intervencije pri kliku.
  - Ažurirane Vitest i React Testing Library testove za prebacivanje prikaza, navigaciju, prioritetne boje, overflow i filtriranje neispravnih datuma.
- **Šta je tim prihvatio:** Mjesečni prikaz, day/week/month modove, toggle u zaglavlju, `dueAt` kao primarni datum sa `startedAt` fallbackom, klik kroz detalj intervencije i mock-data test pristup.
- **Šta je tim izmijenio:** Test okruženje je prilagođeno za frontend Vitest pokretanje uz `jsdom`, `@testing-library/jest-dom` i alias za `@shared`; dodan je lokalni datum kao izvor istine u kalendarskom prikazu, te je potvrđeno da klik na događaj i dalje vodi na detalj intervencije.
- **Šta je tim odbacio:** Dodatne promjene van kalendarskog prikaza nisu rađene jer nisu bile dio ovog updatea.
- **Rizici, problemi ili greške koje su uočene:** Tokom verifikacije je uočeno da frontend testovi zahtijevaju dodatne dev dependency pakete i odgovarajući alias setup; takođe je potvrđeno da UTC oslanjanje pri grupisanju datuma može pomjeriti događaje između dana u različitim vremenskim zonama, pa je ostavljen lokalni datum kao izvor istine.
- **Ko je koristio alat:** Ismail Mujanović

---

- **Datum:** 13.05.2026.
- **Sprint broj:** Sprint 7
- **Alat koji je korišten:** Codex / GPT-5
- **Svrha korištenja:** Kratka provjera i dorada role-based prikaza navigacije na frontendu.
- **Kratak opis zadatka ili upita:** Provjera koje sekcije frontend prikazuje korisnicima u odnosu na backend ograničenja po rolama, te sakrivanje linkova i akcija koje korisnik ne smije koristiti.
- **Šta je AI predložio ili generisao:**
  - Sakrivanje sekcija u navigaciji prema ulozi korisnika.
  - Ispravku stare unauthorized poruke koja se prikazivala na dozvoljenim stranicama.
  - Ograničenje kalendarskog prikaza intervencija samo na koordinatora i admina.
- **Šta je tim prihvatio:** Ciljane frontend izmjene za prikaz sekcija prema rolama.
- **Šta je tim izmijenio:** Home stranica sada prijavljenom korisniku ne prikazuje Login/Register CTA.
- **Šta je tim odbacio:** Šire refaktorisanje autorizacije i promjene backend pravila nisu rađene.
- **Rizici, problemi ili greške koje su uočene:** Frontend typecheck i dalje pada zbog postojećeg nedostajućeg `@testing-library/react` dependencyja.
- **Ko je koristio alat:** Lamija Bojić

---

- **Datum:** 13.05.2026.
- **Sprint broj:** Sprint 7
- **Alat koji je korišten:** Codex / GPT-5
- **Svrha korištenja:** Provjera implementiranosti user storyja i razjašnjenje postojećih dashboard/report funkcionalnosti.
- **Kratak opis zadatka ili upita:** Pregled koda i dokumentacije radi provjere da li su menadžment dashboard i izvještaji servisera implementirani, gdje se nalaze u aplikaciji i da li postoje placeholder rute koje zbunjuju korisnika.
- **Šta je AI predložio ili generisao:**
  - Analizu da je menadžment dashboard implementiran kroz `/management`, a ne kroz obični `/dashboard`.
  - Analizu da su izvještaji servisera implementirani unutar detalja intervencije.
  - Objašnjenje da je `/reports` trenutno shell/placeholder ruta.
- **Šta je tim prihvatio:** Zaključke o stvarnom stanju implementacije.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** Implementacija novih backend funkcionalnosti nije rađena u ovoj provjeri.
- **Rizici, problemi ili greške koje su uočene:** `/reports` ruta može zbuniti korisnike jer ne prikazuje stvarne izvještaje.
- **Ko je koristio alat:** Lamija Bojić

---

- **Datum:** 10.05.2026.
- **Sprint broj:** Sprint 7
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Redizajn frontend sučelja prema novom UI/UX design sistemu.
- **Kratak opis zadatka ili upita:** Vizualna unifikacija stranica prijave, resetiranja lozinke, profila i sekcije izvještaja prema internom design sistemu koji koristi glassmorphism i gradient stilove. Rješavanje merge konflikata pri integraciji `develop` grane u `fix/ui-ux` uz zadržavanje UI/UX promjena.
- **Šta je AI predložio ili generisao:**
  - Redizajn `login/page.tsx` s `auth-layout`, animiranim gradijentnim pozadinama, `glass-card` containerom, `btn-glow` submit dugmetom i stilizovanim linkom za zaboravljenu lozinku.
  - Kompletno prepisivanje `reset-password/page.tsx` iz `PageLayout+Card` u `auth-layout` stil identičan stranici za prijavu, s `AlertCircle`/`CheckCircle2` inline porukama, `spinner` loading stanjem i bosanskim labelama.
  - Unapređenje `profile/page.tsx`: `stat-card-glow` kartice, ikone headera s `icon-bg-primary`/`icon-bg-violet` stilovima, `Skeleton` loading stanje, `btn-glow` dugmad s spinner-om i prijevod svih stringova na bosanski.
  - Redizajn `ReportSection.tsx`: ikone u headerima kartica, `btn-glow` save dugme s loader-om, stilizovane error/success poruke i bosanski prijevodi.
  - Rješavanje merge konflikata pri `git pull develop` — zadržane UI/UX izmjene, integrisane funkcionalne dopune s `develop` grane.
- **Šta je tim prihvatio:** Kompletne izmjene na svim stranicama, design sistem komponente (`glass-card`, `btn-glow`, `stat-card-glow`, `spinner`), bosanske prijevode, rješavanje merge konflikata.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Merge konflikt na `login/page.tsx` između UI/UX styled dugmeta i novododate "zaboravili ste lozinku" funkcionalnosti s `develop` grane — riješen ručno uz zadržavanje oba elementa. CSS klasa `icon-bg-violet` nije postojala u design sistemu — zamijenjena s `icon-bg-purple`.
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 12.05.2026.
- **Sprint broj:** Sprint 7
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Implementacija upravljačke table za Menadžment/Admin uloge s pregledom ključnih metrika sistema intervencija.
- **Kratak opis zadatka ili upita:** Implementacija user storije: korisnik s ulogom Menadžment ili Admin može vidjeti dashboard s brojem aktivnih i završenih intervencija, prosječnim vremenom rješavanja i distribucijom intervencija po prioritetu.
- **Šta je AI predložio ili generisao:**
  - `ManagementService` klasu s metodom `getDashboardStats()`, `IManagementRepository` interfejsom za testabilnost, konstantama `ACTIVE_STATUSES`, `COMPLETED_STATUS` i `PRIORITY_DISPLAY_ORDER`.
  - `computeAverageResolutionHours()` pomoćnu funkciju koja vraća `null` ako nema riješenih intervencija, štiti od negativnih trajanja (data anomaly) i računa prosjek u satima.
  - `buildPriorityDistribution()` funkciju koja uvijek vraća sva 4 prioriteta (CRITICAL → LOW) s agregiranim `total`, `active` i `completed` brojevima.
  - Backend endpoint `GET /api/v1/management/dashboard` ograničen na uloge Menadžment/Management/Admin/Administrator s `authorizeRoles` middlewareom.
  - Prisma repository implementaciju koja koristi `intervention.count` s `archived: false` filterom i `statusHistory.findMany` s `newStatus: RESOLVED` filterom.
  - Frontend `management/page.tsx` s role guardom (`AccessDenied` za neovlaštene korisnike), 3 stat kartice (aktivne, završene, prosječno vrijeme), tabelarni prikaz distribucije po prioritetu bez grafova.
  - `management.service.ts` servis na frontendu s `getManagementDashboard()` funkcijom.
  - Navigacijsku integraciju u `AppNavigation` — "Management" link u Operacije dropdownu vidljiv samo za Menadžment/Admin uloge.
  - 20 unit testova za `ManagementService` i 15 HTTP integracijskih testova za route.
- **Šta je tim prihvatio:** Kompletnu backend i frontend implementaciju, sve testove, navigacijsku integraciju.
- **Šta je tim izmijenio:** "Upravljačka tabla" label u navigaciji zamijenjen s "Management" radi konzistentnosti s ostatkom sučelja. Menadžment link premješten iz zasebne desktop nav stavke u Operacije dropdown kako bi se eliminisalo fizičko preklapanje s profilnim menijem.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** TypeScript build greška u CI — `prisma.intervention.groupBy()` tip nije bio direktno castabilan na `Promise<PriorityStatusCount[]>`, riješeno s `as unknown as Promise<PriorityStatusCount[]>` double castom. `postinstall: prisma generate` skripta pokvarila CI jer `DATABASE_URL` nije dostupan tokom `npm ci` — premještena u `dev` skriptu. `wrangler@4.90.0` zahtijevao Node >=22, CI koristi Node 20 — downgrade na `wrangler@3`.
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 24.05.2026.
- **Sprint broj:** Sprint 9
- **Alat koji je korišten:** OpenCode - DeepSeek V4
- **Svrha korištenja:** Implementacija PBI-051 (Settings stranica) sa korisničkim preferencijama, notifikacijskim postavkama i admin prečicama.
- **Kratak opis zadatka ili upita:** Implementacija Settings stranice koja zamjenjuje postojeći placeholder. Zadatak je uključivao: kreiranje UserPreference modela u Prisma-i, backend API modula za čitanje/pisanje preferenci po korisniku, frontend Settings stranicu sa tri sekcije (language select, notification toggles sa mandatory notifikacijama, admin quick links), te unit testove za backend (schema + service) i frontend (service).
- **Šta je AI predložio ili generisao:**
  - Plan implementacije na osnovu detaljne analize codebase-a (struktura projekta, postojeći admin pageovi, auth/RBAC patterni, baza, rutiranje).
  - `UserPreference` Prisma model sa `language` (String) i `notificationPreferences` (Json) poljima.
  - Backend modul `user-preferences` (schema → service → route) sa `GET /` i `PUT /` endpointima, `authenticate` middlewareom, mandatory notifikacijskom validacijom i audit logovanjem.
  - Frontend `settings.service.ts` sa svim konstantama (`SUPPORTED_LANGUAGES`, `NOTIFICATION_LABELS`, `MANDATORY_NOTIFICATIONS`).
  - Kompletnu Settings stranicu (`page.tsx`, 289 linija) sa auth guardom, language Selectom, NotificationToggle komponentom (sa Lock ikonicom za mandatory notifikacije), admin quick links karticama, Save dugmetom i toast notifikacijama.
  - Backend unit testove: 11 schema testova (validacija jezika, notifikacija, strict mode) i 9 service testova (default preferences, upsert create/update, mandatory rejection, partial update, bez usera).
  - Frontend unit testove: 8 testova za `settings.service.ts` (get/update prefs, error handling, konstante).
  - Fix za vitest v1 → v4.1.5 upgrade radi kompatibilnosti sa Node.js v24 (dodat vite zavisnost).
- **Šta je tim prihvatio:**
  - Kompletan PBI-051: Prisma model, backend API (schema, service, route), frontend Settings stranicu, sve testove.
  - Vitest upgrade (v1 → v4.1.5) za frontend, uključujući vite zavisnost.
- **Šta je tim izmijenio:**
  - Ispravljena očekivanja u 2 frontend testa koja su koristila `toThrow('fallback message')` umjesto stvarnog error message-a.
  - `Select` `onValueChange` handler wrapper zbog `@base-ui/react` API-a koji prosljeđuje `string | null`.
- **Šta je tim odbacio:**
  - Nije bilo odbijenih prijedloga.
- **Rizici, problemi ili greške koje su uočene:**
  - `vitest v1.6.1` nije kompatibilan sa `Node.js v24` — priroda greške: `Cannot set property testPath of #Object which has only a getter`. Riješeno upgrade-om na vitest v4.
  - Frontend vitest konfiguracija nije imala `vite` kao zavisnost (Next.js koristi vlastiti bundler), što je uzrokovalo `ERR_MODULE_NOT_FOUND` nakon upgrade-a na vitest v4. Riješeno dodavanjem `vite@^6.0.0` u devDependencies.
  - Prisma migracija nije pokrenuta jer MySQL baza nije dostupna u trenutnom okruženju; potrebno pokrenuti `npx prisma migrate dev --name add_user_preferences` kad DB bude dostupan.
  - `MonthCalendar.test.tsx` i dalje pada (`mockedUseRouter.mockReturnValue is not a function`) — zaseban prethodni bug, nije povezan sa PBI-051.
- **Ko je koristio alat:** Ismail Mujanović

---

- **Datum:** 24.05.2026.
- **Sprint broj:** Sprint 9
- **Alat koji je korišten:** Claude (Anthropic) – claude-sonnet-4-6
- **Svrha korištenja:** Implementacija upravljanja blokiranim korisnicima za prijave kvarova (PBI-039).
- **Kratak opis zadatka ili upita:** Implementacija user storije: koordinator kompanije može blokirati korisnike da ne mogu podnositi prijave kvarova njegovoj kompaniji, pregledati listu blokiranih korisnika i deblokirat ih.
- **Šta je AI predložio ili generisao:**
  - `BlockingService` klasu s metodama `blockUser()`, `unblockUser()`, `listBlockedUsers()`, `isUserBlocked()`, `IBlockingRepository` interfejsom za testabilnost i domenskim greškama (`BlockingNotFoundError`, `BlockingConflictError`, `BlockingForbiddenError`, `BlockingValidationError`).
  - `blocking.schema.ts` s Zod validacijom — inicijalno primalo `userId: number`, preinačeno na `username: string` kako koordinator ne bi morao znati interni ID korisnika.
  - `blocking.route.ts` s kompletnom Prisma repository implementacijom, `blockSelect` konstantom za konzistentno dohvaćanje podataka, username-to-ID lookup na backendu, i rutama: `GET /api/v1/blocking`, `POST /api/v1/blocking`, `PATCH /api/v1/blocking/:id/unblock`, `DELETE /api/v1/blocking/:id`.
  - Enforcement blokade u `fault-reports.route.ts` — provjera `UserBlock` zapisa prije kreiranja prijave, vraća 403 ako je korisnik blokiran.
  - Proširenje `interventions.route.ts` da uključi `reporterUser` podatke u `faultReport` polje.
  - Frontend `blocked-users/page.tsx` s role guardom (samo koordinator/admin), dijalogom za blokiranje po korisničkom imenu, dijalogom za potvrdu deblokiranja i listom aktivnih blokada.
  - `blocking.service.ts` na frontendu s `getBlockedUsers()`, `blockUser()`, `unblockUser()` funkcijama.
  - "Blocked Users" navigacijsku stavku u Operations dropdownu vidljivu samo za Koordinator/Admin uloge.
  - Proširenje `interventions/[id]/page.tsx` da koordinator može blokirati prijavitelja kvara direktno iz detalja intervencije.
  - 16 unit testova za `BlockingService` pokrivajući sve scenarije (blokiranje, deblokiranje, konflikt, forbidden, not found).
- **Šta je tim prihvatio:** Kompletnu backend i frontend implementaciju, sve testove, navigacijsku integraciju, username-based blokiranje umjesto ID-based.
- **Šta je tim izmijenio:** Ulazni parametar za blokiranje promijenjen s `userId: number` na `username: string` — koordinator unosi korisničko ime umjesto internog ID-a korisnika. "Blokirani korisnici" label zamijenjen s "Blocked Users" radi konzistentnosti s ostatkom sučelja.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Docker image za backend i frontend bio je buildan prije implementacije pa je kompajlirani kod bio zastario — riješeno rebuildom oba imagea. `TicketCategory` tabela nije bila kreirana (migracije `20260518193000_add_ticket_categories` i `20260518204500_expand_location_columns` nisu bile primijenjene) — migracije pokrenute manualno. Disk bio potpuno pun (0 GB slobodno) zbog Docker build cachea i WSL2 vhdx fajla — oslobođeno ~9.7 GB brisanjem build cachea i kompaktiranjem WSL2 diska. TypeScript build greška — `interventions/[id]/page.tsx` još uvijek koristio stari `userId` u pozivu `blockUser()` nakon promjene interfejsa na `username` — ispravno ažurirano.
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 21.05.2026.
- **Sprint broj:** Sprint 9
- **Alat koji je korišten:** Claude (Anthropic) – claude-sonnet-4-6
- **Svrha korištenja:** Ispravka prikaza vrijednosti filtera i dodavanje labela iznad filtera na svim stranicama.
- **Kratak opis zadatka ili upita:** Korisnici su vidjeli sirove ID-ove i enum vrijednosti u Select komponentama umjesto čitljivih naziva (npr. `CRITICAL` umjesto `Critical`, ili numerički ID kategorije umjesto naziva). Potrebno je bilo dodati permanentne labele iznad svakog filtera kako bi korisnici znali šta koji filter kontrolira.
- **Šta je AI predložio ili generisao:**
  - Dodavanje permanentnih labela iznad svakih Select filtera na stranicama `fault-reports`, `admin`, `admin/companies`, `interventions`, `interventions/new`, `interventions/[id]/edit`, `map`, `tickets`, `tickets/[id]` i `history`.
  - Ispravku `SelectValue` koji je prikazivao sirove ID-ove/enum vrijednosti umjesto čitljivih naziva — dodavanje mapiranja statusa i prioriteta (`STATUS_LABELS`, `PRIORITY_LABELS`) na svim zahvaćenim stranicama.
  - Dodavanje mapiranja statusa i prioriteta u tablicu historije intervencija (`history/page.tsx`).
  - Dodavanje nedostajućih opcija filtera statusa (`RESOLVED`, `CANCELLED`, `REJECTED`) na stranici intervencija.
  - Proširenje `FilterBar.tsx` komponente da podržava prikaz labele iznad filtera.
  - Ispravku prikaza vlasnika intervencije na backendu — `interventions.route.ts` koristio string interpolaciju koja je producirala `"undefined undefined"` kada `firstName` ili `lastName` nisu bili popunjeni; ispravka s `?? ''` fallbackom koji prikazuje `username`.
  - Ispravku `getUserRealmRoleMappings` u `keycloak.client.ts` da vraća `[]` umjesto da baca grešku pri 404 odgovoru — sprječava 500 greške kada korisnici u lokalnoj bazi imaju zastarjele/placeholder Keycloak UUID-ove.
- **Šta je tim prihvatio:** Kompletne izmjene na svim stranicama, label prikaz iznad filtera, mapiranja vrijednosti, backend ispravke za ime vlasnika i Keycloak 404 handling.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Korisnici u lokalnoj MySQL bazi koji imaju stare Keycloak UUID-ove iz prethodne instance uzrokuju 500 grešku pri dohvatu rola jer Keycloak vraća 404 — riješeno graceful handlingom koji vraća prazan niz umjesto bacanja iznimke.
- **Ko je koristio alat:** Nedim Omanović

---

- **Datum:** 25.05.2026.
- **Sprint broj:** Sprint 9
- **Alat koji je korišten:** Codex / GPT-5
- **Svrha korištenja:** Implementacija i dorada višejezične podrške kroz aplikaciju.
- **Kratak opis zadatka ili upita:** Dorada postojećeg i18n sistema tako da se "Blocked Users" i stranica blokiranih korisnika prevode u skladu sa jezikom iz Settings stranice, uklanjanje izbora jezika sa stranice Moj profil, te ispravka ponašanja Settings stranice tako da se jezik aplikacije promijeni tek nakon klika na "Spremi promjene".
- **Šta je AI predložio ili generisao:**
  - Dodavanje `nav.blockedUsers` prevoda za engleski i bosanski jezik.
  - Lokalizaciju `/blocked-users` stranice, uključujući naslove, dugmad, prazna stanja, validacijske poruke, dijaloge i format datuma.
  - Uklanjanje language selecta sa stranice `/profile`, jer se jezik bira samo u Settings.
  - Ispravku Settings stranice tako da dropdown prikazuje pune nazive jezika (`English/Bosnian` ili `Engleski/Bosanski`) umjesto `en/bs`.
  - Promjenu Settings toka tako da izbor jezika ostane privremen dok korisnik ne klikne `Spremi promjene`.
  - Dopunu unit testova za provjeru prevoda `Blocked Users`.
  - Ispravke povezanih test/build problema: PDF export test za `language` parametar i TypeScript grešku kod `category.description`.
- **Šta je tim prihvatio:** Sve ciljane izmjene za višejezičnu podršku, uklanjanje duplog izbora jezika iz profila, popravljeno ponašanje Settings stranice i dopunjene testove.
- **Šta je tim izmijenio:** Dodatno je zahtijevano da se jezik ne mijenja odmah pri izboru u dropdownu, nego tek nakon spremanja promjena.
- **Šta je tim odbacio:** Dupliranje izbora jezika na više mjesta u aplikaciji.
- **Rizici, problemi ili greške koje su uočene:** Uočeno je da promjena jezika u Settings stranici ranije odmah mijenja globalni jezik bez spremanja, što je moglo dovesti do nekonzistentnog stanja između prikaza aplikacije i spremljenih preferenci. Također su uočeni postojeći build/test problemi koji nisu direktno dio i18n logike, ali su ispravljeni radi prolaska CI provjera.
- **Ko je koristio alat:** Lamija Bojić

---

* **Datum:** 30.05.2026.
* **Sprint broj:** Sprint 10
* **Alat koji je korišten:** Claude (Anthropic) – claude-sonnet-4-6
* **Svrha korištenja:** Implementacija PBI-056 (Evidencija materijala utrošenog na intervenciji) – ispravka i dovršavanje backend implementacije, generisanje korisničkog interfejsa za unos i pregled materijala, implementacija menadžment izvještaja i izrada testova.
* **Kratak opis zadatka ili upita:** Implementacija strukturirane evidencije materijala utrošenog na intervenciji kroz zamjenu postojećeg tekstualnog polja tipiziranom listom materijala, razvoj backend logike za obradu i agregaciju podataka, generisanje frontend komponenti za unos i pregled materijala, implementacija menadžment pregleda potrošnje te izrada testova za implementirane funkcionalnosti.
* **Šta je AI predložio ili generisao:**
  * Ispravku i dovršavanje prvobitne backend implementacije kroz uvođenje modela `MaterialItem`, validaciju podataka i podršku za kompatibilnost sa postojećim zapisima.
  * Implementaciju parsiranja i serijalizacije strukturiranih podataka o materijalima koristeći postojeću baznu kolonu bez potrebe za migracijom baze podataka.
  * Implementaciju API endpointa za prijedloge ranije korištenih materijala na osnovu historijskih podataka kompanije.
  * Implementaciju agregiranog menadžment izvještaja za pregled potrošnje materijala po periodu, kompaniji i kategoriji intervencije.
  * Generisanje kompletne frontend komponente za unos, uređivanje i prikaz liste materijala sa validacijama, automatskim prijedlozima i podrškom za više stavki.
  * Generisanje stranice za menadžment pregled potrošnje materijala sa filterima, statističkim karticama i tabelarnim prikazima agregiranih podataka.
  * Dodavanje potrebnih i18n prevoda i integraciju novih funkcionalnosti u postojeći sistem lokalizacije.
  * Generisanje testova za backend servise, rute, validaciju podataka i frontend funkcionalnosti vezane za evidenciju i pregled materijala.
* **Šta je tim prihvatio:** Backend implementaciju za evidenciju materijala, API funkcionalnosti za sugestije i agregaciju podataka, frontend komponente za unos i pregled materijala, menadžment izvještaje te generisane testove.
* **Šta je tim izmijenio:** Pojedine detalje integracije sa postojećom arhitekturom sistema i prilagodbe korisničkog interfejsa u skladu sa standardima projekta.
* **Šta je tim odbacio:** Kreiranje dodatnih tabela i migracija baze podataka za evidenciju materijala, jer je prihvaćeno rješenje koje koristi postojeću `Report.material` kolonu uz JSON serijalizaciju.
* **Rizici, problemi ili greške koje su uočene:** Potrebno je održavati kompatibilnost sa postojećim izvještajima koji koriste stari tekstualni format materijala. Također je bilo potrebno osigurati validaciju količina, ograničenje broja stavki i konzistentno agregiranje podataka za menadžment izvještaje kako bi se spriječili nekonzistentni ili neispravni podaci u izvještajima.
* **Ko je koristio alat:** Iman Šehić

---

- **Datum:** 31.05.2026.
- **Sprint broj:** Sprint 10
- **Alat koji je korišten:** Claude Sonnet 4.6 (Anthropic)
- **Svrha korištenja:** Implementacija PBI-058 (Eskalacije i komentari ka menadžmentu za rizične intervencije).
- **Kratak opis zadatka ili upita:** Implementacija funkcionalnosti koja koordinatoru omogućava označavanje intervencije kao rizične uz obavezan razlog i komentar, te prikaz eskaliranih intervencija menadžmentu na dashboardu s mogućnošću označavanja kao pregledano.
- **Šta je AI predložio ili generisao:**
  - Prisma migraciju (`20260531100000_add_escalations`) s novom tabelom `InterventionEscalation`.
  - Ažuriranje `schema.prisma` — novi model i relacije na `User` i `Intervention`.
  - Backend modul `escalations.route.ts` s četiri endpointa: kreiranje eskalacije, dohvatanje po intervenciji, označavanje kao pregledano i lista za menadžment dashboard.
  - Registraciju rute u `app.ts` i konstantu u `constants/index.ts`.
  - Frontend servis `escalations.service.ts` za sve API pozive.
  - React komponentu `EscalationSection.tsx` s dijalogom za kreiranje i prikazom statusa eskalacija.
  - Ugradnju `EscalationSection` u stranicu detalja intervencije.
  - Sekciju eskalacija na menadžment dashboardu s toggle-om za prikaz pregledanih.
  - Seed skriptu `seed-escalations.ts` s tri demo eskalacije za testiranje.
  - 50 unit testova u `escalations.route.test.ts` pokrivajući sve acceptance criteria.
- **Šta je tim prihvatio:** Sve generisane fajlove — migraciju, backend modul, frontend komponentu, servis, seed i testove.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** U generisanim testovima nedostajao je `errorMiddleware` u test Express aplikaciji, zbog čega je server vraćao HTML stranicu umjesto JSON odgovora pri greškama, što je uzrokovalo `SyntaxError: Unexpected token '<'` u 19 testova. Dodatno je bio potreban mock za `env` koji `errorMiddleware` interno koristi. Nakon ovih ispravki svi testovi su prošli.
- **Ko je koristio alat:** Lejla Gičević

---

- **Datum:** 01.06.2026.
- **Sprint broj:** Sprint 10
- **Alat koji je korišten:** Claude Sonnet 4.6 (Anthropic)
- **Svrha korištenja:** Implementacija PBI-060 (Evidencija dolaska servisera i vremena na terenu).
- **Kratak opis zadatka ili upita:** Implementacija funkcionalnosti koja serviseru omogućava označavanje trenutka kada je krenuo prema lokaciji, kada je stigao i kada je završio rad na terenu, uz prikaz tih podataka koordinatoru i slanje notifikacija korisniku koji je prijavio kvar.
- **Šta je AI predložio ili generisao:**
  - Ažuriranje `schema.prisma` — tri nova nullable polja na modelu `Intervention`: `dispatchedAt`, `arrivedAt`, `fieldWorkEndedAt`, te dva nova `NotificationType` enuma: `SERVICER_DISPATCHED` i `SERVICER_ARRIVED`.
  - Prisma migraciju (`20260531200000_add_field_time_tracking`) s ALTER TABLE naredbama.
  - Novi backend endpoint `PATCH /:id/field-tracking` u `interventions.route.ts` s validacijom redosljeda akcija i slanjem notifikacija reporteru.
  - Ažuriranje `mapIntervention` funkcije da vraća nova vremenska polja u response-u.
  - Frontend funkciju `updateFieldTracking` u `interventions.service.ts`.
  - Ažuriranje `InterventionDetail` interfacea s novim poljima.
  - React UI karticu "Field Time Tracking" u stranici detalja intervencije s prikazom vremena i kontekstualnim dugmadima za servisera.
  - Ažuriranje `NotificationType` u `notifications.service.ts` s novim tipovima.
  - 8 unit testova u `interventions.route.test.ts` pokrivajući sve acceptance criteria.
- **Šta je tim prihvatio:** Sve generisane izmjene — migraciju, backend endpoint, frontend komponentu i testove.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Tokom Docker builda backend je padao zbog failed migracija uzrokovanih prethodnim `db push` koji je kreirao kolone bez migracijskog fajla. Riješeno ručnim označavanjem migracija kao uspješnih u `_prisma_migrations` tabeli. Tokom merge-a s `develop` granom došlo je do konflikta u `notifications.service.ts` gdje je ostao dupli `;` koji je uzrokovao sintaksnu grešku u CI/CD buildu, te u `page.tsx` gdje je nedostajala zatvarajuća `}` u `handleFieldTracking` funkciji nakon merge-a.
- **Ko je koristio alat:** Dalila Tanković