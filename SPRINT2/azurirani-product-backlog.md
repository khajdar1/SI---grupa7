# PRODUCT BACKLOG

**Sistem za upravljanje intervencijama | v2.0**

---

## INFORMACIJE O PROJEKTU

**Naziv projekta**  
Sistem za upravljanje servisnim intervencijama  

**Product Owner**  
Kenan Halilović  

**Verzija backlogа**  
v2.0  

**Scrum Master**  
Kerim Hajdar  

**Datum kreiranja**  
29.3.2026.  

**Posljednje ažuriranje**  
04.04.2026.  

**Napomena**  
[Opće napomene o projektu ili aktualnom statusu]

---

## BACKLOG STAVKE

| ID | Naziv stavke | Opis | Tip | Prioritet | Složenost | Status | Sprint/Release | Napomena |
|----|-------------|------|-----|----------|-----------|--------|----------------|----------|
| PBI-001 | Registracija korisnika | Kreiranje korisničkog računa s unosom osnovnih podataka i dodjelom uloge (korisnik, serviser, koordinator, admin, menadžment) | Feature | Kritičan | 5 SP | Todo | Sprint 5 | Uloge dodjeljuje admin pri kreiranju računa |
| PBI-002 | Prijava u sistem (Login) | Autentifikacija korisnika putem korisničkog imena i lozinke, upravljanje sesijom i sigurna odjava | Feature | Kritičan | 4 SP | Todo | Sprint 5 | Preduvjet za sve ostale funkcionalnosti |
| PBI-003 | Prijava kvara od strane korisnika | Obrazac za prijavu kvara: lokacija, opis problema, kategorija usluge uz mogućnost dodavanja slika ili dokumenata. Kvar se automatski bilježi kao nova intervencija | Feature | Kritičan | 5 SP | Todo | Sprint 5 | Dostupno prijavljenim i neprijavljenim korisnicima |
| PBI-004 | Planiranje intervencija | Koordinator (dispečer) kreira i zakazuje intervenciju na osnovu prijavljenog kvara, unosi detalje i vremenski okvir | Feature | Kritičan | 5 SP | Todo | Sprint 5 |  |
| PBI-005 | Postavljanje prioriteta intervencije | Koordinator dodjeljuje prioritet (hitan, visok, normalan, nizak) pri kreiranju ili dodjeli, s mogućnošću naknadne izmjene | Feature | Visok | 3 SP | Todo | Sprint 5 | Osnova za rangiranje u pregledu liste |
| PBI-006 | Dodjela servisera intervenciji | Koordinator dodjeljuje jednog ili više servisera / terenski tim otvorenoj intervenciji | Feature | Visok | 2 SP | Todo | Sprint 6 |  |
| PBI-007 | Pregled liste aktivnih intervencija | Koordinator i menadžment pregledaju sve aktivne intervencije rangirane po prioritetu, s filterima po statusu, tipu i dodijeljenosti | Feature | Visok | 5 SP | Todo | Sprint 6 | Rangiranje po prioritetu je ključni zahtjev MVP-a |
| PBI-008 | Praćenje i izmjena statusa intervencije | Koordinator i serviser mogu mijenjati status: Otvoreno, U procesu, Završeno. Svaka promjena se bilježi s vremenom i korisnikom | Feature | Visok | 8 SP | Todo | Sprint 6 |  |
| PBI-009 | Pregled zadataka servisera | Serviser pregledava listu intervencija koje su mu dodijeljene, s detaljima o lokaciji, opisu kvara i prioritetu | Feature | Visok | 3 SP | Todo | Sprint 6 |  |
| PBI-010 | Evidencija izvještaja o intervenciji | Serviser dokumentira ishod intervencije: opis obavljenih radova, utrošeni materijal, napomene. Izvještaj se veže za intervenciju | Feature | Visok | 5 SP | Todo | Sprint 6 | Obračun troškova nije u MVP scopeu |
| PBI-011 | Historija intervencija po lokaciji/uređaju | Pregled prethodnih intervencija filtriranih prema lokaciji ili uređaju, s osnovnim podacima o svakoj intervenciji | Feature | Srednji | 3 SP | Todo | Sprint 7 | Osnovna historija bez grafičkih prikaza (van MVP scope) |
| PBI-012 | Notifikacije | Serviser dobija notifikaciju pri dodjeli zadatka; koordinator dobija notifikaciju pri novoj prijavi kvara od korisnika | Feature | Srednji | 8 SP | Todo | Sprint 7 | Automatski podsjetnici za preglede nisu u MVP scopeu |
| PBI-013 | Upravljanje korisničkim računima (Admin) | Administrator kreira, uređuje, aktivira i deaktivira korisničke račune te dodjeljuje uloge i kontrolira pristup sistemu | Feature | Srednji | 8 SP | Todo | Sprint 7 | Uključuje kontrolu pristupa po ulogama (RBAC) |
| PBI-014 | Menadžment dashboard | Pregled ključnih pokazatelja: broj aktivnih/završenih intervencija, prosječno vrijeme rješavanja, distribucija po prioritetu | Feature | Srednji | 5 SP | Todo | Sprint 8 | Samo tabelarni/numerički prikaz; grafički prikazi van MVP |
| PBI-015 | Upravljanje korisničkim profilom | Svaki prijavljeni korisnik može pregledati i ažurirati vlastite podatke: ime, kontakt, lozinka | Feature | Nizak | 2 SP | Todo | Sprint 8 |  |
| PBI-016 | Komentari intervencije | Koordinator i serviser mogu dodavati tekstualne komentare na intervenciju radi dodatnog pojašnjenja, evidencije ili prijave kašnjenja | Feature | Srednji | Složenost | Todo | Sprint/Release |  |
| PBI-017 | Napredna pretraga | Koordinator ima mogućnost napredne pretrage intervencija po više kriterija: nazivu/opisu intervencije, datumu, lokaciji, statusu i dodijeljenom serviseru | Feature | Visok | Složenost | Todo | Sprint/Release | |
| PBI-018 | Upozorenje usljed kašnjenja | Sistem generiše upozorenje ako intervencija nije riješena unutar definisanog vremenskog roka | Feature | Nizak | Složenost | Todo | Sprint/Release | Automatski podsjetnici za redovne preglede nisu u MVP scopeu |
| PBI-019 | Reset lozinke | Korisnik može zatražiti reset lozinke putem emaila | Feature | Kritičan | Složenost | Todo | Sprint/Release | |
| PBI-020 | Kalendarski prikaz intervencija | Koordinator ima uvid u kalendarski prikaz prijavljenih intervencija | Feature | Srednji | Složenost | Todo | Sprint/Release | |
| PBI-021 | Pregled dostupnosti servisera | Koordinator pri dodjeli intervencije vidi listu servisera sortiranu po broju aktivnih intervencija (serviseri sa manje intervencija prikazani prvi) | Feature | Visok | Složenost | Todo | Sprint/Release | Koordinator može dodijeliti intervenciju bilo kojem serviseru |
| PBI-022 | Planirana/preventivna održavanja | Koordinator može kreirati intervenciju bez prijave kvara (planirano održavanje). Moguće je definisati periodičnost, pri čemu sistem automatski generiše nove intervencije prema definisanom rasporedu | Feature | Srednji | Složenost | Todo | Sprint/Release | Podrška za ponavljanje |
| PBI-023 | Export podataka | Koordinator i menadžment mogu eksportovati kompletnu listu intervencija kao i izvještaje o intervencijama, u PDF format radi arhiviranja i daljnje analize | Feature | Nizak | Složenost | Todo | Sprint/Release |  |
| PBI-024 | Validacija unosa podataka | Sistem validira sve korisničke unose (obavezna polja) prije spremanja podataka | Feature | Visok | Složenost | Todo | Sprint/Release |  |
| PBI-025 | Detekcija duplikata prijave kvara | Sistem provjerava da li je isti korisnik u kratkom vremenskom periodu već prijavio isti kvar (na osnovu lokacije i opisa) i upozorava korisnika prije kreiranja nove intervencije | Feature | Visok | Složenost | Todo | Sprint/Release |  |
| PBI-026 | Arhiviranje intervencija | Sistem arhivira završene ili otkazane intervencije nakon definisanog vremenskog perioda | Feature | Nizak | Složenost | Todo | Sprint/Release |  |
| PBI-027 | Kreiranje tiketa za podršku | Korisnik može kreirati tiket za korisničku podršku kako bi postavio pitanje, prijavio problem u aplikaciji ili zatražio pomoć, uz mogućnost odabira kategorije upita | Feature | Nizak | Složenost | Todo | Sprint/Release | Odvojeno od prijave kvara |
| PBI-028 | Dvosmjerna komunikacija na tiketu | Korisnik i podrška mogu razmjenjivati tekstualne poruke unutar otvorenog tiketa | Feature | Nizak | Složenost | Todo | Sprint/Release | |
| PBI-029 | Notifikacija za tikete | Korisnik dobija in-app obavijest kada agent iz podrške odgovori na tiket, a agent kada stigne novi tiket ili odgovor korisnika | Feature | Nizak | Složenost | Todo | Sprint/Release | |
| PBI-030 | Kategorije i tipovi kvarova | Korisnik pri prijavi kvara bira kategoriju iz odgovarajuće liste(vodoinstalacije, struja, internet...) | Feature | Nizak | Složenost | Todo | Sprint/Release | Kategorije se mogu koristiti i za filtriranje|
| PBI-031 | Višejezična podrška | Sistem podržava prikaz na više jezika | Feature | Nizak | Složenost | Todo | Sprint/Release | Korinsik može odabrati jezik u postavkama profila|
| PBI-032 | Upravljanje kategorijama kvarova | Admin dodaje, uređuje i deaktivira kategorije kvarova | Feature | Visok | Složenost | Todo | Sprint 5 | |
| PBI-033 | Pregled i upravljanje attachmentima | Pregled, validacija i brisanje fajlova priloženih u prijavi kvara | Feature | Visok | Složenost | Todo | Sprint 6 | |
| PBI-034 | Geografski/mapski prikaz intervencija | Koordinator vidi intervencije na mapi prema lokaciji i dopunjuje vremensku dimenziju | Feature | Visok | Složenost | Todo | Sprint/Release | |
| PBI-035 | Konfiguracija vremenskih rokova | Admin definira rok za svaki prioritet(npr. hitan=2 h, visok=8h) | Feature | Visok | Složenost | Todo | Sprint 6 | |
| PBI-036 | Feedback korisnika po završetku intervencije | Korisnik može ocijeniti intervenciju nakon što dobije obavijest o završetku | Feature | Nizak | Složenost | Todo | Sprint/Release | |
| PBI-037 | Automatska raspodjela intervencija | Sistem automatski dodjeljuje intervenciju manje opterećenom serviseru prema definisanim pravilima | Feature | Srednji | Složenost | Todo | Sprint/Release | |
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

- Pregled i refinement backlogа provodi se minimalno jednom tjedno (Backlog Refinement).  
- Nakon svakog Sprinta, ažurirati status stavki i dodati nove stavke identificirane na Retrospektivi.  
- Story Points (SP) procjenjuje razvojni tim kolektivno (Planning Poker ili slična tehnika).  
- Prioritete određuje Product Owner u suradnji sa stakeholderima.  
- Stavke bez procjene složenosti nisu spremne za Sprint — moraju biti refiniran prije planiranja.  
- Svaka stavka treba biti dovoljno jasna da tim može početi raditi bez dodatnih pitanja (Definition of Ready).
