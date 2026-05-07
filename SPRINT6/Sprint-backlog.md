# Sprint Backlog - Sprint 6

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-004** | Planiranje intervencija | Lamija Bojić | Done | Koordinator kreira i zakazuje intervenciju; moguće i bez veze na prijavu kvara; detalji izmjenjivi dok je status Otvoreno ili U procesu |
| **PBI-005** | Postavljanje prioriteta intervencije | Iman Šehić | Done | Prioritet obavezan pri kreiranju; vizualna razlika po razinama |
| **PBI-006** | Dodjela servisera intervenciji | Ismail Mujanović | Done | Lista servisera sortirana po broju aktivnih zadataka; mogućnost izmjenee dodjele |
| **PBI-007** | Pregled liste aktivnih intervencija | Emina Hadžić | Done | Centralni operativni ekran; sortiranje po prioritetu; filtriranje po statusu, tipu, dodjeljnosti |
| **PBI-011** | Historija intervencija — dostupno serviserima kao ispomoć | Dalila Tanković | Done | Tabelarni prikaz završenih intervencija po lokaciji/uređaju; serviser može provjeriti historijat na terenu; grafički prikazi nisu u MVP-u |
| **PBI-013** | Upravljanje korisničkim računima (Admin) | Kerim Hajdar | Done | Kreiranje, izmjena, deaktivacija i reaktivacija računa; dodjela uloga i firme; audit log; RBAC; izvorno planirano za Sprint 8 — ubrzano zbog potrebe PBI-006 |
| **PBI-016** | Komentari intervencije | Lejla Gičević | Done | Koordinator i serviser dodaju komentare; kronološki prikaz; autor, datum i vrijeme uz svaki komentar |
| **PBI-033** | Pregled i upravljanje attachmentima | Nedim Omanović | Done | Pregled, preuzimanje i brisanje fajlova priloženih u PBI-003; admin konfigurira dozvoljene tipove i max veličinu; audit log brisanja |

---

## User Stories

### PBI-004 – Planiranje intervencija

**Story 1 –** Kao **koordinator**, želim **kreirati i zakazati intervenciju na osnovu primljene prijave kvara**, kako bih **osigurao organiziran i pravovremen odgovor tima uz jasno definisan vremenski okvir**.

**Story 2 –** Kao **koordinator**, želim **kreirati intervenciju i bez prethodno prijavljenog kvara**, kako bih **mogao planirati preventivna ili redovna održavanja koja nisu nastala kao reakcija na kvar korisnika**.

**Story 3 –** Kao **koordinator**, želim **naknadno izmijeniti detalje intervencije dok je u statusu "Otvoreno" ili "U procesu"**, kako bih **mogao reagovati na promjenu okolnosti bez gubljenja historijata originalnog plana**.

---

### PBI-005 – Postavljanje prioriteta intervencije

**Story 1 –** Kao **koordinator**, želim **dodijeliti i po potrebi izmijeniti prioritet svake intervencije**, kako bih **osigurao da terenski tim uvijek radi na najhitnijim zadacima i da lista intervencija bude smisleno rangirana**.

**Story 2 –** Kao **administrator sistema**, želim **definirati vremenski rok za rješavanje intervencija za svaki nivo prioriteta**, kako bih **uspostavio mjerljive standarde usluge koji služe kao osnova za automatska upozorenja o kašnjenju**.

**Story 3 –** Kao **koordinator**, želim **biti automatski upozoren ako intervencija nije riješena do definisanog SLA roka**, kako bih **mogao pravovremeno intervenirati i prerasporediti resurse**.

---

### PBI-006 – Dodjela servisera intervenciji

**Story 1 –** Kao **koordinator**, želim **dodijeliti jednog ili više servisera otvorenoj intervenciji**, kako bih **jasno rasporedio odgovornost i osigurao da pravi ljudi znaju koji zadatak trebaju obaviti**.

