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

| Vrsta testiranja                | Opis                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Automatizovano smoke testiranje | Osnovna automatizovana provjera da se backend/frontend aplikacija može pokrenuti ili inicijalizovati bez greške. |
| Backend/API testiranje          | Testiranje backend endpointa kroz Swagger/Postman i provjera odgovora API-ja.                                    |
| Validaciono testiranje          | Testiranje poslovnih pravila, obaveznih polja, dozvoljenih vrijednosti i nevalidnih ulaza.                       |
| Integration testiranje          | Testiranje komunikacije između više komponenti sistema (frontend-backend-baza).                                  |
| Frontend/UI testiranje          | Ručno testiranje korisničkog interfejsa, prikaza stranica, formi, poruka i korisničkih akcija.                   |
| End-to-end testiranje           | Testiranje kompletnog korisničkog toka kroz frontend, backend i bazu.                                            |
| Regresiono testiranje           | Provjera da nove funkcionalnosti nisu pokvarile postojeće funkcionalnosti.                                       |
| Deployment smoke testiranje     | Osnovna provjera da aplikacija radi nakon pokretanja kroz Docker ili na serveru.                                 |
| Unit testiranje                 | Pokretanje i provjera pojedinačnih logičkih cjelina aplikacije kroz unit testove u razvojnom okruženju.          |

---

# Legenda statusa

| Status  | Značenje                                                                   |
| ------- | -------------------------------------------------------------------------- |
| Pass    | Test je uspješno prošao.                                                   |
| Fail    | Test nije prošao i zahtijeva ispravku.                                     |
| Blocked | Test trenutno nije moguće izvršiti zbog zavisnosti ili greške u okruženju. |
| Not Run | Test je definisan, ali još nije izvršen.                                   |
| N/A     | Test nije primjenjiv za dati scenario.                                     |

---

# Sprint 8 – Testiranje notifikacija, tiketa, mapa i masovnih akcija

## 8.1 Funkcionalnosti koje se testiraju

U Sprintu 8 fokus testiranja je na funkcionalnostima vezanim za notifikacije, preventivna održavanja, tiket sistem, mapski prikaz intervencija, export podataka i masovne akcije nad intervencijama.

Testirane funkcionalnosti uključuju:

* in-app notifikacije za servisere i koordinatore,
* prikaz broja nepročitanih notifikacija,
* direktno otvaranje intervencije iz notifikacije,
* kreiranje planiranih/preventivnih održavanja,
* automatsko generisanje periodičnih intervencija,
* detekciju duplikata prijava kvarova,
* kreiranje korisničkih tiketa,
* dvosmjernu komunikaciju unutar tiketa,
* zatvaranje tiketa i zabranu daljnje komunikacije,
* mapski prikaz intervencija,
* filtriranje intervencija na mapi,
* export intervencija u PDF format,
* masovne akcije nad intervencijama,
* regresiono testiranje postojećih funkcionalnosti,
* frontend/UI testiranje,
* backend/API testiranje,
* unit testove pokretane kroz VS Code okruženje.

---

# 8.2 Backend/API testiranje

