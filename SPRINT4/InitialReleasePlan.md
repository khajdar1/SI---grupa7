# 14. Initial Release Plan

---

## Planirani inkrementi / release cjeline

---

## 🔹 Inkrement 1: Osnovna autentifikacija i prijava kvarova

**Cilj inkrementa:**  
Omogućiti korisnicima pristup sistemu i osnovnu funkcionalnost prijave kvarova i kreiranja intervencija.

**Glavne funkcionalnosti:**  
- PBI-001 Registracija korisnika  
- PBI-002 Prijava u sistem (Login)  
- PBI-003 Prijava kvara  
- PBI-004 Planiranje intervencija  
- PBI-005 Postavljanje prioriteta  

**Zavisnosti:**  
- Implementacija autentifikacije kao preduvjeta za ostale funkcionalnosti  
- Postojanje osnovne baze korisnika i intervencija  
- RBAC (role-based access control) za različite tipove korisnika  

**Glavni rizici:**  
- R2 Problemi sa autentifikacijom korisnika  
- R5 Neispravni korisnički unosi  
- R8 Neovlašten pristup podacima  
- R13 Neusklađenost zahtjeva sa očekivanjima korisnika  

**Okvirni sprintovi:**  
- Sprint 5  

---

## 🔹 Inkrement 2: Upravljanje intervencijama i rad servisnih timova

**Cilj inkrementa:**  
Omogućiti efikasno upravljanje intervencijama, dodjelu servisera i praćenje njihovog rada.

**Glavne funkcionalnosti:**  
- PBI-006 Dodjela servisera intervenciji  
- PBI-007 Pregled liste aktivnih intervencija  
- PBI-008 Praćenje i izmjena statusa intervencije  
- PBI-009 Pregled zadataka servisera  
- PBI-010 Evidencija izvještaja o intervenciji  

**Zavisnosti:**  
- Postojanje kreiranih intervencija iz prethodnog inkrementa  
- Ispravno definisane korisničke uloge (serviser, koordinator)  
- Konzistentan model podataka i statusa intervencija  

**Glavni rizici:**  
- R4 Pad performansi sistema  
- R6 Pogrešna dodjela servisera  
- R12 Kašnjenje u rješavanju intervencija  
- R14 Problemi pri integraciji sistema  

**Okvirni sprintovi:**  
- Sprint 6  

---

## 🔹 Inkrement 3: Administracija, historija i dodatne funkcionalnosti

**Cilj inkrementa:**  
Omogućiti administraciju sistema, pregled historije intervencija i dodatne funkcionalnosti za unapređenje rada sistema.

**Glavne funkcionalnosti:**  
- PBI-011 Historija intervencija  
- PBI-012 Notifikacije  
- PBI-013 Upravljanje korisničkim računima  
- PBI-014 Menadžment dashboard  
- PBI-015 Upravljanje korisničkim profilom  

**Zavisnosti:**  
- Postojanje podataka o intervencijama iz prethodnih inkremenata  
- Implementirana autentifikacija i autorizacija  
- Stabilan backend i baza podataka  

**Glavni rizici:**  
- R3 Gubitak podataka o intervencijama  
- R7 Loše korisničko iskustvo (UI/UX)  
- R11 Neispravne notifikacije  
- R16 Problem sa bazom podataka  

**Okvirni sprintovi:**  
- Sprint 7–8  

---

## Napomena

Initial Release Plan zasnovan je na MVP scope-u definisanom u Product Vision dokumentu.  
Planirani inkrementi prate prioritete iz Product Backloga i raspoređeni su po sprintovima definisanim u backlogu.

Plan je podložan promjenama u skladu sa rezultatima sprintova, promjenama prioriteta i novim identificiranim rizicima.