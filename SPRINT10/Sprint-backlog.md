# Sprint Backlog - Sprint 10

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-052** | Analitika feedbacka i kvaliteta usluge | Kerim Hajdar | Done | Implementiran pregled trendova ocjena s filterima po periodu, firmi, kategoriji i serviseru; negativni feedback posebno označen |
| **PBI-053** | Upravljanje dostupnošću i odsustvima servisera | Nedim Omanović | Done | Implementirano kreiranje i upravljanje periodima nedostupnosti; prikaz dostupnosti pri dodjeli intervencija |
| **PBI-054** | Potvrda i promjena termina intervencije od strane korisnika | Ismail Mujanović | Done | Implementirana notifikacija pri zakazivanju, potvrda termina i zahtjev za promjenu termina s koordinatorovim pregledom |
| **PBI-055** | Baza znanja i preporučena rješenja za kvarove | Lamija Bojić | Done | Implementirano označavanje finalizovanih izvještaja kao preporučenih; pretraga baze znanja po kategoriji; prikaz relevantnih rješenja na detalju intervencije |
| **PBI-056** | Evidencija materijala utrošenog na intervenciji | Iman Šehić | Done | Implementirana evidencija materijala (naziv, količina, napomena) u sklopu izvještaja; agregirani menadžment pregled po periodu, firmi i kategoriji; bez obračuna cijena |
| **PBI-058** | Eskalacije i komentari ka menadžmentu za rizične intervencije | Lejla Gičević | Done | Implementirano označavanje intervencije kao rizične s obaveznim razlogom; eskalacijski komentari odvojeni od redovnih; menadžment pregled eskalacija |
| **PBI-059** | Zahtjev za ponovnog otvaranje završene intervencije | Emina Hadžić | Done | Implementiran zahtjev za ponovnim otvaranjem s obaveznim obrazloženjem; koordinator prihvata ili odbija uz komentar; historija zahtjeva u intervenciji |
| **PBI-060** | Evidencija dolaska servisera i vremena na terenu | Dalila Tanković | Done | Implementirani checkpointi: krenuo, stigao, završio rad; korisnik i koordinator dobijaju notifikacije; audit log za svaki checkpoint |
| **PBI-061** | Digitalna potvrda izvršene intervencije | Lamija Bojić | Done | Razlikuje se od feedbacka jer predstavlja formalnu potvrdu izvršenja, ne ocjenu kvaliteta |
| **PBI-062** | Pauziranje intervencije zbog blokera | Kerim Hajdar | Done | Uvodi novi poslovni tok između aktivnog rada i završetka; nije isto što i komentar ili otkazivanje |

---

## User Stories

### PBI-052 - Analitika feedbacka i kvaliteta usluge

**Story 1 –** Kao **menadžment**, želim **vidjeti prosječnu ocjenu intervencija po periodu, firmi, kategoriji i serviseru**, kako bih **prepoznao trendove kvaliteta usluge i dijelove procesa koje treba poboljšati**.

**Story 2 –** Kao **koordinator**, želim **brzo otvoriti negativan feedback i povezanu intervenciju**, kako bih **mogao provjeriti šta se desilo i reagovati prema serviseru ili korisniku**.

---

### PBI-053 - Upravljanje dostupnošću i odsustvima servisera

**Story 1 –** Kao **serviser**, želim **unijeti periode kada nisam dostupan za nove intervencije**, kako bih **spriječio dodjelu zadataka dok sam na odsustvu, bolovanju ili drugoj obavezi**.

**Story 2 –** Kao **koordinator**, želim **pri dodjeli intervencije vidjeti dostupnost servisera zajedno s trenutnim opterećenjem**, kako bih **realnije rasporedio posao i izbjegao kašnjenja**.

---

### PBI-054 - Potvrda i promjena termina intervencije od strane korisnika

**Story 1 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti obavijest o zakazanom terminu i potvrditi da mi termin odgovara**, kako bih **smanjio nesporazume i nepotrebne izlaske servisera na teren**.

**Story 2 –** Kao **korisnik**, želim **zatražiti promjenu termina uz kratko obrazloženje**, kako bih **mogao uskladiti intervenciju sa svojom dostupnošću**.

**Story 3 –** Kao **koordinator**, želim **vidjeti zahtjeve za promjenu termina na jednom mjestu**, kako bih **brzo odlučio da li prihvatam novi termin ili predlažem alternativu**.

