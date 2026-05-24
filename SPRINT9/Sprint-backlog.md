# Sprint Backlog - Sprint 9

## Sistem za upravljanje servisnim intervencijama | v1.0

| ID | Naziv zadatka / Storija | Odgovorna osoba | Status | Napomena |
|----|------------------------|-----------------|--------|----------|
| **PBI-031** | Višejezična podrška | Lamija Bojić | Done | Omogućen odabir i čuvanje jezika prikaza po korisničkom računu uz potpuno preveden UI bez parcijalnih prijevoda |
| **PBI-036** | Feedback korisnika po završetku intervencije | Kerim Hajdar | Done | Implementiran feedback mehanizam s ocjenom i opcionalnim komentarom nakon prelaska intervencije u status "Završeno". |
| **PBI-039** | Blokiranje korisnika od strane firme | Nedim Omanović | Done | Implementirano blokiranje i deblokiranje korisnika od strane koordinatora uz audit log i zabranu daljnjih prijava kvarova |
| **PBI-051** | Settings page | Ismail Mujanović | Done | Implementirana centralizovana Settings stranica s role-based prikazom, jezičkim postavkama i notifikacijskim preferencama |
| **PBI-029** | Notifikacija za tikete | Dalila Tanković | Done | Implementirane in-app notifikacije za korisnike i agente podrške uz prikaz broja nepročitanih notifikacija za tikete |

---

## User Stories

### PBI-031 - Višejezična podrška

**Story 1 –** Kao **korisnik sistema**, želim **moći odabrati jezik prikaza interfejsa u postavkama profila**, kako bih **koristio sistem na jeziku koji mi je najrazumljiviji**.

**Story 2 –** Kao **sistem**, moram **prikazivati sve elemente sučelja (navigacija, dugmad, poruke grešaka, labele) na odabranom jeziku bez miješanja**, kako bih **osigurao koherentno korisničko iskustvo bez parcijalni prijevoda**.

---

### PBI-036 - Feedback korisnika po završetku intervencije

**Story 1 –** Kao **korisnik koji je prijavio kvar**, želim **dobiti mogućnost da ocijenim intervenciju nakon što budem obaviješten o njenom završetku**, kako bih **dao povratnu informaciju o kvaliteti usluge**.

**Story 2 –** Kao **koordinator ili administrator**, želim **pregledati feedback korisnika vezan za konkretnu intervenciju**, kako bih **identifikovao slabe tačke u procesu i pratio trendove kvalitete usluge**.

---

### PBI-039 - Blokiranje korisnika od strane firme

**Story 1 –** Kao **koordinator**, želim **blokirati korisnika za kojeg procijenim da se radi o spamu ili zloupotrebi sistema**, kako bih **spriječio daljnje lažne prijave i zaštitio tim od nepotrebnog opterećenja**.

**Story 2 –** Kao **koordinator**, želim **pregledati sve blokirane korisnike i moći ih deblokirati**, kako bih **imao kompletnu kontrolu i mogao ispraviti eventualne pogrešne blokade**.

---

### PBI-051 - Settings page

**Story 1 –** Kao **prijavljeni korisnik**, želim **na Settings stranici podesiti lične preference aplikacije kao što su jezik prikaza i osnovne postavke notifikacija**, kako bih **mogao koristiti sistem na način koji odgovara mom radu bez traženja tih opcija po različitim ekranima**.

**Story 2 –** Kao **administrator**, želim **na Settings stranici vidjeti pregled sistemskih konfiguracija i brze prečice prema SLA pravilima, attachment pravilima, kategorijama, korisnicima i firmama**, kako bih **brže došao do operativnih postavki bez dupliranja postojećih admin stranica**.

**Story 3 –** Kao **korisnik bez administratorskih privilegija**, želim **vidjeti samo postavke koje smijem mijenjati**, kako bih **imao jasan i siguran interfejs bez opcija koje ne mogu koristiti**.

**Story 4 –** Kao **sistem**, moram **čuvati promjene postavki po korisniku i primjenjivati role-based kontrolu pristupa**, kako bih **spriječio neovlaštene izmjene konfiguracije i zadržao konzistentno korisničko iskustvo nakon ponovne prijave**.

---

### PBI-029 - Notifikacija za tikete

**Story 1 –** Kao **korisnik**, želim **primiti in-app obavijest kada agent odgovori na moj tiket**, a kao **agent podrške**, želim **biti obaviješten kada stigne novi tiket ili odgovor**, kako bih **mogli pravovremeno reagirati bez stalnog provjeravanja sistema**.

---

## Acceptance Criteria

### PBI-031 - Višejezična podrška

