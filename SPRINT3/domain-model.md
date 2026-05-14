
### Domain Model
---

### Glavni entiteti

- Korisnik
- Eksterni_identitet
- Firma
- Kategorija
- Prijava_kvara
- Intervencija
- Izvjestaj
- Attachment
- Zaduzeni_serviseri
- Tiket
- Poruka
- Feedback
- Komentar_intervencije
- Blokiranje_korisnika
- Historija_status
- Konfiguracija_sistema
- Notifikacija

---

### Ključni atributi

**Korisnik**
- id: INT (PK)
- firma_id: INT (FK, nullable)
- ime: VARCHAR
- prezime: VARCHAR
- korisnicko_ime: VARCHAR
- email: VARCHAR
- aktivan: BOOLEAN

**Eksterni_identitet**
- id: INT (PK)
- korisnik_id: INT (FK)
- provajder: VARCHAR
- provider_subject: VARCHAR
- vrijeme_kreiranja: TIMESTAMP

**Firma**
- id: INT (PK)
- naziv: VARCHAR
- kontakt: VARCHAR
- tip: VARCHAR

**Kategorija**
- id: INT (PK)
- naziv: VARCHAR
- opis: VARCHAR

**Prijava_kvara**
- id: INT (PK)
- opis: VARCHAR
- lokacija: VARCHAR
- latitude: DECIMAL
- longitude: DECIMAL
- user_id: INT (FK, nullable)
- kategorija_id: INT (FK)
- firma_id: INT (FK)
- vrijeme_prijave: TIMESTAMP

**Intervencija**
- id: INT (PK)
- lokacija: VARCHAR
- latitude: DECIMAL
- longitude: DECIMAL
- naziv: VARCHAR
- opis: VARCHAR
- prioritet: ENUM (Hitan, Visok, Normalan, Nizak)
- status: ENUM (Otvoreno, U_procesu, Zavrseno, Otkazano)
- datum_kreiranja: DATE
- vrijeme_pocetka: TIMESTAMP
- rok_zavrsetka: TIMESTAMP
- kategorija_id: INT (FK)
- kreirao_id: INT (FK)
- firma_id: INT (FK)
- arhivirano: BOOLEAN
- tip: ENUM (Kvar, Preventivno_odrzavanje)
- prijava_id: INT (FK, nullable)
- periodicnost: ENUM (Dnevno, Sedmicno, Mjesecno, Godisnje), nullable
- sljedece_generisanje: DATETIME

**Izvjestaj**
- id: INT (PK)
- intervencija_id: INT (FK)
- korisnik_id: INT (FK)
- opis: TEXT
- materijal: TEXT
- napomene: TEXT
- datum: DATE
- status: ENUM (Nacrt, Finaliziran)

**Attachment**
- id: INT (PK)
- url: VARCHAR
- naziv_fajla: VARCHAR
- tip_fajla: VARCHAR
- velicina_fajla: INT
- intervencija_id: INT (FK)
- prijava_id: INT (FK, nullable)
- izvjestaj_id: INT (FK, nullable)

**Zaduzeni_serviseri**
- id: INT (PK)
- intervencija_id: INT (FK)
- user_id: INT (FK)
- nacin_dodjele: ENUM (Manuelno, Automatski)
- vrijeme_dodjele: TIMESTAMP

**Tiket**
- id: INT (PK)
- korisnik_id: INT (FK)
- naslov: VARCHAR
- kategorija: VARCHAR
- status: ENUM (Otvoreno, U_toku, Rijeseno, Zatvoreno)
- vrijeme_kreiranja: TIMESTAMP

**Poruka**
- id: INT (PK)
- tiket_id: INT (FK)
- korisnik_id: INT (FK)
- tekst: TEXT
- vrijeme_kreiranja: TIMESTAMP

**Feedback**
- id: INT (PK)
- intervencija_id: INT (FK)
- korisnik_id: INT (FK)
- ocjena: INT
- komentar: VARCHAR
- vrijeme_kreiranja: TIMESTAMP

**SLA_Konfiguracija**
- id: INT (PK)
- prioritet: ENUM (Hitan, Visok, Normalan, Nizak)
- rok_sati: INT
- azurirana_at: TIMESTAMP

