# Sprint Backlog â€” Sprint 5

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-040** | CI/CD pipeline za automatsku provjeru i isporuku | Tim | ZavrÅ¡eno | GitHub Actions za PR develop + release/master deploy frontend na Cloudflare Pages; backend preko Railway GitHub integracije |
| **PBI-041** | Inicijalna Prisma migracija za trenutne modele | Kerim Hajdar | ZavrÅ¡eno | Pokriva sve modele, enum tipove i relacije iz schema.prisma; preduvjet za sve ostale stavke |
| **PBI-042** | PoÄetni seed podaci za razvoj i demo | Kerim Hajdar | ZavrÅ¡eno | Seed ukljuÄuje firmu, kategorije kvarova, SLA konfiguraciju i korisnike za glavne uloge |
| **PBI-044** | Osnovno centralizirano logovanje i health nadzor | Lejla GiÄeviÄ‡ | ZavrÅ¡eno | Health endpoint dostupan i lokalno i u Docker okruÅ¾enju |
| **PBI-045** | Globalni exception handler i standardizacija API greÅ¡aka | Lejla GiÄeviÄ‡ | ZavrÅ¡eno | Centralni Express error middleware; stack trace ne izlazi u produkciji |
| **PBI-046** | Middleware za autorizaciju i zaÅ¡titu ruta | Dalila TankoviÄ‡ | ZavrÅ¡eno | Reusable middleware za autentifikaciju i provjeru role; preduvjet za sve zaÅ¡tiÄ‡ene rute |
| **PBI-047** | Centralizovana validacija zahtjeva i DTO schema sloj | Dalila TankoviÄ‡ | ZavrÅ¡eno | Zod-based validacija; standardiziran format greÅ¡aka za frontend |
| **PBI-048** | Rate limiting za javne i auth endpointe | Emina HadÅ¾iÄ‡ | ZavrÅ¡eno | Primjenjuje se na login, reset lozinke i javnu prijavu kvara |
| **PBI-001** | Registracija korisnika | Iman Å ehiÄ‡ | ZavrÅ¡eno | IzvrÅ¡ena samoregistracija korisnika; otvoreno pitanje o validaciji maila |
| **PBI-002** | Prijava u sistem (Login) | Iman Å ehiÄ‡ | ZavrÅ¡eno | Zavisi od PBI-001 |
| **PBI-003** | Prijava kvara od strane korisnika | Ismail MujanoviÄ‡ | ZavrÅ¡eno | Dostupno i neprijavljenim korisnicima |
| **PBI-019** | Reset lozinke | Iman Sehic | Odgodjeno | Tehnicki implementirano u kodu, ali SMTP nije dostupan na Railway free planu; isporuka pomjerena izvan Sprint 5 scope-a |
| **PBI-024** | Validacija unosa podataka | Lamija BojiÄ‡ | ZavrÅ¡eno | Serverska i klijentska validacija |
| **PBI-032** |Upravljanje kategorijama kvarova (Admin) | Ismail MujanoviÄ‡ | ZavrÅ¡eno | - |
| **PBI-030** | Kategorije i tipovi kvarova | Nedim OmanoviÄ‡ | ZavrÅ¡eno |  Dropdown pri prijavi kvara; filtriranje po kategoriji |
| **PBI-035** | Konfiguracija vremenskih rokova (SLA) | Lamija BojiÄ‡ | ZavrÅ¡eno | Admin definira rokove po prioritetu; preduvjet za PBI-018 u Sprintu 9 |