**Story 2 –** Kao **koordinator**, želim **pri dodjeli intervencije vidjeti listu servisera sortiranu po broju aktivnih zadataka**, kako bih **lako prepoznao koji su serviseri trenutno manje opterećeni i mogli primiti novi zadatak bez kompromitiranja tekućih**.

**Story 3 –** Kao **koordinator**, želim **moći izmijeniti ili ukloniti dodijeljenog servisera i nakon što je dodjela izvršena**, kako bih **mogao reagovati na iznenadnu nedostupnost servisera ili promjenu prioriteta bez kreiranja nove intervencije**.

---

### PBI-007 – Pregled liste aktivnih intervencija

**Story 1 –** Kao **koordinator**, želim **pregledati sve aktivne intervencije rangirane po prioritetu i filtrirane po statusu, tipu ili dodjeljnosti**, kako bih **u svakom trenutku imao jasnu sliku aktuelnog stanja na terenu i znao gdje je potrebna moja pažnja**.

**Story 2 –** Kao **menadžment**, želim **pregledati aktivne intervencije bez mogućnosti izmjene**, kako bih **imao ažuran uvid u operativno stanje bez rizika od slučajnih izmjena podataka**.

**Story 3 –** Kao **koordinator**, želim **kombinovati više filtera istovremeno (status + tip + dodjeljeni serviser)**, kako bih **brzo suzio pregled na samo one intervencije koje zahtijevaju moju pažnju u datom trenutku**.

---

### PBI-011 – Historija intervencija po lokaciji/uređaju

**Story 1 –** Kao **serviser**, želim **na terenu brzo provjeriti da li je isti kvar na ovoj lokaciji bio prijavljen ranije i šta je tada urađeno**, kako bih **fokusirao istragu na sistemski uzrok, a ne površinski simptom**.

---

### PBI-013 – Upravljanje korisničkim računima (Admin)

**Story 1 –** Kao **administrator sistema**, želim **kreirati nove korisničke račune i izmijeniti postojeće podatke (ime, email, uloga, firma)**, kako bih **osigurao da sistem uvijek odražava stvarno stanje organizacije**.

**Story 2 –** Kao **administrator sistema**, želim **deaktivirati korisnički račun bez brisanja i naknadno ga reaktivirati**, kako bih **osigurao da bivši zaposlenici odmah izgube pristup, ali historijat njihovog rada ostane sačuvan u sistemu**.

**Story 3 –** Kao **sistem**, moram **spriječiti brisanje korisnika koji ima vezane aktivne intervencije i spriječiti admina da deaktivira vlastiti račun**, kako bih **zaštitio integritet podataka i spriječio slučajno zaključavanje sistema**.

---

### PBI-016 – Komentari intervencije

**Story 1 –** Kao **koordinator**, želim **dodati tekstualni komentar na intervenciju**, kako bih **ostavio važne napomene ili pojašnjenja koja se ne uklapaju u standardna polja forme**.

**Story 2 –** Kao **serviser**, želim **komentarom prijaviti kašnjenje ili neočekivanu komplikaciju na terenu**, kako bih **koordinatoru dao ažurnu informaciju bez telefonskog poziva, a napomena ostala trajno vezana za intervenciju**.

---

### PBI-033 – Pregled i upravljanje attachmentima

**Story 1 –** Kao **koordinator ili administrator**, želim **pregledati i preuzeti sve fajlove priložene uz intervenciju**, kako bih **imao potpun uvid u dokumentaciju vezanu za konkretni kvar**.

**Story 2 –** Kao **administrator**, želim **definirati dozvoljene tipove fajlova i maksimalnu veličinu, te moći obrisati neodgovarajući attachment**, kako bih **osigurao da sistem ne sadrži neprihvatljive ili zlonamjerne datoteke**.


## Acceptance Criteria

### PBI-004 – Planiranje intervencija
Acceptance Kriteriji
- Koordinator mora imati mogućnost unosa: **naziv, opis, lokacija, vremenski okvir (datum početka i rok završetka) i veza na prijavu kvara**.

- Sistem mora **dozvoliti kreiranje intervencije i bez veze na prijavu kvara** (planirano održavanje).

