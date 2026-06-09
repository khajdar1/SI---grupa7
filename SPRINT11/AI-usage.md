# 9. Final AI Usage Summary

## Pregled korištenja AI alata kroz projekt

Tim je aktivno koristio AI alate tokom Sprinta 5, 6, 7, 9 i 10. U nastavku je pregled toga šta smo koristili, šta smo prihvatili, šta smo mijenjali i koje greške smo uočili.

---

## 9.1 Korišteni alati

| Alat | Verzija / Model | Korišten od strane |
|---|---|---|
| GitHub Copilot | GPT-5.2-Codex, GPT-5.3-Codex, GPT-5.4 mini | Kerim Hajdar, Ismail Mujanović, Lamija Bojić |
| Claude (Anthropic) | claude-sonnet-4-6 | Nedim Omanović, Lejla Gičević, Iman Šehić, Lamija Bojić |
| Google Gemini | Antigravity AI | Iman Šehić, Nedim Omanović |
| ChatGPT / GPT-4 | OpenAI Codex | Dalila Tanković, Lejla Gičević |
| OpenCode | DeepSeek V4, deepseek-v4-flash | Ismail Mujanović |

---

## 9.2 Za šta je AI korišten

AI alati su korišteni u gotovo svim dijelovima razvoja, uključujući:

- **Pisanje backend koda koji se ponavlja** — servisi, rute, validacija podataka, modeli baze i migracije.
- **Postavljanje obrazaca za bolji kod** — struktura servisa koja se lakše testira, praćenje promjena u sistemu.
- **Spajanje s vanjskim servisima** — Keycloak (registracija, prijava, odjava, provjera uloga), deploy na Cloudflare Pages, automatski build na GitHubu.
- **Razvoj sučelja** — React komponente (komentari, dodjela servisera, eskalacije, kalendar, prikaz prioriteta), prevodi na bosanski i engleski.
- **Pisanje testova** — testovi za backend servise i rute, testovi za frontend komponente.
- **Traženje grešaka** — dijagnoza grešaka koje nismo mogli sami brzo pronaći.
- **Poboljšanje postojećeg koda** — premještanje validacije na pravo mjesto, uklanjanje duplog koda.
- **DevOps** — Docker konfiguracija, provjera zdravlja aplikacije, praćenje zahtjeva.

---

## 9.3 Šta je prihvaćeno

Generalno, tim je prihvatio:

- Kompletne backend servise i rute kada je AI pratio obrasce koje smo već imali u projektu.
- Testove koji su pokrivali ono što smo trebali testirati prema zahtjevima.
- Prijedloge za bolju strukturu koda koji su ga učinili lakšim za testiranje.
- Keycloak integraciju i Docker konfiguraciju uz manje izmjene.
- Frontend komponente koje su bile usklađene s postojećim izgledom aplikacije.
- Ispravke za build na Cloudflare Pages.
- Prevode korisničkog sučelja.

---

## 9.4 Šta je izmijenjeno

Tim je redovno prilagođavao AI prijedloge kontekstu projekta:

- **Nazivi i struktura** — Nazivi modela i vrijednosti prilagođeni da odgovaraju onome što već imamo (npr. `service-system` umjesto `servisni-sistem`, naziv za vanjski identitet korisnika da ne bude vezan za jednog pružatelja).
- **Poslovna logika** — Dodjela servisera proširena da automatski mijenja status intervencije (`NEW → ASSIGNED` i obratno); provjera uloga proširena i na admina gdje je to bilo potrebno.
- **Ulazni podaci** — Blokiranje korisnika promijenjeno da prima korisničko ime umjesto internog ID broja, jer koordinator ne zna interni ID.
- **Validacija** — Ručno uneseni brojevi zamijenjeni stvarnim vrijednostima; dodani slučajevi koje AI nije pokrio.
- **Sučelje** — Ispravljene CSS klase koje nisu postojale (`icon-bg-violet` → `icon-bg-purple`), navigacijski elementi premješteni da se ne preklapaju, nazivi promijenjeni radi usklađenosti (`Upravljačka tabla` → `Management`).
- **Rezervne vrijednosti** — Dodate rezervne vrijednosti na mjestima gdje AI nije predvidio da podaci mogu biti prazni.
- **Verzija u buildu** — Prihvaćen način da build dobije ime po kratkom hash-u commita kada nema taga.
- **Konfiguracija testova i builda** — Test alat (Vitest) nadograđen radi kompatibilnosti s novim Node.js-om; dodata zavisnost koja je nedostajala; skripta premještena da ne pada u okruženju bez baze podataka.

---

## 9.5 Šta je odbačeno

