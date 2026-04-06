## Sprint 6

**Sprint broj**  
Sprint 6  

**Sprint cilj**  
Omogućiti siguran pristup sistemu i postaviti temeljne funkcionalnosti autentifikacije i osnovne konfiguracije sistema (registracija, login, reset lozinke i kategorije kvarova kao preduvjet za prijavu kvara).

**Ključne stavke koje tim želi završiti**
- PBI-001 Registracija korisnika  
- PBI-002 Login  
- PBI-019 Reset lozinke  
- PBI-032 Upravljanje kategorijama kvarova (Admin)  

**Rizici i zavisnosti**
- Login i reset lozinke zavise od registracije  
- Kategorije kvarova su preduvjet za prijavu kvara (Sprint 7)  
- Rizik: sigurnost autentifikacije, validacija podataka i upravljanje korisničkim ulogama  

---

## Sprint 7

**Sprint broj**  
Sprint 7  

**Sprint cilj**  
Omogućiti unos i inicijalnu obradu intervencija kroz prijavu kvara, validaciju podataka i planiranje uz definisanje prioriteta.

**Ključne stavke koje tim želi završiti**
- PBI-003 Prijava kvara  
- PBI-004 Planiranje intervencija  
- PBI-005 Postavljanje prioriteta  
- PBI-024 Validacija unosa podataka  

**Rizici i zavisnosti**
- Prijava kvara zavisi od dostupnih kategorija (PBI-032)  
- Planiranje zavisi od uspješne prijave kvara  
- Prioritet zavisi od planiranja  
- Rizik: kompleksnost validacije i konzistentnost unosa podataka  

---

## Sprint 8

**Sprint broj**  
Sprint 8  

**Sprint cilj**  
Omogućiti operativno upravljanje intervencijama kroz dodjelu, pregled, praćenje statusa i upravljanje priloženim fajlovima.

**Ključne stavke koje tim želi završiti**
- PBI-006 Dodjela servisera  
- PBI-007 Pregled liste intervencija  
- PBI-008 Praćenje statusa  
- PBI-033 Upravljanje attachmentima  

**Rizici i zavisnosti**
- Dodjela zavisi od planiranja (Sprint 7)  
- Lista i status zavise od prioriteta i dodjele  
- Attachmenti zavise od prijave kvara (PBI-003)  
- Rizik: sinhronizacija statusa i konzistentnost prikaza podataka  


---

## Sprint 9

**Sprint broj**  
Sprint 9  

**Sprint cilj**  
Omogućiti rad servisera i administrativnu kontrolu sistema kroz pregled zadataka, izvještavanje, upravljanje korisnicima i definisanje SLA pravila.

**Ključne stavke koje tim želi završiti**
- PBI-009 Pregled zadataka servisera  
- PBI-010 Izvještaj o intervenciji  
- PBI-013 Upravljanje korisnicima (Admin)  
- PBI-035 Konfiguracija SLA  

**Rizici i zavisnosti**
- Zadaci servisera zavise od dodjele (Sprint 8)  
- Izvještaj zavisi od statusa intervencije  
- SLA zavisi od prioriteta (PBI-005)  
- Rizik: kompleksnost RBAC modela i pravilna primjena SLA pravila  

---

## Sprint 10

**Sprint broj**  
Sprint 10  

**Sprint cilj**  
Poboljšati pregled sistema i korisničko iskustvo kroz historiju intervencija, notifikacije, dashboard i upravljanje profilom.

**Ključne stavke koje tim želi završiti**
- PBI-011 Historija intervencija  
- PBI-012 Notifikacije  
- PBI-014 Dashboard  
- PBI-015 Upravljanje profilom  

**Rizici i zavisnosti**
- Historija zavisi od završenih intervencija  
- Notifikacije zavise od prijave kvara i dodjele  
- Dashboard zavisi od tačnih podataka (status, prioritet)  
- Profil zavisi od login sistema  
- Rizik: tačnost podataka i pravovremeno ažuriranje prikaza  