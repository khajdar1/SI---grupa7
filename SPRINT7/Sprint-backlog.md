# Sprint Backlog - Sprint 7

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-014** | Menadžment dashboard | Nedim Omanović | Done | Pregled ključnih pokazatelja: broj aktivnih/završenih intervencija, prosječno vrijeme rješavanja, distribucija po prioritetu |
| **PBI-015** | Upravljanje korisničkim profilom i reset lozinke | Lamija Bojić | Done | Svaki prijavljeni korisnik može pregledati i ažurirati vlastite podatke: ime, kontakt, lozinka |
| **PBI-020** | Kalendarski prikaz intervencija | Ismail Mujanović | Done | Koordinator ima uvid u kalendarski prikaz prijavljenih intervencija |
| **PBI-049** | Upravljanje kompanijama i uloga KompanijaAdmin | Kerim Hajdar | Done | Kao sistem, potrebno je omoguciti samoregistraciju kompanije, admin kreiranje kompanije i uredjivanje podataka kompanije uz novu ulogu `KompanijaAdmin`. `KompanijaAdmin` je korisnik vezan za jednu konkretnu kompaniju i smije upravljati samo profilom te kompanije. Admin zadrzava pravo pregleda i upravljanja svim kompanijama. |
| **PBI-010** | Evidencija izvještaja o intervenciji | Iman Šehić | Done | Serviser dokumentira ishod intervencije: opis obavljenih radova, utrošeni materijal, napomene. Izvještaj se veže za intervenciju.|

---

## User Stories


### PBI-014 – Menadžment dashboard

**Story 1 –** Kao **menadžment**, želim **na jednom ekranu vidjeti broj aktivnih i završenih intervencija te distribuciju po prioritetu**, kako bih **mogao donijeti informirane odluke o raspodjeli resursa bez ručnog prebrojavanja**.

**Story 2 –** Kao **menadžment**, želim **vidjeti prosječno vrijeme rješavanja intervencija**, kako bih **mogao objektivno procijeniti efikasnost tima i identificirati problematična područja**.

**Story 3 –** Kao **sistem**, moram **ograničiti pristup dashboardu isključivo na uloge Menadžment i Admin**, kako bih **spriječio da serviseri imaju uvid u ukupne operativne podatke organizacije**.

---

### PBI-015 – Upravljanje korisničkim profilom i reset lozinke

**Story 1 –** Kao **prijavljeni korisnik**, želim **moći pregledati i ažurirati vlastite kontaktne podatke**, kako bih **osigurao da su moji podaci u sistemu uvijek tačni**.

**Story 2 –** Kao **prijavljeni korisnik**, želim **moći promijeniti lozinku unosom trenutne i nove lozinke**, kako bih **osigurao sigurnost svog računa u slučaju sumnje na kompromitovanje**.

**Story 3 –** Kao **registrirani korisnik koji nije prijavljen**, želim **zatražiti reset lozinke putem emaila**, kako bih **povratio pristup računu bez potrebe za kontaktiranjem administratora**.

---

### PBI-020 - Kalendarski prikaz intervencija

**Story 1 –** Kao **koordinator**, želim **pregledati planirane intervencije u kalendarskom prikazu po danima i sedmicama**, kako bih **imao vizualni uvid u raspoređenost obaveza i brzo identificirao preopterećene periode**.

**Story 2 –** Kao **koordinator**, želim **jednostavno prebaciti između listnog i kalendarskog prikaza i kliknuti na intervenciju u kalendaru da direktno otvorim njen detalj**, kako bih **zadržao kontekst rada bez gubitka produktivnosti pri prelasku između prikaza**.

---

### PBI-049 - Upravljanje kompanijama i uloga KompanijaAdmin

**Story 1 –** Kao **predstavnik kompanije**, zelim **registrovati svoju kompaniju kroz javno dostupnu formu**, kako bi **kompanija mogla zapoceti proces koristenja sistema bez cekanja da admin rucno unese osnovne podatke**.

**Story 2 –** Kao **admin**, zelim **rucno kreirati novu kompaniju i dodijeliti joj odgovornog `KompanijaAdmin` korisnika**, kako bih **mogao dodati kompanije koje se nisu samostalno registrovale i odmah definisati odgovornu osobu**.

**Story 3 –**Kao **admin**, zelim **uredjivati podatke bilo koje kompanije**, kako bih **odrzavao tacne kontakt, statusne i poslovne informacije u sistemu**.

