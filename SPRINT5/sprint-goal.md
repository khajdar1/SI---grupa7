# Sprint broj: Sprint 5

## Sprint cilj
Uspostaviti tehnicki temelj sistema kroz infrastrukturne preduvjete (migracija baze,
autorizacija, validacija, sigurnost) i implementirati osnovne korisnicke tokove:
registraciju, prijavu i prijavu kvara — uz upravljanje kategorijama
kvarova i SLA konfiguracijom kao neophodnim preduvjetima za funkcionisanje sistema u
narednim sprintovima.

---

## Kljucne stavke koje tim zeli zavrsiti

- Inicijalna Prisma migracija za trenutne modele (PBI-041)
- Pocetni seed podaci za razvoj i demo (PBI-042)
- Osnovno centralizirano logovanje i health nadzor (PBI-044)
- Globalni exception handler i standardizacija API gresaka (PBI-045)
- Middleware za autorizaciju i zastitu ruta (PBI-046)
- Centralizovana validacija zahtjeva i DTO schema sloj (PBI-047)
- Rate limiting za javne i auth endpointe (PBI-048)
- Registracija korisnika (PBI-001)
- Prijava u sistem — Login (PBI-002)
- Prijava kvara od strane korisnika (PBI-003)
- Validacija unosa podataka (PBI-024)
- Kategorije i tipovi kvarova (PBI-030)
- Upravljanje kategorijama kvarova — Admin (PBI-032)
- CI/CD pipeline za automatsku provjeru builda i pripremu deploya (PBI-040)
- Konfiguracija vremenskih rokova — SLA (PBI-035)

---

## Rizici i zavisnosti

- Rizik: Nepotpuni ili neispravni seed podaci (PBI-042) mogu blokirati testiranje funkcionalnih stavki.
- Rizik: Rate limiting (PBI-048) otvara pitanje da li se limit primjenjuje po IP adresi, po korisniku ili kombinovano — nedonosenje ove odluke rano moze zahtijevati refaktorisanje.
- Rizik: SMTP slanje emaila za reset lozinke (PBI-019) nije dostupno na trenutnom Railway free planu; stavka je izuzeta iz Sprint 5 scope-a i planirana za naredni sprint.
- Rizik: Bez uspostavljenog CI/CD pipeline-a postoji veca vjerovatnoca da neispravne izmjene prodju bez pravovremene provjere builda, typechecka i osnovne integracije komponenti.

- Zavisnost: CI/CD pipeline treba biti postavljen prije stabilnog timskog mergeanja i pripreme release candidate verzija, kako bi se kljucne promjene validirale automatski pri svakom znacajnom update-u.
- Zavisnost: PBI-046 (middleware za autorizaciju), PBI-047 (DTO validacija) i PBI-048 (rate limiting) moraju biti zavrseni prije end-to-end testiranja funkcionalnih stavki — kasnjenje infrastrukturnih zadataka direktno blokira funkcionalni razvoj.
- Zavisnost: PBI-032 mora biti zavrsen prije PBI-030 — admin mora kreirati kategorije prije nego sto ih korisnik moze odabrati pri prijavi kvara.
- Zavisnost: PBI-030 i PBI-032 moraju biti zavrseni prije PBI-003 — obrazac za prijavu kvara zahtijeva aktivne kategorije da bi bio funkcionalan.
- Zavisnost: PBI-002 (Login) zavisi od PBI-001 (Registracija) — korisnik mora moci kreirati racun prije nego sto se moze prijaviti.
- Zavisnost: PBI-035 (SLA konfiguracija) je preduvjet za PBI-018 u Sprintu 9 — rokovi moraju biti definisani ovdje da bi upozorenja o kasnjenju imala smisla.
