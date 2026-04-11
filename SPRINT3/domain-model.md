
### Domain Model
---

#### Glavni entiteti

- Korisnik
- Firma
- Kategorija_kvara
- Prijava_kvara
- Intervencija
- Izvještaj
- Attachment
- Dodjela_servisera
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
- blokiran

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

**Izvještaj**
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
- prijava_id (FK)

**Zaduženi_serviseri**
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

- Korisnik – Prijava_kvara: 1:N 
- Korisnik - Tiket: 1:N 
- Korisnik - Poruka: 1:N
- Korisnik - Blokiranje_korisnika: 1:N
- Kategorija – Prijava_kvara: 1:N  
- Kategorija - Intervencija: 1:N
- Firma – Prijava_kvara: 1:N 
- Firma - Korisnik: 1:N 
- Prijava_kvara – Intervencija: 1:0..1
- Prijava_kvara - Attachment: 1:N  
- Intervencija – Firma: N:1  
- Intervencija – Korisnik: 1:N
- Intervencija - Attachment: 1:N  
- Intervencija – Zaduženi_serviseri – Korisnik: M:N  
- Intervencija – Izvještaj: 1:N
- Intervencija - Komentar_intervencije: 1:N  
- Intervencija - Feedback: 1:0..1  
- Tiket – Poruka: 1:N  

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
- Attachment je vezan za intervenciju; tip i veličina se validiraju.
- Feedback se može ostaviti samo jednom po intervenciji.
- SLA konfiguracija se pretražuje po enum vrijednosti prioriteta.
- Tiket je potpuno odvojen od intervencija.
- Poruka mora pripadati tiketu i autoru.
- Intervencije se arhiviraju, ali se ne brišu fizički iz baze.