**Story 4 –** Kao **`KompanijaAdmin`**, zelim **uredjivati profil samo svoje kompanije**, kako bih **odrzavao tacne podatke bez pristupa tudjim kompanijama ili globalnim admin funkcionalnostima**.

**Story 5 –** Kao **sistem**, zelim **ograniciti company management funkcionalnosti prema rolama i pripadnosti kompaniji**, kako bih **sprijecio neovlastene izmjene, IDOR propuste i curenje podataka izmedju kompanija**.

---

### PBI-010 - Evidencija izvještaja o intervenciji 
**Story 1 –** Kao **serviser**, želim **po završetku intervencije dokumentirati šta sam uradio i koji materijal sam koristio**, kako bih **ostavio trajnu evidenciju obavljenog rada koja služi koordinatoru, menadžmentu i budućim servisima na istoj lokaciji**.

**Story 2 –** Kao **koordinator ili administrator**, želim **pregledati izvještaj servisera unutar detalja intervencije**, kako bih **imao kompletan uvid u obavljeni rad i mogao potvrditi da je intervencija zaista završena prema planu**.

**Story 3 –** Kao **sistem**, moram **spriječiti unos izvještaja ako intervencija još nije započeta i ne prikazivati polje za troškove u MVP-u**, kako bih **osigurao integritet podataka i opseg MVP verzije**.

---

## Acceptance Criteria


### PBI-014 – Menadžment dashboard

Acceptance Kriteriji
- Dashboard mora prikazivati **broj aktivnih intervencija** (Otvoreno + U procesu).
- Dashboard mora prikazivati **broj završenih intervencija** u tekućem periodu.
- Dashboard mora prikazivati **prosječno vrijeme rješavanja** (od kreiranja do statusa "Završeno").
- Dashboard mora prikazivati **distribuciju intervencija po prioritetu** u tabelarnom formatu.
- Grafički prikazi **ne smiju biti implementirani** u MVP verziji.
- Pristup dashboardu mora biti **ograničen na uloge: Menadžment i Admin**.
- Svi podaci moraju biti **tačni i konzistentni** s podacima u listi intervencija.


### PBI-015 – Upravljanje korisničkim profilom i reset lozinke

Acceptance Kriteriji – Upravljanje profilom
- Svaki prijavljeni korisnik mora imati pristup **stranici Moj profil** s prikazom: ime, prezime, korisničko ime, email adresa.
- Korisnik mora moći **izmijeniti ime, prezime i email adresu** i sačuvati promjene.
- Korisnik mora moći **promijeniti lozinku** unosom trenutne lozinke, a zatim nove (s potvrdom).
- Ako korisnik unese **netačnu trenutnu lozinku**, sistem mora prikazati grešku i odbiti promjenu.
- Sistem ne smije dozvoliti korisniku da **promijeni vlastitu ulogu**.
- Korisnik treba dobiti **jasnu vizualnu potvrdu** da su promjene uspješno sačuvane.
- Promjena lozinke ne smije **odjaviti korisnika** iz aktivne sesije, ali ne smije ni ostaviti staru lozinku aktivnom.

Acceptance Kriteriji – Reset lozinke
- Korisnik mora moći pristupiti **formi za reset lozinke s login stranice** (link "Zaboravili ste lozinku?").
- Kada korisnik unese registrovani email, **sistem mora poslati email s linkom za reset**.
- Ako korisnik unese email koji ne postoji, **sistem ne smije otkriti** postoji li taj email – prikazuje istu neutralnu poruku.
- Reset link mora biti **jednokratan i vremenski ograničen** – nakon upotrebe ili isteka roka, link ne smije biti ponovo upotrebljiv.
- Kada korisnik unese novu lozinku s potvrdom, **sistem mora sačuvati novu lozinku** i invalidirati sve prethodne aktivne sesije.
- Korisnik treba dobiti **potvrdu da je lozinka uspješno resetovana** i biti preusmjeren na login.
- Sistem ne smije dozvoliti **reset lozinke za deaktiviran korisnički račun**.


### PBI-020 - Kalendarski prikaz intervencija

