# Product Backlog – User Storiji i Acceptance Kriteriji

> **Projekt:** Sistem za upravljanje intervencijama  
> **Verzija:** 1.0  

---

## Legenda prioriteta
| Oznaka | Značenje |
|--------|----------|
| Kritičan | Bez ove funkcionalnosti sistem ne može raditi |
| Visok | Ključno za MVP, blokira važne tokove rada |
| Srednji | Značajno poboljšanje, ali nije bloker |
| Nizak | Korisno, može se odgoditi bez štete po MVP |

---

## SPRINT 5

---

### PBI-001 – Registracija korisnika
 
**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 5 SP | **Sprint:** 5
 
#### User Story
 
> Kao **novi korisnik**, želim **samostalno kreirati korisnički račun unosom osnovnih podataka**, kako bih **dobio pristup sistemu bez potrebe za čekanjem da me administrator ručno registruje**.
 
#### Poslovna vrijednost
 
Samoregistracija smanjuje administrativni teret i ubrzava onboarding novih korisnika. Korisnik koji može sam kreirati račun u par minuta ima bolje korisničko iskustvo, a admin nije usko grlo za svaki novi pristup. Uloge osjetljivije od "Korisnik" (serviser, koordinator, admin, menadžment) i dalje dodjeljuje administrator, čime se zadržava kontrola nad privilegovanim pristupom.
 
#### Pretpostavke i otvorena pitanja
 
- Samoregistracijom korisnik automatski dobija ulogu **Korisnik** – sve ostale uloge dodjeljuje admin naknadno.
- Otvoreno pitanje: Da li je potrebna verifikacija email adrese nakon registracije (email potvrda)?
- Otvoreno pitanje: Da li admin dobija notifikaciju kada se registruje novi korisnik?
- Otvoreno pitanje: Postoje li zahtjevi za kompleksnost lozinke (minimalna dužina, specijalni znakovi)?
 
#### Veze i zavisnosti
 
- **Preduvjet za:** PBI-002 (Login), PBI-013 (Upravljanje računima)
- **Zavisi od:** –
 
---
 
#### Acceptance Kriteriji
 
- Na login stranici mora postojati **vidljiv link ili dugme "Registruj se"** koji otvara formu za registraciju.
- Forma za registraciju mora sadržavati **obavezna polja**: ime, prezime, korisničko ime, email adresa, lozinka i potvrda lozinke.
- Ako korisnik ne popuni sva obavezna polja i pokuša se registrovati, **sistem ne smije kreirati račun** i mora jasno označiti svako nepopunjeno polje.
- Ako unesena lozinka i potvrda lozinke **nisu identične**, sistem mora prikazati grešku i odbiti registraciju.
- Ako korisnik unese korisničko ime ili email koji **već postoji u sistemu**, sistem mora prikazati grešku i spriječiti duplikat.
- Kada korisnik uspješno završi registraciju, **sistem mora automatski dodijeliti ulogu Korisnik** – korisnik ne smije moći sam odabrati drugu ulogu tokom samoregistracije.
- Nakon uspješne registracije, **sistem mora prikazati potvrdu** (npr. "Vaš račun je uspješno kreiran") i korisnik mora moći odmah se prijaviti.
- Admin mora moći **promijeniti ulogu novoregistrovanog korisnika** putem admin panela (PBI-013) ako je potrebno dodijeliti privilegovanu ulogu.
- Sistem ne smije dozvoliti registraciju s **neispravnim formatom email adrese**.
- Korisnički račun mora biti povezan sa određenom firmom/organizacijom.

---

### PBI-002 – Prijava u sistem (Login)

**Tip:** Feature | **Prioritet:**  Kritičan | **Složenost:** 4 SP | **Sprint:** 5

#### User Story

> Kao **registrirani korisnik sistema** (bez obzira na ulogu), želim **sigurno se prijaviti koristeći korisničko ime i lozinku**, kako bih **dobio pristup funkcionalnostima koje su predviđene za moju ulogu i zaštitio podatke od neovlaštenog pristupa**.

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

- Kada korisnik unese ispravno korisničko ime i lozinku te klikne "Prijavi se", **sistem mora autentificirati korisnika i preusmjeriti ga na početnu stranicu** odgovarajuću za njegovu ulogu.
- Ako korisnik unese netačno korisničko ime ili lozinku, **sistem mora prikazati generičku poruku greške** (npr. "Korisničko ime ili lozinka nisu ispravni") bez otkrivanja koja od dvije vrijednosti je netačna.
- Sistem mora onemogućiti pristup zaštićenim stranicama **bez aktivne prijavljene sesije** – svaki pokušaj direktnog pristupa URL-u mora preusmjeriti na login stranicu.
- Kada korisnik klikne "Odjavi se", **sesija mora biti odmah prekinuta** i korisnik preusmjeren na login stranicu.
- Nakon odjave, **korisnik ne smije moći pristupiti prethodnim stranicama** putem dugmeta "Nazad" u pregledniku.
- Korisnik treba dobiti **jasnu vizualnu indikaciju** da je uspješno prijavljen (npr. vidljivo korisničko ime ili uloga u navigaciji).
- Sistem ne smije dozvoliti prijavu **deaktiviranog korisničkog računa**.

---

### PBI-003 – Prijava kvara od strane korisnika

**Tip:** Feature | **Prioritet:**  Kritičan | **Složenost:** 5 SP | **Sprint:** 5

#### User Story

> Kao **korisnik (prijavljen ili neregistriran)**, želim **brzo i jednostavno prijaviti kvar putem online obrasca**, kako bih **osigurao da nadležni tim bude obaviješten i da se moj problem evidentira i riješi u razumnom roku**.

#### Poslovna vrijednost

Prijava kvara je primarni ulazni kanal za sve intervencije u sistemu. Što je ovaj proces jednostavniji i dostupniji – čak i bez registracije – to više prijava stiže na vreme, a tim može pravovremeno reagovati. Automatsko kreiranje intervencije eliminiše ručni posao koordinatora pri unošenju novih zahtjeva.

#### Pretpostavke i otvorena pitanja

- Dostupno i neprijavljenim korisnicima (bez obaveze registracije).
- Otvoreno pitanje: Koji tipovi datoteka su dozvoljeni za upload (slike, PDF, video)?
- Otvoreno pitanje: Da li neprijavljeni korisnik unosi kontakt podatke kao dio obrasca?
- Otvoreno pitanje: Kako se prate intervencije prijavljene od neprijavljenih korisnika?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-004 (Planiranje intervencija), PBI-025 (Detekcija duplikata)
- **Zavisi od:** –

---

#### Acceptance Kriteriji

- Kada korisnik otvori obrazac za prijavu kvara, **mora vidjeti polja**: lokacija, opis problema i kategorija usluge.
- Sistem mora **omogućiti dodavanje slika ili dokumenata** (attachment) uz prijavu kvara.
- Korisnik pri prijavi kvara bira firmu iz unaprijed definisane liste (dropdown), bez potrebe za ručnim unosom.
- Sistem mora omogućiti automatsko popunjavanje lokacije korisnika ili uređaja.
- Ako korisnik ne popuni obavezna polja (lokacija, opis, kategorija) i pokuša poslati obrazac, **sistem ne smije kreirati intervenciju** i mora označiti koje polje nedostaje.
- Kada korisnik uspješno pošalje obrazac, **sistem mora automatski kreirati novu intervenciju** i prikazati potvrdu o prijemu (npr. broj intervencije ili poruku "Vaša prijava je zabilježena").
- Sistem ne smije zahtijevati prijavu za slanje obrasca – **neprijavljeni korisnik mora moći prijaviti kvar** bez registracije.
- Kreirana intervencija mora biti **odmah vidljiva koordinatoru** u listi aktivnih intervencija (PBI-007).
- Sistem mora dozvoliti upload **najmanje jedne slike ili dokumenta** uz svaku prijavu.
- Sistem mora ponuditi listu predefinisanih hitnih intervencija, a korisnik mora imati mogućnost dodatnog unosa opisa kvara.

---

### PBI-004 – Planiranje intervencija

**Tip:** Feature | **Prioritet:**  Kritičan | **Složenost:** 5 SP | **Sprint:** 5

#### User Story

> Kao **koordinator (dispečer)**, želim **kreirati i zakazati intervenciju na osnovu primljene prijave kvara**, kako bih **osigurao organiziran i pravovremen odgovor tima uz jasno definisan vremenski okvir za rješavanje**.

#### Poslovna vrijednost

Planiranje intervencija je srž operativnog rada koordinatora. Bez ove funkcionalnosti, terenski tim nema strukturiran zadatak, a menadžment nema uvid u planove. Definisanje vremenskog okvira omogućava praćenje kašnjenja i bolju organizaciju resursa.

#### Pretpostavke i otvorena pitanja

- Koordinator kreira intervenciju na osnovu postojeće prijave kvara ili samostalno.
- Otvoreno pitanje: Da li koordinator može kreirati intervenciju bez prethodno prijavljenog kvara (npr. za planirano održavanje)?
- Otvoreno pitanje: Koji vremenski okvir se unosi – samo rok završetka ili i planirano vrijeme početka?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-005 (Prioritet), PBI-006 (Dodjela servisera), PBI-008 (Praćenje statusa)
- **Zavisi od:** PBI-003 (Prijava kvara), PBI-002 (Login)

---

#### Acceptance Kriteriji

- Kada koordinator otvori formu za kreiranje intervencije, **mora imati mogućnost unosa**: naziva intervencije, opisa, lokacije, vremenskog okvira (datum početka i rok završetka) i veze na prijavu kvara.
- Sistem mora **dozvoliti kreiranje intervencije i bez veze na prijavu kvara** (npr. planirano održavanje).
- Ako koordinator ne unese obavezne podatke (naziv, lokacija, vremenski okvir), **sistem ne smije sačuvati intervenciju** i mora označiti problematična polja.
- Kada koordinator sačuva intervenciju, **ona mora biti odmah vidljiva u listi aktivnih intervencija** s ispravnim statusom "Otvoreno".
- Sistem mora **prikazati vezu između intervencije i originalne prijave kvara** tamo gdje postoji.
- Koordinator mora moći **naknadno izmijeniti detalje intervencije** (datum, opis, lokacija) dok je status "Otvoreno" ili "U procesu".
- Svaka kreirana intervencija mora biti **evidentirana s vremenskom oznakom kreiranja** i korisničkim imenom koordinatora koji ju je kreirao.

---

### PBI-005 – Postavljanje prioriteta intervencije

**Tip:** Feature | **Prioritet:**  Visok | **Složenost:** 3 SP | **Sprint:** 5

#### User Story

> Kao **koordinator**, želim **dodijeliti i po potrebi izmijeniti prioritet svake intervencije**, kako bih **osigurao da terenski tim uvijek radi na najhitnijim zadacima i da lista intervencija bude smisleno rangirana**.

#### Poslovna vrijednost

