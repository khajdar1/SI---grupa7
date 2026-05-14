# Sprint Backlog - Sprint 5

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-040** | CI/CD pipeline za automatsku provjeru i isporuku | Tim | Završeno | GitHub Actions za PR develop + release/master deploy frontend na Cloudflare Pages; backend preko Railway GitHub integracije |
| **PBI-041** | Inicijalna Prisma migracija za trenutne modele | Kerim Hajdar | Završeno | Pokriva sve modele, enum tipove i relacije iz schema.prisma; preduvjet za sve ostale stavke |
| **PBI-042** | Početni seed podaci za razvoj i demo | Kerim Hajdar | Završeno | Seed uključuje firmu, kategorije kvarova, SLA konfiguraciju i korisnike za glavne uloge |
| **PBI-044** | Osnovno centralizirano logovanje i health nadzor | Lejla Gičević | Završeno | Health endpoint dostupan i lokalno i u Docker okruženju |
| **PBI-045** | Globalni exception handler i standardizacija API grešaka | Lejla Gičević | Završeno | Centralni Express error middleware; stack trace ne izlazi u produkciji |
| **PBI-046** | Middleware za autorizaciju i zaštitu ruta | Dalila Tanković | Završeno | Reusable middleware za autentifikaciju i provjeru role; preduvjet za sve zaštićene rute |
| **PBI-047** | Centralizovana validacija zahtjeva i DTO schema sloj | Dalila Tanković | Završeno | Zod-based validacija; standardiziran format grešaka za frontend |
| **PBI-048** | Rate limiting za javne i auth endpointe | Emina Hadžić | Završeno | Primjenjuje se na login, reset lozinke i javnu prijavu kvara |
| **PBI-001** | Registracija korisnika | Iman Šehić | Završeno | Samoregistracija bez companyId polja; otvoreno pitanje o validaciji maila |
| **PBI-002** | Prijava u sistem (Login) | Iman Šehić | Završeno | Zavisi od PBI-001; Keycloak-based autentifikacija |
| **PBI-003** | Prijava kvara od strane korisnika | Ismail Mujanović | Završeno | Dostupno i neprijavljenim korisnicima |
| **PBI-019** | Reset lozinke | Iman Šehić | Odgođeno | Tehnički implementirano u kodu, ali SMTP nije dostupan na Railway free planu; isporuka pomjerena izvan Sprint 5 scope-a |
| **PBI-024** | Validacija unosa podataka | Lamija Bojić | Završeno | Serverska i klijentska validacija |
| **PBI-032** |Upravljanje kategorijama kvarova (Admin) | Ismail Mujanović | Završeno | - |
| **PBI-030** | Kategorije i tipovi kvarova | Nedim Omanović | Završeno |  Dropdown pri prijavi kvara; filtriranje po kategoriji |
| **PBI-035** | Konfiguracija vremenskih rokova (SLA) | Lamija Bojić | Završeno | Admin definira rokove po prioritetu; preduvjet za PBI-018 u Sprintu 9 |

---
## User Stories

### PBI-041 – Inicijalna Prisma migracija za trenutne modele
**Story 1 -** Kao **backend developer**, želim **imati prvu Prisma migraciju koja odgovara trenutnom schema.prisma**, kako bih **mogao reproducirati istu strukturu baze na svakoj okolini bez ručnog SQL-a**.

**Story 2 -** Kao **QA / razvojni tim**, želim **da se nova baza može podići samo iz migracije**, kako bih **imao identično testno i lokalno okruženje na svim mašinama**.

**Story 3 -** Kao **tim koji održava sistem**, želim **da migracija bude osnovna tačka za buduće izmjene baze**, kako bih **svaku narednu promjenu mogao pratiti verzijski i kontrolisano**.

### PBI-042 – Početni seed podaci za razvoj i demo
**Story 1 -** Kao **razvojni tim**, želim **imati početni skup seed podataka**, kako bih **mogao brzo pokrenuti lokalno okruženje i testirati tokove bez ručnog unosa podataka**.

**Story 2 -** Kao **Product Owner / tim za demo**, želim **imati konzistentan demo dataset**, kako bih **mogao prikazati ključne tokove sistema bez dugotrajnog pripremanja baze prije svake demonstracije**.

