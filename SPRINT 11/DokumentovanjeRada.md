# Završni izvještaj — Sistem za upravljanje servisnim intervencijama
**Grupa 7**

---

## 1. Svrha projekta

Cilj projekta bio je razvoj web-baziranog sistema za upravljanje servisnim intervencijama namijenjen komunalnim i servisnim preduzećima u Bosni i Hercegovini. Sistem treba zamijeniti nekoordinirane kanale prijave kvarova (telefonski pozivi, ručne evidencije) jednom centralnom platformom koja obuhvata cijeli životni ciklus intervencije — od prijave kvara, kroz dodjelu i praćenje, do zaključivanja i analize.

---

## 2. Problem koji sistem rješava

Komunalna i servisna preduzeća u BiH (vodovod, plin, elektrodistribucija, internet provajderi) suočavaju se s više ključnih operativnih problema:

- **Nekoordinirani kanali prijave** - kvarovi se prijavljuju telefonom, emailom ili usmeno, bez centralnog registra.
- **Spori odzivi na hitne situacije** - bez prioritizacije, hitni kvarovi čekaju red kao i obični.
- **Gubitak informacija** - ručne baze ne prate historiju, izmjene statusa ni ko je radio šta.
- **Otežana koordinacija** - koordinatori nemaju uvid u raspoloživost servisera ni u broj istovremenih intervencija.
- **Nemogućnost analize** - menadžment nema pristup statistikama, prosječnim vremenima rješavanja ni distribuciji po tipovima kvarova.

Sistem rješava sve navedene probleme kroz jedinstven digitalni tok koji podržava sve učesnike procesa.

---

## 3. Glavne korisničke uloge

Sistem podržava sedam jasno definisanih uloga s odvojenim pravima pristupa i ekranima:

| Uloga | Opis |
|---|---|
| **Korisnik** | Prijavljuje kvarove, prati status svojih prijava, ostavlja feedback po završetku intervencije |
| **Serviser** | Pregleda dodijeljene intervencije, ažurira status, unosi izvještaje o obavljenom radu |
| **Koordinator** | Planira i zakazuje intervencije, dodjeljuje servisere, postavlja prioritete, blokira korisnike |
| **KompanijaAdmin** | Upravlja profilom i podacima vlastite kompanije, koordinira unutar kompanije |
| **Menadžment** | Pregleda dashboard statistike, eskalirane intervencije i izvještaje za donošenje odluka |
| **SupportAgent** | Obrađuje tikete podrške, komunicira s korisnicima unutar tiket sistema |
| **Admin** | Kreira i deaktivira korisničke račune, upravlja kategorijama, SLA konfiguracijom i sistemskim postavkama |

---

## 4. Glavne implementirane funkcionalnosti

### 4.1 Autentikacija i upravljanje korisnicima
- Registracija korisnika s dodjelom uloge
- Prijava putem Keycloak identity provajdera (JWT / OAuth2 / OIDC)
- Reset lozinke putem Gmail API (OAuth2, jednokratni vremenski ograničeni tokeni)
- Upravljanje korisničkim profilom
- Administrativno upravljanje računima (kreiranje, deaktivacija, dodjela uloga)
- Role-Based Access Control (RBAC) na svim rutama

### 4.2 Prijava i upravljanje kvarovima
- Obrazac za prijavu kvara s kategorijom, lokacijom i opisom (dostupno i neprijavljenim korisnicima)
- Detekcija potencijalnih duplikata pri prijavi — upozorenje, ne blokada
- Kategorije i tipovi kvarova — administrativno upravljanje

### 4.3 Upravljanje intervencijama
- Planiranje i zakazivanje intervencija od strane koordinatora
- Dodjela jednog ili više servisera intervenciji
- Postavljanje i izmjena prioriteta (LOW / MEDIUM / HIGH / CRITICAL)
- Praćenje i izmjena statusa (NEW → ASSIGNED → IN_PROGRESS → ON_HOLD → RESOLVED / CANCELLED / REJECTED)
- Historija svih promjena statusa s vremenskom oznakom i korisnikom
- Masovne akcije nad intervencijama (atomarno izvršavanje)
- Pauziranje intervencije zbog blokera
- Eskalacije rizičnih intervencija prema menadžmentu
- Zahtjev za ponovno otvaranje završene intervencije

