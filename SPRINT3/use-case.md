# Use Case Model

---

## PBI-001 — Registracija korisnika

**Akter:** Gost / Korisnik, Administrator

**Kratak opis:**
Kreiranje novog korisničkog računa u sistemu. Postoje dvije putanje: korisnik se samostalno registruje putem obrasca, ili administrator kreira račun u ime zaposlenika i direktno mu dodjeljuje ulogu i firmu.

**Preduslovi:**
- Korisnik koji se samoregistruje nije prijavljen u sistem.
- Administrator je prijavljen s administratorskim ovlastima.
- Administrator je prethodno konfigurisao sistem i kreirao kategorije.

**Glavni tok:**
1. Korisnik otvara stranicu za registraciju klikom na „Registruj se" na login stranici.
2. Korisnik unosi ime, prezime, e-mail, korisničko ime, lozinku i potvrdu lozinke.
3. Sistem validira unesene podatke.
4. Sistem kreira korisnički račun i automatski dodjeljuje ulogu Korisnik.
5. Sistem prikazuje potvrdu o uspješnoj registraciji.
6. Korisnik se može odmah prijaviti u sistem.

**Alternativni tokovi:**
- **AT-1: Administrator kreira račun za zaposlenika.** Umjesto samoregistracije, administrator pristupa admin panelu, kreira račun za zaposlenika, direktno mu dodjeljuje odgovarajuću ulogu (Serviser, Koordinator, Menadžment) i vezuje ga za odgovarajuću firmu/organizaciju.

**Ishod:** Korisnički račun je kreiran i korisnik može koristiti sistem prema dodijeljenoj ulozi.

---

## PBI-002 — Prijava u sistem

**Akter:** Gost / Korisnik, Serviser, Koordinator, Menadžment, Administrator

**Kratak opis:**
Registrovani korisnik unosi kredencijale i prijavljuje se u sistem kako bi dobio pristup funkcionalnostima vezanim za svoju ulogu.

**Preduslovi:**
- Korisnik posjeduje aktivan korisnički račun.
- Račun nije deaktiviran od strane administratora.

**Glavni tok:**
1. Korisnik otvara stranicu za prijavu.
2. Korisnik unosi korisničko ime i lozinku.
3. Sistem provjerava tačnost unesenih kredencijala.
4. Sistem identifikuje sistemsku ulogu korisnika.
5. Korisnik biva preusmjeren na odgovarajući dashboard namijenjen njegovoj ulozi.

**Ishod:** Korisnik je uspješno prijavljen i ima pristup funkcionalnostima na osnovu svoje uloge.

---

## PBI-019 — Reset lozinke

**Akter:** Gost / Korisnik, Serviser, Koordinator, Menadžment

**Kratak opis:**
Korisnik može promijeniti lozinku na dva načina: putem opcije „Zaboravili ste lozinku?" na stranici za prijavu, ili kroz postavke svog profila dok je prijavljen u sistem.

**Preduslovi:**
- Korisnik posjeduje registrovanu e-mail adresu u sistemu.

**Glavni tok:**
1. Korisnik na stranici za prijavu klikne na opciju „Zaboravili ste lozinku?".
2. Korisnik unosi svoju e-mail adresu.
3. Sistem generiše i šalje e-mail s vremenski ograničenim linkom za resetovanje lozinke.
4. Korisnik otvara link iz e-maila i unosi novu lozinku.
5. Sistem potvrđuje promjenu i preusmjerava korisnika na stranicu za prijavu.

**Alternativni tokovi:**
- **AT-1: Reset lozinke kroz profil.** Korisnik koji je prijavljen u sistem može otvoriti stranicu „Moj profil", odabrati opciju za promjenu lozinke, unijeti trenutnu lozinku te unijeti i potvrditi novu lozinku bez slanja e-maila.

**Ishod:** Lozinka je uspješno izmijenjena i korisnik se može prijaviti s novim podacima.

---

## PBI-015 — Upravljanje profilom

**Akter:** Gost / Korisnik, Serviser, Koordinator, Menadžment, Administrator

**Kratak opis:**
Prijavljeni korisnik može pregledavati i mijenjati podatke svog korisničkog računa, uključujući lične podatke, lozinku i jezičke preferencije.

**Preduslovi:**
- Korisnik mora biti uspješno prijavljen u sistem.

**Glavni tok:**
1. Korisnik kroz navigaciju otvara stranicu „Moj profil".
2. Sistem učitava i prikazuje trenutne podatke profila.
3. Korisnik vrši izmjene željenih podataka (ime, kontakt, odabrani jezik).
4. Sistem validira unesene promjene.
5. Sistem sprema izmjene u bazu i prikazuje poruku potvrde korisniku.

**Ishod:** Podaci profila su uspješno ažurirani i promjene su odmah vidljive u cijelom sistemu.

---

## PBI-003 — Prijava kvara

