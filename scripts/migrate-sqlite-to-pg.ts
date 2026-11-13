// @ts-expect-error node:sqlite is built-in in Node 22+
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Kitmoney: SQLite to PostgreSQL Migration ===\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://'))) {
    console.error('Error: DATABASE_URL must be a valid PostgreSQL connection string.');
    console.error('Example: postgresql://user:password@ep-sample-1234.us-east-1.aws.neon.tech/neondb?sslmode=require');
    process.exit(1);
  }

  const sqlitePath = path.resolve(process.cwd(), 'prisma/dev.db');
  if (!fs.existsSync(sqlitePath)) {
    console.error(`Error: SQLite database file not found at ${sqlitePath}`);
    process.exit(1);
  }

  console.log(`Connecting to SQLite: ${sqlitePath}`);
  const sqlite = new DatabaseSync(sqlitePath);

  try {
    // Test PostgreSQL connection
    console.log('Connecting to PostgreSQL...');
    await prisma.$connect();
    console.log('Connected to PostgreSQL successfully.\n');

    // 1. Categories
    console.log('Migrating Categories...');
    const rawCategories = sqlite.prepare('SELECT id, name FROM Category ORDER BY id ASC').all() as Array<{
      id: number;
      name: string;
    }>;

    if (rawCategories.length > 0) {
      await prisma.category.createMany({
        data: rawCategories.map((c) => ({
          id: c.id,
          name: c.name,
        })),
        // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
      });
    }
    console.log(`- Migrated ${rawCategories.length} Categories.`);

    // 2. Products
    console.log('Migrating Products...');
    const rawProducts = sqlite.prepare('SELECT * FROM Product ORDER BY id ASC').all() as Array<{
      id: number;
      barcode: string | null;
      name: string;
      categoryId: number | null;
      cost: number;
      price: number;
      stock: number;
      isPinned: number | boolean;
      minStock: number;
      createdAt: string | number;
      updatedAt: string | number;
    }>;

    if (rawProducts.length > 0) {
      await prisma.product.createMany({
        data: rawProducts.map((p) => ({
          id: p.id,
          barcode: p.barcode || null,
          name: p.name,
          categoryId: p.categoryId ? Number(p.categoryId) : null,
          cost: Number(p.cost) || 0,
          price: Number(p.price) || 0,
          stock: Number(p.stock) || 0,
          isPinned: Boolean(p.isPinned),
          minStock: Number(p.minStock) || 10,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
        // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
      });
    }
    console.log(`- Migrated ${rawProducts.length} Products.`);

    // 3. Sales
    console.log('Migrating Sales...');
    const rawSales = sqlite.prepare('SELECT * FROM Sale ORDER BY id ASC').all() as Array<{
      id: number;
      totalAmount: number;
      paymentMethod: string;
      createdAt: string | number;
      updatedAt: string | number;
    }>;

    if (rawSales.length > 0) {
      await prisma.sale.createMany({
        data: rawSales.map((s) => ({
          id: s.id,
          totalAmount: Number(s.totalAmount) || 0,
          paymentMethod: s.paymentMethod || 'CASH',
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        })),
        // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
      });
    }
    console.log(`- Migrated ${rawSales.length} Sales.`);

    // 4. SaleItems
    console.log('Migrating SaleItems...');
    const rawSaleItems = sqlite.prepare('SELECT * FROM SaleItem ORDER BY id ASC').all() as Array<{
      id: number;
      saleId: number;
      productId: number | null;
      quantity: number;
      priceAtSale: number;
      costAtSale?: number;
      subtotal: number;
    }>;

    if (rawSaleItems.length > 0) {
      // Chunk insertions to avoid parameter limits
      const chunkSize = 1000;
      for (let i = 0; i < rawSaleItems.length; i += chunkSize) {
        const chunk = rawSaleItems.slice(i, i + chunkSize);
        await prisma.saleItem.createMany({
          data: chunk.map((item) => ({
            id: item.id,
            saleId: item.saleId,
            productId: item.productId ? Number(item.productId) : null,
            quantity: Number(item.quantity) || 0,
            priceAtSale: Number(item.priceAtSale) || 0,
            costAtSale: Number(item.costAtSale ?? 0),
            subtotal: Number(item.subtotal) || 0,
          })),
          // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
        });
      }
    }
    console.log(`- Migrated ${rawSaleItems.length} SaleItems.`);

    // 5. Restocks
    console.log('Migrating Restocks...');
    const rawRestocks = sqlite.prepare('SELECT * FROM Restock ORDER BY id ASC').all() as Array<{
      id: number;
      totalCost: number;
      supplier: string | null;
      createdAt: string | number;
      updatedAt: string | number;
    }>;

    if (rawRestocks.length > 0) {
      await prisma.restock.createMany({
        data: rawRestocks.map((r) => ({
          id: r.id,
          totalCost: Number(r.totalCost) || 0,
          supplier: r.supplier || null,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        })),
        // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
      });
    }
    console.log(`- Migrated ${rawRestocks.length} Restocks.`);

    // 6. RestockItems
    console.log('Migrating RestockItems...');
    const rawRestockItems = sqlite.prepare('SELECT * FROM RestockItem ORDER BY id ASC').all() as Array<{
      id: number;
      restockId: number;
      productId: number | null;
      quantity: number;
      unitCost: number;
      subtotal: number;
    }>;

    if (rawRestockItems.length > 0) {
      await prisma.restockItem.createMany({
        data: rawRestockItems.map((item) => ({
          id: item.id,
          restockId: item.restockId,
          productId: item.productId ? Number(item.productId) : null,
          quantity: Number(item.quantity) || 0,
          unitCost: Number(item.unitCost) || 0,
          subtotal: Number(item.subtotal) || 0,
        })),
        // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
      });
    }
    console.log(`- Migrated ${rawRestockItems.length} RestockItems.`);

    // 7. Expenses
    console.log('Migrating Expenses...');
    const rawExpenses = sqlite.prepare('SELECT * FROM Expense ORDER BY id ASC').all() as Array<{
      id: number;
      description: string;
      amount: number;
      expenseDate: string | number;
      createdAt: string | number;
      updatedAt: string | number;
    }>;

    if (rawExpenses.length > 0) {
      await prisma.expense.createMany({
        data: rawExpenses.map((e) => ({
          id: e.id,
          description: e.description,
          amount: Number(e.amount) || 0,
          expenseDate: new Date(e.expenseDate),
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
        })),
        // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
      });
    }
    console.log(`- Migrated ${rawExpenses.length} Expenses.`);

    // 8. Users
    console.log('Migrating Users...');
    const rawUsers = sqlite.prepare('SELECT * FROM User ORDER BY id ASC').all() as Array<{
      id: number;
      username: string;
      passwordHash: string;
      createdAt: string | number;
    }>;

    if (rawUsers.length > 0) {
      await prisma.user.createMany({
        data: rawUsers.map((u) => ({
          id: u.id,
          username: u.username,
          passwordHash: u.passwordHash,
          createdAt: new Date(u.createdAt),
        })),
        // @ts-expect-error skipDuplicates is supported on PostgreSQL
        skipDuplicates: true,
      });
    }
    console.log(`- Migrated ${rawUsers.length} Users.`);

    // Reset PostgreSQL Sequences to prevent ID conflict
    console.log('\nResetting PostgreSQL autoincrement sequences...');
    const sequenceTables = ['Category', 'Product', 'Sale', 'SaleItem', 'Restock', 'RestockItem', 'Expense', 'User'];
    for (const table of sequenceTables) {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT NULL) FROM "${table}";`
      );
    }
    console.log('All PostgreSQL serial sequences reset successfully.');

    console.log('\n=== Migration completed successfully! ===');
  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main();
