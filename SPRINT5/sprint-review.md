# Sprint 5 Review
 
## 1. Planirani sprint goal

Uspostaviti tehnički temelj sistema kroz infrastrukturne preduvjete, uključujući migraciju baze, autorizaciju, validaciju i sigurnost, te implementirati funkcionalnosti planirane za Sprint 5:registraciju, prijavu i prijavu kvara.
Dodatni cilj sprinta bio je omogućiti upravljanje kategorijama kvarova i SLA konfiguracijom kao neophodnim preduvjetima za funkcionisanje sistema u narednim sprintovima.

## 2. Šta je završeno

Tim je uspješno realizirao sve planirane aktivnosti za ovaj sprint, uključujući realizaciju sljedećih PBI-eva:

- PBI-041 — Inicijalna Prisma migracija za trenutne modele
- PBI-041 — Početni seed podaci za razvoj i demo
- PBI-044 — Osnovno centralizirano logovanje i health nadzor
- PBI-045 — Globalni exception handler i standardizacija API grešaka
- PBI-046 — Middleware za autorizaciju i zaštitu ruta
- PBI-047 — Centralizovana validacija zahtjeva i DTO schema sloj
- PBI-048 — Rate limiting za javne i auth endpointe
- PBI-001 — Registracija korisnika
- PBI-002 — Prijava u sistem (Login)
- PBI-003 — Prijava kvara od strane korisnika
- PBI-024 — Validacija unosa podataka
- PBI-030 — Kategorije i tipovi kvarova
- PBI-032 — Upravljanje kategorijama kvarova (Admin)
- PBI-035 — Konfiguracija vremenskih rokova (SLA)

## 3. Šta nije završeno

PBI-019 (Reset lozinke) je tehnički implementiran u kodu, ali nije sprint isporuka za Sprint 5 zbog nedostupnog SMTP-a na Railway free planu.Stavka se prenosi u naredni sprint. Sve ostale planirane stavke za Sprint 5 su uspješno završene.

## 4. Demonstrirane funkcionalnosti ili artefakti
- Login
- Registracija
- Prijava kvara
- Kategorije i tipovi kvarova
- Demonstriran rad sistema za različite korisničke uloge nakon prijave u sistem, uključujući administratora, servisera i druge korisničke role
- AI Usage Log
- Decision Log

## 5. Glavni problemi i blokeri

Najveći izazov predstavljao je PBI-019, zbog nedostupnog SMTP-a na Railway free planu.
Ostale nedoumice odnosile su se na stavke i pitanja evidentirana u Decision Logu. Tokom diskusije razmatrano je više mogućih pristupa i rješenja, nakon čega su definisani konačni pravci i donesene odgovarajuće odluke.

## 6. Ključne odluke donesene u sprintu

- Integracija i konfiguracija Keycloak sistema za autentifikaciju
- Odabir baze podataka i način pristupa podacima
- Organizacija backend i frontend arhitekture
- Upravljanje JWT tokenima i zaštita ruta
- Definisanje korisničkih rola i autorizacije
- Postavljanje razvojnog i CI/CD okruženja
- Strategija inicijalnih seed podataka
- Sigurnosni pristup za rate limiting i pohranu podataka
- Pojednostavljenje procesa registracije korisnika
- Definisanje izvora korisničkih rola za autorizaciju
  
## 7. Povratna informacija Product Ownera

Product Owner je zadovoljan predstavljenim Sprintom i ocijenio ga je maksimalnim brojem bodova.

## 8. Zaključak za naredni sprint

Za Sprint 6 planiran je nastavak implementacije sljedećih funkcionalnosti:
- Planiranje intervencija
- Pregled liste aktivnih intervencija
- Dodjela servisera intervenciji
- Postavljanje prioriteta intervencije
- Historija intervencija
- Upravljanje korisničkim računima
- Komentari intervencije
- Pregled i upravljanje attachmentima
