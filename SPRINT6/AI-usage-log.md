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
# AI Usage Log 

- **Datum:** 6.5.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Implementacija upravljanja priloženim fajlovima (attachments) za intervencije.
- **Kratak opis zadatka ili upita:** Postavljanje kompletnog modula za upload, download i brisanje priloženih fajlova na intervencijama, uključujući backend servis s repository patternom, validaciju tipa i veličine fajla te frontend prikaz s akcijama po fajlu.
- **Šta je AI predložio ili generisao:**
    - `AttachmentService` klasu s `IAttachmentRepository` interfejsom radi testabilnosti.
    - Endpointe: `POST /interventions/:id/attachments`, `GET /interventions/:id/attachments`, `GET /attachments/:id/download` i `DELETE /attachments/:id`.
    - `DataTable` komponentu na frontendu s Download i Delete akcijama po redu.
    - `ConfirmDialog` komponentu za potvrdu brisanja attachmenta.
    - `formatFileSize` helper funkciju za prikaz veličine fajla.
    - Unit testove za attachment servis.
- **Šta je tim prihvatio:** Kompletnu backend implementaciju s repository patternom, sve API endpointe, frontend prikaz attachmenta s potvrdom brisanja.
- **Šta je tim izmijenio:** /
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Uočen je pre-existing bug u importu unutar route fajla koji je ispravljen tokom implementacije; Cloudflare Pages CI check padao zbog nedostajućeg `export const runtime = 'edge'` na dinamičkim stranicama.
- **Ko je koristio alat:** Nedim Omanović

---



- **Datum:** 06.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Implementacija planiranja intervencija — kreiranje, pregled detalja i uređivanje intervencija od strane koordinatora, uz merge s PBI-033 granom.
- **Kratak opis zadatka ili upita:** Implementacija tri user storije: koordinator kreira intervenciju vezanu za fault report, koordinator kreira preventivnu intervenciju bez fault reporta, koordinator uređuje intervenciju dok je status NEW ili IN_PROGRESS. Uključivalo je i rješavanje merge konflikata s PBI-033 granom.
- **Šta je AI predložio ili generisao:**
    - `InterventionService` klasu s `IInterventionRepository` interfejsom.
    - Zod validacijske sheme s `optionalDateField` helperom za pravilno razlikovanje `undefined` vs `null` pri Prisma update operacijama.
    - `POST /interventions` i `PATCH /interventions/:id` endpointe s autorizacijom za koordinatora i admina.
    - Audit logiranje `INTERVENTION_CREATED` i `INTERVENTION_UPDATED` evenata.
    - Frontend forme za kreiranje i uređivanje intervencija s klijentskom validacijom.
    - Detaljan prikaz intervencije s uslovnim "Edit Intervention" dugmetom ovisno o statusu.
    - 24 unit testa za intervention servis.
    - `wrangler.toml` konfiguraciju i `export const runtime = 'edge'` na svim dinamičkim stranicama za Cloudflare Pages.
- **Šta je tim prihvatio:** Kompletnu backend implementaciju s testovima, sve tri frontend stranice (lista, detalji, nova/uredi forma), Cloudflare Pages ispravke.
- **Šta je tim izmijenio:** Ispravka `KEYCLOAK_CLIENT_SECRET` u `.env` fajlu koji nije odgovarao stvarnoj Keycloak konfiguraciji; proširena seed skripta s testnim intervencijama različitih statusa za lokalno testiranje.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Stranice `/interventions/new` i `/interventions/[id]/edit` nisu bile commitane u git iz prethodne sesije te su rekrearane; `@base-ui/react/select` tipizira `onValueChange` kao `string | null` što je zahtijevalo `?? ''` null-coalescing na svim Select komponentama; Cloudflare Pages native integracija zahtijeva `export const runtime = 'edge'` na svim dinamičkim rutama.
- **Ko je koristio alat:** Nedim Omanović

---



- **Datum:** 06.05.2026.
- **Sprint broj:** Sprint 6
- **Alat koji je korišten:** Claude (Anthropic)
- **Svrha korištenja:** Implementacija modula za prioritet intervencije, SLA konfiguraciju i automatska upozorenja o kašnjenju.
- **Kratak opis zadatka ili upita:** Implementacija tri user storije: koordinator dodjeljuje i mijenja prioritet intervencije, administrator konfigurira SLA rokove po prioritetu, sistem automatski signalizira kašnjenje koordinatoru kada intervencija nije riješena unutar definisanog roka.
- **Šta je AI predložio ili generisao:**
    - `SlaService` klasu s metodama za dohvat i ažuriranje SLA konfiguracije po prioritetu s validacijom pozitivnih vrijednosti.
    - Backend endpointe `GET /sla` i `PUT /sla` s autorizacijom za admina i audit logiranjem promjena.
    - `isOverdue` flag na `InterventionListItem` koji se računa na osnovu `createdAt + SLA rok za prioritet`.
    - `PriorityBadge` komponentu s bojom po nivou prioriteta (Hitan = crvena, Visok = narandžasta, Normalan = plava, Nizak = siva).
    - Vizualnu oznaku kašnjenja u listi intervencija bez promjene statusa intervencije.
    - Automatsko sortiranje liste po prioritetu (Hitan > Visok > Normalan > Nizak), unutar istog prioriteta po datumu kreiranja.
    - Admin stranicu `/admin/sla-config` s formom za unos rokova u satima po prioritetu.
    - Unit testove za SLA servis.
- **Šta je tim prihvatio:** Kompletnu backend implementaciju SLA servisa, `PriorityBadge` komponentu, admin stranicu za konfiguraciju, `isOverdue` flag i vizualnu oznaku kašnjenja, sortiranje liste po prioritetu.
- **Šta je tim izmijenio:** Dodat prikaz labela prioriteta u frontend error porukama umjesto generičke poruke; dodat test za duplicate priority business invariant u `sla.service.test.ts`; poništene izmjene u `route.ts` jer kompletan refactor nije bio spreman za merge.
- **Šta je tim odbacio:** /
- **Rizici, problemi ili greške koje su uočene:** Git merge konflikt između lokalne refaktorisane verzije i remote verzije sa starijim kodom; poništavanje `route.ts` izmjena ostavilo je dio logike za `ValidationError` kao tehnički dug; frontend error mapping koristi heuristiku baziranu na tekstu poruke što može biti fragilno ako se backend poruke promijene; `export const runtime = 'edge'` bio je nedostajući na admin SLA stranici što je uzrokovalo pad Cloudflare Pages builda.
- **Ko je koristio alat:** Nedim Omanović
