# Sprint Retrospektiva — Sprint 10

**Projekat:** Sistem za upravljanje servisnim intervencijama

**Datum:** 01.06.2026.

**Scrum Master:** Kerim Hajdar

**Prisustvo:** Cijeli tim

---

## Šta je išlo dobro

* Sprint 10 uspješno je implementirao napredne operativne funkcionalnosti: analitiku feedbacka, upravljanje dostupnošću servisera, potvrdu termina, bazu znanja, evidenciju materijala, eskalacije, zahtjev za ponovnim otvaranjem, evidenciju dolaska servisera, digitalnu potvrdu i pauziranje intervencija.
* Evidencija dolaska servisera implementirana je s tri fiksna operativna checkpointa, što je omogućilo konzistentnu evidenciju i automatsko računanje vremena na terenu.
* Eskalacijski komentari su uspješno odvojeni od redovnih komentara, čime je menadžmentu omogućen pregledan uvid u rizične intervencije.

---

## Šta nije išlo dobro

* Evidencija dolaska servisera zahtijevala je neplaniranje izmjene šeme baze podataka, što je produljilo koordinaciju između backend slojeva.
* Pauziranje intervencije uvelo je novi statusni čvor koji nije bio inicijalno predviđen, što je zahtijevalo retroaktivno proširenje logike statusa.

---

## Šta treba promijeniti

* Logiku statusa i dozvoljenih tranzicija intervencije potrebno je centralizovati u backend kodu kako bi buduća proširenja bila lakše upravljiva.

---

## Konkretne akcije u Sprint 11

* Centralizovati svu logiku statusa i tranzicija na jednom mjestu u backend kodu
* Provesti regresiono testiranje svih prethodnih funkcionalnosti u kontekstu novih statusnih čvorova i modula
* Zatvoriti otvorene funkcionalne rupe identificirane u integracijskom testiranju