# TestProof

# 1. Osnovne informacije

Dokument posebno prati format evidentiranja rezultata: naziv/opis testa, ulazne podatke, očekivani rezultat, stvarni rezultat i status testa.

TestProof predstavlja živi dokument koji se ažurira nakon svakog završenog sprinta. Njegova svrha je interno evidentiranje provedenog testiranja i praćenje kvaliteta implementiranih funkcionalnosti kroz razvoj projekta.

---

# 2. Cilj dokumenta

Cilj ovog dokumenta je evidentirati načine testiranja funkcionalnosti implementiranih u sprintovima, u skladu sa prethodno definisanom testnom strategijom projekta.

Dokument obuhvata:

* automatizovane testove vidljive u kodu,
* backend/API testiranje,
* frontend/UI testiranje,
* manualno end-to-end testiranje,
* validacione scenarije,
* regresiono testiranje,
* deployment smoke testiranje,
* očekivane i stvarne ishode testiranja.

---

# 3. Korišteni nivoi i vrste testiranja

| Vrsta testiranja | Opis |
| --- | --- |
| Automatizovano smoke testiranje | Osnovna automatizovana provjera da se backend/frontend aplikacija može pokrenuti ili inicijalizovati bez greške. |
| Backend/API testiranje | Testiranje backend endpointa kroz Swagger/Postman i provjera odgovora API-ja. |
| Validaciono testiranje | Testiranje poslovnih pravila, obaveznih polja, dozvoljenih vrijednosti i nevalidnih ulaza. |
| Integration testiranje | Testiranje komunikacije između više komponenti sistema (frontend-backend-baza). |
| Frontend/UI testiranje | Ručno testiranje korisničkog interfejsa, prikaza stranica, formi, poruka i korisničkih akcija. |
| End-to-end testiranje | Testiranje kompletnog korisničkog toka kroz frontend, backend i bazu. |
| Regresiono testiranje | Provjera da nove funkcionalnosti nisu pokvarile postojeće funkcionalnosti. |
| Deployment smoke testiranje | Osnovna provjera da aplikacija radi nakon pokretanja kroz Docker ili na serveru. |
| Unit testiranje | Pokretanje i provjera pojedinačnih logičkih cjelina aplikacije kroz unit testove u razvojnom okruženju. |

---

# Legenda statusa

| Status | Značenje |
| --- | --- |
| Pass | Test je uspješno prošao. |
| Fail | Test nije prošao i zahtijeva ispravku. |
| Blocked | Test trenutno nije moguće izvršiti zbog zavisnosti ili greške u okruženju. |
| Not Run | Test je definisan, ali još nije izvršen. |
| N/A | Test nije primjenjiv za dati scenario. |

---

# Sprint 9 – Testiranje višejezične podrške, blokiranja korisnika, Settings stranice i kreiranje feedbacka

## 9.1 Funkcionalnosti koje se testiraju

U Sprintu 9 fokus testiranja je na funkcionalnostima vezanim za višejezičnu podršku, blokiranje korisnika od strane firme, centralizovanu Settings stranicu i kreiranje feedbacka.

Testirane funkcionalnosti uključuju:

* odabir i čuvanje jezika prikaza po korisničkom računu,
* fallback mehanizam za nedostajuće prijevode,
* feedback mehanizam po završetku intervencije,
* blokiranje i deblokiranje korisnika od strane koordinatora,
* audit log blokiranja i deblokiranja,
* zabranu prijave kvarova za blokirane korisnike,
* Settings stranicu s role-based prikazom i korisničkim preferencama,
* regresiono testiranje postojećih funkcionalnosti,
* frontend/UI testiranje,
* backend/API testiranje,
* unit testove pokretane kroz VS Code okruženje.

---

## 9.2 Backend/API testiranje

