# PRODUCT BACKLOG

**Sistem za upravljanje intervencijama | v1.0**

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
| PBI-003 | Prijava kvara od strane korisnika | Obrazac za prijavu kvara: lokacija, opis problema, kategorija usluge. Kvar se automatski bilježi kao nova intervencija | Feature | Kritičan | 5 SP | Todo | Sprint 5 | Dostupno prijavljenim i neprijavljenim korisnicima |
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
| PBI-016 | Komentari intervencije | Ostavljanje komentara od strane koordinatora i servisera vezanih za intervenciju | Feature | Srednji | Složenost | Todo | Sprint/Release |  |
| PBI-017 | Napredna pretraga | Koordinator ima mogućnost naptedne pretrage intervencija po datumu, lokaciji, statusu i serviseru | Feature | Visok | Složenost | Todo | Sprint/Release | |
| PBI-018 | Upozorenje usljed kašnjenja | Sistem upozorava ako intervencija nije duže vremena riješena | Feature | Nizak | Složenost | Todo | Sprint/Release | Automatski podsjetnici za redovne preglede nisu u MVP scopeu |
| PBI-019 | Reset lozinke | Korisnik može zatražiti reset lozinke putem emaila | Feature | Kritičan | Složenost | Todo | Sprint/Release | |
| PBI-020 | Kalendarski prikaz intervencija | Koordinator ima uvid u kalendarski prikaz prijavljenih intervencija | Feature | Srednji | Složenost | Todo | Sprint/Release | |
| PBI-021 | Pregled dostupnosti servisera | Koordinator pri dodjeli intervencije vidi listu servisera sortiranu po broju aktivnih intervencija (serviseri sa manje intervencija prikazani prvi) | Feature | Visok | Složenost | Todo | Sprint/Release | Koordinator može dodijeliti intervenciju bilo kojem serviseru |
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

---

## SMJERNICE ZA AŽURIRANJE

Backlog je živi dokument i mora se redovno ažurirati:

- Pregled i refinement backlogа provodi se minimalno jednom tjedno (Backlog Refinement).  
- Nakon svakog Sprinta, ažurirati status stavki i dodati nove stavke identificirane na Retrospektivi.  
- Story Points (SP) procjenjuje razvojni tim kolektivno (Planning Poker ili slična tehnika).  
- Prioritete određuje Product Owner u suradnji sa stakeholderima.  
- Stavke bez procjene složenosti nisu spremne za Sprint — moraju biti refiniran prije planiranja.  
- Svaka stavka treba biti dovoljno jasna da tim može početi raditi bez dodatnih pitanja (Definition of Ready).