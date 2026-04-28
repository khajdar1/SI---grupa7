# Sprint broj: Sprint 5

## Sprint cilj
Uspostaviti tehnički temelj sistema kroz infrastrukturne preduvjete (migracija baze,
autorizacija, validacija, sigurnost) i implementirati osnovne korisničke tokove:
registraciju, prijavu, reset lozinke i prijavu kvara — uz upravljanje kategorijama
kvarova i SLA konfiguracijom kao neophodnim preduvjetima za funkcionisanje sistema u
narednim sprintovima.

---

## Ključne stavke koje tim želi završiti

- Inicijalna Prisma migracija za trenutne modele (PBI-041)
- Početni seed podaci za razvoj i demo (PBI-042)
- Osnovno centralizirano logovanje i health nadzor (PBI-044)
- Globalni exception handler i standardizacija API grešaka (PBI-045)
- Middleware za autorizaciju i zaštitu ruta (PBI-046)
- Centralizovana validacija zahtjeva i DTO schema sloj (PBI-047)
- Rate limiting za javne i auth endpointe (PBI-048)
- Registracija korisnika (PBI-001)
- Prijava u sistem — Login (PBI-002)
- Prijava kvara od strane korisnika (PBI-003)
- Reset lozinke (PBI-019)
- Validacija unosa podataka (PBI-024)
- Kategorije i tipovi kvarova (PBI-030)
- Upravljanje kategorijama kvarova — Admin (PBI-032)
- Konfiguracija vremenskih rokova — SLA (PBI-035)

---

## Rizici i zavisnosti

- Rizik: Nepotpuni ili neispravni seed podaci (PBI-042) mogu blokirati testiranje funkcionalnih stavki.
- Rizik: Rate limiting (PBI-048) otvara pitanje da li se limit primjenjuje po IP adresi, po korisniku ili kombinovano — nedonošenje ove odluke rano može zahtijevati refaktorisanje

- Zavisnost: PBI-046 (middleware za autorizaciju), PBI-047 (DTO validacija) i
  PBI-048 (rate limiting) moraju biti završeni prije end-to-end testiranja funkcionalnih stavki — kašnjenje infrastrukturnih zadataka direktno blokira funkcionalni razvoj
- Zavisnost: PBI-032 mora biti završen prije PBI-030 — admin mora kreirati kategorije
  prije nego što ih korisnik može odabrati pri prijavi kvara
- Zavisnost: PBI-030 i PBI-032 moraju biti završeni prije PBI-003 — obrazac za
  prijavu kvara zahtijeva aktivne kategorije da bi bio funkcionalan
- Zavisnost: PBI-002 (Login) zavisi od PBI-001 (Registracija) — korisnik mora moći
  kreirati račun prije nego što se može prijaviti
- Zavisnost: PBI-035 (SLA konfiguracija) je preduvjet za PBI-018 u Sprintu 9 —
  rokovi moraju biti definisani ovdje da bi upozorenja o kašnjenju imala smisla