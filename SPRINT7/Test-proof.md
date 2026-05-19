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

# Sprint 7 – Testiranje dashboarda, korisničkih profila, kalendara i izvještaja

## 7.1 Funkcionalnosti koje se testiraju

U Sprintu 7 fokus testiranja je na funkcionalnostima vezanim za menadžment dashboard, upravljanje korisničkim profilima i reset lozinke, kalendarski prikaz intervencija, kreaciju kompanija i evidenciju izvještaja o intervencijama.

Testirane funkcionalnosti uključuju:

* pregled menadžment dashboard statistika,
* prikaz aktivnih i završenih intervencija,
* prikaz distribucije intervencija po prioritetu,
* prikaz prosječnog vremena rješavanja intervencija,
* RBAC ograničenja pristupa dashboardu,
* pregled i izmjenu korisničkog profila,
* promjenu lozinke korisnika,
* reset lozinke putem email linka,
* validaciju reset tokena i vremenskog ograničenja,
* kalendarski prikaz intervencija,
* prikaz intervencija po datumima,
* pregled detalja intervencije iz kalendara,
* kreaciju kompanija kroz admin i samoprijavu,
* pregled company page funkcionalnosti,
* unos izvještaja o intervenciji,
* pregled izvještaja u detaljima intervencije,
* validaciju statusa intervencije za unos izvještaja,
* regresiono testiranje postojećih funkcionalnosti,
* ručno frontend/UI testiranje,
* unit testove pokretane kroz VS Code okruženje.

---

# 7.2 Backend/API testiranje

| ID testa  | Vrsta testiranja                | Funkcionalnost                               | Ulaz / koraci                                              | Očekivani ishod                                   | Stvarni ishod                                                      | Status |
| --------- | ------------------------------- | -------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| S7-BE-001 | Backend/API testiranje          | Dohvat dashboard statistika                  | Pozvati dashboard endpoint                                 | Sistem vraća dashboard podatke                    | Dashboard podaci su uspješno vraćeni.                              | Pass   |
| S7-BE-002 | Backend/API testiranje          | Broj aktivnih intervencija                   | Dohvatiti dashboard podatke                                | Sistem vraća broj aktivnih intervencija           | Broj aktivnih intervencija je ispravno prikazan.                   | Pass   |
| S7-BE-003 | Backend/API testiranje          | Distribucija prioriteta                      | Dohvatiti dashboard podatke                                | Sistem vraća distribuciju prioriteta              | Distribucija prioriteta je uspješno vraćena.                       | Pass   |
| S7-BE-004 | Backend/API testiranje          | Prosječno vrijeme rješavanja                 | Dohvatiti dashboard statistiku                             | Sistem vraća prosječno vrijeme rješavanja         | Prosječno vrijeme rješavanja je uspješno izračunato.               | Pass   |
| S7-BE-005 | Validaciono testiranje          | Neautorizovan pristup dashboardu             | Serviser pokušava pristupiti dashboard endpointu           | Sistem odbija pristup                             | Sistem je uspješno odbio pristup neautorizovanom korisniku.        | Pass   |
| S7-BE-006 | Backend/API testiranje          | Ažuriranje korisničkog profila               | Poslati validne izmjene korisničkih podataka               | Podaci se uspješno spremaju                       | Korisnički profil je uspješno ažuriran.                            | Pass   |
| S7-BE-007 | Validaciono testiranje          | Promjena lozinke sa pogrešnom starom lozinkom| Poslati pogrešnu trenutnu lozinku                          | Sistem vraća grešku                               | Sistem je odbio promjenu lozinke.                                  | Pass   |
| S7-BE-008 | Backend/API testiranje          | Promjena lozinke                             | Poslati validnu staru i novu lozinku                       | Lozinka se uspješno mijenja                       | Lozinka je uspješno promijenjena.                                  | Pass   |
| S7-BE-009 | Backend/API testiranje          | Reset lozinke putem emaila                   | Poslati registrovani email                                 | Sistem šalje reset link                           | Reset email je uspješno poslan.                                    | Pass   |
| S7-BE-010 | Validaciono testiranje          | Reset za nepostojeći email                   | Poslati email koji ne postoji                              | Sistem vraća neutralnu poruku                     | Neutralna poruka je uspješno prikazana.                            | Pass   |
| S7-BE-011 | Validaciono testiranje          | Iskorišten reset token                       | Pokušati ponovo koristiti reset link                       | Sistem odbija token                               | Sistem je uspješno odbio iskorišten token.                         | Pass   |
| S7-BE-012 | Backend/API testiranje          | Dohvat kalendarskih intervencija             | Pozvati endpoint za kalendar                               | Sistem vraća intervencije po datumima             | Kalendarski podaci su uspješno vraćeni.                            | Pass   |
| S7-BE-013 | Backend/API testiranje          | Kreacija kompanije                           | Poslati validne podatke za kompaniju                       | Kompanija se uspješno kreira                      | Kompanija je uspješno kreirana.                                    | Pass   |
| S7-BE-014 | Validaciono testiranje          | Kreacija kompanije bez obaveznih podataka    | Poslati request bez naziva kompanije                       | Sistem vraća validacionu grešku                   | Validaciona greška je uspješno vraćena.                            | Pass   |
| S7-BE-015 | Backend/API testiranje          | Kreiranje izvještaja o intervenciji          | Dodati izvještaj za intervenciju                           | Izvještaj se uspješno sprema                      | Izvještaj je uspješno spremljen.                                   | Pass   |
| S7-BE-016 | Validaciono testiranje          | Izvještaj bez pokrenute intervencije         | Pokušati dodati izvještaj za nezapočetu intervenciju       | Sistem odbija unos                                | Sistem je uspješno odbio unos izvještaja.                          | Pass   |
| S7-BE-017 | Backend/API testiranje          | Pregled izvještaja                           | Dohvatiti detalje intervencije                             | Sistem vraća izvještaj                            | Izvještaj je uspješno prikazan u detaljima intervencije.           | Pass   |
| S7-BE-018 | Regresiono testiranje           | Postojeće funkcionalnosti nakon Sprint 7     | Testirati prethodne API funkcionalnosti                    | Postojeće funkcionalnosti i dalje rade            | Nije primijećena regresija sistema nakon Sprint 7 izmjena.         | Pass   |
| S7-BE-019 | Automatizovano smoke testiranje | Pokretanje backend aplikacije                | Pokrenuti backend aplikaciju i testove                     | Backend se pokreće bez greške                     | Backend aplikacija i testovi su uspješno pokrenuti.                | Pass   |

