import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill for costAtSale on SaleItems...');

  const products = await prisma.product.findMany({
    select: { id: true, cost: true },
  });

  let totalUpdated = 0;
  for (const product of products) {
    if (product.cost > 0) {
      const res = await prisma.saleItem.updateMany({
        where: {
          productId: product.id,
          costAtSale: 0,
        },
        data: {
          costAtSale: product.cost,
        },
      });
      totalUpdated += res.count;
    }
  }

  console.log(`Successfully backfilled ${totalUpdated} sale item(s).`);
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