Prioritet je osnova za organizaciju rada u sistemima s velikim brojem simultanih zahtjeva. Bez eksplicitnog rangiranja, koordinator i serviseri moraju sami procjenjivati važnost svakog zadatka, što vodi do grešaka i propuštenih hitnih slučajeva. Ovo je jedan od ključnih zahtjeva MVP-a.

#### Pretpostavke i otvorena pitanja

- Dostupne razine prioriteta: Hitan, Visok, Normalan, Nizak.
- Otvoreno pitanje: Da li promjena prioriteta zahtijeva navođenje razloga?
- Otvoreno pitanje: Da li postoji notifikacija serviseru kada se prioritet promijeni nakon dodjele?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-007 (Pregled liste – rangiranje po prioritetu)
- **Zavisi od:** PBI-004 (Planiranje intervencija)

---

#### Acceptance Kriteriji

- Kada koordinator kreira ili uređuje intervenciju, **mora imati mogućnost odabira prioriteta** iz padajućeg menija s opcijama: Hitan, Visok, Normalan, Nizak.
- Sistem mora **onemogućiti čuvanje intervencije bez dodijeljenog prioriteta** – prioritet je obavezno polje.
- Kada koordinator naknadno promijeni prioritet, **sistem mora zabilježiti promjenu** s vremenskom oznakom i korisničkim imenom koji je izvršio izmjenu.
- Lista aktivnih intervencija mora biti **automatski sortirana po prioritetu** (Hitan > Visok > Normalan > Nizak) pri svakom osvježavanju.
- Intervencije istog prioriteta moraju biti **sortirane po datumu kreiranja** (starije prve).
- Korisnik treba **vizualno razlikovati prioritete** u listi (npr. boja ili ikona oznake) bez potrebe da otvara detalje intervencije.
- Sistem ne smije dozvoliti postavljanje prioriteta koji nije u listi predviđenih opcija.

---

## SPRINT 6

---

### PBI-006 – Dodjela servisera intervenciji

**Tip:** Feature | **Prioritet:**  Visok | **Složenost:** 2 SP | **Sprint:** 6

#### User Story

> Kao **koordinator**, želim **dodijeliti jednog ili više servisera (ili cijeli terenski tim) otvorenoj intervenciji**, kako bih **jasno rasporedio odgovornost i osigurao da pravi ljudi znaju koji zadatak trebaju obaviti**.

#### Poslovna vrijednost

Bez jasne dodjele, intervencija ostaje "ničija" i postoji rizik da ne bude obavljena. Dodjela servisera je direktna veza između koordinacijskog i terenskog rada – ona aktivira tok od planiranja do realizacije.

#### Pretpostavke i otvorena pitanja

- Koordinator može dodijeliti jednog ili više servisera istoj intervenciji.
- Otvoreno pitanje: Da li dodjela automatski šalje notifikaciju serviseru? (Veza s PBI-012)
- Otvoreno pitanje: Može li koordinator promijeniti dodjelu ako je serviser već počeo raditi na zadatku?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-009 (Pregled zadataka servisera), PBI-012 (Notifikacije)
- **Zavisi od:** PBI-004 (Planiranje intervencija), PBI-001 (Registracija – kreiranje servisera)

---

#### Acceptance Kriteriji

- Kada koordinator otvori detalje intervencije, **mora imati dugme ili sekciju za dodjelu servisera**.
- Sistem mora prikazati **listu dostupnih servisera** iz koje koordinator može odabrati jednog ili više.
- Kada koordinator sačuva dodjelu, **ime servisera mora biti vidljivo u detalju intervencije** i u listi aktivnih intervencija.
- Koordinator mora moći **dodijeliti više od jednog servisera** istoj intervenciji.
- Koordinator mora moći **izmijeniti ili ukloniti dodjelu** servisera i nakon što je postavljena.
- Sistem ne smije dozvoliti dodjelu servisera koji ima **deaktiviran korisnički račun**.
- Sistem mora zabilježiti **ko je izvršio dodjelu i kada** (audit log).

---

### PBI-007 – Pregled liste aktivnih intervencija

**Tip:** Feature | **Prioritet:**  Visok | **Složenost:** 5 SP | **Sprint:** 6

#### User Story

> Kao **koordinator ili menadžment**, želim **pregledati sve aktivne intervencije u jednom pregledu, rangirane po prioritetu i filtrirane po statusu, tipu ili dodijeljenosti**, kako bih **u svakom trenutku imao jasnu sliku aktuelnog stanja na terenu i znao gdje je potrebna moja pažnja**.

#### Poslovna vrijednost

Ovo je centralni operativni ekran sistema. Koordinator svaki radni dan počinje i završava s ovim pregledom. Pravilno rangiranje po prioritetu direktno utječe na brzinu reakcije tima, a filteri smanjuju kognitivno opterećenje u okruženjima s velikim brojem simultanih intervencija. Ovo je jedan od ključnih zahtjeva MVP-a.

#### Pretpostavke i otvorena pitanja

- Prikaz je namijenjen koordinatorima i menadžmentu (ne serviserima – oni imaju PBI-009).
- Otvoreno pitanje: Koji je maksimalni broj intervencija po stranici (paginacija)?
- Otvoreno pitanje: Da li lista automatski osvježava podatke ili zahtijeva ručno osvježavanje?

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje), PBI-005 (Prioritet), PBI-006 (Dodjela), PBI-008 (Status)
- **Veza s:** PBI-017 (Napredna pretraga), PBI-014 (Dashboard)

---

#### Acceptance Kriteriji

- Kada koordinator ili menadžment pristupe pregledu intervencija, **sistem mora prikazati sve aktivne intervencije** (status: Otvoreno, U procesu).
- Lista mora biti **automatski sortirana po prioritetu** (Hitan > Visok > Normalan > Nizak), a unutar istog prioriteta po datumu kreiranja (starije prve).
- Korisnik mora moći **filtrirati intervencije po statusu** (Otvoreno, U procesu, Završeno).
- Korisnik mora moći **filtrirati po tipu intervencije** i **po dodijeljenosti** (dodijeljeno / nije dodijeljeno / dodijeljeno određenom serviseru).
- Svaki red u listi mora prikazivati **minimalno**: naziv intervencije, prioritet, status, lokaciju, dodjeljenog servisera i datum kreiranja – bez potrebe za otvaranjem detalja.
- Sistem mora **vizualno razlikovati prioritete** intervencija u listi (boja, ikona ili oznaka).
- Kombinovanje više filtera istovremeno **mora raditi ispravno** i prikazivati samo intervencije koje zadovoljavaju sve odabrane kriterije.
- Sistem ne smije prikazivati **arhivirane intervencije** u aktivnoj listi.

---

### PBI-008 – Praćenje i izmjena statusa intervencije

**Tip:** Feature | **Prioritet:**  Visok | **Složenost:** 8 SP | **Sprint:** 6

#### User Story

> Kao **koordinator ili serviser**, želim **mijenjati status intervencije kako napreduje rad na njoj**, kako bih **osigurao da svi dionici u realnom vremenu znaju gdje se intervencija nalazi u procesu rješavanja**.

#### Poslovna vrijednost

Praćenje statusa je temeljni mehanizam transparentnosti u sistemu. Bez njega, koordinator ne zna da li je serviser počeo s radom, a menadžment ne može pratiti napredak. Bilježenje svake promjene s vremenskom oznakom stvara revizijsku evidenciju koja je neprocjenjiva u slučaju sporova ili analize efikasnosti.

#### Pretpostavke i otvorena pitanja

- Moguće vrijednosti statusa: Otvoreno → U procesu → Završeno.
- Otvoreno pitanje: Da li postoji status "Na čekanju"? Nije navedeno u MVP-u, ali je vjerovatno potrebno u praksi.
- Otvoreno pitanje: Može li serviser promijeniti status u "Završeno" ili je to isključivo koordinatorova akcija?

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje), PBI-006 (Dodjela)
- **Preduvjet za:** PBI-010 (Izvještaj o intervenciji), PBI-018 (Upozorenje kašnjenja)

---

#### Acceptance Kriteriji

- Kada koordinator ili serviser otvori detalje intervencije, **mora vidjeti trenutni status i imati mogućnost izmjene**.
- Sistem mora **dozvoliti promjenu statusa samo u unaprijed definisanom smjeru**: Otvoreno → U procesu → Završeno ili Otvoreno → Otkazano (nije moguće preskočiti status).
- Svaka promjena statusa mora biti **automatski zabilježena u historiji intervencije** s: imenom korisnika koji je izvršio promjenu, datumom i tačnim vremenom.
- Koordinator mora imati **pregled kompletne historije promjena statusa** unutar detalja svake intervencije.
- Sistem ne smije dozvoliti **promjenu statusa Završene intervencije** bez posebnih administratorskih ovlasti.
- Kada se status promijeni, **lista aktivnih intervencija (PBI-007) mora odražavati novu vrijednost** bez potrebe za ručnim osvježavanjem (ili uz jasno vidljivo dugme za osvježavanje).
- Korisnik treba dobiti **vizualnu potvrdu** da je promjena statusa uspješno sačuvana.

---

### PBI-009 – Pregled zadataka servisera

**Tip:** Feature | **Prioritet:**  Visok | **Složenost:** 3 SP | **Sprint:** 6

#### User Story

> Kao **serviser**, želim **na jednom mjestu vidjeti sve intervencije koje su mi dodijeljene**, kako bih **znao koji zadaci me čekaju, po kom redu ih trebam obaviti i gdje moram ići**.

#### Poslovna vrijednost

Serviser ne treba i ne smije imati uvid u sve intervencije u sistemu – to bi stvorilo konfuziju. Personalizovana lista zadataka osigurava fokus, smanjuje greške i pruža terenskome djelatniku sve informacije na jednom ekranu bez gubljenja vremena na komunikaciju s koordinatorom.

#### Pretpostavke i otvorena pitanja

- Serviser vidi samo intervencije koje su mu eksplicitno dodijeljene.
- Otvoreno pitanje: Da li serviser vidi i intervencije s timskom dodjelom (npr. "Terenski tim A")?
- Otvoreno pitanje: Da li su zadaci sortirani po prioritetu ili po datumu?

#### Veze i zavisnosti

- **Zavisi od:** PBI-006 (Dodjela servisera)
- **Veza s:** PBI-010 (Izvještaj), PBI-008 (Izmjena statusa), PBI-012 (Notifikacije)

---

#### Acceptance Kriteriji

- Kada serviser pristupi svom pregledu, **sistem mora prikazati isključivo intervencije dodijeljene njemu** – ne smije prikazivati intervencije drugih servisera.
- Za svaku intervenciju u listi, serviser mora vidjeti **minimalno**: naziv, lokaciju, opis kvara, prioritet i rok završetka.
- Lista zadataka mora biti **sortirana po prioritetu** (hitan zadatak uvijek na vrhu).
- Serviser mora moći **otvoriti detalj svake intervencije** kako bi vidio potpuni opis, priložene dokumente i komentare.
- Sistem ne smije prikazivati **intervencije sa statusom "Završeno"** u aktivnoj listi zadataka (ili ih jasno vizualno odvojiti od aktivnih).
- Serviser ne smije imati mogućnost **pristupa niti izmjene intervencija koje mu nisu dodijeljene**.
- Ako serviser nema dodijeljenih intervencija, **sistem mora prikazati jasnu poruku** (npr. "Trenutno nemate dodijeljenih zadataka").