### 4.4 Operativni alati
- Pregled liste aktivnih intervencija s filterima i rangiranjem po prioritetu
- Evidencija izvještaja o intervenciji (opis radova, utrošeni materijal)
- Komentari na intervencijama
- Upravljanje attachmentima (lokalno čuvanje s planom migracije na Cloudflare R2)
- Kalendarski prikaz intervencija
- Geografski/mapski prikaz intervencija s markerima
- Export podataka u PDF format

### 4.5 Notifikacije i komunikacija
- In-app notifikacije u realnom vremenu putem Socket.IO (WebSocket)
- 19 tipova notifikacija (nova dodjela, promjena statusa, feedback, eskalacija itd.)
- Tiket sistem za podršku s dvosmjernom komunikacijom
- Notifikacije za tiket sistem

### 4.6 Planiranje i analitika
- Planirana/preventivna održavanja s automatskim generisanjem periodičnih intervencija (dnevno, sedmično, mjesečno)
- SLA konfiguracija — rokovi po prioritetu s praćenjem kašnjenja
- Upravljanje dostupnošću i odsustvima servisera
- Evidencija dolaska servisera i vremena na terenu
- Digitalna potvrda izvršene intervencije (PIN / potpis)
- Menadžment dashboard s ključnim statistikama

### 4.7 Korisnički servis i unapređenja
- Feedback korisnika po završetku intervencije (ocjena 1–5, opcionalni komentar, jednokratan unos)
- Analitika feedbacka i kvaliteta usluge
- Baza znanja s preporučenim rješenjima za kvarove
- Potvrda i pomijeranje termina intervencije od strane korisnika
- Blokiranje korisnika od strane koordinatora
- Višejezična podrška (bosanski i engleski) s fallback mehanizmom
- Settings stranica s korisničkim i jezičkim preferencijama
- Upravljanje kompanijama i uloga KompanijaAdmin
- Audit log svih akcija u sistemu

---

## 5. Pregled rada kroz sprintove

### Sprint 1–4: Priprema i arhitektura
Prva četiri sprinta posvećena su isključivo planiranju i tehničkom postavljanju projekta, bez implementacije funkcionalnosti. Definirani su: product vision, product backlog s 15+ PBI stavki, stakeholder mapa, arhitekturni pregled, domain model, use case dijagrami, risk register, test strategija, Definition of Done, inicijalni release plan i tehnički setup (struktura repozitorija, GitFlow branching strategija, Docker Compose, CI/CD pipeline).

### Sprint 5: Tehnički temelj i core funkcionalnosti
**Cilj:** Infrastrukturni preduvjeti i osnovni korisnički tokovi.

Završeno: Prisma migracije, seed podaci, centralizovano logovanje, globalni error handler, auth middleware, validacija (Zod), rate limiting, registracija, login, prijava kvara, kategorije kvarova, SLA konfiguracija.

Nije završeno: Reset lozinke (PBI-019) — tehnički implementiran, ali blokiran nedostupnim SMTP-om na Railway free planu.

Product Owner ocjena: maksimum bodova.

### Sprint 6: Operativno jezgro sistema
**Cilj:** Upravljanje intervencijama, dodjela servisera, admin funkcionalnosti.

Završeno: Planiranje intervencija, prioriteti, dodjela servisera, pregled aktivnih intervencija, historija, upravljanje korisničkim računima, komentari, attachmenti.

Nije završeno: Sprint Retrospective i Test Proof dokumentacija.

Product Owner ocjena: 75% bodova (zbog nedostatka dokumentacije).

### Sprint 7: Dashboard, profili, kompanije, izvještaji
**Cilj:** Menadžment alati i prošireno upravljanje korisnicima.

