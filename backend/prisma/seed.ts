import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRANDS = [
  'Volkswagen', 'Ford', 'Chevrolet', 'Fiat', 'Toyota',
  'Honda', 'Hyundai', 'Nissan', 'Renault', 'BMW',
  'Mercedes-Benz', 'Audi', 'Mitsubishi', 'Jeep', 'Citroen', 'Peugeot',
];

const MAINTENANCE_TYPES = [
  { name: 'Troca de Óleo', description: 'Troca do óleo do motor e filtro de óleo' },
  { name: 'Revisão Geral', description: 'Revisão completa do veículo' },
  { name: 'Troca de Filtros', description: 'Troca de filtros de ar, combustível e cabine' },
  { name: 'Alinhamento e Balanceamento', description: 'Alinhamento da direção e balanceamento das rodas' },
  { name: 'Troca de Pneus', description: 'Substituição dos pneus' },
  { name: 'Freios', description: 'Manutenção do sistema de freios (pastilhas, discos, fluido)' },
  { name: 'Bateria', description: 'Verificação e substituição da bateria' },
  { name: 'Arrefecimento', description: 'Manutenção do sistema de arrefecimento (radiador, fluido)' },
  { name: 'Suspensão', description: 'Manutenção dos componentes de suspensão' },
  { name: 'Correia Dentada', description: 'Troca da correia dentada e tensor' },
  { name: 'Embreagem', description: 'Manutenção do sistema de embreagem' },
  { name: 'Sistema Elétrico', description: 'Verificação e reparo do sistema elétrico' },
  { name: 'Injeção Eletrônica', description: 'Limpeza e manutenção do sistema de injeção' },
  { name: 'Ar Condicionado', description: 'Manutenção do sistema de ar condicionado' },
  { name: 'Direção Hidráulica', description: 'Manutenção do sistema de direção hidráulica' },
  { name: 'Velas e Cabos', description: 'Troca de velas de ignição e cabos de vela' },
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

  for (const type of MAINTENANCE_TYPES) {
    await prisma.maintenanceType.upsert({
      where: { name: type.name },
      create: type,
      update: {},
    });
  }
  console.log(`${MAINTENANCE_TYPES.length} maintenance types seeded`);

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
