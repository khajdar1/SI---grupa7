# Product Backlog – User Storiji i Acceptance Kriteriji

> **Projekt:** Sistem za upravljanje intervencijama
> **Verzija:** 2.0 

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

> **Story 2 –** Kao **administrator sistema**, želim **biti siguran da samoregistrirani korisnici automatski dobijaju samo osnovnu ulogu "Korisnik"**, kako bih **zadržao kontrolu nad privilegovanim pristupom i spriječio neovlašteno preuzimanje osjetljivih uloga**.

> **Story 3 –** Kao **administrator**, želim **da svaki novoregistrirani korisnik bude vezan za konkretnu firmu/organizaciju**, kako bih **osigurao da podaci ostanu segregirani između različitih organizacija u sistemu**.

#### Poslovna vrijednost

Samoregistracija smanjuje administrativni teret i ubrzava onboarding novih korisnika. Korisnik koji može sam kreirati račun u par minuta ima bolje korisničko iskustvo, a admin nije usko grlo za svaki novi pristup. Uloge osjetljivije od "Korisnik" (serviser, koordinator, admin, menadžment) i dalje dodjeljuje administrator, čime se zadržava kontrola nad privilegovanim pristupom.

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

- Na login stranici mora postojati **vidljiv link ili dugme "Registruj se"** koji otvara formu za registraciju.
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

> **Story 2 –** Kao **korisnik na dijeljenom uređaju**, želim **da se moja sesija automatski prekine nakon perioda neaktivnosti i da se ne mogu koristiti dugme "Nazad" nakon odjave**, kako bih **spriječio neovlašteni pristup svom računu**.

> **Story 3 –** Kao **administrator**, želim **da deaktivirani korisnički računi ne mogu pristupiti sistemu**, kako bih **osigurao da bivši zaposlenici ili suspendirani korisnici izgube pristup odmah nakon deaktivacije**.

#### Poslovna vrijednost

Login je kapija cijelog sistema. Bez sigurne autentifikacije, osjetljivi podaci o intervencijama, korisnicima i lokacijama bili bi izloženi. Upravljanje sesijom osigurava da korisnik ostane prijavljen samo onoliko dugo koliko je sigurno, a odjava sprječava zloupotrebe na dijeljenim uređajima.

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
- Kada korisnik klikne "Odjavi se", **sesija mora biti odmah prekinuta** i korisnik preusmjeren na login stranicu.
- Nakon odjave, **korisnik ne smije moći pristupiti prethodnim stranicama** putem dugmeta "Nazad" u pregledniku.
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

- **Preduvjet za:** PBI-004 (Planiranje intervencija), PBI-025 (Detekcija duplikata)
- **Zavisi od:** –

---

#### Acceptance Kriteriji

- Kada korisnik otvori obrazac, **mora vidjeti polja**: lokacija, opis problema i kategorija usluge.
- Sistem mora **omogućiti dodavanje slika ili dokumenata** (attachment) uz prijavu.
- Korisnik bira firmu iz unaprijed definisane liste **(dropdown)**, bez ručnog unosa.
- Sistem mora omogućiti **automatsko popunjavanje lokacije** korisnika ili uređaja.
- Ako korisnik ne popuni obavezna polja, **sistem ne smije kreirati intervenciju** i mora označiti koje polje nedostaje.
- Kada korisnik uspješno pošalje obrazac, **sistem mora automatski kreirati novu intervenciju** i prikazati potvrdu o prijemu (npr. broj intervencije).
- **Neprijavljeni korisnik mora moći prijaviti kvar** bez registracije.
- Kreirana intervencija mora biti **odmah vidljiva koordinatoru** u listi aktivnih intervencija.
- Sistem mora dozvoliti upload **najmanje jedne slike ili dokumenta** uz svaku prijavu.
- Sistem mora ponuditi listu **predefinisanih hitnih intervencija**, a korisnik mora imati mogućnost dodatnog unosa opisa.


---

### PBI-024 – Validacija unosa podataka

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **korisnik koji popunjava formu**, želim **vidjeti jasne poruke greške direktno uz svako polje koje sam pogrešno popunio**, kako bih **brzo razumio šta trebam ispraviti bez pogađanja**.

> **Story 2 –** Kao **sistem**, moram **validirati sve korisničke unose i na serverskoj strani, te spriječiti SQL injection i XSS napade**, kako bih **zaštitio integritet baze podataka neovisno o tome da li je klijentska validacija zaobiđena**.

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

### PBI-025 – Detekcija duplikata prijave kvara

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **korisnik**, želim **biti upozoren ako sistema detektuje da sam nedavno prijavio sličan kvar na istoj lokaciji**, kako bih **svjesno odlučio da li zaista trebam kreirati novu prijavu ili provjeriti status postojeće**.

> **Story 2 –** Kao **koordinator**, želim **da sistem automatski upozorava korisnike pri potencijalnim duplikatima**, kako bih **smanjio broj lažnih duplikata u listi intervencija i uštedjeo vreme trijaže**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-003 (Prijava kvara)

---

#### Acceptance Kriteriji

- Kada korisnik pokuša prijaviti kvar, sistem mora **provjeriti postoji li slična prijava od istog korisnika** u definisanom vremenskom periodu, na osnovu lokacije i opisa.
- Ako sistem detektuje potencijalni duplikat, **mora prikazati upozorenje** s informacijom o sličnoj postojećoj prijavi.
- Korisnik mora moći **nastaviti s prijavom i pored upozorenja** – detekcija duplikata je upozorenje, ne blokada.
- Korisnik mora moći **odustati od prijave** i biti preusmjeren na detalje postojeće intervencije.
- Sistem ne smije prikazivati **lažna upozorenja za prijave na različitim lokacijama** ili s bitno različitim opisima.
- Ako je prethodna slična prijava u statusu "Završeno", **sistem ne smije je tretirati kao duplikat**.

 
---

### PBI-030 – Kategorije i tipovi kvarova

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 6 SP | **Sprint:** Backlog


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

#### Acceptance Kriteriji – Korisnički prikaz