---

### PBI-010 – Evidencija izvještaja o intervenciji

**Tip:** Feature | **Prioritet:**  Visok | **Složenost:** 5 SP | **Sprint:** 6

#### User Story

> Kao **serviser**, želim **po završetku intervencije dokumentirati šta sam uradio, koji materijal sam koristio i eventualne napomene**, kako bih **ostavio trajnu evidenciju obavljenog rada koja služi koordinatoru, menadžmentu i budućim servisima na istoj lokaciji**.

#### Poslovna vrijednost

Izvještaj o intervenciji je osnova za historiju održavanja, analizu troškova (u budućim fazama) i odgovornost servisera za obavljeni rad. Bez dokumentacije, organizacija gubi institucijsku memoriju o tome šta je urađeno, kada i s kojim materijalima.

#### Pretpostavke i otvorena pitanja

- Obračun troškova nije u MVP scopeu – evidentira se samo utrošeni materijal tekstualno.
- Otvoreno pitanje: Da li izvještaj može biti izmijenjen nakon što je sačuvan?
- Otvoreno pitanje: Može li koordinator ili admin urediti izvještaj servisera?

#### Veze i zavisnosti

- **Zavisi od:** PBI-008 (Status intervencije), PBI-009 (Pregled zadataka)
- **Veza s:** PBI-011 (Historija intervencija), PBI-023 (Export)

---

#### Acceptance Kriteriji

- Kada serviser otvori dodijeljenu intervenciju, **mora imati formu za unos izvještaja** s poljima: opis obavljenih radova, utrošeni materijal, napomene.
- Sistem mora **vezati izvještaj za konkretnu intervenciju** – nije moguće kreirati izvještaj koji nije vezan za postojeću intervenciju.
- Kada serviser sačuva izvještaj, **sistem mora zabilježiti** ime servisera, datum i tačno vrijeme čuvanja.
- Koordinator i admin moraju moći **pregledati izvještaj** unutar detalja intervencije.
- Sistem mora dozvoliti **dodavanje izvještaja dok je intervencija u statusu "U procesu" ili "Završeno"**.
- Sistem ne smije dozvoliti unos izvještaja ako intervencija nije započeta.
- Obračun troškova **ne smije biti dio forme u MVP-u** – polje za troškove ne bi trebalo biti prikazano.
- Korisnik treba dobiti **potvrdu o uspješnom čuvanju** izvještaja nakon submita.
- 

---

## SPRINT 7

---

### PBI-011 – Historija intervencija po lokaciji/uređaju

**Tip:** Feature | **Prioritet:**  Srednji | **Složenost:** 3 SP | **Sprint:** 7

#### User Story

> Kao **koordinator ili serviser**, želim **pregledati sve prethodne intervencije na određenoj lokaciji ili uređaju**, kako bih **razumio historijat problema na tom mjestu i donio bolju odluku o pristupu rješavanju trenutnog kvara**.

#### Poslovna vrijednost

Historija lokacije/uređaja sprječava ponavljanje istih grešaka i ubrzava dijagnozu. Serviser koji zna da je isti kvar prijavljen tri puta u posljednjih šest mjeseci odmah fokusira istragu na sistemski uzrok, a ne površinski simptom. Ovo je osnovna historija bez grafičkih prikaza (grafički prikazi van MVP scope).

#### Pretpostavke i otvorena pitanja

- Prikaz je tabularni/tekstualni – bez grafova ili vizualizacija.
- Otvoreno pitanje: Kako se definiše "isti uređaj" ili "ista lokacija"? Po adresi, koordinatama, ID-u uređaja?
- Otvoreno pitanje: Koliko daleko unazad seže historija (sve ili zadnjih N)?

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje intervencija – lokacija)
- **Veza s:** PBI-017 (Napredna pretraga), PBI-026 (Arhiviranje)

---

#### Acceptance Kriteriji

- Koordinator ili serviser mogu **filtrirati historiju intervencija prema lokaciji ili uređaju**.
- Za svaku intervenciju u historiji, sistem mora prikazati **minimalno**: datum, status, sažetak opisa, ime servisera i prioritet.
- Historija mora biti **sortirana od najnovije prema najstarijoj** intervenciji.
- Sistem mora prikazati historiju **samo za završene i arhivirane intervencije** (aktivne intervencije nisu dio historijskog prikaza već aktivnog pregleda).
- Ako za odabranu lokaciju/uređaj nema prethodnih intervencija, **sistem mora prikazati jasnu poruku** (npr. "Nema prethodnih intervencija za ovu lokaciju").
- Grafički prikazi i vizualizacije **ne smiju biti implementirani** u MVP verziji.
- Korisnik treba moći **kliknuti na svaku intervenciju u historiji** i otvoriti njene detalje.

---

### PBI-012 – Notifikacije

**Tip:** Feature | **Prioritet:**  Srednji | **Složenost:** 8 SP | **Sprint:** 7

#### User Story

> Kao **serviser**, želim **primiti notifikaciju čim mi je dodijeljen novi zadatak**, a kao **koordinator**, želim **biti obaviješten čim korisnik prijavi novi kvar**, kako bih **mogao pravovremeno reagirati bez stalnog ručnog provjeravanja sistema**.

#### Poslovna vrijednost

Notifikacije pretvaraju pasivni sistem (korisnik mora sam provjeravati novosti) u aktivan (sistem obavještava korisnika). To direktno skraćuje vrijeme reakcije i smanjuje rizik od propuštenih hitnih intervencija. Automatski podsjetnici za redovne preglede nisu u MVP scopeu.

#### Pretpostavke i otvorena pitanja

- MVP obuhvata: notifikaciju servisera pri dodjeli + notifikaciju koordinatora pri novoj prijavi kvara.
- Notifikacije su implementirane kao in-app obavijesti unutar sistema.
- Otvoreno pitanje: Da li korisnik može isključiti notifikacije?

#### Veze i zavisnosti

- **Zavisi od:** PBI-003 (Prijava kvara), PBI-006 (Dodjela servisera)
- **Veza s:** PBI-029 (Notifikacije za tikete)

---

#### Acceptance Kriteriji

- Kada koordinator dodijeli intervenciju serviseru, **serviser mora primiti notifikaciju** (in-app, u realnom ili gotovo realnom vremenu).
- Notifikacija serviseru mora sadržavati **minimalno**: naziv intervencije, prioritet i lokaciju.
- Kada korisnik prijavi novi kvar, **koordinator mora primiti notifikaciju** o novoj prijavi.
- Notifikacija koordinatoru mora sadržavati **minimalno**: datum/vrijeme prijave i lokaciju kvara.
- Korisnik treba moći **kliknuti na notifikaciju i biti direktno preusmjeren** na relevantnu intervenciju.
- Sistem mora prikazati **broj nepročitanih notifikacija** vidljivo u navigaciji (npr. badge/brojač).
- Automatski podsjetnici za redovne preglede **ne smiju biti implementirani** u MVP-u.

---

### PBI-013 – Upravljanje korisničkim računima (Admin)

**Tip:** Feature | **Prioritet:**  Srednji | **Složenost:** 8 SP | **Sprint:** 7

#### User Story

> Kao **administrator sistema**, želim **imati potpunu kontrolu nad korisničkim računima – kreiranje, uređivanje, aktivaciju, deaktivaciju i dodjelu uloga**, kako bih **osigurao da pristup sistemu u svakom trenutku odgovara stvarnom stanju organizacije i da neovlaštene osobe ne mogu pristupiti podacima**.

#### Poslovna vrijednost

Admin panel je osnova sigurnosti i organizacione kontrole. Kad zaposlenik napusti organizaciju, admin mora moći odmah deaktivirati njegov račun. Kada se promijeni uloga korisnika (npr. serviser postane koordinator), admin mora to reflektovati u sistemu bez kreiranja novog računa.

#### Pretpostavke i otvorena pitanja

- RBAC (Role-Based Access Control) je uključen u ovaj PBI.
- Otvoreno pitanje: Da li admin može resetovati lozinku korisniku direktno ili samo korisnik putem email linka (PBI-019)?
- Otvoreno pitanje: Da li postoji log aktivnosti po korisniku za audit?

#### Veze i zavisnosti

- **Zavisi od:** PBI-001 (Registracija), PBI-002 (Login)
- **Veza s:** PBI-019 (Reset lozinke)

---

#### Acceptance Kriteriji

- Admin mora imati pristup **listi svih korisničkih računa** s informacijama: ime, korisničko ime, email, uloga, status (aktivan/neaktivan).
- Admin mora moći **izmijeniti podatke postojećeg korisnika**: ime, email, ulogu.
- Admin mora moći **deaktivirati korisnički račun** bez brisanja – deaktiviran korisnik ne smije moći se prijaviti, ali njegovi podaci ostaju u sistemu.
- Admin mora moći **reaktivirati prethodno deaktiviran račun**.
- Admin mora moći **promijeniti ulogu korisnika** i ta promjena mora biti odmah aktivna (korisnik koji je bio Serviser a postane Koordinator smije odmah koristiti koordinatorske funkcionalnosti).
- Sistem ne smije dozvoliti **brisanje korisnika koji ima vezane aktivne intervencije**.
- Admin ne smije moći **deaktivirati vlastiti račun** (zaštita od slučajnog zaključavanja).
- Svaka izmjena u korisničkim računima mora biti **zabilježena u audit logu**.
- Admin prilikom kreiranja ili uređivanja korisnika dodjeljuje firmu kojoj korisnik pripada.

---

## SPRINT 8

---

### PBI-014 – Menadžment dashboard

**Tip:** Feature | **Prioritet:**  Srednji | **Složenost:** 5 SP | **Sprint:** 8

#### User Story

> Kao **menadžment**, želim **na jednom ekranu vidjeti ključne operativne pokazatelje rada tima**, kako bih **mogao donijeti informirane odluke o raspodjeli resursa, pratiti trendove i identificirati problematična područja bez potrebe za ručnim prebrojavanjem iz liste intervencija**.

#### Poslovna vrijednost

Dashboard transformiše sirove podatke o intervencijama u poslovnu inteligenciju. Menadžment koji ima uvid u prosječno vrijeme rješavanja i distribuciju po prioritetu može objektivno procijeniti efikasnost tima. Samo tabelarni/numerički prikaz; grafički prikazi van MVP.

#### Pretpostavke i otvorena pitanja

- Prikaz je numerički/tabelarni – bez grafova i vizualizacija u MVP-u.
- Otvoreno pitanje: Da li se podaci osvježavaju u realnom vremenu ili jednom dnevno?
- Otvoreno pitanje: Da li menadžment može filtrirati dashboard po vremenskom periodu?

