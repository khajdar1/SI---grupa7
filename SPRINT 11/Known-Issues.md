# Poznati problemi i ograničenja sistema (Known Issues & Limitations)

**Sistem za upravljanje servisnim intervencijama | v1.0**
**Datum:** Juni 2026.

---

## 1. Poznati bugovi (Known Bugs)

### BUG-001 - Opis intervencije s velikim brojem karaktera uzrokuje database grešku
- **Vezano za:** PBI-004
- **Opis:** Ako korisnik unese predugački opis pri prijavi kvara, sistem ne provjerava dužinu teksta prije slanja u bazu. Baza odbaci zahtjev i sistem korisniku vrati poruku `ERROR database error`, što nije prihvatljivo ni iz sigurnosnog ni UX aspekta. Validacija dužine opisa treba biti dodana kao provjera na serveru, s jasnom porukom korisniku.

### BUG-002 - Token sesije ističe prebrzo i često izbacuje korisnika
- **Vezano za:** PBI-002
- **Opis:** JWT token ima prekratko trajanje što uzrokuje da korisnici budu često odjavljivani iz sistema tokom aktivnog rada. Ovo je naročito vidljivo pri dužim operacijama. Potrebno je prilagoditi TTL tokena ili implementirati automatski refresh tokena.

### BUG-003 - Ponavljajuće intervencije imaju problem s računanjem datuma na mjesečnoj bazi i ne prikazuju se unaprijed na kalendaru
- **Vezano za:** PBI-022
- **Opis:** Dva zasebna problema vezana za ponavljajuće intervencije:
  - **Računanje datuma:** Kada se intervencija ponavlja mjesečno, sistem ne rukuje ispravno krajevima mjeseca. Na primjer, intervencija postavljena za 31. januar kao sljedeći termin dobija 3. mart umjesto 28. februara, što znači da se cijeli februar preskače.
  - **Kalendarski prikaz:** Sistem generiše sljedeću instancu tek kada njeno vrijeme stvarno nastupi. Ako se danas postavi intervencija sa mjesečnim ponavljanjem, julska instanca neće biti vidljiva na kalendaru u junu jer u bazi još ne postoji - scheduler je kreira tek kada juli nastupi. Kalendar zbog toga ne može prikazati buduće planirane instance ponavljajućih intervencija.

### BUG-004 - Gmail OAuth token za slanje emaila može postati nevažeći (reset lozinke prestaje raditi)
- **Vezano za:** PBI-019
- **Opis:** Funkcionalnost reseta lozinke oslanja se na Gmail OAuth refresh token koji može postati nevažeći iz više razloga: ako aplikacija ostane u Google Cloud "Testing" modu token ističe nakon 7 dana, ako token nije korišten 6 mjeseci Google ga automatski poništi, ili ako korisnik čiji je račun korišten promijeni lozinku. Kada se to desi, slanje email linka za reset jednostavno prestaje raditi bez ikakve poruke korisniku ili upozorenja u sistemu. Rješenje je koristiti servisni račun s trajnim pristupom umjesto OAuth tokena vezanog za privatni korisnički račun.

### BUG-005 - Detekcija duplikata prijave kvara nepouzdana bez GPS koordinata
- **Vezano za:** PBI-025
- **Opis:** Provjera duplikata se pokreće prije nego što se geolokacija uopće očita - u tom trenutku sistem poredi sirovi tekst koji je korisnik upisao u formu s geocodiranom verzijom adrese koja je pohranjena u bazi, pa se čak i identična lokacija neće prepoznati kao duplikat. Uz to, provjera duplikata prima korisnički ID direktno iz zahtjeva bez provjere odgovara li prijavljenom korisniku, pa zlonamjerni klijent može pokrenuti provjeru na tuđem nalogu.

### BUG-006 - Greška pri kreiranju jednokratne lozinke zahtijeva brisanje i ponovni unos
- **Vezano za:** PBI-013
- **Opis:** Kada administrator kreira novi korisnički račun, unosi ime, prezime, korisničko ime, email i jednokratnu lozinku u jedan formular. Nakon što se podaci sačuvaju, ne postoji opcija izmjene lozinke. Ako je administrator napravio grešku u kucanju, jedino rješenje je brisanje cijelog korisničkog računa i kreiranje novog od početka.

### BUG-007 - PDF export ne poštuje aktivne filtere - izvozi sve intervencije
- **Vezano za:** PBI-023
- **Opis:** Kada koordinator postavi filtere na listi intervencija (npr. po statusu ili kategoriji) i zatim klikne „Izvoz PDF", sistem ignorira filtere i izvozi kompletnu listu. Korisnik očekuje da će u PDF-u biti samo filtrirani podaci.

### BUG-008 - Prijavljeni korisnik prikazuje se kao „System Reporter" umjesto pod svojim imenom
- **Vezano za:** PBI-001
- **Opis:** Kada korisnik s postojećim računom podnese prijavu kvara, sistem ga spremi kao podnosioca prijave, ali intervencija koja se automatski kreira dobija sistemskog korisnika kao kreatora — bez obzira na to ko je stvarno prijavio kvar. Svugdje gdje sistem prikazuje kreatora intervencije, prikazuje se „System Reporter" umjesto imena i prezimena stvarne osobe. Ovo zbunjuje koordinatore i servisere pri pregledu prijava.

### BUG-009 - Notifikacije za promjenu termina intervencije ne rade u produkciji
- **Vezano za:** PBI-054, PBI-012
- **Opis:** Notifikacije za promjenu termina intervencije rade lokalno ali ne u produkciji. Razlika nastaje zbog različite konfiguracije WebSocket veze između lokalnog i produkcijskog okruženja - produkcijski server ne uspostavlja istu vezu pa notifikacije nikad ne stignu do korisnika.