| ID testa  | Vrsta testiranja                | Funkcionalnost                           | Ulaz / koraci                           | Očekivani ishod                        | Stvarni ishod                                              | Status |
| --------- | ------------------------------- | ---------------------------------------- | --------------------------------------- | -------------------------------------- | ---------------------------------------------------------- | ------ |
| S8-BE-001 | Backend/API testiranje          | Slanje notifikacije serviseru            | Dodijeliti intervenciju serviseru       | Sistem kreira notifikaciju             | Notifikacija je uspješno kreirana i prikazana.             | Pass   |
| S8-BE-002 | Backend/API testiranje          | Slanje notifikacije koordinatoru         | Kreirati novu prijavu kvara             | Koordinator prima notifikaciju         | Notifikacija je uspješno poslana.                          | Pass   |
| S8-BE-003 | Validaciono testiranje          | Broj nepročitanih notifikacija           | Dohvatiti korisničke notifikacije       | Sistem vraća tačan broj                | Broj nepročitanih notifikacija je ispravno prikazan.       | Pass   |
| S8-BE-004 | Backend/API testiranje          | Kreiranje preventivnog održavanja        | Poslati validne podatke                 | Sistem kreira održavanje               | Preventivno održavanje je uspješno kreirano.               | Pass   |
| S8-BE-005 | Backend/API testiranje          | Automatsko generisanje intervencija      | Pokrenuti scheduler                     | Nova intervencija se automatski kreira | Intervencija je uspješno generisana.                       | Pass   |
| S8-BE-006 | Validaciono testiranje          | Detekcija duplikata prijave              | Poslati sličnu prijavu                  | Sistem prikazuje upozorenje            | Upozorenje za potencijalni duplikat je uspješno prikazano. | Pass   |
| S8-BE-007 | Backend/API testiranje          | Kreiranje tiketa                         | Poslati validne podatke tiketa          | Tiket se uspješno kreira               | Tiket je uspješno kreiran.                                 | Pass   |
| S8-BE-008 | Backend/API testiranje          | Slanje poruke unutar tiketa              | Poslati poruku                          | Poruka se sprema                       | Poruka je uspješno spremljena.                             | Pass   |
| S8-BE-009 | Validaciono testiranje          | Slanje prazne poruke                     | Poslati praznu poruku                   | Sistem vraća grešku                    | Sistem je uspješno odbio praznu poruku.                    | Pass   |
| S8-BE-010 | Backend/API testiranje          | Dohvat mapskih intervencija              | Pozvati mapski endpoint                 | Sistem vraća intervencije s lokacijom  | Mapski podaci su uspješno vraćeni.                         | Pass   |
| S8-BE-011 | Backend/API testiranje          | Export PDF dokumenta                     | Pokrenuti export                        | PDF se uspješno generiše               | PDF dokument je uspješno generisan.                        | Pass   |
| S8-BE-012 | Backend/API testiranje          | Masovna promjena statusa                 | Odabrati više intervencija              | Sve intervencije se ažuriraju          | Masovna akcija je uspješno izvršena.                       | Pass   |
| S8-BE-013 | Regresiono testiranje           | Postojeće funkcionalnosti nakon Sprint 8 | Testirati prethodne API funkcionalnosti | Postojeće funkcionalnosti rade         | Nije primijećena regresija sistema nakon Sprint 8 izmjena. | Pass   |
| S8-BE-014 | Automatizovano smoke testiranje | Pokretanje backend aplikacije            | Pokrenuti backend i testove             | Backend radi bez greške                | Backend aplikacija i testovi su uspješno pokrenuti.        | Pass   |

---

# 8.3 Frontend/UI testiranje

| ID testa  | Vrsta testiranja       | Funkcionalnost                    | Koraci testiranja                      | Očekivani ishod                      | Stvarni ishod                                  | Status |
| --------- | ---------------------- | --------------------------------- | -------------------------------------- | ------------------------------------ | ---------------------------------------------- | ------ |
| S8-UI-001 | Frontend/UI testiranje | Prikaz notifikacija               | Otvoriti navigaciju                    | Notifikacije su prikazane            | Notifikacije su uspješno prikazane.            | Pass   |
| S8-UI-002 | Frontend/UI testiranje | Klik na notifikaciju              | Kliknuti notifikaciju                  | Otvaraju se detalji intervencije     | Intervencija je uspješno otvorena.             | Pass   |
| S8-UI-003 | Frontend/UI testiranje | Kreiranje preventivnog održavanja | Popuniti formu                         | Intervencija se kreira               | Preventivna intervencija je uspješno kreirana. | Pass   |
| S8-UI-004 | Frontend/UI testiranje | Prikaz upozorenja za duplikat     | Poslati sličnu prijavu                 | Sistem prikazuje upozorenje          | Upozorenje je uspješno prikazano.              | Pass   |
| S8-UI-005 | Frontend/UI testiranje | Kreiranje tiketa                  | Popuniti tiket formu                   | Tiket se uspješno kreira             | Tiket je uspješno kreiran kroz UI.             | Pass   |
| S8-UI-006 | Frontend/UI testiranje | Razmjena poruka na tiketu         | Poslati poruku                         | Poruka je prikazana                  | Poruka je uspješno prikazana unutar tiketa.    | Pass   |
| S8-UI-007 | Frontend/UI testiranje | Mapski prikaz intervencija        | Otvoriti mapu                          | Intervencije su prikazane            | Mapski prikaz uspješno radi.                   | Pass   |
| S8-UI-008 | Frontend/UI testiranje | Filtriranje na mapi               | Primijeniti filter                     | Prikazuju se filtrirane intervencije | Filteri na mapi rade ispravno.                 | Pass   |
| S8-UI-009 | Frontend/UI testiranje | Export PDF dokumenta              | Kliknuti export                        | PDF se preuzima                      | PDF dokument je uspješno generisan i preuzet.  | Pass   |
| S8-UI-010 | Frontend/UI testiranje | Masovne akcije                    | Odabrati više intervencija             | Akcija se izvršava                   | Masovna akcija je uspješno izvršena.           | Pass   |
| S8-UI-011 | Frontend/UI testiranje | Responsivnost novih stranica      | Otvoriti stranice na manjoj rezoluciji | UI ostaje funkcionalan               | UI je ostao pregledan i funkcionalan.          | Pass   |

