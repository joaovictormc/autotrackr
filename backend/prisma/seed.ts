import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANDS = [
  'Volkswagen', 'Ford', 'Chevrolet', 'Fiat', 'Toyota',
  'Honda', 'Hyundai', 'Nissan', 'Renault', 'BMW',
  'Mercedes-Benz', 'Audi', 'Mitsubishi', 'Jeep', 'Citroen', 'Peugeot',
];

// Taxonomia canônica de tipos de manutenção com o intervalo padrão (em km)
// recomendado pela média da indústria. Usado para auto-preencher lembretes.
const FALLBACK_TYPE = 'Revisão periódica';

const MAINTENANCE_TYPES = [
  { name: 'Alinhamento de rodas', defaultIntervalKm: 10000, defaultIntervalMonths: 12 },
  { name: 'Amortecedor', defaultIntervalKm: 30000, defaultIntervalMonths: 24 },
  { name: 'Balanceamento de pneus', defaultIntervalKm: 10000, defaultIntervalMonths: 12 },
  { name: 'Bateria', defaultIntervalKm: 20000, defaultIntervalMonths: 24 },
  { name: 'Escapamento', defaultIntervalKm: 30000, defaultIntervalMonths: 24 },
  { name: 'Filtro de ar', defaultIntervalKm: 10000, defaultIntervalMonths: 12 },
  { name: 'Filtro de combustível', defaultIntervalKm: 5000, defaultIntervalMonths: 12 },
  { name: 'Filtro do óleo', defaultIntervalKm: 5000, defaultIntervalMonths: 6 },
  { name: 'Fluido de direção hidráulica', defaultIntervalKm: 30000, defaultIntervalMonths: 24 },
  { name: 'Fluido de freio', defaultIntervalKm: 30000, defaultIntervalMonths: 24 },
  { name: 'Fluido de refrigeração', defaultIntervalKm: 30000, defaultIntervalMonths: 24 },
  { name: 'Óleo do motor', defaultIntervalKm: 5000, defaultIntervalMonths: 6 },
  { name: 'Pastilha de freio', defaultIntervalKm: 20000, defaultIntervalMonths: 24 },
  { name: 'Pneu', defaultIntervalKm: 50000, defaultIntervalMonths: 60 },
  { name: 'Retífica de motor', defaultIntervalKm: 200000, defaultIntervalMonths: 120 },
  { name: 'Revisão periódica', defaultIntervalKm: 10000, defaultIntervalMonths: 12 },
  { name: 'Vela', defaultIntervalKm: 30000, defaultIntervalMonths: 24 },
  { name: 'Filtro do ar-condicionado', defaultIntervalKm: 10000, defaultIntervalMonths: 12 },
];

async function main() {
  console.log('Seeding database...');

  for (const name of BRANDS) {
    await prisma.brand.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  console.log(`${BRANDS.length} brands seeded`);

  // 1. Upsert da taxonomia canônica (cria novos, atualiza intervalos dos existentes)
  for (const type of MAINTENANCE_TYPES) {
    await prisma.maintenanceType.upsert({
      where: { name: type.name },
      create: type,
      update: {
        defaultIntervalKm: type.defaultIntervalKm,
        defaultIntervalMonths: type.defaultIntervalMonths,
      },
    });
  }
  console.log(`${MAINTENANCE_TYPES.length} maintenance types upserted`);

  // 2. Remove tipos obsoletos (fora da lista canônica), remapeando os registros
  //    existentes para "Revisão periódica" antes de deletar — preserva os dados.
  const canonicalNames = MAINTENANCE_TYPES.map((t) => t.name);
  const fallback = await prisma.maintenanceType.findUnique({ where: { name: FALLBACK_TYPE } });
  const obsolete = await prisma.maintenanceType.findMany({
    where: { name: { notIn: canonicalNames } },
  });

  for (const old of obsolete) {
    if (fallback) {
      const remapped = await prisma.maintenanceRecord.updateMany({
        where: { maintenanceTypeId: old.id },
        data: { maintenanceTypeId: fallback.id },
      });
      if (remapped.count > 0) {
        console.log(`  remapped ${remapped.count} record(s) from "${old.name}" -> "${FALLBACK_TYPE}"`);
      }
    }
    await prisma.maintenanceType.delete({ where: { id: old.id } });
    console.log(`  removed obsolete type "${old.name}"`);
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
