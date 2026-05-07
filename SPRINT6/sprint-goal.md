# Sprint broj: Sprint 6

## Sprint cilj
Implementirati kreiranje i zakazivanje intervencija, upravljanje prioritetima, dodjela servisera, pregled liste aktivnih intervencija kao centralni operativni ekran koordinatora, te historija intervencija kao podrška serviseru na terenu. Paralelno uvesti administrativno upravljanje korisničkim računima i proširiti funkcionalnost intervencija komentarima i upravljanjem attachmentima.

---

## Ključne stavke koje tim želi završiti

- Planiranje intervencija (PBI-004)
- Postavljanje prioriteta intervencije (PBI-005)
- Dodjela servisera intervenciji (PBI-006)
- Pregled liste aktivnih intervencija (PBI-007)
- Historija intervencija — dostupno serviserima kao ispomoć (PBI-011)
- Upravljanje korisničkim računima — Admin (PBI-013)
- Komentari intervencije (PBI-016)
- Pregled i upravljanje attachmentima (PBI-033)

---

## Rizici i zavisnosti

- Rizik: PBI-019 (Reset lozinke) prenesen iz Sprint 5 zbog nedostupnosti SMTP-a na Railway free planu; SMTP konfiguracija mora biti riješena na početku Sprinta 6 kao infrastrukturni preduvjet; u suprotnom stavka opet ostaje bez isporuke.
- Rizik: PBI-013 (Upravljanje korisničkim računima) izvorno planiran za Sprint 8; uvođenjem u Sprint 6 povećava se ukupni kapacitet sprinta; tim mora procijeniti da li 8 SP uklapaju u dostupni kapacitet.
- Rizik: PBI-005 (prioriteti) i PBI-007 (lista intervencija) zahtijevaju vizualnu razliku po prioritetima na frontend-u — bez dogovora o dizajnu (boje, ikone) implementacija može biti nedosljedna između članova tima.

- Zavisnost: PBI-004 mora biti završen prije PBI-005, PBI-006 i PBI-007 — intervencija mora postojati da bi joj se dodijelili prioritet, serviser i da bi bila prikazana u listi.
- Zavisnost: PBI-006 mora biti završen ili paralelno razvijan s PBI-007 — lista prikazuje dodijeljenog servisera kao obavezan podatak.
- Zavisnost: PBI-013 mora biti funkcionalan da bi PBI-006 mogao prikazivati servisere s aktivnim računima i ispravno filtrirati deaktivirane korisnike.
- Zavisnost: PBI-033 zavisi od PBI-003 (Prijava kvara — upload fajlova) koji je isporučen u Sprintu 5; attachmenti moraju biti pohranjeni da bi upravljanje njima imalo smisla.
- Zavisnost: PBI-011 zavisi od PBI-004 — historija intervencija po lokaciji pretpostavlja da intervencije imaju definisanu lokaciju, što se unosi pri planiranju.
- Zavisnost: PBI-016 (Komentari) logički zavisi od PBI-004; komentari se dodaju na kreiranu intervenciju; implementacija može teći paralelno, ali end-to-end tok zahtijeva da intervencija postoji.
- Zavisnost: PBI-007 mora biti završen ili paralelno razvijan s PBI-005 - vizuelni prikaz prioriteta se ne može implementirati bez osnovnog skeleta prikaza intervencija.