---

# 8.4 End-to-end i regresiono testiranje

| ID testa   | Vrsta testiranja      | Scenario                            | Koraci                                     | Očekivani ishod               | Stvarni ishod                                 | Status |
| ---------- | --------------------- | ----------------------------------- | ------------------------------------------ | ----------------------------- | --------------------------------------------- | ------ |
| S8-E2E-001 | End-to-end testiranje | Dodjela intervencije i notifikacija | Dodijeliti zadatak serviseru               | Serviser prima notifikaciju   | Notifikacija je uspješno prikazana.           | Pass   |
| S8-E2E-002 | End-to-end testiranje | Kreiranje i komunikacija na tiketu  | Kreirati tiket i poslati poruku            | Komunikacija radi ispravno    | Tiket komunikacija uspješno funkcioniše.      | Pass   |
| S8-E2E-003 | End-to-end testiranje | Preventivno održavanje              | Kreirati periodičnu intervenciju           | Sistem generiše novu instancu | Automatska intervencija je uspješno kreirana. | Pass   |
| S8-E2E-004 | End-to-end testiranje | Mapski pregled intervencija         | Otvoriti mapu i pregledati marker          | Marker otvara detalje         | Detalji intervencije su uspješno prikazani.   | Pass   |
| S8-E2E-005 | End-to-end testiranje | PDF export                          | Exportovati listu intervencija             | PDF se uspješno generiše      | PDF export uspješno radi.                     | Pass   |
| S8-E2E-006 | Regresiono testiranje | Provjera postojećih funkcionalnosti | Testirati prethodne sprint funkcionalnosti | Sistem radi stabilno          | Nije primijećena regresija sistema.           | Pass   |

---

# 8.5 Unit testiranje

| ID testa    | Vrsta testiranja | Funkcionalnost                   | Alat    | Očekivani rezultat          | Stvarni rezultat                          | Status |
| ----------- | ---------------- | -------------------------------- | ------- | --------------------------- | ----------------------------------------- | ------ |
| S8-UNIT-001 | Unit testiranje  | Pokretanje frontend unit testova | VS Code | Testovi prolaze bez greške  | Frontend unit testovi su uspješno prošli. | Pass   |
| S8-UNIT-002 | Unit testiranje  | Pokretanje backend unit testova  | VS Code | Testovi prolaze bez greške  | Backend unit testovi su uspješno prošli.  | Pass   |
| S8-UNIT-003 | Unit testiranje  | Validacija notifikacija          | VS Code | Notifikacije rade očekivano | Notifikaciona logika radi ispravno.       | Pass   |
| S8-UNIT-004 | Unit testiranje  | Validacija tiket komunikacije    | VS Code | Poruke se pravilno obrađuju | Tiket komunikacija radi ispravno.         | Pass   |
| S8-UNIT-005 | Unit testiranje  | Validacija PDF export logike     | VS Code | PDF export funkcioniše      | PDF export validacija radi ispravno.      | Pass   |

---

# 8.6 Zaključak testiranja

Tokom Sprinta 8 testirane su funkcionalnosti vezane za notifikacije, preventivna održavanja, tiket sistem, mapski prikaz intervencija, export podataka i masovne akcije nad intervencijama.

Zaključak:

* Testirane su in-app notifikacije i prikaz nepročitanih obavijesti.
* Testirana je logika preventivnog održavanja i automatskog generisanja intervencija.
* Testirana je detekcija potencijalnih duplikata prijava kvarova.
* Testiran je tiket sistem i dvosmjerna komunikacija između korisnika i podrške.
* Testiran je mapski prikaz intervencija i filtriranje podataka na mapi.
* Testiran je export intervencija u PDF format.
* Testirane su masovne akcije nad intervencijama.
* Izvršeno je regresiono testiranje postojećih funkcionalnosti.
* Pokrenuti su frontend i backend unit testovi kroz VS Code okruženje.
* Svi evidentirani testovi za Sprint 8 imaju status Pass.
