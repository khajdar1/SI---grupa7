# Sprint Retrospektiva — Sprint 9

**Projekat:** Sistem za upravljanje servisnim intervencijama

**Datum:** 21.05.2026.

**Scrum Master:** Kerim Hajdar

**Prisustvo:** Cijeli tim

---

## Šta je išlo dobro

* Sprint 9 uspješno je proširio funkcionalnosti sistema kroz implementaciju notifikacija za tikete, ostavljanja feedbacka, višejezične podrške, Settings stranice i blokiranja korisnika.

* Notifikacije za tikete su integrisane u postojeću notifikacijsku infrastrukturu bez potrebe za zasebnim modulom, čime je postignuta konzistentnost prikaza svih obavijesti u navigaciji.

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

* Implementirati automatsku raspodjelu intervencija od strane sistema 
* Implementirati automatizovani backup i restore MySQL baze 
* Implementirati scheduler za SLA i periodične pozadinske zadatke