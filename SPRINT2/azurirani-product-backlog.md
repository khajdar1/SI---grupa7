# PRODUCT BACKLOG

**Sistem za upravljanje servisnim intervencijama | v2.1**

---

## INFORMACIJE O PROJEKTU

| | |
|---|---|
| **Naziv projekta** | Sistem za upravljanje servisnim intervencijama |
| **Product Owner** | Kenan Halilović |
| **Scrum Master** | Kerim Hajdar |
| **Verzija backloga** | v2.1 |
| **Datum kreiranja** | 29.3.2026. |
| **Posljednje ažuriranje** | 06.04.2026. |

---

## PREGLED IZMJENA — v2.1

| PBI ID | Opis izmjene / razlog |
|--------|----------------------|
| PBI-001 | Napomena i opis ažurirani: dodate obje putanje — samoregistracija (Gost/Korisnik) i admin kreiranje računa (sve uloge + dodjela firme) |
| PBI-016 | Ispravljene greške: dodat stvarni opis, SP postavljen na `—` (za refinement), Sprint/Release popunjen okvirno (Sprint 7) |
| PBI-018 | Opis dopunjen referencom na PBI-035 (SLA konfiguracija) kao preduvjet |
| PBI-030 | Napomena dopunjena: naglašena zavisnost od PBI-032 |
| PBI-032 | Novi PBI: Upravljanje kategorijama kvarova (Admin) — premješten u Sprint 5 kao preduvjet za PBI-003/030 |
| PBI-033 | Novi PBI: Pregled i upravljanje attachmentima — pokriva validaciju, pregled i brisanje fajlova priloženih u PBI-003 |
| PBI-034 | Novi PBI: Geografski/mapski prikaz intervencija — prostorna dimenzija uz vremensku iz PBI-020 |
| PBI-035 | Novi PBI: Konfiguracija vremenskih rokova (SLA) — preduvjet za PBI-018 |
| PBI-036 | Novi PBI: Feedback korisnika po završetku intervencije |
| PBI-037 | Novi PBI: Automatska raspodjela intervencija — sistem dodjeljuje, koordinator nadgleda i može override-ati |
| PBI-038 | Novi PBI: Masovne akcije na intervencijama |
| PBI-039 | Blokiranje korisnika — zadržano s originalnim brojem |

---

## BACKLOG STAVKE

<!--
RASPODJELA PO SPRINTOVIMA (6 sprintova: Sprint 5–Sprint 10)

Sprint 5 — ~32 SP
  PBI-024 (5), PBI-032 (4), PBI-035 (3), PBI-001 (5), PBI-002 (4), PBI-019 (3), PBI-030 (3), PBI-003 (5)
  Fokus: Preduvjeti i fundament — validacija, kategorije kvarova, SLA, registracija, login, reset lozinke, prijava kvara

Sprint 6 — ~24 SP
  PBI-004 (5), PBI-033 (3), PBI-005 (3), PBI-006 (2), PBI-007 (5), PBI-016 (3), PBI-011 (3)
  Fokus: Planiranje i pregled — kreiranje i zakazivanje intervencija, prioriteti, dodjela servisera, pregled liste, komentari, historija, attachmenti

Sprint 7 — ~16 SP
  PBI-009 (3), PBI-008 (8), PBI-010 (5)
  Fokus: Operativno upravljanje — pregled zadataka servisera, praćenje i izmjena statusa, evidencija izvještaja

Sprint 8 — ~28 SP
  PBI-012 (8), PBI-013 (8), PBI-014 (5), PBI-015 (2), PBI-020 (5)

Sprint 9 — ~27 SP
  PBI-017 (5), PBI-018 (3), PBI-021 (3), PBI-025 (5), PBI-026 (3), PBI-027 (3), PBI-028 (5)

Sprint 10 — ~35 SP
  PBI-022 (5), PBI-023 (5), PBI-029 (3), PBI-031 (5), PBI-034 (4), PBI-036 (3), PBI-037 (4), PBI-038 (4), PBI-039 (2)
-->

