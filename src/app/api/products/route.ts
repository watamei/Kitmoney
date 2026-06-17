export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search } },
          { barcode: { contains: search } }
        ]
      };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: { category: true }
    });

    const formattedProducts = products.map((p: Record<string, unknown> & { category?: { name: string } | null }) => ({
      ...p,
      category: p.category?.name || null
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    let categoryConnect: Record<string, unknown> | undefined = undefined;
    if (data.category && data.category.trim() !== '') {
      categoryConnect = {
        connectOrCreate: {
          where: { name: data.category.trim() },
          create: { name: data.category.trim() }
        }
      };
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        barcode: data.barcode || null,
        category: categoryConnect,
        cost: parseFloat(data.cost) || 0,
        price: parseFloat(data.price) || 0,
        stock: parseInt(data.stock) || 0,
        minStock: parseInt(data.minStock) || 10,
        isPinned: Boolean(data.isPinned),
      }
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
