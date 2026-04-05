## Sprint 5

**Sprint broj**  
Sprint 5  

**Sprint cilj**  
Omogućiti korisnicima pristup sistemu i unos novih intervencija kroz osnovne funkcionalnosti (registracija, login i prijava kvara).

**Ključne stavke koje tim želi završiti**
- PBI-001 Registracija korisnika  
- PBI-002 Login  
- PBI-003 Prijava kvara  
- PBI-004 Planiranje intervencija  
- PBI-005 Postavljanje prioriteta  

**Rizici i zavisnosti**
- Login zavisi od registracije  
- Planiranje zavisi od prijave kvara  
- Rizik: sigurnost autentifikacije i validacija unosa  


---

## Sprint 6

**Sprint broj**  
Sprint 6  

**Sprint cilj**  
Omogućiti operativno upravljanje intervencijama kroz dodjelu, praćenje i izvršenje zadataka.

**Ključne stavke koje tim želi završiti**
- PBI-006 Dodjela servisera  
- PBI-007 Pregled liste intervencija  
- PBI-008 Praćenje statusa  
- PBI-009 Pregled zadataka servisera  
- PBI-010 Izvještaj o intervenciji  

**Rizici i zavisnosti**
- Dodjela zavisi od planiranja (Sprint 5)  
- Status zavisi od dodjele  
- Rizik: kompleksnost sinhronizacije statusa i prikaza  


---

## Sprint 7

**Sprint broj**  
Sprint 7  

**Sprint cilj**  
Poboljšati kontrolu i pregled sistema kroz historiju, notifikacije i administraciju korisnika.

**Ključne stavke koje tim želi završiti**
- PBI-011 Historija intervencija  
- PBI-012 Notifikacije  
- PBI-013 Upravljanje korisnicima (Admin)  

**Rizici i zavisnosti**
- Notifikacije zavise od dodjele i prijave kvara  
- Admin modul zavisi od registracije i login sistema  
- Rizik: kompleksnost RBAC (uloge i prava pristupa)  


---

## Sprint 8

**Sprint broj**  
Sprint 8  

**Sprint cilj**  
Omogućiti analitiku i personalizaciju korisničkog iskustva kroz dashboard i upravljanje profilom.

**Ključne stavke koje tim želi završiti**
- PBI-014 Dashboard  
- PBI-015 Upravljanje profilom  

**Rizici i zavisnosti**
- Dashboard zavisi od tačnih podataka iz prethodnih sprintova  
- Profil zavisi od login sistema  
- Rizik: tačnost izračuna i prikaza podataka  