---

### PBI-055 - Baza znanja i preporučena rješenja za kvarove

**Story 1 –** Kao **serviser**, želim **vidjeti ranija rješenja za istu kategoriju kvara ili sličnu lokaciju**, kako bih **brže dijagnosticirao problem i izbjegao ponavljanje istih grešaka**.

**Story 2 –** Kao **koordinator**, želim **označiti kvalitetan finalizovan izvještaj kao preporučeno rješenje**, kako bih **postepeno gradio bazu znanja iz stvarnih intervencija**.

---

### PBI-056 - Evidencija materijala utrošenog na intervenciji

**Story 1 –** Kao **serviser**, želim **unijeti listu materijala koje sam koristio tokom intervencije**, kako bih **ostavio jasnu evidenciju šta je stvarno potrošeno na terenu**.

**Story 2 –** Kao **menadžment**, želim **pregledati potrošnju materijala po periodu, kategoriji i firmi**, kako bih **mogao planirati nabavku i uočiti neuobičajeno visoku potrošnju**.

---

### PBI-058 - Eskalacije i komentari ka menadžmentu za rizične intervencije

**Story 1 –** Kao **koordinator**, želim **označiti intervenciju kao rizičnu i dodati razlog eskalacije**, kako bih **menadžmentu skrenuo pažnju na intervencije koje mogu utjecati na kvalitet usluge ili rokove**.

**Story 2 –** Kao **menadžment**, želim **vidjeti listu eskaliranih intervencija s komentarima koordinatora**, kako bih **mogao pratiti kritične slučajeve bez pretraživanja cijele liste intervencija**.

---

### PBI-059 - Zahtjev za ponovnog otvaranja završene intervencije

**Story 1 –** Kao **korisnik koji je prijavio kvar**, želim **zatražiti ponovnog otvaranja završene intervencije ako problem nije riješen**, kako bih **mogao nastaviti proces bez kreiranja nove prijave za isti kvar**.

**Story 2 –** Kao **koordinator**, želim **pregledati zahtjeve za ponovnim otvaranjem i prihvatiti ili odbiti zahtjev uz komentar**, kako bih **kontrolisao da se stvarni neriješeni kvarovi vrate u rad, a neosnovani zahtjevi evidentiraju**.

**Story 3 –** Kao **serviser**, želim **biti obaviješten kada je moja završena intervencija ponovo otvorena**, kako bih **znao da je potreban dodatni izlazak ili dopuna izvještaja**.

---

### PBI-060 - Evidencija dolaska servisera i vremena na terenu

**Story 1 –** Kao **serviser**, želim **označiti kada sam krenuo prema lokaciji, kada sam stigao i kada sam završio rad na terenu**, kako bih **ostavio tačan operativni trag o izvršenju intervencije**.

**Story 2 –** Kao **koordinator**, želim **vidjeti stvarno vrijeme dolaska i trajanje rada servisera na lokaciji**, kako bih **mogao pratiti kašnjenja, dostupnost tima i kvalitet planiranja**.

**Story 3 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti obavijest kada serviser krene prema lokaciji i kada stigne**, kako bih **znao kada mogu očekivati servis bez dodatnog pozivanja koordinatora**.

---

### PBI-061 - Digitalna potvrda izvršene intervencije

**Story 1 -** Kao **serviser**, želim **nakon završetka rada zatražiti digitalnu potvrdu od korisnika na lokaciji**, kako bih **imao dokaz da je intervencija stvarno predana korisniku prije finalnog zatvaranja**.

**Story 2 -** Kao **korisnik**, želim **potvrditi izvršenje intervencije unosom PIN-a ili potpisom na ekranu**, kako bih **jasno označio da sam upoznat sa zavrsetkom rada, odvojeno od kasnije ocjene usluge**.

**Story 3 -** Kao **koordinator**, želim **vidjeti koje završene intervencije imaju korisničku potvrdu, a koje su zatvorene bez potvrde uz razlog**, kako bih **lakše provjerio sporne ili nepotpune slučajeve**.

---

### PBI-062 - Pauziranje intervencije zbog blokera

**Story 1 -** Kao **serviser**, želim **staviti intervenciju na čekanje kada ne mogu nastaviti rad bez korisnika, materijala ili vanjske potvrde**, kako bih **realno prikazao da zadatak nije završen, ali trenutno nije moguće nastaviti rad**.

