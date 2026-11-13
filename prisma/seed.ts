import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Starting database reset...');

  // 1. Delete existing data
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.restockItem.deleteMany();
  await prisma.restock.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  console.log('Database cleared.');

  // 2. Create Categories
  console.log('Creating categories...');
  const catNames = ['ยาสามัญประจำบ้าน', 'วิตามินและอาหารเสริม', 'อุปกรณ์ปฐมพยาบาล', 'เวชสำอาง', 'อุปกรณ์การแพทย์'];
  const categories = await Promise.all(
    catNames.map(name => prisma.category.create({ data: { name } }))
  );

  // 3. Create Products
  console.log('Creating products...');
  const productsData = [
    { name: 'พาราเซตามอล 500mg', cost: 10, price: 15, stock: 100, minStock: 20, isPinned: true, catIndex: 0 },
    { name: 'ยาแก้ไอชวนป๋วย', cost: 45, price: 65, stock: 50, minStock: 10, isPinned: false, catIndex: 0 },
    { name: 'วิตามินซี 1000mg', cost: 250, price: 350, stock: 30, minStock: 5, isPinned: true, catIndex: 1 },
    { name: 'น้ำมันปลา 1000mg', cost: 300, price: 420, stock: 25, minStock: 5, isPinned: false, catIndex: 1 },
    { name: 'พลาสเตอร์ยา (กล่อง)', cost: 20, price: 35, stock: 200, minStock: 50, isPinned: true, catIndex: 2 },
    { name: 'แอลกอฮอล์ล้างแผล 450ml', cost: 35, price: 50, stock: 80, minStock: 20, isPinned: false, catIndex: 2 },
    { name: 'ครีมกันแดด SPF50+', cost: 400, price: 550, stock: 40, minStock: 10, isPinned: false, catIndex: 3 },
    { name: 'เจลล้างหน้าสูตรอ่อนโยน', cost: 180, price: 250, stock: 60, minStock: 15, isPinned: true, catIndex: 3 },
    { name: 'หน้ากากอนามัย 50 ชิ้น', cost: 40, price: 60, stock: 150, minStock: 30, isPinned: true, catIndex: 4 },
    { name: 'ปรอทวัดไข้ดิจิตอล', cost: 120, price: 190, stock: 20, minStock: 5, isPinned: false, catIndex: 4 },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        barcode: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
        cost: p.cost,
        price: p.price,
        stock: p.stock,
        minStock: p.minStock,
        isPinned: p.isPinned,
        categoryId: categories[p.catIndex].id,
      }
    });
    products.push(product);
  }

  // 4. Generate 6 Months of Data (180 days ago until today)
  console.log('Generating 6 months of historical data...');
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 180);

  // --- Generate Expenses ---
  const expenseDate = new Date(startDate);
  while (expenseDate <= today) {
    // Rent
    await prisma.expense.create({
      data: {
        description: 'ค่าเช่าที่',
        amount: 8000,
        expenseDate: new Date(expenseDate),
      }
    });
    // Utilities
    await prisma.expense.create({
      data: {
        description: 'ค่าน้ำค่าไฟ',
        amount: randomInt(1500, 3000),
        expenseDate: new Date(expenseDate.getTime() + 86400000 * 5),
      }
    });
    expenseDate.setMonth(expenseDate.getMonth() + 1);
  }

  // --- Generate Initial Restock ---
  console.log('Generating restocks...');
  let totalInitialCost = 0;
  const initialRestockItems = products.map(p => {
    const qty = randomInt(50, 200);
    const subtotal = qty * p.cost;
    totalInitialCost += subtotal;
    return {
      productId: p.id,
      quantity: qty,
      unitCost: p.cost,
      subtotal: subtotal
    };
  });
  
  await prisma.restock.create({
    data: {
      totalCost: totalInitialCost,
      supplier: 'บริษัท ฟาร์มาซีซัพพลาย จำกัด',
      createdAt: startDate,
      updatedAt: startDate,
      items: {
        create: initialRestockItems
      }
    }
  });

  // --- Generate Daily Sales ---
  console.log('Generating daily sales...');
  for (let i = 0; i < 180; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    const salesCount = randomInt(5, 15);

    for (let j = 0; j < salesCount; j++) {
      const itemsCount = randomInt(1, 4);
      const saleItemsData: { productId: number; quantity: number; priceAtSale: number; subtotal: number }[] = [];
      let saleTotal = 0;

      for (let k = 0; k < itemsCount; k++) {
        const product = products[randomInt(0, products.length - 1)];
        const qty = randomInt(1, 3);
        const subtotal = qty * product.price;
        saleTotal += subtotal;

        const existingItem = saleItemsData.find(item => item.productId === product.id);
        if (existingItem) {
          existingItem.quantity += qty;
          existingItem.subtotal += subtotal;
        } else {
          saleItemsData.push({
            productId: product.id,
            quantity: qty,
            priceAtSale: product.price,
            subtotal: subtotal
          });
        }
      }

      const saleTime = new Date(currentDate);
      saleTime.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59));

      await prisma.sale.create({
        data: {
          totalAmount: saleTotal,
          paymentMethod: Math.random() > 0.3 ? 'TRANSFER' : 'CASH',
          createdAt: saleTime,
          updatedAt: saleTime,
          items: {
            create: saleItemsData
          }
        }
      });
    }

    // --- Generate Periodic Restocks ---
    if (i > 0 && i % 15 === 0) {
      let restockTotal = 0;
      const restockItemsData: { productId: number; quantity: number; unitCost: number; subtotal: number }[] = [];

      const restockProductsCount = randomInt(3, 5);
      for (let r = 0; r < restockProductsCount; r++) {
        const product = products[randomInt(0, products.length - 1)];
        const qty = randomInt(20, 100);
        const subtotal = qty * product.cost;
        restockTotal += subtotal;
        
        if (!restockItemsData.find(item => item.productId === product.id)) {
          restockItemsData.push({
            productId: product.id,
            quantity: qty,
            unitCost: product.cost,
            subtotal: subtotal
          });
        }
      }

      const restockTime = new Date(currentDate);
      restockTime.setHours(10, 0, 0);

      await prisma.restock.create({
        data: {
          totalCost: restockTotal,
          supplier: 'ร้านค้าส่งยาประจำ',
          createdAt: restockTime,
          updatedAt: restockTime,
          items: {
            create: restockItemsData
          }
        }
      });
    }
    
    if (Math.random() < 0.1) { 
      const expenseTime = new Date(currentDate);
      expenseTime.setHours(14, 0, 0);
      await prisma.expense.create({
        data: {
          description: 'ค่าอุปกรณ์ทำความสะอาด',
          amount: randomInt(200, 800),
          expenseDate: expenseTime
        }
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