| ID | Naziv stavke | Opis | Tip | Prioritet | Složenost | Status | Sprint/Release | Napomena |
|----|-------------|------|-----|----------|-----------|--------|----------------|----------|
| PBI-001 | Registracija korisnika | Kreiranje korisničkog računa. Neprijavljeni korisnik može izvršiti samoregistraciju, pri čemu mu se automatski dodjeljuje uloga Gost/Korisnik. Admin može kreirati račune za zaposlene i direktno ih dodijeliti odgovarajućoj firmi/organizaciji te im dodijeliti odgovarajuću ulogu. | Feature | Kritičan | 5 SP | Todo | Sprint 5 | Dvije putanje: samoregistracija (uloga Gost/Korisnik) i admin kreiranje računa (sve uloge, dodjela firme) |
| PBI-002 | Prijava u sistem (Login) | Autentifikacija korisnika putem korisničkog imena i lozinke, upravljanje sesijom i sigurna odjava | Feature | Kritičan | 4 SP | Todo | Sprint 5 | Preduvjet za sve ostale funkcionalnosti |
| PBI-003 | Prijava kvara od strane korisnika | Obrazac za prijavu kvara: odabir firme iz liste s mogućnošću unosa, automatsko određivanje lokacije, opis problema, lista predefinisanih kvarova, kategorija usluge uz mogućnost dodavanja slika ili dokumenata. Kvar se automatski bilježi kao nova intervencija. | Feature | Kritičan | 5 SP | Todo | Sprint 5 | Dostupno prijavljenim i neprijavljenim korisnicima; hitne intervencije imaju predefinisane šablone od strane firme |
| PBI-004 | Planiranje intervencija | Koordinator kreira i zakazuje intervenciju na osnovu prijavljenog kvara, unosi detalje i vremenski okvir | Feature | Kritičan | 5 SP | Todo | Sprint 6 | |
| PBI-005 | Postavljanje prioriteta intervencije | Koordinator dodjeljuje prioritet (hitan, visok, normalan, nizak) pri kreiranju ili dodjeli, s mogućnošću naknadne izmjene | Feature | Visok | 3 SP | Todo | Sprint 6 | Osnova za rangiranje u pregledu liste |
| PBI-006 | Dodjela servisera intervenciji | Koordinator dodjeljuje jednog ili više servisera / terenski tim otvorenoj intervenciji | Feature | Visok | 2 SP | Todo | Sprint 6 | |
| PBI-007 | Pregled liste aktivnih intervencija | Koordinator i menadžment pregledaju sve aktivne intervencije rangirane po prioritetu, s filterima po statusu, tipu i dodijeljenosti | Feature | Visok | 5 SP | Todo | Sprint 6 | Rangiranje po prioritetu je ključni zahtjev MVP-a |
| PBI-008 | Praćenje i izmjena statusa intervencije | Koordinator i serviser mogu mijenjati status: Otvoreno, U procesu, Završeno, Otkazano. Svaka promjena se bilježi s vremenom i korisnikom. | Feature | Visok | 8 SP | Todo | Sprint 6 | Status Otkazano može dodijeliti samo koordinator |
| PBI-009 | Pregled zadataka servisera | Serviser pregledava listu intervencija koje su mu dodijeljene, s detaljima o lokaciji, opisu kvara i prioritetu | Feature | Visok | 3 SP | Todo | Sprint 6 | |
| PBI-010 | Evidencija izvještaja o intervenciji | Serviser dokumentira ishod intervencije: opis obavljenih radova, utrošeni materijal, napomene. Izvještaj se veže za intervenciju. | Feature | Visok | 5 SP | Todo | Sprint 7 | Obračun troškova nije u MVP scopeu; Izvještaj dostupan u statusu U procesu i Završeno |
| PBI-011 | Historija intervencija po lokaciji/uređaju | Pregled prethodnih intervencija filtriranih prema lokaciji ili uređaju, s osnovnim podacima o svakoj intervenciji | Feature | Srednji | 3 SP | Todo | Sprint 7 | Osnovna historija bez grafičkih prikaza (van MVP scope) |
| PBI-012 | Notifikacije | Serviser dobija notifikaciju pri dodjeli zadatka; koordinator dobija notifikaciju pri novoj prijavi kvara od korisnika | Feature | Srednji | 8 SP | Todo | Sprint 8 | Automatski podsjetnici za preglede nisu u MVP scopeu; Notifikacije su isključivo in-app |
| PBI-013 | Upravljanje korisničkim računima (Admin) | Administrator kreira, uređuje, aktivira i deaktivira korisničke račune te dodjeljuje uloge i kontrolira pristup sistemu; dodjela firme | Feature | Srednji | 8 SP | Todo | Sprint 8 | Uključuje kontrolu pristupa po ulogama (RBAC) |
| PBI-014 | Menadžment dashboard | Pregled ključnih pokazatelja: broj aktivnih/završenih intervencija, prosječno vrijeme rješavanja, distribucija po prioritetu | Feature | Srednji | 5 SP | Todo | Sprint 8 | Samo tabelarni/numerički prikaz; grafički prikazi van MVP |
| PBI-015 | Upravljanje korisničkim profilom | Svaki prijavljeni korisnik može pregledati i ažurirati vlastite podatke: ime, kontakt, lozinka | Feature | Nizak | 2 SP | Todo | Sprint 6 | |
| PBI-016 | Komentari intervencije | Koordinator i serviser mogu dodavati tekstualne komentare na intervenciju radi dodatnog pojašnjenja, evidencije ili prijave kašnjenja | Feature | Srednji | 3 SP | Todo | Sprint 7 | Potrebna procjena SP na sljedećem refinementu |
| PBI-017 | Napredna pretraga | Koordinator ima mogućnost napredne pretrage intervencija po više kriterija: nazivu/opisu, datumu, lokaciji, statusu i dodijeljenom serviseru | Feature | Visok | 5 SP | Todo | Sprint 7 | Potrebna procjena SP |
| PBI-018 | Upozorenje usljed kašnjenja | Sistem generiše upozorenje ako intervencija nije riješena unutar definisanog vremenskog roka (vidi PBI-035) | Feature | Nizak | 3 SP | Todo | Sprint 9 | Automatski podsjetnici za redovne preglede nisu u MVP scopeu; zavisi od PBI-035 |
| PBI-019 | Reset lozinke | Korisnik može zatražiti reset lozinke putem emaila | Feature | Kritičan | 3 SP | Todo | Sprint 5 | |
| PBI-020 | Kalendarski prikaz intervencija | Koordinator ima uvid u kalendarski prikaz prijavljenih intervencija | Feature | Srednji | 5 SP | Todo | Sprint 8 | |
| PBI-021 | Pregled dostupnosti servisera | Koordinator pri dodjeli intervencije vidi listu servisera sortiranu po broju aktivnih intervencija (serviseri s manje intervencija prikazani prvi) | Feature | Visok | 3 SP | Todo | Sprint 8 | Koordinator može dodijeliti intervenciju bilo kojem serviseru |
| PBI-022 | Planirana/preventivna održavanja | Koordinator može kreirati intervenciju bez prijave kvara (planirano održavanje). Moguće je definisati periodičnost, pri čemu sistem automatski generiše nove intervencije prema definisanom rasporedu. | Feature | Srednji | 5 SP | Todo | Sprint 9 | Podrška za ponavljanje |
| PBI-023 | Export podataka | Koordinator i menadžment mogu eksportovati kompletnu listu intervencija kao i izvještaje o intervencijama u PDF format radi arhiviranja i daljnje analize | Feature | Nizak | 5 SP | Todo | Sprint 10 | |
| PBI-024 | Validacija unosa podataka | Sistem validira sve korisničke unose (obavezna polja) prije spremanja podataka | Feature | Visok | 5 SP | Todo | Sprint 5 | |
| PBI-025 | Detekcija duplikata prijave kvara | Sistem provjerava da li je isti korisnik u kratkom vremenskom periodu već prijavio isti kvar (na osnovu lokacije i opisa) i upozorava korisnika prije kreiranja nove intervencije | Feature | Visok | 5 SP | Todo | Sprint 5 | |
| PBI-026 | Arhiviranje intervencija | Sistem arhivira završene ili otkazane intervencije nakon definisanog vremenskog perioda | Feature | Nizak | 3 SP | Todo | Sprint 8 | |
| PBI-027 | Kreiranje tiketa za podršku | Korisnik može kreirati tiket za korisničku podršku kako bi postavio pitanje, prijavio problem u aplikaciji ili zatražio pomoć, uz mogućnost odabira kategorije upita | Feature | Nizak | 3 SP | Todo | Sprint 9 | Odvojeno od prijave kvara |
| PBI-028 | Dvosmjerna komunikacija na tiketu | Korisnik i podrška mogu razmjenjivati tekstualne poruke unutar otvorenog tiketa | Feature | Nizak | 5 SP | Todo | Sprint 9 | |
| PBI-029 | Notifikacija za tikete | Korisnik dobija in-app obavijest kada agent iz podrške odgovori na tiket, a agent kada stigne novi tiket ili odgovor korisnika | Feature | Nizak | 3 SP | Todo | Sprint 10 | |
| PBI-030 | Kategorije i tipovi kvarova | Korisnik pri prijavi kvara bira kategoriju iz odgovarajuće liste (vodoinstalacije, struja, internet...). Zavisi od PBI-032. | Feature | Nizak | 3 SP | Todo | Sprint 5 | Kategorije se mogu koristiti i za filtriranje; zavisi od PBI-032 |
| PBI-031 | Višejezična podrška | Sistem podržava prikaz na više jezika | Feature | Nizak | 5 SP | Todo | Sprint 10 | Korisnik može odabrati jezik u postavkama profila |
| PBI-032 | Upravljanje kategorijama kvarova (Admin) | Administrator dodaje, uređuje i deaktivira kategorije kvarova koje se prikazuju korisnicima pri prijavi kvara (PBI-003, PBI-030). Preduvjet za funkcionalno odabiranje kategorije. | Feature | Visok | 4 SP | Todo | Sprint 5 | Preduvjet za PBI-030; kategorije moraju biti dostupne pri prvoj prijavi kvara |
| PBI-033 | Pregled i upravljanje attachmentima | Koordinator i admin mogu pregledati, validirati i brisati fajlove priložene u prijavi kvara. Uključuje definisanje dozvoljenih tipova fajlova i maksimalne veličine. | Feature | Visok | 3 SP | Todo | Sprint 7 | Zavisi od PBI-003 (upload fajlova) |
| PBI-034 | Geografski/mapski prikaz intervencija | Koordinator vidi intervencije prikazane na mapi prema lokaciji. Dopunjuje vremensku dimenziju kalendarskog prikaza (PBI-020). | Feature | Visok | 4 SP | Todo | Sprint 10 | |
| PBI-035 | Konfiguracija vremenskih rokova (SLA) | Admin definira rok za svaki nivo prioriteta (npr. Hitan = 2h, Visok = 8h, Normalan = 24h, Nizak = 72h). Ovi rokovi koriste se kao osnova za PBI-018. | Feature | Visok | 3 SP | Todo | Sprint 5 | Preduvjet za PBI-018; bez definisanih rokova upozorenja nemaju smisla |
| PBI-036 | Feedback korisnika po završetku intervencije | Korisnik koji je prijavio kvar dobija mogućnost ocjene ili potvrde da je problem riješen nakon što dobije obavijest o završetku intervencije | Feature | Nizak | 3 SP | Todo | Sprint 9 | |
| PBI-037 | Automatska raspodjela intervencija | Sistem automatski dodjeljuje novu intervenciju manje opterećenom serviseru prema definisanim pravilima (npr. broj aktivnih intervencija, dostupnost). Koordinator i dalje ima mogućnost ručne izmjene dodjele. | Feature | Srednji | 4 SP | Todo | Sprint 10 | Koordinator nadgleda i može override-ati automatsku dodjelu; zavisi od PBI-021 |
| PBI-038 | Masovne akcije na intervencijama | Koordinator može odjednom promijeniti status, dodijeliti servisera ili arhivirati više intervencija. Bez ovoga, upravljanje velikim brojem intervencija postaje mukotrpno. | Feature | Srednji | 4 SP | Todo | Sprint 10 | |
| PBI-039 | Blokiranje korisnika od strane firme | Koordinator može blokirati korisnika ukoliko procijeni da se radi o spamu | Feature | Nizak | 2 SP | Todo | Sprint 10 | |

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
- Završeno
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