**Akter:** Gost / Korisnik (prijavljen ili neprijavljen)

**Kratak opis:**
Korisnik ili gost prijavljuje kvar u sistemu popunjavanjem obrasca, što uključuje odabir kategorije, auto-detekciju lokacije i automatsku provjeru duplikata od strane sistema.

**Preduslovi:**
- Sistem mora biti u funkciji i dostupan.
- Administrator je prethodno konfigurisao kategorije kvarova.

**Glavni tok:**
1. Prijavljeni korisnik otvara obrazac za prijavu kvara iz navigacije.
2. Korisnik popunjava polja za naslov i opis problema.
3. Sistem od korisnika traži odabir kategorije kvara.
4. Sistem pokušava automatski detektovati trenutnu lokaciju.
5. Sistem validira ispravnost svih unesenih podataka.
6. Korisnik klikom potvrđuje slanje prijave.
7. Sistem spašava kvar u bazu i dodjeljuje mu jedinstveni identifikacijski broj.
8. Sistem prikazuje potvrdu korisniku o prijemu prijave.

**Alternativni tokovi:**
- **AT-1: Prijava kvara bez registracije.** Neprijavljeni gost može pristupiti obrascu za prijavu kvara direktno putem javnog linka, bez prethodne prijave ili registracije, te podnijeti prijavu na isti način kao prijavljen korisnik.

**Ishod:** Kvar je zvanično evidentiran u sistemu i dostupan koordinatorima za procesuiranje.

---

### Odabir kategorije kvara

**Akter:** Gost / Korisnik 

**Kratak opis:**
Korisnik bira najprikladniju kategoriju za svoj kvar iz predefinisane liste koju kreira i održava administrator.

**Preduslovi:**
- Kategorije kvarova su unesene u sistem.
- Korisnik se nalazi u toku procesa prijave kvara.

**Glavni tok:**
1. Sistem na obrascu prikazuje listu svih dostupnih kategorija u padajućem meniju.
2. Korisnik odabira onu kategoriju koja najbolje opisuje njegov problem (npr. IT, vodoinstalacije, elektro).
3. Sistem po potrebi prikazuje padajući meni s podkategorijama vezanim za glavni izbor.
4. Odabrana kategorija se trajno veže za predmetnu prijavu kvara.

**Alternativni tokovi:**
- **AT-1: Odabir kategorije „Ostalo".** Ako nijedna od ponuđenih kategorija ne odgovara problemu korisnika, korisnik može odabrati opciju „Ostalo" i slobodnim tekstualnim unosom samostalno opisati vrstu kvara.

**Ishod:** Kvar dobija svoju logičku kategorizaciju koja pomaže pri kasnijoj dodjeli pravom serviseru.

---

### Auto-detekcija lokacije

**Akter:** Gost / Korisnik 

**Kratak opis:**
Lokacija kvara može biti unesena automatski putem GPS detekcije uređaja ili ručno od strane korisnika.

**Preduslovi:**
- Korisnik se nalazi u toku procesa prijave kvara.

**Glavni tok:**
1. Sistem kroz preglednik traži odobrenje za pristup korisničkoj lokaciji.
2. Korisnik prihvata zahtjev.
3. Sistem očitava geografske koordinate uređaja i vrši pretvorbu u standardnu uličnu adresu.
4. Sistem automatski ispunjava polje za lokaciju unutar obrasca.

**Alternativni tokovi:**
- **AT-1: Ručni unos lokacije.** Korisnik može odbiti automatsku detekciju lokacije ili je preskočiti te lokaciju kvara unijeti ručno direktnim upisom adrese u predviđeno polje na obrascu.

**Ishod:** Lokacija incidenta je evidentirana na obrascu, bilo automatskim ili ručnim putem.

---

## PBI-004 — Planiranje intervencije

**Akter:** Koordinator

**Kratak opis:**
Na temelju prikupljenih prijava, koordinator kreira zvaničnu intervenciju, definira termine, odabira potrebne resurse i planira terenske aktivnosti.

**Preduslovi:**
- Postoji prijavljen i validan kvar u sistemu.
- Koordinator je prijavljen sa svojim korisničkim računom.

**Glavni tok:**
1. Koordinator pregleda detalje novopristigle prijave kvara u listi aktivnih intervencija.
2. Koordinator popunjava obrazac za intervenciju (datum izlaska, procjena trajanja rada i sl.).
3. Koordinator vrši postavljanje prioriteta za novu intervenciju.
4. Koordinator odabira i dodjeljuje adekvatnog servisera za rad.
5. Sistem bilježi radni zadatak i njegov status automatski postavlja na „U procesu".
6. Sistem šalje in-app notifikacije serviseru i korisniku koji je kvar prijavio.