- **Čuvanje lozinki u lokalnoj bazi** — AI je u početku predlagao da čuvamo lozinke direktno; tim je odbacio sve takve prijedloge jer koristimo Keycloak za to.
- **Trajno brisanje korisnika** — Korisnici se samo deaktiviraju kako bi historija ostala sačuvana.
- **Naprednija provjera zdravlja sistema** — Prihvaćena je samo provjera aplikacije i baze podataka; praćenje svih servisa odbačeno za ovu fazu.
- **Praćenje svih uspješnih zahtjeva** — Odlučeno je da se prate samo greške i važni događaji.
- **Preširoke izmjene sučelja** — AI je ponekad predlagao preuređivanje čitavih stranica; tim je zadržao samo ono što je bilo potrebno za konkretnu funkcionalnost.
- **Dvostruki podaci za prijavu** — Odbačeni podaci u bazi koji su duplirali informacije koje ionako čuvamo na drugom mjestu.
- **Trajna promjena HTTP statusa za greške validacije** — Privremena izmjena statusa odbačena za produkcijski kod.
- **Nova tabela za evidenciju materijala** — Iskorištena je postojeća kolona uz čuvanje podataka kao tekst u JSON formatu.
- **Automatske obavijesti pri dodjeli servisera** — Odbačeno jer zavisi od dijela sistema koji još nije bio napravljen.

---

## 9.6 Greške koje je AI napravio

Sljedeće greške su pronađene u kodu koji je AI generisao i ispravljene od strane tima:

| Greška | Opis | Sprint |
|---|---|---|
| **Pogrešan redosljed koda** | U `reports.route.ts` jedan red je bio napisan prije nego što je router uopšte bio definisan, što je rušilo aplikaciju pri pokretanju | Sprint 7 |
| **Router spojen na krivu adresu** | Ruter za izvještaje bio je registrovan na pogrešnoj URL adresi, zbog čega je svaki zahtjev vraćao grešku 404 | Sprint 7 |
| **Testovi padali zbog loše konfiguracije** | AI nije dodao lažne funkcije za Keycloak i bazu u testnom okruženju, pa su testovi dobijali HTML stranicu umjesto JSON odgovora | Sprint 7, Sprint 10 |
| **Dvije rute s istom adresom** | Dvije rute su imale isti URL obrazac, što je uzrokovalo da se pozivi šalju na krivu rutu | Sprint 10 |
| **Greška tipa podataka** | Određeni tip podataka nije mogao biti direktno pretvoren u drugi, morali smo dodati privremeno zaobilazno rješenje | Sprint 7 |
| **Pogrešna verzija paketa** | AI je predložio verziju alata koja zahtijeva noviji Node.js nego što ga naš server za automatski build ima | Sprint 7 |
| **Skripta pokvarila automatski build** | AI je predložio da se Prisma generiše pri svakoj instalaciji paketa, ali to ne radi u okruženju bez baze podataka | Sprint 7 |
| **Greška u kodu — vraćao objekat umjesto liste** | Jedan dio koda je vraćao objekat umjesto liste, što je rušilo stranicu za registraciju | Sprint 5 |
| **Keycloak vraćao grešku za stare korisnike** | Kod nije predvidio da Keycloak može vratiti 404 za stare korisnike, što je rušilo čitav zahtjev | Sprint 9 |
| **Sintaksne greške nakon spajanja koda** | U dva fajla su ostali dupli znakovi i nedostajuće zagrade zbog kojih automatski build nije prolazio | Sprint 10 |
| **Nedostajuća biblioteka nakon nadogradnje** | Nakon nadogradnje test alata, AI nije napomenuo da treba dodati još jednu biblioteku | Sprint 9 |
| **Fajlovi nisu bili sačuvani u git** | Dvije stranice nisu bile commitane u git i morale su biti ponovo napravljene | Sprint 6 |

---

## 9.7 Dijelovi sistema razvijeni uz AI pomoć koji zahtijevaju posebnu pažnju

Sljedeće oblasti su u velikoj mjeri razvijene uz pomoć AI-ja. Svaki član tima koji je odgovoran za određeni modul mora ga moći samostalno objasniti.

### 9.7.1 Prijava i provjera uloga korisnika (Keycloak)
- **Fajlovi:** `auth.service.ts`, `auth.middleware.ts`, `keycloak.client.ts`, `middleware.ts` (Next.js)
- **Što treba znati:** Kako funkcioniše registracija korisnika kroz Keycloak, kako se čitaju uloge iz tokena, zašto se koriste kolačići umjesto localStorage za provjeru na serveru, kako funkcioniše odjava s poništavanjem tokena.
- **Što još nije riješeno:** Ako registracija padne nakon što je korisnik već kreiran u Keycloaku, taj korisnik ostaje "siroče" bez lokalnog zapisa — nije implementirano automatsko čišćenje. Provjera uloga poziva Keycloak pri svakom zahtjevu, što usporava testove.

### 9.7.2 Automatski build i deploy
- **Fajlovi:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `wrangler.toml`
- **Što treba znati:** Razlika između `ci.yml` (provjera koda pri svakom pull requestu) i `release.yml` (pravi build i deploy), kako se generišu nazivi verzija, zašto svaka dinamička stranica mora imati `export const runtime = 'edge'` za Cloudflare Pages, ograničenje na Node 20 zbog alata za deploy.
- **Rizik:** Adrese backend API-ja moraju biti postavljene u Cloudflare i Railway okruženju ili frontend neće moći komunicirati s backendom.