#### Veze i zavisnosti

- **Zavisi od:** PBI-008 (Status), PBI-005 (Prioritet)
- **Veza s:** PBI-023 (Export)

---

#### Acceptance Kriteriji

- Dashboard mora prikazivati **broj aktivnih intervencija** (status: Otvoreno + U procesu).
- Dashboard mora prikazivati **broj završenih intervencija** u tekućem periodu (npr. tekući dan/sedmica).
- Dashboard mora prikazivati **prosječno vrijeme rješavanja** intervencija (od kreiranja do statusa "Završeno").
- Dashboard mora prikazivati **distribuciju intervencija po prioritetu** u tabelarnom formatu (koliko Hitnih, Visokih, Normalnih, Niskih).
- Grafički prikazi (grafikoni, pie chartovi) **ne smiju biti implementirani** u MVP verziji.
- Pristup dashboardu mora biti **ograničen na uloge: Menadžment i Admin** – Serviser ne smije vidjeti ovaj prikaz.
- Svi podaci moraju biti **tačni i konzistentni** s podacima u listi intervencija.

---

### PBI-015 – Upravljanje korisničkim profilom

**Tip:** Feature | **Prioritet:**  Nizak | **Složenost:** 2 SP | **Sprint:** 8

#### User Story

> Kao **prijavljeni korisnik**, želim **moći pregledati i ažurirati vlastite kontaktne podatke i promijeniti lozinku**, kako bih **osigurao da su moji podaci u sistemu uvijek tačni i da moj račun ostane siguran**.

#### Poslovna vrijednost

Svaki korisnik treba autonomiju nad vlastitim osnovnim podacima. Promjena lozinke je osnovna sigurnosna funkcionalnost – bez nje korisnik ne može reagirati na potencijalne sigurnosne incidente ili jednostavno promijeniti zadanu lozinku nakon prvog logina.

#### Pretpostavke i otvorena pitanja

- Korisnik ne može sam promijeniti svoju ulogu – to je isključivo admin funkcija.
- Otvoreno pitanje: Da li promjena emaila zahtijeva verifikaciju putem novog emaila?
- Otvoreno pitanje: Postoje li zahtjevi za kompleksnost lozinke?

#### Veze i zavisnosti

- **Zavisi od:** PBI-002 (Login)
- **Veza s:** PBI-013 (Admin upravljanje računima), PBI-019 (Reset lozinke)

---

#### Acceptance Kriteriji

- Svaki prijavljeni korisnik mora imati pristup **stranici Moj profil** s prikazom: ime, prezime, korisničko ime, email adresa.
- Korisnik mora moći **izmijeniti ime, prezime i email adresu** i sačuvati promjene.
- Korisnik mora moći **promijeniti lozinku** unosom trenutne lozinke, a zatim nove lozinke (s potvrdom).
- Ako korisnik unese **netačnu trenutnu lozinku** pri promjeni, sistem mora prikazati grešku i odbiti promjenu.
- Sistem ne smije dozvoliti korisniku da **promijeni vlastitu ulogu** (to je isključivo admin privilegija).
- Korisnik treba dobiti **jasnu vizualnu potvrdu** da su promjene uspješno sačuvane.
- Promjena lozinke ne smije **odjaviti korisnika** iz aktivne sesije, ali ne smije ni ostaviti staru lozinku aktivnom.

---

## SPRINT/RELEASE – BUDUĆI RAZVOJ
 
---
 
### PBI-016 – Komentari intervencije
 
**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **koordinator ili serviser**, želim **dodavati tekstualne komentare na intervenciju**, kako bih **ostavio važne napomene, prijavio kašnjenje ili pojasnio detalje koji se ne uklapaju u standardna polja forme**.
 
#### Poslovna vrijednost
 
Komentari su fleksibilni mehanizam komunikacije unutar konteksta konkretne intervencije. Umjesto da se razmijene poruke van sistema (WhatsApp, email) i izgube, komentari ostaju trajno vezani za intervenciju i vidljivi svima koji imaju pristup.
 
#### Pretpostavke i otvorena pitanja
 
- Otvoreno pitanje: Da li koordinator može brisati tuđe komentare?
- Otvoreno pitanje: Da li komentari generiraju notifikaciju za drugu stranu?
 
#### Veze i zavisnosti
 
- **Veza s:** PBI-012 (Notifikacije), PBI-010 (Izvještaj)
 
---
 
#### Acceptance Kriteriji
 
- Koordinator i serviser moraju imati **formu za unos komentara** unutar detalja intervencije.
- Svaki komentar mora biti **prikazan s imenom autora, datumom i tačnim vremenom** objave.
- Komentari moraju biti **sortirani kronološki** (najstariji na vrhu ili najnoviji na vrhu – konzistentno kroz cijeli sistem).
- Sistem ne smije dozvoliti **prazne komentare** – unos mora imati minimalno jedan karakter.
- Korisnik koji nije koordinator ni serviser **ne smije moći dodavati komentare** na intervenciju.
- Svi komentari moraju ostati **trajno vidljivi** i ne smiju biti automatski brisani.
 
---
 
### PBI-017 – Napredna pretraga

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **koordinator**, želim **pretraživati intervencije po kombinaciji više kriterija** (naziv, datum, lokacija, status, dodjeljeni serviser), kako bih **brzo pronašao konkretnu intervenciju bez ručnog listanja kroz cijelu listu**.
 
#### Poslovna vrijednost
 
Kako broj intervencija u sistemu raste, osnovna lista postaje neupotrebljiva bez napredne pretrage. Koordinator koji traži sve intervencije na određenoj lokaciji u proteklom kvartalu, dodijeljene određenom serviseru, to ne može efikasno uraditi bez višekriterijalne pretrage.
 
#### Pretpostavke i otvorena pitanja
 
- Otvoreno pitanje: Da li pretraga pretražuje i unutar teksta komentara i izvještaja?
- Otvoreno pitanje: Da li se mogu sačuvati/bookmarkovati česti upiti pretrage?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-007 (Lista intervencija)
- **Veza s:** PBI-011 (Historija), PBI-023 (Export)
 
---
 
#### Acceptance Kriteriji
 
- Koordinator mora moći pretraživati intervencije **po nazivu/opisu** (full-text pretraga).
- Koordinator mora moći filtrirati **po datumu** (od – do rasponu).
- Koordinator mora moći filtrirati **po lokaciji**, **po statusu** i **po dodjeljenom serviseru**.
- Korisnik mora moći **kombinovati više kriterija** istovremeno i dobiti presjek rezultata.
- Rezultati pretrage moraju biti prikazani u **istom formatu kao i lista aktivnih intervencija** (PBI-007).
- Ako pretraga ne vrati rezultate, **sistem mora prikazati jasnu poruku** (npr. "Nema intervencija koje odgovaraju zadanim kriterijima").
- Sistem ne smije **odbaciti sve kriterije** ako jedan od njih ne vrati rezultate – mora primijeniti sve koji su uneseni.
 
---
 
### PBI-018 – Upozorenje usljed kašnjenja
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **koordinator**, želim **biti automatski upozoren ako intervencija nije riješena do definisanog roka**, kako bih **mogao pravovremeno intervenirati, prerasporediti resurse i spriječiti da kašnjenja ostanu neprimijećena**.
 
#### Poslovna vrijednost
 
Ručno praćenje rokova za veliki broj intervencija nije skalabilno. Automatsko upozorenje eliminiše potrebu za ručnom kontrolom i osigurava da nijedna intervencija ne "propadne" kroz pukotine zbog prevelikog broja zadataka. Automatski podsjetnici za redovne preglede nisu u MVP scopeu.
 
#### Pretpostavke i otvorena pitanja
 
- Otvoreno pitanje: Ko definiše vremenski rok – koordinator pri kreiranju ili postoji globalna konfiguracija?
- Otvoreno pitanje: Gdje se prikazuje upozorenje – u listi intervencija, posebnom dashboardu ili kao notifikacija?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-004 (Planiranje – vremenski okvir), PBI-012 (Notifikacije)
 
---
 
#### Acceptance Kriteriji
 
- Sistem mora **automatski generisati upozorenje** za svaku intervenciju koja nije u statusu "Završeno" a rok je prošao.
- Upozorenje mora biti **vidljivo koordinatoru** – jasno označena intervencija u pregledu (npr. crvena oznaka ili status "Zakašnjenje").
- Sistem mora upozoravati **samo za intervencije s definisanim rokom** – intervencije bez roka ne smiju generisati upozorenja.
- Upozorenje ne smije **automatski promijeniti status intervencije** – samo signalizira problem.
- Automatski podsjetnici za redovne preglede **ne smiju biti implementirani** u MVP-u.
- Sistem mora **ukloniti oznaku upozorenja** čim intervencija prijeđe u status "Završeno".
 
---
 
### PBI-019 – Reset lozinke
 
**Tip:** Feature | **Prioritet:** Kritičan | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **registrirani korisnik**, želim **moći zatražiti reset lozinke putem emaila ako je zaboravim**, kako bih **vratio pristup svom računu bez potrebe za kontaktiranjem administratora**.
 
#### Poslovna vrijednost
 
Reset lozinke je standardna i očekivana funkcionalnost svakog sistema s autentifikacijom. Bez nje, svaki zaboravljeni password zahtijeva intervenciju admina, što stvara nepotreban uski grlo i smanjuje sigurnost (admin mora ručno postavljati lozinke).
 
#### Pretpostavke i otvorena pitanja
 
- Proces: korisnik unosi email → dobija link → otvori link → postavi novu lozinku.
- Otvoreno pitanje: Koliko dugo je reset link važeći?
- Otvoreno pitanje: Da li korisnik mora odmah promijeniti lozinku pri prvom loginu?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-002 (Login)
- **Veza s:** PBI-015 (Profil – promjena lozinke)
 
---
 
#### Acceptance Kriteriji
 
- Korisnik mora moći pristupiti **formi za reset lozinke s login stranice** (npr. link "Zaboravili ste lozinku?").
- Kada korisnik unese registrovani email i pošalje zahtjev, **sistem mora poslati email s linkom za reset**.
- Ako korisnik unese email koji ne postoji u sistemu, **sistem ne smije otkriti** postoji li taj email (sigurnosna mjera) – prikazuje istu neutralnu poruku.
- Reset link mora biti **jednokratan i vremenski ograničen** – nakon upotrebe ili isteka roka, link ne smije biti ponovo upotrebljiv.
- Kada korisnik otvori link i unese novu lozinku s potvrdom, **sistem mora sačuvati novu lozinku** i invalidirati sve prethodne aktivne sesije.
- Korisnik treba dobiti **potvrdu da je lozinka uspješno resetovana** i biti preusmjeren na login.
- Sistem ne smije dozvoliti **reset lozinke za deaktiviran korisnički račun**.
 
---
 
### PBI-020 – Kalendarski prikaz intervencija
 