**Story 3 -** Kao **QA**, želim **da seed podaci budu ponovljivi i čisti**, kako bih **mogao obnavljati testno okruženje bez dupliranja i bez ručnog čišćenja**.

### PBI-044 – Osnovno centralizirano logovanje i health nadzor
**Story 1 -** Kao **backend tim**, želim **da ključne akcije i greške budu logovane na konzistentan način**, kako bih **mogao lakše pratiti probleme i analizirati incidentne situacije**.

**Story 2 -** Kao **DevOps / tim za održavanje**, želim **da health provjera jasno pokazuje stanje aplikacije i baze**, kako bih **odmah vidio da li je sistem spreman za rad ili je dio infrastrukture pao**.

**Story 3 -**  Kao **tim koji podržava produkciju**, želim **da logovi budu dovoljno detaljni za debug i reviziju**, kako bih **mogao povezati korisničke akcije, greške i stanje servisa bez ručnog nagađanja**.

### PBI-045 – Globalni exception handler i standardizacija API grešaka
**Story 1 -** Kao **backend developer**, želim **imati globalni exception handler**, kako bih **sve neočekivane greške vraćao u istom, predvidivom formatu umjesto da ih obrađujem ručno u svakoj ruti**.

**Story 2 -** Kao **QA**, želim **da validacijske greške, greške baze i nepoznate server greške imaju standardizovan odgovor**, kako bih **mogao lakše pisati testove i provjeravati očekivano ponašanje bez nagađanja**.

**Story 3 -** Kao **tim za podršku i održavanje**, želim **da produkcija ne vraća stack trace ili internu implementaciju korisniku**, kako bih **spriječio otkrivanje tehničkih detalja i zadržao čiste poruke grešaka**.

### PBI-046 – Middleware za autorizaciju i zaštitu ruta
**Story 1 -** Kao **backend developer**, želim **imati reusable middleware za provjeru autentifikacije i rola**, kako bih **zaštitu ruta mogao postaviti jednom, a ne ručno ponavljati na svakom endpointu**.

**Story 2 -** Kao **sigurnosno osviješteni član tima**, želim **da korisnik koji nema pravo pristupa dobije ispravnu odbijenicu**, kako bih **spriječio da se osjetljive operacije izvode mimo ovlasti**.

**Story 3 -** Kao **QA**, želim **da zaštita ruta bude dosljedna kroz cijeli backend**, kako bih **mogao provjeriti da iste role uvijek imaju isti pristup bez izuzetaka po modulu**.

### PBI-047 – Centralizovana validacija zahtjeva i DTO schema sloj
**Story 1 -** Kao **backend developer**, želim **da ulazni zahtjevi prolaze kroz zajedničke schema provjere**, kako bih **smanjio dupliciranje validacije po rutama i kontrolerima**.

**Story 2 -** Kao **frontend developer**, želim **predvidiv format grešaka za neispravne requeste**, kako bih **mogao pouzdano prikazati poruke korisniku bez posebne logike za svaki endpoint**.

**Story 3 -** Kao **QA**, želim **da se ista validacija koristi kroz cijeli backend**, kako bih **mogao testirati poslovna pravila na jednom mjestu i lakše održavati testove**.

### PBI-048 – Rate limiting za javne i auth endpointa
**Story 1 -** Kao **backend developer**, želim **rate limiting na javnim i auth endpointima**, kako bih **smanjio rizik od brute-force napada i zloupotrebe forme**.

**Story 2 -** Kao **sigurnosno odgovoran član tima**, želim **da reset lozinke, login i javna prijava kvara imaju ograničenja**, kako bih **spriječio spam i prekomjeran broj zahtjeva**.

**Story 3 -** Kao **QA**, želim **da rate limit ponašanje bude predvidivo i testabilno**, kako bih **mogao provjeriti kako se sistem ponaša kada neko šalje previše zahtjeva**.

### PBI-001 - Registracija korisnika
**Story 1 –** Kao **novi korisnik**, želim **samostalno kreirati korisnički račun unosom osnovnih podataka**, kako bih **dobio pristup sistemu bez potrebe za čekanjem da me administrator ručno registruje**.