Acceptance Kriteriji
- Koordinator mora moći **prebaciti se između listnog i kalendarskog prikaza**.
- Kalendar mora prikazivati **dnevni, sedmični i/ili mjesečni prikaz** (minimalno jedan).
- Svaka intervencija mora biti **prikazana na datumu koji odgovara planiranom roku ili datumu početka**.
- Klik na intervenciju u kalendaru mora **otvoriti detalj te intervencije**.
- Sistem mora **vizualno razlikovati intervencije po prioritetu** u kalendarskom prikazu.
- Intervencije bez definisanog datuma **ne smiju biti prikazane** u kalendarskom prikazu.


### PBI-049 - Upravljanje kompanijama i uloga KompanijaAdmin

Acceptance Kriteriji - Samoregistracija kompanije
- Gost mora moći **otvoriti javnu formu za registraciju kompanije i unijeti validne osnovne podatke** kako bi sistem kreirao kompaniju ili zahtjev u statusu 'PENDING'.
- Sistem **ne smije kreirati zapis** ako su uneseni nevalidni podaci, već **mora prikazati validacijske greške** uz odgovarajuća polja.
- Sistem **mora odbiti registraciju** ako kompanija sa istim jedinstvenim identifikatorom **već postoji** i prikazati **jasnu poruku o konfliktu**.
- Nakon uspješne registracije, kada sistem završi obradu, korisnik mora dobiti **potvrdu da je zahtjev zaprimljen i da čeka odobrenje admina**.
- Nakon odobravanja zahtjeva, korisnik koji je unio podatke mora biti postavljen kao **KompanijaAdmin** za tu kompaniju.
- Sistem mora **koristiti postojeći Keycloak-based autentifikacijski tok** i ne smije uvoditi poseban paralelni auth sistem za samoregistraciju kompanije.

Acceptance Kriteriji - Admin kreacija kompanije
- Admin mora moći kreirati kompaniju unosom **validnih podataka**, pri čemu se kompanija kreira u statusu **ACTIVE** ili drugom statusu definisanom pravilima sistema.
- Sistem mora omogućiti da admin pri kreiranju kompanije odabere postojećeg korisnika kao **KompanijaAdmin**, pri čemu korisnik **dobija rolu KompanijaAdmin u Keycloak-u** i veza companyId ga povezuje sa kompanijom.
- Ako **admin** unese email korisnika koji **ne postoji**, sistem mora koristiti **postojeći flow** za kreiranje korisnika ili **invitation/reset-password flow** ako je standardizovan u projektu.
- Sistem mora **zabraniti pristup kreiranju kompanije** korisnicima koji nemaju **admin** privilegije i **vratiti 403 Forbidden** odgovor.
- Sistem mora **validirati** podatke prilikom kreiranja kompanije i u slučaju **duplikata** ili **nevalidnih podataka** vratiti **400 Bad Request** ili **409 Conflict** u skladu sa postojećom praksom.

Acceptance Kriteriji - Uredjivanje kompanije od strane admina
- Admin mora moći izmijeniti dozvoljena polja kompanije, pri čemu se izmjene spremaju i evidentiraju u **audit logu**.
- Sistem mora ograničiti izmjenu kritičnih polja i dozvoliti samo polja definisana **DTO/schema** pravilima.
- Ako kompanija **ne postoji**, sistem mora vratiti **404 Not Found** prilikom pokušaja dohvaćanja ili izmjene podataka.
- Admin mora moći **deaktivirati** kompaniju, pri čemu se deaktivirana kompanija više ne koristi u aktivnim procesima, ali historijski podaci ostaju sačuvani.

Acceptance Kriteriji - Uredjivanje kompanije od strane KompanijaAdmin-a
- **KompanijaAdmin** mora moći pristupiti profilu svoje kompanije i uređivati samo dozvoljena polja.
- Sistem mora spriječiti pristup kompaniji koja ne pripada **KompanijaAdmin-u** i vratiti **403 Forbidden** ili **404 Not Found** u skladu sa postojećom praksom.
- Sistem mora onemogućiti izmjenu kritičnih polja kao što su role, status, companyId, ownerId, adminUserId i drugih sistemskih polja, nezavisno od frontend provjera.
- Ako su podaci validni, izmjene profila kompanije moraju biti uspješno sačuvane, a **promjene auditirane ukoliko audit mehanizam postoji**.

Acceptance Kriteriji - Nova rola KompanijaAdmin
- Sistem mora mapirati poslovne role kroz **Keycloak** i omogućiti **dodavanje KompanijaAdmin role kroz centralne konfiguracije**, bez hardkodiranja po frontend ekranima.
- Prilikom kreiranja ili ažuriranja korisnika sa rolom **KompanijaAdmin**, backend mora **validirati da korisnik ima dodijeljen companyId**.
- Korisnik sa rolom **KompanijaAdmin** mora vidjeti samo **dozvoljene rute u navigaciji**, vezane za upravljanje i profil kompanije.
- Ako se koristi **Keycloak realm import**, izmjene konfiguracije moraju biti uključene kroz realm template ili deployment uputu za novu rolu.

