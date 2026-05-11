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

# Sprint 6 – Testiranje funkcionalnosti intervencija i administracije

## 6.1 Funkcionalnosti koje se testiraju

U Sprintu 6 fokus testiranja je na funkcionalnostima vezanim za planiranje i upravljanje intervencijama, prioritetima, dodjelom servisera, pregledom aktivnih intervencija, historijom intervencija, upravljanjem korisničkim računima, komentarima i attachmentima.

Testirane funkcionalnosti uključuju:

* kreiranje i zakazivanje intervencija,
* postavljanje i izmjenu prioriteta,
* dodjelu servisera intervencijama,
* pregled liste aktivnih intervencija,
* filtriranje i sortiranje intervencija,
* pregled historije intervencija po lokaciji/uređaju,
* upravljanje korisničkim računima,
* deaktivaciju i reaktivaciju korisnika,
* dodavanje komentara na intervencije,
* pregled i upravljanje attachmentima,
* validaciju formi i permisija,
* audit log funkcionalnosti,
* regresiono testiranje postojećih funkcionalnosti,
* ručno frontend/UI testiranje,
* unit testove pokretane kroz VS Code okruženje.

---

# 6.2 Backend/API testiranje

| ID testa  | Vrsta testiranja                | Funkcionalnost                             | Ulaz / koraci                                     | Očekivani ishod                          | Stvarni ishod                                                | Status |
| --------- | ------------------------------- | ------------------------------------------ | ------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------ | ------ |
| S6-BE-001 | Backend/API testiranje          | Kreiranje validne intervencije             | Poslati validan request za kreiranje intervencije | Intervencija se uspješno kreira          | Intervencija je uspješno kreirana i spremljena u bazu.       | Pass   |
| S6-BE-002 | Validaciono testiranje          | Kreiranje intervencije bez obaveznih polja | Poslati request bez naziva ili prioriteta         | Backend vraća validacionu grešku         | Backend je vratio validacionu grešku za obavezna polja.      | Pass   |
| S6-BE-003 | Backend/API testiranje          | Kreiranje intervencije bez prijave kvara   | Kreirati intervenciju bez povezanog kvara         | Sistem dozvoljava kreiranje intervencije | Intervencija je uspješno kreirana bez veze na prijavu kvara. | Pass   |
| S6-BE-004 | Backend/API testiranje          | Izmjena intervencije u dozvoljenom statusu | Izmijeniti intervenciju u statusu "Otvoreno"      | Izmjene se uspješno spremaju             | Izmjene intervencije su uspješno spremljene.                 | Pass   |
| S6-BE-005 | Backend/API testiranje          | Dodjela prioriteta intervenciji            | Postaviti prioritet intervenciji                  | Prioritet se uspješno sprema             | Prioritet je uspješno spremljen uz intervenciju.             | Pass   |
| S6-BE-006 | Validaciono testiranje          | Nevalidan prioritet                        | Poslati prioritet koji nije dozvoljen             | Backend odbija request                   | Backend je odbio nevalidan prioritet.                        | Pass   |
| S6-BE-007 | Backend/API testiranje          | Dodjela servisera intervenciji             | Dodijeliti jednog ili više servisera              | Dodjela se uspješno sprema               | Serviseri su uspješno dodijeljeni intervenciji.              | Pass   |
| S6-BE-008 | Validaciono testiranje          | Dodjela deaktiviranog servisera            | Pokušati dodijeliti deaktiviran račun             | Sistem odbija dodjelu                    | Sistem je odbio dodjelu deaktiviranog korisnika.             | Pass   |
| S6-BE-009 | Backend/API testiranje          | Dohvat liste aktivnih intervencija         | Pozvati endpoint za aktivne intervencije          | Backend vraća listu intervencija         | Lista aktivnih intervencija je uspješno vraćena.             | Pass   |
| S6-BE-010 | Backend/API testiranje          | Filtriranje intervencija                   | Primijeniti filtere statusa i prioriteta          | Backend vraća filtrirane rezultate       | Intervencije su ispravno filtrirane prema kriterijima.       | Pass   |
| S6-BE-011 | Backend/API testiranje          | Historija intervencija                     | Dohvatiti historiju po lokaciji/uređaju           | Sistem vraća završene intervencije       | Historija intervencija je uspješno vraćena.                  | Pass   |
| S6-BE-012 | Backend/API testiranje          | Kreiranje komentara                        | Dodati komentar na intervenciju                   | Komentar se uspješno sprema              | Komentar je uspješno spremljen.                              | Pass   |
| S6-BE-013 | Validaciono testiranje          | Prazan komentar                            | Poslati prazan komentar                           | Sistem vraća validacionu grešku          | Sistem je odbio prazan komentar.                             | Pass   |
| S6-BE-014 | Backend/API testiranje          | Pregled attachmenta                        | Dohvatiti listu attachmenta                       | Sistem vraća attachmente intervencije    | Attachmenti su uspješno prikazani.                           | Pass   |
| S6-BE-015 | Backend/API testiranje          | Brisanje attachmenta                       | Obrisati postojeći attachment                     | Attachment se uklanja iz sistema         | Attachment je uspješno obrisan.                              | Pass   |
| S6-BE-016 | Backend/API testiranje          | Deaktivacija korisnika                     | Deaktivirati korisnički račun                     | Korisnik gubi pristup sistemu            | Korisnik je uspješno deaktiviran.                            | Pass   |
| S6-BE-017 | Backend/API testiranje          | Reaktivacija korisnika                     | Reaktivirati korisnički račun                     | Korisnik ponovo može pristupiti sistemu  | Korisnik je uspješno reaktiviran.                            | Pass   |
| S6-BE-018 | Validaciono testiranje          | Deaktivacija vlastitog računa              | Admin pokušava deaktivirati vlastiti račun        | Sistem odbija akciju                     | Sistem je spriječio deaktivaciju vlastitog računa.           | Pass   |
| S6-BE-019 | Regresiono testiranje           | Upload attachmenta nakon Sprint 6 izmjena  | Uploadati attachment                              | Funkcionalnost i dalje radi              | Upload attachmenta radi nakon Sprint 6 izmjena.              | Pass   |
| S6-BE-020 | Automatizovano smoke testiranje | Pokretanje backend aplikacije              | Pokrenuti backend aplikaciju i unit testove       | Backend se pokreće bez greške            | Backend aplikacija i unit testovi su uspješno pokrenuti.     | Pass   |

