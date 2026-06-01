# Sprint 9 Review

## 1. Planirani sprint goal

Implementirati višejezičnu podršku, kreiranje feedbacka od strane korisnika po završetku intervencije, centralizovanu Settings stranicu i blokiranje korisnika od strane firme. 

## 2. Šta je završeno

Tim je uspješno realizirao sve planirane aktivnosti za ovaj sprint, uključujući realizaciju sljedećih PBI-eva:

* PBI-031 — Višejezična podrška
* PBI-036 — Feedback korisnika po završetku intervencije
* PBI-039 — Blokiranje korisnika od strane firme
* PBI-051 — Settings stranica

## 3. Šta nije završeno

Sve planirane stavke za Sprint 9 su uspješno završene.

## 4. Demonstrirane funkcionalnosti ili artefakti

* Odabir jezika u Settings stranici s trenutnom primjenom na cijeli interfejs
* Perzistencija jezičke postavke po korisničkom računu nakon odjave i ponovne prijave
* Fallback mehanizam — engleski jezik prikazuje se za elemente kojima nedostaje prijevod
* Feedback forma po prelasku intervencije u status "Završeno" s numeričkom ocjenom 1–5 i opcionim komentarom
* Zabrana višestrukog feedbacka po istoj intervenciji
* Prikaz feedbacka koordinatoru i adminu unutar detalja intervencije
* Opcija blokiranja korisnika dostupna koordinatoru iz pregleda intervencija
* Dijalog za potvrdu prije blokiranja
* Lista blokiranih korisnika s mogućnošću deblokiranja
* Audit log blokiranja i deblokiranja s imenom koordinatora i vremenskom oznakom
* Zabrana prijave novih kvarova za blokirane korisnike
* Settings stranica s prikazom korisničkih postavki i jezičkih preferencija
* Role-based prečice prema admin stranicama na Settings stranici za administratore

## 5. Glavni problemi i blokeri

* Višejezična podrška zahtijevala je više vremena od planiranog zbog potrebe za potpunim prevođenjem svih UI elemenata — parcijalni prijevodi nisu bili prihvatljivi prema Acceptance Criteria, što je produljilo implementaciju.
* Settings stranica imala je veći broj zavisnosti od ostalih PBI-eva unutar sprinta (PBI-015, PBI-031, PBI-012, PBI-035, PBI-033), što je zahtijevalo pažljivo koordinisanje implementacijskog redoslijeda i povećalo rizik od blokiranja.
* Validacija blokiranja zahtijevala je pažljivo testiranje rubnih slučajeva: self-blokiranje, duplikat blokiranja i utjecaj na aktivne intervencije blokiranog korisnika.

## 6. Ključne odluke donesene u sprintu

* Fallback mehanizam za višejezičnu podršku implementiran je na engleski jezik umjesto prikazivanja praznih polja ili grešaka, čime je korisničko iskustvo ostalo funkcionalno i pri nepotpunim prijevodima.
* Feedback je ograničen na jednokratni unos bez mogućnosti naknadne izmjene radi sprečavanja retroaktivne manipulacije ocjenama i smanjenja kompleksnosti podatkovnog modela.
* Blokiranje korisnika implementirano je kao operativna zabrana prijave kvarova, bez automatske deaktivacije korisničkog računa — deaktivacija ostaje isključivo u nadležnosti administratora.
* Settings stranica implementirana je kao navigacijska tačka s role-based prečicama prema postojećim admin stranicama, bez dupliranja formi unutar Settings konteksta.

## 7. Povratna informacija Product Ownera

Product Owner je zadovoljan realizovanim funkcionalnostima sprinta.Nema otvorenih prigovora na realizaciju; tim je isporučio sve planirane stavke.

## 8. Zaključak za naredni sprint

Za Sprint 10 planirana je implementacija sljedećih funkcionalnosti:

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