**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 5 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **koordinator**, želim **pregledati planirane intervencije u kalendarskom prikazu po danima i sedmicama**, kako bih **imao vizualni uvid u raspoređenost obaveza i brzo identificirao preopterećene periode ili slobodne kapacitete**.
 
#### Poslovna vrijednost
 
Lista intervencija govori "šta postoji", ali ne govori "kada je zakazano". Kalendarski prikaz omogućava prostornu-vremensku orijentaciju u rasporedu rada i čini planiranje intuitivnijim, posebno pri koordinaciji višestrukih timova.
 
#### Pretpostavke i otvorena pitanja
 
- Otvoreno pitanje: Da li se prikazuju i intervencije bez definisanog datuma u kalendarskom prikazu?
- Otvoreno pitanje: Da li je moguće direktno kreirati intervenciju klikom na datum u kalendaru?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-004 (Planiranje – vremenski okvir), PBI-022 (Planirano održavanje)
 
---
 
#### Acceptance Kriteriji
 
- Koordinator mora moći **prebaciti se između listnog i kalendarskog prikaza** intervencija.
- Kalendar mora prikazivati **dnevni, sedmični i/ili mjesečni prikaz** (minimalno jedan od navedenih).
- Svaka intervencija mora biti **prikazana na datumu koji odgovara njenom planiranom roku** ili datumu početka.
- Klik na intervenciju u kalendaru mora **otvoriti detalj te intervencije**.
- Sistem mora **vizualno razlikovati intervencije po prioritetu** i u kalendarskom prikazu.
- Intervencije bez definisanog datuma **ne smiju biti prikazane** u kalendarskom prikazu (ili se prikazuju u posebnom dijelu "Bez datuma").
 
---
 
### PBI-021 – Pregled dostupnosti servisera
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **koordinator**, želim **pri dodjeli intervencije vidjeti listu servisera sortiranu po broju aktivnih zadataka**, kako bih **lako prepoznao koji su serviseri trenutno manje opterećeni i mogli primiti novi zadatak bez kompromitiranja tekućih**.
 
#### Poslovna vrijednost
 
Bez uvida u opterećenost, koordinator može neravnomjerno rasporediti posao – nekom serviseru dodijeliti 10 zadataka, a drugom 1. Sortirani prikaz po broju aktivnih intervencija čini distribuciju posla transparentnom i pravednom bez ručnog prebrojavanja.
 
#### Pretpostavke i otvorena pitanja
 
- Koordinator uvijek može dodijeliti intervenciju bilo kom serviseru, bez obzira na opterećenost.
- Otvoreno pitanje: Da li se u broj aktivnih intervencija računaju i intervencije s timskom dodjelom?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-006 (Dodjela servisera)
 
---
 
#### Acceptance Kriteriji
 
- Kada koordinator pristupi procesu dodjele servisera, **lista servisera mora biti sortirana po broju aktivnih intervencija** – od najmanje prema najviše opterećenim.
- Uz svako ime servisera, mora biti **vidljiv broj njegovih trenutno aktivnih intervencija**.
- Koordinator mora moći **odabrati bilo kojeg servisera** s liste, bez obzira na broj aktivnih zadataka.
- Lista mora biti **ažurirana u realnom vremenu** ili pri svakom otvaranju prozora za dodjelu.
- Serviseri s **deaktiviranim računom ne smiju biti prikazani** na listi.
- Ako svi serviseri imaju 0 aktivnih intervencija, **lista mora i dalje biti prikazana** s odgovarajućom vrijednošću.
 
---
 
### PBI-022 – Planirana/preventivna održavanja
 
**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 8 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **koordinator**, želim **kreirati intervenciju za planirano preventivno održavanje i definisati periodičnost ponavljanja**, kako bih **osigurao da redovni servisi budu automatski zakazani bez potrebe za ručnim kreiranjem svaki put**.
 
#### Poslovna vrijednost
 
Preventivno održavanje smanjuje broj neplaniranih kvarova i produljuje vijek trajanja opreme. Bez automatskog ponavljanja, koordinator mora ručno kreirati iste intervencije svaki put, što je časovit posao podložan zaboravu i greškama.
 
#### Pretpostavke i otvorena pitanja
 
- Sistem podržava ponavljanje (recurring interventions).
- Otvoreno pitanje: Koje su dostupne opcije periodičnosti (dnevno, sedmično, mjesečno, godišnje, prilagođeno)?
- Otvoreno pitanje: Da li se automatski generirane intervencije odmah dodjeljuju ili ostaju nedodijeljene?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-004 (Planiranje intervencija)
- **Veza s:** PBI-020 (Kalendarski prikaz)
 
---
 
#### Acceptance Kriteriji
 
- Koordinator mora moći **kreirati intervenciju bez prijave kvara** i označiti je kao "Planirano održavanje".
- Koordinator mora moći **definisati periodičnost**: minimalno dnevno, sedmično i mjesečno ponavljanje.
- Sistem mora **automatski generisati novu intervenciju** prema definisanom rasporedu u tačno pravo vrijeme.
- Automatski generirane intervencije moraju biti **identične originalu** (isti naziv, lokacija, opis, prioritet) osim datuma koji se automatski pomjera.
- Koordinator mora moći **izmijeniti ili zaustaviti ponavljanje** bez utjecaja na već kreirane instance.
- Svaka automatski generisana intervencija mora biti **prikazana u listi aktivnih intervencija** kao normalna intervencija.
 
---
 
### PBI-023 – Export podataka
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 5 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **koordinator ili menadžment**, želim **eksportovati listu intervencija i izvještaje u PDF format**, kako bih **ih mogao arhivirati, podijeliti s vanjskim dionicima ili koristiti u prezentacijama van samog sistema**.
 
#### Poslovna vrijednost
 
Digitalni sistem nije uvijek dostupan svima kojima su podaci potrebni – revizori, vanjski partneri, menadžment viših razina često trebaju statični dokument. PDF export osigurava da su podaci prenosivi i van sistema.
 
#### Pretpostavke i otvorena pitanja
 
- MVP podržava samo PDF format; Excel/CSV nije u MVP scopeu.
- Otvoreno pitanje: Da li export uključuje priložene slike i dokumente ili samo tekstualne podatke?
- Otvoreno pitanje: Da li postoji mogućnost filtriranja podataka koji se exportuju?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-007 (Lista intervencija), PBI-010 (Izvještaj)
- **Veza s:** PBI-014 (Dashboard)
 
---
 
#### Acceptance Kriteriji
 
- Koordinator i menadžment moraju imati **opciju exporta liste intervencija u PDF**.
- Export mora sadržavati **minimalno**: naziv, prioritet, status, lokaciju, dodjeljenog servisera i datum svake intervencije.
- PDF dokument mora biti **čitljiv, urednog izgleda** s jasnim zaglavljem (naziv kompanije/sistema i datum generisanja).
- Sistem mora generisati PDF **u razumnom vremenu** (npr. za listu od 100 intervencija ne dulje od 30 sekundi).
- Sistem ne smije exportovati **podatke kojima korisnik nema pristup** na osnovu uloge.
- Export u Excel/CSV format **ne smije biti implementiran** u MVP-u.
 
---
 
### PBI-024 – Validacija unosa podataka
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **sistem**, moram **validirati sve korisničke unose prije čuvanja u bazu podataka**, kako bih **spriječio pohranu neispravnih, nepotpunih ili potencijalno štetnih podataka koji bi ugrozili integritet cijelog sistema**.
 
#### Poslovna vrijednost
 
Validacija je temelj pouzdanosti podataka. Bez nje, sistem akumulira prljave podatke koji uzrokuju greške u izvještajima, neispravno prikazivanje i sigurnosne propuste. Ovo je horizontalna funkcionalnost koja se primjenjuje na sve forme u sistemu.
 
#### Pretpostavke i otvorena pitanja
 
- Validacija se odnosi na klijentsku i serversku stranu.
- Otvoreno pitanje: Koji su specifični formati za polja kao što su email, datum, broj telefona?
 
#### Veze i zavisnosti
 
- **Veza s:** Svi PBI koji uključuju forme za unos podataka
 
---
 
#### Acceptance Kriteriji
 
- Sistem mora **spriječiti čuvanje podataka u formi** koja ima nepopunjeno obavezno polje.
- Svako obavezno polje mora biti **jasno označeno** (npr. zvjezdicom *) prije unosa.
- Poruke o grešci moraju biti **prikazane direktno uz polje** na koje se odnose, ne samo generički na vrhu forme.
- Polje za email adresu mora **validirati format emaila** (npr. korisnik@domena.com).
- Polje za datum mora **spriječiti unos nepostojećeg datuma** (npr. 30. februar).
- Validacija mora biti **implementirana i na serverskoj strani** – klijentska validacija je samo korisničko iskustvo i ne zamjenjuje serversku.
- Sistem ne smije **dozvoliti SQL injection ili XSS napade** putem tekstualnih polja.
 
---
 
### PBI-025 – Detekcija duplikata prijave kvara
 
**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 5 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **sistem**, trebam **prepoznati kada isti korisnik pokušava prijaviti identičan kvar koji je već nedavno prijavljen**, kako bih **upozorio korisnika i spriječio kreiranje duplih intervencija koje opterećuju koordinatorski tim i unose konfuziju u sistem**.
 
#### Poslovna vrijednost
 
Duplikati su svakodnevni problem u sistemima za prijavu kvarova – korisnik ne dobije brzu potvrdu pa prijavi isti kvar više puta. Svaki duplikat troši koordinatorovo vreme i troši kapacitet sistema. Automatska detekcija i upozorenje rješavaju ovaj problem sistemski.
 
#### Pretpostavke i otvorena pitanja
 
- Detekcija se bazira na: istom korisniku, istoj ili sličnoj lokaciji, sličnom opisu, u kratkom vremenskom periodu.
- Otvoreno pitanje: Koliko je "kratki vremenski period" – 1 sat, 24 sata, 7 dana?
- Otvoreno pitanje: Korisnik i dalje može prijaviti kvar i nakon upozorenja (upozorenje nije blokada)?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-003 (Prijava kvara)
 
---
 
#### Acceptance Kriteriji
 
- Kada korisnik pokuša prijaviti kvar, sistem mora **provjeriti postoji li slična prijava od istog korisnika** u definisanom vremenskom periodu, na osnovu lokacije i opisa.
- Ako sistem detektuje potencijalni duplikat, **mora prikazati upozorenje** korisniku s informacijom o sličnoj postojećoj prijavi (npr. "Već ste prijavili sličan kvar u posljednjih 24 sata. Da li svejedno želite kreirati novu prijavu?").
- Korisnik mora moći **nastaviti s prijavom i pored upozorenja** – detekcija duplikata je upozorenje, ne blokada.
- Korisnik mora moći **odustati od prijave** i biti preusmjeren na detalje postojeće intervencije.
- Sistem ne smije prikazivati **lažna upozorenja za prijave na različitim lokacijama** ili s bitno različitim opisima.
- Ako je prethodna slična prijava već u statusu "Završeno", **sistem ne smije je tretirati kao duplikat**.
 
