# AI Usage Log

- **Datum:** 07.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** GitHub Copilot (LLM) / GPT-5.4 mini
- **Svrha korištenja:** Implementacija PBI-006 (dodjela servisera intervencijama) i pripadajuce verifikacije backend/frontend toka.
- **Kratak opis zadatka ili upita:** Razvoj backend i frontend podrške za dodjelu jednog ili vise servisera otvorenoj intervenciji, prikaz serviser liste sortirane po broju aktivnih intervencija, mogucnost izmjene/uklanjanja dodjele, audit evidentiranje i integracija UI elementa unutar detalja intervencije.
- **Sta je AI predlozio ili generisao:**
    - `AssignmentService` za dodjelu, uklanjanje i pregled dodjela, te izracun opterecenja servisera po aktivnim intervencijama.
    - `AssignmentController` i route integraciju za `GET /interventions/:id/assignments`, `GET /interventions/:id/assignments/available`, `POST /interventions/:id/assignments` i `DELETE /interventions/:id/assignments/:userId`.
    - Zod DTO/validation sloj za unos liste `userIds` i response modele za dodjele i dostupne servisere.
    - Frontend API client za assignment pozive, `AssignerModal` komponentu i integraciju u stranicu intervencija.
    - Test scenarije za uspjeh, nepostojecu intervenciju, deaktiviranog servisera, duplikat dodjele, uklanjanje dodjele i prikaz load liste.
- **Sta je tim prihvatio:** Kompletan backend tok za assignment, audit log zapis pri dodjeli i uklanjanju, sortiranje servisera po aktivnom opterecenju, te frontend modal za koordinatora unutar detalja intervencije.
- **Sta je tim izmijenio:** Existing assignments ruta je pretvorena iz shell odgovora u funkcionalan modul; frontend strana intervencije je dobila dugme i modal za dodjelu; aktivne intervencije za load racunaju se kao `NEW`, `ASSIGNED` i `IN_PROGRESS`.
- **Sta je tim odbacio:** Automatske notifikacije pri dodjeli nisu implementirane jer zavise od PBI-012; real-time websocket osvjezavanje nije dodano, nego je koristen refresh/load pri otvaranju modala.
- **Rizici, problemi ili greške koje su uočene:** Testovi backend modula zavise od dostupne baze preko `DATABASE_URL`; lokalni build/test tok je pokazao i postojece TypeScript probleme iz drugih dijelova projekta (npr. pre-existing frontend `Button variant` i neke backend enum neslaganja) koji nisu dio PBI-006, ali uticu na globalnu verifikaciju.
- **Ko je koristio alat:** Ismail Mujanović