**Komentar_intervencije**
- id: INT (PK)
- intervencija_id: INT (FK)
- korisnik_id: INT (FK)
- tekst: TEXT
- vrijeme_kreiranja: TIMESTAMP

**Blokiranje_korisnika**
- id: INT (PK)
- korisnik_id: INT (FK)
- firma_id: INT (FK)
- koordinator_id:INT (FK)
- razlog: VARCHAR
- vrijeme_blokiranja: TIMESTAMP

**Historija_status**
- id: INT (PK)
- intervencija_id: INT (FK)
- korisnik_id: INT (FK)
- stari_status: ENUM (Otvoreno, U_procesu, Zavrseno, Otkazano)
- novi_status: ENUM (Otvoreno, U_procesu, Zavrseno, Otkazano)
- vrijeme_promjene: TIMESTAMP

**Konfiguracija_sistema**
- id: INT (PK)
- kljuc: VARCHAR
- vrijednost: VARCHAR
- azurirao_id: INT (FK)
- azurirano_at: TIMESTAMP

**Notifikacija**
- id: INT (PK)
- korisnik_id: INT (FK)
- naslov: VARCHAR
- tekst: TEXT
- tip: ENUM (Nova_prijava, Dodjela_intervencije, Promjena_statusa, Feedback_zahtjev, Automatska_dodjela, Novi_tiket, Odgovor_na_tiket)
- procitano: BOOLEAN
- intervencija_id: INT (FK, nullable)
- tiket_id: INT (FK, nullable)
- vrijeme_kreiranja: TIMESTAMP

---

### Veze između entiteta

#### Korisnik – Prijava_kvara: 1:N 
- Jedan korisnik može podnijeti više prijava kvara, ali svaka prijava kvara može biti vezana za najviše jednog korisnika.
  
#### Korisnik - Tiket: 1:N 
- Jedan korisnik može kreirati više tiketa za podršku, ali svaki tiket pripada tačno jednom korisniku.
  
#### Korisnik - Poruka: 1:N
- Jedan korisnik može napisati više poruka unutar tiketa, ali svaka poruka ima tačno jednog autora.
  
#### Korisnik - Blokiranje_korisnika: 1:N
- Jedan korisnik može biti blokiran više puta, ali svaki zapis blokiranja odnosi se na tačno jednog korisnika.

#### Korisnik - Historija_statusa: 1:N
- Svaka promjena statusa je vezana za jednog korisnika (koordinatora) koji ju je izvršio.

#### Korisnik - Konfiguracija_sistema: 1:N
- Administrator može ažurirati više konfiguracija i svaka konfiguracija ima tačno jednog (posljednjeg) urednika.

#### Korisnik - Notifikacija: 1:N
- Jedan korisnik može dobiti više notifikacija.

#### Korisnik - Eksterni_identitet: 1:N
- Jedan korisnik može imati više eksternih identiteta kroz različite provajdere, ali najviše jedan identitet po istom provajderu; svaki eksterni identitet pripada tačno jednom korisniku.
  
#### Kategorija – Prijava_kvara: 1:N
-  Jedna kategorija može pokriti više prijava kvara, ali svaka prijava mora biti svrstana u tačno jednu kategoriju.
  
#### Kategorija - Intervencija: 1:N
- Jedna kategorija može biti dodijeljena većem broju intervencija, ali svaka intervencija ima tačno jednu kategoriju.
  
#### Firma – Prijava_kvara: 1:N
- Jedna firma može primiti više prijava kvara, ali svaka prijava mora biti upućena tačno jednoj firmi.
  
#### Firma - Korisnik: 1:N
- Jedna firma može imati više korisnika (zaposlenika), ali korisnik može biti vezan za najviše jednu firmu.
  
#### Firma - Blokiranje_korisnika: 1:N
- Blokiranje korisnika uvijek se vrši u kontekstu konkretne firme, gdje firma može imati više zapisa blokiranih korisnika.
  
#### Prijava_kvara – Intervencija: 1:N
- Jedna prijava kvara može rezultirati nastankom jedne ili više intervencija.
  
#### Prijava_kvara - Attachment: 1:N
- Uz jednu prijavu kvara može biti priloženo više fajlova, ali svaki attachment zna uz koju prijavu pripada.
  