- Kada korisnik otvori formu za prijavu kvara, **mora vidjeti padajući meni za odabir kategorije** (npr. Vodoinstalacije, Struja, Internet, Grijanje, Lift, Ostalo).
- Odabir kategorije mora biti **obavezno polje** – korisnik ne smije moći poslati prijavu bez odabrane kategorije.
- Sistem mora **prikazati odabranu kategoriju u detalju intervencije** vidljivu koordinatoru i serviseru.
- Sistem ne smije dozvoliti **unos slobodnog teksta umjesto odabira** iz predefinisane liste.
- Ako lista kategorija bude prazna, **sistem mora prikazati grešku** i spriječiti slanje obrasca.

#### Acceptance Kriteriji – Admin upravljanje kategorijama

- Admin mora imati pristup **listi svih kategorija** s informacijama: naziv, status (aktivna/neaktivna), datum kreiranja.
- Admin mora moći **kreirati novu kategoriju** unosom naziva i opcionog opisa.
- Sistem ne smije dozvoliti **kreiranje kategorije s već postojećim nazivom** – naziv mora biti jedinstven.
- Admin mora moći **urediti naziv i opis** postojeće aktivne kategorije.
- Admin mora moći **deaktivirati kategoriju** – deaktivirana se ne prikazuje pri novim prijavama.
- Admin mora moći **reaktivirati prethodno deaktiviranu kategoriju**.
- Deaktiviranje **ne smije retroaktivno uticati** na intervencije koje su prethodno evidentirane s tom kategorijom.
- Ako nema niti jedne aktivne kategorije, **sistem mora prikazati upozorenje adminu**.
- Svaka izmjena mora biti **zabilježena s imenom admina i vremenskom oznakom**.

#### Acceptance Kriteriji – Filtriranje

- Koordinator i menadžment moraju moći **filtrirati listu intervencija po kategoriji**.
- Kategorija mora biti **uključena u rezultate napredne pretrage** kao jedan od kriterija filtriranja.
  
---

## SPRINT 6

---

### PBI-004 – Planiranje intervencija

**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 5 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **kreirati i zakazati intervenciju na osnovu primljene prijave kvara**, kako bih **osigurao organiziran i pravovremen odgovor tima uz jasno definisan vremenski okvir**.

> **Story 2 –** Kao **koordinator**, želim **kreirati intervenciju i bez prethodno prijavljenog kvara**, kako bih **mogao planirati preventivna ili redovna održavanja koja nisu nastala kao reakcija na kvar korisnika**.

> **Story 3 –** Kao **koordinator**, želim **naknadno izmijeniti detalje intervencije dok je u statusu "Otvoreno" ili "U procesu"**, kako bih **mogao reagovati na promjenu okolnosti bez gubljenja historijata originalnog plana**.

#### Poslovna vrijednost

Planiranje intervencija je srž operativnog rada koordinatora. Bez ove funkcionalnosti, terenski tim nema strukturiran zadatak, a menadžment nema uvid u planove.

#### Pretpostavke i otvorena pitanja

- Otvoreno pitanje: Koji vremenski okvir se unosi – samo rok završetka ili i planirano vrijeme početka?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-005 (Prioritet i SLA), PBI-006 (Dodjela servisera), PBI-008 (Praćenje statusa)
- **Zavisi od:** PBI-003 (Prijava kvara), PBI-002 (Login)

---

#### Acceptance Kriteriji

- Koordinator mora imati mogućnost unosa: **naziv, opis, lokacija, vremenski okvir (datum početka i rok završetka) i veza na prijavu kvara**.
- Sistem mora **dozvoliti kreiranje intervencije i bez veze na prijavu kvara** (planirano održavanje).
- Ako koordinator ne unese obavezne podatke, **sistem ne smije sačuvati intervenciju** i mora označiti problematična polja.
- Kada koordinator sačuva intervenciju, **ona mora biti odmah vidljiva u listi aktivnih intervencija** s ispravnim statusom "Otvoreno".
- Sistem mora **prikazati vezu između intervencije i originalne prijave kvara** tamo gdje postoji.
- Koordinator mora moći **naknadno izmijeniti detalje intervencije** dok je status "Otvoreno" ili "U procesu".
- Svaka kreirana intervencija mora biti **evidentirana s vremenskom oznakom kreiranja** i korisničkim imenom koordinatora.

---

### PBI-005 – Prioritet intervencije, SLA i upozorenja o kašnjenju

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 6 SP | **Sprint:** 6


#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **dodijeliti i po potrebi izmijeniti prioritet svake intervencije**, kako bih **osigurao da terenski tim uvijek radi na najhitnijim zadacima i da lista intervencija bude smisleno rangirana**.

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

> **Story 2 –** Kao **koordinator**, želim **pri dodjeli intervencije vidjeti listu servisera sortiranu po broju aktivnih zadataka**, kako bih **lako prepoznao koji su serviseri trenutno manje opterećeni i mogli primiti novi zadatak bez kompromitiranja tekućih**.

> **Story 3 –** Kao **koordinator**, želim **moći izmijeniti ili ukloniti dodijeljenog servisera i nakon što je dodjela izvršena**, kako bih **mogao reagovati na iznenadnu nedostupnost servisera ili promjenu prioriteta bez kreiranja nove intervencije**.

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

> **Story 1 –** Kao **koordinator**, želim **pregledati sve aktivne intervencije rangirane po prioritetu i filtrirane po statusu, tipu ili dodjeljnosti**, kako bih **u svakom trenutku imao jasnu sliku aktuelnog stanja na terenu i znao gdje je potrebna moja pažnja**.

> **Story 2 –** Kao **menadžment**, želim **pregledati aktivne intervencije bez mogućnosti izmjene**, kako bih **imao ažuran uvid u operativno stanje bez rizika od slučajnih izmjena podataka**.

> **Story 3 –** Kao **koordinator**, želim **kombinovati više filtera istovremeno (status + tip + dodjeljeni serviser)**, kako bih **brzo suzio pregled na samo one intervencije koje zahtijevaju moju pažnju u datom trenutku**.

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