Završeno: Menadžment dashboard, upravljanje korisničkim profilom, reset lozinke (konačno riješen SMTP), kalendarski prikaz intervencija, upravljanje kompanijama i uloga KompanijaAdmin, evidencija izvještaja o intervenciji.

Nije završeno: Ništa — sve planirane stavke završene.

### Sprint 8: Notifikacije, mapa, tiket sistem, export
**Cilj:** Komunikacijski alati i napredne operativne funkcionalnosti.

Završeno: In-app notifikacije (Socket.IO), preventivna održavanja s automatskim generisanjem, detekcija duplikata, tiket sistem s dvosmjernom komunikacijom, mapski prikaz, export u PDF, masovne akcije.

Nije završeno: Ništa — sve planirane stavke završene. Identifikovan bug s prikazom ID-eva umjesto naziva u filterima mape (zakrpan u Sprint 9).

### Sprint 9: I18n, feedback, blokiranje, settings
**Cilj:** Korisničko iskustvo i operativne kontrole.

Završeno: Višejezična podrška (BS/EN s fallback mehanizmom), feedback korisnika, blokiranje korisnika od strane kompanije, Settings stranica s role-based prečicama.

Nije završeno: Ništa — sve planirane stavke završene.

### Sprint 10: Napredne operativne funkcionalnosti
**Cilj:** Eskalacije, dostupnost servisera, evidencija materijala, baza znanja.

Završeno: Analitika feedbacka, upravljanje dostupnošću servisera, potvrda/pomijeranje termina, baza znanja, evidencija utrošenog materijala, eskalacije, zahtjev za ponovnim otvaranjem, evidencija dolaska servisera, digitalna potvrda, pauziranje intervencije.

Nije završeno: Sprint Review dokument nije kreiran.

---

## 6. Status implementiranih stavki

### Potpuno završeno 
Gotovo sve planirane stavke iz product backloga su implementirane i demonstrirane. To uključuje svih 15 originalnih PBI stavki plus brojne dodatne stavke dodane kroz sprintove (PBI-016 do PBI-062).

### Djelimično završeno 
- **Validacija JWT potpisa** — backend provjerava prisustvo tokena, ali kriptografska validacija potpisa nije bila eksplicitno implementirana u ranim sprintovima (identifikovano u Sprint 5 retrospektivi kao tehnički dug).
- **Cloud file storage** — planirana migracija na Cloudflare R2 nije realizovana; fajlovi se čuvaju lokalno u `backend/uploads/`.
- **Evidencija materijala (PBI-056)** — implementirana bez posebne tabele; materijali se čuvaju kao JSON tekst u postojećoj koloni izvještaja (svjesna kompromisna odluka).
- **"Siroče" Keycloak korisnici** — ako registracija padne nakon kreiranja korisnika u Keycloaku, lokalni zapis ne postoji. Automatsko čišćenje nije implementirano.
- **Model izvještaja** — nema polje za datum zadnje izmjene.

### Nije završeno 
- Export nije proširen van PDF formata (CSV, Excel eksplicitno van MVP scope-a).
- Automatizovani SMS/email notifikacije za statusne promjene (van MVP scope-a, in-app notifikacije isporučene).
- Grafički prikazi na menadžment dashboardu (eksplicitno van MVP scope-a, tabelarni prikaz implementiran).
- Integracija s eksternim sistemima komunalnih preduzeća (van MVP scope-a).

---

## 7. Glavne tehničke odluke

### Monolitna modularna arhitektura umjesto mikroservisa
Odabrana zbog funkcionalne povezanosti domena (kvarovi, intervencije, serviseri), smanjene infrastrukturne kompleksnosti i lakšeg testiranja u ranoj fazi projekta. Arhitektura je dizajnirana s jasnim modulima koji omogućavaju kasniju evoluciju prema mikroservisima.

### Next.js 15 + React 19 za frontend
App Router pristup omogućio je čistu organizaciju po ulogama (admin, koordinator, serviser, korisnik) s route-based zaštitom ruta i server-side rendering gdje je to potrebno.