### 9.7.3 Baza podataka — struktura i početni podaci
- **Fajlovi:** `schema.prisma`, `seed.ts`, sve datoteke u `prisma/migrations/`
- **Što treba znati:** Kako funkcionišu migracije baze, razlika između `prisma migrate dev` i `prisma db push` i kada se koji koristi, zašto se materijali čuvaju kao tekst u JSON formatu u postojećoj koloni umjesto u posebnoj tabeli, kako seed skripta radi tako da se može pokrenuti više puta bez duplikata.
- **Što još nije riješeno:** Model za izvještaje nema polje za datum zadnje izmjene. Stari korisnici bez veze na Keycloak zapis mogu uzrokovati greške i trebaju ručnu provjeru.

### 9.7.4 SLA konfiguracija — rokovi po prioritetu
- **Fajlovi:** `sla.service.ts`, `sla.validators.ts`, `sla.service.test.ts`, `/admin/sla-config/page.tsx`
- **Što treba znati:** Kako se izračunava da li je intervencija zakasnila (datum kreiranja + SLA rok za prioritet) bez promjene statusa intervencije. Prikaz grešaka na frontendu čita tekst greške s backenda i prema tome odlučuje šta prikazati — ako se poruke promijene, prikaz može biti pogrešan.
- **Što još nije riješeno:** Dio logike za greške validacije ostao je na starom mjestu jer refaktor nije bio spreman za spajanje.

### 9.7.5 Dodjela servisera
- **Fajlovi:** `assignment.service.ts`, `assignment.route.ts`, `AssignerModal.tsx`
- **Što treba znati:** Kako se serviseri dodjeljuju intervenciji, zašto se status automatski mijenja pri dodjeli (`NEW → ASSIGNED`) i pri uklanjanju zadnjeg servisera (`ASSIGNED → NEW`). Serviseri se sortiraju po broju trenutno aktivnih intervencija. Prikaz u modalu se osvježava samo pri otvaranju, ne u stvarnom vremenu.

### 9.7.6 Upravljanje korisnicima kroz admin panel
- **Fajlovi:** `user-management.service.ts`, rute za `/users`, admin ekran
- **Što treba znati:** Kako admin kreira i deaktivira korisnike, kako se te izmjene reflektuju i u Keycloaku, zašto trajno brisanje nije implementirano, kako je spriječeno da admin deaktivira ili obriše vlastiti nalog ili korisnika koji ima aktivne intervencije.

### 9.7.7 Evidencija materijala (PBI-056)
- **Fajlovi:** proširenje `Report` modela, backend za dohvat podataka, frontend forma
- **Što treba znati:** Zašto nema posebne tabele za materijale i kako se podaci čuvaju kao JSON tekst u postojećoj koloni. Kod mora podržavati i stari tekstualni format i novi format s listom stavki, jer u bazi postoje oba.

### 9.7.8 Eskalacije (PBI-058)
- **Fajlovi:** `escalations.route.ts`, `EscalationSection.tsx`, `escalations.service.ts`, `seed-escalations.ts`
- **Što treba znati:** Kako koordinator označava intervenciju kao rizičnu, kako menadžment vidi te intervencije na dashboardu. Testovi su u početku padali jer im je nedostajao dio konfiguracije koji obrađuje greške — dodano kao ispravka.

### 9.7.9 Menadžment dashboard
- **Fajlovi:** `management.service.ts` (backend), `management/page.tsx` (frontend)
- **Što treba znati:** Kako se računaju statistike aktivnih i završenih intervencija, zašto prosječno vrijeme rješavanja može biti prikazano kao "nema podataka" (nema završenih intervencija), kako funkcioniše prikaz broja intervencija po svakom prioritetu.

### 9.7.10 Blokiranje korisnika (PBI-039)
- **Fajlovi:** `blocking.route.ts`, `blocked-users/page.tsx`, `blocking.service.ts`
- **Što treba znati:** Koordinator blokira korisnika unosom korisničkog imena (ne internog ID broja). Backend sam pronalazi ID na osnovu korisničkog imena. Provjera blokade radi se pri svakoj novoj prijavi kvara. Koordinator može blokirati korisnika i direktno iz stranice detalja intervencije.

---

## 9.8 Opći zaključci

AI alati su nam pomogli da brže napišemo dijelove koda koji se ponavljaju, posebno testove i backend rute. Međutim, tim je morao redovno ispravljati greške u generisanom kodu, posebno:

- **Pogrešno spajanje ruta** — nekoliko puta se desilo da router bude registrovan na krivoj adresi.
- **Nepotpuna konfiguracija testova** — AI često nije dodavao lažne funkcije za vanjske servise poput Keycloaka i baze.
- **Nekompatibilne verzije paketa** — AI je predlagao verzije koje nisu radile s našim okruženjem.
- **Greške pri spajanju koda s različitih grana** — AI nije uzimao u obzir da drugi članovi tima rade paralelno na istim fajlovima.

Važna napomena: nijedan AI-generisani kod nije prihvaćen bez pregleda od strane člana tima. Sve izmjene, odbačeni prijedlozi i pronađene greške su zapisani u AI usage logu po sprintovima.