### PBI-008 – Praćenje i izmjena statusa intervencije

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 8 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **mijenjati status intervencije i imati pregled kompletne historije svih promjena statusa**, kako bih **osigurao da svi dionici u realnom vremenu znaju gdje se intervencija nalazi u procesu rješavanja i imao revizijsku evidenciju**.

> **Story 2 –** Kao **serviser**, želim **promijeniti status intervencije koja mi je dodijeljena (npr. s "Otvoreno" na "U procesu")**, kako bih **obavijestio koordinatora da sam počeo raditi na zadatku bez potrebe za telefonskim pozivom**.

> **Story 3 –** Kao **sistem**, moram **spriječiti promjenu statusa koja nije u predefinisanom smjeru i onemogućiti izmjenu statusa završenih intervencija bez admin ovlasti**, kako bih **zaštitio integritet toka rada i historijata**.

#### Poslovna vrijednost

Praćenje statusa je temeljni mehanizam transparentnosti. Bez njega, koordinator ne zna da li je serviser počeo s radom, a menadžment ne može pratiti napredak. Revizijska evidencija je neprocjenjiva u slučaju sporova ili analize efikasnosti.

#### Pretpostavke i otvorena pitanja

- Moguće vrijednosti statusa: Otvoreno → U procesu → Završeno.
- Otvoreno pitanje: Da li postoji status "Na čekanju"?
- Otvoreno pitanje: Može li serviser promijeniti status u "Završeno" ili je to isključivo koordinatorova akcija?

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje), PBI-006 (Dodjela)
- **Preduvjet za:** PBI-010 (Izvještaj o intervenciji)

---

#### Acceptance Kriteriji

- Koordinator ili serviser koji otvori detalje intervencije **mora vidjeti trenutni status i imati mogućnost izmjene**.
- Sistem mora **dozvoliti promjenu statusa samo u predefinisanom smjeru**: Otvoreno → U procesu → Završeno ili Otvoreno → Otkazano (nije moguće preskočiti status).
- Svaka promjena statusa mora biti **automatski zabilježena u historiji** s: imenom korisnika, datumom i tačnim vremenom.
- Koordinator mora imati **pregled kompletne historije promjena statusa** unutar detalja intervencije.
- Sistem ne smije dozvoliti **promjenu statusa Završene intervencije** bez posebnih administratorskih ovlasti.
- Kada se status promijeni, **lista aktivnih intervencija mora odražavati novu vrijednost** bez potrebe za ručnim osvježavanjem (ili uz jasno vidljivo dugme za osvježavanje).
- Korisnik treba dobiti **vizualnu potvrdu** da je promjena statusa uspješno sačuvana.

---

### PBI-009 – Pregled zadataka servisera

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **na jednom mjestu vidjeti sve intervencije koje su mi dodijeljene, sortirane po prioritetu**, kako bih **znao koji zadaci me čekaju i po kom redu ih trebam obaviti**.

> **Story 2 –** Kao **serviser**, želim **otvoriti detalj dodijeljene intervencije i vidjeti opis kvara, lokaciju, priložene dokumente i komentare**, kako bih **imao sve potrebne informacije na jednom ekranu bez komunikacije s koordinatorom**.

> **Story 3 –** Kao **serviser**, želim **biti siguran da ne mogu ni slučajno vidjeti ili izmijeniti intervencije koje mi nisu dodijeljene**, kako bih **radio u jasno definisanom opsegu odgovornosti**.

#### Poslovna vrijednost

Personalizovana lista zadataka osigurava fokus, smanjuje greške i pruža terenskom djelatniku sve informacije na jednom ekranu bez gubljenja vremena na komunikaciju s koordinatorom.

#### Pretpostavke i otvorena pitanja

- Serviser vidi samo intervencije koje su mu eksplicitno dodijeljene.
- Otvoreno pitanje: Da li serviser vidi i intervencije s timskom dodjelom?

#### Veze i zavisnosti

- **Zavisi od:** PBI-006 (Dodjela servisera)
- **Veza s:** PBI-010 (Izvještaj), PBI-008 (Izmjena statusa), PBI-012 (Notifikacije)

---

#### Acceptance Kriteriji

- Sistem mora prikazati **isključivo intervencije dodijeljene serviseru** – ne smije prikazivati intervencije drugih servisera.
- Za svaku intervenciju, serviser mora vidjeti **minimalno**: naziv, lokaciju, opis kvara, prioritet i rok završetka.
- Lista zadataka mora biti **sortirana po prioritetu** (hitan zadatak uvijek na vrhu).
- Serviser mora moći **otvoriti detalj svake intervencije** i vidjeti potpuni opis, dokumente i komentare.
- Sistem ne smije prikazivati **intervencije sa statusom "Završeno"** u aktivnoj listi (ili ih jasno vizualno odvojiti).
- Serviser ne smije imati mogućnost **pristupa niti izmjene intervencija koje mu nisu dodijeljene**.
- Ako serviser nema dodijeljenih intervencija, **sistem mora prikazati jasnu poruku** (npr. "Trenutno nemate dodijeljenih zadataka").

---

### PBI-013 – Upravljanje korisničkim računima (Admin)

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 8 SP | **Sprint:** 6

#### User Storiji

> **Story 1 –** Kao **administrator sistema**, želim **kreirati nove korisničke račune i izmijeniti postojeće podatke (ime, email, uloga, firma)**, kako bih **osigurao da sistem uvijek odražava stvarno stanje organizacije**.

> **Story 2 –** Kao **administrator sistema**, želim **deaktivirati korisnički račun bez brisanja i naknadno ga reaktivirati**, kako bih **osigurao da bivši zaposlenici odmah izgube pristup, ali historijat njihovog rada ostane sačuvan u sistemu**.

> **Story 3 –** Kao **sistem**, moram **spriječiti brisanje korisnika koji ima vezane aktivne intervencije i spriječiti admina da deaktivira vlastiti račun**, kako bih **zaštitio integritet podataka i spriječio slučajno zaključavanje sistema**.

#### Poslovna vrijednost

Admin panel je osnova sigurnosti i organizacione kontrole. Kad zaposlenik napusti organizaciju, admin mora moći odmah deaktivirati njegov račun.

#### Pretpostavke i otvorena pitanja