### Express.js + TypeScript + Prisma ORM za backend
26 domenskih modula s jasnom strukturom (ruta + schema + servis) i dijeljenim middleware-om. Prisma je dala tipiziran pristup MySQL bazi i ubrzala razvoj eliminacijom ručnog SQL-a.

### Keycloak 26 kao identity provider
Umjesto lokalnog čuvanja lozinki i implementacije autentikacije od nule, odabran je Keycloak koji centralizuje upravljanje korisnicima, podržava OAuth2/OIDC i nudi gotovu password policy. Ovo je zahtijevalo značajan trud pri konfiguraciji, ali je osiguralo sigurniju i skalabilniju autentikaciju.

### Socket.IO za real-time notifikacije
WebSocket konekcija omogućila je in-app notifikacije bez potrebe za osvježavanjem stranice. Sistem podržava ciljano slanje po korisničkom ID-u, po ulozi i po tiket sobi.

### GitFlow branching strategija
`master` (stabilan) + `develop` (integracioni) + `feature/*`, `fix/*`, `release/*`, `hotfix/*`. CI/CD pipeline na GitHub Actions s automatskim deployem frontend-a na Cloudflare Pages i backend-a na Railway.

### Zod za validaciju
Centralizovana Zod validacija svih request tijela eliminisala je raštrkan validation kod i osigurala konzistentan anti-XSS sloj kroz `safeTextField()` funkciju.

### In-app notifikacije kao jedini kanal u MVP-u
Eksterna SMS/email obavještenja za statusne promjene odgođena su za post-MVP fazu; Gmail API je korišten samo za reset lozinke. Ovo je svjesna kompromisna odluka dokumentovana u Decision logu.

---

## 8. Najveći problemi tokom razvoja i način rješavanja

### Problem 1: SMTP blokada na Railway free planu
Reset lozinke je bio tehnički gotov u Sprintu 5, ali Railway free plan ne podržava SMTP. Problem je otkriven kasno u sprintu. Riješen u Sprintu 7 prelaskom na Gmail API s OAuth2 autentikacijom koji radi unutar ograničenja platforme.

**Lekcija:** Infrastrukturna ograničenja eksternih servisa moraju se testirati na početku sprinta, ne pri kraju.

### Problem 2: Keycloak integracija od nule
Auth model nije bio zaključan pri početku Sprinta 5. Tim je morao istovremeno donijeti odluke o provajderu identiteta, pohrani tokena, zaštiti ruta i izvorima uloga. Riješeno kroz 19 Decision Log unosa koji su dokumentovali svaku odluku i razlog, uz idempotentnu seed skriptu koja je olakšala resetovanje lokalnih okruženja.

### Problem 3: Sinkronizacija frontend/backend pri dodjeli servisera
Prikaz dodijeljenih servisera nije bio ažuran u korisničkom interfejsu. Riješeno jasnom definicijom kad se status automatski mijenja (`NEW → ASSIGNED` pri prvoj dodjeli, `ASSIGNED → NEW` pri uklanjanju zadnjeg servisera) i dogovorom da se modal osvježava pri svakom otvaranju.

### Problem 4: Višejezična podrška trajala duže od planiranog
Prijevod svih UI elemenata bez parcijalnih prijevoda bio je zahtjevniji od procjene. Riješeno implementacijom fallback mehanizma na engleski koji je osigurao funkcionalno korisničko iskustvo čak i pri nepotpunim prijevodima, što je skratilo neophodan obim prijevoda za isporuku.

### Problem 5: Greške u AI-generiranom kodu
Tim je koristio AI alate (GitHub Copilot, Claude, ChatGPT, Gemini) za ubrzanje razvoja. Identifikovano je 12 konkretnih grešaka: pogrešan redoslijed koda u `reports.route.ts`, duple rute s istim URL obrascem, testovi koji su padali zbog nedostajućih mock funkcija za Keycloak, nekompatibilne verzije paketa, sintaksne greške pri spajanju koda. Svaka greška je dokumentovana u AI Usage Logu. Uspostavljen je standard: nijedan AI-generisani kod nije prihvaćen bez code reviewa.

