# Sprint 9 - Sprint Goal

## Sprint cilj

Implementirati notifikacije za tiket sistem, višejezičnu podršku, kreiranje feedbacka od strane korisnika po završetku intervencije, centraliziranu Settings stranicu i blokiranje korisnika od strane firme. 

## Ključne stavke koje tim želi završiti

* Notifikacije za tikete (PBI-029)
* Višejezična podrška (PBI-031)
* Feedback korisnika po završetku intervencije (PBI-036)
* Blokiranje korisnika od strane firme (PBI-039)
* Settings stranica (PBI-051)

## Rizici i zavisnosti

### Rizici

* Rizik: PBI-029 (Notifikacije za tikete) zahtijeva proširenje postojećeg notifikacijskog sistema; neusklađenost s PBI-012 može dovesti do duplikata ili propuštenih obavijesti.

* Rizik: PBI-031 (Višejezična podrška) zahtijeva prevođenje svih UI elemenata; parcijalni prijevodi mogu narušiti konzistentnost korisničkog iskustva.

* Rizik: PBI-051 (Settings stranica) ovisi o većem broju postojećih PBI-eva i može biti blokiran ako zavisne funkcionalnosti nisu stabilne.

* Rizik: PBI-036 (Feedback) ovisi o statusu „Završeno" i notifikacijskom sistemu; greška u tim komponentama direktno blokira feedback tok.

* Rizik: PBI-039 (Blokiranje korisnika) zahtijeva pažljivu validaciju kako blokiranje ne bi nenamjerno uticalo na aktivne intervencije vezane za blokiranog korisnika.

### Zavisnosti

* Zavisnost: PBI-029 zavisi od PBI-012 (Notifikacije) i PBI-027/PBI-028 (Tiket sistem), jer notifikacije za tikete koriste postojeću notifikacijsku infrastrukturu.

* Zavisnost: PBI-031 zavisi od PBI-015 (Upravljanje korisničkim profilom), jer se odabir jezika čuva u korisničkim postavkama.

* Zavisnost: PBI-051 zavisi od PBI-015, PBI-031, PBI-012, PBI-035 i PBI-033, jer Settings stranica agregira postojeće konfiguracije i preference.

* Zavisnost: PBI-036 zavisi od PBI-008 (Status "Završeno") i PBI-012 (Notifikacije), jer se feedback pokreće završetkom intervencije i in-app obavijesti.

* Zavisnost: PBI-039 zavisi od PBI-003 (Prijava kvara) i PBI-001 (Registracija), jer se blokiranje odnosi na korisnike koji prijavljuju kvarove.