- RBAC (Role-Based Access Control) je uključen u ovaj PBI.
- Otvoreno pitanje: Da li admin može resetovati lozinku korisniku direktno ili samo korisnik putem email linka (PBI-015)?
- Otvoreno pitanje: Da li postoji log aktivnosti po korisniku za audit?

#### Veze i zavisnosti

- **Zavisi od:** PBI-001 (Registracija), PBI-002 (Login)
- **Veza s:** PBI-015 (Profil i reset lozinke)

---

#### Acceptance Kriteriji

- Admin mora imati pristup **listi svih korisničkih računa** s informacijama: ime, korisničko ime, email, uloga, status.
- Admin mora moći **izmijeniti podatke postojećeg korisnika**: ime, email, ulogu.
- Admin mora moći **deaktivirati korisnički račun** bez brisanja – deaktiviran korisnik ne smije se moći prijaviti.
- Admin mora moći **reaktivirati prethodno deaktiviran račun**.
- Admin mora moći **promijeniti ulogu korisnika** i ta promjena mora biti odmah aktivna.
- Sistem ne smije dozvoliti **brisanje korisnika koji ima vezane aktivne intervencije**.
- Admin ne smije moći **deaktivirati vlastiti račun**.
- Svaka izmjena u korisničkim računima mora biti **zabilježena u audit logu**.
- Admin pri kreiranju ili uređivanju korisnika **dodjeljuje firmu** kojoj korisnik pripada.

---

### PBI-015 – Upravljanje korisničkim profilom i reset lozinke

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 4 SP | **Sprint:** 6


#### User Storiji

> **Story 1 –** Kao **prijavljeni korisnik**, želim **moći pregledati i ažurirati vlastite kontaktne podatke**, kako bih **osigurao da su moji podaci u sistemu uvijek tačni**.

> **Story 2 –** Kao **prijavljeni korisnik**, želim **moći promijeniti lozinku unosom trenutne i nove lozinke**, kako bih **osigurao sigurnost svog računa u slučaju sumnje na kompromitovanje**.

> **Story 3 –** Kao **registrirani korisnik koji nije prijavljen**, želim **zatražiti reset lozinke putem emaila**, kako bih **povratio pristup računu bez potrebe za kontaktiranjem administratora**.

#### Poslovna vrijednost

Svaki korisnik treba autonomiju nad vlastitim osnovnim podacima. Reset lozinke je standardna sigurnosna funkcionalnost bez koje svaki zaboravljeni password zahtijeva intervenciju admina.

#### Pretpostavke i otvorena pitanja

- Korisnik ne može sam promijeniti svoju ulogu.
- Proces reseta: korisnik unosi email → dobija link → otvori link → postavi novu lozinku.
- Otvoreno pitanje: Koliko dugo je reset link važeći?
- Otvoreno pitanje: Da li promjena emaila zahtijeva verifikaciju?

#### Veze i zavisnosti

- **Zavisi od:** PBI-002 (Login)
- **Veza s:** PBI-013 (Admin upravljanje računima)

---

#### Acceptance Kriteriji – Upravljanje profilom

- Svaki prijavljeni korisnik mora imati pristup **stranici Moj profil** s prikazom: ime, prezime, korisničko ime, email adresa.
- Korisnik mora moći **izmijeniti ime, prezime i email adresu** i sačuvati promjene.
- Korisnik mora moći **promijeniti lozinku** unosom trenutne lozinke, a zatim nove (s potvrdom).
- Ako korisnik unese **netačnu trenutnu lozinku**, sistem mora prikazati grešku i odbiti promjenu.
- Sistem ne smije dozvoliti korisniku da **promijeni vlastitu ulogu**.
- Korisnik treba dobiti **jasnu vizualnu potvrdu** da su promjene uspješno sačuvane.
- Promjena lozinke ne smije **odjaviti korisnika** iz aktivne sesije, ali ne smije ni ostaviti staru lozinku aktivnom.

#### Acceptance Kriteriji – Reset lozinke

- Korisnik mora moći pristupiti **formi za reset lozinke s login stranice** (link "Zaboravili ste lozinku?").
- Kada korisnik unese registrovani email, **sistem mora poslati email s linkom za reset**.
- Ako korisnik unese email koji ne postoji, **sistem ne smije otkriti** postoji li taj email – prikazuje istu neutralnu poruku.
- Reset link mora biti **jednokratan i vremenski ograničen** – nakon upotrebe ili isteka roka, link ne smije biti ponovo upotrebljiv.
- Kada korisnik unese novu lozinku s potvrdom, **sistem mora sačuvati novu lozinku** i invalidirati sve prethodne aktivne sesije.
- Korisnik treba dobiti **potvrdu da je lozinka uspješno resetovana** i biti preusmjeren na login.
- Sistem ne smije dozvoliti **reset lozinke za deaktiviran korisnički račun**.

---

## SPRINT 7

---

### PBI-010 – Evidencija izvještaja o intervenciji

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** 7

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **po završetku intervencije dokumentirati šta sam uradio i koji materijal sam koristio**, kako bih **ostavio trajnu evidenciju obavljenog rada koja služi koordinatoru, menadžmentu i budućim servisima na istoj lokaciji**.

> **Story 2 –** Kao **koordinator ili administrator**, želim **pregledati izvještaj servisera unutar detalja intervencije**, kako bih **imao kompletan uvid u obavljeni rad i mogao potvrditi da je intervencija zaista završena prema planu**.

> **Story 3 –** Kao **sistem**, moram **spriječiti unos izvještaja ako intervencija još nije započeta i ne prikazivati polje za troškove u MVP-u**, kako bih **osigurao integritet podataka i opseg MVP verzije**.

#### Poslovna vrijednost

Izvještaj o intervenciji je osnova za historiju održavanja i odgovornost servisera za obavljeni rad. Bez dokumentacije, organizacija gubi institucijsku memoriju o tome šta je urađeno, kada i s kojim materijalima.

#### Pretpostavke i otvorena pitanja

- Obračun troškova nije u MVP scopeu.
- Otvoreno pitanje: Da li izvještaj može biti izmijenjen nakon što je sačuvan?
- Otvoreno pitanje: Može li koordinator ili admin urediti izvještaj servisera?

