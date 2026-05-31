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

# Sprint 10 – Testiranje analitike feedbacka, dostupnosti servisera, baze znanja, evidencije materijala, eskalacija, ponovnog otvaranja, evidencije dolaska servisera, digitalne potvrde i pauziranja intervencija

## 10.1 Funkcionalnosti koje se testiraju

U Sprintu 10 fokus testiranja je na naprednim operativnim funkcionalnostima sistema.

Testirane funkcionalnosti uključuju:

* analitiku feedbacka s filterima po periodu, firmi, kategoriji i serviseru,
* upravljanje dostupnošću i odsustvima servisera pri dodjeli,
* potvrdu i zahtjev za promjenu termina od strane korisnika,
* bazu znanja s preporučenim rješenjima iz finalizovanih izvještaja,
* evidenciju utrošenog materijala u sklopu izvještaja o intervenciji,
* eskalacije rizičnih intervencija s odvojenim eskalacijskim komentarima,
* zahtjev za ponovnim otvaranjem završenih intervencija,
* evidenciju dolaska servisera s tri operativna checkpointa,
* digitalnu potvrdu izvršene intervencije putem PIN-a ili potpisa,
* pauziranje intervencije zbog blokera s predefinisanim razlozima,
* regresiono testiranje postojećih funkcionalnosti,
* frontend/UI testiranje,
* backend/API testiranje,
* unit testove pokretane kroz VS Code okruženje.

---

## 10.2 Backend/API testiranje

