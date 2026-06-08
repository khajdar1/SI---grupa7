# Poznati problemi i ograničenja sistema (Known Issues & Limitations)

**Sistem za upravljanje servisnim intervencijama | v1.0**
**Datum:** Juni 2026.

---

## 1. Poznati bugovi (Known Bugs)

### BUG-001 — Opis intervencije s velikim brojem karaktera uzrokuje database grešku
- **Vezano za:** PBI-004
- **Opis:** Ako korisnik unese opis koji premašuje dozvoljenu dužinu, sistem vraća poruku `ERROR database error`. Poruka otkriva internu prirodu greške (spomen baze podataka), što nije prihvatljivo iz sigurnosnog i UX aspekta. Validacija dužine opisa treba biti implementirana na frontend nivou, a greška mora biti prikazana kao jasna korisnička poruka bez tehničkih detalja.

### BUG-002 — Token sesije ističe prebrzo i često izbacuje korisnika
- **Vezano za:** PBI-002
- **Opis:** JWT token ima prekratko trajanje što uzrokuje da korisnici budu često odjavljivani iz sistema tokom aktivnog rada. Ovo je naročito vidljivo pri dužim operacijama. Potrebno je prilagoditi TTL tokena ili implementirati automatski refresh tokena.

### BUG-003 — Ponavljajuće intervencije ne funkcionišu ispravno na mjesečnoj bazi
- **Vezano za:** PBI-022
- **Datoteka:** `backend/src/services/recurring.service.ts`, funkcija `computeNextGenerationAt()`
- **Opis:** JavaScript `Date.setMonth()` ne garantuje isti dan u narednom mjesecu pri prelasku s kraja mjeseca. Na primjer, `2026-01-31` može postati `2026-03-03`. Ovo uzrokuje preskakivanje mjeseci i nelogično ponašanje za intervencije koje se ponavljaju zadnjeg dana u mjesecu. Uz to, kalendarski prikaz ne prikazuje generirane ponavljajuće instance jer frontend koristi generički `/interventions` endpoint umjesto namjenskog `calendar` API-ja.
- **Testovi:** `backend/test/recurring.service.test.ts` ne pokrivaju rubne slučajeve kraj-mjeseca, pa bug nije bio detektovan testovima.

### BUG-004 — Gmail tokeni za slanje emaila mogu isteći (reset lozinke prestaje raditi)
- **Vezano za:** PBI-019
- **Opis:** Funkcionalnost reseta lozinke oslanja se na Gmail OAuth tokene koji imaju ograničen vijek trajanja. Kada token istekne, slanje email linka za reset prestaje raditi bez jasne poruke korisniku. Potrebno je periodično osvježavati token ili koristiti servisni račun s trajnim pristupom.

### BUG-005 — Detekcija duplikata prijave kvara nepouzdana bez GPS koordinata
- **Vezano za:** PBI-025
- **Datoteka:** `backend/src/modules/fault-reports/fault-reports.service.ts`
- **Opis:** Algoritam detekcije duplikata koristi GPS koordinate kada su dostupne, a u suprotnom prelazi na tekstualnu Jaccard sličnost lokacije, što je manje precizno. Uz to, endpoint `/check-duplicates` prima `userId` iz tijela zahtjeva i ne vezuje ga za autentificiranog korisnika, što otvara mogućnost provjere duplikata za proizvoljne korisničke ID-eve.

### BUG-006 — Privremena lozinka pri kreiranju korisničkog računa prikazuje se samo jednom
- **Vezano za:** PBI-013
- **Opis:** Kada administrator kreira novi korisnički račun, privremena lozinka se prikazuje samo jednom. Ako administrator napravi grešku ili zatvori prozor, lozinka je izgubljena i korisnik ne može dobiti pristup bez ručnog reseta. Preporučuje se prikaz lozinke dva puta ili opcija ponovnog slanja.

