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