| ID testa | Vrsta testiranja | Funkcionalnost | Ulaz / koraci | Očekivani ishod | Stvarni ishod | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S9-BE-001 | Backend/API testiranje | Čuvanje odabranog jezika po korisničkom računu | Korisnik odabere i sačuva jezik u postavkama | Jezik je sačuvan i primjenjuje se pri ponovnoj prijavi | Odabrani jezik je uspješno sačuvan i primijenjen. | Pass |
| S9-BE-002 | Validaciono testiranje | Fallback jezik pri nedostajućem prijevodu | Otvoriti stranicu s nepotpunim prijevodima | Prikazuje se engleski fallback | Fallback vrijednost je ispravno prikazana. | Pass |
| S9-BE-003 | Backend/API testiranje | Kreiranje feedbacka po završetku intervencije | Korisnik ocijeni završenu intervenciju | Feedback je sačuvan u sistemu | Feedback je uspješno kreiran i vezan za intervenciju. | Pass |
| S9-BE-004 | Validaciono testiranje | Zabrana višestrukog feedbacka po intervenciji | Korisnik pokuša ocijeniti intervenciju drugi put | Sistem vraća grešku | Sistem je ispravno odbio duplicirani feedback. | Pass |
| S9-BE-005 | Backend/API testiranje | Blokiranje korisnika od strane koordinatora | Koordinator blokira korisnika | Block record je kreiran i audit log upisan | Blokiranje je uspješno izvršeno uz audit log. | Pass |
| S9-BE-006 | Validaciono testiranje | Zabrana prijave kvara za blokiranog korisnika | Blokirani korisnik pokuša prijaviti kvar | Sistem odbija prijavu | Sistem je ispravno odbio prijavu blokiranog korisnika. | Pass |
| S9-BE-007 | Backend/API testiranje | Deblokiranje korisnika | Koordinator deblokira korisnika | Block record je obrisan i audit log upisan | Deblokiranje je uspješno izvršeno. | Pass |
| S9-BE-008 | Validaciono testiranje | Zabrana blokiranja samog sebe | Koordinator pokuša blokirati vlastiti račun | Sistem vraća grešku | Sistem je ispravno odbio self-blokiranje. | Pass |
| S9-BE-009 | Validaciono testiranje | Zabrana duplikata blokiranja | Koordinator pokuša blokirati već blokiranog korisnika | Sistem vraća conflict grešku | Sistem je ispravno detektovao duplikat blokiranja. | Pass |
| S9-BE-010 | Backend/API testiranje | Čuvanje korisničkih postavki na Settings stranici | Korisnik sačuva jezičke i notifikacijske postavke | Postavke su sačuvane po korisničkom računu | Postavke su uspješno sačuvane i primijenjene. | Pass |
| S9-BE-011 | Validaciono testiranje | RBAC provjera Settings postavki | Korisnik bez admin uloge pokuša pristupiti admin sekciji | Sistem odbija pristup | Sistem je ispravno primijenio role-based kontrolu pristupa. | Pass |
| S9-BE-012 | Regresiono testiranje | Postojeće funkcionalnosti nakon Sprint 9 | Testirati prethodne API funkcionalnosti | Postojeće funkcionalnosti rade | Nije primijećena regresija sistema nakon Sprint 9 izmjena. | Pass |
| S9-BE-013 | Automatizovano smoke testiranje | Pokretanje backend aplikacije | Pokrenuti backend i testove | Backend radi bez greške | Backend aplikacija i testovi su uspješno pokrenuti. | Pass |

---

## 9.3 Frontend/UI testiranje

| ID testa | Vrsta testiranja | Funkcionalnost | Koraci testiranja | Očekivani ishod | Stvarni ishod | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S9-UI-001 | Frontend/UI testiranje | Promjena jezika na Settings stranici | Odabrati drugi jezik i sačuvati | Interfejs se prikazuje na odabranom jeziku | Promjena jezika je uspješno primijenjena. | Pass |
| S9-UI-002 | Frontend/UI testiranje | Perzistencija jezičke postavke nakon odjave | Odjaviti se i ponovo prijaviti | Odabrani jezik je sačuvan | Jezik je ostao primijenjen nakon ponovne prijave. | Pass |
| S9-UI-003 | Frontend/UI testiranje | Prikaz feedback forme po završetku intervencije | Pregledati završenu intervenciju | Forma za feedback je prikazana | Feedback forma je uspješno prikazana korisniku. | Pass |
| S9-UI-004 | Frontend/UI testiranje | Unos ocjene i komentara | Unijeti ocjenu i tekstualni komentar | Feedback je sačuvan | Feedback je uspješno unesen i sačuvan. | Pass |
| S9-UI-005 | Frontend/UI testiranje | Opcija blokiranja korisnika u pregledu intervencije | Otvoriti pregled intervencije kao koordinator | Opcija blokiranja je vidljiva | Opcija blokiranja je ispravno prikazana koordinatoru. | Pass |
| S9-UI-006 | Frontend/UI testiranje | Potvrda akcije blokiranja | Kliknuti na blokiranje korisnika | Sistem prikazuje dijalog za potvrdu | Dijalog za potvrdu je uspješno prikazan. | Pass |
| S9-UI-007 | Frontend/UI testiranje | Pregled blokiranih korisnika | Otvoriti listu blokiranih korisnika | Lista je prikazana s opcijom deblokiranja | Lista blokiranih korisnika je uspješno prikazana. | Pass |
| S9-UI-008 | Frontend/UI testiranje | Settings stranica (korisnički prikaz) | Otvoriti Settings kao obični korisnik | Prikazane su samo korisničke postavke | Korisničke postavke su ispravno prikazane bez admin sekcija. | Pass |
| S9-UI-009 | Frontend/UI testiranje | Settings stranica (admin prikaz) | Otvoriti Settings kao administrator | Prikazane su admin prečice i korisničke postavke | Admin prikaz je ispravno prikazan uz role-based prečice. | Pass |
| S9-UI-010 | Frontend/UI testiranje | Responsivnost novih stranica | Otvoriti nove stranice na manjoj rezoluciji | UI ostaje funkcionalan | UI je ostao pregledan i funkcionalan na manjim rezolucijama. | Pass |