| ID testa | Vrsta testiranja | Funkcionalnost | Ulaz / koraci | Očekivani ishod | Stvarni ishod | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S10-BE-001 | Backend/API testiranje | Pregled agregirane analitike feedbacka | Menadžment otvori analitički pregled feedbacka | Prikazana prosječna ocjena, broj feedbacka i broj negativnih feedbacka | Analitički pregled je uspješno prikazan s ispravnim agregiranim podacima. | Pass |
| S10-BE-002 | Validaciono testiranje | Filtriranje analitike po periodu, firmi i serviseru | Korisnik primijeni kombinaciju filtera | Vraćeni rezultati odgovaraju odabranim filterima | Filtriranje je ispravno primijenjeno; rezultati su konzistentni s podacima u bazi. | Pass |
| S10-BE-003 | Validaciono testiranje | Zabrana pristupa analitici za korisnike bez ovlasti | Korisnik s ulogom Serviser pokuša pristupiti analitici | Sistem vraća grešku 403 | Sistem je ispravno odbio pristup korisniku bez ovlasti. | Pass |
| S10-BE-004 | Backend/API testiranje | Kreiranje perioda nedostupnosti servisera | Serviser unese period nedostupnosti s datumom i razlogom | Period je sačuvan i vidljiv koordinatoru pri dodjeli | Period nedostupnosti je uspješno kreiran i prikazan u listi servisera. | Pass |
| S10-BE-005 | Validaciono testiranje | Zabrana kreiranja perioda nedostupnosti s datumom u prošlosti | Serviser unese period čiji je kraj u prošlosti | Sistem vraća validacijsku grešku | Sistem je ispravno odbio period s datumom u prošlosti. | Pass |
| S10-BE-006 | Validaciono testiranje | Zabrana automatske dodjele nedostupnog servisera | Sistem pokuša automatski dodijeliti intervenciju nedostupnom serviseru | Sistem preskače nedostupnog servisera | Automatska dodjela je ispravno zaobišla nedostupnog servisera. | Pass |
| S10-BE-007 | Backend/API testiranje | Potvrda termina od strane korisnika | Korisnik potvrdi predloženi termin intervencije | Potvrda je evidentirana u historiji | Potvrda termina je uspješno sačuvana i vidljiva koordinatoru. | Pass |
| S10-BE-008 | Backend/API testiranje | Zahtjev za promjenu termina | Korisnik unese alternativni termin i komentar | Zahtjev je kreiran i vidljiv koordinatoru | Zahtjev za promjenu termina je uspješno kreiran. | Pass |
| S10-BE-009 | Validaciono testiranje | Zabrana višestrukih aktivnih zahtjeva za promjenu termina | Korisnik pokuša kreirati drugi zahtjev za promjenu termina na istoj intervenciji | Sistem vraća grešku | Sistem je ispravno odbio duplikat zahtjeva za promjenu termina. | Pass |
| S10-BE-010 | Backend/API testiranje | Označavanje finalizovanog izvještaja kao preporučenog rješenja | Koordinator označi finalizovan izvještaj kao preporučeno rješenje | Izvještaj je označen i vidljiv u bazi znanja | Označavanje je uspješno izvršeno. | Pass |
| S10-BE-011 | Validaciono testiranje | Zabrana označavanja nacrta kao preporučenog rješenja | Koordinator pokuša označiti izvještaj u statusu Nacrt | Sistem vraća grešku 403 | Sistem je ispravno odbio označavanje nacrta. | Pass |
| S10-BE-012 | Backend/API testiranje | Pretraga baze znanja po kategoriji | Serviser pretraži bazu znanja po kategoriji kvara | Prikazana relevantna preporučena rješenja | Pretraga je ispravno vratila relevantna rješenja. | Pass |
| S10-BE-013 | Backend/API testiranje | Dodavanje materijala u izvještaj intervencije | Serviser doda stavku materijala s nazivom, količinom i napomenom | Materijal je sačuvan i vidljiv u izvještaju | Evidencija materijala je uspješno kreirana. | Pass |
| S10-BE-014 | Validaciono testiranje | Zabrana negativnih i praznih količina materijala | Serviser unese negativnu ili praznu količinu | Sistem vraća validacijsku grešku | Sistem je ispravno odbio neispravne količine. | Pass |
| S10-BE-015 | Backend/API testiranje | Agregirani pregled potrošnje materijala za menadžment | Menadžment otvori pregled materijala za odabrani period i firmu | Prikazan agregirani pregled po periodu, firmi i kategoriji | Agregirani pregled je uspješno prikazan. | Pass |
| S10-BE-016 | Backend/API testiranje | Označavanje intervencije kao rizične | Koordinator označi intervenciju kao rizičnu s obaveznim razlogom | Eskalacija je kreirana i vidljiva menadžmentu | Eskalacija je uspješno evidentirana. | Pass |
| S10-BE-017 | Backend/API testiranje | Kreiranje eskalacijskog komentara | Koordinator doda eskalacijski komentar | Komentar je sačuvan odvojeno od redovnih komentara | Eskalacijski komentar je uspješno kreiran u zasebnoj kolekciji. | Pass |
| S10-BE-018 | Validaciono testiranje | Zabrana pristupa eskalacijskim komentarima za neovlaštene uloge | Korisnik s ulogom Serviser pokuša pristupiti eskalacijskim komentarima | Sistem vraća grešku 403 | Sistem je ispravno odbio neovlašteni pristup. | Pass |
| S10-BE-019 | Backend/API testiranje | Kreiranje zahtjeva za ponovnim otvaranjem intervencije | Korisnik podnese zahtjev za ponovnim otvaranjem završene intervencije | Zahtjev je kreiran s obaveznim obrazloženjem i vidljiv koordinatoru | Zahtjev za ponovnim otvaranjem je uspješno kreiran. | Pass |
| S10-BE-020 | Validaciono testiranje | Zabrana zahtjeva za ponovnim otvaranjem za intervenciju koja nije završena | Korisnik pokuša podnijeti zahtjev za intervenciju u statusu U procesu | Sistem vraća grešku | Sistem je ispravno odbio zahtjev. | Pass |
| S10-BE-021 | Backend/API testiranje | Prihvatanje zahtjeva za ponovnim otvaranjem od strane koordinatora | Koordinator prihvati zahtjev uz komentar | Intervencija se vraća u aktivni status, serviseri obavješteni | Prihvatanje je uspješno izvršeno; status intervencije je promijenjen. | Pass |
| S10-BE-022 | Validaciono testiranje | Prihvatanje zahtjeva ne briše prethodni feedback | Koordinator prihvati zahtjev za ponovnim otvaranjem | Prethodni feedback ostaje sačuvan | Feedback nije obrisan ni resetovan pri ponovnom otvaranju. | Pass |
| S10-BE-023 | Backend/API testiranje | Označavanje checkpointa krenuo na lokaciju | Serviser označi polazak prema lokaciji | Checkpoint je sačuvan s tačnim vremenom i audit logom | Checkpoint je uspješno evidentiran. | Pass |
| S10-BE-024 | Backend/API testiranje | Označavanje checkpointa stigao na lokaciju | Serviser označi dolazak na lokaciju | Checkpoint je sačuvan i korisnik je obavješten | Checkpoint i notifikacija su uspješno procesovani. | Pass |
| S10-BE-025 | Validaciono testiranje | Zabrana označavanja dolaska prije polaska | Serviser pokuša označiti dolazak bez prethodnog polaska | Sistem vraća grešku | Sistem je ispravno primijenio redosljed checkpointa. | Pass |
| S10-BE-026 | Backend/API testiranje | Pokretanje zahtjeva za digitalnom potvrdom | Serviser pokrene zahtjev za potvrdom od korisnika | Zahtjev je kreiran s jednokratnim PIN-om | Zahtjev za digitalnom potvrdom je uspješno iniciran. | Pass |
| S10-BE-027 | Backend/API testiranje | Potvrda intervencije od strane korisnika putem PIN-a | Korisnik unese ispravan PIN | Potvrda je sačuvana i vidljiva koordinatoru | Digitalna potvrda je uspješno evidentirana. | Pass |
| S10-BE-028 | Validaciono testiranje | Odbijanje potvrde s razlogom | Korisnik odbije potvrdu i unese razlog | Odbijanje je sačuvano bez mijenjanja ocjene | Sistem je ispravno evidentirao odbijanje bez promjene feedbacka. | Pass |
| S10-BE-029 | Backend/API testiranje | Pauziranje intervencije zbog blokera | Serviser pauzira intervenciju s razlogom iz predefinisane liste | Intervencija je označena kao pauzirana i vidljiva u posebnom pregledu | Pauziranje je uspješno izvršeno. | Pass |
| S10-BE-030 | Validaciono testiranje | Zabrana pauziranja s razlogom ostalo bez opisa | Serviser odabere razlog ostalo bez unesenog opisa | Sistem vraća validacijsku grešku | Sistem je ispravno odbio prazno polje za opis uz razlog ostalo. | Pass |
| S10-BE-031 | Validaciono testiranje | Zabrana pauziranja završene intervencije | Serviser pokuša pauzirati intervenciju u statusu Završeno | Sistem vraća grešku | Sistem je ispravno odbio pauziranje završene intervencije. | Pass |
| S10-BE-032 | Regresiono testiranje | Postojeće funkcionalnosti nakon Sprint 10 | Testirati prethodne API funkcionalnosti | Postojeće funkcionalnosti rade | Nije primijećena regresija sistema nakon Sprint 10 izmjena. | Pass |
| S10-BE-033 | Automatizovano smoke testiranje | Pokretanje backend aplikacije | Pokrenuti backend i testove | Backend radi bez greške | Backend aplikacija i testovi su uspješno pokrenuti. | Pass |