#### Veze i zavisnosti

- **Zavisi od:** PBI-008 (Status intervencije), PBI-009 (Pregled zadataka)
- **Veza s:** PBI-011 (Historija intervencija), PBI-023 (Export)

---

#### Acceptance Kriteriji

- Serviser mora imati **formu za unos izvještaja** s poljima: opis obavljenih radova, utrošeni materijal, napomene.
- Sistem mora **vezati izvještaj za konkretnu intervenciju** – nije moguće kreirati izvještaj koji nije vezan za postojeću intervenciju.
- Kada serviser sačuva izvještaj, **sistem mora zabilježiti** ime servisera, datum i tačno vrijeme čuvanja.
- Koordinator i admin moraju moći **pregledati izvještaj** unutar detalja intervencije.
- Sistem mora dozvoliti **dodavanje izvještaja dok je intervencija u statusu "U procesu" ili "Završeno"**.
- Sistem ne smije dozvoliti unos izvještaja **ako intervencija nije započeta**.
- Obračun troškova **ne smije biti dio forme u MVP-u**.
- Korisnik treba dobiti **potvrdu o uspješnom čuvanju** izvještaja.

---

### PBI-011 – Historija intervencija po lokaciji/uređaju

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 3 SP | **Sprint:** 7

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **pregledati sve prethodne intervencije na određenoj lokaciji ili uređaju**, kako bih **razumio historijat problema na tom mjestu i donio bolju odluku o pristupu rješavanju**.

> **Story 2 –** Kao **serviser**, želim **na terenu brzo provjeriti da li je isti kvar na ovoj lokaciji bio prijavljen ranije i šta je tada urađeno**, kako bih **fokusirao istragu na sistemski uzrok, a ne površinski simptom**.

#### Poslovna vrijednost

Historija lokacije/uređaja sprječava ponavljanje istih grešaka i ubrzava dijagnozu. Ovo je osnovna historija bez grafičkih prikaza (grafički prikazi van MVP scope).

#### Pretpostavke i otvorena pitanja

- Prikaz je tabularni/tekstualni – bez grafova.
- Otvoreno pitanje: Kako se definiše "isti uređaj" ili "ista lokacija"? Po adresi, koordinatama, ID-u uređaja?

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje – lokacija)
- **Veza s:** PBI-017 (Napredna pretraga), PBI-026 (Arhiviranje)

---

#### Acceptance Kriteriji

- Koordinator ili serviser mogu **filtrirati historiju intervencija prema lokaciji ili uređaju**.
- Za svaku intervenciju u historiji, sistem mora prikazati **minimalno**: datum, status, sažetak opisa, ime servisera i prioritet.
- Historija mora biti **sortirana od najnovije prema najstarijoj** intervenciji.
- Sistem mora prikazati historiju **samo za završene i arhivirane intervencije**.
- Ako za odabranu lokaciju/uređaj nema prethodnih intervencija, **sistem mora prikazati jasnu poruku**.
- Grafički prikazi i vizualizacije **ne smiju biti implementirani** u MVP verziji.
- Korisnik treba moći **kliknuti na svaku intervenciju u historiji** i otvoriti njene detalje.


---

### PBI-016 – Komentari intervencije

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 3 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **dodati tekstualni komentar na intervenciju**, kako bih **ostavio važne napomene ili pojašnjenja koja se ne uklapaju u standardna polja forme**.

> **Story 2 –** Kao **serviser**, želim **komentarom prijaviti kašnjenje ili neočekivanu komplikaciju na terenu**, kako bih **koordinatoru dao ažurnu informaciju bez telefonskog poziva, a napomena ostala trajno vezana za intervenciju**.

#### Veze i zavisnosti

- **Veza s:** PBI-012 (Notifikacije), PBI-010 (Izvještaj)

---

#### Acceptance Kriteriji

- Koordinator i serviser moraju imati **formu za unos komentara** unutar detalja intervencije.
- Svaki komentar mora biti **prikazan s imenom autora, datumom i tačnim vremenom** objave.
- Komentari moraju biti **sortirani kronološki** – konzistentno kroz cijeli sistem.
- Sistem ne smije dozvoliti **prazne komentare** – minimalno jedan karakter.
- Korisnik koji nije koordinator ni serviser **ne smije moći dodavati komentare**.
- Svi komentari moraju ostati **trajno vidljivi** i ne smiju biti automatski brisani.

---

### PBI-017 – Napredna pretraga

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** Backlog

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

### PBI-033 – Pregled i upravljanje attachmentima

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** Backlog

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

## SPRINT 8

---

### PBI-012 – Notifikacije

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 8 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **serviser**, želim **primiti in-app notifikaciju čim mi je dodijeljen novi zadatak**, kako bih **mogao pravovremeno reagirati bez stalnog ručnog provjeravanja sistema**.

> **Story 2 –** Kao **koordinator**, želim **biti obaviješten čim korisnik prijavi novi kvar**, kako bih **mogao odmah kreirati intervenciju i reagovati bez kašnjenja**.

> **Story 3 –** Kao **bilo koji korisnik sistema**, želim **klikom na notifikaciju biti direktno preusmjeren na relevantnu intervenciju i vidjeti broj nepročitanih obavijesti u navigaciji**, kako bih **imao brz pristup važnim informacijama**.

#### Poslovna vrijednost

Notifikacije pretvaraju pasivni sistem u aktivan – direktno skraćuju vrijeme reakcije i smanjuju rizik od propuštenih hitnih intervencija.

#### Pretpostavke i otvorena pitanja

- MVP obuhvata: notifikaciju servisera pri dodjeli + notifikaciju koordinatora pri novoj prijavi.
- Notifikacije su in-app obavijesti unutar sistema.
- Otvoreno pitanje: Da li korisnik može isključiti notifikacije?

#### Veze i zavisnosti

- **Zavisi od:** PBI-003 (Prijava kvara), PBI-006 (Dodjela servisera)
- **Veza s:** PBI-029 integrisan u PBI-027 (Tiket sistem)

