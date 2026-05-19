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

