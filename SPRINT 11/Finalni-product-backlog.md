# PRODUCT BACKLOG

**Sistem za upravljanje servisnim intervencijama | v3.1**

---

## INFORMACIJE O PROJEKTU

| | |
|---|---|
| **Naziv projekta** | Sistem za upravljanje servisnim intervencijama |
| **Product Owner** | Kenan Halilović |
| **Scrum Master** | Kerim Hajdar |
| **Verzija backloga** | v3.0 |
| **Datum kreiranja** | 29.3.2026. |
| **Posljednje ažuriranje** | 08.06.2026. |

---

## PREGLED IZMJENA — v3.0
 
| PBI ID | Opis izmjene / razlog |
|--------|----------------------|
| PBI-041 | Novi PBI: Inicijalna Prisma migracija za trenutne modele — Sprint 5 |
| PBI-042 | Novi PBI: Početni seed podaci za razvoj i demo — Sprint 5 |
| PBI-044 | Novi PBI: Osnovno centralizirano logovanje i health nadzor — Sprint 6 |
| PBI-045 | Novi PBI: Globalni exception handler i standardizacija API grešaka — Sprint 5 |
| PBI-046 | Novi PBI: Middleware za autorizaciju i zaštitu ruta — Sprint 5 |
| PBI-047 | Novi PBI: Centralizovana validacija zahtjeva i DTO schema sloj — Sprint 5 |
| PBI-048 | Novi PBI: Rate limiting za javne i auth endpointe — Sprint 5 |
| PBI-051 | Novi PBI: Settings stranica i upravljanje korisničkim preferencijama — Sprint 9 |
| PBI-052 | Novi PBI: Analitika feedbacka i kvaliteta usluge — Sprint 10 |
| PBI-053 | Novi PBI: Upravljanje dostupnošću i odsustvima servisera — Sprint 10 |
| PBI-054 | Novi PBI: Potvrda i promjena termina od strane korisnika — Sprint 10 |
| PBI-055 | Novi PBI: Baza znanja i preporučena rješenja za kvarove — Sprint 10 |
| PBI-056 | Novi PBI: Evidencija materijala utrošenog na intervenciji — Sprint 10 |
| PBI-058 | Novi PBI: Eskalacije i komentari ka menadžmentu za rizične intervencije — Sprint 10 |
| PBI-059 | Novi PBI: Zahtjev za ponovno otvaranje završene intervencije — Sprint 10 |
| PBI-060 | Novi PBI: Evidencija dolaska servisera i vremena na terenu — Sprint 10 |
| PBI-061 | Novi PBI: Digitalna potvrda izvršene intervencije — Sprint 10 |
| PBI-062 | Novi PBI: Pauziranje intervencije zbog blokera — Sprint 10 |
 
---
---

## BACKLOG STAVKE

