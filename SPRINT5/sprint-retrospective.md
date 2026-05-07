# Sprint Retrospektiva — Sprint 5

**Sistem za upravljanje servisnim intervencijama**

**Datum:** 06.05.2026.

**Scrum Master:** Kerim Hajdar

**Prisustvo:** Cijeli tim

---

## Šta je išlo dobro

- **Tehnički fundament isporučen u cjelini.** CI/CD pipeline, Prisma migracija, seed podaci, health endpoint, error handling, validacija, rate limiting i auth middleware.
- **Keycloak integracija riješena od nule.** Auth model koji nije bio zaključan na početku sprinta; odabir provajdera, pohrana tokena, zaštita ruta, role iz tokena; sve je implementirano i dokumentovano kroz niz odluka u Decision logu.
- **Seed je idempotent.** Skripta se može pokrenuti višekratno bez grešaka; tim ne gubi vrijeme pri resetima lokalnih baza.
- **Svaka tehnička odluka je dokumentovana.** Decision log je popunjen s 19 unosa; tim ima jasan trag zašto je nešto urađeno na određeni način.
- **Core funkcionalnosti isporučene:** Registracija (PBI-001), Login (PBI-002), Prijava kvara (PBI-003), Validacija (PBI-024), Kategorije (PBI-030 i PBI-032), SLA (PBI-035).

---

## Šta nije išlo dobro

- **SMTP blokada zaustavila isporuku PBI-019.** Reset lozinke je tehnički implementiran, ali Railway free plan ne podržava SMTP. Ovo je otkriveno kasno u sprintu, pa stavka nije mogla biti isporučena. Treba ranije testirati infrastrukturna ograničenja.
- **Dokumentacija nije sinhronizovana s kodom.** `inicijalna-struktura` dokument i dalje opisuje Cloudflare R2 kao aktivan file storage, iako kod koristi lokalno čuvanje. Slično, auth model je opisan kao "još nije zaključen" dok je kod već Keycloak-based. Razmak između koda i dokumenata stvorio je konfuziju.
- **File storage implementiran lokalno bez eksplicitne odluke.** Prelaz s planirane R2 arhitekture na lokalno čuvanje u `backend/uploads/` nije bio formalno dokumentovan niti diskutovan kao scopirani kompromis.
- **CI/CD opis u dokumentima bio zastarjeo.** Dokument je navodio `release/1.0` kao jedinu release granu, dok stvarni workflowi pokrivaju sve `release/*` i `master` grane.
- **Validacija JWT potpisa nije implementirana.** Backend provjerava samo prisustvo kolačića, ne i kriptografski potpis tokena. Ovo je potencijalni sigurnosni gap koji nije bio eksplicitno evidentiran kao otvoreni rizik.

---

## Šta treba promijeniti

- **Dokumentacija se ažurira istovremeno s kodom, ne nakon sprinta.** Svaka promjena u implementaciji koja odstupa od dokumentovane arhitekture mora biti praćena PR-om koji ažurira i relevantni dokument u istom PR-u.
- **Infrastrukturna ograničenja se provjere na početku sprinta.** Prije nego što se PBI koji zavisi od eksternog servisa (SMTP, storage, API) uvrsti u sprint kao obaveza isporuke, odgovorna osoba treba potvrditi da infrastruktura to podržava u ciljnom okruženju.
- **Svaka devijacija od arhitekturalnog plana treba Decision Log unos.** Lokalno čuvanje fajlova umjesto R2 je legitimna odluka — ali mora biti dokumentovana kao takva s razlogom i datumom.
- **Otvoreni sigurnosni gapovi trebaju biti vidljivi.** JWT validacija potpisa mora biti evidentirana kao tehnički dug u backlogu ili Decision Logu, ne samo napomenuta u kodu.

---

## Konkretne akcije u Sprint 6

- Riješiti SMTP konfiguraciju i isporučiti PBI-019 (Reset lozinke)
- Dodati PBI za kriptografsku validaciju JWT potpisa u backlog 
- Dodati PBI za migraciju file storage-a na Cloudflare R2 u backlog 
- Uspostaviti pravilo: svaki PR koji mijenja implementiranu arhitekturu mora uključivati ažuriranje relevantnog dokumenta 
- Provjera infrastrukturnih preduvjeta za sve externe zavisnosti u Sprint 6 PBI stavkama 