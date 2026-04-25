# Architecture Overview

## Kratak opis arhitektonskog pristupa

Za razvoj sistema za prijavu, praćenje i upravljanje kvarovima predviđen je web-based client-server arhitektonski pristup. Sistem će koristiti Next.js za implementaciju korisničkog interfejsa, dok će serverski dio sistema biti realizovan kao Node.js aplikacija koristeći Express.js framework, koji implementira REST API za komunikaciju sa klijentskom aplikacijom. Backend aplikacija će biti povezana sa MySQL bazom podataka preko Prisma ORM sloja.

Predložena je monolitna modularna arhitektura, sa jasno odvojenim logičkim modulima unutar jedne backend aplikacije. Ovakav pristup je izabran zato što je pogodan za sistem srednje složenosti, omogućava brži razvoj, jednostavnije testiranje i lakše održavanje u početnim fazama projekta. 

## Glavne komponente sistema

Glavne komponente sistema mogu se podijeliti na sljedeće cjeline:

1. Klijentska aplikacija (Frontend)
- Web aplikacija razvijena u Next.js-u, dostupna kroz preglednik.

2. Aplikacioni server (Backend)
- Centralni serverski sloj implementiran kao Node.js aplikacija koristeći Express.js framework, koji pruža REST API za komunikaciju sa klijentskom aplikacijom. Backend je odgovoran za obradu zahtjeva, validaciju podataka, primjenu poslovne logike i komunikaciju sa bazom podataka.

3. Baza podataka
- Relacijska baza podataka MySQL za trajno čuvanje podataka o korisnicima, kvarovima, intervencijama, timovima i historiji aktivnosti, dok Prisma Client služi kao ORM sloj između backend logike i baze.

4. Modul za autentikaciju i autorizaciju
- Podsistem zadužen za prijavu korisnika, upravljanje sesijama i kontrolu pristupa na osnovu identiteta i uloga koje dolaze iz eksternog identitetskog provajdera. Aplikacija ne čuva lozinke niti lokalne uloge; korisnik kreira lokalni profil, a provajder identiteta je izvor prijave i role/claimova. JWT (JSON Web Token) se koristi za sesije aplikacije, dok OAuth 2.0/OIDC omogućava sigurnu integraciju sa eksternim provajderima, poput Google-a ili Microsoft-a.

5. Modul za upravljanje kvarovima i intervencijama
- Glavni poslovni modul zadužen za prijavu kvara, klasifikaciju, određivanje prioriteta, dodjelu timova i praćenje statusa.

6. Modul za raspodjelu i koordinaciju timova
- Podsistem koji omogućava koordinatoru dodjelu dostupnih ekipa i planiranje rada u slučaju više istovremenih intervencija.

7. Modul za notifikacije
- Komponenta zadužena za slanje obavještenja korisnicima i zaposlenima o promjenama statusa, novim zadacima i hitnim intervencijama. Koristi WebSocket konekciju za isporuku notifikacija u realnom vremenu, omogućavajući trenutno obavještavanje bez potrebe za osvježavanjem stranice.

8. Administrativni modul
- Komponenta za upravljanje korisničkim profilima, povezanim eksternim identitetima i osnovnim sistemskim postavkama.

9. Analitičko-izvještajni modul
- Podsistem za pregled historije intervencija, osnovnih statistika i izvještaja za menadžment.

10. Integracioni sloj
- Sloj za buduće povezivanje sa eksternim sistemima, kao što su SMS/email servisi.

11. File Storage Modul
- Omogućava upload, čuvanje i pristup datotekama vezanim za prijave kvarova i intervencije. Sistem čuva metapodatke o fajlovima (naziv, tip, veličina, putanja, povezanost sa prijavom) u bazi podataka, dok se sami fajlovi čuvaju u cloud storage sistemu (Cloudflare R2 free tier). Ovakav pristup omogućava efikasno upravljanje većim količinama podataka, bolju skalabilnost i veću pouzdanost u odnosu na lokalno čuvanje datoteka.

## Odgovornosti komponenti
1. Next.js Web Client