| ID | Naziv stavke | Opis | Tip | Prioritet | Složenost | Status | Sprint/Release | Napomena |
|----|-------------|------|-----|----------|-----------|--------|----------------|----------|
| PBI-001 | Registracija korisnika | Kreiranje korisničkog računa. Neprijavljeni korisnik može izvršiti samoregistraciju, pri čemu mu se automatski dodjeljuje uloga Gost/Korisnik. Admin može kreirati račune za zaposlene i direktno ih dodijeliti odgovarajućoj firmi/organizaciji te im dodijeliti odgovarajuću ulogu. | Feature | Kritičan | 5 SP | Done | Sprint 5 | Dvije putanje: samoregistracija (uloga Gost/Korisnik) i admin kreiranje računa (sve uloge, dodjela firme) |
| PBI-002 | Prijava u sistem (Login) | Autentifikacija korisnika putem korisničkog imena i lozinke, upravljanje sesijom i sigurna odjava. | Feature | Kritičan | 4 SP | Done | Sprint 5 | Preduvjet za sve ostale funkcionalnosti |
| PBI-003 | Prijava kvara od strane korisnika | Obrazac za prijavu kvara: odabir firme iz liste, automatsko određivanje lokacije, opis problema, lista predefinisanih kvarova, kategorija usluge uz mogućnost dodavanja slika ili dokumenata. Kvar se automatski bilježi kao nova intervencija. | Feature | Kritičan | 5 SP | Done | Sprint 5 | Dostupno prijavljenim i neprijavljenim korisnicima; hitne intervencije imaju predefinisane šablone |
| PBI-004 | Planiranje intervencija | Koordinator kreira i zakazuje intervenciju na osnovu prijavljenog kvara, unosi detalje i vremenski okvir. | Feature | Kritičan | 5 SP | Done | Sprint 6 | |
| PBI-005 | Prioritet intervencije, SLA i upozorenja o kašnjenju | Koordinator dodjeljuje prioritet (hitan, visok, normalan, nizak) intervenciji. Admin konfigurira SLA rokove po prioritetu. Sistem automatski generira upozorenje kada SLA rok prođe. | Feature | Visok | 6 SP | Done | Sprint 6 | Objedinjuje prioritet, SLA konfiguraciju i upozorenja; SLA konfiguracija kao preduvjet implementirana u Sprint 5 (PBI-035) |
| PBI-006 | Dodjela servisera i pregled dostupnosti | Koordinator dodjeljuje jednog ili više servisera intervenciji; lista servisera sortirana po broju aktivnih intervencija. | Feature | Visok | 4 SP | Done | Sprint 6 | Koordinator može dodijeliti intervenciju bilo kojem serviseru |
| PBI-007 | Pregled liste aktivnih intervencija | Koordinator i menadžment pregledaju sve aktivne intervencije rangirane po prioritetu, s filterima po statusu, tipu i dodjeljnosti. | Feature | Visok | 5 SP | Done | Sprint 6 | Rangiranje po prioritetu je ključni zahtjev |
| PBI-008 | Praćenje i izmjena statusa intervencije | Koordinator i serviser mogu mijenjati status: Otvoreno, U procesu, Done, Otkazano. Svaka promjena se bilježi s vremenom i korisnikom. | Feature | Visok | 8 SP | Partially Done | Sprint 6 | Status Otkazano može dodijeliti samo koordinator; promjena statusa je moguća samo sekvencijalno bez vraćanja na prethodni status; |
| PBI-009 | Pregled zadataka servisera | Serviser pregledava listu intervencija koje su mu dodijeljene, s detaljima o lokaciji, opisu kvara i prioritetu. | Feature | Visok | 3 SP | Done | Sprint 6 | |
| PBI-010 | Evidencija izvještaja o intervenciji | Serviser dokumentira ishod intervencije: opis obavljenih radova, utrošeni materijal, napomene. Izvještaj se veže za intervenciju. | Feature | Visok | 5 SP | Done | Sprint 7 | Obračun troškova nije u scopeu; izvještaj dostupan u statusu U procesu i Done |
| PBI-011 | Historija intervencija po lokaciji/uređaju | Pregled prethodnih intervencija filtriranih prema lokaciji ili uređaju, s osnovnim podacima o svakoj intervenciji. | Feature | Srednji | 3 SP | Partially Done | Sprint 6 | Osnovna historija bez grafičkih prikaza; Historija intervencija po uređaju nije implementirana |
| PBI-012 | Notifikacije | Serviser dobija notifikaciju pri dodjeli zadatka; koordinator dobija notifikaciju pri novoj prijavi kvara. In-app notifikacije. | Feature | Srednji | 8 SP | Done | Sprint 8 | Automatski podsjetnici za preglede nisu u scopeu; notifikacije su isključivo in-app |
| PBI-013 | Upravljanje korisničkim računima (Admin) | Administrator kreira, uređuje, aktivira i deaktivira korisničke račune te dodjeljuje uloge i kontrolira pristup sistemu; dodjela firme. | Feature | Srednji | 8 SP | Done | Sprint 6 | Uključuje kontrolu pristupa po ulogama (RBAC) |
| PBI-014 | Menadžment dashboard | Pregled ključnih pokazatelja: broj aktivnih/završenih intervencija, prosječno vrijeme rješavanja, distribucija po prioritetu. | Feature | Srednji | 5 SP | Done | Sprint 7 | Samo tabelarni/numerički prikaz; grafički prikazi van scopea |
| PBI-015 | Upravljanje korisničkim profilom | Svaki prijavljeni korisnik može pregledati i ažurirati vlastite podatke: ime, kontakt, lozinka. | Feature | Nizak | 2 SP | Done | Sprint 7 | |
| PBI-016 | Komentari intervencije | Koordinator i serviser mogu dodavati tekstualne komentare na intervenciju radi dodatnog pojašnjenja, evidencije ili prijave kašnjenja. | Feature | Srednji | 3 SP | Done | Sprint 6 | Omogućeno je dodavanje komentara i korisniku |
| PBI-017 | Napredna pretraga | Koordinator ima mogućnost napredne pretrage intervencija po više kriterija. | Feature | Visok | 5 SP | Done | Sprint 6 | Implementirano kroz PBI-007 |
| PBI-018 | Upozorenje usljed kašnjenja (zasebna stavka) | Sistem generira upozorenje ako intervencija nije riješena unutar definisanog SLA roka. | Feature | Nizak | 3 SP | Done | Sprint 6 | Funkcionalnost integrirana u PBI-005|
| PBI-019 | Reset lozinke | Korisnik može zatražiti reset lozinke putem emaila. | Feature | Kritičan | 3 SP | Done | Sprint 5 | |
| PBI-020 | Kalendarski prikaz intervencija | Koordinator ima uvid u kalendarski prikaz prijavljenih intervencija. | Feature | Srednji | 5 SP | Done | Sprint 7 | |
| PBI-021 | Pregled dostupnosti servisera (zasebna stavka) | Koordinator pri dodjeli intervencije vidi listu servisera sortiranu po broju aktivnih intervencija. | Feature | Visok | 3 SP | Done | Sprint 6 | Funkcionalnost integrirana u PBI-006 i PBI-053 |
| PBI-022 | Planirana/preventivna održavanja | Koordinator može kreirati intervenciju bez prijave kvara. Moguće je definisati periodičnost, pri čemu sistem automatski generiše nove intervencije prema definisanom rasporedu. | Feature | Srednji | 5 SP | Partially Done | Sprint 8 | Podrška za ponavljanje |
| PBI-023 | Export podataka | Koordinator i menadžment mogu eksportovati kompletnu listu intervencija i izvještaje u PDF format. | Feature | Nizak | 5 SP | Done | Sprint 8 | |
| PBI-024 | Validacija unosa podataka | Sistem validira sve korisničke unose (obavezna polja) prije spremanja podataka. | Feature | Visok | 5 SP | Done | Sprint 5 | |
| PBI-025 | Detekcija duplikata prijave kvara | Sistem provjerava da li je isti korisnik u kratkom vremenskom periodu već prijavio isti kvar i upozorava korisnika. | Feature | Visok | 5 SP | Done | Sprint 8 | |
| PBI-026 | Arhiviranje intervencija | Sistem arhivira završene ili otkazane intervencije nakon definisanog vremenskog perioda. | Feature | Nizak | 3 SP | Done | Sprint 8 | Implementirano u okviru PBI-038 |
| PBI-027 | Sistem tiketa za korisničku podršku | Korisnik može kreirati tiket za korisničku podršku s mogućnošću dvosmjerne komunikacije između korisnika i agenta podrške. | Feature | Nizak | 8 SP | Done | Sprint 8 | Odvojeno od prijave kvara; uključuje kreiranje, komunikaciju i upravljanje statusima tiketa |
| PBI-028 | Dvosmjerna komunikacija na tiketu | Korisnik i podrška mogu razmjenjivati tekstualne poruke unutar otvorenog tiketa. | Feature | Nizak | 5 SP | Done | Sprint 8 | Implementirano kao sastavni dio PBI-027 |
| PBI-029 | Notifikacije za tikete | Korisnik dobija in-app obavijest kada agent odgovori na tiket; agent dobija obavijest kada stigne novi tiket ili odgovor korisnika. | Feature | Nizak | 3 SP | Done | Sprint 8 | Implementirano u sklopu PBI-012 |
| PBI-030 | Kategorije i tipovi kvarova | Korisnik pri prijavi kvara bira kategoriju iz odgovarajuće liste (vodoinstalacije, struja, internet...). | Feature | Nizak | 3 SP | Done | Sprint 5 | Kategorije se mogu koristiti i za filtriranje |
| PBI-031 | Višejezična podrška | Sistem podržava prikaz na više jezika; korisnik može odabrati jezik u postavkama profila. | Feature | Nizak | 5 SP | Done | Sprint 9 | |
| PBI-032 | Upravljanje kategorijama kvarova (Admin) | Administrator dodaje, uređuje i deaktivira kategorije kvarova koje se prikazuju korisnicima pri prijavi kvara. | Feature | Visok | 4 SP | Done | Sprint 5 | Preduvjet za PBI-030; kategorije moraju biti dostupne pri prvoj prijavi kvara |
| PBI-033 | Pregled i upravljanje attachmentima | Koordinator i admin mogu pregledati, validirati i brisati fajlove priložene u prijavi kvara. Uključuje definisanje dozvoljenih tipova fajlova i maksimalne veličine. | Feature | Visok | 3 SP | Done | Sprint 6 | Zavisi od PBI-003 (upload fajlova); Koordinator nema mogućnost brisanja attachmenta |
| PBI-034 | Geografski/mapski prikaz intervencija | Koordinator vidi intervencije prikazane na mapi prema lokaciji. Dopunjuje vremensku dimenziju kalendarskog prikaza. | Feature | Visok | 4 SP | Done | Sprint 8 | |
| PBI-035 | Konfiguracija vremenskih rokova (SLA) | Admin definira rok za svaki nivo prioriteta (npr. Hitan = 2h, Visok = 8h, Normalan = 24h, Nizak = 72h). Ovi rokovi koriste se u PBI-005. | Feature | Visok | 3 SP | Done | Sprint 5 | Preduvjet za SLA dio PBI-005 |
| PBI-036 | Feedback korisnika po završetku intervencije | Korisnik koji je prijavio kvar dobija mogućnost ocjene intervencije nakon obavijesti o završetku. | Feature | Nizak | 3 SP | Done | Sprint 9 | |
| PBI-037 | Automatska raspodjela intervencija | Sistem automatski dodjeljuje novu intervenciju manje opterećenom serviseru prema definisanim pravilima. | Feature | Srednji | 4 SP | Deffered | — | Odgođeno za buduću verziju; nije implementirano u MVP-u zbog nedostatka vremenskog prostora; |
| PBI-038 | Masovne akcije na intervencijama | Koordinator može odjednom promijeniti status, dodijeliti servisera ili arhivirati više intervencija. | Feature | Srednji | 4 SP | Done | Sprint 8 | |
| PBI-039 | Blokiranje korisnika od strane firme | Koordinator može blokirati korisnika ukoliko procijeni da se radi o spamu ili zloupotrebi. | Feature | Nizak | 2 SP | Done | Sprint 9 | |
| PBI-040 | Settings page | Prijavljeni korisnik može upravljati ličnim postavkama aplikacije, a admin kroz isti ekran dobija pregled i brze prečice prema konfiguracijama sistema kao što su SLA, attachment pravila, kategorije i korisnici. Stranica zamjenjuje trenutni placeholder i ne duplira Profile/Admin forme. | Feature | Srednji | 5 SP | Done | Sprint 9 | Objedinjuje lične preference i role-based navigaciju prema postojećim konfiguracijama |
| PBI-041 | Inicijalna Prisma migracija za trenutne modele | Kreiranje prve Prisma migracije koja pokriva trenutne modele, enum tipove i relacije iz schema fajla; migracija mora kreirati sve tabele, indekse i foreign key relacije na praznoj bazi. | Technical Task | Visok | 5 SP | Done | Sprint 5 | Preduvjet za sve ostale razvoje |
| PBI-042 | Početni seed podaci za razvoj i demo | Kreiranje seed skripte koja puni bazu s firmom, kategorijama kvarova, SLA konfiguracijom i korisnicima za sve uloge; ponovljivo pokretanje ne smije duplirati podatke. | Technical Task | Srednji | 3 SP | Done | Sprint 5 | |
| PBI-044 | Osnovno centralizirano logovanje i health nadzor | Implementacija konzistentnog health endpointa koji vraća status aplikacije i baze; logovanje ključnih tehničkih događaja bez otkrivanja osjetljivih podataka. | Technical Task | Srednji | 3 SP | Done | Sprint 6 | |
| PBI-045 | Globalni exception handler i standardizacija API grešaka | Implementacija centralnog Express error middleware-a koji hvata sve izuzetke; validacijske greške vraćaju 400, auth greške 401/403, a produkcija ne otkriva stack trace. | Technical Task | Visok | 5 SP | Done | Sprint 5 | |
| PBI-046 | Middleware za autorizaciju i zaštitu ruta | Implementacija reusable middleware-a za provjeru autentifikacije i uloge; neautentificirani zahtjevi su odbijeni, a zahtjevi s neodgovarajućom ulogom vraćaju 403. | Technical Task | Visok | 5 SP | Done | Sprint 5 | Osnova za sve funkcionalnosti s ograničenim pristupom |
| PBI-047 | Centralizovana validacija zahtjeva i DTO schema sloj | Implementacija Zod-based schema validacije za sve POST/PATCH endpointe; neispravni payload vraća 400 sa standardiziranim opisom greške po polju. | Technical Task | Visok | 4 SP | Done | Sprint 5 | |
| PBI-048 | Rate limiting za javne i auth endpointe | Implementacija konfigurabilnog rate limitinga na login, reset lozinke i javnoj prijavi kvara; prekoračenje vraća 429 bez otkrivanja validnosti računa. | Technical Task | Visok | 3 SP | Done | Sprint 5 | |
| PBI-051 | Settings stranica i upravljanje korisničkim preferencijama | Centralizovana Settings stranica s upravljanjem jezičkim preferencijama i postavkama notifikacija po korisničkom računu. Admin dobija role-based prečice prema konfiguracijama sistema. Zamjenjuje placeholder stranicu. | Feature | Srednji | 5 SP | Done | Sprint 9 | Objedinjuje lične preference i role-based navigaciju prema postojećim konfiguracijama |
| PBI-052 | Analitika feedbacka i kvaliteta usluge | Menadžment i koordinator pregledaju agregirane trendove ocjena feedbacka s filterima po periodu, firmi, kategoriji i serviseru. Negativni feedback posebno označen. | Feature | Srednji | 5 SP | Done | Sprint 10 | Zavisi od PBI-036 (Feedback) |
| PBI-053 | Upravljanje dostupnošću i odsustvima servisera | Serviser unosi periode nedostupnosti; koordinator pri dodjeli vidi dostupnost zajedno s opterećenjem servisera. Nedostupan serviser jasno označen. | Feature | Srednji | 5 SP | Done | Sprint 10 | Proširenje PBI-006 |
| PBI-054 | Potvrda i promjena termina intervencije od strane korisnika | Korisnik prima in-app notifikaciju pri zakazivanju termina, može ga potvrditi ili zatražiti promjenu. Koordinator pregledava i prihvata/odbija zahtjeve za promjenu. | Feature | Srednji | 5 SP | Done | Sprint 10 | Zavisi od PBI-004 i PBI-012 |
| PBI-055 | Baza znanja i preporučena rješenja za kvarove | Koordinator označava finalizovane izvještaje kao preporučena rješenja. Serviser pretražuje bazu znanja po kategoriji. Relevantna rješenja prikazana na detalju intervencije. | Feature | Srednji | 5 SP | Done | Sprint 10 | Zavisi od PBI-010; samo finalizovani izvještaji mogu biti označeni |
| PBI-056 | Evidencija materijala utrošenog na intervenciji | Serviser unosi listu materijala (naziv, količina, napomena) u sklopu izvještaja o intervenciji. Menadžment pregledava agregirane podatke o potrošnji. Bez obračuna cijena. | Feature | Srednji | 5 SP | Done | Sprint 10 | Zavisi od PBI-010; finansijska integracija nije u scopeu |
| PBI-058 | Eskalacije i komentari ka menadžmentu za rizične intervencije | Koordinator označava intervenciju kao rizičnu uz obavezan razlog. Eskalacijski komentari odvojeni od redovnih. Menadžment pregled eskaliranih intervencija. | Feature | Visok | 5 SP | Done | Sprint 10 | Zavisi od PBI-007 i PBI-014 |
| PBI-059 | Zahtjev za ponovno otvaranje završene intervencije | Korisnik podnosi obrazložen zahtjev za ponovnim otvaranjem završene intervencije. Koordinator prihvata ili odbija uz komentar. Historija zahtjeva vidljiva u intervenciji. | Feature | Srednji | 5 SP | Done | Sprint 10 | Zavisi od PBI-008 i PBI-012 |
| PBI-060 | Evidencija dolaska servisera i vremena na terenu | Tri operativna checkpointa: krenuo na lokaciju, stigao na lokaciju, završio rad. Korisnik i koordinator dobijaju notifikacije. Audit log za svaki checkpoint. | Feature | Srednji | 5 SP | Done | Sprint 10 | Zavisi od PBI-008 i PBI-012 |
| PBI-061 | Digitalna potvrda izvršene intervencije | Serviser zahtijeva digitalnu potvrdu od korisnika po završetku rada putem PIN-a ili potpisa. Odvojeno od feedbacka — formalna potvrda izvršenja, ne ocjena kvaliteta. | Feature | Srednji | 5 SP | Done | Sprint 10 | |
| PBI-062 | Pauziranje intervencije zbog blokera | Koordinator ili serviser stavlja intervenciju na čekanje uz razlog (čeka korisnika, materijal, vanjskog izvođača, odobrenje, ostalo). Evidencija pauziranja i nastavka rada. | Feature | Srednji | 5 SP | Done | Sprint 10 | |

---
## LEGENDA & DEFINICIJE

### Tip stavke
- Feature
- Bug
- Technical Task
- Research
- Documentation

### Prioritet
- Kritičan
- Visok
- Srednji
- Nizak

### Status
- Todo
- U toku
- U pregledu
- Done
- Blokirano
- Odgođeno
- Otkazano

---

## SMJERNICE ZA AŽURIRANJE

Backlog je živi dokument i mora se redovno ažurirati:

- Pregled i refinement backloga provodi se minimalno jednom tjedno (Backlog Refinement).
- Nakon svakog Sprinta, ažurirati status stavki i dodati nove stavke identificirane na Retrospektivi.
- Story Points (SP) procjenjuje razvojni tim kolektivno (Planning Poker ili slična tehnika). Stavke s `—` u polju Složenosti moraju biti refinisane prije planiranja.
- Prioritete određuje Product Owner u suradnji sa stakeholderima.
- Stavke bez procjene složenosti nisu spremne za Sprint — moraju biti refinisane prije planiranja.
- Svaka stavka treba biti dovoljno jasna da tim može početi raditi bez dodatnih pitanja (Definition of Ready).