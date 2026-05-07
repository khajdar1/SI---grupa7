# Sprint Backlog - Sprint 6

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-004** | Planiranje intervencija | Lamija Bojić | Završeno | Koordinator kreira i zakazuje intervenciju; moguće i bez veze na prijavu kvara; detalji izmjenjivi dok je status Otvoreno ili U procesu |
| **PBI-005** | Postavljanje prioriteta intervencije | Iman Šehić | Završeno | Prioritet obavezan pri kreiranju; vizualna razlika po razinama |
| **PBI-006** | Dodjela servisera intervenciji | Ismail Mujanović | Završeno | Lista servisera sortirana po broju aktivnih zadataka; mogućnost izmjene dodjele |
| **PBI-007** | Pregled liste aktivnih intervencija | Emina Hadžić | Završeno | Centralni operativni ekran; sortiranje po prioritetu; filtriranje po statusu, tipu, dodjeljnosti |
| **PBI-011** | Historija intervencija — dostupno serviserima kao ispomoć | Dalila Tanković | Završeno | Tabelarni prikaz završenih intervencija po lokaciji/uređaju; serviser može provjeriti historijat na terenu; grafički prikazi nisu u MVP-u |
| **PBI-013** | Upravljanje korisničkim računima (Admin) | Kerim Hajdar | Završeno | Kreiranje, izmjena, deaktivacija i reaktivacija računa; dodjela uloga i firme; audit log; RBAC; izvorno planirano za Sprint 8 — ubrzano zbog potrebe PBI-006 |
| **PBI-016** | Komentari intervencije | Lejla Gičević | Završeno | Koordinator i serviser dodaju komentare; kronološki prikaz; autor, datum i vrijeme uz svaki komentar |
| **PBI-033** | Pregled i upravljanje attachmentima | Nedim Omanović | Završeno | Pregled, preuzimanje i brisanje fajlova priloženih u PBI-003; admin konfigurira dozvoljene tipove i max veličinu; audit log brisanja |

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