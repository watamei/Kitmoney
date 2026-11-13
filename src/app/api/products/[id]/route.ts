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
    const productId = parseInt(id, 10);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: 'รหัสสินค้าไม่ถูกต้อง (Invalid product ID)' }, { status: 400 });
    }

    const data: UpdateProductRequestBody = await request.json();
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === '') {
        return NextResponse.json({ error: 'กรุณาระบุชื่อสินค้า (Product name is required)' }, { status: 400 });
      }
      updateData.name = data.name.trim();
    }

    if (data.barcode !== undefined) {
      updateData.barcode = data.barcode && data.barcode.trim() !== '' ? data.barcode.trim() : null;
    }

    if (data.cost !== undefined) {
      const parsedCost = typeof data.cost === 'number' ? data.cost : parseFloat(String(data.cost));
      updateData.cost = Number.isFinite(parsedCost) ? Math.max(0, parsedCost) : 0;
    }

    if (data.price !== undefined) {
      const parsedPrice = typeof data.price === 'number' ? data.price : parseFloat(String(data.price));
      updateData.price = Number.isFinite(parsedPrice) ? Math.max(0, parsedPrice) : 0;
    }

    if (data.stock !== undefined) {
      const parsedStock = typeof data.stock === 'number' ? Math.floor(data.stock) : parseInt(String(data.stock), 10);
      updateData.stock = Number.isFinite(parsedStock) ? Math.max(0, parsedStock) : 0;
    }

    if (data.minStock !== undefined) {
      const parsedMinStock = typeof data.minStock === 'number' ? Math.floor(data.minStock) : parseInt(String(data.minStock), 10);
      updateData.minStock = Number.isFinite(parsedMinStock) ? Math.max(0, parsedMinStock) : 10;
    }

    if (data.isPinned !== undefined) {
      updateData.isPinned = Boolean(data.isPinned);
    }

    if (data.category !== undefined) {
      if (data.category && data.category.trim() !== '') {
        const categoryName = data.category.trim();
        updateData.category = {
          connectOrCreate: {
            where: { name: categoryName },
            create: { name: categoryName },
          },
        };
      } else {
        updateData.category = {
          disconnect: true,
        };
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Failed to update product:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'บาร์โค้ดนี้มีอยู่ในระบบแล้ว (Barcode already exists)' }, { status: 409 });
    }
    return NextResponse.json({ error: 'อัปเดตสินค้าไม่สำเร็จ: ' + (error?.message || 'Database error') }, { status: 500 });
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