---

# 6.3 Frontend/UI testiranje

| ID testa  | Vrsta testiranja       | Funkcionalnost                  | Koraci testiranja                      | Očekivani ishod                    | Stvarni ishod                                 | Status |
| --------- | ---------------------- | ------------------------------- | -------------------------------------- | ---------------------------------- | --------------------------------------------- | ------ |
| S6-UI-001 | Frontend/UI testiranje | Otvaranje forme za intervenciju | Navigirati na kreiranje intervencije   | Forma se uspješno prikazuje        | Forma za intervenciju je uspješno prikazana.  | Pass   |
| S6-UI-002 | Frontend/UI testiranje | Validacija obaveznih polja      | Ostaviti prazna obavezna polja         | Prikazuju se validacione poruke    | Validacione poruke su ispravno prikazane.     | Pass   |
| S6-UI-003 | Frontend/UI testiranje | Prikaz prioriteta               | Otvoriti listu intervencija            | Prioriteti su vizualno razlikovani | Prioriteti su uspješno vizualno razlikovani.  | Pass   |
| S6-UI-004 | Frontend/UI testiranje | Filtriranje intervencija        | Primijeniti više filtera               | Lista se pravilno filtrira         | Intervencije su pravilno filtrirane.          | Pass   |
| S6-UI-005 | Frontend/UI testiranje | Pregled detalja intervencije    | Otvoriti detalje intervencije          | Detalji su pravilno prikazani      | Detalji intervencije su uspješno prikazani.   | Pass   |
| S6-UI-006 | Frontend/UI testiranje | Dodjela servisera               | Dodijeliti servisera kroz UI           | Dodjela se prikazuje korisniku     | Dodjela servisera je uspješno prikazana.      | Pass   |
| S6-UI-007 | Frontend/UI testiranje | Historija intervencija          | Otvoriti historiju intervencija        | Historija se prikazuje u tabeli    | Historija intervencija je uspješno prikazana. | Pass   |
| S6-UI-008 | Frontend/UI testiranje | Empty state historije           | Otvoriti historiju bez rezultata       | Prikazuje se odgovarajuća poruka   | Empty state poruka je uspješno prikazana.     | Pass   |
| S6-UI-009 | Frontend/UI testiranje | Dodavanje komentara             | Dodati komentar na intervenciju        | Komentar se prikazuje u listi      | Komentar je uspješno prikazan.                | Pass   |
| S6-UI-010 | Frontend/UI testiranje | Kronološki prikaz komentara     | Dodati više komentara                  | Komentari su sortirani kronološki  | Komentari su ispravno sortirani.              | Pass   |
| S6-UI-011 | Frontend/UI testiranje | Pregled attachmenta             | Otvoriti attachment sekciju            | Attachmenti se prikazuju korisniku | Attachmenti su uspješno prikazani.            | Pass   |
| S6-UI-012 | Frontend/UI testiranje | Download attachmenta            | Kliknuti na attachment                 | Fajl se preuzima ili otvara        | Attachment je uspješno otvoren/preuzet.       | Pass   |
| S6-UI-013 | Frontend/UI testiranje | Brisanje attachmenta            | Obrisati attachment                    | Attachment nestaje iz liste        | Attachment je uspješno uklonjen iz prikaza.   | Pass   |
| S6-UI-014 | Frontend/UI testiranje | Pregled korisničkih računa      | Otvoriti admin listu korisnika         | Lista korisnika se prikazuje       | Lista korisnika je uspješno prikazana.        | Pass   |
| S6-UI-015 | Frontend/UI testiranje | Deaktivacija korisnika          | Deaktivirati korisnika kroz UI         | Status korisnika se mijenja        | Korisnik je uspješno deaktiviran kroz UI.     | Pass   |
| S6-UI-016 | Frontend/UI testiranje | Responsivnost stranica          | Otvoriti stranice na manjoj rezoluciji | UI ostaje čitljiv i upotrebljiv    | UI je ostao čitljiv i upotrebljiv.            | Pass   |

