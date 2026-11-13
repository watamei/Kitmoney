export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface RestockItemInput {
  productId: number;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplier, totalCost, items } = body as {
      supplier?: string;
      totalCost: number;
      items: RestockItemInput[];
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const restock = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Create the restock record
      const newRestock = await tx.restock.create({
        data: {
          supplier,
          totalCost,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update stock and weighted average cost for each product
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const oldStock = Math.max(product.stock, 0);
          const qty = item.quantity;
          const unitCost = item.unitCost;
          const divisor = oldStock + qty;
          const newCost = divisor === 0
            ? unitCost
            : (oldStock * product.cost + qty * unitCost) / divisor;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: qty },
              cost: newCost,
            },
          });
        }
      }

      return newRestock;
    });

    return NextResponse.json(restock);
  } catch (error) {
    console.error('Restock transaction failed:', error);
    return NextResponse.json({ error: 'Failed to process restock' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const history = await prisma.restock.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch restock history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