---

## 10.3 Frontend/UI testiranje

| ID testa | Vrsta testiranja | Funkcionalnost | Koraci testiranja | Očekivani ishod | Stvarni ishod | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S10-UI-001 | Frontend/UI testiranje | Prikaz analitike feedbacka na dashboardu | Otvoriti analitički pregled kao menadžment | Prikazani agregirani podaci s filterima | Analitički pregled je uspješno prikazan s filterima po periodu, firmi, kategoriji i serviseru. | Pass |
| S10-UI-002 | Frontend/UI testiranje | Posebno označavanje negativnog feedbacka | Pregledati analitiku s negativnim ocjenama | Negativni feedback vizualno istaknut | Negativni feedback je ispravno vizualno označen prema dogovorenom pragu. | Pass |
| S10-UI-003 | Frontend/UI testiranje | Prikaz dostupnosti servisera pri dodjeli | Koordinator otvori modal za dodjelu servisera | Nedostupni serviseri jasno označeni | Nedostupni serviseri su ispravno vizualno razlikovani od dostupnih. | Pass |
| S10-UI-004 | Frontend/UI testiranje | Forma za unos perioda nedostupnosti | Serviser otvori formu za unos perioda nedostupnosti | Forma s potrebnim poljima je prikazana | Forma je uspješno prikazana s datumskim i tekstualnim poljima. | Pass |
| S10-UI-005 | Frontend/UI testiranje | Prikaz notifikacije o zakazanom terminu | Korisnik prima notifikaciju o zakazanom terminu | Notifikacija je prikazana s opcijama za potvrdu i zahtjev za promjenu | Notifikacija je ispravno prikazana s odgovarajućim akcijama. | Pass |
| S10-UI-006 | Frontend/UI testiranje | Forma za zahtjev za promjenom termina | Korisnik otvori formu za zahtjev za promjenom | Forma s poljem za novi termin i komentar | Forma je uspješno prikazana i funkcionalna. | Pass |
| S10-UI-007 | Frontend/UI testiranje | Prikaz baze znanja na detalju intervencije | Serviser otvori detalj intervencije | Prikazana relevantna preporučena rješenja za istu kategoriju | Preporučena rješenja su ispravno prikazana na detalju intervencije. | Pass |
| S10-UI-008 | Frontend/UI testiranje | Forma za evidenciju materijala u izvještaju | Serviser otvori formu za unos materijala | Forma s dinamičnom listom materijala | Forma s dodavanjem stavki materijala je uspješno prikazana. | Pass |
| S10-UI-009 | Frontend/UI testiranje | Prikaz eskalacijskih komentara odvojeno | Koordinator otvori detalj eskalirane intervencije | Eskalacijski komentari prikazani u zasebnoj sekciji | Eskalacijski komentari su ispravno odvojeni od redovnih komentara. | Pass |
| S10-UI-010 | Frontend/UI testiranje | Dugme za eskalaciju intervencije | Koordinator otvori detalj intervencije | Vidljiva opcija za označavanje kao rizično | Opcija eskalacije je ispravno prikazana koordinatoru. | Pass |
| S10-UI-011 | Frontend/UI testiranje | Prikaz checkpointa servisera na terenu | Serviser otvori aktivnu intervenciju | Prikazani checkpointi s aktualnim statusom | Checkpointi su ispravno prikazani s trenutnim stanjem. | Pass |
| S10-UI-012 | Frontend/UI testiranje | Prikaz zahtjeva za ponovnim otvaranjem | Koordinator otvori listu zahtjeva za ponovnim otvaranjem | Prikazani zahtjevi s obrazloženjem i statusima | Lista zahtjeva je ispravno prikazana s potrebnim informacijama. | Pass |
| S10-UI-013 | Frontend/UI testiranje | Forma za digitalnu potvrdu | Serviser pokrene zahtjev za potvrdom | Korisnik vidi formu za unos PIN-a ili potpisa | Forma za digitalnu potvrdu je uspješno prikazana korisniku. | Pass |
| S10-UI-014 | Frontend/UI testiranje | Prikaz statusa digitalne potvrde | Koordinator otvori detalj završene intervencije | Status potvrde vidljiv (potvrđeno / odbijeno / čeka) | Status digitalne potvrde je ispravno prikazan koordinatoru. | Pass |
| S10-UI-015 | Frontend/UI testiranje | Forma za pauziranje intervencije | Koordinator ili serviser otvori opciju pauziranja | Prikazana forma s predefinisanom listom razloga | Forma za pauziranje je uspješno prikazana s odgovarajućim razlozima. | Pass |
| S10-UI-016 | Frontend/UI testiranje | Posebno označavanje pauziranih intervencija u listi | Pregledati listu intervencija s pauziranim stavkama | Pauzirane intervencije vizualno istaknute | Pauzirane intervencije su ispravno vizualno razlikovane od aktivnih. | Pass |
| S10-UI-017 | Frontend/UI testiranje | Responsivnost novih stranica | Otvoriti nove stranice na manjoj rezoluciji | UI ostaje funkcionalan | UI je ostao pregledan i funkcionalan na manjim rezolucijama. | Pass |