- Ako koordinator ne unese obavezne podatke, **sistem ne smije sačuvati intervenciju** i mora označiti problematična polja.

- Kada koordinator sačuva intervenciju, **ona mora biti odmah vidljiva u listi aktivnih intervencija** s ispravnim statusom "Otvoreno".

- Sistem mora **prikazati vezu između intervencije i originalne prijave kvara** tamo gdje postoji.

- Koordinator mora moći **naknadno izmijeniti detalje intervencije** dok je status "Otvoreno" ili "U procesu".

- Svaka kreirana intervencija mora biti **evidentirana s vremenskom oznakom kreiranja** i korisničkim imenom koordinatora.

---

### PBI-005 – Postavljanje prioriteta intervencije
Acceptance Kriteriji – Prioritet

- Koordinator mora imati mogućnost odabira prioriteta iz **padajućeg menija: Hitan, Visok, Normalan, Nizak**.

- **Prioritet je obavezno polje** – sistem ne smije dozvoliti čuvanje intervencije bez njega.

- Kada koordinator naknadno promijeni prioritet, **sistem mora zabilježiti promjenu** s vremenskom oznakom i imenom korisnika.

- Lista aktivnih intervencija mora biti **automatski sortirana po prioritetu** (Hitan > Visok > Normalan > Nizak), a unutar istog prioriteta po datumu kreiranja (starije prve).

- Korisnik treba **vizualno razlikovati prioritete** u listi (boja ili ikona) bez otvaranja detalja.

- Sistem ne smije dozvoliti postavljanje prioriteta koji nije u listi predviđenih opcija.

Acceptance Kriteriji – SLA konfiguracija

- Admin mora imati pristup **stranici za konfiguraciju SLA rokova** s poljem za svaki nivo prioriteta.

- Admin mora moći **unijeti vremenski rok u satima** za svaki nivo (npr. Hitan = 2h, Visok = 8h).

- Sistem ne smije dozvoliti **čuvanje SLA konfiguracije s praznim poljem, nulom ili negativnom vrijednošću**.

- Nakon čuvanja, nova SLA konfiguracija mora **odmah biti aktivna** za sve buduće provjere kašnjenja.

- Promjena SLA konfiguracije mora biti **zabilježena u audit logu**.

Acceptance Kriteriji – Upozorenje kašnjenja

- Sistem mora **automatski generisati upozorenje** za svaku intervenciju koja nije u statusu "Završeno" a SLA rok je prošao.

- Upozorenje mora biti **vidljivo koordinatoru** u pregledu (npr. crvena oznaka ili status "Zakašnjenje").

- Sistem mora upozoravati **samo za intervencije s definisanim rokom** – intervencije bez roka ne smiju generisati upozorenja.

- Upozorenje ne smije **automatski promijeniti status intervencije** – samo signalizira problem.

- Sistem mora **ukloniti oznaku upozorenja** čim intervencija prijeđe u status "Završeno".

---
### PBI-006 – Dodjela servisera intervenciji
Acceptance Kriteriji – Dodjela
- Koordinator mora imati **dugme ili sekciju za dodjelu servisera** unutar detalja intervencije.

- Sistem mora prikazati **listu dostupnih servisera** iz koje koordinator može odabrati jednog ili više.

- Kada koordinator sačuva dodjelu, **ime servisera mora biti vidljivo u detalju i u listi** aktivnih intervencija.

- Koordinator mora moći **izmijeniti ili ukloniti dodjelu** servisera i nakon što je postavljena.

- Sistem ne smije dozvoliti dodjelu servisera koji ima **deaktiviran korisnički račun**.

- Sistem mora zabilježiti **ko je izvršio dodjelu i kada** (audit log).

Acceptance Kriteriji – Dostupnost
- Lista servisera mora biti **sortirana po broju aktivnih intervencija** – od najmanje prema najviše opterećenim.

- Uz svako ime servisera, mora biti **vidljiv broj njegovih trenutno aktivnih intervencija**.

