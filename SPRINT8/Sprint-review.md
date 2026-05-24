# Sprint 8 Review

## 1. Planirani sprint goal

Implementirati funkcionalnosti notifikacija, preventivnog održavanja, detekcije duplikata prijava kvarova, tiket sistema za podršku i dvosmjerne komunikacije unutar tiketa. Paralelno unaprijediti upravljanje intervencijama kroz mapski prikaz, export podataka u PDF format i podršku za masovne akcije nad intervencijama.

## 2. Šta je završeno

Tim je uspješno realizirao sve planirane aktivnosti za ovaj sprint, uključujući realizaciju sljedećih PBI-eva:

* PBI-012 — Notifikacije
* PBI-022 — Planirana/preventivna održavanja
* PBI-025 — Detekcija duplikata prijave kvara
* PBI-027 — Kreiranje tiketa za podršku
* PBI-028 — Dvosmjerna komunikacija na tiketu
* PBI-034 — Geografski/mapski prikaz intervencija
* PBI-023 — Export podataka
* PBI-038 — Masovne akcije na intervencijama

## 3. Šta nije završeno

Sve planirane stavke za Sprint 8 su uspješno završene.

## 4. Demonstrirane funkcionalnosti ili artefakti

* In-app notifikacije za servisere i koordinatore
* Prikaz broja nepročitanih notifikacija u navigaciji
* Direktno otvaranje intervencije klikom na notifikaciju
* Kreiranje planiranih/preventivnih održavanja sa ponavljanjem
* Automatsko generisanje periodičnih intervencija
* Detekcija potencijalnih duplikata pri prijavi kvarova
* Kreiranje korisničkih tiketa za podršku
* Dvosmjerna komunikacija unutar tiketa
* Zatvaranje tiketa i zabrana daljnje komunikacije
* Mapski prikaz intervencija s markerima i filterima
* Export intervencija u PDF format
* Masovne akcije nad intervencijama uz potvrdu i prikaz rezultata

## 5. Glavni problemi i blokeri

* Implementacija notifikacija zahtijevala je dodatno usklađivanje frontend i backend logike radi ažurnog prikaza obavijesti u realnom vremenu.
* Preventivna održavanja i automatsko generisanje intervencija povećali su kompleksnost validacije i upravljanja periodičnim zadacima.
* Mapski prikaz intervencija zahtijevao je dodatnu optimizaciju prikaza lokacijskih podataka i rada s većim brojem markera. Uočeno je da naslovi filtera intervencija nedostaju i prikazuju se ID-evi umjesto imena, što je potrebno ispraviti u narednom sprintu.
* PDF export i generisanje većih izvještaja zahtijevali su dodatna testiranja performansi i prilagođavanje prikaza podataka.

## 6. Ključne odluke donesene u sprintu

* In-app notifikacije odabrane su kao jedini kanal obavještavanja u MVP verziji.
* MVP verzija preventivnih održavanja podržava samo dnevno, sedmično i mjesečno ponavljanje.
* Detekcija duplikata implementirana je kao upozorenje, a ne blokada - korisnik može nastaviti prijavu.
* Tiket sistem je logički odvojen od sistema intervencija i ne generiše radne naloge automatski.
* Na mapi se prikazuju isključivo intervencije s definisanom lokacijom.
* Export je ograničen na PDF format.
* Masovne akcije izvršavaju se atomarno radi konzistentnosti podataka.

## 7. Povratna informacija Product Ownera

Product Owner je zadovoljan realizovanim funkcionalnostima sprinta, posebno tiket sistemom, mapskim prikazom i mogućnošću masovnih akcija nad intervencijama. Uočen je problem s prikazom ID-eva umjesto imena u filterima intervencija na mapi, koji treba biti ispravljen u narednom sprintu.

## 8. Zaključak za naredni sprint

Za Sprint 9 planiran je nastavak implementacije sljedećih funkcionalnosti:

* Notifikacije za tiket sistem (PBI-029)
* Višejezična podrška (PBI-031)
* Settings stranica (PBI-051)
* Blokiranje korisnika od strane firme (PBI-039)
* Feedback korisnika po završetku intervencije (PBI-036)
* Ispravka prikaza naslova filtera intervencija 