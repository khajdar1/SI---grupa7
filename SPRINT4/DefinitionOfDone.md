# Definition of Done (DoD)

DoD je dogovoreni skup kriterija koji tim koristi da odluči kada je user story stvarno završena. To nije univerzalna lista za sve projekte; mijenja se sa arhitekturom, test strategijom i načinom isporuke.

## 1. Šta znači „done“ u ovom projektu

- User story ispunjava sva acceptance criteria.
- Funkcionalnost radi u dogovorenom opsegu, uključujući normalan tok i relevantne edge caseove.
- Kod je napisan u skladu sa dogovorenim projektnim konvencijama i standardima (struktura, naming, formatting, lint/formatter).
- Kod je pregledan i odobren kroz pull request.
- Relevantni testovi su prošli.
- Izmjene su integrisane u GitFlow tok i spojene u `develop`.
- Funkcionalnost je provjerena u target ili develop okruženju prije release-a.
- Dokumentacija, backlog i po potrebi release notes/changelog odražavaju stvarno stanje.

## 2. Kriteriji koje svaka završena stavka mora ispuniti

### Funkcionalni kriteriji

- Sva acceptance criteria su implementirane.
- Validacije, autorizacija, permisije i greške rade po dogovorenom ponašanju.
- Edge caseovi iz user storyja su pokriveni.
- Podaci se čuvaju i čitaju iz baze ispravno.
- Nema nedovršenih TODO ili placeholder path-ova na completed flow-u.

### Tehnički kriteriji

- Kod prolazi typecheck i, gdje postoji, lint i build.
- Promjena je otvorena na odgovarajućem radnom branchu i integrisana kroz PR.
- PR je odobren od najmanje jednog člana tima; za rizične, security-sensitive ili kompleksne izmjene traži se approval više članova tima.
- CI provjere su zelene prije merge-a.
- Nove promjene ne narušavaju postojeće funkcionalnosti.
- Ne postoje otvoreni critical ili high bugovi vezani za tu stavku.

### Ne-funkcionalni kriteriji

- Ako promjena dodiruje autentikaciju, autorizaciju, input validation ili tajne, urađena je osnovna security provjera i nema očiglednih rupa u pristupu.
- Ako promjena utiče na UI, provjerena je osnovna dostupnost preko tastature, čitljivost i responsive ponašanje na ciljanim rezolucijama.
- Ako promjena utiče na kritičan endpoint ili workflow, nema vidljivog performans regres ponašanja u odnosu na očekivani opseg.

### Operativni i release kriteriji

- Ako promjena uključuje bazu, migracija je backward-compatible gdje je moguće i deploy redoslijed je provjeren.
- Ako promjena uvodi novi kritični tok, postoje logovi ili tragovi koji omogućavaju praćenje problema u produkciji.
- Ako promjena utiče na korisnike ili API, ažurirani su relevantni changelog, release note ili API dokumentacija.
- Postoji jasan rollback put ili je promjena sigurna za revert bez ručnih popravki.

### Test kriteriji

- Relevantni automatski testovi prolaze, a minimalni skup uključuje unit testove za novu logiku i integration testove gdje promjena prelazi preko više slojeva.
- Po potrebi su pokriveni i end-to-end testovi za kompletan korisnički tok.
- Ručni smoke test na targetiranom okruženju je uspješan.
- Ako je stavka vezana za UI/UX, provjereni su i keyboard navigacija, osnovni kontrast i izgled na ciljanim rezolucijama.
- Ako je stavka vezana za regresiju, security, bazu ili performanse, urađena je pripadajuća provjera.

### Procesni kriteriji

- Feature branch je kreiran iz `develop`.
- Završena promjena ide kroz PR nazad u `develop`.
- Fix branch je kreiran iz `develop` kada se rješava bug koji ne traži hitnu produkcijsku intervenciju.
- Fix branch se također završava PR-om nazad u `develop`.
- Kada je release kandidat spreman, otvara se `release/*` grana iz `develop`.
- Release grana se poslije validacije merge-a u `master` i nazad u `develop`.
- Hitna produkcijska ispravka ide kroz `hotfix/*` granu iz `master` i vraća se i u `master` i u `develop`.
- Konflikti su riješeni prije merge-a, a branch je ažuriran prema target grani.
- Hotfix također prolazi review; kod urgentnih ispravki review može biti ubrzan, ali se ne preskače.
- Za security-sensitive, auth ili database schema promjene traži se dodatni pregled drugog člana tima i kratka provjera rizika prije merge-a.

### Dokumentacija i traceability

- Ako se scope promijeni, ažuriran je Product Backlog.
- Sprint Backlog odražava stvarni status rada.
- Relevantna tehnička dokumentacija je ažurirana.
- Ako se koristi AI, to je evidentirano kroz AI Usage Log.

## 3. Napomena

Ovaj DoD je projektno-specifičan i može se ažurirati ako se promijeni arhitektura, test strategija ili deploy proces.