**Alternativni tokovi:**
- **AT-1: Kreiranje intervencije bez prethodne prijave kvara.** Koordinator može kreirati intervenciju samostalno, bez ikakve prijave kvara od strane korisnika, direktno iz menija za planiranje (npr. za planirano preventivno održavanje).

**Ishod:** Intervencija je zvanično formirana, vidljiva je terenskoj ekipi i ubačena u sistemski plan rada.

---

## PBI-005 — Postavljanje prioriteta

**Akter:** Koordinator

**Kratak opis:**
Koordinator vrši rangiranje važnosti obavljanja intervencije kako bi servisni tim prvo reagovao na najurgentnije probleme.

**Preduslovi:**
- Koordinator se nalazi u formi za planiranje intervencije.

**Glavni tok:**
1. Sistem koordinatoru nudi padajući meni s definiranim nivoima prioriteta (Hitan, Visoki, Srednji, Niski).
2. Koordinator na osnovu težine problema bira odgovarajući prioritet.
3. Sistem trajno pridružuje odabrani prioritet intervenciji i odmah prilagođava njenu poziciju na tabelarnom prikazu.

**Alternativni tokovi:**
- **AT-1: Naknadna izmjena prioriteta.** Koordinator može nakon kreiranja intervencije otvoriti njene detalje i promijeniti prethodno postavljeni prioritet ako se okolnosti na terenu promijene, pri čemu sistem odmah ažurira poziciju intervencije na listi.

**Ishod:** Intervencija dobija nivo prioriteta, što aktivira SLA brojače i utiče na njeno mjesto na listi zadataka.

---

## PBI-006 — Dodjela servisera

**Akter:** Koordinator 

**Kratak opis:**
Serviser se može dodijeliti intervenciji ručno od strane koordinatora ili automatski od strane sistema.

**Preduslovi:**
- Postoji formirana, a nedodijeljena intervencija.
- Postoje servisni radnici registrovani u sistemu s aktivnim statusom.

**Glavni tok:**
1. Koordinator pregleda listu dostupnih servisera s prikazom njihovog trenutnog opterećenja.
2. Koordinator klikom selektuje jednog ili više servisera pogodnih za terenski izlazak.
3. Sistem dodjeljuje odabrane servisere na predmetnu intervenciju.
4. Sistem šalje in-app notifikaciju odabranom osoblju o novom zaduženju.

**Alternativni tokovi:**
- **AT-1: Automatska dodjela servisera.** Umjesto ručnog odabira, koordinator može aktivirati opciju automatske raspodjele pri čemu sistem sam odabire najprikladnijeg servisera prema definisanim pravilima (broj aktivnih intervencija, dostupnost), a koordinator zadržava mogućnost ručnog override-a.

**Ishod:** Odgovorna lica su imenovana i intervencija dobija svog izvršioca posla na terenu.

---

## PBI-008 — Praćenje i izmjena statusa intervencije

**Akter:** Koordinator, Serviser

**Kratak opis:**
Ovlaštena lica mijenjaju sistemski status intervencije kako bi svi korisnici sistema imali uvid u stvarno stanje na terenu.

**Preduslovi:**
- Intervencija je evidentirana i dostupna u bazi.
- Korisnik ima privilegije za promjenu statusa.

**Glavni tok:**
1. Koordinator otvara ekran s detaljima specifične intervencije iz liste aktivnih intervencija.
2. Sistem prikazuje njen trenutni status te nudi listu dozvoljenih budućih statusa.
3. Koordinator bira novi status i spašava promjenu.
4. Sistem upisuje zapis u audit log o tome ko je i kada promijenio status.
5. Sistem šalje notifikacije svim involviranim akterima o promjeni.

**Alternativni tokovi:**
- **AT-1: Serviser mijenja status intervencije.** Umjesto koordinatora, serviser može direktno iz svog pregleda zadataka otvoriti intervenciju koja mu je dodijeljena i promijeniti njen status (npr. iz „U procesu" u „Završeno") nakon obavljenog posla na terenu.

**Ishod:** Intervencija dobija stvarni prikaz svog napretka koji je vidljiv svim zainteresovanim profilima.

---

## PBI-016 — Dodavanje komentara na intervenciju

**Akter:** Koordinator, Serviser

**Kratak opis:**
Koordinator i serviser mogu dodavati tekstualne komentare na intervenciju radi dodatnog pojašnjenja, evidencije ili prijave kašnjenja.

**Preduslovi:**
- Postoji aktivan predmet/intervencija.
- Akter je prijavljen sa radnim profilom.

**Glavni tok:**
1. Koordinator se pozicionira na tab za komunikaciju unutar forme za intervenciju.
2. U tekstualno polje korisnik unosi komentar vezan za intervenciju.
3. Nakon slanja, sistem prikazuje komentar zajedno sa informacijom o autoru i vremenu objave.
4. Novi komentar je vidljiv svima koji gledaju zadatak na svojim uređajima.

