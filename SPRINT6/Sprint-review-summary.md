## Sprint 6

# 1. Planirani sprint goal

Implementirati ključne funkcionalnosti za operativno upravljanje intervencijama kroz planiranje intervencija, dodjelu servisera, postavljanje prioriteta, pregled aktivnih i historijskih intervencija, upravljanje korisničkim računima, komentare intervencija i attachmentima.

Cilj sprinta bio je omogućiti koordinatorima i administratorima efikasnije upravljanje servisnim procesom, a serviserima bolji uvid u dodijeljene i prethodne intervencije.

# 2. Šta je završeno

Tim je uspješno realizirao planirane aktivnosti za Sprint 6:

- Planiranje intervencija — omogućeno je kreiranje i planiranje intervencija kroz unos ključnih podataka potrebnih za organizaciju servisnog rada.

- Pregled liste aktivnih intervencija — implementiran je prikaz aktivnih intervencija kako bi korisnici mogli pratiti trenutno otvorene i relevantne intervencije.

- Dodjela servisera intervenciji — omogućeno je povezivanje servisera sa konkretnom intervencijom, čime se jasno definiše odgovorna osoba za izvršenje zadatka.

- Postavljanje prioriteta intervencije — dodata je mogućnost određivanja prioriteta intervencije kako bi se hitniji slučajevi mogli lakše razlikovati i brže obrađivati.

- Historija intervencija — omogućeno je servisерima da koriste historiju intervencija kao ispomoć pri rješavanju sličnih kvarova ili problema.

- Upravljanje korisničkim računima — administratoru je omogućeno upravljanje korisničkim računima, uključujući pregled i osnovnu administraciju korisnika sistema.

- Komentari intervencije — implementirana je funkcionalnost dodavanja komentara na intervenciju, čime korisnici mogu ostavljati dodatne napomene, pojašnjenja ili informacije sa terena.

- Pregled i upravljanje attachmentima — omogućeno je dodavanje, pregled i upravljanje prilozima vezanim za intervenciju, čime se dokumentacija i dodatni materijali čuvaju uz odgovarajuću intervenciju.

- Testiranje funkcionalnosti — izvršena je provjera implementiranih funkcionalnosti kroz ručno testiranje i odgovarajuće testove gdje su bili potrebni.

- Sprint Backlog i prateća dokumentacija — ažurirani su statusi zadataka i zabilježene odluke vezane za implementaciju funkcionalnosti.

# 3. Šta nije završeno

Sve planirane stavke za Sprint 6 su završene u skladu sa dogovorenim obimom sprinta.

Manja dodatna poboljšanja, poput naprednijeg filtriranja, dodatnih prikaza historije i proširenih opcija za attachmentе, ostaju kao mogući kandidati za naredne sprinteve.

# 4. Demonstrirane funkcionalnosti ili artefakti

- Planiranje nove intervencije
- Pregled liste aktivnih intervencija
- Dodjela servisera intervenciji
- Postavljanje prioriteta intervencije
- Prikaz prioriteta kroz korisnički interfejs
- Pregled historije intervencija dostupan serviserima
- Administratorsko upravljanje korisničkim računima
- Dodavanje komentara na intervenciju
- Pregled komentara vezanih za intervenciju
- Dodavanje i pregled attachmenta
- Upravljanje attachmentima na intervenciji
- Ažuriran Sprint Backlog
- Testirani implementirani scenariji
- Pripremljen kod za push/merge kroz odgovarajuću feature granu

# 5. Glavni problemi i blokeri

- Najviše pažnje posvećeno je povezivanju intervencija sa serviserima i osiguravanju da se dodjela pravilno prikazuje u korisničkom interfejsu.

- Kod pregleda aktivnih intervencija bilo je potrebno jasno razdvojiti aktivne intervencije od historijskih, kako korisnici ne bi imali nejasan prikaz podataka.

- Za historiju intervencija bilo je potrebno odrediti koji podaci su korisni serviserima kao ispomoć, a da prikaz ne bude preopterećen nepotrebnim informacijama.

- Kod komentara intervencije bilo je potrebno osigurati da se komentari trajno vežu za odgovarajuću intervenciju i da se pravilno učitavaju pri prikazu detalja intervencije.

- Kod attachmenta je bilo potrebno uskladiti prikaz i upravljanje fajlovima sa postojećom strukturom intervencija.

- Kod administratorskog upravljanja korisnicima bilo je potrebno uskladiti prava pristupa sa postojećim rolama u sistemu.

# 6. Ključne odluke donesene u sprintu

- Intervencija se planira kroz centralni tok rada u kojem se unose osnovni podaci, prioritet i potrebne informacije za dalju obradu.

- Aktivne intervencije se prikazuju odvojeno od historijskih intervencija kako bi korisnici imali jasan pregled trenutnog operativnog stanja.

- Dodjela servisera intervenciji realizuje se povezivanjem intervencije sa korisnikom koji ima odgovarajuću servisersku ulogu.

- Prioritet intervencije koristi se kao vidljiva oznaka u korisničkom interfejsu kako bi se hitnije intervencije lakše uočile.

- Historija intervencija dostupna je serviserima kao dodatna pomoć pri rješavanju sličnih kvarova i ponavljajućih problema.

- Komentari se čuvaju kao trajno vezane napomene uz intervenciju, kako bi komunikacija i informacije sa terena ostale dostupne u sistemu.

- Attachmenti se vežu za konkretnu intervenciju, čime se omogućava čuvanje dodatne dokumentacije, slika ili drugih relevantnih fajlova.

- Administratorske funkcionalnosti za korisničke račune ograničene su na korisnike sa odgovarajućim pravima pristupa.

# 7. Povratna informacija Product Ownera



# 8. Zaključak za naredni sprint

Za Sprint 7 planiran je nastavak rada na dodatnom unapređenju sistema, sa fokusom na:

- detaljnije filtriranje i pretragu intervencija
- dodatno unapređenje rada sa attachmentima
- unapređenje notifikacija i komunikacije između koordinatora i servisera
- dodatno testiranje i stabilizaciju implementiranih funkcionalnosti