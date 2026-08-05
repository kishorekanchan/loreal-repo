import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.claim.create({
    data: {
      productId: 'PROD-ANTIWRINKLE-01',
      claimText: 'Reduces wrinkles by 20% in 4 weeks',
      claimType: 'efficacy',
      status: 'FORMULATED',
      formulaRef: 'FORMULA-REF-4471',
    },
  });
  console.log('Seeded one example claim, ready for the evaluator/assess step.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