Odgovoran je za prikaz korisničkog interfejsa i interakciju sa krajnjim korisnicima sistema. Omogućava:

- prijavu i autentikaciju korisnika,
- unos prijava kvarova,
- pregled statusa intervencija,
- upravljanje zadacima za koordinatore i ekipe,
- pregled izvještaja za menadžment,
- administraciju korisnika i prava pristupa.

Frontend komunicira sa backendom putem API poziva i prikazuje podatke u formi tabela, formulara, mapa i dashboard prikaza.

2. Backend Application / REST API

Predstavlja centralnu poslovnu logiku sistema. Njegove odgovornosti su:

- obrada zahtjeva sa klijentske aplikacije,
- validacija ulaznih podataka,
- izvršavanje poslovnih pravila,
- upravljanje tokom rada intervencija,
- komunikacija sa bazom podataka,
- upravljanje sigurnošću i pravima pristupa.

3. Auth Module

Zadužen je za:

- autentikaciju korisnika,
- provjeru identiteta,
- autorizaciju na osnovu korisničkih rola,
- upravljanje sesijama ili tokenima,
- zaštitu API endpointa.

4. Modul za upravljanje kvarovima i intervencijama

Ovo je ključni modul sistema. Njegove funkcije su:

- evidentiranje prijava kvarova,
- kategorizacija prijava po tipu kvara,
- određivanje prioriteta intervencije,
- praćenje statusa prijave,
- vođenje historije promjena nad prijavom.

5. Modul za raspodjelu i koordinaciju timova

Odgovoran je za:

- pregled raspoloživih timova,
- dodjelu intervencija odgovarajućim ekipama,
- upravljanje opterećenjem timova,
- definisanje prioriteta kod više istovremenih kvarova,
- podršku koordinatoru u planiranju rada.

6. Modul za notifikacije

Njegova uloga je:

- obavještavanje korisnika da je prijava zaprimljena,
- obavještavanje ekipe da joj je dodijeljen zadatak,
- slanje upozorenja o promjeni statusa,
- slanje hitnih obavještenja za intervencije visokog prioriteta.

7. Analitičko-izvještajni modul

Odgovoran je za:

- generisanje pregleda intervencija,
- prikaz broja kvarova po tipu, statusu i vremenu,
- analizu prosječnog vremena odziva i rješavanja,
- podršku menadžmentu pri donošenju odluka.

8. Administrativni modul

Ovaj modul služi za:

- kreiranje i deaktivaciju korisničkih naloga,
- dodjelu rola i privilegija,
- upravljanje organizacionom strukturom,

9. Baza podataka

Model baze podataka je relacijski i organizovan je kroz međusobno povezane entitete.

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

10. Integracioni sloj

Ova komponenta služi za integraciju sa servisima za slanje email ili SMS poruka.

## Tok podataka i interakcija

Tipovi podataka u sistemu

Sistem razmjenjuje i obrađuje sljedeće tipove podataka:

- korisnički podaci,
- podaci o prijavi kvara,
- lokacijski podaci o kvaru,
- statusni podaci intervencije,
- podaci o timovima i raspoloživosti,
- historija aktivnosti i audit logovi,
- izvještajni i statistički podaci,
- notifikacione poruke.

Tip interakcije između komponenti:

- Frontend ↔ Backend: komunikacija putem HTTP/HTTPS REST API poziva, razmjena podataka u JSON formatu.
- Backend ↔ MySQL: komunikacija putem Prisma Client-a koji generiše SQL upite.
- Backend ↔ Notification Service: asinhrona ili polu-sinhrona komunikacija za slanje obavještenja.
- Backend ↔ File Storage (Cloudflare R2): komunikacija putem HTTPS protokola korištenjem S3-kompatibilnog API-ja za upload i pristup datotekama. Datoteke se šalju kao binarni sadržaj, dok se u bazi čuvaju reference (URL ili key).
- Frontend ↔ File Storage (Cloudflare R2): indirektna komunikacija putem signed URL-ova, koji omogućavaju direktan i siguran pristup datotekama bez prolaska kroz backend.
- Unutrašnji moduli backenda: logička komunikacija kroz interne slojeve i funkcijske pozive.


