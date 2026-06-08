# Product Backlog – User Storiji i Acceptance Kriteriji

> **Projekt:** Sistem za upravljanje intervencijama
> **Verzija:** 3.1

---

## Legenda prioriteta

| Oznaka   | Značenje                                               |
|----------|--------------------------------------------------------|
| Kritičan | Bez ove funkcionalnosti sistem ne može raditi          |
| Visok    | Ključno za MVP, blokira važne tokove rada              |
| Srednji  | Značajno poboljšanje, ali nije bloker                  |
| Nizak    | Korisno, može se odgoditi bez štete po MVP             |

---

## SPRINT 5

---

### PBI-001 – Registracija korisnika
 
**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 5 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **novi korisnik**, želim **samostalno kreirati korisnički račun unosom osnovnih podataka**, kako bih **dobio pristup sistemu bez potrebe za čekanjem da me administrator ručno registruje**.
 
> **Story 2 –** Kao **administrator sistema**, želim **biti siguran da samoregistrirani korisnici automatski dobijaju samo osnovnu ulogu „Korisnik"**, kako bih **zadržao kontrolu nad privilegovanim pristupom i spriječio neovlašteno preuzimanje osjetljivih uloga**.
 
> **Story 3 –** Kao **administrator**, želim **da svaki novoregistrirani korisnik bude vezan za konkretnu firmu/organizaciju**, kako bih **osigurao da podaci ostanu segregirani između različitih organizacija u sistemu**.
 
#### Poslovna vrijednost
 
Samoregistracija smanjuje administrativni teret i ubrzava onboarding novih korisnika. Korisnik koji može sam kreirati račun u par minuta ima bolje korisničko iskustvo, a admin nije usko grlo za svaki novi pristup. Uloge osjetljivije od „Korisnik" i dalje dodjeljuje administrator, čime se zadržava kontrola nad privilegovanim pristupom.
 
#### Pretpostavke i otvorena pitanja
 
- Samoregistracijom korisnik automatski dobija ulogu **Korisnik** – sve ostale uloge dodjeljuje admin naknadno.
- Otvoreno pitanje: Da li je potrebna verifikacija email adrese nakon registracije?
- Otvoreno pitanje: Da li admin dobija notifikaciju kada se registruje novi korisnik?
- Otvoreno pitanje: Postoje li zahtjevi za kompleksnost lozinke?
#### Veze i zavisnosti
 
- **Preduvjet za:** PBI-002 (Login), PBI-013 (Upravljanje računima)
- **Zavisi od:** –
---
 
#### Acceptance Kriteriji
 
- Na login stranici mora postojati **vidljiv link ili dugme „Registruj se"** koji otvara formu za registraciju.
- Forma mora sadržavati **obavezna polja**: ime, prezime, korisničko ime, email adresa, lozinka i potvrda lozinke.
- Ako korisnik ne popuni sva obavezna polja, **sistem ne smije kreirati račun** i mora jasno označiti svako nepopunjeno polje.
- Ako lozinka i potvrda lozinke **nisu identične**, sistem mora prikazati grešku i odbiti registraciju.
- Ako korisničko ime ili email **već postoje u sistemu**, sistem mora prikazati grešku i spriječiti duplikat.
- Kada korisnik uspješno završi registraciju, **sistem mora automatski dodijeliti ulogu Korisnik** – korisnik ne smije moći sam odabrati drugu ulogu.
- Nakon uspješne registracije, **sistem mora prikazati potvrdu** i korisnik mora moći odmah se prijaviti.
- Admin mora moći **promijeniti ulogu novoregistrovanog korisnika** putem admin panela (PBI-013).
- Sistem ne smije dozvoliti registraciju s **neispravnim formatom email adrese**.
- Korisnički račun mora biti **vezan za određenu firmu/organizaciju**.
---
 
### PBI-002 – Prijava u sistem (Login)
 
**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 4 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **registrirani korisnik sistema**, želim **sigurno se prijaviti koristeći korisničko ime i lozinku**, kako bih **dobio pristup funkcionalnostima predviđenim za moju ulogu i zaštitio podatke od neovlaštenog pristupa**.
 
> **Story 2 –** Kao **korisnik na dijeljenom uređaju**, želim **da se moja sesija automatski prekine nakon perioda neaktivnosti i da se ne mogu koristiti dugme „Nazad" nakon odjave**, kako bih **spriječio neovlašteni pristup svom računu**.
 
> **Story 3 –** Kao **administrator**, želim **da deaktivirani korisnički računi ne mogu pristupiti sistemu**, kako bih **osigurao da bivši zaposlenici ili suspendirani korisnici izgube pristup odmah nakon deaktivacije**.
 
#### Poslovna vrijednost
 
Login je kapija cijelog sistema. Bez sigurne autentifikacije, osjetljivi podaci o intervencijama, korisnicima i lokacijama bili bi izloženi.
 
#### Pretpostavke i otvorena pitanja
 
- MVP koristi standardnu autentifikaciju (korisničko ime + lozinka); 2FA nije u MVP scopeu.
- Otvoreno pitanje: Koliko dugo traje sesija prije automatske odjave?
- Otvoreno pitanje: Postoji li limit broja neuspješnih pokušaja prijave (brute force zaštita)?
#### Veze i zavisnosti
 
- **Preduvjet za:** Sve ostale PBI stavke
- **Zavisi od:** PBI-001 (Registracija korisnika)
---
 
#### Acceptance Kriteriji
 
- Kada korisnik unese ispravno korisničko ime i lozinku, **sistem mora autentificirati korisnika i preusmjeriti ga na početnu stranicu** odgovarajuću za njegovu ulogu.
- Ako korisnik unese netačne podatke, **sistem mora prikazati generičku poruku greške** bez otkrivanja koja vrijednost je netačna.
- Sistem mora onemogućiti pristup zaštićenim stranicama **bez aktivne sesije** – svaki direktni URL pristup mora preusmjeriti na login.
- Kada korisnik klikne „Odjavi se", **sesija mora biti odmah prekinuta** i korisnik preusmjeren na login stranicu.
- Nakon odjave, **korisnik ne smije moći pristupiti prethodnim stranicama** putem dugmeta „Nazad" u pregledniku.
- Korisnik treba dobiti **jasnu vizualnu indikaciju** da je uspješno prijavljen (npr. korisničko ime u navigaciji).
- Sistem ne smije dozvoliti prijavu **deaktiviranog korisničkog računa**.
---
 
### PBI-003 – Prijava kvara
 
**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 5 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **neregistrirani korisnik**, želim **brzo prijaviti kvar bez obaveze registracije**, kako bih **osigurao da nadležni tim bude obaviješten bez administrativnih prepreka**.
 
> **Story 2 –** Kao **prijavljeni korisnik**, želim **uz prijavu kvara priložiti slike ili dokumente i odabrati kategoriju iz predefinisane liste**, kako bih **koordinatoru dao što potpuniju informaciju i ubrzao trijažu**.
 
> **Story 3 –** Kao **koordinator**, želim **da svaka uspješno poslana prijava kvara automatski generiše intervenciju u sistemu**, kako bih **imao nultu manuelnu obradu dolaznih prijava i mogao odmah reagovati**.
 
#### Poslovna vrijednost
 
Prijava kvara je primarni ulazni kanal za sve intervencije u sistemu. Što je ovaj proces jednostavniji i dostupniji, to više prijava stiže na vrijeme, a tim može pravovremeno reagovati. Automatsko kreiranje intervencije eliminiše ručni posao koordinatora.
 
#### Pretpostavke i otvorena pitanja
 
- Dostupno i neprijavljenim korisnicima.
- Otvoreno pitanje: Koji tipovi datoteka su dozvoljeni za upload?
- Otvoreno pitanje: Da li neprijavljeni korisnik unosi kontakt podatke kao dio obrasca?
- Otvoreno pitanje: Kako se prate intervencije prijavljene od neprijavljenih korisnika?
#### Veze i zavisnosti
 
- **Preduvjet za:** PBI-004, PBI-025
- **Zavisi od:** –
---
 
#### Acceptance Kriteriji
 
- Kada korisnik otvori obrazac, **mora vidjeti polja**: lokacija, opis problema i kategorija usluge.
- Sistem mora **omogućiti dodavanje slika ili dokumenata** (attachment) uz prijavu.
- Korisnik bira firmu iz unaprijed definisane liste **(dropdown)**, bez ručnog unosa.
- Sistem mora omogućiti **automatsko popunjavanje lokacije** korisnika ili uređaja.
- Ako korisnik ne popuni obavezna polja, **sistem ne smije kreirati intervenciju** i mora označiti koje polje nedostaje.
- Kada korisnik uspješno pošalje obrazac, **sistem mora automatski kreirati novu intervenciju** i prikazati potvrdu o prijemu.
- **Neprijavljeni korisnik mora moći prijaviti kvar** bez registracije.
- Kreirana intervencija mora biti **odmah vidljiva koordinatoru** u listi aktivnih intervencija.
- Sistem mora dozvoliti upload **najmanje jedne slike ili dokumenta** uz svaku prijavu.
- Sistem mora ponuditi listu **predefinisanih hitnih intervencija**, a korisnik mora imati mogućnost dodatnog unosa opisa.

---

### PBI-019 – Reset lozinke

**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 3 SP | **Sprint:** 5

#### User Storiji

> **Story 1 –** Kao **registrirani korisnik koji nije prijavljen**, želim **zatražiti reset lozinke putem emaila**, kako bih **povratio pristup računu bez potrebe za kontaktiranjem administratora**.

> **Story 2 –** Kao **sistem**, moram **osigurati da je reset link jednokratan i vremenski ograničen**, kako bih **spriječio zloupotrebu linka koji je mogao biti presretnut**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-002 (Login)

---

#### Acceptance Kriteriji

