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
- **Ko je koristio alat:** Razvojni tim //fixxxxx

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
