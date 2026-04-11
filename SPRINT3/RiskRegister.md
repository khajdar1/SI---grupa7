 # 9. Risk Register

---

## Tabela rizika

| ID | Opis rizika | Uzrok | Vjerovatnoća | Uticaj | Prioritet rizika | Plan mitigacije | Odgovorna uloga | Status |
|----|------------|-------|--------------|--------|------------------|------------------|------------------|--------|
| R1 | Kašnjenje implementacije ključnih funkcionalnosti | Loša procjena složenosti zadataka | Srednja | Visok | Visok | Redovan backlog refinement i praćenje sprintova | Scrum Master | Otvoren |
| R2 | Problemi sa autentifikacijom korisnika | Greške u login/logout funkcionalnosti | Niska | Visok | Srednji | Testiranje autentifikacije i upravljanja sesijama | Backend developer | Otvoren |
| R3 | Gubitak podataka o intervencijama | Neispravan ili nepostojeći backup | Niska | Vrlo visok | Visok | Uvođenje automatskog backupa i testiranje restore-a | Backend/DevOps | Otvoren |
| R4 | Pad performansi sistema | Velik broj korisnika i loša optimizacija | Srednja | Visok | Visok | Load testing i optimizacija baze i API-ja | Backend developer | Otvoren |
| R5 | Neispravni korisnički unosi | Nedostatak validacije podataka | Visoka | Srednji | Visok | Implementacija validacije unosa | Frontend developer | Otvoren |
| R6 | Pogrešna dodjela servisera | Nedovoljno razvijena logika dodjele | Srednja | Srednji | Srednji | Testiranje i mogućnost ručne dodjele | Koordinator | Otvoren |
| R7 | Loše korisničko iskustvo (UI/UX) | Komplikovan ili neintuitivan interfejs | Srednja | Srednji | Srednji | Usability testiranje i poboljšanje dizajna | UI/UX dizajner | Otvoren |
| R8 | Neovlašten pristup podacima | Slaba sigurnosna implementacija | Niska | Vrlo visok | Visok | RBAC, enkripcija i logovanje aktivnosti | Backend developer | Otvoren |
| R9 | Problemi sa uploadom fajlova | Nevalidirani formati i veličine | Srednja | Nizak | Nizak | Ograničenje tipova i veličine fajlova | Backend developer | Otvoren |
| R10 | Loša komunikacija u timu | Nedostatak koordinacije | Srednja | Srednji | Srednji | Daily sastanci i bolja organizacija | Scrum Master | Otvoren |
| R11 | Neispravne notifikacije | Greške u implementaciji | Srednja | Srednji | Srednji | Testiranje i fallback mehanizmi | Backend developer | Otvoren |
| R12 | Kašnjenje u rješavanju intervencija | Loše definisani SLA rokovi | Srednja | Visok | Visok | Definisanje SLA i monitoring | Koordinator | Otvoren |
| R13 | Neusklađenost zahtjeva sa očekivanjima korisnika | Loša komunikacija sa stakeholderima | Srednja | Visok | Visok | Redovan feedback i validacija zahtjeva | Product Owner | Otvoren |
| R14 | Problemi pri integraciji sistema | Neusklađen frontend i backend | Srednja | Srednji | Srednji | Integraciono testiranje | Development tim | Otvoren |
| R15 | Problemi tokom deploymenta | Nedostatak iskustva sa deploy-om | Niska | Srednji | Nizak | Testno okruženje prije produkcije | DevOps | Otvoren |

---

## Napomena

Risk Register je iterativan dokument i ažurira se tokom razvoja projekta.  
Novi rizici se identificiraju tokom sprintova i dodaju u ovu tabelu, dok se postojeći ažuriraju u skladu sa statusom i promjenama u projektu.