---
 
### PBI-026 – Arhiviranje intervencija
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **sistem**, trebam **automatski arhivirati završene ili otkazane intervencije nakon definisanog vremenskog perioda**, kako bih **održao preglednost aktivnog prikaza i spriječio da stare intervencije usporavaju rad ili zbunjuju korisnike**.
 
#### Poslovna vrijednost
 
S vremenom, baza intervencija može porasti do desetaka hiljada zapisa. Bez arhiviranja, lista postaje neupotrebljiva, pretrage su spore i sistemski resursi su preopterećeni. Arhiviranje čuva historiju a istovremeno drži aktivni prikaz čistim.
 
#### Pretpostavke i otvorena pitanja
 
- Arhivirane intervencije ostaju dostupne za pretragu i pregled, samo su premještene iz aktivnog prikaza.
- Otvoreno pitanje: Ko definiše vremenski period arhiviranja – admin ili je fiksno konfigurisan?
- Otvoreno pitanje: Da li se arhiviraju i svi vezani dokumenti, komentari i izvještaji?
 
#### Veze i zavisnosti
 
- **Veza s:** PBI-011 (Historija), PBI-017 (Napredna pretraga)
 
---
 
#### Acceptance Kriteriji
 
- Sistem mora **automatski arhivirati intervencije** sa statusom "Završeno" ili "Otkazano" nakon isteka definisanog vremenskog perioda.
- Arhivirane intervencije **ne smiju biti prikazane u aktivnoj listi** (PBI-007) ali moraju ostati dostupne u historiji (PBI-011) i pretragama (PBI-017).
- Sistem mora **sačuvati sve vezane podatke** uz arhiviranu intervenciju (komentari, izvještaji, dokumenti).
- Admin mora moći **konfigurirati vremenski period** po isteku kojeg se intervencije arhiviraju.
- Arhiviranje se **ne smije primijeniti na aktivne intervencije** (status: Otvoreno, U procesu).
- Korisnik s odgovarajućim ovlastima mora moći **ručno arhivirati intervenciju** i van automatskog ciklusa.
 
---
 
### PBI-027 – Kreiranje tiketa za podršku
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **registrirani korisnik**, želim **kreirati tiket za korisničku podršku kako bih postavio pitanje, prijavio problem u aplikaciji ili zatražio pomoć**, kako bih **dobio zvanični i praćeni odgovor umjesto da problem ostane neriješen**.
 
#### Poslovna vrijednost
 
Tiketi za podršku su kanal za probleme s aplikacijom, za razliku od kvarova koji su predmet intervencija. Odvajanje ova dva toka sprječava miješanje tehničke podrške s terenskim radom i osigurava da oba dobijaju odgovarajuću pažnju.
 
#### Pretpostavke i otvorena pitanja
 
- Tiketi za podršku su odvojeni od prijava kvarova (PBI-003) i ne generišu intervencije.
- Otvoreno pitanje: Ko je agent podrške – posebna uloga ili admin?
- Otvoreno pitanje: Koje su dostupne kategorije upita?
 
#### Veze i zavisnosti
 
- **Veza s:** PBI-028 (Komunikacija na tiketu), PBI-029 (Notifikacije za tikete)
- **Odvojen od:** PBI-003 (Prijava kvara)
 
---
 
#### Acceptance Kriteriji
 
- Prijavljeni korisnik mora imati **pristup formi za kreiranje tiketa** s poljima: naslov, opis problema i kategorija upita.
- Kategorije upita moraju biti **predefinisane** (minimalno: Tehničko pitanje, Prijava greške u aplikaciji, Ostalo).
- Kada korisnik sačuva tiket, **sistem mora kreirati tiket s jedinstvenim ID-om** i statusom "Otvoren".
- Korisnik mora moći **pregledati sve vlastite tikete** i njihov status.
- Sistem ne smije **prikazivati tikete jednog korisnika drugom korisniku** (osim agentu podrške).
- Tiket za podršku **ne smije kreirati intervenciju** u sistemu za upravljanje kvarovima.
- Kreiranje tiketa mora biti **dostupno isključivo prijavljenim korisnicima**.
 
---
 
### PBI-028 – Dvosmjerna komunikacija na tiketu
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 5 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **korisnik ili agent podrške**, želim **razmjenjivati poruke unutar otvorenog tiketa**, kako bih **vodio strukturisan dijalog o problemu na jednom mjestu bez potrebe za emailom ili telefonskim pozivima**.
 
#### Poslovna vrijednost
 
Bez komunikacijskog kanala unutar tiketa, podrška degenerisie u niz email prepiske koji se teško prati i nema vezu s originalnim problemom. Komunikacija unutar tiketa čuva kompletan kontekst i historijat razgovora na jednom mjestu.
 
#### Pretpostavke i otvorena pitanja
 
- Otvoreno pitanje: Da li su poruke unutar tiketa vidljive samo korisniku i agentu, ili i adminima?
- Otvoreno pitanje: Da li se tiket automatski zatvara ako korisnik ne odgovori u određenom roku?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-027 (Kreiranje tiketa)
- **Veza s:** PBI-029 (Notifikacije za tikete)
 
---
 
#### Acceptance Kriteriji
 
- Unutar svakog otvorenog tiketa, korisnik i agent moraju imati **formu za slanje tekstualnih poruka**.
- Svaka poruka mora biti **prikazana s imenom pošiljaoca, datumom i tačnim vremenom** slanja.
- Poruke moraju biti **sortirane kronološki** unutar tiketa.
- Sistem ne smije dozvoliti **slanje prazne poruke**.
- Korisnik mora moći **vidjet samo vlastite tikete i razgovore** – ne smije imati pristup tuđim tiketima.
- Nakon što agent označi tiket kao "Zatvoren", **obe strane trebaju vidjeti tu promjenu statusa** i sistem treba spriječiti daljnje slanje poruka (ili jasno naznačiti da je tiket zatvoren).
 
---
 
### PBI-029 – Notifikacija za tikete
 
**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** Backlog
 
#### User Story
 
> Kao **korisnik**, želim **primiti in-app obavijest kada agent odgovori na moj tiket**, a kao **agent podrške**, želim **biti obaviješten kada stigne novi tiket ili odgovor korisnika**, kako bih **mogli pravovremeno reagirati bez stalnog provjeravanja sistema**.
 
#### Poslovna vrijednost
 
Notifikacije za tikete imaju istu logiku kao i operativne notifikacije (PBI-012) – smanjuju latenciju odgovora i povećavaju zadovoljstvo korisnika koji zna da će biti obaviješten kada postoji napredak.
 
#### Pretpostavke i otvorena pitanja
 
- Otvoreno pitanje: Da li su notifikacije za tikete odvojene od operativnih notifikacija ili idu kroz isti kanal?
- Otvoreno pitanje: Da li korisnik može isključiti određeni tip notifikacija?
 
#### Veze i zavisnosti
 
- **Zavisi od:** PBI-027 (Kreiranje tiketa), PBI-028 (Komunikacija)
- **Veza s:** PBI-012 (Operativne notifikacije)
---
- ### PBI-030 – Kategorije i tipovi kvarova

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** Backlog

#### User Story

> Kao **korisnik**, želim **pri prijavi kvara odabrati kategoriju iz predefinisane liste** (npr. vodoinstalacije, struja, internet...), kako bih **preciznije opisao prirodu problema i omogućio koordinatoru brže razumijevanje i kategorizaciju bez dodatnih pojašnjenja**.

#### Poslovna vrijednost

Slobodni tekstualni unos tipa kvara dovodi do nekonzistentnih podataka – isti problem može biti opisan na desetak različitih načina. Predefinisane kategorije standardizuju unos, ubrzavaju trijažu koordinatora i omogućavaju filtriranje i analizu intervencija po tipu kvara.

#### Pretpostavke i otvorena pitanja

- Kategorije su predefinisane u sistemu; korisnik ne može kreirati vlastitu kategoriju pri prijavi.
- Otvoreno pitanje: Ko upravlja listom kategorija – admin putem admin panela ili je lista fiksna u kodu?
- Otvoreno pitanje: Da li jedna intervencija može imati više kategorija ili samo jednu?
- Otvoreno pitanje: Da li postoje podkategorije (npr. Struja → Kratki spoj / Nestanak struje)?

#### Veze i zavisnosti

- **Zavisi od:** PBI-003 (Prijava kvara)
- **Veza s:** PBI-007 (Lista intervencija – filtriranje po kategoriji), PBI-017 (Napredna pretraga)

---

#### Acceptance Kriteriji

- Kada korisnik otvori formu za prijavu kvara, **mora vidjeti padajući meni ili listu za odabir kategorije** (npr. Vodoinstalacije, Struja, Internet, Grijanje, Lift, Ostalo).
- Odabir kategorije mora biti **obavezno polje** – korisnik ne smije moći poslati prijavu bez odabrane kategorije.
- Sistem mora **prikazati odabranu kategoriju u detalju intervencije** vidljivu koordinatoru i serviseru.
- Koordinator i menadžment moraju moći **filtrirati listu intervencija po kategoriji** (veza s PBI-007).
- Kategorija mora biti **uključena u rezultate napredne pretrage** (PBI-017) kao jedan od kriterija filtriranja.
- Sistem ne smije dozvoliti **unos slobodnog teksta umjesto odabira** iz predefinisane liste.
- Ako lista kategorija bude prazna ili nedostupna, **sistem mora prikazati odgovarajuću grešku** i spriječiti slanje obrasca.

---

### PBI-031 – Višejezična podrška

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 5 SP | **Sprint:** Backlog

#### User Story

> Kao **korisnik sistema**, želim **moći odabrati jezik prikaza interfejsa u postavkama svog profila**, kako bih **koristio sistem na jeziku koji mi je najrazumljiviji i izbjegao jezičke barijere pri svakodnevnom radu**.

#### Poslovna vrijednost

Višejezična podrška proširuje krug korisnika sistema i smanjuje mogućnost grešaka uzrokovanih nerazumijevanjem interfejsa. Posebno je važna u sredinama s višejezičnim timovima ili u slučaju internacionalizacije proizvoda.

#### Pretpostavke i otvorena pitanja

- Minimalno podržani jezici u prvoj iteraciji trebaju biti definirani (npr. bosanski/hrvatski/srpski i engleski).
- Otvoreno pitanje: Da li se jezik primjenjuje samo na infterfejs ili i na sistemske poruke i emailove?
- Otvoreno pitanje: Ko je odgovoran za prijevode – developer tim ili se koristi eksterni alat (npr. i18n fajlovi)?
- Otvoreno pitanje: Da li neprijavljeni korisnici vide zadani jezik ili mogu odabrati prije logina?

#### Veze i zavisnosti

- **Zavisi od:** PBI-015 (Upravljanje korisničkim profilom)
- **Veza s:** PBI-002 (Login – zadani jezik na login stranici)

---

#### Acceptance Kriteriji