**Alternativni tokovi:**
- **AT-1: Serviser dodaje komentar s terena.** Umjesto koordinatora, serviser može otvoriti intervenciju koja mu je dodijeljena iz svog pregleda zadataka i dodati komentar direktno s terena putem mobilnog uređaja, npr. radi prijave kašnjenja ili problema s opremom.

**Ishod:** Svi dionici imaju sinhroniziranu komunikaciju na datom problemu koja trajno ostaje vidljiva kao historijska dokumentacija.

---

## PBI-026 — Arhiviranje intervencija

**Akter:** Koordinator

**Kratak opis:**
Završene ili otkazane intervencije mogu biti arhivirane ručno od strane koordinatora.

**Preduslovi:**
- Intervencija ima status „Završeno" ili „Otkazano".
- Konfigurisana su globalna pravila arhiviranja u postavkama softvera.

**Glavni tok:**
1. Koordinator pokreće arhiviranje intervencije iz njenog detaljnog prikaza ili putem opcije za masovne akcije.
2. Sistem arhivira odabranu intervenciju.
3. Sistem uklanja arhiviranu intervenciju iz prikaza aktivnih menija.
4. Arhivirana intervencija ostaje dostupna u modulu pretrage za potrebe budućih revizija.

**Ishod:** Interfejs svakodnevnog poslovanja ostaje čist, a arhiva ostaje dostupna za buduće pretrage i revizije.

---

## PBI-022 — Planirana i preventivna održavanja

**Akter:** Koordinator

**Kratak opis:**
Intervencija za preventivno održavanje može biti kreirana automatski od strane sistema prema definisanom rasporedu ponavljanja, ili ručno od strane koordinatora po potrebi.

**Preduslovi:**
- Koordinator je definirao pravilo o vremenskom ciklusu za određeni uređaj.
- Softverski kalendar na serveru uredno funkcioniše.

**Glavni tok:**
1. Koordinator inicira kreiranje intervencije preventivnog održavanja.
2. Unosi ili potvrđuje potrebne podatke na osnovu postojećeg šablona.
3. Sistem generiše nalog i postavlja atribut „Planirani tip“.
4. Koordinator dodjeljuje servisera putem standardizovane procedure.
5. Koordinator može definisati da se intervencija ponavlja u određenim vremenskim intervalima.

**Ishod:** Intervencije preventivnog održavanja se redovno planiraju i izvršavaju, čime se osigurava kontinuirano održavanje uređaja.

---

## PBI-007 — Lista aktivnih intervencija

**Akter:** Koordinator

**Kratak opis:**
Centralni pregled svih otvorenih radnih zadataka koji koordinatoru pruža mogućnost pregleda, sortiranja i filtriranja intervencija, s opcijom prebacivanja na kalendarski ili mapski prikaz.

**Preduslovi:**
- Koordinator je logovan u sistem.
- Softver posjeduje aktivne naloge u stanju obrade.

**Glavni tok:**
1. Koordinator u glavnom meniju bira tab za aktivne intervencije.
2. Sistem učitava bazu i prikazuje popis intervencija s podacima o statusu i dodjeljenom serviseru.
3. Koordinator klika po zaglavljima tabele, sortira i primjenjuje filtere za izdvajanje radova od jedne vrste.

**Alternativni tokovi:**
- **AT-1: Pregled intervencija putem kalendarskog prikaza.** Umjesto tabelarnog prikaza, koordinator može prebaciti pogled na kalendarski prikaz gdje su intervencije organizovane po datumima i terminima.
- **AT-2: Pregled intervencija putem mapskog prikaza.** Koordinator može prebaciti pogled na geografski/mapski prikaz gdje su intervencije prikazane kao pinovi na mapi prema lokaciji.

**Ishod:** Operativni podaci su pregledno organizovani, što omogućava brže i efikasnije upravljanje tokom radnih procesa.

---

## PBI-017 — Napredna pretraga

**Akter:** Koordinator 

**Kratak opis:**
Višekriterijski mehanizam pretrage svih intervencija kojim koordinator precizno može pronaći konkretan zapis iz velikog skupa podataka.

**Preduslovi:**
- Koordinator se nalazi unutar modula pretrage ili tabelarnog ispisa intervencija.

**Glavni tok:**
1. Koordinator klikće ikonu za naprednu pretragu.
2. Koordinator sastavlja upit presjekom varijabli: datum, status, ime servisera, regija.
3. Sistem pretražuje bazu i vraća rezultate na ekran.
4. Koordinator može podatke eksportovati.

**Ishod:** Traženi zapis je precizno pronađen i dostupan koordinatoru za dalju obradu.

---

## PBI-020 — Kalendarski prikaz intervencija

**Akter:** Koordinator

**Kratak opis:**
Koordinator može pregledati intervencije u kalendarskom prikazu organizovanim po datumima, kao alternativu tabelarnom prikazu liste.

