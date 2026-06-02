# Sprint Retrospektiva — Sprint 10

**Projekat:** Sistem za upravljanje servisnim intervencijama

**Datum:** 01.06.2026.

**Scrum Master:** Kerim Hajdar

**Prisustvo:** Cijeli tim

---

## Šta je išlo dobro

* Sprint 10 uspješno je proširio sistem kroz implementaciju eskalacija rizičnih intervencija, upravljanja dostupnošću servisera, potvrde izvođenja i baze znanja.

* Eskalacijski proces implementiran je s jasnom podjelom uloga između koordinatora i menadžmenta, što je omogućilo pregledan nadzor nad intervencijama koje zahtijevaju posebnu pažnju.

* Zahtjev za ponovnim otvaranjem završenih intervencija uveden je kao strukturiran tok odobrenja, čime je izbjegnuto neformalno mijenjanje statusa izvan definisanog procesa.

---

## Šta nije išlo dobro

* Upravljanje dostupnošću servisera uvelo je više međusobno zavisnih PBI-eva unutar sprinta, što je zahtijevalo pažljivu koordinaciju pri dodjeli intervencija.

* Evidencija dolaska servisera na teren zahtijevala je više usklađivanja između članova tima nego što je inicijalno planirano.

---

## Šta treba promijeniti

* Unaprijediti pregled eskalacija i komentara menadžmenta dodavanjem filtiranja po statusu kako bi rukovodioci brže pronašli intervencije koje zahtijevaju njihovu akciju.
---

## Konkretne akcije u Sprint 11

* Centralizovati svu logiku statusa i tranzicija na jednom mjestu u backend kodu
* Provesti regresiono testiranje svih prethodnih funkcionalnosti u kontekstu novih statusnih čvorova i modula
* Zatvoriti otvorene funkcionalne rupe identificirane u integracijskom testiranju
