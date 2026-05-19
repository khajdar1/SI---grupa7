# Sprint 8 - Sprint Goal

## Sprint cilj

Implementirati funkcionalnosti notifikacija, preventivnog održavanja, detekcije duplikata prijava kvarova, tiket sistema za podršku i dvosmjerne komunikacije unutar tiketa. Paralelno unaprijediti upravljanje intervencijama kroz mapski prikaz, export podataka u PDF format i podršku za masovne akcije nad intervencijama.

## Ključne stavke koje tim želi završiti

* Notifikacije (PBI-012)
* Planirana/preventivna održavanja (PBI-022)
* Detekcija duplikata prijave kvara (PBI-025)
* Kreiranje tiketa za podršku (PBI-027)
* Dvosmjerna komunikacija na tiketu (PBI-028)
* Geografski/mapski prikaz intervencija (PBI-034)
* Export podataka (PBI-023)
* Masovne akcije na intervencijama (PBI-038)

## Rizici i zavisnosti

### Rizici

* Rizik: PBI-012 (Notifikacije) zahtijeva gotovo real-time ažuriranje podataka; problemi sa sinkronizacijom mogu dovesti do kašnjenja ili propuštenih obavijesti.

* Rizik: PBI-022 (Planirana/preventivna održavanja) uvodi automatsko generisanje intervencija, što može izazvati probleme sa dupliranjem ili nekonzistentnim rasporedima ako periodičnost nije pravilno implementirana.

* Rizik: PBI-025 (Detekcija duplikata prijava) može generisati lažno pozitivne rezultate ukoliko logika poređenja lokacije i opisa prijave nije dovoljno precizna.

* Rizik: PBI-027 i PBI-028 uvode novi tiket sistem i komunikaciju unutar aplikacije; nepravilna kontrola pristupa može dovesti do prikaza tuđih tiketa ili poruka neovlaštenim korisnicima.

* Rizik: PBI-034 (Mapski prikaz intervencija) zavisi od tačnosti lokacijskih podataka; intervencije bez validne lokacije neće biti moguće prikazati na mapi.

* Rizik: PBI-023 (Export podataka) može imati probleme performansi pri generisanju većih PDF izvještaja i zahtijeva pravilnu implementaciju role-based pristupa podacima.

* Rizik: PBI-038 (Masovne akcije) može dovesti do nekonzistentnog stanja podataka ukoliko sistem ne osigura atomarno izvršavanje akcija nad više intervencija.

### Zavisnosti

* Zavisnost: PBI-012 zavisi od postojećih funkcionalnosti prijave kvara (PBI-003) i dodjele servisera (PBI-006), jer se notifikacije generišu na osnovu tih događaja.

* Zavisnost: PBI-022 zavisi od sistema planiranja intervencija (PBI-004), jer preventivna održavanja koriste postojeći model intervencija i rasporeda.

* Zavisnost: PBI-025 zavisi od PBI-003 (Prijava kvara), jer sistem analizira postojeće prijave radi detekcije potencijalnih duplikata.

* Zavisnost: PBI-027 i PBI-028 zavise od autentifikacije korisnika i RBAC sistema, jer tiket komunikacija mora biti ograničena na vlasnika tiketa i agente podrške.

* Zavisnost: PBI-034 zavisi od lokacijskih podataka definisanih kroz planiranje intervencija (PBI-004) i liste intervencija (PBI-007).

* Zavisnost: PBI-023 zavisi od postojećeg sistema izvještaja i liste intervencija (PBI-010 i PBI-007), jer export koristi iste podatke za generisanje PDF dokumenata.

* Zavisnost: PBI-038 zavisi od funkcionalnosti upravljanja intervencijama, dodjele servisera i promjene statusa (PBI-006, PBI-007 i PBI-008), jer masovne akcije koriste postojeće operacije nad intervencijama.