Primjer toka podataka

- Scenario 1: Prijava novog kvara
    - Korisnik unosi prijavu kvara kroz Next.js web aplikaciju.
    - Frontend šalje POST zahtjev backend API-ju u JSON formatu.
    - Backend validira podatke i preko Prisma Client-a zapisuje prijavu u MySQL bazu.
    - Incident Management Module kreira zapis prijave i dodjeljuje početni status.
    - Notification Module šalje potvrdu korisniku.
    - Koordinator u svom interfejsu vidi novu prijavu.

- Scenario 2: Dodjela intervencije timu
    - Koordinator otvara listu otvorenih kvarova.
    - Backend dohvaća podatke iz baze i vraća ih frontend-u.
    - Koordinator bira tim i dodjeljuje intervenciju.
    - Modul za raspodjelu i koordinaciju timova ažurira zapis u bazi preko Prisma Client-a.
    - Modul za notifikacije (WebSocket) momentalno šalje obavještenje terenskoj ekipi.
    - Ekipa ažurira status rada sa terena.

- Scenario 3: Zatvaranje intervencije
    - Terenska ekipa označava intervenciju kao završenu i započinje upload finalnog izvještaja.
    - Backend validira datoteku (tip, veličina, sigurnosne provjere).
    - Backend zatim šalje datoteku u Cloudflare R2 cloud storage.
    - Nakon uspješnog upload-a, backend dobija referencu (URL ili key) datoteke.
    - Metapodaci o datoteci (naziv, tip, veličina, storage putanja, povezanost sa prijavom) se čuvaju u MySQL bazi preko Prisma Client-a.
    - Backend evidentira završetak, vrijeme intervencije i napomene.
    - Sistem ažurira historiju aktivnosti.
    - Menadžment može kasnije analizirati trajanje i efikasnost rješavanja.


## Ključne tehničke odluke

1. Izbor monolitne modularne arhitekture

Odlučeno je da se koristi monolitna modularna arhitektura, a ne mikroservisna.

Razlozi:

- Sistem je funkcionalno povezan i obuhvata domenski blisko vezane procese, zbog čega nema potrebe za fizičkim razdvajanjem servisa.
- Smanjuje se kompleksnost sistema jer se izbjegava mrežna komunikacija između servisa, sinhronizacija podataka i dodatna infrastruktura.
- Razvoj i održavanje su jednostavniji jer se cijela poslovna logika nalazi u jednoj modularnoj API aplikaciji, što olakšava razumijevanje i izmjene.
- Testiranje je efikasnije, posebno integraciono testiranje, jer nema zavisnosti između više nezavisnih servisa.
- Deploy proces je jednostavniji jer se backend isporučuje kao jedna modularna API aplikacija, dok se frontend deploya zasebno kao Next.js klijent, što smanjuje mogućnost grešaka prilikom isporuke.
- Arhitektura omogućava kasniju evoluciju u mikroservise ukoliko sistem poraste i pojavi se realna potreba za skaliranjem pojedinih dijelova.

2. Client-server pristup

Sistem koristi client-server model u kojem klijentska aplikacija komunicira sa centralizovanim serverskim dijelom putem mreže.

Razlozi:

- Centralizovano upravljanje podacima omogućava da se svi podaci čuvaju i obrađuju na jednom mjestu, čime se osigurava konzistentnost i smanjuje mogućnost grešaka ili neusklađenosti između različitih korisnika.
- Jednostavnija kontrola pristupa postiže se jer se autentikacija i autorizacija implementiraju na serverskoj strani, što omogućava jedinstvenu primjenu sigurnosnih pravila i lakše upravljanje korisničkim privilegijama.
- Jedinstvena verzija sistema za sve korisnike znači da svi korisnici koriste istu logiku i funkcionalnosti, bez potrebe za lokalnim instalacijama ili ažuriranjima, čime se izbjegavaju problemi kompatibilnosti.
- Olakšano praćenje aktivnosti i audit logova jer svi zahtjevi prolaze kroz backend, što omogućava centralizovano evidentiranje korisničkih akcija i bolju kontrolu nad radom sistema.