---

#### Acceptance Kriteriji

- Kada koordinator dodijeli intervenciju serviseru, **serviser mora primiti notifikaciju** u realnom ili gotovo realnom vremenu.
- Notifikacija serviseru mora sadržavati **minimalno**: naziv intervencije, prioritet i lokaciju.
- Kada korisnik prijavi novi kvar, **koordinator mora primiti notifikaciju** o novoj prijavi.
- Notifikacija koordinatoru mora sadržavati **minimalno**: datum/vrijeme prijave i lokaciju kvara.
- Korisnik treba moći **kliknuti na notifikaciju i biti direktno preusmjeren** na relevantnu intervenciju.
- Sistem mora prikazati **broj nepročitanih notifikacija** vidljivo u navigaciji (badge/brojač).
- Automatski podsjetnici za redovne preglede **ne smiju biti implementirani** u MVP-u.

---

### PBI-014 – Menadžment dashboard

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** 8

#### User Storiji

> **Story 1 –** Kao **menadžment**, želim **na jednom ekranu vidjeti broj aktivnih i završenih intervencija te distribuciju po prioritetu**, kako bih **mogao donijeti informirane odluke o raspodjeli resursa bez ručnog prebrojavanja**.

> **Story 2 –** Kao **menadžment**, želim **vidjeti prosječno vrijeme rješavanja intervencija**, kako bih **mogao objektivno procijeniti efikasnost tima i identificirati problematična područja**.

> **Story 3 –** Kao **sistem**, moram **ograničiti pristup dashboardu isključivo na uloge Menadžment i Admin**, kako bih **spriječio da serviseri imaju uvid u ukupne operativne podatke organizacije**.

#### Poslovna vrijednost

Dashboard transformiše sirove podatke u poslovnu inteligenciju. Samo tabelarni/numerički prikaz; grafički prikazi van MVP.

#### Pretpostavke i otvorena pitanja

- Otvoreno pitanje: Da li se podaci osvježavaju u realnom vremenu ili jednom dnevno?
- Otvoreno pitanje: Da li menadžment može filtrirati dashboard po vremenskom periodu?

#### Veze i zavisnosti

- **Zavisi od:** PBI-008 (Status), PBI-005 (Prioritet)
- **Veza s:** PBI-023 (Export)

---

#### Acceptance Kriteriji

- Dashboard mora prikazivati **broj aktivnih intervencija** (Otvoreno + U procesu).
- Dashboard mora prikazivati **broj završenih intervencija** u tekućem periodu.
- Dashboard mora prikazivati **prosječno vrijeme rješavanja** (od kreiranja do statusa "Završeno").
- Dashboard mora prikazivati **distribuciju intervencija po prioritetu** u tabelarnom formatu.
- Grafički prikazi **ne smiju biti implementirani** u MVP verziji.
- Pristup dashboardu mora biti **ograničen na uloge: Menadžment i Admin**.
- Svi podaci moraju biti **tačni i konzistentni** s podacima u listi intervencija.

---

### PBI-020 – Kalendarski prikaz intervencija

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **pregledati planirane intervencije u kalendarskom prikazu po danima i sedmicama**, kako bih **imao vizualni uvid u raspoređenost obaveza i brzo identificirao preopterećene periode**.

> **Story 2 –** Kao **koordinator**, želim **jednostavno prebaciti između listnog i kalendarskog prikaza i kliknuti na intervenciju u kalendaru da direktno otvorim njen detalj**, kako bih **zadržao kontekst rada bez gubitka produktivnosti pri prelasku između prikaza**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje – vremenski okvir), PBI-022 (Planirano održavanje)
  
---

#### Acceptance Kriteriji

- Koordinator mora moći **prebaciti se između listnog i kalendarskog prikaza**.
- Kalendar mora prikazivati **dnevni, sedmični i/ili mjesečni prikaz** (minimalno jedan).
- Svaka intervencija mora biti **prikazana na datumu koji odgovara planiranom roku ili datumu početka**.
- Klik na intervenciju u kalendaru mora **otvoriti detalj te intervencije**.
- Sistem mora **vizualno razlikovati intervencije po prioritetu** u kalendarskom prikazu.
- Intervencije bez definisanog datuma **ne smiju biti prikazane** u kalendarskom prikazu.


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

### PBI-029 – Planirana/preventivna održavanja

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 8 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **kreirati intervenciju za planirano preventivno održavanje i definisati periodičnost ponavljanja**, kako bih **osigurao da redovni servisi budu automatski zakazani bez potrebe za ručnim kreiranjem svaki put**.

> **Story 2 –** Kao **koordinator**, želim **izmijeniti ili zaustaviti seriju ponavljanja bez utjecaja na već kreirane instance**, kako bih **mogao prilagoditi raspored bez gubitka historijata prethodno obavljenih servisa**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje intervencija)
- **Veza s:** PBI-018 (Kalendarski prikaz)

---

#### Acceptance Kriteriji

- Koordinator mora moći **kreirati intervenciju bez prijave kvara** i označiti je kao "Planirano održavanje".
- Koordinator mora moći **definisati periodičnost**: minimalno dnevno, sedmično i mjesečno ponavljanje.
- Sistem mora **automatski generisati novu intervenciju** prema definisanom rasporedu.
- Automatski generirane intervencije moraju biti **identične originalu** (isti naziv, lokacija, opis, prioritet) osim datuma.
- Koordinator mora moći **izmijeniti ili zaustaviti ponavljanje** bez utjecaja na već kreirane instance.
- Svaka automatski generisana intervencija mora biti **prikazana u listi aktivnih intervencija** kao normalna intervencija.

---

### PBI-027 – Sistem tiketa za korisničku podršku

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 8 SP | **Sprint:** Backlog


#### User Storiji

> **Story 1 –** Kao **registrirani korisnik**, želim **kreirati tiket za korisničku podršku kako bih postavio pitanje ili prijavio problem u aplikaciji**, kako bih **dobio zvanični i praćeni odgovor umjesto da problem ostane neriješen**.

