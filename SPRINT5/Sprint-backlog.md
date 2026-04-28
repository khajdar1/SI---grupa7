# Sprint Backlog — Sprint 5

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-041** | Inicijalna Prisma migracija za trenutne modele | Kerim Hajdar | Završeno | Pokriva sve modele, enum tipove i relacije iz schema.prisma; preduvjet za sve ostale stavke |
| **PBI-042** | Početni seed podaci za razvoj i demo | Kerim Hajdar | Završeno | Seed uključuje firmu, kategorije kvarova, SLA konfiguraciju i korisnike za glavne uloge |
| **PBI-044** | Osnovno centralizirano logovanje i health nadzor | Lejla Gičević | Završeno | Health endpoint dostupan i lokalno i u Docker okruženju |
| **PBI-045** | Globalni exception handler i standardizacija API grešaka | Lejla Gičević | Završeno | Centralni Express error middleware; stack trace ne izlazi u produkciji |
| **PBI-046** | Middleware za autorizaciju i zaštitu ruta | Dalila Tanković | - | Reusable middleware za autentifikaciju i provjeru role; preduvjet za sve zaštićene rute |
| **PBI-047** | Centralizovana validacija zahtjeva i DTO schema sloj | Dalila Tanković | - | Zod-based validacija; standardiziran format grešaka za frontend |
| **PBI-048** | Rate limiting za javne i auth endpointe | Emina Hadžić | - | Primjenjuje se na login, reset lozinke i javnu prijavu kvara |
| **PBI-001** | Registracija korisnika | Iman Šehić | Završeno | Izvršena samoregistracija korisnika; otvoreno pitanje o validaciji maila |
| **PBI-002** | Prijava u sistem (Login) | Iman Šehić | Završeno | Zavisi od PBI-001 |
| **PBI-003** | Prijava kvara od strane korisnika | Ismail Mujanović | - | Dostupno i neprijavljenim korisnicima |
| **PBI-019** | Reset lozinke | Iman Šehić | Završeno | Putem emaila; rate limiting (PBI-048) već postavljen kao preduvjet |
| **PBI-024** | Validacija unosa podataka | Lamija Bojić | Završeno | Serverska i klijentska validacija |
| **PBI-032** |Upravljanje kategorijama kvarova (Admin) | Ismail Mujanović | - | - |
| **PBI-030** | Kategorije i tipovi kvarova | Nedim Omanović | Završeno |  Dropdown pri prijavi kvara; filtriranje po kategoriji |
| **PBI-035** | Konfiguracija vremenskih rokova (SLA) | Lamija Bojić | Završeno | Admin definira rokove po prioritetu; preduvjet za PBI-018 u Sprintu 9 |