---

## 10.4 End-to-end i regresiono testiranje

| ID testa | Vrsta testiranja | Scenario | Koraci | Očekivani ishod | Stvarni ishod | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S10-E2E-001 | End-to-end testiranje | Puni tok evidencije dolaska servisera | Serviser označi polazak, dolazak i završetak; korisnik prima notifikacije; koordinator vidi checkpoint historiju | Sva tri checkpointa evidentirana, notifikacije isporučene, historija vidljiva | Tok evidencije dolaska servisera radi ispravno kroz sve komponente. | Pass |
| S10-E2E-002 | End-to-end testiranje | Tok eskalacije rizične intervencije | Koordinator eskalira intervenciju; menadžment vidi eskalaciju na dashboardu; koordinator doda eskalacijski komentar | Eskalacija vidljiva menadžmentu odvojeno od redovnih komentara | Eskalacijski tok uspješno radi kroz cijeli sistem. | Pass |
| S10-E2E-003 | End-to-end testiranje | Tok ponovnog otvaranja intervencije | Korisnik podnese zahtjev; koordinator prihvati; serviser obaviješten; prethodni feedback sačuvan | Intervencija vraćena u aktivni status, feedback netaknut | Tok ponovnog otvaranja uspješno funkcioniše bez gubitka historijata. | Pass |
| S10-E2E-004 | End-to-end testiranje | Tok digitalne potvrde izvršene intervencije | Serviser inicira zahtjev; korisnik potvrdi PIN-om; koordinator vidi potvrdu | Potvrda evidentirana, intervencija se može zatvoriti | Digitalna potvrda uspješno radi kroz frontend i backend. | Pass |
| S10-E2E-005 | End-to-end testiranje | Tok pauziranja i nastavka intervencije | Serviser pauzira intervenciju; korisnik prima notifikaciju; koordinator vidi razlog; serviser nastavi rad | Pauza i nastavak evidentirani u historiji s vremenima | Pauziranje i nastavak uspješno funkcionišu. | Pass |
| S10-E2E-006 | End-to-end testiranje | Tok baze znanja - označavanje i korištenje | Koordinator označi finalizovan izvještaj; serviser pronađe rješenje u bazi znanja; serviser koristi predložak za novi izvještaj | Rješenje dostupno u pretrazi, predložak uredno primijenjen | Tok baze znanja uspješno radi od označavanja do korištenja. | Pass |
| S10-E2E-007 | End-to-end testiranje | Tok evidencije materijala u izvještaju | Serviser doda materijale u izvještaj; koordinator vidi listu; menadžment pregledava agregirani pregled | Materijali vidljivi na detaljnom i agregatnom nivou | Tok evidencije materijala uspješno funkcioniše. | Pass |
| S10-E2E-008 | Regresiono testiranje | Provjera postojećih funkcionalnosti | Testirati prethodne sprint funkcionalnosti | Sistem radi stabilno | Nije primijećena regresija sistema nakon Sprint 10 izmjena. | Pass |

