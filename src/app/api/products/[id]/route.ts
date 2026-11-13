export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface UpdateProductRequestBody {
  name?: string;
  barcode?: string | null;
  category?: string;
  cost?: string | number;
  price?: string | number;
  stock?: string | number;
  minStock?: string | number;
  isPinned?: boolean;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data: UpdateProductRequestBody = await request.json();

    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.barcode !== undefined) {
      updateData.barcode = data.barcode || null;
    }
    if (data.cost !== undefined) {
      updateData.cost = typeof data.cost === 'number' ? data.cost : (parseFloat(data.cost) || 0);
    }
    if (data.price !== undefined) {
      updateData.price = typeof data.price === 'number' ? data.price : (parseFloat(data.price) || 0);
    }
    if (data.stock !== undefined) {
      updateData.stock = typeof data.stock === 'number' ? Math.floor(data.stock) : (parseInt(data.stock) || 0);
    }
    if (data.minStock !== undefined) {
      updateData.minStock = typeof data.minStock === 'number' ? Math.floor(data.minStock) : (parseInt(data.minStock) || 10);
    }
    if (data.isPinned !== undefined) {
      updateData.isPinned = Boolean(data.isPinned);
    }

    if (data.category && data.category.trim() !== '') {
      const categoryName = data.category.trim();
      updateData.category = {
        connectOrCreate: {
          where: { name: categoryName },
          create: { name: categoryName },
        },
      };
    } else if (data.category === '') {
      updateData.category = {
        disconnect: true,
      };
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id: parseInt(id, 10) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