3. Web-based rješenje

Odlučeno je da sistem bude implementiran kao web aplikacija dostupna putem preglednika.

Razlozi:

- Pristup sa različitih uređaja bez instalacije omogućava korisnicima (koordinatori, terenske ekipe, administratori) da koriste sistem sa računara, tableta ili mobilnih uređaja bez dodatne konfiguracije.
- Lakše održavanje i ažuriranje jer se sve promjene implementiraju na serverskoj strani i odmah su dostupne svim korisnicima, bez potrebe za distribucijom novih verzija aplikacije.
- Pogodnost za različite tipove korisnika omogućava fleksibilno korištenje sistema u različitim radnim okruženjima, uključujući kancelarijski i terenski rad.
- Jednostavnije uvođenje u radno okruženje jer nije potrebna instalacija niti specifična konfiguracija na korisničkim uređajima.

4. Next.js za frontend

Za implementaciju klijentske aplikacije odabran je Next.js.

Razlozi:

- Next.js omogućava kombinaciju server-side rendering-a, route-based strukture i komponentnog razvoja, što je pogodno za sistem sa više uloga i različitim pregledima podataka.
- App Router pristup olakšava organizaciju page shellova za autentikaciju, dashboard, administraciju i operativne tokove.
- Integracija sa React ekosistemom čini Next.js pogodnim za prikaz kompleksnih operativnih ekrana bez nepotrebne client-side rute logike.
- Jednostavna integracija sa REST API-jem čini Next.js pogodnim za komunikaciju sa backend sistemom zasnovanim na HTTP zahtjevima.

5. MySQL kao baza podataka uz Prisma ORM

Za čuvanje podataka koristi se MySQL relacijska baza podataka, a Prisma ORM je sloj kroz koji backend pristupa tim podacima.

Razlozi:

- Pouzdanost i stabilnost MySQL-a čine ga pogodnim za sisteme koji zahtijevaju kontinuiran rad i integritet podataka.
- Strukturirani model podataka omogućava jasno definisanje relacija između entiteta kao što su korisnici, kvarovi, intervencije i timovi.
- Podrška za transakcije je ključna za osiguravanje ispravnosti operacija, posebno kod ažuriranja statusa i dodjele zadataka.
- Prisma ORM daje tipiziran, čitljiv i standardizovan pristup bazama podataka, što timu smanjuje količinu ručnog SQL-a i ubrzava razvoj.

6. REST API komunikacija

Za komunikaciju između frontend i backend dijela sistema koristi se REST API sa JSON formatom razmjene podataka.

Razlozi:

- Jednostavna implementacija i razumijevanje REST pristupa omogućava brži razvoj i lakšu integraciju komponenti.
- Standardizovan način komunikacije koji je široko prihvaćen u web aplikacijama.
- Kompatibilnost sa frontend tehnologijama kao što je Next.js, koji prirodno koristi HTTP zahtjeve.
- Lako testiranje i dokumentovanje API-ja korištenjem alata kao što je Postman.

7. JWT i OAuth/OIDC

Odlučeno je da se koristi JWT (JSON Web Token) za aplikacijske sesije, dok OAuth 2.0/OIDC služi kao most prema eksternim identitetskim sistemima.

Razlozi:

- Stateless pristup autentikaciji kod JWT-a znači da server ne mora čuvati stanje korisničkih sesija, već se svi potrebni podaci o korisniku nalaze unutar samog tokena. 
- Jednostavna integracija sa REST API arhitekturom omogućava da se JWT token šalje uz svaki HTTP zahtjev (najčešće u Authorization headeru), što se uklapa u način komunikacije između Next.js frontenda i backend API-ja.
- Efikasno upravljanje autentikacijom i autorizacijom jer token može sadržavati identitet i role/claimove korisnika, što omogućava backendu da brzo provjeri prava pristupa bez dodatnih upita prema bazi podataka u svakom zahtjevu.
- Fleksibilnost i proširivost sistema jer se uvođenjem OAuth-a omogućava lakše povezivanje sa drugim sistemima bez potrebe za kreiranjem novih korisničkih naloga unutar aplikacije.
- JWT tokeni imaju ograničeno vrijeme trajanja, čime se dodatno povećava sigurnost sistema.