- Svaki prijavljeni korisnik mora imati **mogućnost odabira jezika u postavkama profila** iz liste podržanih jezika.
- Nakon odabira i čuvanja jezika, **sučelje sistema mora biti prikazano na odabranom jeziku** pri svakom narednom loginu bez potrebe za ponovnim odabirom.
- Promjena jezika mora se **primijeniti odmah** ili nakon osvježavanja stranice – bez potrebe za ponovnom prijavom.
- Sistem mora **zapamtiti odabrani jezik** po korisničkom računu, ne samo po sesiji ili pregledniku.
- Svi elementi sučelja (navigacija, dugmad, poruke grešaka, labele formi) moraju biti **prevedeni na odabrani jezik** – parcijalni prijevodi nisu prihvatljivi.
- Sistem ne smije **prikazivati miješane jezike** na istoj stranici (npr. neke labele na jednom, a druge na drugom jeziku).
- Ako prijevod za određeni element nedostaje, **sistem mora prikazati fallback vrijednost** (npr. engleski) umjesto praznog polja ili koda.
 
---
 
#### Acceptance Kriteriji
 
- Kada agent odgovori na tiket, **korisnik mora primiti in-app notifikaciju**.
- Kada korisnik kreira novi tiket ili odgovori na postojeći, **agent podrške mora primiti in-app notifikaciju**.
- Svaka notifikacija mora sadržavati **ID tiketa i kratki sažetak** koji omogućava korisniku identifikaciju tiketa bez otvaranja.
- Klik na notifikaciju mora **direktno otvoriti odgovarajući tiket**.
- Sistem mora prikazati **broj nepročitanih notifikacija** i za tikete, vidljivo u navigaciji.
- Korisnik ne smije primati **notifikacije za tuđe tikete**.

---

## NOVI PBI-ovi — v2.1

---

### PBI-032 – Upravljanje kategorijama kvarova (Admin)

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 4 SP | **Sprint:** 6

#### User Story

> Kao **administrator sistema**, želim **dodavati, uređivati i deaktivirati kategorije kvarova koje se prikazuju korisnicima pri prijavi kvara**, kako bih **osigurao da lista kategorija uvijek odražava stvarne tipove kvarova s kojima se organizacija susreće i bila dostupna od prvog dana korištenja sistema**.

#### Poslovna vrijednost

Kategorije kvarova su infrastrukturni element koji mora biti postavljen prije nego korisnici počnu prijavljovati kvarove. Bez upravljanja kategorijama putem admin panela, izmjena liste zahtijeva intervenciju developera, što usporava operativni rad. Dinamično upravljanje kategorijama daje organizaciji autonomiju i fleksibilnost bez tehničke zavisnosti.

#### Pretpostavke i otvorena pitanja

- Kategorije koje se deaktivišu ne brišu se iz sistema – ostaju vidljive na prethodnim intervencijama, ali se ne nude pri novim prijavama.
- Otvoreno pitanje: Da li postoje podkategorije (npr. Struja → Kratki spoj / Nestanak struje)?
- Otvoreno pitanje: Da li se kategorije primjenjuju globalno ili per-firma?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-003 (Prijava kvara – odabir kategorije), PBI-030 (Kategorije i tipovi kvarova)
- **Zavisi od:** PBI-002 (Login), PBI-001 (Registracija – admin mora biti u sistemu)

---

#### Acceptance Kriteriji

- Admin mora imati pristup **listi svih kategorija kvarova** s informacijama: naziv, status (aktivna/neaktivna), datum kreiranja.
- Admin mora moći **kreirati novu kategoriju** unosom naziva i opcionog opisa.
- Sistem ne smije dozvoliti **kreiranje kategorije s već postojećim nazivom** – naziv mora biti jedinstven.
- Admin mora moći **urediti naziv i opis** postojeće aktivne kategorije.
- Admin mora moći **deaktivirati kategoriju** – deaktivirana kategorija ne smije se prikazivati korisnicima pri novim prijavama kvara.
- Admin mora moći **reaktivirati prethodno deaktiviranu kategoriju**.
- Deaktiviranje kategorije **ne smije retroaktivno uticati** na intervencije koje su prethodno evidentirane s tom kategorijom.
- Ako nema niti jedne aktivne kategorije, **sistem mora prikazati upozorenje adminu** da korisnici neće moći prijaviti kvar.
- Svaka izmjena kategorije mora biti **zabilježena s imenom admina i vremenskom oznakom**.

---

### PBI-033 – Pregled i upravljanje attachmentima

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** 7 (5 sprintova) / Sprint 8 (8 sprintova)

#### User Story

> Kao **koordinator ili administrator**, želim **pregledati, validirati i po potrebi obrisati fajlove priložene uz prijavu kvara**, kako bih **osigurao da sistem ne sadrži neprihvatljive, oštećene ili zlonamjerne datoteke i da attachmenti zauzimaju samo opravdani prostor**.

#### Poslovna vrijednost

Bez pregleda i kontrole nad priloženim fajlovima, korisnici mogu priložiti datoteke neodgovarajućeg tipa, prevelike veličine ili potencijalno štetnog sadržaja. Koordinator i admin moraju imati mehanizam za naknadnu kontrolu i čišćenje, posebno u situacijama kada korisnik priloži neodgovarajući materijal.

#### Pretpostavke i otvorena pitanja

- Dozvoljeni tipovi fajlova i maksimalna veličina definišu se u konfiguraciji sistema (admin nadležnost).
- Otvoreno pitanje: Da li se brisanjem attachmenta briše i fizička datoteka s servera ili samo referenca?
- Otvoreno pitanje: Da li koordinator može brisati ili samo admin?

#### Veze i zavisnosti

- **Zavisi od:** PBI-003 (Prijava kvara – upload fajlova)
- **Veza s:** PBI-013 (Admin upravljanje)

---

#### Acceptance Kriteriji

- U detaljima svake intervencije, koordinator i admin moraju moći **pregledati sve priložene fajlove** (naziv, tip, veličina, datum uploada).
- Koordinator i admin moraju moći **otvoriti ili preuzeti svaki priloženi fajl** direktno iz sistema.
- Admin mora moći **definisati dozvoljene tipove fajlova** (npr. JPG, PNG, PDF) i **maksimalnu veličinu** po fajlu u konfiguraciji.
- Sistem mora **odbiti upload fajlova** koji ne odgovaraju dozvoljenim tipovima ili prelaze maksimalnu veličinu – uz jasnu poruku korisniku.
- Koordinator ili admin mora moći **obrisati attachment** vezan za intervenciju uz obaveznu potvrdu akcije.
- Sistem mora **zabilježiti ko je i kada obrisao attachment** u audit logu.
- Ako intervencija nema priloženih fajlova, **sekcija attachmenta mora biti prikazana** s odgovarajućom porukom (npr. "Nema priloženih fajlova").

---

### PBI-034 – Geografski/mapski prikaz intervencija

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 4 SP | **Sprint:** 10 (5 sprintova) / Sprint 12 (8 sprintova)

#### User Story

> Kao **koordinator**, želim **pregledati intervencije prikazane na interaktivnoj mapi prema njihovoj lokaciji**, kako bih **dobio prostorni uvid u distribuciju zadataka na terenu i lakše koordinirao servisere u istom geografskom području**.

#### Poslovna vrijednost

Lista intervencija prikazuje šta postoji i kada je zakazano, ali ne govori ništa o tome gdje se sve dešava. Mapski prikaz omogućava koordinatoru da odmah vidi koncentracije kvarova, identifikuje preopterećena područja i efikasnije planira rute servisera – naročito u organizacijama s velikim terenskim pokrićem.

#### Pretpostavke i otvorena pitanja

- Prikaz zahtijeva da intervencije imaju definisane koordinate (geografsku lokaciju).
- Otvoreno pitanje: Koji kartografski provider se koristi (Google Maps, OpenStreetMap, Mapbox)?
- Otvoreno pitanje: Da li je moguće kreirati novu intervenciju klikom na lokaciju na mapi?
- Otvoreno pitanje: Da li se prikazuju samo aktivne ili i arhivirane intervencije?

#### Veze i zavisnosti

- **Zavisi od:** PBI-004 (Planiranje – definisanje lokacije), PBI-007 (Lista intervencija)
- **Veza s:** PBI-020 (Kalendarski prikaz – komplementarni prikazi)

---

#### Acceptance Kriteriji

- Koordinator mora imati mogućnost **prebacivanja između listnog i mapskog prikaza** intervencija.
- Svaka intervencija s definisanom lokacijom mora biti **prikazana kao marker/pin na mapi** na odgovarajućim koordinatama.
- Klik na marker mora **otvoriti sažetak intervencije** (naziv, prioritet, status, dodjeljeni serviser) bez napuštanja mapskog prikaza.
- Markeri moraju biti **vizualno razlikovani po prioritetu** (npr. boja: crvena = Hitan, narančasta = Visok itd.).
- Koordinator mora moći **filtrirati prikazane intervencije** na mapi po statusu i/ili dodjeljenom serviseru.
- Intervencije **bez definisane lokacije ne smiju biti prikazane** na mapi (ili se prikazuju u posebnoj listi ispod).
- Mapa mora podržavati **zoom in/out i pomicanje** (pan) radi preglednosti u gustim područjima.
- Mapski prikaz **ne smije prikazivati arhivirane intervencije** po defaultu.

---

### PBI-035 – Konfiguracija vremenskih rokova (SLA)

**Tip:** Feature | **Prioritet:** Visok | **Složenost:** 3 SP | **Sprint:** 7 (5 sprintova) / Sprint 9 (8 sprintova)

#### User Story

> Kao **administrator sistema**, želim **definirati vremenski rok za rješavanje intervencija za svaki nivo prioriteta**, kako bih **uspostavio mjerljive standarde usluge (SLA) koji služe kao osnova za automatska upozorenja o kašnjenju**.

#### Poslovna vrijednost

Bez definisanih rokova, upozorenja o kašnjenju (PBI-018) nemaju smisla jer sistem ne zna kada intervencija kasni. SLA konfiguracija daje organizaciji mogućnost da postavi vlastite standarde usluge koji odgovaraju prirodi posla i ugovornim obavezama prema klijentima, bez potrebe za izmjenama koda.

#### Pretpostavke i otvorena pitanja

- Rokovi se definišu per-prioritet: Hitan, Visok, Normalan, Nizak.
- Otvoreno pitanje: Da li se SLA rokovi mogu definisati i per-kategorija kvara, ili samo per-prioritet?
- Otvoreno pitanje: Da li SLA sat teče od kreiranja intervencije ili od dodjele serviseru?

#### Veze i zavisnosti

- **Preduvjet za:** PBI-018 (Upozorenje usljed kašnjenja)
- **Zavisi od:** PBI-005 (Prioritet intervencije)

---

#### Acceptance Kriteriji