---

## 2. Tehnička ograničenja (Technical Limitations)

- **Upload attachmenta:** Backend podržava maksimalno 10 MB po fajlu, ali JSON payload limit je 15 MB. Zbog Base64 overhead-a, fajlovi bliski 10 MB mogu premašiti ukupni limit zahtjeva.
- **Performanse ponavljajućih instanci:** Generiranje ponavljajućih intervencija nije batch optimizirano; svaka instanca se kreira u zasebnoj transakciji, što može opteretiti bazu pri većem broju zrelih ponavljajućih intervencija.
- **Kalendar bez namjenskog API-ja:** Frontend kalendar prikazuje samo intervencije kojima je postavljen planirani početak ili rok. Intervencije bez tih datuma ne pojavljuju se u kalendarskom prikazu čak i ako postoje u sistemu.
- **Geokodiranje:** Aplikacija ovisi o vanjskom geocoding servisu. Postoji `GEOCODING_DISABLED` flag kao fallback, ali nema vlastite logike parsiranja lokacije ako vanjski servis zakaže.
- **Notifikacije isključivo in-app:** Email notifikacije koriste se samo za reset lozinke. Push notifikacije i email obavijesti za ostale događaje nisu implementirane u MVP verziji.

---

## 3. Sigurnosna ograničenja (Security Limitations)

- **Nema 2FA:** Dvofaktorska autentifikacija nije implementirana u MVP verziji.
- **Endpoint `/check-duplicates` nije zaštićen autorizacijom:** Prima `userId` iz tijela zahtjeva bez provjere da li odgovara prijavljenom korisniku. Zlonamjerni klijent može pokrenuti provjeru za proizvoljni `userId`.
- **RBAC fallback na Keycloak nedostupnost:** Ako je Keycloak nedostupan, autorizacija se oslanja na role iz JWT tokena bez live verifikacije.
- **Logovanje grešaka:** Global error handler ispravno skriva stack trace u produkciji, ali logger zapisuje `error.message` - potrebna je provjera da poruke ne sadrže osjetljive podatke.
- **XSS rizik:** Sistem ne koristi centralni HTML sanitizator za prikaz korisničkih opisa i lokacija. Trenutno nema direktnog `dangerouslySetInnerHTML`, ali rizik postoji ako se u budućnosti doda HTML renderiranje.

---

## 4. Nedovršene i djelimično završene funkcionalnosti

- **PBI-037 - Automatska raspodjela intervencija:** Nije implementirana. Postoje helperi za izračun opterećenja servisera i UI labela „Auto assignment" u settings stranici, ali ne postoji stvarna logika automatske dodjele pri kreiranju intervencije.
- **PBI-022 - Ponavljajuće intervencije (mjesečno):** Osnova postoji, ali mjesečni algoritam ima rubni bug i nije stabilan za produkcijsku upotrebu.
- **PBI-025 - Detekcija duplikata:** Funkcionira uz GPS koordinate, ali tekstualna detekcija kao fallback nije pouzdana; provjera se pokreće prije nego što se geolokacija očita, pa se sirovi unos korisnika poredi s geocodiranom verzijom iz baze i ista lokacija se ne prepoznaje kao duplikat.

---

## 5. Funkcionalna ograničenja koja nisu bugovi

- **Administrator firme ne može upravljati korisnicima vlastite firme** putem odvojenog interfejsa - ova funkcionalnost nije implementirana u MVP verziji, iako je predviđena ulogom.
- **Admin nema search/filter pri pregledu korisnika** - pri upravljanju korisničkim računima ne postoji pretraživanje, što otežava rad u sistemu s većim brojem korisnika.
- **Export podataka dostupan samo u PDF formatu** - Excel i CSV formati nisu dio MVP verzije.
- **Grafički prikazi (chartovi)** u menadžment dashboardu nisu implementirani - svi podaci su numerički i tabelarni.
- **Feedback se može ostaviti samo jednom** po intervenciji bez mogućnosti izmjene.
- **Komunikacija na tiketu prestaje** čim je tiket zatvoren.
- **Automatski podsjetnici** za preglede i servisne intervale nisu implementirani.
- **Ponovo otvaranje zatvorene intervencije** nije dostupno administratoru ni koordinatoru - moguće je samo na zahtjev korisnika.

---

## 6. Pretpostavke koje sistem pravi

- Klijent ima stabilnu internet vezu i pristup lokacijskim uslugama za GPS koordinate pri prijavi kvara.
- Firme, kategorije i SLA konfiguracija su unaprijed postavljeni kroz seed ili admin konfiguraciju - sistem ne vodi korisnika kroz inicijalno postavljanje.
- Frontend lokalno čuva `userId` u `localStorage` za `checkDuplicates()`, iako backend ne provjerava da je taj ID stvarno korisnik iz aktivne sesije.
- Geokodiranje je aktivno ili je isključeno kroz `GEOCODING_DISABLED` env varijablu - nema međustanja.

---

## 7. Dijelovi sistema koje ne treba predstavljati kao potpuno završene

- **Servis ponavljajućih intervencija** - osnova postoji, ali mjesečna logika zahtijeva dodatnu stabilizaciju prije produkcijske upotrebe.
- **Auto assignment** - postoji UI i notifikacijska infrastruktura, ali stvarna logika automatske dodjele nije implementirana i ne smije se predstavljati kao funkcionalna.