**Preduslovi:**
- Koordinator je prijavljen s odgovarajućim ovlastima.
- Intervencije posjeduju naznačene vremenske rokove.

**Glavni tok:**
1. Koordinator odabira meni „Kalendar" iz navigacije.
2. Sistem iscrtava mapirane datume i smješta vizualni blok za svaki nalog na odgovarajući datum.
3. Koordinator bira širinu pogleda (pregled po mjesecu ili po satu tokom sedmice).
4. Koordinator klikće na blok zadatka i prikazuju mu se detalji intervencije.

**Alternativni tokovi:**
- **AT-1: Izmjena termina intervencije putem Drag-And-Drop tehnike.** Umjesto otvaranja detalja i ručne promjene datuma u formi, koordinator može direktno povući blok intervencije na novi datum u kalendaru, pri čemu sistem automatski ažurira rok u bazi.

**Ishod:** Pregledan prikaz raspoloživog i zakazanog vremenskog fonda radnika i njihovih zadataka.

---

## PBI-034 — Geografski / mapski prikaz

**Akter:** Koordinator

**Kratak opis:**
Kartografski interfejs unutar aplikacije na kom su intervencije prikazane kao pinovi na mapi prema lokaciji kvara.

**Preduslovi:**
- Baza pohranjuje validne GPS koordinate aktivnih intervencija.
- Koordinator je prijavljen i na mreži.

**Glavni tok:**
1. Koordinator odabira tab „Mape" iz navigacije.
2. Sistem iscrtava geografsku mapu terena s otvorenim prijavama prikazanim kao interaktivni pinovi.
3. Koordinator klikće na pin i dobija sažetak dokumentacije intervencije direktno na karti.
4. Koordinator može filtrirati evidencije.

**Ishod:** Koordinator ima jasan vizuelni pregled svih aktivnih intervencija, što omogućava efikasnije planiranje ruta i donošenje operativnih odluka.

---

## PBI-011 — Historija intervencija (po lokaciji / uređaju)

**Akter:** Koordinator

**Kratak opis:**
Pregled prethodnih intervencija filtriranih po lokaciji ili uređaju, radi boljeg razumijevanja uzroka i ponavljanja kvarova.

**Preduslovi:**
- Koordinator je prijavljen u sistem.
- U sistemu postoje pohranjeni podaci o prethodnim intervencijama za odabranu lokaciju ili uređaj.

**Glavni tok:**
1. Koordinator pristupa meniju za pretragu i odabire lokaciju ili uređaj.
2. Sistem prikazuje listu svih prethodnih intervencija vezanih za odabrani kriterij.
3. Koordinator filtrira i sortira rezultate prema tipu kvara ili vremenskom periodu.
4. Koordinator otvara željenu intervenciju i pregledava njene detalje.

**Alternativni tokovi:**
- **AT-1: Pristup historiji direktno iz detalja intervencije.** Umjesto pretrage po lokaciji kroz zasebni meni, koordinator može unutar otvorene intervencije kliknuti na lokaciju ili uređaj i sistem mu direktno prikazuje historiju svih prethodnih intervencija na toj istoj lokaciji.

**Ishod:** Koordinator ima uvid u historiju intervencija, što omogućava lakše prepoznavanje ponavljajućih problema i donošenje informisanih odluka.

---

## PBI-021 — Pregled dostupnosti servisera

**Akter:** Koordinator

**Kratak opis:**
Kontrolna ploča raspoloživosti servisera koja koordinatoru pruža uvid u opterećenost svakog zaposlenika pri donošenju odluka o dodjeli zadataka.

**Preduslovi:**
- Koordinator je prijavljen s odgovarajućim pravima.
- Baza sadrži podatke o raspoloživim serviserima.

**Glavni tok:**
1. Koordinator otvara pregled raspoloživosti servisera iz navigacije.
2. Sistem prikazuje tabelu s listom servisera, njihovim aktivnim angažmanima i statusom.
3. Koordinator može filtrirati listu po vještini ili tipu posla.

**Alternativni tokovi:**
- **AT-1: Pregled dostupnosti unutar forme za dodjelu servisera.** Umjesto otvaranja zasebnog modula, koordinator može pregledati dostupnost servisera direktno unutar forme za planiranje intervencije, gdje sistem prikazuje sortiranu listu servisera s manje aktivnih intervencija na vrhu.

**Ishod:** Jasno uravnotežena raspodjela zadataka među serviserima, uz smanjen rizik od preopterećenja pojedinaca i propuštanja dodjela.

---

## PBI-014 — Menadžment dashboard

**Akter:** Menadžment, Koordinator

**Kratak opis:**
Centralizirani prikaz ključnih pokazatelja uspješnosti koji omogućava praćenje poslovanja i evaluaciju performansi servisera kroz automatski generisane analze.

**Preduslovi:**
- Baza sadrži historijske podatke o intervencijama.
- Korisnik ima pristup s menadžerskom ili koordinatorskom ulogom.