---

## 9.4 End-to-end i regresiono testiranje

| ID testa | Vrsta testiranja | Scenario | Koraci | Očekivani ishod | Stvarni ishod | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S9-E2E-001 | End-to-end testiranje | Promjena jezika i prikaz prevedenog interfejsa | Odabrati jezik, odjaviti se i ponovo prijaviti | Interfejs prikazan na odabranom jeziku | Višejezični tok uspješno radi. | Pass |
| S9-E2E-002 | End-to-end testiranje | Blokiranje korisnika i zabrana prijave kvara | Koordinator blokira korisnika, korisnik pokuša prijaviti kvar | Prijava je odbijena | Blokiranje i zabrana prijave uspješno funkcionišu. | Pass |
| S9-E2E-003 | End-to-end testiranje | Deblokiranje i obnova mogućnosti prijave kvara | Koordinator deblokira korisnika, korisnik prijavljuje kvar | Prijava je uspješno kreirana | Deblokiranje i obnova prijave uspješno rade. | Pass |
| S9-E2E-004 | End-to-end testiranje | Završetak intervencije i feedback tok | Intervencija prelazi u "Završeno", korisnik ostavlja feedback | Feedback je sačuvan i vidljiv koordinatoru | Feedback tok uspješno funkcioniše. | Pass |
| S9-E2E-005 | Regresiono testiranje | Provjera postojećih funkcionalnosti | Testirati prethodne sprint funkcionalnosti | Sistem radi stabilno | Nije primijećena regresija sistema. | Pass |

---

## 9.5 Unit testiranje

| ID testa | Vrsta testiranja | Funkcionalnost | Alat | Očekivani rezultat | Stvarni rezultat | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S9-UNIT-001 | Unit testiranje | Pokretanje frontend unit testova | VS Code | Testovi prolaze bez greške | Frontend unit testovi su uspješno prošli. | Pass |
| S9-UNIT-002 | Unit testiranje | Pokretanje backend unit testova | VS Code | Testovi prolaze bez greške | Backend unit testovi su uspješno prošli. | Pass |
| S9-UNIT-003 | Unit testiranje | Validacija blokiranja korisnika | VS Code | Blokiranje i deblokiranje rade očekivano | Logika blokiranja korisnika radi ispravno. | Pass |
| S9-UNIT-004 | Unit testiranje | Validacija feedback mehanizma | VS Code | Feedback se kreira i višestruki unos odbija | Feedback logika radi ispravno. | Pass |
| S9-UNIT-005 | Unit testiranje | Validacija višejezične podrške | VS Code | Jezik se čuva i fallback se primjenjuje očekivano | Višejezična logika radi ispravno. | Pass |
| S9-UNIT-006 | Unit testiranje | Validacija Settings stranice | VS Code | Role-based prikaz i čuvanje postavki rade očekivano | Settings logika radi ispravno. | Pass |

---

## 9.6 Zaključak testiranja

Tokom Sprinta 9 testirane su funkcionalnosti vezane za višejezičnu podršku, blokiranje korisnika od strane firme, feedback po završetku intervencije i centralizovanu Settings stranicu.

Zaključak:

* Testiran je odabir i perzistencija jezičkih postavki s fallback mehanizmom za nedostajuće prijevode.
* Testiran je feedback mehanizam po završetku intervencije uz zabranu višestrukog unosa.
* Testirano je blokiranje i deblokiranje korisnika od strane koordinatora uz audit log i zabranu prijave kvarova.
* Testirana je Settings stranica s role-based prikazom za korisnike i administratore.
* Izvršeno je regresiono testiranje postojećih funkcionalnosti.
* Pokrenuti su frontend i backend unit testovi kroz VS Code okruženje.
* Svi evidentirani testovi za Sprint 9 imaju status Pass.