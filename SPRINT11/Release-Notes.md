# Release Notes — Sistem za upravljanje servisnim intervencijama
**v1.0.0 | Juni 2026. | Grupa 7**

---

## 1. O ovoj verziji

Finalna verzija (MVP) sistema za upravljanje servisnim intervencijama, razvijana kroz Sprintove 5–10. Sistem pokriva cjelovit tok od prijave kvara do zaključivanja i analize, s podrškom za sedam korisničkih uloga.

---

## 2. Šta je uključeno u finalnu verziju

**Autentikacija i korisnici** — registracija, Keycloak login (JWT/OAuth2), reset lozinke, upravljanje računima, RBAC za 7 uloga

**Kvarovi i intervencije** — prijava kvara (prijavljeni i neprijavljeni korisnici), planiranje, dodjela servisera, prioriteti (LOW/MEDIUM/HIGH/CRITICAL), kompletno praćenje statusa s historijom, komentari, attachmenti, izvještaji, masovne akcije

**Operativni alati** — lista s filterima, kalendarski i mapski prikaz, PDF export, SLA konfiguracija s praćenjem kašnjenja

**Notifikacije i komunikacija** — in-app notifikacije u realnom vremenu (Socket.IO), tiket sistem s dvosmjernom komunikacijom

**Napredne funkcionalnosti (Sprint 10)** — eskalacije ka menadžmentu, pauziranje intervencije, evidencija dolaska servisera na teren (3 checkpointa), digitalna potvrda izvršenja (PIN/potpis), upravljanje dostupnošću servisera, potvrda/pomijeranje termina od strane korisnika, baza znanja, evidencija materijala, zahtjev za ponovnim otvaranjem

**Analitika i ostalo** — menadžment dashboard, feedback korisnika (1–5), analitika feedbacka, višejezična podrška (BS/EN), blokiranje korisnika, settings stranica, KompanijaAdmin uloga, audit log

### Djelimično završeno

**PBI-022 — Planirana/preventivna održavanja**
Dnevno i sedmično ponavljanje rade ispravno. Nije završeno: (1) mjesečna periodičnost ima rubni bug pri prelasku s kraja mjeseca, (2) buduće instance nisu vidljive unaprijed u kalendaru jer ih scheduler kreira tek kada njihovo vrijeme nastupi.

**PBI-011 — Historija intervencija po lokaciji/uređaju**
Historija po lokaciji implementirana. Historija po uređaju nije implementirana.

**PBI-025 — Detekcija duplikata prijave kvara**
Detekcija radi kada postoje GPS koordinate. Tekstualni fallback nije pouzdan jer se sirovi unos lokacije poredi s geokodiranom adresom, a endpoint prima `userId` iz zahtjeva bez dodatne provjere.

**PBI-054 — Potvrda/pomijeranje termina**
Tok potvrde i zahtjeva za promjenu termina postoji. Notifikacije rade lokalno, ali produkcijska WebSocket konfiguracija nije potvrđena i zbog toga se ne smije predstavljati kao potpuno stabilna produkcijska funkcionalnost.

---

## 3. Šta nije dio finalne isporuke

| Stavka | Razlog |
|--------|--------|
| PBI-037 — Automatska raspodjela intervencija | Svjesno odgođeno; postoje UI labela i helperi za opterećenje, ali logika automatske dodjele ne postoji |
| Export u CSV/Excel | Nije bio u MVP scopeu; dostupan je samo PDF |
| Grafički prikazi u dashboardu | Nije bio u MVP scopeu; podaci su numerički/tabelarni |
| Email/push notifikacije za statusne promjene | Svjesna odluka; in-app je jedini kanal (Gmail API samo za reset lozinke) |
| Automatski SLA scheduler s upozorenjima | SLA konfiguracija postoji; automatska upozorenja ne |
| 2FA, mobilni interfejs, ERP integracija | Predviđeno za post-MVP fazu |

---

## 4. Poznati bugovi

| ID | Opis | Vezano za |
|----|------|-----------|
| BUG-001 | Predugački opis vraća `database error` umjesto validacijske poruke | PBI-004 |
| BUG-002 | JWT token ističe prebrzo, korisnici se često odjavljuju; nema automatskog refresha | PBI-002 |
| BUG-003 | Mjesečno ponavljanje preskače dane pri kraju mjeseca (31. jan → 3. mart); buduće instance nisu vidljive u kalendaru | PBI-022 |
| BUG-004 | Gmail OAuth refresh token može isteći (Testing mod, 6mj nekorištenja), reset lozinke prestaje raditi bez upozorenja | PBI-019 |
| BUG-005 | Detekcija duplikata nepouzdana bez GPS-a; provjera se pokreće prije geolokacije pa se isti unos ne prepoznaje | PBI-025 |
| BUG-006 | Greška u jednokratnoj lozinki zahtijeva brisanje cijelog korisničkog računa | PBI-013 |
| BUG-007 | PDF export ignorira aktivne filtere i izvozi kompletnu listu | PBI-023 |
| BUG-008 | Prijavljeni korisnik prikazan kao "System Reporter" na kreiranoj intervenciji | PBI-001 |
| BUG-009 | Notifikacije za promjenu termina rade lokalno, ali ne u produkciji zbog različite WebSocket konfiguracije | PBI-054, PBI-012 |