**Glavni tok:**
1. Korisnik iz navigacije otvara „Dashboard Analytics“.
2. Sistem automatski obrađuje i prikazuje ključne metrike: broj otvorenih, završenih i zakašnjelih naloga, prosječno trajanje intervencija i performanse servisera.
3. Korisnik bira željeni vremenski period (npr. mjesečni pregled).
4. Korisnik eksportuje izvještaj u PDF format po potrebi.

**Ishod:** Pravovremen i pregledan uvid u poslovanje i rad servisera, uz smanjenu potrebu za ručnom obradom podataka.

---

## PBI-009 — Pregled zadataka servisera

**Akter:** Serviser, Koordinator

**Kratak opis:**
Serviser pregledava listu intervencija koje su mu dodijeljene. Koordinator može pregledati zadatke bilo kojeg servisera.

**Preduslovi:**
- Serviser ima prijavljen račun u radnom okruženju.
- Koordinator ili sistem auto-raspodjele dodijelio je nalog serviseru.

**Glavni tok:**
1. Serviser otvara opciju „Zadaci" iz navigacije na svom uređaju.
2. Sistem prikazuje sve naloge dodijeljene isključivo tom serviseru s lokacijom, prioritetom i rokom.
3. Serviser sortira listu po prioritetu i odabira nalog koji treba hitno riješiti.
4. Serviser otvara detalje naloga i pregleda upute i opis intervencije.

**Alternativni tokovi:**
- **AT-1: Koordinator pregledava zadatke servisera.** Umjesto da serviser sam pregleda svoje zadatke, koordinator može iz svog pregleda odabrati konkretnog servisera i vidjeti sve naloge koji su mu dodijeljeni, radi planiranja ili preraspodjele.

**Ishod:** Serviser ima jasan i pregledan uvid u dodijeljene zadatke, što omogućava efikasno planiranje i određivanje prioriteta pri izvršavanju intervencija.

---

## PBI-010 — Evidencija izvještaja o intervenciji

**Akter:** Serviser

**Kratak opis:**
Serviser dokumentira ishod intervencije: opis obavljenih radova, utrošeni materijal i napomene za organizaciju.

**Preduslovi:**
- Fizički rad na lokaciji je u toku ili je završen.
- Sistemski status intervencije je „U procesu".

**Glavni tok:**
1. Serviser otvara tab „Izvještaj" unutar naloga na svom uređaju.
2. Serviser upisuje opis obavljenih radova na terenu.
3. Serviser unosi nazive i količine utrošenih rezervnih dijelova.
4. Serviser u sekciji preporuka opisuje uvid o daljnjem održavanju.
5. Serviser pritiska „Spremi" te sistem automatski mijenja status naloga na „Završen".

**Alternativni tokovi:**
- **AT-1: Spašavanje izvještaja kao nacrta.** Umjesto finalnog submitovanja, serviser može u toku pisanja izvještaja odabrati opciju „Spremi kao nacrt" ako mora privremeno napustiti lokaciju, pri čemu sistem čuva uneseni tekst ali nalog ostaje u statusu „U procesu" sve dok serviser ne finalizira i pošalje izvještaj.

**Ishod:** Kreiran i evidentiran servisni izvještaj koji jasno dokumentuje izvršene radove i utrošene resurse, čime se osigurava transparentnost prema timu i klijentu te validna osnova za fakturisanje.

---

## PBI-033 — Pregled i upravljanje attachmentima

**Akter:** Administrator, Koordinator

**Kratak opis:**
Centralizirani pregled fajlova priloženih uz prijave kvarova, uz mogućnost validacije i uklanjanja nepotrebnog ili neispravnog sadržaja.

**Preduslovi:**
- Korisnik ima administracijska prava.
- Uz naloge su priloženi i fajlovi.

**Glavni tok:**
1. Administrator otvara pregled priloženih fajlova u sistemu.
2. Sistem prikazuje listu fajlova sa metapodacima (autor, datum i vrijeme uploada).
3. Administrator pregledava fajlove radi provjere sadržaja.
4. Administrator identifikuje i trajno briše nepotrebne ili oštećene fajlove.

**Alternativni tokovi:**
- **AT-1: Koordinator pregledava attachmente kroz detalje intervencije.** Umjesto pristupa centralnom administrativnom modulu, koordinator može pregledati fajlove priložene uz konkretnu intervenciju direktno iz njenog detaljnog prikaza.

**Ishod:** Održavan uredan i relevantan skup priloga, uz optimizirano korištenje prostora i pouzdanost podataka.

---

## PBI-023 — Export podataka (PDF)

**Akter:** Koordinator, Menadžment

**Kratak opis:**
Pretvorba seta podataka iz sistema u PDF dokument za upotrebu s institucijama koje nemaju direktan pristup sistemu.

