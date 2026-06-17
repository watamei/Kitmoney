import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { supplier, totalCost, items } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    const restock = await prisma.$transaction(async (tx: any) => {
      // 1. Create the restock record
      const newRestock = await tx.restock.create({
        data: {
          supplier,
          totalCost,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: item.unitCost,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update stock and cost for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            cost: item.unitCost, // Update to the newest cost
          },
        });
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
