# Sprint Retrospektiva — Sprint 9

**Projekat:** Sistem za upravljanje servisnim intervencijama

**Datum:** 25.05.2026.

**Scrum Master:** Kerim Hajdar

**Prisustvo:** Cijeli tim

---

## Šta je išlo dobro

* Sprint 9 uspješno je proširio funkcionalnosti sistema kroz implementaciju ostavljanja feedbacka, višejezične podrške, Settings stranice i blokiranja korisnika.

* Višejezična podrška implementirana je s fallback mehanizmom koji osigurava da korisnici ne vide prazna polja niti greške pri nepotpunim prijevodima.

* Blokiranje korisnika je implementirano s jasnom granicom ovlasti; koordinator može operativno blokirati prijave kvarova bez utjecaja na korisnički račun, koji ostaje isključivo u nadležnosti administratora.

---

## Šta nije išlo dobro

* Višejezična podrška zahtijevala je više vremena od planiranog zbog potrebe za potpunim prevođenjem svih UI elemenata bez parcijalnih prijevoda.

* Settings stranica imala je veći broj zavisnosti od ostalih PBI-eva unutar sprinta, što je zahtijevalo pažljivo koordinisanje implementacijskog redoslijeda.

---

## Šta treba promijeniti

* Unaprijediti prikaz Settings stranice dodavanjem jasnih sekcija i opisnih labela kako bi korisnik bez administratorskih privilegija odmah razumio koje postavke može mijenjati.

---

## Konkretne akcije u Sprint 10

* Implementirati sistem eskalacija i komentara menadžmenta za praćenje i upravljanje rizičnim intervencijama.

* Uvesti upravljanje dostupnošću servisera i praćenje vremena provedenog na terenu radi bolje organizacije radnih resursa.

* Implementirati mehanizme potvrde izvođenja intervencija i mogućnost zahtjeva za ponovno otvaranje završenih intervencija.

* Proširiti sistem o praćenje utrošenih materijala, izvještavanje i bazu znanja za rješavanje intervencija.