- Admin mora imati pristup **stranici za konfiguraciju SLA rokova** s poljem za svaki nivo prioriteta: Hitan, Visok, Normalan, Nizak.
- Admin mora moći **unijeti vremenski rok u satima** za svaki nivo prioriteta (npr. Hitan = 2h, Visok = 8h).
- Sistem ne smije dozvoliti **čuvanje SLA konfiguracije s praznim poljem** za bilo koji nivo prioriteta.
- Sistem ne smije dozvoliti **nulu ili negativnu vrijednost** kao rok.
- Nakon čuvanja, nova SLA konfiguracija mora **odmah biti aktivna** za sve buduće provjere kašnjenja.
- Promjena SLA konfiguracije mora biti **zabilježena u audit logu** s imenom admina i vremenskom oznakom.
- Admin mora moći **pregledati trenutno aktivnu konfiguraciju** u svakom trenutku.
- Sistem mora prikazati **jasnu vizualnu potvrdu** da su promjene uspješno sačuvane.

---

### PBI-036 – Feedback korisnika po završetku intervencije

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 3 SP | **Sprint:** 10 (5 sprintova) / Sprint 12 (8 sprintova)

#### User Story

> Kao **korisnik koji je prijavio kvar**, želim **dobiti mogućnost da ocijenim ili potvrdim da je moj problem riješen nakon što budem obaviješten o završetku intervencije**, kako bih **dao povratnu informaciju o kvaliteti usluge i potvrdio da sam zadovoljan ishodom**.

#### Poslovna vrijednost

Feedback korisnika zatvara petlju između prijave kvara i potvrde rješenja iz perspektive korisnika – ne samo iz perspektive servisera. Organizacija dobija mjerljiv pokazatelj zadovoljstva korisnika po svakoj intervenciji, što omogućava identifikaciju slabih tačaka u procesu i praćenje trendova kvalitete usluge tokom vremena.

#### Pretpostavke i otvorena pitanja

- Feedback je opcionalan – korisnik nije obavezan ostaviti ocjenu.
- Otvoreno pitanje: Koji je format ocjene – numerički (1–5), palac gore/dolje, ili opisni?
- Otvoreno pitanje: Da li koordinator i menadžment mogu pregledati feedback u dashboardu?
- Otvoreno pitanje: Nakon koliko vremena od završetka intervencije feedback više nije moguće ostaviti?

#### Veze i zavisnosti

- **Zavisi od:** PBI-008 (Praćenje statusa – status "Završeno"), PBI-012 (Notifikacije)
- **Veza s:** PBI-014 (Menadžment dashboard – potencijalna integracija metrike)

---

#### Acceptance Kriteriji

- Kada intervencija prijeđe u status "Završeno", korisnik koji je prijavio kvar mora dobiti **in-app obavijest s pozivom na feedback**.
- Korisnik mora moći **ostaviti ocjenu** (minimalno: potvrda rješenja ili numerička ocjena 1–5) direktno iz notifikacije ili iz pregleda intervencije.
- Korisnik mora imati mogućnost **dodavanja opcionog tekstualnog komentara** uz ocjenu.
- Feedback mora biti **moguće ostaviti samo jednom** po intervenciji – ponovni unos nije dozvoljen.
- Ako korisnik ne ostavi feedback, **sistem ne smije blokirati niti podsjetiti više od jednom**.
- Koordinator i admin moraju moći **pregledati feedback** vezan za konkretnu intervenciju u njenim detaljima.
- Sistem ne smije **prikazivati feedback jednog korisnika drugom korisniku** koji nije koordinator ili admin.

---

### PBI-037 – Automatska raspodjela intervencija

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 4 SP | **Sprint:** 10 (5 sprintova) / Sprint 13 (8 sprintova)

#### User Story

> Kao **koordinator**, želim **da sistem automatski dodijeli novu intervenciju manje opterećenom serviseru prema definisanim pravilima**, kako bih **smanjio ručni posao dodjele i osigurao ravnomjernu distribuciju posla – uz zadržanu mogućnost ručne izmjene**.

#### Poslovna vrijednost

U okruženjima s visokim volumenom intervencija, ručna dodjela svakog zadatka postaje uski grlo. Automatska raspodjela ubrzava proces, smanjuje rizik od propuštene dodjele i osigurava pravičniju distribuciju opterećenja. Koordinator i dalje ima punu kontrolu i može u svakom trenutku pregaziti automatsku odluku.

#### Pretpostavke i otvorena pitanja

- Kriterij raspodjele u MVP-u: broj trenutno aktivnih intervencija po serviseru (manje = prednost).
- Otvoreno pitanje: Da li se automatska raspodjela primjenjuje na sve nove intervencije ili samo ako koordinator ne dodijeli unutar X minuta?
- Otvoreno pitanje: Što se dešava ako nema dostupnih servisera?

#### Veze i zavisnosti

- **Zavisi od:** PBI-021 (Pregled dostupnosti servisera), PBI-006 (Dodjela servisera)
- **Veza s:** PBI-012 (Notifikacije – serviser mora biti obaviješten o automatskoj dodjeli)

---

#### Acceptance Kriteriji

- Kada se kreira nova intervencija, sistem mora **automatski dodijeliti je serviseru s najmanjim brojem aktivnih intervencija** prema pravilima definisanim u konfiguraciji.
- Koordinator mora biti **jasno obaviješten da je dodjela automatski izvršena** (vizualna oznaka u detaljima intervencije).
- Koordinator mora moći **ručno izmijeniti automatski dodijeljenog servisera** u svakom trenutku bez ograničenja.
- Serviser koji je automatski dobio intervenciju mora primiti **in-app notifikaciju** identičnu onoj pri ručnoj dodjeli.
- Sistem mora **evidentirati da je dodjela bila automatska** (za razliku od ručne) u historiji intervencije.
- Ako nema dostupnih aktivnih servisera, **sistem ne smije blokirati kreiranje intervencije** – intervencija ostaje nedodijeljenom s odgovarajućom oznakom.
- Admin mora moći **aktivirati ili deaktivirati** funkcionalnost automatske raspodjele iz konfiguracije sistema.

---

### PBI-038 – Masovne akcije na intervencijama

**Tip:** Feature | **Prioritet:** Srednji | **Složenost:** 4 SP | **Sprint:** 10 (5 sprintova) / Sprint 12 (8 sprintova)

#### User Story

> Kao **koordinator**, želim **istovremeno izvršiti istu akciju (promjena statusa, dodjela servisera, arhiviranje) nad više odabranih intervencija**, kako bih **drastično smanjio broj klikova i ubrzao upravljanje u situacijama s visokim volumenom zadataka**.

#### Poslovna vrijednost

Upravljanje desetinama ili stotinama intervencija jedna-po-jedna je neprihvatljivo sporo. Masovne akcije su standardna funkcionalnost u operativnim alatima i direktno utječu na produktivnost koordinatora. Bez ove mogućnosti, svaka reorganizacija rada (npr. preraspodjela servisera ili masovno zatvaranje završenih zadataka) oduzima nerazumnu količinu vremena.

#### Pretpostavke i otvorena pitanja

- Masovne akcije su dostupne isključivo koordinatoru.
- Otvoreno pitanje: Da li postoji limit broja intervencija koje se mogu odabrati odjednom?
- Otvoreno pitanje: Da li se sve akcije primjenjuju i na arhivirane intervencije ili samo na aktivne?

#### Veze i zavisnosti

- **Zavisi od:** PBI-007 (Lista intervencija), PBI-008 (Promjena statusa), PBI-006 (Dodjela servisera), PBI-026 (Arhiviranje)

---

#### Acceptance Kriteriji

- Koordinator mora moći **odabrati više intervencija** iz liste putem checkbox-a (uključujući opciju "Odaberi sve").
- Nakon odabira, koordinator mora vidjeti **toolbar s dostupnim masovnim akcijama**: promjena statusa, dodjela servisera, arhiviranje.
- Sistem mora tražiti **potvrdu korisnika** prije izvršavanja masovne akcije (npr. "Sigurni ste da želite promijeniti status za 15 intervencija?").
- Masovna akcija mora biti **primijenjena na sve odabrane intervencije atomarno** – ili sve uspiju, ili sistem prikazuje grešku za svaku koja nije mogla biti ažurirana.
- Nakon izvršene akcije, **lista mora biti osvježena** i prikazivati ažurirano stanje.
- Sistem mora prikazati **sažetak rezultata** masovne akcije (npr. "15 od 15 intervencija uspješno ažurirano").
- Ako koordinator odabere intervencije kojima određena akcija nije primjenjiva (npr. pokušaj arhiviranja aktivne intervencije), **sistem mora jasno naznačiti** koje intervencije su preskočene i zašto.

---

### PBI-039 – Blokiranje korisnika od strane firme

**Tip:** Feature | **Prioritet:** Nizak | **Složenost:** 2 SP | **Sprint:** 10 (5 sprintova) / Sprint 13 (8 sprintova)

#### User Story

> Kao **koordinator**, želim **blokirati korisnika za kojeg procijenim da se radi o spamu ili zloupotrebi sistema**, kako bih **spriječio daljnje lažne prijave i zaštitio tim od nepotrebnog opterećenja**.

#### Poslovna vrijednost

Otvoreni sistemi za prijavu kvarova (posebno dostupni i neprijavljenim korisnicima) mogu biti zloupotrijebljeni. Koordinator koji primijeti obrazac lažnih ili šaljivih prijava od istog korisnika mora imati brz mehanizam zaštite bez potrebe da angažuje administratora.

#### Pretpostavke i otvorena pitanja

- Blokiranje je reverzibilna akcija – korisnik može biti deblokiran.
- Otvoreno pitanje: Da li blokirani korisnik dobija obavijest o blokiranju?
- Otvoreno pitanje: Da li blokiranje važi samo za prijavu kvarova ili i za prijavu u sistem?
- Otvoreno pitanje: Da li koordinator blokira korisnika u kontekstu firme ili globalno u sistemu?

#### Veze i zavisnosti

- **Zavisi od:** PBI-003 (Prijava kvara), PBI-001 (Registracija korisnika)
- **Veza s:** PBI-013 (Admin upravljanje računima)

---

#### Acceptance Kriteriji

- Koordinator mora imati **opciju blokiranja korisnika** dostupnu iz pregleda intervencija ili korisničkog profila.
- Sistem mora tražiti **potvrdu akcije** prije blokiranja (npr. "Jeste li sigurni da želite blokirati ovog korisnika?").
- Nakon blokiranja, **blokirani korisnik ne smije moći slati nove prijave kvarova** – sistem mora odbiti unos s odgovarajućom porukom.
- Koordinator mora imati **pregled svih blokiranih korisnika** s mogućnošću deblokiranja.
- Deblokiranje mora **odmah omogućiti korisniku** da ponovo podnosi prijave.
- Svaka akcija blokiranja i debrokiranja mora biti **evidentirana u logu** s imenom koordinatora i vremenskom oznakom.
- Blokiranje korisnika **ne smije automatski deaktivirati korisnički račun** – to je odvojena admin akcija (PBI-013).
