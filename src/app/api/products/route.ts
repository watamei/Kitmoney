export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface CreateProductRequestBody {
  name: string;
  barcode?: string | null;
  category?: string;
  cost?: string | number;
  price?: string | number;
  stock?: string | number;
  minStock?: string | number;
  isPinned?: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let whereClause: Prisma.ProductWhereInput = {};
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

    type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

    const formattedProducts = products.map((p: ProductWithCategory) => ({
      ...p,
      category: p.category?.name || null
    }));

    return NextResponse.json(formattedProducts);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data: CreateProductRequestBody = await request.json();
    let categoryConnect: Prisma.CategoryCreateNestedOneWithoutProductsInput | undefined = undefined;
    if (data.category && data.category.trim() !== '') {
      const categoryName = data.category.trim();
      categoryConnect = {
        connectOrCreate: {
          where: { name: categoryName },
          create: { name: categoryName }
        }
      };
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        barcode: data.barcode || null,
        category: categoryConnect,
        cost: typeof data.cost === 'number' ? data.cost : (parseFloat(data.cost || '0') || 0),
        price: typeof data.price === 'number' ? data.price : (parseFloat(data.price || '0') || 0),
        stock: typeof data.stock === 'number' ? Math.floor(data.stock) : (parseInt(data.stock || '0') || 0),
        minStock: typeof data.minStock === 'number' ? Math.floor(data.minStock) : (parseInt(data.minStock || '10') || 10),
        isPinned: Boolean(data.isPinned),
      }
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
