# Sprint 10 - Sprint Goal

## Sprint cilj

Implementirati napredne operativne funkcionalnosti sistema: analitiku feedbacka, upravljanje dostupnošću servisera, potvrdu i promjenu termina od strane korisnika, bazu znanja preporučenih rješenja, evidenciju utrošenog materijala, eskalacije rizičnih intervencija, zahtjev za ponovno otvaranje završenih intervencija i evidenciju dolaska servisera na terenu.

## Ključne stavke koje tim želi završiti

* Analitika feedbacka i kvaliteta usluge (PBI-052)
* Upravljanje dostupnošću i odsustvima servisera (PBI-053)
* Potvrda i promjena termina intervencije od strane korisnika (PBI-054)
* Baza znanja i preporučena rješenja za kvarove (PBI-055)
* Evidencija materijala utrošenog na intervenciji (PBI-056)
* Eskalacije i komentari ka menadžmentu za rizične intervencije (PBI-058)
* Zahtjev za ponovno otvaranje završene intervencije (PBI-059)
* Evidencija dolaska servisera i vremena na terenu (PBI-060)
* Digitalna potvrda izvrsene intervencije (PBI-061)
* Pauziranje intervencije zbog blokera (PBI-062)

## Rizici i zavisnosti

### Rizici

* Rizik: PBI-060 (Evidencija dolaska servisera) uvodi nove operativne checkpointe koji zahtijevaju izmjene u šemi baze podataka i logici statusa intervencije, što može utjecati na stabilnost PBI-008 (Praćenje statusa).

* Rizik: PBI-059 (Zahtjev za ponovnim otvaranjem) mijenja tok zatvaranja intervencije i može uzrokovati neočekivane slučajeve kada je intervencija u međustanju (npr. feedback već ostavljen, eskalacija aktivna).

* Rizik: PBI-053 (Dostupnost servisera) zahtijeva koordinaciju s logikom dodjele iz PBI-006, pogrešna implementacija može blokirati dodjelu ili prikazivati netačne podatke o dostupnosti.

* Rizik: PBI-055 (Baza znanja) zahtijeva da finalizovani izvještaji iz PBI-010 budu stabilni i potpuni; kvalitet baze znanja direktno ovisi o kvalitetu podataka unesenih u prethodnim sprintovima.

* Rizik: PBI-052 (Analitika feedbacka) zahtijeva dovoljnu količinu feedbacka u bazi podataka za smisleno testiranje agregatnih rezultata.

### Zavisnosti

* Zavisnost: PBI-052 zavisi od PBI-036 (Feedback mehanizam), jer analitika nema podataka bez feedback zapisa.

* Zavisnost: PBI-053 zavisi od PBI-006 (Dodjela servisera), jer dostupnost mora biti integrirana u ekran za dodjelu.

* Zavisnost: PBI-054 zavisi od PBI-004 (Planiranje intervencija) i PBI-012 (Notifikacije), jer potvrda termina počinje notifikacijom pri zakazivanju.

* Zavisnost: PBI-055 zavisi od PBI-010 (Evidencija izvještaja), jer baza znanja gradi se iz finalizovanih izvještaja servisera.

* Zavisnost: PBI-056 zavisi od PBI-010 (Evidencija izvještaja), jer materijali se evidentiraju kao dio izvještaja o intervenciji.

* Zavisnost: PBI-058 zavisi od PBI-007 (Pregled intervencija) i PBI-014 (Menadžment dashboard), jer eskalirane intervencije moraju biti vidljive na tim mjestima.

* Zavisnost: PBI-059 zavisi od PBI-008 (Praćenje statusa) i PBI-012 (Notifikacije), jer zahtjev mijenja status i okida notifikacije serviseru.

* Zavisnost: PBI-060 zavisi od PBI-008 (Praćenje statusa) i PBI-012 (Notifikacije), jer checkpointi su proširenje statusa i šalju notifikacije korisniku.