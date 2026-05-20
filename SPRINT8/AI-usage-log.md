# AI Usage Log

- **Datum:** 17.05.2026.
- **Sprint broj:** Sprint 8
- **Alat koji je koristio:** GitHub Copilot (GPT-5.4 mini)
- **Svrha koristenja:** Implementacija PBI-023 (Export podataka) - server-side PDF export liste intervencija i povezivanje sa frontendom.
- **Kratak opis zadatka ili upita:** Zadatak je obuhvatio: (1) implementaciju server-side exporta liste intervencija u PDF formatu sa respektovanjem prava pristupa po ulozi, (2) poboljsanje vizuelnog izgleda PDF-a radi arhiviranja i dijeljenja sa vanjskim dionicima, (3) povezivanje backend exporta sa frontend stranicom intervencija dodavanjem dugmeta za preuzimanje i servisnog poziva.
- **Sta je AI predlozio ili generisao:**
  - Novi endpoint `GET /interventions/export/pdf` za export PDF dokumenta.
  - `pdf.service.ts` kao zajednicki servis za generisanje PDF-a sa dinamickim redovima, paginacijom i uredjenim zaglavljem.
  - Koristenje biblioteke `pdfkit` za server-side PDF generisanje.
  - Testove za uspjesan export i kontrolu pristupa.
  - Frontend endpoint konstante `API_ENDPOINTS.INTERVENTIONS.EXPORT_PDF`.
  - Servisna funkcija `downloadInterventionsPdf()` sa `responseType: 'blob'` i browser download logikom.
  - `Export PDF` dugme u zaglavlje stranice `interventions/page.tsx` sa loading stanjem i prikazom greske.
  - Vizuelnu doradju PDF-a: uredno zaglavlje, tabelarni prikaz sa linijama, naizmjenicno obojene redove, automatsku paginaciju i podnozje sa brojem stranice.
  - Font size optimizacije i balansiranje sirina kolona kako bi se osiguralo da sve tekst, posebno datumi, stane u jedan red bez preklapanja.
- **Sta je tim prihvatio:** Kompletna implementacija server-side PDF exporta sa frontend integracijom, ponovna upotreba postojecih filtera pristupa i biblioteke `pdfkit` za generisanje dokumenta.
- **Sta je tim izmijenio:** Tijekom razvoja, optimizovane su sirine kolona kako bi se osiguralo da sve informacije, posebno "Priority" header i datumi, stanu u jedan red bez preklapanja.
- **Sta je tim odbacio:** Export u Excel/CSV formatu nije implementiran jer nije dio MVP opsega.
- **Rizici, problemi ili greske koje su uocene:** (1) `pdfkit` mora biti instaliran u produkcijskom okruzenju prije pokretanja servisa; (2) ukoliko se kasnije promijene pravila pristupa po ulozi, export mora ostati uskladjen sa istom logikom filtriranja kao aktivna lista intervencija; (3) za velike skupove podataka moguce je duze cekanje dok se PDF ne generise.
- **Ko je koristio alat:** Ismail Mujanovic

---

- **Datum:** 15.05.2026.
- **Sprint broj:** Sprint 8
- **Alat koji je koristio:** Claude (claude-sonnet-4-6)
- **Svrha koristenja:** Implementacija PBI-025 (Detekcija duplikata prijave kvara) - automatsko upozoravanje korisnika pri pokusaju prijave slicnog kvara na istoj lokaciji.
- **Kratak opis zadatka ili upita:** Zadatak je obuhvatio: (1) implementaciju algoritma za detekciju duplikata na backendu na osnovu tekstualne slicnosti opisa i geografske blizine lokacije, (2) novi API endpoint za provjeru duplikata prije kreiranja prijave, (3) frontend komponentu koja prikazuje upozorenje korisniku sa opcijama da nastavi ili odustane od prijave, (4) seed podatke za demonstraciju funkcionalnosti i unit testove za algoritme slicnosti.
- **Sta je AI predlozio ili generisao:**
  - Algoritme za racunanje slicnosti: Jaccard sličnost nad rijecima za tekstualne opise i Haversine formula za racunanje GPS udaljenosti izmedju dvije lokacije.
  - Novi endpoint `POST /api/v1/fault-reports/check-duplicates` koji prima lokaciju, opis i korisnicke podatke te vraca listu potencijalnih duplikata sa skorom podudaranja.
  - `findRecentFaultReports()` metodu u repozitoriju koja pretrazuje prijave istog korisnika i kompanije u vremenskom prozoru od 48 sati.
  - Filtriranje zavrsenih intervencija (RESOLVED, CANCELLED, REJECTED) koje se ne tretiraju kao duplikati.
  - `DuplicateWarningDialog.tsx` komponentu koja prikazuje zuti dijaloški okvir sa listom slicnih prijava, postotkom podudaranja, statusom intervencije i dugmadima za nastavak ili odustajanje.
  - Integraciju provjere duplikata u `fault-reports/page.tsx` prije stvarnog submitovanja forme, sa ocuvanjem pending akcije dok korisnik donese odluku.
  - Nove TypeScript interfejse: `DuplicateCheckPayload`, `DuplicateCheckResponse`, `PotentialDuplicateItem`.
  - Seed podatke: FR-101 (kvar osvjetljenja na ulazu) i FR-103 (vodovodna instalacija u kuhinji) sa odgovarajucim intervencijama za demonstraciju detekcije duplikata i negativnog scenarija.
  - 16 unit testova za `computeTextSimilarity`, `haversineKm`, `computeLocationSimilarity` i provjeru konstanti.
- **Sta je tim prihvatio:** Kompletna implementacija detekcije duplikata sa frontend upozorenjem, backend algoritmima slicnosti i seed podacima za testiranje. Svih 16 unit testova prolazi uspjesno.
- **Sta je tim izmijenio:** Tokom razvoja ustanovljeno je da seed podatke za PBI-025 treba kreirati sa `userId` prvog korisnika u bazi umjesto fiksnog demo korisnika, kako bi se izbjeglo rucno azuriranje baze nakon svakog pokretanja seeda. Takodjer je premjesten test fajl iz `src/modules/fault-reports/` u `test/` folder radi konzistentnosti sa ostatkom projekta, uz ispravku import putanje.
- **Sta je tim odbacio:** Migracijska skripta za dodavanje indeksa na `(userId, companyId, reportedAt)` je uklonjena jer je uzrokovala probleme pri pokretanju (`P3009` greska u Prisma Migrate) i nije bila neophodna za funkcionalnost u razvojnom okruzenju.
- **Rizici, problemi ili greske koje su uocene:** (1) Detekcija duplikata oslanja se na `userId` iz localStorage-a sto znaci da za neautenticirane korisnike provjera duplikata nije aktivna; (2) Jaccard algoritam za slicnost teksta moze propustiti semanticki slicne opise napisane razlicitim rijecima; (3) vremenski prozor od 48 sati je hardkodirana konstanta koja bi u produkciji trebala biti konfigurabilan parametar; (4) Keycloak gubi korisnicke lozinke pri restartu containera jer ne koristi persistentni volumen, sto zahtijeva rucni reset lozinke nakon svakog `docker compose down`.
- **Ko je koristio alat:** Lejla Gičević

