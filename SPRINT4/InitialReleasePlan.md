# Initial Release Plan

Initial Release Plan grupiše Product Backlog u funkcionalne release cjeline koje su dovoljno vrijedne i stabilne da se mogu demonstrirati i, kada dođe vrijeme, isporučiti korisniku. Ako je backlog item prevelik, može se podijeliti na više release slice-ova, ali svaki slice mora imati smislen i upotrebljiv rezultat.

## Plan release cjelina

| Release | Sprint window | Funkcionalna cjelina | Uključeni PBIs | Izlazni kriteriji |
| --- | --- | --- | --- | --- |
| Release 1 | Sprint 6 | Pristup sistemu i prijava kvarova | PBI-001, PBI-002, PBI-019, PBI-032, PBI-003, PBI-004, PBI-005 | Registracija, login, reset lozinke, kategorije kvarova, unos kvara i inicijalno planiranje intervencije rade end-to-end; testovi prolaze; demo je moguć na target okolini. |
| Release 2 | Sprint 7 | Operativno upravljanje intervencijama i prilozima | PBI-006, PBI-007, PBI-008, PBI-009, PBI-010, PBI-033, PBI-035 | Serviseri se dodjeljuju intervencijama, statusi se mijenjaju, liste rade, izvještaji, SLA i upravljanje prilozima rade, a operativni tok je stabilan za koordinatore. |
| Release 3 | Sprint 8-9 | Administracija, analitika i release hardening | PBI-011, PBI-012, PBI-013, PBI-014, PBI-015, PBI-016, PBI-017, PBI-018, PBI-020, PBI-021, PBI-024, PBI-025 | Historija, notifikacije, admin kontrola, dashboard, profil, komentari, napredna pretraga, kalendar, dostupnost servisera, validacija i detekcija duplikata su spremni za inicijalni release kandidat i PO demo. |
| Release 4 | Sprint 10 | Proširenja i podrška nakon osnovnog release kandidata | PBI-022, PBI-023, PBI-026, PBI-027, PBI-028, PBI-029, PBI-030, PBI-031, PBI-034, PBI-036, PBI-037, PBI-038, PBI-039 | Planirana održavanja, export, arhiviranje, tiket podrška, višejezičnost, map prikaz, feedback, automatska raspodjela, masovne akcije i blokiranje korisnika rade end-to-end; sistem pokriva i planirane proširenja nakon osnovnog release kandidata. |

## Zavisnosti i pravila planiranja

- Release 1 zavisi od autentifikacije, RBAC-a, kategorija kvarova i validacije unosa.
- Release 2 zavisi od stabilnog podatkovnog modela za intervencije, korisničkih uloga, osnovnih operativnih statusa i rješenja za upload priloga.
- Release 3 zavisi od prethodnih release cjelina, notifikacijskog toka, pretrage, validacije i dovoljno stabilnog backend-a i baze.
- Release 4 zavisi od prethodnih release cjelina, operativnih statusa, notifikacija, SLA i dosljednih pravila za proširenja sistema.
- Svaki release mora činiti zaokruženu funkcionalnu cjelinu, čak i kada neki backlog item mora biti podijeljen na više manjih isporuka.
- Plan se revidira nakon svakog sprint review-a u skladu sa kapacitetom tima, rizicima i stvarnim napretkom.

## Veza sa GitFlow procesom

- Kada je release cjelina spremna za stabilizaciju, iz `develop` se otvara `release/*` grana.
- U release grani se rade samo bugfixevi, finalna validacija i eventualni version bump.
- Nakon prihvata, release se merge-a u `master` i nazad u `develop`.
- Svaki release bi trebao završiti sa jasno označenom verzijom i kratkim release notama.

## Napomena

Initial Release Plan je zasnovan na MVP scope-u definisanom u Product Vision dokumentu. Planirani inkrementi(release-ovi) prate prioritete iz Product Backloga i raspoređeni su po sprintovima definisanim u backlogu. Plan je podložan promjenama u skladu sa rezultatima sprintova, promjenama prioriteta i novim identificiranim rizicima.