> **Story 2 –** Kao **korisnik ili agent podrške**, želim **razmjenjivati poruke unutar otvorenog tiketa**, kako bih **vodio strukturisan dijalog o problemu na jednom mjestu bez potrebe za emailom**.

> **Story 3 –** Kao **korisnik**, želim **primiti in-app obavijest kada agent odgovori na moj tiket**, a kao **agent podrške**, želim **biti obaviješten kada stigne novi tiket ili odgovor**, kako bih **mogli pravovremeno reagirati bez stalnog provjeravanja sistema**.

#### Poslovna vrijednost

Tiketi za podršku su odvojen kanal od intervencija – tiču se problema s aplikacijom, ne terenskih kvarova. Komunikacija unutar tiketa čuva kompletan historijat razgovora, a notifikacije smanjuju latenciju odgovora.

#### Pretpostavke i otvorena pitanja

- Tiketi za podršku su odvojeni od prijava kvarova i ne generišu intervencije.
- Otvoreno pitanje: Ko je agent podrške – posebna uloga ili admin?
- Otvoreno pitanje: Da li se tiket automatski zatvara ako korisnik ne odgovori u određenom roku?
- Otvoreno pitanje: Da li su notifikacije za tikete odvojene od operativnih notifikacija?

#### Veze i zavisnosti

- **Odvojen od:** PBI-003 (Prijava kvara)
- **Veza s:** PBI-012 (Operativne notifikacije)

---

#### Acceptance Kriteriji – Kreiranje tiketa

- Prijavljeni korisnik mora imati pristup **formi za kreiranje tiketa** s poljima: naslov, opis problema i kategorija upita.
- Kategorije upita moraju biti **predefinisane** (minimalno: Tehničko pitanje, Prijava greške u aplikaciji, Ostalo).
- Kada korisnik sačuva tiket, **sistem mora kreirati tiket s jedinstvenim ID-om** i statusom "Otvoren".
- Korisnik mora moći **pregledati sve vlastite tikete** i njihov status.
- Sistem ne smije **prikazivati tikete jednog korisnika drugom** (osim agentu podrške).
- Tiket **ne smije kreirati intervenciju** u sistemu za upravljanje kvarovima.
- Kreiranje tiketa mora biti **dostupno isključivo prijavljenim korisnicima**.

#### Acceptance Kriteriji – Komunikacija na tiketu

- Korisnik i agent moraju imati **formu za slanje tekstualnih poruka** unutar tiketa.
- Svaka poruka mora biti **prikazana s imenom pošiljaoca, datumom i tačnim vremenom** slanja.
- Poruke moraju biti **sortirane kronološki** unutar tiketa.
- Sistem ne smije dozvoliti **slanje prazne poruke**.
- Korisnik mora moći **vidjeti samo vlastite tikete i razgovore**.
- Nakon što agent označi tiket kao "Zatvoren", **obe strane trebaju vidjeti tu promjenu** i sistem treba spriječiti daljnje slanje poruka.

#### Acceptance Kriteriji – Notifikacije za tikete

- Kada agent odgovori na tiket, **korisnik mora primiti in-app notifikaciju**.
- Kada korisnik kreira novi tiket ili odgovori, **agent podrške mora primiti in-app notifikaciju**.
- Svaka notifikacija mora sadržavati **ID tiketa i kratki sažetak**.
- Klik na notifikaciju mora **direktno otvoriti odgovarajući tiket**.
- Sistem mora prikazati **broj nepročitanih notifikacija i za tikete** u navigaciji.
- Korisnik ne smije primati **notifikacije za tuđe tikete**.

---

### PBI-036 – Feedback korisnika po završetku intervencije

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti mogućnost da ocijenim intervenciju nakon što budem obaviješten o njenom završetku**, kako bih **dao povratnu informaciju o kvaliteti usluge**.

> **Story 2 –** Kao **koordinator ili administrator**, želim **pregledati feedback korisnika vezan za konkretnu intervenciju**, kako bih **identifikovao slabe tačke u procesu i pratio trendove kvalitete usluge**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-008 (Status "Završeno"), PBI-012 (Notifikacije)
- **Veza s:** PBI-014 (Menadžment dashboard)

---

#### Acceptance Kriteriji

- Kada intervencija prijeđe u status "Završeno", korisnik mora dobiti **in-app obavijest s pozivom na feedback**.
- Korisnik mora moći **ostaviti ocjenu** (minimalno: potvrda rješenja ili numerička ocjena 1–5).
- Korisnik mora imati mogućnost **dodavanja opcionog tekstualnog komentara** uz ocjenu.
- Feedback mora biti **moguće ostaviti samo jednom** po intervenciji.
- Ako korisnik ne ostavi feedback, **sistem ne smije blokirati niti podsjetiti više od jednom**.
- Koordinator i admin moraju moći **pregledati feedback** vezan za konkretnu intervenciju.
- Sistem ne smije **prikazivati feedback jednog korisnika drugom korisniku** koji nije koordinator ili admin.
  
---

## Sprint 10

---

### PBI-023 – Export podataka

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 5 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator ili menadžment**, želim **eksportovati listu intervencija u PDF format**, kako bih **ih mogao arhivirati ili podijeliti s vanjskim dionicima van sistema**.

> **Story 2 –** Kao **sistem**, moram **pri generisanju PDF-a prikazivati samo podatke kojima korisnik ima pristup na osnovu uloge**, kako bih **spriječio nenamjerno otkrivanje podataka u exportovanim dokumentima**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-007 (Lista intervencija), PBI-010 (Izvještaj)
- **Veza s:** PBI-014 (Dashboard)

---

#### Acceptance Kriteriji

- Koordinator i menadžment moraju imati **opciju exporta liste intervencija u PDF**.
- Export mora sadržavati **minimalno**: naziv, prioritet, status, lokaciju, dodjeljenog servisera i datum svake intervencije.
- PDF dokument mora biti **čitljiv, urednog izgleda** s jasnim zaglavljem (naziv sistema i datum generisanja).
- Sistem mora generisati PDF **u razumnom vremenu** (npr. za listu od 100 intervencija ne dulje od 30 sekundi).
- Sistem ne smije exportovati **podatke kojima korisnik nema pristup** na osnovu uloge.
- Export u Excel/CSV format **ne smije biti implementiran** u MVP-u.