Acceptance Kriteriji - Validacija i business rules
- Obavezna polja kompanije validiraju se na frontendu i backendu; backend je izvor istine.
- Naziv kompanije mora ostati jedinstven, a ako se uvedu `email`, `identificationNumber` ili `taxId`, moraju imati **unique provjeru** gdje poslovno pravilo to zahtijeva.
- Email mora imati validan format i maksimalnu duzinu; tekstualna polja moraju imati min/max duzine i odbijati HTML/script sadrzaj.
- Phone number se validira samo ako se uvede kao polje, uz konzistentan format i maksimalnu duzinu.
- Prazne, nevalidne i maliciozne vrijednosti se odbijaju na backendu.
- Frontend onemogucava **duplicate submit** tokom slanja forme.
- **Optimistic UI** se koristi samo ako je vec postojeca praksa na slicnim ekranima; u suprotnom se radi **refresh/load nakon uspjesnog API odgovora**.
- Error poruke su konzistentne sa postojecim **`getApiFieldErrors` i service error patternom**.

Acceptance Kriteriji - Sigurnost i zastita ruta
- Neautentifikovan korisnik dobija **401** za zasticene company management API rute.
- Autentifikovan korisnik bez dozvole dobija **403**.
- Admin ima pristup svim kompanijama.
- **`KompanijaAdmin`** ima pristup samo kompaniji ciji je **`companyId`** vezan za njegov **lokalni korisnicki racun**.
- Obicni korisnik nema pristup **company management funkcionalnostima**.
- Backend provjerava svaku autorizaciju nezavisno od frontend middleware-a i navigacije.
- Backend mora **sprijeciti IDOR** tako sto za `KompanijaAdmin` svaki `:companyId` poredi sa korisnikovim `companyId`.
- Backend mora **sprijeciti mass assignment** kroz `.strict()` schema-e i allowlist polja za create/update DTO-e.
- Kriticna polja kao `role`, `status`, `companyId`, `ownerId` i `adminUserId` ne smiju se direktno mijenjati kroz **self-service update**.
- Izmjene kompanije i promjene `KompanijaAdmin` korisnika evidentiraju se kroz postojeci **`AuditService.record`** pattern ako je tehnicki moguce.

Acceptance Kriteriji - UI/UX
- Koristiti postojece **shared** komponente: `PageLayout`, `PageHeader`, `DataTable`, `EmptyState`, `ConfirmDialog`, `Button`, `Input`, `Select`, `Dialog` i postojece **validation helpere**.
- Admin pogled treba imati listu kompanija, status, odgovornog `KompanijaAdmin` korisnika i akcije za kreiranje/uredjivanje/deaktivaciju.
- `KompanijaAdmin` pogled treba biti **ogranicen** na profil vlastite kompanije i ne smije prikazivati **globalne admin akcije**.
- Loading, error i empty state prate obrazac postojecih admin ekrana.
- Greske iz backend validacije prikazuju se uz odgovarajuca polja gdje je moguce.
- Ne uvoditi nove **UI biblioteke** bez jasnog razloga.

### PBI-010 - Evidencija izvještaja o intervenciji

Acceptance Kriteriji
- Serviser mora imati **formu za unos izvještaja** s poljima: opis obavljenih radova, utrošeni materijal, napomene.
- Sistem mora **vezati izvještaj za konkretnu intervenciju** – nije moguće kreirati izvještaj koji nije vezan za postojeću intervenciju.
- Kada serviser sačuva izvještaj, **sistem mora zabilježiti** ime servisera, datum i tačno vrijeme čuvanja.
- Koordinator i admin moraju moći **pregledati izvještaj** unutar detalja intervencije.
- Sistem mora dozvoliti **dodavanje izvještaja dok je intervencija u statusu "U procesu" ili "Završeno"**.
- Sistem ne smije dozvoliti unos izvještaja **ako intervencija nije započeta**.
- Obračun troškova **ne smije biti dio forme u MVP-u**.
- Korisnik treba dobiti **potvrdu o uspješnom čuvanju** izvještaja.








