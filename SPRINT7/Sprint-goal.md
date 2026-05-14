# Sprint 7 - Sprint Goal

## Sprint cilj
Implementirati funkcionalnosti evidencije izvještaja o intervenciji, upravljanja korisničkim profilom i resetom lozinke, menadžment dashboard za pregled operativnih podataka, te kalendarski prikaz intervencija za koordinatore. Paralelno unaprijediti upravljanje kompanijama kroz ulogu `KompanijaAdmin`, samoregistraciju kompanija i zaštitu pristupa company management funkcionalnostima. :contentReference[oaicite:0]{index=0}

## Ključne stavke koje tim želi završiti

- Evidencija izvještaja o intervenciji (PBI-010)
- Upravljanje korisničkim profilom i reset lozinke (PBI-015)
- Menadžment dashboard (PBI-014)
- Kalendarski prikaz intervencija (PBI-020)
- Upravljanje kompanijama i uloga KompanijaAdmin (PBI-049) :contentReference[oaicite:1]{index=1}

## Rizici i zavisnosti

### Rizici

- Rizik: PBI-015 (Reset lozinke) zavisi od stabilne SMTP/email konfiguracije; problemi sa email servisom mogu blokirati testiranje i isporuku reset password flow-a.

- Rizik: PBI-014 (Menadžment dashboard) zavisi od konzistentnosti postojećih podataka o statusima i prioritetima intervencija; netačni ili nepotpuni podaci mogu dovesti do pogrešnih statistika.

- Rizik: PBI-020 (Kalendarski prikaz intervencija) može zahtijevati dodatno frontend usklađivanje oko prikaza termina, filtera i rasporeda intervencija.

- Rizik: PBI-049 uvodi novu rolu `KompanijaAdmin` i dodatna RBAC pravila; nepravilna implementacija može dovesti do IDOR sigurnosnih propusta i neovlaštenog pristupa podacima drugih kompanija. :contentReference[oaicite:2]{index=2}

- Rizik: PBI-049 ima veću složenost (8 SP) i uključuje backend, frontend, bazu i Keycloak integraciju; postoji mogućnost prelaska planiranog sprint kapaciteta.

### Zavisnosti

- Zavisnost: PBI-014 zavisi od prethodno implementiranih statusa intervencija (PBI-008) i prioriteta intervencija (PBI-005), jer dashboard koristi te podatke za statistiku i pregled.

- Zavisnost: PBI-010 zavisi od PBI-008 (Status intervencije) i PBI-009 (Pregled zadataka), jer izvještaj može biti kreiran samo za intervencije koje su započete ili završene.

- Zavisnost: PBI-020 zavisi od postojećeg sistema planiranja i zakazivanja intervencija (PBI-004), jer kalendar koristi termine i raspored intervencija.

- Zavisnost: PBI-015 zavisi od PBI-002 (Login), jer funkcionalnosti profila i promjene lozinke zahtijevaju autentifikovanog korisnika.

- Zavisnost: PBI-049 zavisi od postojeće Keycloak autentifikacije i RBAC middleware-a (`authenticate` i `authorizeRoles`) zbog implementacije nove role `KompanijaAdmin`. :contentReference[oaicite:3]{index=3}

- Zavisnost: PBI-049 koristi postojeći `Company` model i postojeće company API rute kao osnovu za proširenje funkcionalnosti upravljanja kompanijama. :contentReference[oaicite:4]{index=4}

- Zavisnost: PBI-014 i PBI-010 povezani su sa PBI-023 (Export), iako export nije dio MVP implementacije u ovom sprintu.