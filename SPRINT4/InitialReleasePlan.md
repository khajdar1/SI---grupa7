# 14. Initial Release Plan

---

## Planirani inkrementi / release cjeline

---

## 🔹 Inkrement 1: Osnovna autentifikacija i prijava kvarova

**Cilj inkrementa:**  
Omogućiti siguran pristup sistemu i stabilan ulazni tok za prijavu kvarova, uz automatsko kreiranje intervencija.

**Glavne funkcionalnosti:**

- PBI-001 Registracija korisnika
- PBI-002 Prijava u sistem (Login)
- PBI-019 Reset lozinke
- PBI-032 Upravljanje kategorijama kvarova (Admin)
- PBI-003 Prijava kvara
- PBI-004 Planiranje intervencija
- PBI-005 Postavljanje prioriteta

**Zavisnosti:**

- Implementacija autentifikacije kao preduvjeta za ostale funkcionalnosti
- RBAC (role-based access control) za različite tipove korisnika (NFR_03, NFR_09)
- Dostupne kategorije kvarova kao preduvjet za konzistentnu prijavu (PBI-032 -> PBI-003)
- Validacija unosa na klijentskom i serverskom sloju (PBI-024, NFR_02)
- Arhitekturni preduvjeti: Auth modul, modul za kvarove/intervencije i baza podataka

**Glavni rizici:**

- R2 Problemi sa autentifikacijom korisnika
- R5 Neispravni korisnički unosi
- R8 Neovlašten pristup podacima
- R13 Neusklađenost zahtjeva sa očekivanjima korisnika

**Okvirni sprintovi:**

- Sprint 6

---

## 🔹 Inkrement 2: Upravljanje intervencijama i rad servisnih timova

**Cilj inkrementa:**  
Omogućiti operativno izvršavanje intervencija kroz dodjelu servisera, praćenje statusa, izvještavanje i kontrolu SLA rokova.

**Glavne funkcionalnosti:**

- PBI-006 Dodjela servisera intervenciji
- PBI-007 Pregled liste aktivnih intervencija
- PBI-008 Praćenje i izmjena statusa intervencije
- PBI-009 Pregled zadataka servisera
- PBI-010 Evidencija izvještaja o intervenciji
- PBI-035 Konfiguracija vremenskih rokova (SLA)

**Zavisnosti:**

- Postojanje kreiranih intervencija iz prethodnog inkrementa
- Ispravno definisane korisničke uloge (serviser, koordinator)
- Konzistentan model podataka i statusa intervencija (Domain Model, Use Case)
- Integracija notifikacija za dodjelu i promjene statusa (PBI-012)
- Performanse liste aktivnih intervencija prema NFR_01

**Glavni rizici:**

- R4 Pad performansi sistema
- R6 Pogrešna dodjela servisera
- R12 Kašnjenje u rješavanju intervencija
- R14 Problemi pri integraciji sistema

**Okvirni sprintovi:**

- Sprint 7

---

## 🔹 Inkrement 3: Administracija, historija i dodatne funkcionalnosti

**Cilj inkrementa:**  
Omogućiti administrativnu kontrolu, transparentnost kroz historiju i dashboard, te pripremu sistema za inicijalni release kvalitetom i sigurnošću.

**Glavne funkcionalnosti:**

- PBI-011 Historija intervencija
- PBI-012 Notifikacije
- PBI-013 Upravljanje korisničkim računima
- PBI-014 Menadžment dashboard
- PBI-015 Upravljanje korisničkim profilom
- PBI-024 Validacija unosa podataka

**Zavisnosti:**

- Postojanje podataka o intervencijama iz prethodnih inkremenata
- Implementirana autentifikacija i autorizacija
- Stabilan backend i baza podataka (R16)
- Audit log i praćenje aktivnosti korisnika (NFR_14)
- Backup i pouzdanost sistema za produkcijsku spremnost (NFR_11)

**Glavni rizici:**

- R3 Gubitak podataka o intervencijama
- R7 Loše korisničko iskustvo (UI/UX)
- R11 Neispravne notifikacije
- R16 Problem sa bazom podataka

**Okvirni sprintovi:**

- Sprint 8-9

---

## Napomena

Initial Release Plan zasnovan je na MVP scope-u definisanom u Product Vision dokumentu.  
Planirani inkrementi prate prioritete iz Product Backloga i raspoređeni su po sprintovima definisanim u backlogu.

Plan je podložan promjenama u skladu sa rezultatima sprintova, promjenama prioriteta i novim identificiranim rizicima.