---

## 5. Poznata ograničenja

- Upload attachmenta ograničen na 10 MB; Base64 overhead može premašiti ukupni payload limit
- Lokalno čuvanje attachmenta (`backend/uploads/`) nije skalabilno — planirana migracija na Cloudflare R2
- Kalendar prikazuje samo intervencije s postavljenim datumom; ostale nisu vidljive
- Ovisnost o vanjskom geocoding servisu; fallback (`GEOCODING_DISABLED`) nema vlastitu logiku parsiranja
- Endpoint `/check-duplicates` prima `userId` bez provjere odgovara li prijavljenom korisniku
- Pri nedostupnosti Keycloaka, autorizacija se oslanja na uloge iz JWT tokena bez live verifikacije
- Nema 2FA

---

## 6. Status PBI stavki

| PBI ID | Naziv | Sprint | Status |
|--------|-------|--------|--------|
| PBI-001 | Registracija korisnika | 5 | Done |
| PBI-002 | Login | 5 | Done |
| PBI-003 | Prijava kvara | 5 | Done |
| PBI-004 | Planiranje intervencija | 6 | Done |
| PBI-005 | Prioritet i SLA upozorenja | 6 | Done |
| PBI-006 | Dodjela servisera | 6 | Done |
| PBI-007 | Lista aktivnih intervencija | 6 | Done |
| PBI-008 | Praćenje i izmjena statusa | 6 | Done |
| PBI-009 | Pregled zadataka servisera | 6 | Done |
| PBI-010 | Izvještaj o intervenciji | 7 | Done |
| PBI-011 | Historija po lokaciji/uređaju | 6 | Partially Done |
| PBI-012 | In-app notifikacije | 8 | Done |
| PBI-013 | Upravljanje korisničkim računima | 6 | Done |
| PBI-014 | Menadžment dashboard | 7 | Done |
| PBI-015 | Korisnički profil | 7 | Done |
| PBI-016 | Komentari intervencije | 6 | Done |
| PBI-017 | Napredna pretraga | 6 | Done |
| PBI-018 | SLA upozorenje | 6 | Done |
| PBI-019 | Reset lozinke | 5 | Done |
| PBI-020 | Kalendarski prikaz | 7 | Done |
| PBI-021 | Dostupnost servisera | 6 | Done |
| PBI-022 | Planirana/preventivna održavanja | 8 | Partially Done |
| PBI-023 | PDF export | 8 | Done |
| PBI-024 | Validacija unosa | 5 | Done |
| PBI-025 | Detekcija duplikata | 8 | Partially Done |
| PBI-026 | Arhiviranje intervencija | 8 | Done |
| PBI-027 | Tiket sistem | 8 | Done |
| PBI-028 | Komunikacija na tiketu | 8 | Done |
| PBI-029 | Notifikacije za tikete | 8 | Done |
| PBI-030 | Kategorije kvarova | 5 | Done |
| PBI-031 | Višejezična podrška | 9 | Done |
| PBI-032 | Upravljanje kategorijama (Admin) | 5 | Done |
| PBI-033 | Upravljanje attachmentima | 6 | Done |
| PBI-034 | Mapski prikaz | 8 | Done |
| PBI-035 | SLA konfiguracija | 5 | Done |
| PBI-036 | Feedback korisnika | 9 | Done |
| PBI-037 | Automatska raspodjela | — | Deferred |
| PBI-038 | Masovne akcije | 8 | Done |
| PBI-039 | Blokiranje korisnika | 9 | Done |
| PBI-040/051 | Settings stranica | 9 | Done |
| PBI-041 | Prisma migracija | 5 | Done |
| PBI-042 | Seed podaci | 5 | Done |
| PBI-044 | Logovanje i health | 6 | Done |
| PBI-045 | Exception handler | 5 | Done |
| PBI-046 | Auth middleware | 5 | Done |
| PBI-047 | Zod validacija | 5 | Done |
| PBI-048 | Rate limiting | 5 | Done |
| PBI-052 | Analitika feedbacka | 10 | Done |
| PBI-053 | Dostupnost servisera | 10 | Done |
| PBI-054 | Potvrda/pomijeranje termina | 10 | Partially Done |
| PBI-055 | Baza znanja | 10 | Done |
| PBI-056 | Evidencija materijala | 10 | Done |
| PBI-058 | Eskalacije ka menadžmentu | 10 | Done |
| PBI-059 | Ponovnog otvaranja intervencije | 10 | Done |
| PBI-060 | Evidencija dolaska na teren | 10 | Done |
| PBI-061 | Digitalna potvrda izvršenja | 10 | Done |
| PBI-062 | Pauziranje intervencije | 10 | Done |

---

## 7. Napomena

**PBI-011**, **PBI-022**, **PBI-025**, **PBI-054** i **PBI-037** ne smiju se predstavljati kao potpuno završene. Sve stavke označene kao Done implementirane su u skladu s Acceptance Kriterijima i Definition of Done.
