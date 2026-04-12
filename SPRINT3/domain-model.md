
### Domain Model
---

#### Glavni entiteti

- Korisnik
- Firma
- Kategorija_kvara
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

---

#### Ključni atributi

**Korisnik**
- id
- firma_id (FK, null)
- ime
- prezime
- korisnicko_ime
- email
- password
- uloga
- aktivan

**Firma**
- id
- naziv
- kontakt
- tip

**Kategorija**
- id
- naziv
- opis

**Prijava_kvara**
- id
- opis
- lokacija
- latitude
- longitude
- user_id (FK, null)
- kategorija_id (FK)
- firma_id (FK)
- datum_prijave

**Intervencija**
- id
- lokacija
- latitude
- longitude
- naziv
- opis
- prioritet
- status
- datum_kreiranja
- datum_pocetka
- rok_zavrsetka
- kategorija_id (FK)
- kreirao_id (FK)
- firma_id (FK)
- arhivirano
- tip
- prijava_id (FK, null)
- periodicnost
- sljedece_generisanje

**Izvjestaj**
- id
- intervencija_id (FK)
- korisnik_id (FK)
- opis
- materijal
- napomene
- datum
- status

**Attachment**
- id
- url
- naziv_fajla
- tip_fajla
- velicina_fajla
- intervencija_id (FK)
- prijava_id (FK, null)
- izvjestaj_id (FK, null)

**Zaduzeni_serviseri**
- id
- intervencija_id (FK)
- user_id (FK)

**Tiket**
- id
- korisnik_id (FK)
- naslov
- kategorija
- status
- datum_kreiranja

**Poruka**
- id
- tiket_id (FK)
- korisnik_id (FK)
- tekst
- datum_kreiranja

**Feedback**
- id
- intervencija_id (FK)
- serviser_id (FK)
- korisnik_id (FK)
- ocjena
- komentar
- datum_kreiranja

**SLA_Konfiguracija**
- id
- prioritet
- rok_sati
- azurirana_at

**Komentar_intervencije**
- id
- intervencija_id (FK)
- korisnik_id (FK)
- tekst
- datum_kreiranja

**Blokiranje_korisnika**
- id
- korisnik_id (FK)
- firma_id (FK)
- koordinator_id (FK)
- razlog
- datum_blokiranja

---

#### Veze između entiteta

### Korisnik – Prijava_kvara: 1:N 
- Jedan korisnik može podnijeti više prijava kvara, ali svaka prijava kvara može biti vezana za najviše jednog korisnika.
  
### Korisnik - Tiket: 1:N 
- Jedan korisnik može kreirati više tiketa za podršku, ali svaki tiket pripada tačno jednom korisniku.
  
### Korisnik - Poruka: 1:N
- Jedan korisnik može napisati više poruka unutar tiketa, ali svaka poruka ima tačno jednog autora.
  
### Korisnik - Blokiranje_korisnika: 1:N
- Jedan korisnik može biti blokiran više puta, ali svaki zapis blokiranja odnosi se na tačno jednog korisnika.
  
### Kategorija – Prijava_kvara: 1:N
-  Jedna kategorija može pokriti više prijava kvara, ali svaka prijava mora biti svrstana u tačno jednu kategoriju.
  
### Kategorija - Intervencija: 1:N
- Jedna kategorija može biti dodijeljena većem broju intervencija, ali svaka intervencija ima tačno jednu kategoriju.
  
### Firma – Prijava_kvara: 1:N
- Jedna firma može primiti više prijava kvara, ali svaka prijava mora biti upućena tačno jednoj firmi.
  
### Firma - Korisnik: 1:N
- Jedna firma može imati više korisnika (zaposlenika), ali korisnik može biti vezan za najviše jednu firmu.
  
### Firma - Blokiranje_korisnika: 1:N
- Blokiranje korisnika uvijek se vrši u kontekstu konkretne firme, gdje firma može imati više zapisa blokiranih korisnika.
  
### Prijava_kvara – Intervencija: 1:0..1
- Jedna prijava kvara može rezultirati nastankom jedne intervencije, ili može predstavljati redovno održavanje.
  
### Prijava_kvara - Attachment: 1:N
- Uz jednu prijavu kvara može biti priloženo više fajlova, ali svaki attachment zna uz koju prijavu pripada.
  
### Intervencija – Firma: N:1 
- Svaka intervencija mora biti vezana za tačno jednu firmu koja je odgovorna za njeno izvršenje, dok jedna firma može imati više intervencija.
  
### Intervencija – Korisnik: 1:N
- Svaka intervencija mora imati tačno jednog kreatora (koordinatora)
  
### Intervencija – Zaduženi_serviseri – Korisnik: M:N 
- Jedna intervencija može imati više zaduženih servisera, a jedan serviser može biti zadužen za više intervencija istovremeno.
  
### Intervencija – Izvještaj: 1:N
- Jedna intervencija može imati više izvještaja, ali svaki izvještaj pripada tačno jednoj intervenciji.
  
### Intervencija - Komentar_intervencije: 1:N 
- Na jednoj intervenciji može biti ostavljeno više komentara od strane koordinatora ili servisera, ali svaki komentar vezan je za tačno jednu intervenciju.
  
### Intervencija - Feedback: 1:0..1
- Po završetku intervencije korisnik može ostaviti tačno jedan feedback.
  
### Intervencija - Attachment: 1:N
- Uz intervenciju mogu biti priloženi fajlovi
  
### Izvjestaj - Attachment: 1:N
- Uz servisni izvještaj mogu biti priložene slike ili dokumenti kao dokaz obavljenog rada.
  
### Tiket – Poruka: 1:N 
- Jedan tiket sadrži cijelu komunikacijsku nit između korisnika i tima podrške kroz više poruka.

---

#### Poslovna pravila važna za model

- Svaki korisnik mora imati dodijeljenu ulogu (enum).
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
- Intervencije se arhiviraju, ali se ne brišu fizički iz baze.