8. Role-based access control

Sistem koristi kontrolu pristupa zasnovanu na ulogama i claimovima koje vraća eksterni identitetski provajder.

Razlozi:

- Različiti tipovi korisnika imaju različite odgovornosti (npr. korisnik prijavljuje kvar, koordinator dodjeljuje zadatke, administrator upravlja sistemom).
- Povećanje sigurnosti sistema jer se pristup funkcionalnostima ograničava na osnovu role/claimova iz provajdera.
- Sprječava neovlašten pristup osjetljivim funkcijama i podacima.

9. Audit log i historija aktivnosti

Predviđeno je vođenje audit logova i historije aktivnosti unutar sistema.

Razlozi:

- Transparentnost rada sistema omogućava uvid u sve promjene i aktivnosti korisnika.
- Praćenje odgovornosti jer se svaka akcija može povezati sa konkretnim korisnikom i vremenom izvršenja.
- Podrška analizi i unapređenju procesa kroz pregled historijskih podataka o intervencijama i radu sistema.

## Ograničenja i rizici arhitekture

1. Ograničenja monolitne arhitekture

Iako je monolitna arhitektura praktična za početak, može predstavljati problem ako sistem značajno poraste.

Rizici:

- teže skaliranje pojedinačnih funkcionalnosti,
- veća međuzavisnost modula,
- složenije održavanje kod velikog broja funkcionalnosti.

2. Zavisnost od mrežne konekcije

Pošto je sistem web-based i centralizovan, njegov rad zavisi od dostupnosti mreže i servera.

Rizici:

- otežan pristup sistemu u slučaju prekida mreže,

3. Opterećenje pri većem broju simultanih prijava

U situacijama većeg broja istovremenih kvarova sistem mora brzo obrađivati i prioritizovati zahtjeve.

Rizici:

- zagušenje backend-a,
- sporiji odziv aplikacije,
- mogućnost kašnjenja u dodjeli zadataka.

4. Kvalitet ulaznih podataka

Ako korisnici prijavu unose nepotpuno ili netačno, može doći do lošeg usmjeravanja intervencije.

Rizici:

- pogrešna procjena prioriteta,
- dodjela pogrešnog tima,
- produženje vremena rješavanja.

5. Sigurnosni rizici

Sistem sadrži osjetljive operativne podatke.

Rizici:

- neovlašten pristup,
- zloupotreba korisničkih računa,
- izmjena podataka bez evidencije ako sigurnosni mehanizmi nisu pravilno implementirani.

6. Rizik vezan za notifikacije

Ako se koristi eksterni servis za obavještenja (gmail), sistem postaje djelimično zavisan od treće strane.

Rizici:

- kašnjenje ili neuspješno slanje obavještenja,
- dodatni troškovi integracije i održavanja.

7. Rizik vezan za cloud storage

U slučaju nedostupnosti servisa (Cloudflare R2) ili problema sa mrežnom konekcijom funkcionisanje sistema zavisi od treće strane.

Rizici:

- pristup datotekama može biti ograničen ili onemogućen,
- korištenje eksternog servisa uvodi dodatne troškove vezane za skladištenje i prijenos podataka.

## Otvorena pitanja

1. Da li će sistem u prvoj verziji podržavati samo web pristup ili i posebni mobilni interfejs za terenske ekipe?
2. Da li će prioritet intervencije biti određivan ručno od strane koordinatora ili će postojati automatska pravila prioritizacije?
3. Da li će se lokacija kvara unositi tekstualno ili će biti integrisana mapa/GIS podrška?
4. Koliki broj istovremenih korisnika i prijava treba podržati u produkciji?
5. Koji nivo analitike i izvještavanja menadžment očekuje u prvoj verziji sistema?