- Koordinator mora moći **odabrati bilo kojeg servisera** s liste, bez obzira na broj aktivnih zadataka.

- Lista mora biti **ažurirana u realnom vremenu** ili pri svakom otvaranju prozora za dodjelu.

- Serviseri s **deaktiviranim računom ne smiju biti prikazani** na listi.

- Ako svi serviseri imaju 0 aktivnih intervencija, **lista mora i dalje biti prikazana**.

---

### PBI-007 – Pregled liste aktivnih intervencija
Acceptance Kriteriji

- Sistem mora prikazati **sve aktivne intervencije** (status: Otvoreno, U procesu).

- Lista mora biti **automatski sortirana po prioritetu** (Hitan > Visok > Normalan > Nizak), unutar istog prioriteta po datumu kreiranja.

- Korisnik mora moći **filtrirati intervencije po statusu, tipu i dodjeljnosti** (dodijeljeno / nije dodijeljeno / dodijeljeno određenom serviseru).

- Svaki red u listi mora prikazivati **minimalno**: naziv, prioritet, status, lokaciju, dodjeljenog servisera i datum kreiranja.

- Sistem mora **vizualno razlikovati prioritete** (boja, ikona ili oznaka).

- Kombinovanje više filtera **mora raditi ispravno** – prikazuju se samo intervencije koje zadovoljavaju sve odabrane kriterije.

- Sistem ne smije prikazivati **arhivirane intervencije** u aktivnoj listi.

---

### PBI-011 – Historija intervencija po lokaciji/uređaju
Acceptance Kriteriji
- Koordinator ili serviser mogu **filtrirati historiju intervencija prema lokaciji ili uređaju**.

- Za svaku intervenciju u historiji, sistem mora prikazati **minimalno**: datum, status, sažetak opisa, ime servisera i prioritet.

- Historija mora biti **sortirana od najnovije prema najstarijoj** intervenciji.

- Sistem mora prikazati historiju **samo za završene i arhivirane intervencije**.

- Ako za odabranu lokaciju/uređaj nema prethodnih intervencija, **sistem mora prikazati jasnu poruku**.

- Grafički prikazi i vizualizacije **ne smiju biti implementirani** u MVP verziji.

- Korisnik treba moći **kliknuti na svaku intervenciju u historiji** i otvoriti njene detalje.

---

### PBI-013 – Upravljanje korisničkim računima (Admin)
Acceptance Kriteriji
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

### PBI-016 – Komentari intervencije
Acceptance Kriteriji
- Koordinator i serviser moraju imati **formu za unos komentara** unutar detalja intervencije.

- Svaki komentar mora biti **prikazan s imenom autora, datumom i tačnim vremenom** objave.

- Komentari moraju biti **sortirani kronološki** – konzistentno kroz cijeli sistem.

- Sistem ne smije dozvoliti **prazne komentare** – minimalno jedan karakter.

- Korisnik koji nije koordinator ni serviser **ne smije moći dodavati komentare**.

- Svi komentari moraju ostati **trajno vidljivi** i ne smiju biti automatski brisani.

---

### PBI-033 – Pregled i upravljanje attachmentima
Acceptance Kriteriji
- Koordinator i admin moraju moći **pregledati sve priložene fajlove** (naziv, tip, veličina, datum uploada) u detaljima intervencije.

- Koordinator i admin moraju moći **otvoriti ili preuzeti svaki priloženi fajl** direktno iz sistema.

- Admin mora moći **definisati dozvoljene tipove fajlova i maksimalnu veličinu** u konfiguraciji.

- Sistem mora **odbiti upload fajlova** koji ne odgovaraju dozvoljenim tipovima ili prelaze maksimalnu veličinu – uz jasnu poruku.

- Koordinator ili admin mora moći **obrisati attachment** uz obaveznu potvrdu akcije.

- Sistem mora **zabilježiti ko je i kada obrisao attachment** u audit logu.

- Ako intervencija nema priloženih fajlova, **sekcija attachmenta mora biti prikazana** s odgovarajućom porukom.

---

