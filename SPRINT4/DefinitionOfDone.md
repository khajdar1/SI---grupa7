# Definition of Done (DoD)

DoD je dogovoreni skup kriterija koji tim koristi da odluči kada je user story stvarno završena. To nije univerzalna lista za sve projekte; mijenja se sa arhitekturom, test strategijom i načinom isporuke.

## 1. Šta znači „done“ u ovom projektu

- User story ispunjava sva acceptance criteria.
- Funkcionalnost radi u dogovorenom opsegu, uključujući normalan tok i relevantne edge caseove.
- Kod je pregledan i odobren kroz pull request.
- Relevantni testovi su prošli.
- Izmjene su integrisane u GitFlow tok i spojene u `develop`.
- Funkcionalnost je provjerena u target ili develop okruženju prije release-a.
- Dokumentacija i backlog odražavaju stvarno stanje.

## 2. Kriteriji koje svaka završena stavka mora ispuniti

### Funkcionalni kriteriji

- Sva acceptance criteria su implementirane.
- Validacije, autorizacija, permisije i greške rade po dogovorenom ponašanju.
- Edge caseovi iz user storyja su pokriveni.
- Podaci se čuvaju i čitaju iz baze ispravno.
- Nema nedovršenih TODO ili placeholder path-ova na completed flow-u.

### Tehnički kriteriji

- Kod prolazi typecheck i, gdje postoji, lint i build.
- Promjena je otvorena na feature branchu i integrisana kroz PR.
- PR je odobren od najmanje jednog člana tima; za rizične ili kompleksne izmjene traži se approval više članova tima.
- CI provjere su zelene prije merge-a.
- Nove promjene ne narušavaju postojeće funkcionalnosti.
- Ne postoje otvoreni critical ili high bugovi vezani za tu stavku.

### Test kriteriji

- Relevantni automatski testovi prolaze.
- Po potrebi su pokriveni unit, integration i end-to-end testovi.
- Ručni smoke test na targetiranom okruženju je uspješan.
- Ako je stavka vezana za UI/UX, provjeren je i izgled na ciljanim rezolucijama.
- Ako je stavka vezana za regresiju, security ili performanse, urađena je pripadajuća provjera.

### Procesni kriteriji

- Feature branch je kreiran iz `develop`.
- Završena promjena ide kroz PR nazad u `develop`.
- Fix branch je kreiran iz `develop` kada se rješava bug koji ne traži hitnu produkcijsku intervenciju.
- Fix branch se također završava PR-om nazad u `develop`.
- Kada je release kandidat spreman, otvara se `release/*` grana iz `develop`.
- Release grana se poslije validacije merge-a u `master` i nazad u `develop`.
- Hitna produkcijska ispravka ide kroz `hotfix/*` granu iz `master` i vraća se i u `master` i u `develop`.
- Konflikti su riješeni prije merge-a, a branch je ažuriran prema target grani.

### Dokumentacija i traceability

- Ako se scope promijeni, ažuriran je Product Backlog.
- Sprint Backlog odražava stvarni status rada.
- Relevantna tehnička dokumentacija je ažurirana.
- Ako se koristi AI, to je evidentirano kroz AI Usage Log.

## 3. Kako to izgleda praktično

Primjer: user story za prijavu putem Google naloga nije done samo zato što je login ekran napravljen. Done je tek kada:

- login radi na ciljanoj okolini,
- acceptance criteria su zadovoljeni,
- code review je odrađen,
- testovi prolaze,
- feature je spojen u `develop`,
- i tim se slaže da nema otvorenih blokirajućih problema.

## 4. Napomena

Ovaj DoD je projektno-specifičan i može se ažurirati ako se promijeni arhitektura, test strategija ili deploy proces.

