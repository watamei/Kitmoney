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
      return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
    }

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
          throw new InsufficientStockError(`สต็อกสินค้าไม่พอ: ${productName}`);
        }
      }

      // 2. Create the sale with costAtSale from DB
      const newSale = await tx.sale.create({
        data: {
          totalAmount,
          paymentMethod,
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
  } catch (error) {
    if (error instanceof InsufficientStockError || (error as Error)?.name === 'InsufficientStockError') {
      return NextResponse.json({ error: (error as Error).message }, { status: 409 });
    }
    console.error('Sale transaction failed:', error);
    return NextResponse.json({ error: 'Failed to complete sale' }, { status: 500 });
  }
}
