# Sprint 7 Review

## 1. Planirani sprint goal

Implementirati funkcionalnosti evidencije izvještaja o intervenciji, upravljanja korisničkim profilom i resetom lozinke, menadžment dashboard za pregled operativnih podataka, te kalendarski prikaz intervencija za koordinatore. Paralelno unaprijediti upravljanje kompanijama kroz ulogu `KompanijaAdmin`, samoregistraciju kompanija i zaštitu pristupa company management funkcionalnostima.

## 2. Šta je završeno

Tim je uspješno realizirao sve planirane aktivnosti za ovaj sprint, uključujući realizaciju sljedećih PBI-eva:

* PBI-014 — Menadžment dashboard
* PBI-015 — Upravljanje korisničkim profilom i reset lozinke
* PBI-020 — Kalendarski prikaz intervencija
* PBI-049 — Upravljanje kompanijama i uloga KompanijaAdmin
* PBI-010 — Evidencija izvještaja o intervenciji

## 3. Šta nije završeno

* Sprint Retrospective
* Test Proof

Sve ostale planirane stavke za Sprint 7 su uspješno završene.

## 4. Demonstrirane funkcionalnosti ili artefakti

* Prikaz menadžment dashboard statistika
* Pregled aktivnih i završenih intervencija
* Prikaz distribucije intervencija po prioritetu
* Prikaz prosječnog vremena rješavanja intervencija
* Upravljanje korisničkim profilom
* Promjena lozinke korisnika
* Reset lozinke putem email linka
* Kalendarski prikaz intervencija
* Pregled detalja intervencije iz kalendara
* Kreiranje kompanija kroz admin panel
* Samoregistracija kompanija
* Upravljanje kompanijskim profilima
* RBAC zaštita company management funkcionalnosti
* Unos izvještaja o intervenciji
* Pregled izvještaja unutar detalja intervencije
* Ažuriran Sprint Backlog

## 5. Glavni problemi i blokeri

* Implementacija reset password funkcionalnosti zahtijevala je dodatno usklađivanje email konfiguracije i sigurnosnih tokena.
* Upravljanje kompanijama i nova rola `KompanijaAdmin` zahtijevali su dodatnu validaciju RBAC pravila i zaštitu pristupa podacima kompanija.
* Kalendarski prikaz intervencija zahtijevao je dodatno frontend usklađivanje radi pravilnog prikaza rasporeda i termina intervencija.

## 6. Ključne odluke donesene u sprintu

* Dashboard funkcionalnosti dostupne su isključivo korisnicima sa Admin i Menadžment ulogama.
* Grafički prikazi nisu implementirani u MVP verziji dashboarda.
* KompanijaAdmin korisnici imaju pristup isključivo vlastitoj kompaniji.
* Reset lozinke implementiran je kroz vremenski ograničene i jednokratne reset tokene.
* Evidencija izvještaja omogućena je samo za započete ili završene intervencije.

## 7. Povratna informacija Product Ownera

Product Owner je zadovoljan realizovanim funkcionalnostima sprinta, posebno dashboard pregledom, upravljanjem kompanijama i kalendarskim prikazom intervencija. Istaknuto je da su funkcionalnosti stabilne i dobro integrisane sa postojećim sistemom, uz preporuku za dalje unapređenje notifikacija i automatizacije u narednim sprintovima.

## 8. Zaključak za naredni sprint

Za Sprint 8 planiran je nastavak implementacije sljedećih funkcionalnosti:

* Notifikacije
* Planirana/preventivna održavanja
* Detekcija duplikata prijava kvarova
* Kreiranje tiketa za podršku
* Dvosmjerna komunikacija na tiketu
* Geografski/mapski prikaz intervencija
* Export podataka
* Masovne akcije na intervencijama
