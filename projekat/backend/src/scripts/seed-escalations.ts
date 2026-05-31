/**
 * seed-escalations.ts
 *
 * Dodaje demo eskalacije za PBI-058.
 * Pokrenuti NAKON glavnog seeda (npm run prisma:seed).
 *
 *   npx tsx src/scripts/seed-escalations.ts
 */

import { PrismaClient } from '@prisma/client';
import { requireDatabaseUrl } from '../config/database-url';

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: requireDatabaseUrl('seed-escalations script') } },
  });

  try {
    // ── Pronalazi usere i intervencije iz glavnog seeda ──────────────────────

    const coordinator = await prisma.user.findFirst({
      where: { username: 'milan.koordinator' },
      select: { id: true, firstName: true, lastName: true },
    });

    const management = await prisma.user.findFirst({
      where: { username: 'lejla.menadzment' },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!coordinator) {
      console.error(
        '❌  Koordinator nije pronađen. Pokrenite prvo: npm run prisma:seed',
      );
      process.exitCode = 1;
      return;
    }

    if (!management) {
      console.error(
        '❌  Menadžment korisnik nije pronađen. Pokrenite prvo: npm run prisma:seed',
      );
      process.exitCode = 1;
      return;
    }

    // Dohvata dostupne intervencije
    const interventions = await prisma.intervention.findMany({
      select: { id: true, name: true, status: true, priority: true },
      orderBy: { id: 'asc' },
    });

    if (interventions.length === 0) {
      console.error(
        '❌  Nema intervencija u bazi. Pokrenite prvo: npm run prisma:seed',
      );
      process.exitCode = 1;
      return;
    }

    console.log(`ℹ️  Pronađeno ${interventions.length} intervencija.`);
    console.log(`ℹ️  Koordinator: ${coordinator.firstName} ${coordinator.lastName} (id=${coordinator.id})`);
    console.log(`ℹ️  Menadžment:  ${management.firstName} ${management.lastName} (id=${management.id})`);

    // ── Briše stare eskalacije iz prethodnih pokretanja ovog seeda ───────────

    await prisma.interventionEscalation.deleteMany({
      where: { escalatedById: coordinator.id },
    });

    // ── Demo eskalacije ───────────────────────────────────────────────────────

    const int1 = interventions[0];
    const int2 = interventions[1] ?? interventions[0];
    const int3 = interventions[2] ?? interventions[0];

    // 1. Eskalacija koja NIJE pregledana — vidljiva menadžmentu u dashboardu
    const esc1 = await prisma.interventionEscalation.create({
      data: {
        interventionId: int1.id,
        escalatedById: coordinator.id,
        reason: 'Kašnjenje u pogledu SLA roka — rizik od penala',
        comment:
          'Intervencija je prešla predviđeni rok od 8 sati bez napretka. ' +
          'Serviser nije dostupan, a klijent je već zvao dva puta. ' +
          'Potrebna je hitna akcija od strane menadžmenta kako bi se izbjegao SLA penalty.',
        reviewedAt: null,
        reviewedById: null,
      },
    });

    // 2. Eskalacija koja JE pregledana — historijski zapis
    const esc2 = await prisma.interventionEscalation.create({
      data: {
        interventionId: int2.id,
        escalatedById: coordinator.id,
        reason: 'Nedostaje ključni materijal za završetak radova',
        comment:
          'Serviser je na terenu ali nema potrebne rezervne dijelove. ' +
          'Naručili smo materijal ali isporuka kasni minimum 3 dana. ' +
          'Molim menadžment da odobri hitnu nabavku od alternativnog dobavljača.',
        reviewedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // pregledano prije 2h
        reviewedById: management.id,
      },
    });

    // 3. Još jedna nepregledana eskalacija na drugoj intervenciji
    const esc3 = await prisma.interventionEscalation.create({
      data: {
        interventionId: int3.id,
        escalatedById: coordinator.id,
        reason: 'Klijent prijeti raskidom ugovora',
        comment:
          'Nakon tre ćeg odgađanja termina klijent je kontaktirao direktora kompanije. ' +
          'Situacija je kritična — intervencija mora biti završena do sutra ujutro. ' +
          'Potrebno je hitno dodijeliti dodatnog servisera.',
        reviewedAt: null,
        reviewedById: null,
      },
    });

    console.log('\n✅  Demo eskalacije kreirane:\n');
    console.log(
      `   [${esc1.id}] Intervencija #${esc1.interventionId} — "${esc1.reason}"`,
    );
    console.log(`       Status: ⏳ Čeka na pregled menadžmenta`);
    console.log(
      `   [${esc2.id}] Intervencija #${esc2.interventionId} — "${esc2.reason}"`,
    );
    console.log(
      `       Status: ✅ Pregledano od ${management.firstName} ${management.lastName}`,
    );
    console.log(
      `   [${esc3.id}] Intervencija #${esc3.interventionId} — "${esc3.reason}"`,
    );
    console.log(`       Status: ⏳ Čeka na pregled menadžmenta`);

    console.log('\n📋  Kako vidjeti eskalacije:\n');
    console.log('   • Intervencijski detalj: /interventions/<id>  (kartica "Eskalacije")');
    console.log('   • Menadžment dashboard: /management  (sekcija "Eskalacije" na dnu stranice)');
    console.log('\n   Uloge za testiranje:');
    console.log('   • Koordinator (milan.koordinator) — može eskalirati');
    console.log('   • Menadžment  (lejla.menadzment)  — može pregledati eskalacije');
    console.log('   • Serviser    (marko.serviser)     — NE vidi eskalacije\n');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error('❌  Seed eskalacija nije uspio.');
  if (error instanceof Error) console.error(error.message);
  process.exitCode = 1;
});