---

# 7.3 Frontend/UI testiranje

| ID testa  | Vrsta testiranja       | Funkcionalnost                     | Koraci testiranja                              | Očekivani ishod                             | Stvarni ishod                                                  | Status |
| --------- | ---------------------- | ---------------------------------- | ---------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | ------ |
| S7-UI-001 | Frontend/UI testiranje | Otvaranje dashboard stranice       | Navigirati na dashboard                        | Dashboard se uspješno prikazuje             | Dashboard stranica je uspješno prikazana.                      | Pass   |
| S7-UI-002 | Frontend/UI testiranje | Prikaz statistika                  | Otvoriti dashboard                             | Statistike su pravilno prikazane            | Dashboard statistike su uspješno prikazane.                    | Pass   |
| S7-UI-003 | Frontend/UI testiranje | Ograničen pristup dashboardu       | Prijaviti se kao serviser                      | Dashboard nije dostupan                     | Pristup dashboardu je uspješno ograničen.                      | Pass   |
| S7-UI-004 | Frontend/UI testiranje | Pregled korisničkog profila        | Otvoriti Moj profil                            | Korisnički podaci su prikazani              | Podaci korisnika su uspješno prikazani.                        | Pass   |
| S7-UI-005 | Frontend/UI testiranje | Izmjena korisničkih podataka       | Promijeniti ime i email                        | Promjene se uspješno spremaju               | Promjene korisničkog profila su uspješno spremljene.           | Pass   |
| S7-UI-006 | Frontend/UI testiranje | Promjena lozinke                   | Unijeti staru i novu lozinku                   | Lozinka se uspješno mijenja                 | Lozinka je uspješno promijenjena.                              | Pass   |
| S7-UI-007 | Frontend/UI testiranje | Link za reset lozinke              | Kliknuti "Zaboravili ste lozinku?"             | Otvara se forma za reset                    | Forma za reset lozinke je uspješno prikazana.                  | Pass   |
| S7-UI-008 | Frontend/UI testiranje | Kalendarski prikaz intervencija    | Otvoriti kalendar                              | Intervencije su prikazane po datumima       | Kalendarski prikaz je uspješno prikazan.                       | Pass   |
| S7-UI-009 | Frontend/UI testiranje | Pregled detalja iz kalendara       | Kliknuti na intervenciju u kalendaru           | Otvaraju se detalji intervencije            | Detalji intervencije su uspješno otvoreni.                     | Pass   |
| S7-UI-010 | Frontend/UI testiranje | Kreacija kompanije                 | Unijeti podatke kompanije                      | Kompanija se uspješno kreira                | Kompanija je uspješno kreirana kroz UI.                        | Pass   |
| S7-UI-011 | Frontend/UI testiranje | Validacija company forme           | Ostaviti prazna obavezna polja                 | Prikazuju se validacione poruke             | Validacione poruke su uspješno prikazane.                      | Pass   |
| S7-UI-012 | Frontend/UI testiranje | Unos izvještaja o intervenciji     | Dodati izvještaj kroz formu                    | Izvještaj se uspješno sprema                | Izvještaj o intervenciji je uspješno spremljen.                | Pass   |
| S7-UI-013 | Frontend/UI testiranje | Pregled izvještaja                 | Otvoriti detalje intervencije                  | Izvještaj je vidljiv korisniku              | Izvještaj je uspješno prikazan u detaljima intervencije.       | Pass   |
| S7-UI-014 | Frontend/UI testiranje | Responsivnost novih stranica       | Otvoriti dashboard i profile na manjoj rezoluciji | UI ostaje čitljiv i upotrebljiv          | UI je ostao čitljiv i funkcionalan.                            | Pass   |