### BUG-007 — PDF export ne poštuje aktivne filtere - izvozi sve intervencije
- **Vezano za:** PBI-023
- **Opis:** Kada koordinator postavi filtere na listi intervencija (npr. po statusu ili kategoriji) i zatim klikne „Izvoz PDF", sistem ignorira filtere i izvozi kompletnu listu. Korisnik očekuje da će u PDF-u biti samo filtrirani podaci.

### BUG-008 — Forma za kategoriju nudi opciju „Nova kategorija" ali ne omogućava unos
- **Vezano za:** PBI-030, PBI-032
- **Opis:** U formi za prijavu kvara ili intervenciju prikazuje se opcija „Nova kategorija", ali ne postoji polje za unos naziva nove kategorije. Ova opcija ne smije biti prikazana krajnjim korisnicima  -dodavanje kategorija je isključivo administratorska akcija putem settings stranice.

### BUG-009 — Korisnik koji se samoregistrira prikazuje se kao „System Reporter"
- **Vezano za:** PBI-001
- **Opis:** Nakon samoregistracije, prikaz korisnikovog imena na nekim mjestima u sistemu pokazuje „System Reporter" umjesto stvarnog imena. Ovo zbunjuje koordinatore i servisere pri pregledu prijava.

### BUG-010 — Notifikacije za promjenu termina intervencije ne rade u produkciji
- **Vezano za:** PBI-054, PBI-012
- **Opis:** Notifikacije za promjenu termina intervencije nisu povezane sa WebSocket socketom u produkcijskom okruženju. Lokalno testiranje je pokazivalo ispravno ponašanje, ali produkcijski deployment ne šalje ove notifikacije. Greška nastaje zbog razlike u konfiguraciji WebSocket veze između lokalnog i produkcijskog okruženja.

---

## 2. Tehnička ograničenja (Technical Limitations)

- **Upload privitaka:** Backend podržava maksimalno 10 MB po fajlu, ali JSON payload limit je 15 MB. Zbog Base64 overhead-a, fajlovi bliski 10 MB mogu premašiti ukupni limit zahtjeva.
- **Performanse ponavljajućih instanci:** Generiranje ponavljajućih intervencija nije batch optimizirano; svaka instanca se kreira u zasebnoj transakciji, što može opteretiti bazu pri većem broju zrelih ponavljajućih intervencija.
- **Kalendar bez namjenskog API-ja:** Frontend kalendar koristi generički `/interventions` endpoint. Intervencije kojima nije postavljen `dueAt` ni `startedAt` se ne prikazuju u kalendarskom prikazu.
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

- **PBI-037 — Automatska raspodjela intervencija:** Nije implementirana. Postoje helperi za izračun opterećenja servisera u `assignment.service.ts` i UI labela „Auto assignment" u settings stranici, ali ne postoji stvarna logika automatske dodjele pri kreiranju intervencije.
- **PBI-022 — Ponavljajuće intervencije (mjesečno):** Osnova postoji, ali mjesečni algoritam ima rubni bug i nije stabilan za produkcijsku upotrebu.
- **PBI-025 — Detekcija duplikata:** Funkcionira uz GPS koordinate, ali tekstualna detekcija kao fallback nije dovoljno precizna.

---

## 5. Funkcionalna ograničenja koja nisu bugovi

- **Administrator firme ne može upravljati korisnicima vlastite firme** putem odvojenog interfejsa -ova funkcionalnost nije implementirana u MVP verziji, iako je predviđena ulogom.
- **Admin nema search/filter pri pregledu korisnika** - pri upravljanju korisničkim računima ne postoji pretraživanje, što otežava rad u sistemu s većim brojem korisnika.
- **Export podataka dostupan samo u PDF formatu** - Excel i CSV formati nisu dio MVP verzije.
- **Grafički prikazi (chartovi)** u menadžment dashboardu nisu implementirani - svi podaci su numerički i tabelarni.
- **Feedback se može ostaviti samo jednom** po intervenciji bez mogućnosti izmjene.
- **Komunikacija na tiketu prestaje** čim je tiket zatvoren.
- **Automatski podsjetnici** za preglede i servisne intervale nisu implementirani.

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