**Preduslovi:**
- Aktiviran i valjan prijavni nalog menadžerske ili koordinatorske uloge.
- Podaci su filtrirani i prikazani na ekranu.

**Glavni tok:**
1. Koordinator ili menadžment filtrira željene intervencije ili analitiku.
2. Korisnik pritiska komandu „Generiši PDF izvještaj".
3. Sistem generira PDF dokument.
4. Gotov PDF je dostupan korisniku za preuzimanje.

**Alternativni tokovi:**
- **AT-1: Export direktno iz menadžment dashboarda.** Umjesto exporta iz liste intervencija, menadžment može pokrenuti export direktno iz dashboarda gdje su prikazane KPI metrike i statistike, pri čemu sistem generiše izvještaj s analitičkim podacima umjesto liste intervencija.

**Ishod:** Generisan i preuzet PDF izvještaj koji omogućava jednostavnu razmjenu, arhiviranje i daljnju upotrebu podataka iz sistema izvan same aplikacije.

---

## PBI-036 — Feedback po završetku intervencije

**Akter:** Gost / Korisnik 

**Kratak opis:**
Korisnik koji je prijavio kvar dobija mogućnost ocjene završene intervencije, čime organizacija dobija mjerljiv pokazatelj zadovoljstva.

**Preduslovi:**
- Status intervencije je promijenjen na „Završeno".
- Korisnik je primio in-app notifikaciju s pozivom na feedback.

**Glavni tok:**
1. Korisnik otvara poziv za feedback iz notifikacije.
2. Korisnik aktivira obrazac za ocjenjivanje.
3. Korisnik bira broj zvjezdica (1–5) i opcionalno upisuje tekstualni komentar.
4. Ocjena se veže za konkretnog servisera i nalog.
5. Sistem ažurira KPI metrike na dashboardu.

**Alternativni tokovi:**
- **AT-1: Ostavljanje feedbacka direktno iz pregleda intervencije.** Umjesto putem notifikacije, korisnik može otvoriti završenu intervenciju iz svog pregleda i ostaviti feedback direktno iz njenih detalja, bez potrebe da ide putem notifikacijske poruke.

**Ishod:** Prikupljen i evidentiran feedback korisnika koji omogućava mjerenje zadovoljstva, praćenje kvaliteta rada servisera i unapređenje usluga.

---

## PBI-039 — Blokiranje korisnika

**Akter:** Koordinator

**Kratak opis:**
Koordinator može blokirati korisnika za kojeg procijeni da se radi o spamu ili zloupotrebi sistema.

**Preduslovi:**
- Profil koordinatora posjeduje odgovarajuće sigurnosne ovlasti.
- Korisnik kojeg treba blokirati je evidentiran u sistemu.

**Glavni tok:**
1. Koordinator otvara profil korisnika iz pregleda intervencija.
2. Koordinator odabira opciju „Blokiraj korisnika" i bira obrazloženje sankcije.
3. Sistem traži potvrdu akcije.
4. Koordinator potvrđuje i sistem odmah onemogućava korisniku slanje novih prijava.

**Alternativni tokovi:**
- **AT-1: Blokiranje korisnika direktno iz liste intervencija.** Umjesto otvaranja profila korisnika, koordinator može blokirati korisnika direktno iz kontekstnog menija na konkretnoj sumnjivoj prijavi kvara, bez navigiranja na korisnički profil.

**Ishod:** Spriječena zloupotreba sistema kroz onemogućavanje daljnjih prijava od strane nepoželjnih korisnika, čime se osigurava pouzdan i stabilan rad sistema.
---

## PBI-027 — Kreiranje tiketa za podršku

**Akter:** Gost / Korisnik

**Kratak opis:**
Korisnik može kreirati tiket za korisničku podršku vezan za softverske ili account probleme.

**Preduslovi:**
- Korisnik je logovan u sistem.
- Problem je softverske ili account prirode, a ne servisne.

**Glavni tok:**
1. Korisnik navigira na stranicu „Podrška" iz navigacije.
2. Korisnik popunjava formular s opisom problema i odabire kategoriju upita.
3. Sistem kreira karticu tiketa i dodjeljuje status „Otvoreno".
4. Sistem šalje notifikaciju agentu IT podrške o novom tiketu.

**Alternativni tokovi:**
- **AT-1: Kreiranje tiketa putem help widgeta.** Umjesto navigiranja na zasebnu stranicu Podrške, korisnik može otvoriti tiket putem help widgeta koji je dostupan kao plutajuće dugme za pomoć na svakoj stranici u sistemu.

**Ishod:** Kreiran i evidentiran tiket koji omogućava strukturirano praćenje i pravovremeno rješavanje korisničkih problema od strane podrške.

---

## PBI-028 — Dvosmjerna komunikacija na tiketu

**Akter:** Gost / Korisnik, Tim podrške 