---
 
## 10.5 Unit testiranje
 
| ID testa | Vrsta testiranja | Funkcionalnost | Alat | Očekivani rezultat | Stvarni rezultat | Status |
| --- | --- | --- | --- | --- | --- | --- |
| S10-UNIT-001 | Unit testiranje | Pokretanje frontend unit testova | VS Code | Testovi prolaze bez greške | Frontend unit testovi su uspješno prošli. | Pass |
| S10-UNIT-002 | Unit testiranje | Pokretanje backend unit testova | VS Code | Testovi prolaze bez greške | Backend unit testovi su uspješno prošli. | Pass |
| S10-UNIT-003 | Unit testiranje | Validacija analitike feedbacka | VS Code | Agregirani podaci se ispravno računaju uz RBAC zaštitu | Logika analitike feedbacka radi ispravno. | Pass |
| S10-UNIT-004 | Unit testiranje | Validacija upravljanja dostupnošću servisera | VS Code | Period nedostupnosti se kreira i validira ispravno | Logika dostupnosti servisera radi ispravno. | Pass |
| S10-UNIT-005 | Unit testiranje | Validacija potvrde i promjene termina | VS Code | Potvrda i zahtjev za promjenom termina rade očekivano | Logika upravljanja terminima radi ispravno. | Pass |
| S10-UNIT-006 | Unit testiranje | Validacija baze znanja i preporučenih rješenja | VS Code | Označavanje preporučenih rješenja ograničeno na finalizovane izvještaje | Logika baze znanja radi ispravno. | Pass |
| S10-UNIT-007 | Unit testiranje | Validacija evidencije materijala | VS Code | Materijali se kreiraju i validiraju ispravno; negativne količine su odbijene | Logika evidencije materijala radi ispravno. | Pass |
| S10-UNIT-008 | Unit testiranje | Validacija eskalacija intervencija | VS Code | Eskalacijski komentari su odvojeni od redovnih; RBAC pristup radi ispravno | Logika eskalacija radi ispravno. | Pass |
| S10-UNIT-009 | Unit testiranje | Validacija zahtjeva za ponovnim otvaranjem | VS Code | Zahtjev se kreira i prihvata bez brisanja prethodnog feedbacka | Logika ponovnog otvaranja radi ispravno. | Pass |
| S10-UNIT-010 | Unit testiranje | Validacija evidencije dolaska servisera | VS Code | Checkpointi se evidentiraju u ispravnom redoslijedu uz audit log | Logika evidencije dolaska radi ispravno. | Pass |
| S10-UNIT-011 | Unit testiranje | Validacija digitalne potvrde intervencije | VS Code | Potvrda putem PIN-a radi ispravno i ne utiče na feedback ocjenu | Logika digitalne potvrde radi ispravno. | Pass |
| S10-UNIT-012 | Unit testiranje | Validacija pauziranja intervencije | VS Code | Pauza se evidentira s ispravnim razlogom; završene intervencije ne mogu biti pauzirane | Logika pauziranja intervencije radi ispravno. | Pass |
 