- Svaki prijavljeni korisnik mora imati **mogućnost odabira jezika** iz liste podržanih jezika.
- Nakon odabira i čuvanja, **sučelje mora biti prikazano na odabranom jeziku** pri svakom narednom loginu.
- Promjena jezika mora se **primijeniti odmah** ili nakon osvježavanja stranice.
- Sistem mora **zapamtiti odabrani jezik** po korisničkom računu, ne samo po sesiji.
- Svi elementi sučelja moraju biti **prevedeni na odabrani jezik** – parcijalni prijevodi nisu prihvatljivi.
- Sistem ne smije **prikazivati miješane jezike** na istoj stranici.
- Ako prijevod za određeni element nedostaje, **sistem mora prikazati fallback vrijednost** (npr. engleski) umjesto praznog polja.

### PBI-036 - Feedback korisnika po završetku intervencije

- Kada intervencija prijeđe u status "Završeno", korisnik mora dobiti **in-app obavijest s pozivom na feedback**.
- Korisnik mora moći **ostaviti ocjenu** (minimalno: potvrda rješenja ili numerička ocjena 1–5).
- Korisnik mora imati mogućnost **dodavanja opcionog tekstualnog komentara** uz ocjenu.
- Feedback mora biti **moguće ostaviti samo jednom** po intervenciji.
- Ako korisnik ne ostavi feedback, **sistem ne smije blokirati niti podsjetiti više od jednom**.
- Koordinator i admin moraju moći **pregledati feedback** vezan za konkretnu intervenciju.
- Sistem ne smije **prikazivati feedback jednog korisnika drugom korisniku** koji nije koordinator ili admin.

### PBI-039 - Blokiranje korisnika od strane firme

- Koordinator mora imati **opciju blokiranja korisnika** dostupnu iz pregleda intervencija ili korisničkog profila.
- Sistem mora tražiti **potvrdu akcije** prije blokiranja.
- Nakon blokiranja, **blokirani korisnik ne smije moći slati nove prijave kvarova** – sistem mora odbiti unos.
- Koordinator mora imati **pregled svih blokiranih korisnika** s mogućnošću deblokiranja.
- Deblokiranje mora **odmah omogućiti korisniku** da ponovo podnosi prijave.
- Svaka akcija blokiranja i deblokiranja mora biti **evidentirana u logu** s imenom koordinatora i vremenskom oznakom.
- Blokiranje korisnika **ne smije automatski deaktivirati korisnički račun** – to je odvojena admin akcija.

### PBI-051 - Settings page

- Settings stranica mora biti dostupna samo **prijavljenim korisnicima**; neprijavljeni korisnik mora biti preusmjeren na login ili vidjeti Access Denied prikaz.
- Stranica ne smije prikazivati placeholder/empty state kao primarni sadržaj, nego mora imati stvarne sekcije za korisničke postavke.
- Svaki prijavljeni korisnik mora moći **pregledati i promijeniti jezik prikaza** iz liste podržanih jezika.
- Odabrani jezik mora biti **sačuvan po korisničkom računu** i mora ostati primijenjen nakon odjave i ponovne prijave.
- Korisnik mora moći **pregledati postavke notifikacija** po kategorijama koje sistem podržava.
- Sistem ne smije dozvoliti isključivanje notifikacija koje su označene kao **obavezne za operativni tok** bez posebne administratorske odluke.
- Admin mora na Settings stranici vidjeti **role-based prečice** prema SLA konfiguraciji, attachment konfiguraciji, kategorijama, korisnicima i firmama.
- Korisnik bez admin uloge ne smije vidjeti niti koristiti admin konfiguracijske kontrole ili prečice koje nisu namijenjene njegovoj ulozi.
- Klik na admin prečicu mora otvoriti postojeću relevantnu admin stranicu, bez dupliranja forme unutar Settings stranice.
- Ako čuvanje postavki ne uspije, sistem mora prikazati jasnu grešku i ne smije prikazati da su promjene uspješno sačuvane.
- Nakon uspješnog čuvanja, sistem mora prikazati potvrdu i osvježiti lokalno stanje bez potrebe za ručnim ponovnim unosom.
- Sve izmjene sistemskih konfiguracija pokrenute iz Settings konteksta moraju poštovati postojeći backend RBAC i audit pravila.


### PBI-029 - Notifikacija za tikete

- Kada agent odgovori na tiket, **korisnik mora primiti in-app notifikaciju**.
- Kada korisnik kreira novi tiket ili odgovori, **agent podrške mora primiti in-app notifikaciju**.
- Svaka notifikacija mora sadržavati **ID tiketa i kratki sažetak**.
- Klik na notifikaciju mora **direktno otvoriti odgovarajući tiket**.
- Sistem mora prikazati **broj nepročitanih notifikacija i za tikete** u navigaciji.
- Korisnik ne smije primati **notifikacije za tuđe tikete**.