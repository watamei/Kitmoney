export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface UpdateCategoryBody {
  name?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'รหัสหมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
    }

    const data: UpdateCategoryBody = await request.json();
    const name = data.name?.toString().trim();

    if (!name) {
      return NextResponse.json({ error: 'ชื่อหมวดหมู่ต้องไม่เป็นค่าว่าง' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name },
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'มีชื่อหมวดหมู่นี้อยู่แล้ว' }, { status: 409 });
      }
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'ไม่พบหมวดหมู่นี้ในระบบ' }, { status: 404 });
      }
    }
    console.error('Failed to update category:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId)) {
      return NextResponse.json({ error: 'รหัสหมวดหมู่ไม่ถูกต้อง' }, { status: 400 });
    }

    // Check if category has existing products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบได้ เนื่องจากยังมีสินค้าในหมวดหมู่นี้' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'ไม่พบหมวดหมู่นี้ในระบบ' }, { status: 404 });
    }
    console.error('Failed to delete category:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' }, { status: 500 });
  }
}