---

## 10.6 Zaključak testiranja

Tokom Sprinta 10 testirane su napredne operativne funkcionalnosti: analitika feedbacka, upravljanje dostupnošću servisera, potvrda i promjena termina, baza znanja preporučenih rješenja, evidencija materijala, eskalacije rizičnih intervencija, ponovnog otvaranje završenih intervencija, evidencija dolaska servisera s checkpointima, digitalna potvrda izvršene intervencije i pauziranje intervencija zbog blokera.

Zaključak:

* Testirana je analitika feedbacka s filterima po periodu, firmi, kategoriji i serviseru uz RBAC zaštitu od neovlaštenog pristupa.
* Testirana je evidencija dostupnosti servisera s validacijom vremenskog opsega i zabranom automatske dodjele nedostupnog servisera.
* Testiran je tok potvrde termina i zahtjeva za promjenom termina uz zabranu višestrukih aktivnih zahtjeva.
* Testirana je baza znanja s ograničenjem da samo finalizovani izvještaji mogu biti označeni kao preporučena rješenja.
* Testirana je evidencija materijala s validacijom količina i agregatnim pregledom za menadžment.
* Testiran je eskalacijski tok s odvojenim komentarima i RBAC zaštitom pristupa eskalacijskim komentarima.
* Testiran je tok ponovnog otvaranja uz provjeru da prethodni feedback ostaje sačuvan pri prihvatanju zahtjeva.
* Testirana su tri fiksna operativna checkpointa za evidenciju dolaska servisera uz provjeru redosljeda i audit loga.
* Testirana je digitalna potvrda putem PIN-a uz provjeru da potvrda ne utiče na feedback ocjenu.
* Testirano je pauziranje intervencija s predefinisanom listom razloga i obaveznim opisom uz razlog ostalo.
* Izvršeno je regresiono testiranje postojećih funkcionalnosti.
* Pokrenuti su frontend i backend unit testovi kroz VS Code okruženje.
* Svi evidentirani testovi za Sprint 10 imaju status Pass.