---

### PBI-031 – Višejezična podrška

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 5 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **korisnik sistema**, želim **moći odabrati jezik prikaza interfejsa u postavkama profila**, kako bih **koristio sistem na jeziku koji mi je najrazumljiviji**.

> **Story 2 –** Kao **sistem**, moram **prikazivati sve elemente sučelja (navigacija, dugmad, poruke grešaka, labele) na odabranom jeziku bez miješanja**, kako bih **osigurao koherentno korisničko iskustvo bez parcijalni prijevoda**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-015 (Upravljanje korisničkim profilom)

---

#### Acceptance Kriteriji

- Svaki prijavljeni korisnik mora imati **mogućnost odabira jezika** iz liste podržanih jezika.
- Nakon odabira i čuvanja, **sučelje mora biti prikazano na odabranom jeziku** pri svakom narednom loginu.
- Promjena jezika mora se **primijeniti odmah** ili nakon osvježavanja stranice.
- Sistem mora **zapamtiti odabrani jezik** po korisničkom računu, ne samo po sesiji.
- Svi elementi sučelja moraju biti **prevedeni na odabrani jezik** – parcijalni prijevodi nisu prihvatljivi.
- Sistem ne smije **prikazivati miješane jezike** na istoj stranici.
- Ako prijevod za određeni element nedostaje, **sistem mora prikazati fallback vrijednost** (npr. engleski) umjesto praznog polja.


---

### PBI-034 – Geografski/mapski prikaz intervencija

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 4 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **pregledati intervencije prikazane na interaktivnoj mapi prema njihovoj lokaciji**, kako bih **dobio prostorni uvid u distribuciju zadataka i identifikovao koncentracije kvarova**.

> **Story 2 –** Kao **koordinator**, želim **filtrirati prikazane intervencije na mapi po statusu i dodjeljenom serviseru**, kako bih **fokusirao mapski pregled samo na relevantni podskup intervencija**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje – definisanje lokacije), PBI-007 (Lista intervencija)
- **Veza s:** PBI-018 (Kalendarski prikaz)

---

#### Acceptance Kriteriji

- Koordinator mora imati mogućnost **prebacivanja između listnog i mapskog prikaza**.
- Svaka intervencija s definisanom lokacijom mora biti **prikazana kao marker na mapi**.
- Klik na marker mora **otvoriti sažetak intervencije** (naziv, prioritet, status, serviser) bez napuštanja mapskog prikaza.
- Markeri moraju biti **vizualno razlikovani po prioritetu** (npr. boja: crvena = Hitan).
- Koordinator mora moći **filtrirati prikazane intervencije po statusu i/ili serviseru**.
- Intervencije **bez definisane lokacije ne smiju biti prikazane** na mapi.
- Mapa mora podržavati **zoom in/out i pomicanje (pan)**.
- Mapski prikaz **ne smije prikazivati arhivirane intervencije** po defaultu.
  
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

---

### PBI-038 – Masovne akcije na intervencijama

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 4 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **istovremeno izvršiti istu akciju (promjena statusa, dodjela servisera, arhiviranje) nad više odabranih intervencija**, kako bih **drastično smanjio broj klikova pri upravljanju u situacijama s visokim volumenom zadataka**.

> **Story 2 –** Kao **koordinator**, želim **nakon masovne akcije dobiti sažetak rezultata koji jasno pokazuje koje intervencije su uspješno ažurirane i koje su preskočene i zašto**, kako bih **bio siguran da je akcija izvršena ispravno**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-007, PBI-008, PBI-006, PBI-023

---

#### Acceptance Kriteriji

- Koordinator mora moći **odabrati više intervencija** iz liste putem checkboxa (uključujući "Odaberi sve").
- Nakon odabira, koordinator mora vidjeti **toolbar s masovnim akcijama**: promjena statusa, dodjela servisera, arhiviranje.
- Sistem mora tražiti **potvrdu** prije izvršavanja masovne akcije.
- Masovna akcija mora biti **primijenjena atomarno** – ili sve uspiju, ili sistem prikazuje grešku za svaku koja nije ažurirana.
- Nakon akcije, **lista mora biti osvježena** s ažuriranim stanjem.
- Sistem mora prikazati **sažetak rezultata** (npr. "15 od 15 intervencija uspješno ažurirano").
- Ako je određena akcija neprimjenjiva na neke od odabranih intervencija, **sistem mora naznačiti koje su preskočene i zašto**.

---

### PBI-039 – Blokiranje korisnika od strane firme

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 2 SP | **Sprint:** Backlog

#### User Storiji

> **Story 1 –** Kao **koordinator**, želim **blokirati korisnika za kojeg procijenim da se radi o spamu ili zloupotrebi sistema**, kako bih **spriječio daljnje lažne prijave i zaštitio tim od nepotrebnog opterećenja**.

> **Story 2 –** Kao **koordinator**, želim **pregledati sve blokirane korisnike i moći ih deblokirati**, kako bih **imao kompletnu kontrolu i mogao ispraviti eventualne pogrešne blokade**.

#### Veze i zavisnosti

- **Zavisi od:** PBI-003 (Prijava kvara), PBI-001 (Registracija)
- **Veza s:** PBI-013 (Admin upravljanje računima)

---

#### Acceptance Kriteriji

- Koordinator mora imati **opciju blokiranja korisnika** dostupnu iz pregleda intervencija ili korisničkog profila.
- Sistem mora tražiti **potvrdu akcije** prije blokiranja.
- Nakon blokiranja, **blokirani korisnik ne smije moći slati nove prijave kvarova** – sistem mora odbiti unos.
- Koordinator mora imati **pregled svih blokiranih korisnika** s mogućnošću deblokiranja.
- Deblokiranje mora **odmah omogućiti korisniku** da ponovo podnosi prijave.
- Svaka akcija blokiranja i deblokiranja mora biti **evidentirana u logu** s imenom koordinatora i vremenskom oznakom.
- Blokiranje korisnika **ne smije automatski deaktivirati korisnički račun** – to je odvojena admin akcija.