---

# 7.4 End-to-end i regresiono testiranje

| ID testa   | Vrsta testiranja      | Scenario                                  | Koraci                                                       | Očekivani ishod                                  | Stvarni ishod                                                   | Status |
| ---------- | --------------------- | ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------- | ------ |
| S7-E2E-001 | End-to-end testiranje | Upravljanje korisničkim profilom          | Prijaviti se i izmijeniti korisničke podatke                 | Promjene ostaju trajno sačuvane                  | Korisnički podaci su uspješno ažurirani i spremljeni.           | Pass   |
| S7-E2E-002 | End-to-end testiranje | Reset lozinke                             | Zatražiti reset i postaviti novu lozinku                     | Korisnik uspješno resetuje lozinku               | Reset lozinke je uspješno izvršen.                              | Pass   |
| S7-E2E-003 | End-to-end testiranje | Dashboard pregled                         | Prijaviti se kao menadžment i otvoriti dashboard             | Dashboard prikazuje tačne podatke                | Dashboard podaci su uspješno prikazani.                         | Pass   |
| S7-E2E-004 | End-to-end testiranje | Kalendarski pregled intervencija          | Otvoriti kalendar i pregledati intervencije                  | Intervencije su pravilno prikazane               | Kalendarski prikaz radi ispravno.                               | Pass   |
| S7-E2E-005 | End-to-end testiranje | Kreiranje izvještaja                      | Dodati izvještaj i otvoriti detalje intervencije             | Izvještaj ostaje trajno vezan za intervenciju    | Izvještaj je uspješno sačuvan i prikazan.                       | Pass   |
| S7-E2E-006 | Regresiono testiranje | Provjera postojećih funkcionalnosti       | Testirati funkcionalnosti iz prethodnih sprintova            | Postojeće funkcionalnosti i dalje rade           | Nije primijećena regresija postojećih funkcionalnosti sistema.  | Pass   |

---

# 7.5 Unit testiranje

| ID testa    | Vrsta testiranja | Funkcionalnost                        | Alat    | Očekivani rezultat         | Stvarni rezultat                                      | Status |
| ----------- | ---------------- | ------------------------------------- | ------- | -------------------------- | ----------------------------------------------------- | ------ |
| S7-UNIT-001 | Unit testiranje  | Pokretanje frontend unit testova      | VS Code | Testovi prolaze bez greške | Frontend unit testovi su uspješno prošli.             | Pass   |
| S7-UNIT-002 | Unit testiranje  | Pokretanje backend unit testova       | VS Code | Testovi prolaze bez greške | Backend unit testovi su uspješno prošli.              | Pass   |
| S7-UNIT-003 | Unit testiranje  | Validacija dashboard logike           | VS Code | Statistike se računaju tačno | Dashboard validacije i izračuni rade ispravno.      | Pass   |
| S7-UNIT-004 | Unit testiranje  | Validacija reset tokena               | VS Code | Token validacija radi očekivano | Reset token validacija radi ispravno.              | Pass   |

---

# 7.6 Zaključak testiranja

Tokom Sprinta 7 testirane su funkcionalnosti vezane za dashboard statistike, korisničke profile, reset lozinke, kalendarski prikaz intervencija, kompanije i izvještaje o intervencijama.

Zaključak:

* Testiran je menadžment dashboard i prikaz statističkih podataka.
* Testirane su RBAC permisije za pristup dashboard funkcionalnostima.
* Testirano je upravljanje korisničkim profilom i promjena lozinke.
* Testiran je proces resetovanja lozinke putem email linka.
* Provjeren je kalendarski prikaz intervencija i pregled detalja.
* Testirana je kreacija kompanija i validacija company formi.
* Testiran je unos i pregled izvještaja o intervencijama.
* Izvršeno je regresiono testiranje postojećih funkcionalnosti.
* Pokrenuti su frontend i backend unit testovi kroz VS Code okruženje.
* Svi evidentirani testovi za Sprint 7 imaju status Pass.