### Problem 6: Nedostajuća dokumentacija sprinta (Sprint 6)
Sprint Retrospective i Test Proof nisu završeni na vrijeme, što je rezultiralo odbitkom bodova (75% umjesto 100%). Riješeno uspostavljanjem pravila da se dokumentacija priprema paralelno s implementacijom, a ne nakon.

### Problem 7: Kompleksnost Sprint 10 (10 PBI stavki)
Sprint 10 je imao najambiciozniji scope s 10 PBI stavki koje su bile međusobno zavisne. Riješeno pažljivim koordinisanjem implementacijskog redoslijeda i kraćim tehničkim sync sastancima unutar sprinta.

---

## 9. Šta bi tim unaprijedio da se projekat nastavlja

### Tehnička unapređenja

**Kriptografska validacija JWT potpisa** — backend trenutno provjerava prisustvo tokena, ali ne i digitalni potpis. Ovo je evidentiran tehnički dug koji bi bio prioritet u narednom sprintu.

**Migracija file storage-a na Cloudflare R2** — lokalno čuvanje fajlova (`backend/uploads/`) nije skalabilno u produkcijskom okruženju. Plan migracije je definisan u arhitekturnom dokumentu i spreman za implementaciju.

**Model izvještaja** — dodati polje `updatedAt` za bolju historijsku evidenciju.

**Separacija SLA validacijske logike** — dio validacijske logike za SLA ostao je na starom mjestu jer refaktor nije bio spreman za spajanje. Potrebno centralizovati.

**Paginacija na svim listama** — pri većem broju intervencija performanse mogu opasti. Svaka lista treba server-side paginaciju.

### Funkcionalna unapređenja

**Notifikacije za menadžment pri eskalacijama** — eskalacije su implementirane, ali push notifikacija menadžmentu nije. Ovo bi direktno poboljšalo reakciono vrijeme.

**Grafički prikazi na menadžment dashboardu** — tabelarni prikaz isporučen u MVP-u, ali grafovi (trend kvarova, distribucija po kategorijama, SLA usklađenost) bili bi značajna dodana vrijednost.

**Export u CSV/Excel format** — korisnici s analitičkim potrebama često preferiraju tabele nad PDF-om.

**SLA scheduler i automatska upozorenja** — SLA konfiguracija je implementirana, ali automatski scheduler koji bi generisao upozorenja pri kašnjenju nije bio u MVP scope-u.

**Automatizovana raspodjela intervencija** — koordinator trenutno ručno dodjeljuje servisere. Algoritam koji bi preporučio servisera na osnovu lokacije, dostupnosti i opterećenja bio bi sljedeći logični korak.

**Mobilni interfejs za terenske servisere** — web aplikacija je responsivna, ali namjenski mobilni interfejs ili PWA s offline podrškom bi značajno poboljšao iskustvo servisera na terenu s lošom mrežnom vezom.

**Integracijski sloj s eksternim sistemima** — arhitektura je dizajnirana s integracionim slojem koji bi omogućio povezivanje s ERP sistemima komunalnih preduzeća. Ovo je eksplicitno ostavljeno za post-MVP fazu.

### Procesna unapređenja

**Ranije testiranje infrastrukturnih ograničenja** — iskustvo s SMTP-om pokazalo je da se ograničenja hosting platformi moraju testirati na početku sprinta, ne pri kraju.

**Paralelna izrada dokumentacije** — dokumentacija je u nekim sprintovima kasnila za implementacijom. Pravilo "PR koji mijenja implementiranu arhitekturu mora ažurirati i relevantan dokument" uspostavljeno je, ali primjena nije bila konzistentna.

**Regresiono testiranje suite** — tim je pisao testove po sprintovima, ali sveobuhvatni regresioni test suite koji pokriva sve module nije konsolidovan. Sa 26 backend modula i 22 frontend stranice, ovo postaje kritično.

---

