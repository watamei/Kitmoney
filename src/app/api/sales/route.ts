export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface SaleItemInput {
  id: number;
  quantity: number;
  price: number;
  name?: string;
}

class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { items, paymentMethod, totalAmount } = data as {
      items: SaleItemInput[];
      paymentMethod: string;
      totalAmount: number;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'ไม่มีรายการสินค้าในคำสั่งซื้อ (No items in sale)' }, { status: 400 });
    }

    const calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const finalTotal = typeof totalAmount === 'number' && Number.isFinite(totalAmount) ? totalAmount : calculatedTotal;
    const finalMethod = paymentMethod === 'TRANSFER' ? 'TRANSFER' : 'CASH';

    // Use a transaction to ensure all operations succeed or fail together
    const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Fetch products to get current cost and names from DB
      const productIds = items.map((item) => item.id);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, cost: true, stock: true },
      });
      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // 1. Deduct stock atomically and check for sufficient stock
      for (const item of items) {
        const product = productMap.get(item.id);
        const productName = product?.name || item.name || `ID ${item.id}`;

        const updateResult = await tx.product.updateMany({
          where: {
            id: item.id,
            stock: { gte: item.quantity },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updateResult.count === 0) {
          throw new InsufficientStockError(`สต็อกสินค้าไม่พอ: ${productName} (คงเหลือในระบบ: ${product?.stock ?? 0})`);
        }
      }

      // 2. Create the sale with costAtSale from DB
      const newSale = await tx.sale.create({
        data: {
          totalAmount: finalTotal,
          paymentMethod: finalMethod,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.id);
              const costAtSale = product ? product.cost : 0;
              return {
                productId: item.id,
                quantity: item.quantity,
                priceAtSale: item.price,
                costAtSale,
                subtotal: item.price * item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    if (error instanceof InsufficientStockError || error?.name === 'InsufficientStockError') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Sale transaction failed:', error);
    return NextResponse.json({ error: 'บันทึกการขายไม่สำเร็จ: ' + (error?.message || 'Database error') }, { status: 500 });
  }
}