---

# 6.4 End-to-end i regresiono testiranje

| ID testa   | Vrsta testiranja      | Scenario                            | Koraci                                            | Očekivani ishod                            | Stvarni ishod                                          | Status |
| ---------- | --------------------- | ----------------------------------- | ------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------ | ------ |
| S6-E2E-001 | End-to-end testiranje | Kreiranje kompletne intervencije    | Kreirati intervenciju sa prioritetom i serviserom | Intervencija se uspješno prikazuje u listi | Intervencija je uspješno kreirana i prikazana.         | Pass   |
| S6-E2E-002 | End-to-end testiranje | Dodavanje komentara                 | Dodati komentar na intervenciju                   | Komentar ostaje trajno vidljiv             | Komentar je trajno vidljiv na intervenciji.            | Pass   |
| S6-E2E-003 | End-to-end testiranje | Historija intervencija              | Otvoriti historiju po lokaciji                    | Prikazuju se završene intervencije         | Historija je uspješno prikazana.                       | Pass   |
| S6-E2E-004 | End-to-end testiranje | Upravljanje attachmentima           | Uploadati i obrisati attachment                   | Attachment se pravilno prikazuje i briše   | Attachment funkcionalnost radi ispravno.               | Pass   |
| S6-E2E-005 | Regresiono testiranje | Provjera postojećih funkcionalnosti | Testirati postojeće funkcionalnosti sistema       | Postojeće funkcionalnosti i dalje rade     | Nije primijećena regresija postojećih funkcionalnosti. | Pass   |

---

# 6.5 Unit testiranje

| ID testa    | Vrsta testiranja | Funkcionalnost                   | Alat    | Očekivani rezultat         | Stvarni rezultat                            | Status |
| ----------- | ---------------- | -------------------------------- | ------- | -------------------------- | ------------------------------------------- | ------ |
| S6-UNIT-001 | Unit testiranje  | Pokretanje frontend unit testova | VS Code | Testovi prolaze bez greške | Frontend unit testovi su uspješno prošli.   | Pass   |
| S6-UNIT-002 | Unit testiranje  | Pokretanje backend unit testova  | VS Code | Testovi prolaze bez greške | Backend unit testovi su uspješno prošli.    | Pass   |
| S6-UNIT-003 | Unit testiranje  | Validacija poslovne logike       | VS Code | Validacije rade očekivano  | Poslovna logika i validacije rade ispravno. | Pass   |

---

# 6.6 Zaključak testiranja

Tokom Sprinta 6 testirane su funkcionalnosti vezane za upravljanje intervencijama, prioritetima, dodjelu servisera, historiju intervencija, upravljanje korisnicima, komentare i attachmente.

Zaključak:

* Testirano je kreiranje i uređivanje intervencija.
* Testirane su validacije obaveznih polja i poslovnih pravila.
* Testirana je dodjela servisera i filtriranje aktivnih intervencija.
* Provjeren je pregled historije intervencija po lokaciji/uređaju.
* Testirano je upravljanje korisničkim računima i RBAC ponašanje sistema.
* Testirani su komentari i attachment funkcionalnosti.
* Izvršeno je regresiono testiranje postojećih funkcionalnosti.
* Pokrenuti su frontend i backend unit testovi kroz VS Code okruženje.
* Svi evidentirani testovi za Sprint 6 imaju status Pass.