**Kratak opis:**
Integrisana komunikacija unutar tiketa koja omogućava direktnu i preglednu razmjenu poruka između korisnika i tima podrške.

**Preduslovi:**
- Tiket je kreiran i aktivan u sistemu.

**Glavni tok:**
1. Agent podrške otvara tiket i pregleda opis problema.
2. Agent unosi odgovor u komunikacijski prostor tiketa i šalje poruku.
3. Sistem šalje in-app notifikaciju korisniku o novoj poruci.
4. Sistem evidentira kompletnu komunikaciju unutar historije tiketa.
5. Agent označava tiket kao riješen, nakon čega se tiket uklanja s liste aktivnih.

**Alternativni tokovi:**
- **AT-1: Korisnik sam zatvara tiket.** Umjesto da agent zatvori tiket, korisnik može sam označiti tiket kao riješen direktno iz komunikacijskog prostora, ukoliko više nema potrebe za daljnjom podrškom.

**Ishod:** Evidentirana i centralizirana komunikacija koja omogućava efikasno praćenje i rješavanje korisničkih upita bez oslanjanja na vanjske kanale.

---

## PBI-013 — Upravljanje korisničkim računima 

**Akter:** Administrator

**Kratak opis:**
Upravljanje svim profilima i rolama u sistemu putem mehanizma upravljanja pristupom baziranog na ulogama.

**Preduslovi:**
- Administrator je prijavljen s administratorskim ovlastima.

**Glavni tok:**
1. Administrator otvara panel za upravljanje korisničkim računima.
2. Sistem prikazuje grid listu svih korisnika u sistemu.
3. Administrator dodaje novog korisnika, unosi firmu i dodjeljuje ulogu.
4. Sistem kreira račun i logira akciju u audit log.

**Alternativni tokovi:**
- **AT-1: Uređivanje postojećeg korisničkog računa.** Umjesto kreiranja novog računa, administrator može odabrati postojećeg korisnika s liste i izmijeniti mu podatke, ulogu ili firmu, kao i deaktivirati ili obrisati račun ako je potrebno.

**Ishod:** Omogućeno sigurno i kontrolisano upravljanje korisničkim računima i ulogama, uz potpunu evidenciju svih izmjena kroz audit log.

---

## PBI-032 — Upravljanje kategorijama kvarova

**Akter:** Administrator

**Kratak opis:**
Administrator dodaje, uređuje i deaktivira kategorije kvarova koje se prikazuju korisnicima pri prijavi kvara.

**Preduslovi:**
- Administrator je logovan u sistem.

**Glavni tok:**
1. Administrator otvara meni za upravljanje kategorijama kvarova.
2. Administrator kreira novu kategoriju (npr. voda, elektro, klima).
3. Sistem aktivira kategoriju i čini je dostupnom korisnicima u obrascu.

**Alternativni tokovi:**
- **AT-1: Uređivanje ili deaktiviranje postojeće kategorije.** Umjesto kreiranja nove kategorije, administrator može odabrati postojeću kategoriju s liste te je preimenovati, izmijeniti ili deaktivirati, pri čemu deaktivacija sklanja kategoriju s novih obrazaca ali čuva sve historijske prijave pod tom kategorijom netaknutima.

**Ishod:** Održavana ažurna i fleksibilna struktura kategorija koja omogućava dosljednu klasifikaciju kvarova bez narušavanja historijskih podataka.

---

## PBI-035 — Konfiguracija SLA rokova

**Akter:** Administrator

**Kratak opis:**
Administrator definiše vremenske rokove po prioritetima kvarova koji se koriste za praćenje i generisanje SLA upozorenja.

**Preduslovi:**
- Administrator je prisutan u sistemu.
- Liste kategorija kvarova su popunjene.

**Glavni tok:**
1. Administrator otvara postavke SLA rokova.
2. Administrator unosi vremenske rokove po prioritetima (Hitan / Visok / Srednji / Nizak).
3. Sistem sprema nove vrijednosti i potvrđuje izmjene.
4. Definisani rokovi se automatski primjenjuju na nove naloge.

**Ishod:** Jasno definisani vremenski okviri koji omogućavaju praćenje rokova i pravovremeno reagovanje na kašnjenja.

---

## PBI-026 Konfiguracija arhiviranja

**Akter:** Administrator

**Kratak opis:**
Administrator definiše pravila za automatsko arhiviranje završenih ili otkazanih intervencija nakon određenog vremenskog perioda.

**Preduslovi:**
- Administrator je prijavljen u sistem.

**Glavni tok:**
1. Administrator otvara postavke arhiviranja.
2. Administrator definiše broj dana nakon zatvaranja naloga.
3. Administrator potvrđuje izmjene.
4. Sistem automatski arhivira naloge prema definisanim pravilima.

**Ishod:** Održavan pregledan i optimizovan skup aktivnih naloga kroz automatsko arhiviranje zastarjelih zapisa.