**Story 2 –** Kao **administrator sistema**, želim **biti siguran da samoregistrirani korisnici automatski dobijaju samo osnovnu ulogu "Korisnik"**, kako bih **zadržao kontrolu nad privilegovanim pristupom i spriječio neovlašteno preuzimanje osjetljivih uloga**.

**Story 3 –** Kao **administrator**, želim **da svaki novoregistrirani korisnik bude vezan za konkretnu firmu/organizaciju**, kako bih **osigurao da podaci ostanu segregirani između različitih organizacija u sistemu**.

### PBI-002 - Prijava u sistem (Login)
**Story 1 –** Kao **registrirani korisnik sistema**, želim **sigurno se prijaviti koristeći korisničko ime i lozinku**, kako bih **dobio pristup funkcionalnostima predviđenim za moju ulogu i zaštitio podatke od neovlaštenog pristupa**.

**Story 2 –** Kao **korisnik na dijeljenom uređaju**, želim **da se moja sesija automatski prekine nakon perioda neaktivnosti i da se ne mogu koristiti dugme "Nazad" nakon odjave**, kako bih **spriječio neovlašteni pristup svom računu**.

**Story 3 –** Kao **administrator**, želim **da deaktivirani korisnički računi ne mogu pristupiti sistemu**, kako bih **osigurao da bivši zaposlenici ili suspendirani korisnici izgube pristup odmah nakon deaktivacije**.

### PBI-003 - Prijava kvara od strane korisnika
**Story 1 –** Kao **neregistrirani korisnik**, želim **brzo prijaviti kvar bez obaveze registracije**, kako bih **osigurao da nadležni tim bude obaviješten bez administrativnih prepreka**.

**Story 2 –** Kao **prijavljeni korisnik**, želim **uz prijavu kvara priložiti slike ili dokumente i odabrati kategoriju iz predefinisane liste**, kako bih **koordinatoru dao što potpuniju informaciju i ubrzao trijažu**.

**Story 3 –** Kao **koordinator**, želim **da svaka uspješno poslana prijava kvara automatski generiše intervenciju u sistemu**, kako bih **imao nultu manuelnu obradu dolaznih prijava i mogao odmah reagovati**.

### PBI-024 - Validacija unosa podataka
**Story 1 –** Kao **korisnik koji popunjava formu**, želim **vidjeti jasne poruke greške direktno uz svako polje koje sam pogrešno popunio**, kako bih **brzo razumio šta trebam ispraviti bez pogađanja**.

**Story 2 –** Kao **sistem**, moram **validirati sve korisničke unose i na serverskoj strani, te spriječiti SQL injection i XSS napade**, kako bih **zaštitio integritet baze podataka neovisno o tome da li je klijentska validacija zaobiđena**.

### PBI-030 - Kategorije i tipovi kvarova
**Story 1 –** Kao **korisnik**, želim **pri prijavi kvara odabrati kategoriju iz predefinisane liste**, kako bih **preciznije opisao prirodu problema i koordinatoru omogućio brže razumijevanje bez dodatnih pojašnjenja**.

**Story 2 –** Kao **administrator sistema**, želim **dodavati, uređivati i deaktivirati kategorije kvarova putem admin panela**, kako bih **osigurao da lista kategorija uvijek odražava stvarne tipove kvarova organizacije bez zavisnosti od developer tima**.

**Story 3 –** Kao **koordinator**, želim **filtrirati listu intervencija i koristiti kategoriju kao kriterij napredne pretrage**, kako bih **brzo pronašao sve intervencije određenog tipa i analizirao učestalost pojedinih kvarova**.

### PBI-032 - Upravljanje kategorijama kvarova (Admin)
**Story 1 –** Kao **administrator sistema**, želim **dodavati, uređivati i deaktivirati kategorije kvarova putem admin panela**, kako bih **osigurao da lista kategorija uvijek odražava stvarne tipove kvarova organizacije bez zavisnosti od developer tima**.

### PBI-035 - Konfiguracija vremenskih rokova (SLA)
**Story 1 –** Kao **administrator sistema**, želim **definirati vremenski rok za rješavanje intervencija za svaki nivo prioriteta**, kako bih **uspostavio mjerljive standarde usluge koji služe kao osnova za automatska upozorenja o kašnjenju**.
