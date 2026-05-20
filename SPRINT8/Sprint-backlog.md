# Sprint Backlog - Sprint 8

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID          | Naziv zadatka / Storija               | Odgovorna osoba  | Status | Napomena                                                                                                                   |
| ----------- | ------------------------------------- | ---------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| **PBI-012** | Notifikacije                          | Nedim Omanović   | Done   | Implementirane in-app notifikacije za dodjelu intervencija i prijavu novih kvarova uz prikaz broja nepročitanih obavijesti |
| **PBI-022** | Planirana/preventivna održavanja      | Dalila Tanković  | Done   | Omogućeno kreiranje periodičnih preventivnih intervencija s automatskim generisanjem novih instanci                        |
| **PBI-025** | Detekcija duplikata prijave kvara     | Lejla Gičević    | Done   | Sistem upozorava korisnika na potencijalno duplirane prijave na istoj lokaciji                                             |
| **PBI-027** | Kreiranje tiketa za podršku           | Nedim Omanović   | Done   | Implementiran sistem korisničkih tiketa sa statusima i pregledom vlastitih tiketa                                          |
| **PBI-028** | Dvosmjerna komunikacija na tiketu     | Lamija Bojić     | Done   | Omogućena razmjena poruka između korisnika i podrške unutar tiketa                                                         |
| **PBI-034** | Geografski/mapski prikaz intervencija | Kerim Hajdar     | Done   | Implementiran pregled intervencija na interaktivnoj mapi s markerima i filterima                                           |
| **PBI-023** | Export podataka                       | Ismail Mujanović | Done   | Omogućen export liste intervencija u PDF format uz role-based ograničenja pristupa                                         |
| **PBI-038** | Masovne akcije na intervencijama      | Iman Šehić       | Done   | Implementirane masovne akcije nad više intervencija uz potvrdu i prikaz rezultata akcije                                   |

---

## User Stories

### PBI-012 – Notifikacije

**Story 1 –** Kao **serviser**, želim **primiti in-app notifikaciju čim mi je dodijeljen novi zadatak**, kako bih **mogao pravovremeno reagirati bez stalnog ručnog provjeravanja sistema**.

**Story 2 –** Kao **koordinator**, želim **biti obaviješten čim korisnik prijavi novi kvar**, kako bih **mogao odmah kreirati intervenciju i reagovati bez kašnjenja**.

**Story 3 –** Kao **bilo koji korisnik sistema**, želim **klikom na notifikaciju biti direktno preusmjeren na relevantnu intervenciju i vidjeti broj nepročitanih obavijesti u navigaciji**, kako bih **imao brz pristup važnim informacijama**.

---

### PBI-022 – Planirana/preventivna održavanja

**Story 1 –** Kao **koordinator**, želim **kreirati intervenciju za planirano preventivno održavanje i definisati periodičnost ponavljanja**, kako bih **osigurao da redovni servisi budu automatski zakazani bez potrebe za ručnim kreiranjem svaki put**.

**Story 2 –** Kao **koordinator**, želim **izmijeniti ili zaustaviti seriju ponavljanja bez utjecaja na već kreirane instance**, kako bih **mogao prilagoditi raspored bez gubitka historijata prethodno obavljenih servisa**.

---

### PBI-025 – Detekcija duplikata prijave kvara

**Story 1 –** Kao **korisnik**, želim **biti upozoren ako sistem detektuje da sam nedavno prijavio sličan kvar na istoj lokaciji**, kako bih **svjesno odlučio da li zaista trebam kreirati novu prijavu ili provjeriti status postojeće**.

**Story 2 –** Kao **koordinator**, želim **da sistem automatski upozorava korisnike pri potencijalnim duplikatima**, kako bih **smanjio broj lažnih duplikata u listi intervencija i uštedio vrijeme trijaže**.

---

### PBI-027 – Kreiranje tiketa za podršku

**Story 1 –** Kao **registrirani korisnik**, želim **kreirati tiket za korisničku podršku kako bih postavio pitanje ili prijavio problem u aplikaciji**, kako bih **dobio zvanični i praćeni odgovor umjesto da problem ostane neriješen**.

---

### PBI-028 – Dvosmjerna komunikacija na tiketu

**Story 1 –** Kao **korisnik ili agent podrške**, želim **razmjenjivati poruke unutar otvorenog tiketa**, kako bih **vodio strukturisan dijalog o problemu na jednom mjestu bez potrebe za emailom**.