**Story 2 -** Kao **koordinator**, želim **vidjeti sve intervencije koje su na čekanju, razlog pauze i osobu odgovornu za nastavak**, kako bih **mogao aktivno pratiti blokere i spriječiti da intervencije nestanu iz operativnog fokusa**.

**Story 3 -** Kao **korisnik koji je prijavio kvar**, želim **dobiti obavijest ako je intervencija pauzirana zbog informacije ili radnje koju trebam dostaviti**, kako bih **znao šta se od mene očekuje prije nastavka servisiranja**.

---

## Acceptance Criteria

### PBI-052 - Analitika feedbacka i kvaliteta usluge

- Menadžment mora imati pristup izvještaju o feedbacku kroz postojeći izvještajni ili dashboard dio sistema.
- Izvještaj mora prikazati prosječnu ocjenu, broj feedback zapisa i broj negativnih feedbacka za odabrani period.
- Korisnik mora moći filtrirati rezultate po firmi, kategoriji, serviseru i vremenskom periodu.
- Negativni feedback mora biti posebno označen prema dogovorenom pragu ocjene.
- Koordinator i admin moraju moći otvoriti intervenciju iz feedback izvještaja.
- Korisnici bez ovlasti ne smiju vidjeti feedback za tuđe intervencije ili firme.

---

### PBI-053 - Upravljanje dostupnošću i odsustvima servisera

- Serviser mora moći kreirati period nedostupnosti s datumom početka, datumom kraja i razlogom.
- Serviser mora moći pregledati, izmijeniti i otkazati vlastite buduće periode nedostupnosti.
- Koordinator mora vidjeti dostupnost servisera prilikom ručne dodjele intervencije.
- Nedostupan serviser mora biti jasno označen u listi servisera.
- Sistem ne smije automatski dodijeliti novu intervenciju serviseru koji je nedostupan u planiranom terminu.
- Koordinator smije ručno dodijeliti nedostupnog servisera samo uz potvrdu i unos razloga.

---

### PBI-054 - Potvrda i promjena termina intervencije od strane korisnika

- Kada koordinator zakaže termin intervencije, korisnik mora dobiti in-app notifikaciju.
- Korisnik mora moći potvrditi termin s detalja intervencije ili iz notifikacije.
- Korisnik mora moći zatražiti promjenu termina unosom predloženog vremena i komentara.
- Zahtjev za promjenu termina mora biti vidljiv koordinatoru u posebnom statusu ili listi zahtjeva.
- Koordinator mora moći prihvatiti, odbiti ili predložiti novi termin.
- Sve promjene termina moraju biti evidentirane kroz historiju ili audit zapis.

---

### PBI-055 - Baza znanja i preporučena rješenja za kvarove

- Koordinator mora moći označiti finalizovan izvještaj kao preporučeno rješenje.
- Preporučeno rješenje mora biti povezano s kategorijom kvara i osnovnim opisom problema.
- Serviser mora moći pretraživati bazu znanja po kategoriji, tekstu i lokaciji ako je lokacija relevantna.
- Na detalju intervencije sistem mora prikazati relevantna preporučena rješenja za istu kategoriju.
- Serviser mora moći koristiti preporučeno rješenje kao osnovu za novi izvještaj, ali ga mora moći urediti prije spremanja.
- Rješenja ne smiju otkrivati podatke korisnika ili firme korisnicima koji nemaju pravo pristupa tim podacima.

---

### PBI-056 - Evidencija materijala utrošenog na intervenciji

- Serviser mora moći dodati jedan ili više materijala u izvještaj intervencije.
- Za svaki materijal mora se evidentirati naziv, količina i opciona napomena.
- Sistem ne smije dozvoliti negativne ili prazne količine.
- Koordinator i admin moraju moći pregledati utrošeni materijal na detalju intervencije.
- Menadžment mora imati agregirani pregled potrošnje materijala po periodu, firmi i kategoriji.
- Funkcionalnost ne smije uključivati cijene, fakturisanje ili obračun troškova.

---

### PBI-058 - Eskalacije i komentari ka menadžmentu za rizične intervencije

- Koordinator mora moći označiti intervenciju kao rizičnu uz obavezan razlog.
- Eskalirana intervencija mora biti vidljiva menadžmentu u posebnom pregledu ili na dashboardu.
- Koordinator mora moći dodavati eskalacijske komentare koji su odvojeni od običnih komentara intervencije.
- Menadžment mora moći označiti eskalaciju kao pregledanu.
- Kada se intervencija završi ili otkaže, eskalacija mora ostati historijski vidljiva.
- Korisnici bez koordinator, menadžment ili admin uloge ne smiju vidjeti eskalacijske komentare.

