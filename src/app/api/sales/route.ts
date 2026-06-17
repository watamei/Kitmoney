export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { items, paymentMethod, totalAmount } = data;

    // Use a transaction to ensure all operations succeed or fail together
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sale = await prisma.$transaction(async (tx: any) => {
      // 1. Create the sale
      const newSale = await tx.sale.create({
        data: {
          totalAmount,
          paymentMethod,
          items: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              priceAtSale: item.price,
              subtotal: item.price * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Deduct stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Sale transaction failed:', error);
    return NextResponse.json({ error: 'Failed to complete sale' }, { status: 500 });
  }
}