---

### PBI-034 – Geografski/mapski prikaz intervencija

**Story 1 –** Kao **koordinator**, želim **pregledati intervencije prikazane na interaktivnoj mapi prema njihovoj lokaciji**, kako bih **dobio prostorni uvid u distribuciju zadataka i identifikovao koncentracije kvarova**.

**Story 2 –** Kao **koordinator**, želim **filtrirati prikazane intervencije na mapi po statusu i dodijeljenom serviseru**, kako bih **fokusirao mapski pregled samo na relevantni podskup intervencija**.

---

### PBI-023 – Export podataka

**Story 1 –** Kao **koordinator ili menadžment**, želim **eksportovati listu intervencija u PDF format**, kako bih **ih mogao arhivirati ili podijeliti s vanjskim dionicima van sistema**.

**Story 2 –** Kao **sistem**, moram **pri generisanju PDF-a prikazivati samo podatke kojima korisnik ima pristup na osnovu uloge**, kako bih **spriječio nenamjerno otkrivanje podataka u exportovanim dokumentima**.

---

### PBI-038 – Masovne akcije na intervencijama

**Story 1 –** Kao **koordinator**, želim **istovremeno izvršiti istu akciju nad više odabranih intervencija**, kako bih **smanjio broj klikova pri upravljanju velikim brojem zadataka**.

**Story 2 –** Kao **koordinator**, želim **dobiti sažetak rezultata nakon izvršene masovne akcije**, kako bih **bio siguran da su intervencije uspješno ažurirane**.

---

## Acceptance Criteria

### PBI-012 – Notifikacije

* Serviser mora primiti notifikaciju nakon dodjele intervencije.
* Koordinator mora primiti notifikaciju nakon prijave novog kvara.
* Sistem mora prikazati broj nepročitanih notifikacija u navigaciji.
* Klik na notifikaciju mora otvoriti relevantnu intervenciju.
* MVP ne uključuje email niti push notifikacije.

### PBI-022 – Planirana/preventivna održavanja

* Koordinator mora moći kreirati planiranu intervenciju bez prijave kvara.
* Sistem mora podržati dnevno, sedmično i mjesečno ponavljanje.
* Sistem mora automatski generisati nove intervencije prema rasporedu.
* Izmjena rasporeda ne smije utjecati na prethodno kreirane instance.

### PBI-025 – Detekcija duplikata prijave kvara

* Sistem mora upozoriti korisnika na potencijalni duplikat prijave.
* Korisnik mora moći nastaviti prijavu uprkos upozorenju.
* Sistem ne smije tretirati završene intervencije kao aktivne duplikate.
* Sistem ne smije prikazivati lažna upozorenja za različite lokacije.

### PBI-027 – Kreiranje tiketa za podršku

* Korisnik mora imati pristup formi za kreiranje tiketa.
* Tiket mora imati jedinstveni ID i status „Otvoren“.
* Korisnik mora moći pregledati vlastite tikete.
* Tiketi ne smiju biti vidljivi drugim korisnicima.

### PBI-028 – Dvosmjerna komunikacija na tiketu

* Korisnik i agent podrške moraju moći slati poruke unutar tiketa.
* Poruke moraju biti prikazane kronološki.
* Sistem ne smije dozvoliti slanje praznih poruka.
* Nakon zatvaranja tiketa komunikacija mora biti onemogućena.

### PBI-034 – Geografski/mapski prikaz intervencija

* Koordinator mora moći prebacivati između listnog i mapskog prikaza.
* Intervencije s lokacijom moraju biti prikazane kao markeri na mapi.
* Klik na marker mora prikazati osnovne informacije o intervenciji.
* Sistem mora podržati filtriranje po statusu i serviseru.

### PBI-023 – Export podataka

* Koordinator i menadžment moraju imati mogućnost PDF exporta.
* PDF mora sadržavati osnovne podatke o intervencijama.
* Sistem mora poštovati role-based pristup podacima.
* Excel i CSV export nisu dio MVP verzije.

### PBI-038 – Masovne akcije na intervencijama

* Koordinator mora moći odabrati više intervencija.
* Sistem mora podržati masovnu promjenu statusa, dodjelu servisera i arhiviranje.
* Sistem mora tražiti potvrdu prije izvršavanja akcije.
* Nakon izvršavanja akcije sistem mora prikazati rezultat izvršavanja.
