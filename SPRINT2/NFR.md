# Non-Functional Requirements (NFR)

| ID  | Kategorija | Opis zahtjeva | Provjera | Prioritet | Napomena |
| --- | ---------- | ------------- | -------- | --------- | -------- |
| NFR_01 | Performanse | Sistem mora omogućiti učitavanje liste aktivnih intervencija u roku kraćem od 2 sekunde za do 1000 zapisa | Testiranje opterećenja (load testing) simulacijom više korisnika | Visok | Ključno za rad koordinatora u realnom vremenu |
| NFR_02 | Sigurnost | Sistem mora omogućiti autentifikaciju korisnika putem korisničkog imena (email-a) i lozinke | Testiranjem login funkcionalnosti i pokušajima neovlaštenog pristupa | Visok | Osnovni sigurnosni zahtjev za MVP |
| NFR_03 | Sigurnost / Privatnost | Podaci o korisnicima i intervencijama moraju biti zaštićeni od neovlaštenog pristupa | Provjera role-based pristupa | Visok | Usklađeno sa zaštitom ličnih podataka |
| NFR_04 | Pouzdanost | Sistem mora biti dostupan bar 99% vremena | Praćenjem uptime-a sistema tokom testnog perioda | Srednji | Kritično za hitne intervencije |
| NFR_05 | Upotrebljivost | Korisnički interfejs mora biti jednostavan i omogućiti prijavu intervencije u maksimalno 3 koraka | Korisničko testiranje (usability testing) | Srednji | Bitno za građane koji nemaju bolju tehničku podlogu |
| NFR_06 | Skalabilnost | Sistem mora podržati povećanje broja korisnika bez značajnog pada performansi | Simulacija rasta broja korisnika | Srednji | Bitno za buduće proširenje na više gradova |
| NFR_07 | Održivost | Kod sistema mora biti čist, jasan i dokumentovan radi lakšeg održavanja | Code review i dokumentacija | Nizak | Važno za dalji razvoj sistema |
| NFR_08 | Performanse | Sistem mora omogućiti unos nove intervencije u roku kraćem od 1 sekunde | Testiranje vremena odgovora API-ja | Visok | Bitno za hitne situacije |
| NFR_09 | Privatnost| Sistem mora omogućiti prikaz samo relevantnih podataka korisnicima prema njihovoj ulozi | Testiranje pristupa različitim korisničkim ulogama | Visok | Npr. građanin ne vidi neke interne bilješke |
| NFR_10 | Upotrebljivost | Sistem mora biti dostupan putem web preglednika bez potrebe za instalacijom | Testiranje na različitim browserima | Nizak | Olakšan pristup |


