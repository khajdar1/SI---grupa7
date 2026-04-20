# Initial Release Plan

Initial Release Plan grupiše Product Backlog u funkcionalne release cjeline koje su dovoljno vrijedne i stabilne da se mogu demonstrirati i, kada dođe vrijeme, isporučiti korisniku. Ako je backlog item prevelik, može se podijeliti na više release slice-ova, ali svaki slice mora imati smislen i upotrebljiv rezultat.

## Timeline

| Sprint | Uloga u planu | Fokus |
| --- | --- | --- |
| Sprint 5 | Develop sprint / početak Release 1 | Skeleton projekta, env konfiguracija, validacija, kategorije kvarova i SLA preduvjeti |
| Sprint 6 | Nastavak Release 1 | Registracija, login, prijava kvara i osnovno planiranje intervencije |
| Sprint 7 | Kraj Release 1 | Operativno upravljanje intervencijama i attachmentima |
| Sprint 8-9 | Release 2 | Administracija, nadzor, pretraga, podrška i stabilizacija |
| Sprint 10 | Release 3 | Dodatne funkcije i optimizacije |


## Plan release cjelina

| Release | Sprint window | Funkcionalna cjelina | Uključeni PBIs | Glavni rizik | Izlazni kriteriji |
| --- | --- | --- | --- | --- | --- |
| Release 1 | Sprint 5-6 | Osnovni pristup, validacija i prijava kvara | PBI-024, PBI-032, PBI-035, PBI-001, PBI-002, PBI-003, PBI-004, PBI-005, PBI-006, PBI-019, PBI-030 | Rizik da validacija, kategorije kvarova, SLA preduvjeti ili osnovni korisnički tok nisu dovoljno stabilni za end-to-end korištenje. | Registracija, login, reset lozinke, validacija unosa, kategorije kvarova, prijava kvara, planiranje intervencije i dodjela rade end-to-end; testovi prolaze; demo je moguć na target okolini. |
| Release 1 | Sprint 7 | Operativno upravljanje intervencijama i attachmentima | PBI-007, PBI-008, PBI-009, PBI-010, PBI-011, PBI-016, PBI-033 | Rizik da statusni tok, izvještaji ili attachment flow utiču na operativnu stabilnost koordinatora i servisera. | Lista aktivnih intervencija, statusi, zadaci servisera, izvještaji, historija, komentari i upravljanje prilozima rade dosljedno; testovi prolaze i demo je moguć na target okolini. |
| Release 2 | Sprint 8-9 | Administracija, nadzor i podrška | PBI-012, PBI-013, PBI-014, PBI-015, PBI-017, PBI-018, PBI-020, PBI-021, PBI-025, PBI-026, PBI-027, PBI-028 | Rizik da veći broj uloga, notifikacija, pretrage i support tokova uvede regresije ili RBAC greške. | Notifikacije, admin kontrola, dashboard, profil, napredna pretraga, SLA upozorenja, kalendar, dostupnost servisera, detekcija duplikata, arhiviranje i podrška kroz tikete rade end-to-end. |
| Release 3 | Sprint 10 | Dodatne funkcije i optimizacije | PBI-022, PBI-023, PBI-029, PBI-031, PBI-034, PBI-036, PBI-037, PBI-038, PBI-039 | Rizik da proširenja poput tiketa, mape, višejezičnosti i automatske raspodjele povećaju kompleksnost bez direktnog povećanja osnovne korisničke vrijednosti. | Planirana održavanja, export, notifikacije za tikete, višejezičnost, map prikaz, feedback, automatska raspodjela, masovne akcije i blokiranje korisnika rade end-to-end; sistem pokriva planirana proširenja nakon osnovnog release kandidata. |

## Zavisnosti i pravila planiranja

- Release 1 zavisi od autentifikacije, RBAC-a, PBI-024, PBI-032, PBI-035, osnovnog modela prijave i obrade intervencija, stabilnog operativnog toka, notifikacija, izvještaja i provjerene logike statusa.
- Release 2 zavisi od prethodnih release cjelina, notifikacijskog toka, pretrage, SLA pravila i stabilnog support procesa.
- Release 3 zavisi od prethodnih release cjelina, ticketing toka, map prikaza, automatske raspodjele i dosljednih pravila za proširenja sistema.
- Svaki release mora činiti zaokruženu funkcionalnu cjelinu, čak i kada neki backlog item mora biti podijeljen na više manjih isporuka.
- Plan se revidira nakon svakog sprint review-a u skladu sa kapacitetom tima, rizicima i stvarnim napretkom.

## Veza sa GitFlow procesom

- Kada je release cjelina spremna za stabilizaciju, iz `develop` se otvara `release/*` grana.
- U release grani se rade samo bugfixevi, finalna validacija i eventualni version bump.
- Nakon prihvata, release se merge-a u `master` i nazad u `develop`.
- Svaki release bi trebao završiti sa jasno označenom verzijom i kratkim release notama.

## Napomena

Initial Release Plan je zasnovan na MVP scope-u definisanom u Product Vision dokumentu. Planirani inkrementi(release-ovi) prate prioritete iz Product Backloga i raspoređeni su po sprintovima definisanim u backlogu. Plan je podložan promjenama u skladu sa rezultatima sprintova, promjenama prioriteta i novim identificiranim rizicima.