#### Intervencija – Firma: N:1 
- Svaka intervencija mora biti vezana za tačno jednu firmu koja je odgovorna za njeno izvršenje, dok jedna firma može imati više intervencija.
  
#### Intervencija – Korisnik: 1:N
- Svaka intervencija mora imati tačno jednog kreatora (koordinatora)
  
#### Intervencija – Zaduženi_serviseri – Korisnik: M:N 
- Jedna intervencija može imati više zaduženih servisera, a jedan serviser može biti zadužen za više intervencija istovremeno.
  
#### Intervencija – Izvještaj: 1:N
- Jedna intervencija može imati više izvještaja, ali svaki izvještaj pripada tačno jednoj intervenciji.
  
#### Intervencija - Komentar_intervencije: 1:N 
- Na jednoj intervenciji može biti ostavljeno više komentara od strane koordinatora ili servisera, ali svaki komentar vezan je za tačno jednu intervenciju.
  
#### Intervencija - Feedback: 1:0..1
- Po završetku intervencije korisnik može ostaviti tačno jedan feedback.
  
#### Intervencija - Attachment: 1:N
- Uz intervenciju mogu biti priloženi fajlovi

#### Intervencija - Historija_status: 1:N
- Jedna intervencija može imati više zapisa o promjeni statusa

#### Intervencija - Notifikacija: 1:N
- Notifikacija može biti vezana za konkretnu intervenciju.
  
#### Izvjestaj - Attachment: 1:N
- Uz servisni izvještaj mogu biti priložene slike ili dokumenti kao dokaz obavljenog rada.
  
#### Tiket – Poruka: 1:N 
- Jedan tiket sadrži cijelu komunikacijsku nit između korisnika i tima podrške kroz više poruka.

#### Tiket - Notifikacija: 1:N
- Jedan tiket može kreirati više notifikacija.

---

### Poslovna pravila važna za model

- Svaki korisnik ima lokalni profil i najmanje jedan povezani eksterni identitet; lozinke i uloge se ne čuvaju lokalno.
- Dozvole u sistemu određuju se na osnovu uloga i claimova koje vraća eksterni identitetski provajder.
- Korisnik može biti aktivan ili blokiran - blokiranje ne deaktivira račun.
- Prijava kvara može biti podnesena bez registracije (user_id nullable).
- Prijava kvara mora biti vezana za firmu i kategoriju.
- Intervencija nastaje iz prijave kvara ili se kreira direktno za planirana održavanja (prijava_id nullable).
- Svaka intervencija mora imati status, prioritet, firmu i kreatora.
- Jedna intervencija može imati više servisera.
- Izvještaj se može kreirati samo za postojeću intervenciju u statusu "U procesu" ili "Završeno".
- Attachment je vezan za intervenciju, prijavu_kvara ili izvještaj gdje barem jedan FK mora biti popunjen; tip i veličina se validiraju.
- Feedback se može ostaviti samo jednom po intervenciji.
- SLA konfiguracija se pretražuje po enum vrijednosti prioriteta.
- Tiket je potpuno odvojen od intervencija.
- Poruka mora pripadati tiketu i autoru.
- Jedna prijava kvara može rezultirati s više intervencija u slučaju kada kvar nije riješen prvom intervencijom i koordinator kreira novu intervenciju za isti kvar.
- Svaka promjena statusa intervencije automatski kreira novi zapis u Historija_status s trenutnim vremenom i korisnikom koji je promjenu izvršio.
- Intervencije se arhiviraju, ali se ne brišu fizički iz baze.
- Notifikacija se kreira automatski pri: dodjeli servisera, novoj prijavi kvara, promjeni statusa, završetku intervencije, automatskoj dodjeli i aktivnosti na tiketu.
- Ako ista notifikacija ide na više korisnika, kreira se zaseban zapis po primaocu.
- Automatska raspodjela se izvršava samo ako je odgovarajuća konfiguracija aktivna.
- Koordinator mora moći ručno izmijeniti automatski dodijeljenog servisera u svakom trenutku bez ograničenja.
- Intervencija može biti bez dodjele servisera ako nema dostupnih servisera pri automatskoj raspodjeli gdje je koordinator u obavezi naknadno dodijeliti servisera ručno.
