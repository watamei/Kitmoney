const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const product = await prisma.product.update({
      where: { id: 1 },
      data: {
        category: { disconnect: true }
      }
    });
    console.log("Updated product:", product);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
