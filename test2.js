const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          totalAmount: 12,
          paymentMethod: "CASH",
          items: {
            create: [
              {
                productId: 1,
                quantity: 1,
                priceAtSale: 12,
                subtotal: 12
              }
            ]
          }
        },
        include: { items: true },
      });
      return newSale;
    });
    console.log("Created sale:", sale);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