---

### PBI-059 - Zahtjev za ponovnog otvaranja završene intervencije

- Korisnik koji je prijavio kvar mora moći zatražiti ponovnog otvaranja samo za intervenciju koja je u statusu završeno/riješeno.
- Zahtjev mora sadržavati obavezno obrazloženje i opciono prilog ili dodatni komentar.
- Sistem ne smije dozvoliti više aktivnih zahtjeva za ponovnim otvaranjem za istu intervenciju.
- Koordinator mora imati pregled svih zahtjeva za ponovnim otvaranjem sa statusima: na čekanju, prihvaćen, odbijen.
- Prihvatanje zahtjeva mora promijeniti intervenciju u odgovarajući aktivni status i obavijestiti dodijeljene servisere.
- Odbijanje zahtjeva mora zahtijevati komentar koordinatora i poslati obavijest korisniku.
- Svi zahtjevi i odluke moraju ostati vidljivi u historiji intervencije.

---

### PBI-060 - Evidencija dolaska servisera i vremena na terenu

- Dodijeljeni serviser mora moći označiti operativne checkpointe: krenuo na lokaciju, stigao na lokaciju i završio rad na lokaciji.
- Svaki checkpoint mora sačuvati vrijeme, servisera i intervenciju na koju se odnosi.
- Sistem ne smije dozvoliti označavanje dolaska prije označenog polaska, niti završetka rada prije dolaska.
- Koordinator mora na detalju intervencije vidjeti checkpoint historiju i ukupno vrijeme provedeno na terenu.
- Korisnik koji je prijavio kvar mora dobiti in-app notifikaciju kada serviser označi polazak i dolazak.
- Samo dodijeljeni serviser, koordinator ili admin smiju unositi ili ispravljati checkpoint podatke.
- Ispravka pogrešno unesenog checkpointa mora zahtijevati razlog i biti evidentirana u audit logu.

---

### PBI-061 - Digitalna potvrda izvršene intervencije

- Serviser mora moći pokrenuti zahtjev za digitalnu potvrdu samo za intervenciju koja je u toku ili spremna za završetak.
- Korisnik mora moći potvrditi izvršenje putem jednokratnog PIN-a ili digitalnog potpisa na ekranu.
- Potvrda mora sačuvati vrijeme, identitet korisnika ako je prijavljen, metodu potvrde i intervenciju na koju se odnosi.
- Intervencija ne smije automatski dobiti pozitivnu ocjenu samo zato što je korisnik potvrdio izvršenje.
- Ako korisnik odbije potvrdu, mora moći unijeti razlog odbijanja.
- Koordinator mora vidjeti status potvrde na detalju intervencije: potvrđeno, odbijeno, čeka potvrdu ili zatvoreno bez potvrde.
- Zatvaranje intervencije bez korisničke potvrde mora zahtijevati komentar koordinatora ili servisera.

---

### PBI-062 - Pauziranje intervencije zbog blokera

- Koordinator ili dodijeljeni serviser mora moći pauzirati intervenciju koja je u statusu dodijeljeno ili u procesu.
- Pauziranje mora zahtijevati razlog iz predefinisane liste: čeka korisnika, čeka materijal, čeka vanjskog izvođača, čeka odobrenje ili ostalo.
- Ako je razlog "ostalo", korisnik mora unijeti dodatno tekstualno obrazlozenje.
- Intervencija na čekanju mora biti posebno označena u listi intervencija i ne smije se tretirati kao završena ili otkazana.
- Koordinator mora imati pregled svih pauziranih intervencija s datumom pauziranja, razlogom i odgovornom osobom za nastavak.
- Sistem mora evidentirati vrijeme pauziranja i vrijeme nastavka rada kako bi se moglo izračunati ukupno vrijeme provedeno na čekanju.
- Nastavak rada mora vratiti intervenciju u prethodni aktivni status ili u status u procesu, prema pravilima statusa.
- Ako je pauza vezana za korisnika, korisnik mora dobiti in-app notifikaciju s jasnim opisom šta se od njega očekuje.
- Svako pauziranje i nastavak rada mora biti vidljivo u historiji intervencije i audit logu.