- Korisnik mora moći pristupiti **formi za reset lozinke s login stranice** (link „Zaboravili ste lozinku?").
- Kada korisnik unese registrovani email, **sistem mora poslati email s linkom za reset**.
- Ako korisnik unese email koji ne postoji, **sistem ne smije otkriti** postoji li taj email – prikazuje istu neutralnu poruku.
- Reset link mora biti **jednokratan i vremenski ograničen** – nakon upotrebe ili isteka roka, link ne smije biti ponovo upotrebljiv.
- Kada korisnik unese novu lozinku s potvrdom, **sistem mora sačuvati novu lozinku** i invalidirati sve prethodne aktivne sesije.
- Korisnik treba dobiti **potvrdu da je lozinka uspješno resetovana** i biti preusmjeren na login.
- Sistem ne smije dozvoliti **reset lozinke za deaktiviran korisnički račun**.

---

### PBI-024 – Validacija unosa podataka

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 5

#### User Storiji

> **Story 1 –** Kao **korisnik koji popunjava formu**, želim **vidjeti jasne poruke greške direktno uz svako polje koje sam pogrešno popunio**, kako bih **brzo razumio šta trebam ispraviti bez pogađanja**.

> **Story 2 –** Kao **sistem**, moram **validirati sve korisničke unose i na serverskoj strani te spriječiti SQL injection i XSS napade**, kako bih **zaštitio integritet baze podataka neovisno o tome da li je klijentska validacija zaobiđena**.

#### Veze i zavisnosti

- **Veza s:** Svi PBI koji uključuju forme za unos podataka

---

#### Acceptance Kriteriji

- Sistem mora **spriječiti čuvanje forme** koja ima nepopunjeno obavezno polje.
- Svako obavezno polje mora biti **jasno označeno** (npr. zvjezdicom *).
- Poruke o grešci moraju biti **prikazane direktno uz polje** na koje se odnose.
- Polje za email adresu mora **validirati format emaila**.
- Polje za datum mora **spriječiti unos nepostojećeg datuma**.
- Validacija mora biti **implementirana i na serverskoj strani** – klijentska validacija je samo korisničko iskustvo.
- Sistem ne smije **dozvoliti SQL injection ili XSS napade** putem tekstualnih polja.

---

### PBI-030 – Kategorije i tipovi kvarova
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **korisnik**, želim **pri prijavi kvara odabrati kategoriju iz predefinisane liste**, kako bih **preciznije opisao prirodu problema i koordinatoru omogućio brže razumijevanje bez dodatnih pojašnjenja**.
 
> **Story 2 –** Kao **administrator sistema**, želim **dodavati, uređivati i deaktivirati kategorije kvarova putem admin panela**, kako bih **osigurao da lista kategorija uvijek odražava stvarne tipove kvarova organizacije bez zavisnosti od developer tima**.
 
> **Story 3 –** Kao **koordinator**, želim **filtrirati listu intervencija i koristiti kategoriju kao kriterij napredne pretrage**, kako bih **brzo pronašao sve intervencije određenog tipa i analizirao učestalost pojedinih kvarova**.
 
#### Poslovna vrijednost
 
Predefinisane kategorije standardizuju unos i ubrzavaju trijažu koordinatora. Dinamično upravljanje kategorijama daje organizaciji autonomiju i fleksibilnost bez tehničke zavisnosti.
 
#### Pretpostavke i otvorena pitanja
 
- Kategorije koje se deaktivišu ostaju vidljive na prethodnim intervencijama, ali se ne nude pri novim prijavama.
- Otvoreno pitanje: Da li postoje podkategorije?
- Otvoreno pitanje: Da li se kategorije primjenjuju globalno ili per-firma?
#### Veze i zavisnosti
 
- **Preduvjet za:** PBI-003 (Prijava kvara – odabir kategorije)
- **Veza s:** PBI-007 (Lista intervencija – filtriranje), PBI-017 (Napredna pretraga)
---
 
#### Acceptance Kriteriji
 
- Kada korisnik otvori formu za prijavu kvara, **mora vidjeti padajući meni za odabir kategorije**.
- Odabir kategorije mora biti **obavezno polje**.
- Sistem ne smije dozvoliti **unos slobodnog teksta umjesto odabira** iz predefinisane liste.
- Admin mora imati pristup **listi svih kategorija** s informacijama: naziv, status, datum kreiranja.
- Admin mora moći **kreirati novu kategoriju** unosom naziva i opcionog opisa.
- Sistem ne smije dozvoliti **kreiranje kategorije s već postojećim nazivom** – naziv mora biti jedinstven.
- Admin mora moći **urediti naziv i opis** postojeće aktivne kategorije.
- Admin mora moći **deaktivirati/reaktivirati** kategoriju.
- Deaktiviranje **ne smije retroaktivno uticati** na intervencije koje su prethodno evidentirane s tom kategorijom.
- Ako nema niti jedne aktivne kategorije, **sistem mora prikazati upozorenje adminu**.
- Svaka izmjena mora biti **zabilježena s imenom admina i vremenskom oznakom**.
- Koordinator i menadžment moraju moći **filtrirati listu intervencija po kategoriji**.

---

### PBI-035 – Konfiguracija vremenskih rokova (SLA)

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** 5

#### User Storiji

> **Story 1 –** Kao **administrator**, želim **definirati SLA rok za svaki nivo prioriteta**, kako bih **uspostavio mjerljive standarde usluge koji se primjenjuju automatski na sve intervencije**.

> **Story 2 –** Kao **koordinator**, želim **biti automatski upozoren ako intervencija prekorači definisani SLA rok**, kako bih **mogao pravovremeno intervenirati i prerasporediti resurse**.

#### Veze i zavisnosti

- **Preduvjet za:** PBI-005

---

#### Acceptance Kriteriji

- Admin mora imati pristup **stranici za konfiguraciju SLA rokova** s poljem za svaki nivo prioriteta.
- Admin mora moći **unijeti vremenski rok u satima** za svaki nivo.
- Sistem ne smije dozvoliti **čuvanje SLA konfiguracije s praznim poljem, nulom ili negativnom vrijednošću**.
- Nakon čuvanja, nova SLA konfiguracija mora **odmah biti aktivna** za sve buduće provjere kašnjenja.
- Promjena SLA konfiguracije mora biti **zabilježena u audit logu**.

---

### PBI-041 – Inicijalna Prisma migracija za trenutne modele
 
**Tip:** Technical Task | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **backend developer**, želim **imati prvu Prisma migraciju koja odgovara trenutnom schema.prisma**, kako bih **mogao reproducirati istu strukturu baze na svakoj okolini bez ručnog SQL-a**.
 
> **Story 2 –** Kao **QA / razvojni tim**, želim **da se nova baza može podići samo iz migracije**, kako bih **imao identično testno i lokalno okruženje na svim mašinama**.
 
> **Story 3 –** Kao **tim koji održava sistem**, želim **da migracija bude osnovna tačka za buduće izmjene baze**, kako bih **svaku narednu promjenu mogao pratiti verzijski i kontrolisano**.
 
#### Poslovna vrijednost
 
Prva migracija zaključava trenutni model baze i daje ponovljiv put za sve buduće database promjene.
 
#### Pretpostavke i otvorena pitanja
 
- Trenutni schema u backend/prisma/schema.prisma je baseline za migraciju.
- Otvoreno je da li se dodatno uvodi seed ili reset skripta za razvoj.
#### Veze i zavisnosti
 
- **Veza s:** projekat/backend/prisma/schema.prisma, projekat/backend/package.json
- **Preduvjet za:** sve ostale tehničke i funkcionalne PBI-eve
---
 
#### Acceptance Kriteriji
 
- Mora postojati prva Prisma migracija koja pokriva **trenutne modele, enum tipove i relacije** iz schema fajla.
- Na praznoj MySQL bazi migracija mora kreirati **sve potrebne tabele, unique indekse, foreign key relacije i enum mapiranja**.
- Nakon migracije **Prisma Client mora biti moguće generisati bez greške**.
- Backend se mora moći podići na bazi koja je kreirana **isključivo kroz migraciju**.
- Dokumentacija mora jasno navesti **komande za migraciju i generisanje clienta**.
---
 
### PBI-042 – Početni seed podaci za razvoj i demo
 
**Tip:** Technical Task | **Prioritet:** Srednji | **Složenost:** 3 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **razvojni tim**, želim **imati početni skup seed podataka**, kako bih **mogao brzo pokrenuti lokalno okruženje i testirati tokove bez ručnog unosa podataka**.
 
> **Story 2 –** Kao **Product Owner / tim za demo**, želim **imati konzistentan demo dataset**, kako bih **mogao prikazati ključne tokove sistema bez dugotrajnog pripremanja baze prije svake demonstracije**.
 
> **Story 3 –** Kao **QA**, želim **da seed podaci budu ponovljivi i čisti**, kako bih **mogao obnavljati testno okruženje bez dupliranja i bez ručnog čišćenja**.
 
#### Poslovna vrijednost
 
Seed podaci skraćuju vrijeme potrebno za razvoj, testiranje i demonstraciju sistema.
 
#### Pretpostavke i otvorena pitanja
 
- Seed treba pratiti trenutni model baze i koristiti postojeće enum vrijednosti i relacije.
- Otvoreno je da li seed sadrži samo minimalni razvojni set ili i širi demo skup podataka.
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-041
- **Veza s:** projekat/backend/prisma/schema.prisma
---
 
#### Acceptance Kriteriji
 
- Mora postojati **jedinstvena komanda za seed** koja može napuniti bazu na čistom okruženju.
- Seed mora kreirati **firmu, kategorije kvarova, SLA konfiguraciju i korisnike** potrebne za glavne uloge sistema.
- Seed mora omogućiti **osnovni demo za registraciju, prijavu, prijavu kvara i administrativni tok**.
- Ponovno pokretanje seed skripte **ne smije duplirati postojeće podatke** niti pokvariti relacije.
- Dokumentacija mora navesti **kako se seed pokreće nakon migracije**.
---
 
### PBI-044 – Osnovno centralizirano logovanje i health nadzor
 
**Tip:** Technical Task | **Prioritet:** Srednji | **Složenost:** 3 SP | **Sprint:** 6
 
#### User Storiji
 
> **Story 1 –** Kao **backend tim**, želim **da ključne akcije i greške budu logovane na konzistentan način**, kako bih **mogao lakše pratiti probleme i analizirati incidentne situacije**.
 
> **Story 2 –** Kao **DevOps / tim za održavanje**, želim **da health provjera jasno pokazuje stanje aplikacije i baze**, kako bih **odmah vidio da li je sistem spreman za rad ili je dio infrastrukture pao**.
 
> **Story 3 –** Kao **tim koji podržava produkciju**, želim **da logovi budu dovoljno detaljni za debug i reviziju**, kako bih **mogao povezati korisničke akcije, greške i stanje servisa bez ručnog nagađanja**.
 
#### Poslovna vrijednost
 
Centralizovano logovanje i health nadzor poboljšavaju stabilnost, dijagnostiku i održavanje sistema.
 
#### Pretpostavke i otvorena pitanja
 
- Logovanje se može implementirati kroz standardni aplikacijski logger i strukturirane log poruke.
- Otvoreno je da li health provjera treba obuhvatiti i bazu i realtime sloj.
#### Veze i zavisnosti
 
- **Veza s:** projekat/backend/src/routes/health.route.ts
- **Zavisi od:** PBI-041, PBI-042
---
 
#### Acceptance Kriteriji
 
- Backend mora imati **konzistentan health endpoint** koji vraća status aplikacije i status baze.
- Kritične greške i startup problemi moraju biti **vidljivi u logovima sa dovoljno konteksta** za dijagnostiku.
- Sistem mora bilježiti ključne tehničke događaje: **start servisa, pad konekcije prema bazi i neuspjeli zahtjevi**.
- Health provjera mora biti **dostupna i u lokalnom i u Docker okruženju**.
- Logovanje **ne smije otkrivati osjetljive podatke** kao što su lozinke ili tajni tokeni.
---
 
### PBI-045 – Globalni exception handler i standardizacija API grešaka
 
**Tip:** Technical Task | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **backend developer**, želim **imati globalni exception handler**, kako bih **sve neočekivane greške vraćao u istom, predvidivom formatu umjesto da ih obrađujem ručno u svakoj ruti**.
 
> **Story 2 –** Kao **QA**, želim **da validacijske greške, greške baze i nepoznate server greške imaju standardizovan odgovor**, kako bih **mogao lakše pisati testove i provjeravati očekivano ponašanje bez nagađanja**.
 
> **Story 3 –** Kao **tim za podršku i održavanje**, želim **da produkcija ne vraća stack trace ili internu implementaciju korisniku**, kako bih **spriječio otkrivanje tehničkih detalja i zadržao čiste poruke grešaka**.
 
#### Poslovna vrijednost
 
Centralizovan error sloj smanjuje haos u debugovanju i podršci prije ozbiljnije implementacije poslovne logike.
 
#### Pretpostavke i otvorena pitanja
 
- Pretpostavka je da Express aplikacija koristi jedinstveni middleware lanac za sve rute.
- Otvoreno je da li standardni error odgovor treba vraćati i interni code za frontend ili samo korisnički tekst i status kod.
#### Veze i zavisnosti
 
- **Veza s:** projekat/backend/src/app.ts, projekat/backend/src/server.ts
- **Zavisi od:** PBI-041
---
 
#### Acceptance Kriteriji
 
- Svi neočekivani server izuzeci moraju biti uhvaćeni kroz **centralni Express error middleware**.
- Validacijske greške moraju vraćati **status 400 uz standardizovanu listu polja** koja nisu ispravna.
- Greške povezane s autentifikacijom i autorizacijom moraju vraćati **konzistentne status kodove 401 ili 403**.
- Greške baze i nepoznate greške moraju vraćati **generičku poruku za korisnika**, dok se tehnički detalji upisuju u log.
- U produkcijskom režimu odgovor **ne smije sadržavati stack trace**.
---
 
### PBI-046 – Middleware za autorizaciju i zaštitu ruta
 
**Tip:** Technical Task | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **backend developer**, želim **imati reusable middleware za provjeru autentifikacije i rola**, kako bih **zaštitu ruta mogao postaviti jednom, a ne ručno ponavljati na svakom endpointu**.
 
> **Story 2 –** Kao **sigurnosno osviješteni član tima**, želim **da korisnik koji nema pravo pristupa dobije ispravnu odbijenicu**, kako bih **spriječio da se osjetljive operacije izvode mimo ovlasti**.
 
> **Story 3 –** Kao **QA**, želim **da zaštita ruta bude dosljedna kroz cijeli backend**, kako bih **mogao provjeriti da iste role uvijek imaju isti pristup bez izuzetaka po modulu**.
 
#### Poslovna vrijednost
 
Centralizovana autorizacija sprječava razlivanje RBAC logike po controllerima i čini pristup modulu predvidivim.
 
#### Pretpostavke i otvorena pitanja
 
- Pretpostavka je da će backend koristiti JWT ili sličan session/token mehanizam za identitet korisnika.
- Otvoreno je da li route guard treba vraćati JSON odgovor ili redirect za browser scenarije.
#### Veze i zavisnosti
 
- **Veza s:** projekat/backend/src/modules/auth/auth.route.ts, projekat/backend/src/modules/users/users.route.ts
- **Zavisi od:** PBI-045
- **Preduvjet za:** sve module s ograničenim pristupom
---
 
#### Acceptance Kriteriji
 
- Mora postojati **reusable middleware za provjeru autentifikacije** koji provjerava prisustvo i valjanost JWT tokena.
- Mora postojati **reusable middleware za provjeru role** koji prihvata jednu ili više dozvoljenih uloga.
- Neautentificiran zahtjev prema zaštićenoj ruti mora biti **odbijen s 401** bez curenja dodatnih podataka.
- Zahtjev s neadekvatnom ulogom mora biti **odbijen s 403**.
- Middleware mora biti **lako ponovo upotrebljiv** na različitim modulima bez dupliranja logike.
---
 
### PBI-047 – Centralizovana validacija zahtjeva i DTO schema sloj
 
**Tip:** Technical Task | **Prioritet:** Visok | **Složenost:** 4 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **backend developer**, želim **da ulazni zahtjevi prolaze kroz zajedničke schema provjere**, kako bih **smanjio dupliciranje validacije po rutama i kontrolerima**.
 
> **Story 2 –** Kao **frontend developer**, želim **predvidiv format grešaka za neispravne requeste**, kako bih **mogao pouzdano prikazati poruke korisniku bez posebne logike za svaki endpoint**.
 
> **Story 3 –** Kao **QA**, želim **da se ista validacija koristi kroz cijeli backend**, kako bih **mogao testirati poslovna pravila na jednom mjestu i lakše održavati testove**.
 
#### Poslovna vrijednost
 
Zod-based validacija daje jedinstveni ugovor za ulazne podatke i smanjuje bugove između frontenda i backenda.
 
#### Pretpostavke i otvorena pitanja
 
- Pretpostavka je da će validacija biti definisana po endpointu ili po domenskom modulu.
- Otvoreno je da li ćemo koristiti zajedničke DTO/Schema datoteke između frontenda i backenda ili samo backend schema sloj.
#### Veze i zavisnosti
 
- **Veza s:** projekat/backend/src/config/env.ts, projekat/backend/src/app.ts
- **Zavisi od:** PBI-041, PBI-046
---
 
#### Acceptance Kriteriji
 
- Svaki **POST/PATCH endpoint mora imati definiranu schema validaciju** za očekivani payload.
- Neispravan payload mora vratiti **400 sa standardiziranim opisom greške** i referencom na polja koja nisu prošla provjeru.
- Validacijska logika **ne smije biti duplirana po controllerima** ako se isto pravilo koristi na više mjesta.
- Schema sloj mora pokrivati **obavezna, opciona i formatirana polja**, uključujući enum vrijednosti i dužinu tekstualnih polja.
- Greške validacije moraju biti dovoljno konzistentne da **frontend može prikazati korisnu poruku** bez posebnog parsiranja svakog endpointa.
---
 
### PBI-048 – Rate limiting za javne i auth endpointe
 
**Tip:** Technical Task | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** 5
 
#### User Storiji
 
> **Story 1 –** Kao **backend developer**, želim **rate limiting na javnim i auth endpointima**, kako bih **smanjio rizik od brute-force napada i zloupotrebe forme**.
 
> **Story 2 –** Kao **sigurnosno odgovoran član tima**, želim **da reset lozinke, login i javna prijava kvara imaju ograničenja**, kako bih **spriječio spam i prekomjeran broj zahtjeva**.
 
> **Story 3 –** Kao **QA**, želim **da rate limit ponašanje bude predvidivo i testabilno**, kako bih **mogao provjeriti kako se sistem ponaša kada neko šalje previše zahtjeva**.
 
#### Poslovna vrijednost
 
Rate limiting povećava sigurnost i stabilnost sistema bez značajnog uticaja na normalne korisnike.
 
#### Pretpostavke i otvorena pitanja
 
- Pretpostavka je da će se limit podešavati kroz environment varijable ili centralnu konfiguraciju.
- Otvoreno je da li limit treba biti po IP adresi, po korisniku ili po kombinaciji oba kriterija.
#### Veze i zavisnosti
 
- **Veza s:** projekat/backend/src/modules/auth/auth.route.ts, projekat/frontend/src/app/login/page.tsx
- **Zavisi od:** PBI-041, PBI-045
---
 
#### Acceptance Kriteriji
 
- **Login, reset lozinke i javna prijava kvara** moraju imati definirana ograničenja broja zahtjeva u vremenskom intervalu.
- Kada limit bude premašen, sistem mora vratiti **jasnu 429 reakciju** bez otkrivanja osjetljivih informacija.
- Rate limiting mora biti **konfigurabilan**, a ne hardkodiran u controllerima.
- Greška zbog rate limita **ne smije otkriti** da li je određeni korisnički račun validan.
- Zabilježeni pokušaji prekoračenja limita moraju biti **vidljivi u logovima** za potrebe analize zloupotrebe.

---

## SPRINT 6

---

### PBI-004 – Planiranje intervencija

**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 5 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **kreirati i zakazati intervenciju na osnovu primljene prijave kvara**, kako bih **osigurao organiziran i pravovremen odgovor tima uz jasno definisan vremenski okvir**.

> **Story 2 –** Kao **koordinator**, želim **kreirati intervenciju i bez prethodno prijavljenog kvara**, kako bih **mogao planirati preventivna ili redovna održavanja koja nisu nastala kao reakcija na kvar korisnika**.

> **Story 3 –** Kao **koordinator**, želim **naknadno izmijeniti detalje intervencije dok je u statusu „Otvoreno" ili „U procesu"**, kako bih **mogao reagovati na promjenu okolnosti bez gubljenja historijata originalnog plana**.

#### Poslovna vrijednost

Planiranje intervencija je srž operativnog rada koordinatora. Bez ove funkcionalnosti, terenski tim nema strukturiran zadatak, a menadžment nema uvid u planove.

#### Pretpostavke i otvorena pitanja

- Otvoreno pitanje: Koji vremenski okvir se unosi – samo rok završetka ili i planirano vrijeme početka?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-005 (Prioritet i SLA), PBI-006 (Dodjela servisera), PBI-008 (Praćenje statusa)
- **Zavisi od:** PBI-003 (Prijava kvara), PBI-002 (Login)

---

#### Acceptance Kriteriji

- Koordinator mora imati mogućnost unosa: **naziv, opis, lokacija, vremenski okvir i veza na prijavu kvara**.
- Sistem mora **dozvoliti kreiranje intervencije i bez veze na prijavu kvara** (planirano održavanje).
- Ako koordinator ne unese obavezne podatke, **sistem ne smije sačuvati intervenciju** i mora označiti problematična polja.
- Kada koordinator sačuva intervenciju, **ona mora biti odmah vidljiva u listi aktivnih intervencija** s ispravnim statusom „Otvoreno".
- Koordinator mora moći **naknadno izmijeniti detalje intervencije** dok je status „Otvoreno" ili „U procesu".
- Svaka kreirana intervencija mora biti **evidentirana s vremenskom oznakom kreiranja** i korisničkim imenom koordinatora.

---

### PBI-005 – Prioritet intervencije, SLA i upozorenja o kašnjenju
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 6 SP | **Sprint:** 6
 
#### User Storiji
 
> **Story 1 –** Kao **koordinator**, želim **dodijeliti i po potrebi izmijeniti prioritet svake intervencije**, kako bih **osigurao da terenski tim uvijek radi na najhitnijim zadacima**.
 
> **Story 2 –** Kao **administrator sistema**, želim **definirati vremenski rok za rješavanje intervencija za svaki nivo prioriteta**, kako bih **uspostavio mjerljive standarde usluge koji služe kao osnova za automatska upozorenja o kašnjenju**.
 
> **Story 3 –** Kao **koordinator**, želim **biti automatski upozoren ako intervencija nije riješena do definisanog SLA roka**, kako bih **mogao pravovremeno intervenirati i prerasporediti resurse**.
 
#### Poslovna vrijednost
 
Prioritet je osnova za organizaciju rada. Bez eksplicitnog rangiranja, koordinator i serviseri moraju sami procjenjivati važnost svakog zadatka, što vodi do grešaka. SLA konfiguracija daje organizaciji mjerljive standarde usluge, a automatska upozorenja o kašnjenju oslobađaju koordinatora od ručnog praćenja rokova.
 
#### Pretpostavke i otvorena pitanja
 
- Dostupne razine prioriteta: Hitan, Visok, Normalan, Nizak.
- SLA rokovi se definišu per-prioritet.
- Otvoreno pitanje: Da li promjena prioriteta zahtijeva navođenje razloga?
- Otvoreno pitanje: Da li SLA sat teče od kreiranja intervencije ili od dodjele serviseru?
- Otvoreno pitanje: Gdje se prikazuje upozorenje – u listi ili kao notifikacija?
#### Veze i zavisnosti
 
- **Preduvjet za:** PBI-007 (Pregled liste – rangiranje po prioritetu)
- **Zavisi od:** PBI-004 (Planiranje intervencija)
---
 
#### Acceptance Kriteriji – Prioritet
 
- Koordinator mora imati mogućnost odabira prioriteta iz **padajućeg menija: Hitan, Visok, Normalan, Nizak**.
- **Prioritet je obavezno polje** – sistem ne smije dozvoliti čuvanje intervencije bez njega.
- Kada koordinator naknadno promijeni prioritet, **sistem mora zabilježiti promjenu** s vremenskom oznakom i imenom korisnika.
- Lista aktivnih intervencija mora biti **automatski sortirana po prioritetu** (Hitan > Visok > Normalan > Nizak), a unutar istog prioriteta po datumu kreiranja (starije prve).
- Korisnik treba **vizualno razlikovati prioritete** u listi (boja ili ikona) bez otvaranja detalja.
- Sistem ne smije dozvoliti postavljanje prioriteta koji nije u listi predviđenih opcija.

#### Acceptance Kriteriji – SLA konfiguracija
 
- Admin mora imati pristup **stranici za konfiguraciju SLA rokova** s poljem za svaki nivo prioriteta.
- Admin mora moći **unijeti vremenski rok u satima** za svaki nivo (npr. Hitan = 2h, Visok = 8h).
- Sistem ne smije dozvoliti **čuvanje SLA konfiguracije s praznim poljem, nulom ili negativnom vrijednošću**.
- Nakon čuvanja, nova SLA konfiguracija mora **odmah biti aktivna** za sve buduće provjere kašnjenja.
- Promjena SLA konfiguracije mora biti **zabilježena u audit logu**.

#### Acceptance Kriteriji – Upozorenje kašnjenja
 
- Sistem mora **automatski generisati upozorenje** za svaku intervenciju koja nije u statusu "Završeno" a SLA rok je prošao.
- Upozorenje mora biti **vidljivo koordinatoru** u pregledu (npr. crvena oznaka ili status "Zakašnjenje").
- Sistem mora upozoravati **samo za intervencije s definisanim rokom** – intervencije bez roka ne smiju generisati upozorenja.
- Upozorenje ne smije **automatski promijeniti status intervencije** – samo signalizira problem.
- Sistem mora **ukloniti oznaku upozorenja** čim intervencija prijeđe u status "Završeno".

---

### PBI-006 – Dodjela servisera i pregled dostupnosti

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 4 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **dodijeliti jednog ili više servisera otvorenoj intervenciji**, kako bih **jasno rasporedio odgovornost i osigurao da pravi ljudi znaju koji zadatak trebaju obaviti**.

> **Story 2 –** Kao **koordinator**, želim **pri dodjeli intervencije vidjeti listu servisera sortiranu po broju aktivnih zadataka**, kako bih **lako prepoznao koji su serviseri trenutno manje opterećeni**.

> **Story 3 –** Kao **koordinator**, želim **moći izmijeniti ili ukloniti dodijeljenog servisera i nakon što je dodjela izvršena**, kako bih **mogao reagovati na iznenadnu nedostupnost servisera**.

#### Poslovna vrijednost

Bez jasne dodjele, intervencija ostaje "ničija" i postoji rizik da ne bude obavljena. Sortiran prikaz po opterećenosti čini distribuciju posla transparentnom i pravednom bez ručnog prebrojavanja.

#### Pretpostavke i otvorena pitanja

- Koordinator može dodijeliti jednog ili više servisera istoj intervenciji.
- Koordinator uvijek može dodijeliti intervenciju bilo kom serviseru, bez obzira na opterećenost.
- Otvoreno pitanje: Da li dodjela automatski šalje notifikaciju serviseru? (Veza s PBI-012)
- Otvoreno pitanje: Da li se u broj aktivnih intervencija računaju i intervencije s timskom dodjelom?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-009 (Pregled zadataka servisera), PBI-012 (Notifikacije)
- **Zavisi od:** PBI-004 (Planiranje intervencija), PBI-001 (Registracija)

---

#### Acceptance Kriteriji – Dodjela

- Koordinator mora imati **dugme ili sekciju za dodjelu servisera** unutar detalja intervencije.
- Sistem mora prikazati **listu dostupnih servisera** iz koje koordinator može odabrati jednog ili više.
- Kada koordinator sačuva dodjelu, **ime servisera mora biti vidljivo u detalju i u listi** aktivnih intervencija.
- Koordinator mora moći **izmijeniti ili ukloniti dodjelu** servisera i nakon što je postavljena.
- Sistem ne smije dozvoliti dodjelu servisera koji ima **deaktiviran korisnički račun**.
- Sistem mora zabilježiti **ko je izvršio dodjelu i kada** (audit log).

#### Acceptance Kriteriji – Dostupnost

- Lista servisera mora biti **sortirana po broju aktivnih intervencija** – od najmanje prema najviše opterećenim.
- Uz svako ime servisera, mora biti **vidljiv broj njegovih trenutno aktivnih intervencija**.
- Koordinator mora moći **odabrati bilo kojeg servisera** s liste, bez obzira na broj aktivnih zadataka.
- Lista mora biti **ažurirana u realnom vremenu** ili pri svakom otvaranju prozora za dodjelu.
- Serviseri s **deaktiviranim računom ne smiju biti prikazani** na listi.
- Ako svi serviseri imaju 0 aktivnih intervencija, **lista mora i dalje biti prikazana**.

---

### PBI-007 – Pregled liste aktivnih intervencija

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **pregledati sve aktivne intervencije rangirane po prioritetu i filtrirane po statusu, tipu ili dodjeljnosti**, kako bih **u svakom trenutku imao jasnu sliku aktuelnog stanja na terenu**.

> **Story 2 –** Kao **menadžment**, želim **pregledati aktivne intervencije bez mogućnosti izmjene**, kako bih **imao ažuran uvid u operativno stanje bez rizika od slučajnih izmjena podataka**.

> **Story 3 –** Kao **koordinator**, želim **kombinovati više filtera istovremeno**, kako bih **brzo suzio pregled na samo one intervencije koje zahtijevaju moju pažnju**.

#### Poslovna vrijednost

Ovo je centralni operativni ekran sistema. Koordinator svaki radni dan počinje i završava s ovim pregledom. Pravilno rangiranje po prioritetu direktno utječe na brzinu reakcije tima.

#### Pretpostavke i otvorena pitanja

- Otvoreno pitanje: Koji je maksimalni broj intervencija po stranici (paginacija)?
- Otvoreno pitanje: Da li lista automatski osvježava podatke ili zahtijeva ručno osvježavanje?

#### Veze i zavisnosti

- **Zavisi od:** PBI-004, PBI-005, PBI-006, PBI-008
- **Veza s:** PBI-017 (Napredna pretraga), PBI-014 (Dashboard)

---

#### Acceptance Kriteriji

- Sistem mora prikazati **sve aktivne intervencije** (status: Otvoreno, U procesu).
- Lista mora biti **automatski sortirana po prioritetu** (Hitan > Visok > Normalan > Nizak), unutar istog prioriteta po datumu kreiranja.
- Korisnik mora moći **filtrirati intervencije po statusu, tipu i dodjeljnosti** (dodijeljeno / nije dodijeljeno / dodijeljeno određenom serviseru).
- Svaki red u listi mora prikazivati **minimalno**: naziv, prioritet, status, lokaciju, dodjeljenog servisera i datum kreiranja.
- Sistem mora **vizualno razlikovati prioritete** (boja, ikona ili oznaka).
- Kombinovanje više filtera **mora raditi ispravno** – prikazuju se samo intervencije koje zadovoljavaju sve odabrane kriterije.
- Sistem ne smije prikazivati **arhivirane intervencije** u aktivnoj listi.

---

#### PBI-008 – Praćenje i izmjena statusa intervencije
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 8 SP | **Sprint:** 6
 
#### User Storiji
 
> **Story 1 –** Kao **koordinator**, želim **mijenjati status intervencije i imati pregled kompletne historije svih promjena statusa**, kako bih **osigurao da svi dionici u realnom vremenu znaju gdje se intervencija nalazi**.
 
> **Story 2 –** Kao **serviser**, želim **promijeniti status intervencije koja mi je dodijeljena**, kako bih **obavijestio koordinatora da sam počeo raditi na zadatku**.
 
> **Story 3 –** Kao **sistem**, moram **spriječiti promjenu statusa koja nije u predefinisanom smjeru**, kako bih **zaštitio integritet toka rada**.
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-004, PBI-006
- **Preduvjet za:** PBI-010
---
 
#### Acceptance Kriteriji
 
- Sistem mora **dozvoliti promjenu statusa samo u predefinisanom smjeru**: Otvoreno → U procesu → Završeno ili Otkazano.
- Svaka promjena statusa mora biti **automatski zabilježena u historiji** s imenom korisnika, datumom i vremenom.
- Koordinator mora imati **pregled kompletne historije promjena statusa** unutar detalja intervencije.
- Sistem ne smije dozvoliti **promjenu statusa Završene intervencije** bez posebnih administratorskih ovlasti.
- Status „Otkazano" **može dodijeliti samo koordinator**.
- Kada se status promijeni, **lista aktivnih intervencija mora odražavati novu vrijednost** bez potrebe za ručnim osvježavanjem (ili uz jasno vidljivo dugme za osvježavanje).
- Korisnik treba dobiti **vizualnu potvrdu** da je promjena statusa uspješno sačuvana.

---

### PBI-009 – Pregled zadataka servisera
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** 6
 
#### User Storiji
 
> **Story 1 –** Kao **serviser**, želim **na jednom mjestu vidjeti sve intervencije koje su mi dodijeljene, sortirane po prioritetu**, kako bih **znao koji zadaci me čekaju i po kom redu ih trebam obaviti**.
 
> **Story 2 –** Kao **serviser**, želim **otvoriti detalj dodijeljene intervencije i vidjeti opis kvara, lokaciju, priložene dokumente i komentare**, kako bih **imao sve potrebne informacije na jednom ekranu**.
 
> **Story 3 –** Kao **serviser**, želim **biti siguran da ne mogu ni slučajno vidjeti ili izmijeniti intervencije koje mi nisu dodijeljene**, kako bih **radio u jasno definisanom opsegu odgovornosti**.
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-006
---
 
#### Acceptance Kriteriji
 
- Sistem mora prikazati **isključivo intervencije dodijeljene serviseru**.
- Za svaku intervenciju, serviser mora vidjeti **minimalno**: naziv, lokaciju, opis kvara, prioritet i rok završetka.
- Lista zadataka mora biti **sortirana po prioritetu**.
- Serviser mora moći **otvoriti detalj svake intervencije** i vidjeti potpuni opis, dokumente i komentare.
- Sistem ne smije prikazivati **intervencije sa statusom "Završeno"** u aktivnoj listi (ili ih jasno vizualno odvojiti).
- Serviser ne smije imati mogućnost **pristupa niti izmjene intervencija koje mu nisu dodijeljene**.
- Ako serviser nema dodijeljenih intervencija, **sistem mora prikazati jasnu poruku**.

---

### PBI-013 – Upravljanje korisničkim računima (Admin)
 
**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 8 SP | **Sprint:** 6
 
#### User Storiji
 
> **Story 1 –** Kao **administrator sistema**, želim **kreirati nove korisničke račune i izmijeniti postojeće podatke**, kako bih **osigurao da sistem uvijek odražava stvarno stanje organizacije**.
 
> **Story 2 –** Kao **administrator sistema**, želim **deaktivirati korisnički račun bez brisanja i naknadno ga reaktivirati**, kako bih **osigurao da bivši zaposlenici odmah izgube pristup, ali historijat njihovog rada ostane sačuvan**.
 
> **Story 3 –** Kao **sistem**, moram **spriječiti brisanje korisnika koji ima vezane aktivne intervencije i spriječiti admina da deaktivira vlastiti račun**, kako bih **zaštitio integritet podataka**.
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-001, PBI-002
- **Veza s:** PBI-015
---
 
#### Acceptance Kriteriji
 
- Admin mora imati pristup **listi svih korisničkih računa** s informacijama: ime, korisničko ime, email, uloga, status.
- Admin mora moći **izmijeniti podatke postojećeg korisnika**: ime, email, ulogu.
- Admin mora moći **deaktivirati korisnički račun** bez brisanja – deaktiviran korisnik ne smije se moći prijaviti.
- Admin mora moći **reaktivirati prethodno deaktiviran račun**.
- Admin mora moći **promijeniti ulogu korisnika** i ta promjena mora biti odmah aktivna.
- Admin ne smije moći **deaktivirati vlastiti račun**.
- Sistem ne smije dozvoliti **brisanje korisnika koji ima vezane aktivne intervencije**.
- Svaka izmjena u korisničkim računima mora biti **zabilježena u audit logu**.
- Admin pri kreiranju ili uređivanju korisnika **dodjeljuje firmu** kojoj korisnik pripada.

---

### PBI-015 – Upravljanje korisničkim profilom i reset lozinke

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 4 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **prijavljeni korisnik**, želim **moći pregledati i ažurirati vlastite kontaktne podatke**, kako bih **osigurao da su moji podaci u sistemu uvijek tačni**.

> **Story 2 –** Kao **prijavljeni korisnik**, želim **moći promijeniti lozinku unosom trenutne i nove lozinke**, kako bih **osigurao sigurnost svog računa**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-002
- **Veza s:** PBI-013

---

#### Acceptance Kriteriji

- Svaki prijavljeni korisnik mora imati pristup **stranici Moj profil** s prikazom i mogućnošću izmjene: ime, prezime, email.
- Korisnik mora moći **promijeniti lozinku** unosom trenutne lozinke.
- Ako korisnik unese **netačnu trenutnu lozinku**, sistem mora prikazati grešku i odbiti promjenu.
- Sistem ne smije dozvoliti korisniku da **promijeni vlastitu ulogu**.

---

### PBI-033 – Pregled i upravljanje attachmentima
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** 6
 
#### User Storiji
 
> **Story 1 –** Kao **koordinator ili administrator**, želim **pregledati i preuzeti sve fajlove priložene uz intervenciju**, kako bih **imao potpun uvid u dokumentaciju vezanu za konkretni kvar**.
 
> **Story 2 –** Kao **administrator**, želim **definirati dozvoljene tipove fajlova i maksimalnu veličinu, te moći obrisati neodgovarajući attachment**, kako bih **osigurao da sistem ne sadrži neprihvatljive ili zlonamjerne datoteke**.
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-003 (Prijava kvara – upload fajlova)
- **Veza s:** PBI-013 (Admin upravljanje)
---
 
#### Acceptance Kriteriji
 
- Koordinator i admin moraju moći **pregledati sve priložene fajlove** (naziv, tip, veličina, datum uploada) u detaljima intervencije.
- Koordinator i admin moraju moći **otvoriti ili preuzeti svaki priloženi fajl** direktno iz sistema.
- Admin mora moći **definisati dozvoljene tipove fajlova i maksimalnu veličinu** u konfiguraciji.
- Sistem mora **odbiti upload fajlova** koji ne odgovaraju dozvoljenim tipovima ili prelaze maksimalnu veličinu – uz jasnu poruku.
- Koordinator ili admin mora moći **obrisati attachment** uz obaveznu potvrdu akcije.
- Sistem mora **zabilježiti ko je i kada obrisao attachment** u audit logu.
- Ako intervencija nema priloženih fajlova, **sekcija attachmenta mora biti prikazana** s odgovarajućom porukom.

---

### PBI-017 – Napredna pretraga
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 6
 
#### User Storiji
 
> **Story 1 –** Kao **koordinator**, želim **pretraživati intervencije po kombinaciji više kriterija** (naziv, datum, lokacija, status, dodjeljeni serviser), kako bih **brzo pronašao konkretnu intervenciju bez ručnog listanja**.
 
> **Story 2 –** Kao **koordinator**, želim **naprednu pretragu primijeniti i na arhivirane intervencije**, kako bih **mogao pronaći historijat određene lokacije ili servisera bez prebacivanja na drugi ekran**.
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-007 (Lista intervencija)
- **Veza s:** PBI-011 (Historija), PBI-023 (Export)
---
 
#### Acceptance Kriteriji
 
- Koordinator mora moći pretraživati intervencije **po nazivu/opisu** (full-text pretraga).
- Koordinator mora moći filtrirati **po datumu (od – do rasponu), lokaciji, statusu i dodjeljenom serviseru**.
- Korisnik mora moći **kombinovati više kriterija** istovremeno i dobiti presjek rezultata.
- Rezultati pretrage moraju biti prikazani u **istom formatu kao lista aktivnih intervencija**.
- Ako pretraga ne vrati rezultate, **sistem mora prikazati jasnu poruku**.
- Sistem ne smije **odbaciti sve kriterije** ako jedan ne vrati rezultate – mora primijeniti sve koji su uneseni.

---

## SPRINT 7

---

### PBI-010 – Evidencija izvještaja o intervenciji

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 7

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **po završetku intervencije dokumentirati šta sam uradio i koji materijal sam koristio**, kako bih **ostavio trajnu evidenciju obavljenog rada**.

> **Story 2 –** Kao **koordinator ili administrator**, želim **pregledati izvještaj servisera unutar detalja intervencije**, kako bih **imao kompletan uvid u obavljeni rad**.

> **Story 3 –** Kao **sistem**, moram **spriječiti unos izvještaja ako intervencija još nije započeta**, kako bih **osigurao integritet podataka**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-008, PBI-009
- **Veza s:** PBI-011, PBI-023

---

#### Acceptance Kriteriji

- Serviser mora imati **formu za unos izvještaja** s poljima: opis obavljenih radova, utrošeni materijal, napomene.
- Sistem mora **vezati izvještaj za konkretnu intervenciju**.
- Sistem mora dozvoliti **dodavanje izvještaja dok je intervencija u statusu „U procesu" ili „Završeno"**.
- Sistem ne smije dozvoliti unos izvještaja **ako intervencija nije započeta**.
- Obračun troškova **ne smije biti dio forme u MVP-u**.

---

### PBI-011 – Historija intervencija po lokaciji/uređaju

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 3 SP | **Sprint:** 7

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **pregledati sve prethodne intervencije na određenoj lokaciji ili uređaju**, kako bih **razumio historijat problema na tom mjestu**.

> **Story 2 –** Kao **serviser**, želim **na terenu brzo provjeriti da li je isti kvar na ovoj lokaciji bio prijavljen ranije**, kako bih **fokusirao istragu na sistemski uzrok**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004

---

#### Acceptance Kriteriji

- Koordinator ili serviser mogu **filtrirati historiju intervencija prema lokaciji ili uređaju**.
- Historija mora biti **sortirana od najnovije prema najstarijoj** intervenciji.
- Sistem mora prikazati historiju **samo za završene i arhivirane intervencije**.
- Grafički prikazi i vizualizacije **ne smiju biti implementirani** u MVP verziji.

---

### PBI-014 – Menadžment dashboard

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 7

#### User Storiji

> **Story 1 –** Kao **menadžment**, želim **na jednom ekranu vidjeti broj aktivnih i završenih intervencija te distribuciju po prioritetu**, kako bih **mogao donijeti informirane odluke o raspodjeli resursa**.

> **Story 2 –** Kao **menadžment**, želim **vidjeti prosječno vrijeme rješavanja intervencija**, kako bih **mogao objektivno procijeniti efikasnost tima**.

> **Story 3 –** Kao **sistem**, moram **ograničiti pristup dashboardu isključivo na uloge Menadžment i Admin**, kako bih **spriječio da serviseri imaju uvid u ukupne operativne podatke**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-008, PBI-005
- **Veza s:** PBI-023

---

#### Acceptance Kriteriji

- Dashboard mora prikazivati **broj aktivnih intervencija**, **završenih intervencija** i **prosječno vrijeme rješavanja**.
- Dashboard mora prikazivati **distribuciju intervencija po prioritetu** u tabelarnom formatu.
- Grafički prikazi **ne smiju biti implementirani** u MVP verziji.
- Pristup dashboardu mora biti **ograničen na uloge: Menadžment i Admin**.

---

### PBI-015 – Upravljanje korisničkim profilom

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 2 SP | **Sprint:** 7

> Vidjeti Sprint 6 – PBI-015.

---

### PBI-016 – Komentari intervencije
 
**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 3 SP | **Sprint:** 7
 
#### User Storiji
 
> **Story 1 –** Kao **koordinator**, želim **dodati tekstualni komentar na intervenciju**, kako bih **ostavio važne napomene ili pojašnjenja**.
 
> **Story 2 –** Kao **serviser**, želim **komentarom prijaviti kašnjenje ili neočekivanu komplikaciju na terenu**, kako bih **koordinatoru dao ažurnu informaciju bez telefonskog poziva**.
 
#### Veze i zavisnosti
 
- **Veza s:** PBI-012, PBI-010
---
 
#### Acceptance Kriteriji
 
- Koordinator i serviser moraju imati **formu za unos komentara** unutar detalja intervencije.
- Svaki komentar mora biti **prikazan s imenom autora, datumom i tačnim vremenom** objave.
- Komentari moraju biti **sortirani kronološki** – konzistentno kroz cijeli sistem.
- Sistem ne smije dozvoliti **prazne komentare**.
- Korisnik koji nije koordinator ni serviser **ne smije moći dodavati komentare**.
- Svi komentari moraju ostati **trajno vidljivi** i ne smiju biti automatski brisani.

---

### PBI-020 – Kalendarski prikaz intervencija

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 7

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **pregledati planirane intervencije u kalendarskom prikazu po danima i sedmicama**, kako bih **imao vizualni uvid u raspoređenost obaveza**.

> **Story 2 –** Kao **koordinator**, želim **kliknuti na intervenciju u kalendaru da direktno otvorim njen detalj**, kako bih **zadržao kontekst rada bez gubitka produktivnosti**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004, PBI-022

---

#### Acceptance Kriteriji

- Koordinator mora moći **prebaciti se između listnog i kalendarskog prikaza**.
- Svaka intervencija mora biti **prikazana na datumu koji odgovara planiranom roku ili datumu početka**.
- Klik na intervenciju u kalendaru mora **otvoriti detalj te intervencije**.
- Sistem mora **vizualno razlikovati intervencije po prioritetu** u kalendarskom prikazu.

---

## SPRINT 8

---

### PBI-012 – Notifikacije

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 8 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **primiti in-app notifikaciju čim mi je dodijeljen novi zadatak**, kako bih **mogao pravovremeno reagirati bez stalnog ručnog provjeravanja sistema**.

> **Story 2 –** Kao **koordinator**, želim **biti obaviješten čim korisnik prijavi novi kvar**, kako bih **mogao odmah kreirati intervenciju i reagovati bez kašnjenja**.

> **Story 3 –** Kao **bilo koji korisnik sistema**, želim **klikom na notifikaciju biti direktno preusmjeren na relevantnu intervenciju i vidjeti broj nepročitanih obavijesti u navigaciji**, kako bih **imao brz pristup važnim informacijama**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-003, PBI-006

---

#### Acceptance Kriteriji

- Kada koordinator dodijeli intervenciju serviseru, **serviser mora primiti notifikaciju** u realnom ili gotovo realnom vremenu.
- Korisnik treba moći **kliknuti na notifikaciju i biti direktno preusmjeren** na relevantnu intervenciju.
- Sistem mora prikazati **broj nepročitanih notifikacija** vidljivo u navigaciji.

---

### PBI-022 – Planirana/preventivna održavanja

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **kreirati intervenciju za planirano preventivno održavanje i definisati periodičnost ponavljanja**, kako bih **osigurao da redovni servisi budu automatski zakazani**.

> **Story 2 –** Kao **koordinator**, želim **izmijeniti ili zaustaviti seriju ponavljanja bez utjecaja na već kreirane instance**, kako bih **mogao prilagoditi raspored bez gubitka historijata**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004

---

#### Acceptance Kriteriji

- Koordinator mora moći **kreirati intervenciju bez prijave kvara** i označiti je kao „Planirano održavanje".
- Koordinator mora moći **definisati periodičnost**: minimalno dnevno, sedmično i mjesečno ponavljanje.
- Koordinator mora moći **izmijeniti ili zaustaviti ponavljanje** bez utjecaja na već kreirane instance.

---

### PBI-023 – Export podataka

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 5 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **koordinator ili menadžment**, želim **eksportovati listu intervencija u PDF format**, kako bih **ih mogao arhivirati ili podijeliti s vanjskim dionicima van sistema**.

> **Story 2 –** Kao **sistem**, moram **pri generisanju PDF-a prikazivati samo podatke kojima korisnik ima pristup**, kako bih **spriječio nenamjerno otkrivanje podataka**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-007, PBI-010

---

#### Acceptance Kriteriji

- Koordinator i menadžment moraju imati **opciju exporta liste intervencija u PDF**.
- PDF dokument mora biti **čitljiv i urednog izgleda** s jasnim zaglavljem.
- Sistem ne smije exportovati **podatke kojima korisnik nema pristup** na osnovu uloge.

---

### PBI-025 – Detekcija duplikata prijave kvara
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 8
 
#### User Storiji
 
> **Story 1 –** Kao **korisnik**, želim **biti upozoren ako sistem detektuje da sam nedavno prijavio sličan kvar na istoj lokaciji**, kako bih **svjesno odlučio da li zaista trebam kreirati novu prijavu**.
 
> **Story 2 –** Kao **koordinator**, želim **da sistem automatski upozorava korisnike pri potencijalnim duplikatima**, kako bih **smanjio broj lažnih duplikata u listi intervencija**.
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-003
---
 
#### Acceptance Kriteriji
 
- Kada korisnik pokuša prijaviti kvar, sistem mora **provjeriti postoji li slična prijava od istog korisnika** u definisanom vremenskom periodu.
- Ako sistem detektuje potencijalni duplikat, **mora prikazati upozorenje** s informacijom o sličnoj postojećoj prijavi.
- Korisnik mora moći **nastaviti s prijavom i pored upozorenja** – detekcija duplikata je upozorenje, ne blokada.
- Korisnik mora moći **odustati od prijave** i biti preusmjeren na detalje postojeće intervencije.
- Sistem ne smije prikazivati **lažna upozorenja za prijave na različitim lokacijama** ili s bitno različitim opisima.
- Ako je prethodna slična prijava u statusu „Završeno", **sistem ne smije je tretirati kao duplikat**.

---

### PBI-027 – Sistem tiketa za korisničku podršku

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 8 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **registrirani korisnik**, želim **kreirati tiket za korisničku podršku**, kako bih **dobio zvanični i praćeni odgovor**.

> **Story 2 –** Kao **korisnik ili agent podrške**, želim **razmjenjivati poruke unutar otvorenog tiketa**, kako bih **vodio strukturisan dijalog o problemu na jednom mjestu**.

> **Story 3 –** Kao **korisnik**, želim **primiti in-app obavijest kada agent odgovori na moj tiket**, kako bih **mogao pravovremeno reagirati**.

#### Veze i zavisnosti

- **Odvojen od:** PBI-003
- **Veza s:** PBI-012

---

#### Acceptance Kriteriji

- Prijavljeni korisnik mora imati pristup **formi za kreiranje tiketa** s naslovom, opisom i kategorijom.
- Korisnik i agent moraju imati **formu za slanje tekstualnih poruka** unutar tiketa.
- Kada agent odgovori na tiket, **korisnik mora primiti in-app notifikaciju**.
- Tiket **ne smije kreirati intervenciju** u sistemu za upravljanje kvarovima.

---

### PBI-034 – Geografski/mapski prikaz intervencija

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 4 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **pregledati intervencije prikazane na interaktivnoj mapi prema njihovoj lokaciji**, kako bih **dobio prostorni uvid u distribuciju zadataka**.

> **Story 2 –** Kao **koordinator**, želim **filtrirati prikazane intervencije na mapi po statusu i dodjeljenom serviseru**, kako bih **fokusirao mapski pregled samo na relevantni podskup intervencija**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004, PBI-007

---

#### Acceptance Kriteriji

- Koordinator mora imati mogućnost **prebacivanja između listnog i mapskog prikaza**.
- Svaka intervencija s definisanom lokacijom mora biti **prikazana kao marker na mapi**.
- Klik na marker mora **otvoriti sažetak intervencije** bez napuštanja mapskog prikaza.
- Markeri moraju biti **vizualno razlikovani po prioritetu**.

---

### PBI-038 – Masovne akcije na intervencijama

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 4 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **istovremeno izvršiti istu akciju nad više odabranih intervencija**, kako bih **drastično smanjio broj klikova pri upravljanju u situacijama s visokim volumenom zadataka**.

> **Story 2 –** Kao **koordinator**, želim **nakon masovne akcije dobiti sažetak rezultata**, kako bih **bio siguran da je akcija izvršena ispravno**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-007, PBI-008, PBI-006

---

#### Acceptance Kriteriji

- Koordinator mora moći **odabrati više intervencija** iz liste putem checkboxa.
- Sistem mora tražiti **potvrdu** prije izvršavanja masovne akcije.
- Sistem mora prikazati **sažetak rezultata** (npr. „15 od 15 intervencija uspješno ažurirano").

---

### PBI-026 – Arhiviranje intervencija
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Storiji
 
> **Story 1 –** Kao **sistem**, trebam **automatski arhivirati završene ili otkazane intervencije nakon definisanog vremenskog perioda**, kako bih **održao preglednost aktivnog prikaza i spriječio da stare intervencije usporavaju rad**.
 
> **Story 2 –** Kao **administrator**, želim **konfigurirati vremenski period arhiviranja i imati mogućnost ručnog arhiviranja van automatskog ciklusa**, kako bih **prilagodio politiku zadržavanja podataka potrebama organizacije**.
 
#### Veze i zavisnosti
 
- **Veza s:** PBI-011 (Historija), PBI-017 (Napredna pretraga)
---
 
#### Acceptance Kriteriji
 
- Sistem mora **automatski arhivirati intervencije** sa statusom "Završeno" ili "Otkazano" nakon isteka definisanog perioda.
- Arhivirane intervencije **ne smiju biti prikazane u aktivnoj listi** ali moraju ostati dostupne u historiji i pretragama.
- Sistem mora **sačuvati sve vezane podatke** uz arhiviranu intervenciju (komentari, izvještaji, dokumenti).
- Admin mora moći **konfigurirati vremenski period** arhiviranja.
- Arhiviranje se **ne smije primijeniti na aktivne intervencije** (Otvoreno, U procesu).
- Korisnik s odgovarajućim ovlastima mora moći **ručno arhivirati intervenciju** i van automatskog ciklusa.

---

## Sprint 9

---

### PBI-031 – Višejezična podrška

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 5 SP | **Sprint:** 9

#### User Storiji

> **Story 1 –** Kao **korisnik sistema**, želim **moći odabrati jezik prikaza interfejsa u postavkama profila**, kako bih **koristio sistem na jeziku koji mi je najrazumljiviji**.

> **Story 2 –** Kao **sistem**, moram **prikazivati sve elemente sučelja na odabranom jeziku bez miješanja**, kako bih **osigurao koherentno korisničko iskustvo bez parcijalnih prijevoda**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-015

---

#### Acceptance Kriteriji

- Svaki prijavljeni korisnik mora imati **mogućnost odabira jezika** iz liste podržanih jezika.
- Nakon odabira i čuvanja, **sučelje mora biti prikazano na odabranom jeziku** pri svakom narednom loginu.
- Sistem mora **zapamtiti odabrani jezik** po korisničkom računu, ne samo po sesiji.
- Ako prijevod za određeni element nedostaje, **sistem mora prikazati fallback vrijednost** (npr. engleski) umjesto praznog polja.

---

### PBI-036 – Feedback korisnika po završetku intervencije

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** 9

#### User Storiji

> **Story 1 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti mogućnost da ocijenim intervenciju nakon što budem obaviješten o njenom završetku**, kako bih **dao povratnu informaciju o kvaliteti usluge**.

> **Story 2 –** Kao **koordinator ili administrator**, želim **pregledati feedback korisnika vezan za konkretnu intervenciju**, kako bih **identifikovao slabe tačke u procesu**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-008, PBI-012

---

#### Acceptance Kriteriji

- Kada intervencija prijeđe u status „Završeno", korisnik mora dobiti **in-app obavijest s pozivom na feedback**.
- Feedback mora biti **moguće ostaviti samo jednom** po intervenciji.
- Koordinator i admin moraju moći **pregledati feedback** vezan za konkretnu intervenciju.

---

### PBI-039 – Blokiranje korisnika od strane firme

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 2 SP | **Sprint:** 9

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **blokirati korisnika za kojeg procijenim da se radi o spamu ili zloupotrebi sistema**, kako bih **spriječio daljnje lažne prijave**.

> **Story 2 –** Kao **koordinator**, želim **pregledati sve blokirane korisnike i moći ih deblokirati**, kako bih **imao kompletnu kontrolu i mogao ispraviti eventualne pogrešne blokade**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-003, PBI-001
- **Veza s:** PBI-013

---

#### Acceptance Kriteriji

- Koordinator mora imati **opciju blokiranja korisnika** dostupnu iz pregleda intervencija ili korisničkog profila.
- Nakon blokiranja, **blokirani korisnik ne smije moći slati nove prijave kvarova**.
- Koordinator mora imati **pregled svih blokiranih korisnika** s mogućnošću deblokiranja.
- Blokiranje korisnika **ne smije automatski deaktivirati korisnički račun**.
- Svaka akcija blokiranja i deblokiranja mora biti **evidentirana u logu**.

---

### PBI-040 – Settings page

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 9

#### User Storiji

> **Story 1 –** Kao **prijavljeni korisnik**, želim **na Settings stranici podesiti lične preference aplikacije kao što su jezik prikaza i postavke notifikacija**, kako bih **mogao koristiti sistem na način koji odgovara mom radu**.

> **Story 2 –** Kao **administrator**, želim **na Settings stranici vidjeti pregled sistemskih konfiguracija i brze prečice prema SLA pravilima, kategorijama i korisnicima**, kako bih **brže došao do operativnih postavki**.

> **Story 3 –** Kao **korisnik bez administratorskih privilegija**, želim **vidjeti samo postavke koje smijem mijenjati**, kako bih **imao jasan i siguran interfejs**.

> **Story 4 –** Kao **sistem**, moram **čuvati promjene postavki po korisniku i primjenjivati role-based kontrolu pristupa**, kako bih **spriječio neovlaštene izmjene konfiguracije**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-015, PBI-031, PBI-012, PBI-035

---

#### Acceptance Kriteriji

- Settings stranica mora biti dostupna samo **prijavljenim korisnicima**.
- Svaki prijavljeni korisnik mora moći **pregledati i promijeniti jezik prikaza** iz liste podržanih jezika.
- Odabrani jezik mora biti **sačuvan po korisničkom računu** i mora ostati primijenjen nakon ponovne prijave.
- Admin mora na Settings stranici vidjeti **role-based prečice** prema SLA konfiguraciji, kategorijama, korisnicima i firmama.
- Korisnik bez admin uloge **ne smije vidjeti admin konfiguracijske kontrole**.

---

## Sprint 10

---

### PBI-052 – Analitika feedbacka i kvaliteta usluge

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **menadžment**, želim **vidjeti prosječnu ocjenu intervencija po periodu, firmi, kategoriji i serviseru**, kako bih **prepoznao trendove kvaliteta usluge i dijelove procesa koje treba poboljšati**.

> **Story 2 –** Kao **koordinator**, želim **brzo otvoriti negativan feedback i povezanu intervenciju**, kako bih **mogao provjeriti šta se desilo i reagovati prema serviseru ili korisniku**.

> **Story 3 –** Kao **sistem**, moram **spriječiti pristup feedback analitici za korisnike bez odgovarajuće uloge**, kako bih **zaštitio osjetljive podatke o kvaliteti rada**.

#### Poslovna vrijednost

Analitika feedbacka transformiše ocjene korisnika u koristivu informaciju za donošenje poslovnih odluka o kvaliteti usluge i raspodjeli resursa.

#### Veze i zavisnosti

- **Zavisi od:** PBI-036 (Feedback mehanizam)

---

#### Acceptance Kriteriji

- Menadžment mora imati pristup **izvještaju o feedbacku** kroz dashboard ili izvještajni dio sistema.
- Izvještaj mora prikazati **prosječnu ocjenu, broj feedback zapisa i broj negativnih feedbacka** za odabrani period.
- Korisnik mora moći **filtrirati rezultate po firmi, kategoriji, serviseru i vremenskom periodu**.
- **Negativni feedback mora biti posebno označen** prema dogovorenom pragu ocjene.
- Koordinator i admin moraju moći **otvoriti intervenciju direktno iz feedback izvještaja**.
- Korisnici bez ovlasti **ne smiju vidjeti feedback za tuđe intervencije ili firme**.
- Sistem mora prikazati **jasnu poruku** kada nema feedback zapisa za odabrani filter.

---

### PBI-053 – Upravljanje dostupnošću i odsustvima servisera

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **unijeti periode kada nisam dostupan za nove intervencije**, kako bih **spriječio dodjelu zadataka dok sam na odsustvu, bolovanju ili drugoj obavezi**.

> **Story 2 –** Kao **koordinator**, želim **pri dodjeli intervencije vidjeti dostupnost servisera zajedno s trenutnim opterećenjem**, kako bih **realnije rasporedio posao i izbjegao kašnjenja**.

> **Story 3 –** Kao **serviser**, želim **moći izmijeniti ili otkazati vlastiti budući period nedostupnosti**, kako bih **mogao reagovati na promjenu rasporeda bez administrativne asistencije**.

#### Poslovna vrijednost

Evidencija dostupnosti sprječava dodjelu posla serviseru koji je odsutan, čime se smanjuju kašnjenja i pogrešne alokacije resursa.

#### Veze i zavisnosti

- **Zavisi od:** PBI-006 (Dodjela servisera)

---

#### Acceptance Kriteriji

- Serviser mora moći **kreirati period nedostupnosti** s datumom početka, datumom kraja i razlogom.
- Serviser mora moći **pregledati, izmijeniti i otkazati vlastite buduće periode nedostupnosti**.
- Koordinator mora **vidjeti dostupnost servisera** prilikom ručne dodjele intervencije.
- **Nedostupan serviser mora biti jasno označen** u listi servisera.
- Sistem ne smije **automatski dodijeliti novu intervenciju serviseru koji je nedostupan** u planiranom terminu.
- Koordinator smije **ručno dodijeliti nedostupnog servisera** samo uz potvrdu i unos razloga.
- Period nedostupnosti s datumom završetka u prošlosti **ne smije biti dozvoljen** pri kreiranju.

---

### PBI-054 – Potvrda i promjena termina intervencije od strane korisnika

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti obavijest o zakazanom terminu i potvrditi da mi termin odgovara**, kako bih **smanjio nesporazume i nepotrebne izlaske servisera na teren**.

> **Story 2 –** Kao **korisnik**, želim **zatražiti promjenu termina uz kratko obrazloženje**, kako bih **mogao uskladiti intervenciju sa svojom dostupnošću**.

> **Story 3 –** Kao **koordinator**, želim **vidjeti zahtjeve za promjenu termina na jednom mjestu**, kako bih **brzo odlučio da li prihvatam novi termin ili predlažem alternativu**.

#### Poslovna vrijednost

Potvrda termina smanjuje broj neuspješnih izlazaka servisera na teren, što direktno utiče na operativne troškove i efikasnost tima.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004, PBI-012

---

#### Acceptance Kriteriji

- Kada koordinator zakaže termin intervencije, **korisnik mora dobiti in-app notifikaciju**.
- Korisnik mora moći **potvrditi termin** s detalja intervencije ili iz notifikacije.
- Korisnik mora moći **zatražiti promjenu termina** unosom predloženog vremena i komentara.
- **Zahtjev za promjenu termina mora biti vidljiv koordinatoru** u posebnom statusu ili listi zahtjeva.
- Koordinator mora moći **prihvatiti, odbiti ili predložiti novi termin**.
- Sve promjene termina moraju biti **evidentirane kroz historiju ili audit zapis**.
- Korisnik ne smije moći **slati višestruke aktivne zahtjeve za promjenu termina** za istu intervenciju.

---

### PBI-055 – Baza znanja i preporučena rješenja za kvarove

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **vidjeti ranija rješenja za istu kategoriju kvara ili sličnu lokaciju**, kako bih **brže dijagnosticirao problem i izbjegao ponavljanje istih grešaka**.

> **Story 2 –** Kao **koordinator**, želim **označiti kvalitetan finalizovan izvještaj kao preporučeno rješenje**, kako bih **postepeno gradio bazu znanja iz stvarnih intervencija**.

> **Story 3 –** Kao **serviser**, želim **koristiti preporučeno rješenje kao osnovu za novi izvještaj, ali ga moći urediti**, kako bih **ubrzao dokumentaciju bez gubitka fleksibilnosti**.

#### Poslovna vrijednost

Baza znanja transformiše svaku završenu intervenciju u potencijalni resurs za buduće slične kvarove, smanjujući vrijeme dijagnoze i pogrešnih procjena.

#### Veze i zavisnosti

- **Zavisi od:** PBI-010 (Evidencija izvještaja)
- **Napomena:** Samo finalizovani izvještaji mogu biti označeni (DL-10.2)

---

#### Acceptance Kriteriji

- Koordinator mora moći **označiti finalizovan izvještaj kao preporučeno rješenje**.
- **Samo finalizovani izvještaji** (ne nacrte) mogu biti označeni kao preporučena rješenja.
- Preporučeno rješenje mora biti **povezano s kategorijom kvara i opisom problema**.
- Serviser mora moći **pretraživati bazu znanja po kategoriji, tekstu i lokaciji**.
- Na detalju intervencije sistem mora **prikazati relevantna preporučena rješenja** za istu kategoriju.
- Serviser mora moći **koristiti preporučeno rješenje kao osnovu** za novi izvještaj uz mogućnost uređivanja.
- Rješenja **ne smiju otkrivati podatke korisnika ili firme** korisnicima koji nemaju pravo pristupa.

---

### PBI-056 – Evidencija materijala utrošenog na intervenciji

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **unijeti listu materijala koje sam koristio tokom intervencije**, kako bih **ostavio jasnu evidenciju šta je stvarno potrošeno na terenu**.

> **Story 2 –** Kao **menadžment**, želim **pregledati potrošnju materijala po periodu, kategoriji i firmi**, kako bih **mogao planirati nabavku i uočiti neuobičajeno visoku potrošnju**.

> **Story 3 –** Kao **koordinator**, želim **vidjeti listu utrošenog materijala u detaljima intervencije**, kako bih **imao kompletan uvid u obavljeni rad bez otvaranja zasebnog izvještaja**.

#### Poslovna vrijednost

Evidencija materijala daje operativne informacije za planiranje nabavke bez potrebe za integracijom s računovodstvenim sistemom u ovoj fazi.

#### Veze i zavisnosti

- **Zavisi od:** PBI-010
- **Napomena:** Finansijska integracija nije u scopeu (DL-10.1)

---

#### Acceptance Kriteriji

- Serviser mora moći **dodati jedan ili više materijala** u izvještaj intervencije.
- Za svaki materijal mora se evidentirati **naziv, količina i opciona napomena**.
- Sistem **ne smije dozvoliti negativne ili prazne količine**.
- Koordinator i admin moraju moći **pregledati utrošeni materijal** na detalju intervencije.
- Menadžment mora imati **agregirani pregled potrošnje materijala** po periodu, firmi i kategoriji.
- **Funkcionalnost ne smije uključivati cijene, fakturisanje ili obračun troškova**.
- Serviser mora moći **obrisati ili urediti stavku materijala** dok je izvještaj u statusu Nacrt.

---

### PBI-058 – Eskalacije i komentari ka menadžmentu za rizične intervencije

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **označiti intervenciju kao rizičnu i dodati razlog eskalacije**, kako bih **menadžmentu skrenuo pažnju na intervencije koje mogu utjecati na kvalitet usluge ili rokove**.

> **Story 2 –** Kao **menadžment**, želim **vidjeti listu eskaliranih intervencija s komentarima koordinatora**, kako bih **mogao pratiti kritične slučajeve bez pretraživanja cijele liste intervencija**.

> **Story 3 –** Kao **koordinator**, želim **dodavati eskalacijske komentare koji su odvojeni od redovnih komentara**, kako bih **menadžmentu dao relevantne informacije bez miješanja s operativnim napomenama servisera**.

#### Poslovna vrijednost

Eskalacijski mehanizam osigurava da menadžment bude pravovremeno informisan o rizičnim situacijama bez potrebe za ručnim filtriranjem poruka.

#### Veze i zavisnosti

- **Zavisi od:** PBI-007, PBI-014
- **Napomena:** Eskalacijski komentari su zasebna kolekcija (DL-10.4)

---

#### Acceptance Kriteriji

- Koordinator mora moći **označiti intervenciju kao rizičnu uz obavezan razlog**.
- **Eskalirana intervencija mora biti vidljiva menadžmentu** u posebnom pregledu ili na dashboardu.
- Koordinator mora moći **dodavati eskalacijske komentare koji su odvojeni od običnih komentara** intervencije.
- Menadžment mora moći **označiti eskalaciju kao pregledanu**.
- Kada se intervencija završi ili otkaže, **eskalacija mora ostati historijski vidljiva**.
- Korisnici bez koordinator, menadžment ili admin uloge **ne smiju vidjeti eskalacijske komentare**.
- Koordinator mora moći **ukloniti eskalacijsku oznaku** uz obavezan komentar razloga.

---

### PBI-059 – Zahtjev za ponovno otvaranje završene intervencije

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **korisnik koji je prijavio kvar**, želim **zatražiti ponovnog otvaranja završene intervencije ako problem nije riješen**, kako bih **mogao nastaviti proces bez kreiranja nove prijave za isti kvar**.

> **Story 2 –** Kao **koordinator**, želim **pregledati zahtjeve za ponovnim otvaranjem i prihvatiti ili odbiti zahtjev uz komentar**, kako bih **kontrolisao da se stvarni neriješeni kvarovi vrate u rad**.

> **Story 3 –** Kao **serviser**, želim **biti obaviješten kada je moja završena intervencija ponovo otvorena**, kako bih **znao da je potreban dodatni izlazak ili dopuna izvještaja**.

#### Poslovna vrijednost

Mogućnost ponovnog otvaranja sprječava stvaranje lažnih duplikata intervencija za isti kvar i daje korisniku kontrolisan kanal za reklamaciju.

#### Veze i zavisnosti

- **Zavisi od:** PBI-008, PBI-012
- **Napomena:** Prihvatanje zahtjeva ne briše prethodni feedback (DL-10.5)

---

#### Acceptance Kriteriji

- Korisnik mora moći **zatražiti ponovnog otvaranja samo za intervenciju u statusu Završeno**.
- Zahtjev mora sadržavati **obavezno obrazloženje**.
- Sistem **ne smije dozvoliti više aktivnih zahtjeva** za ponovnim otvaranjem za istu intervenciju.
- Koordinator mora imati **pregled svih zahtjeva** sa statusima: na čekanju, prihvaćen, odbijen.
- Prihvatanje zahtjeva mora **promijeniti intervenciju u odgovarajući aktivni status** i obavijestiti dodijeljene servisere.
- Odbijanje zahtjeva mora **zahtijevati komentar koordinatora** i poslati obavijest korisniku.
- Svi zahtjevi i odluke moraju ostati **vidljivi u historiji intervencije**.
- Prihvatanje zahtjeva **ne smije brisati niti resetovati prethodno ostavljeni feedback**.

---

### PBI-060 – Evidencija dolaska servisera i vremena na terenu

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **označiti kada sam krenuo prema lokaciji, kada sam stigao i kada sam završio rad na terenu**, kako bih **ostavio tačan operativni trag o izvršenju intervencije**.

> **Story 2 –** Kao **koordinator**, želim **vidjeti stvarno vrijeme dolaska i trajanje rada servisera na lokaciji**, kako bih **mogao pratiti kašnjenja i kvalitet planiranja**.

> **Story 3 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti obavijest kada serviser krene prema lokaciji i kada stigne**, kako bih **znao kada mogu očekivati servis**.

#### Poslovna vrijednost

Operativni checkpointi daju transparentnost izvršenja bez oslanjanja na telefonsku komunikaciju i omogućuju automatsko računanje vremena provedenog na terenu.

#### Veze i zavisnosti

- **Zavisi od:** PBI-008, PBI-012
- **Napomena:** Tri fiksna checkpointa umjesto slobodnog unosa (DL-10.3)

---

#### Acceptance Kriteriji

- Dodijeljeni serviser mora moći označiti **tri operativna checkpointa**: krenuo na lokaciju, stigao na lokaciju, završio rad.
- Svaki checkpoint mora sačuvati **vrijeme, servisera i intervenciju** na koju se odnosi.
- Sistem **ne smije dozvoliti** označavanje dolaska prije polaska niti završetka rada prije dolaska.
- Koordinator mora na detalju intervencije vidjeti **checkpoint historiju i ukupno vrijeme** provedeno na terenu.
- Korisnik koji je prijavio kvar mora dobiti **in-app notifikaciju** pri polasku i dolasku servisera.
- Samo dodijeljeni serviser, koordinator ili admin **smiju unositi ili ispravljati checkpoint podatke**.
- Ispravka pogrešno unesenog checkpointa mora **zahtijevati razlog** i biti evidentirana u audit logu.

---

### PBI-061 – Digitalna potvrda izvršene intervencije

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **nakon završetka rada zatražiti digitalnu potvrdu od korisnika na lokaciji**, kako bih **imao dokaz da je intervencija stvarno predana korisniku**.

> **Story 2 –** Kao **korisnik**, želim **potvrditi izvršenje intervencije unosom PIN-a ili potpisom na ekranu**, kako bih **jasno označio da sam upoznat sa završetkom rada, odvojeno od later ocjene usluge**.

> **Story 3 –** Kao **koordinator**, želim **vidjeti koje završene intervencije imaju korisničku potvrdu, a koje su zatvorene bez potvrde uz razlog**, kako bih **lakše provjerio sporne ili nepotpune slučajeve**.

#### Poslovna vrijednost

Digitalna potvrda osigurava pravnu i operativnu sigurnost za organizaciju – dokaz da je korisnik bio prisutan i svjestan završetka intervencije.

#### Veze i zavisnosti

- **Napomena:** Odvojeno od feedbacka – formalna potvrda, ne ocjena (PBI-036)

---

#### Acceptance Kriteriji

- Serviser mora moći **pokrenuti zahtjev za digitalnu potvrdu** samo za intervenciju u toku ili spremnu za završetak.
- Korisnik mora moći **potvrditi izvršenje putem jednokratnog PIN-a ili digitalnog potpisa**.
- Potvrda mora sačuvati **vrijeme, identitet korisnika, metodu potvrde i intervenciju**.
- Intervencija **ne smije automatski dobiti pozitivnu ocjenu** samo zato što je korisnik potvrdio izvršenje.
- Ako korisnik odbije potvrdu, mora moći **unijeti razlog odbijanja**.
- Koordinator mora vidjeti **status potvrde**: potvrđeno, odbijeno, čeka potvrdu ili zatvoreno bez potvrde.
- Zatvaranje intervencije bez korisničke potvrde mora **zahtijevati komentar** koordinatora ili servisera.

---

### PBI-062 – Pauziranje intervencije zbog blokera

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 10

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **staviti intervenciju na čekanje kada ne mogu nastaviti rad bez korisnika, materijala ili vanjske potvrde**, kako bih **realno prikazao da zadatak nije završen, ali trenutno nije moguće nastaviti rad**.

> **Story 2 –** Kao **koordinator**, želim **vidjeti sve intervencije koje su na čekanju, razlog pauze i osobu odgovornu za nastavak**, kako bih **mogao aktivno pratiti blokere i spriječiti da intervencije nestanu iz operativnog fokusa**.

> **Story 3 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti obavijest ako je intervencija pauzirana zbog informacije ili radnje koju trebam dostaviti**, kako bih **znao šta se od mene očekuje**.

#### Poslovna vrijednost

Pauziranje intervencije daje strukturiran odgovor na blokere umjesto ostavljanja intervencije u lažnom aktivnom statusu, što povećava tačnost operativnog prikaza.

#### Veze i zavisnosti

- **Napomena:** Status čekanja je distinktivan od redovnih statusa i komentara

---

#### Acceptance Kriteriji

- Koordinator ili dodijeljeni serviser mora moći **pauzirati intervenciju** koja je u statusu Dodijeljeno ili U procesu.
- Pauziranje mora zahtijevati **razlog iz predefinisane liste**: čeka korisnika, čeka materijal, čeka vanjskog izvođača, čeka odobrenje, ostalo.
- Ako je razlog „ostalo", korisnik mora **unijeti dodatno tekstualno obrazloženje**.
- Intervencija na čekanju mora biti **posebno označena u listi** i ne smije se tretirati kao završena ili otkazana.
- Koordinator mora imati **pregled svih pauziranih intervencija** s datumom pauziranja, razlogom i odgovornom osobom.
- Sistem mora evidentirati **vrijeme pauziranja i nastavka rada** radi računanja ukupnog vremena čekanja.
- Ako je pauza vezana za korisnika, **korisnik mora dobiti in-app notifikaciju** s opisom šta se od njega očekuje.
- Svako pauziranje i nastavak mora biti **vidljivo u historiji intervencije i audit logu**.

---

## Backlog

---

### PBI-037 – Automatska raspodjela intervencija

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 4 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **da sistem automatski dodijeli novu intervenciju manje opterećenom serviseru**, kako bih **smanjio ručni posao dodjele i osigurao ravnomjernu distribuciju**.

> **Story 2 –** Kao **koordinator**, želim **moći ručno izmijeniti automatski dodijeljenog servisera bez ograničenja**, kako bih **zadržao punu kontrolu nad rasporedom u slučaju posebnih okolnosti**.

> **Story 3 –** Kao **administrator**, želim **moći aktivirati ili deaktivirati funkcionalnost automatske raspodjele iz konfiguracije sistema**, kako bih **prilagodio ponašanje sistema potrebama organizacije u različitim fazama rada**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-006 (Dodjela servisera)
- **Veza s:** PBI-012 (Notifikacije)

---

#### Acceptance Kriteriji

- Kada se kreira nova intervencija, sistem mora **automatski dodijeliti je serviseru s najmanjim brojem aktivnih intervencija**.
- Koordinator mora biti **jasno obaviješten da je dodjela automatski izvršena** (vizualna oznaka).
- Koordinator mora moći **ručno izmijeniti automatski dodijeljenog servisera** bez ograničenja.
- Serviser koji je automatski dobio intervenciju mora primiti **in-app notifikaciju** identičnu onoj pri ručnoj dodjeli.
- Sistem mora **evidentirati da je dodjela bila automatska** u historiji intervencije.
- Ako nema dostupnih servisera, **sistem ne smije blokirati kreiranje intervencije** – ostaje nedodijeljenom.
- Admin mora moći **aktivirati ili deaktivirati** automatsku raspodjelu iz konfiguracije.