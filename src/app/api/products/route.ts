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

    if (!data.name || data.name.trim() === '') {
      return NextResponse.json({ error: 'กรุณาระบุชื่อสินค้า (Product name is required)' }, { status: 400 });
    }

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

    const costNum = typeof data.cost === 'number' ? data.cost : parseFloat(String(data.cost || '0'));
    const priceNum = typeof data.price === 'number' ? data.price : parseFloat(String(data.price || '0'));
    const stockNum = typeof data.stock === 'number' ? Math.floor(data.stock) : parseInt(String(data.stock || '0'), 10);
    const minStockNum = typeof data.minStock === 'number' ? Math.floor(data.minStock) : parseInt(String(data.minStock ?? '10'), 10);

    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        barcode: data.barcode && data.barcode.trim() !== '' ? data.barcode.trim() : null,
        category: categoryConnect,
        cost: Number.isFinite(costNum) ? Math.max(0, costNum) : 0,
        price: Number.isFinite(priceNum) ? Math.max(0, priceNum) : 0,
        stock: Number.isFinite(stockNum) ? Math.max(0, stockNum) : 0,
        minStock: Number.isFinite(minStockNum) ? Math.max(0, minStockNum) : 10,
        isPinned: Boolean(data.isPinned),
      }
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create product:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'บาร์โค้ดนี้มีอยู่ในระบบแล้ว (Barcode already exists)' }, { status: 409 });
    }
    return NextResponse.json({ error: 'บันทึกสินค้าไม่สำเร็จ: ' + (error?.message || 'Database error') }, { status: 500 });
  }
}
