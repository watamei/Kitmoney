export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    let categoryConnect: any = undefined;
    if (data.category && data.category.trim() !== '') {
      categoryConnect = {
        connectOrCreate: {
          where: { name: data.category.trim() },
          create: { name: data.category.trim() }
        }
      };
    }

    const updateData: any = {
      name: data.name,
      barcode: data.barcode || null,
      cost: parseFloat(data.cost) || 0,
      price: parseFloat(data.price) || 0,
      stock: parseInt(data.stock) || 0,
      minStock: parseInt(data.minStock) || 10,
      isPinned: data.isPinned !== undefined ? Boolean(data.isPinned) : undefined,
    };

    if (categoryConnect) {
      updateData.category = categoryConnect;
    } else if (data.category === '') {
      updateData.categoryId = null;
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
