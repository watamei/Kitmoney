export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface RawProductImportItem {
  barcode?: string | number | null;
  name?: string | null;
  category?: string | null;
  cost?: string | number | null;
  price?: string | number | null;
  stock?: string | number | null;
  minStock?: string | number | null;
  isPinned?: boolean | string | number | null;
}

interface ValidProductItem {
  name: string;
  barcode: string | null;
  categoryName: string | null;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  isPinned: boolean;
}

interface ImportError {
  row: number;
  name?: string;
  barcode?: string;
  error: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawItems: RawProductImportItem[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.items)
      ? body.items
      : [];

    if (rawItems.length === 0) {
      return NextResponse.json({
        successCount: 0,
        errorCount: 0,
        errors: [{ row: 0, error: 'ไม่มีข้อมูลรายการสินค้าสำหรับการนำเข้า' }]
      }, { status: 400 });
    }

    const errors: ImportError[] = [];
    const validItems: ValidProductItem[] = [];
    const seenBarcodesInBatch = new Set<string>();

    // 1. Gather all non-empty barcodes to check duplicates against DB
    const candidateBarcodes = rawItems
      .map(item => item.barcode?.toString().trim())
      .filter((b): b is string => Boolean(b));

    const existingDbProducts = candidateBarcodes.length > 0
      ? await prisma.product.findMany({
          where: { barcode: { in: candidateBarcodes } },
          select: { barcode: true }
        })
      : [];
    const existingDbBarcodes = new Set(existingDbProducts.map(p => p.barcode).filter(Boolean));

    // 2. Validate each row
    for (let index = 0; index < rawItems.length; index++) {
      const raw = rawItems[index];
      const rowNum = index + 1;
      const rawName = raw.name?.toString().trim();
      const rawBarcode = raw.barcode ? raw.barcode.toString().trim() : null;

      // Validate name
      if (!rawName) {
        errors.push({
          row: rowNum,
          barcode: rawBarcode || undefined,
          error: 'ชื่อสินค้าต้องไม่เป็นค่าว่าง'
        });
        continue;
      }

      // Validate barcode
      if (rawBarcode) {
        if (seenBarcodesInBatch.has(rawBarcode)) {
          errors.push({
            row: rowNum,
            name: rawName,
            barcode: rawBarcode,
            error: `บาร์โค้ดซ้ำกับรายการอื่นในไฟล์: ${rawBarcode}`
          });
          continue;
        }
        if (existingDbBarcodes.has(rawBarcode)) {
          errors.push({
            row: rowNum,
            name: rawName,
            barcode: rawBarcode,
            error: `บาร์โค้ดนี้มีอยู่ในระบบแล้ว: ${rawBarcode}`
          });
          continue;
        }
        seenBarcodesInBatch.add(rawBarcode);
      }

      // Validate cost
      const parsedCost = raw.cost !== undefined && raw.cost !== null && raw.cost !== ''
        ? (typeof raw.cost === 'number' ? raw.cost : parseFloat(raw.cost.toString()))
        : 0;
      if (isNaN(parsedCost) || parsedCost < 0) {
        errors.push({
          row: rowNum,
          name: rawName,
          error: 'ต้นทุนต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0'
        });
        continue;
      }

      // Validate price
      const parsedPrice = raw.price !== undefined && raw.price !== null && raw.price !== ''
        ? (typeof raw.price === 'number' ? raw.price : parseFloat(raw.price.toString()))
        : 0;
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        errors.push({
          row: rowNum,
          name: rawName,
          error: 'ราคาขายต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0'
        });
        continue;
      }

      // Validate stock
      const parsedStock = raw.stock !== undefined && raw.stock !== null && raw.stock !== ''
        ? (typeof raw.stock === 'number' ? Math.floor(raw.stock) : parseInt(raw.stock.toString(), 10))
        : 0;
      if (isNaN(parsedStock) || parsedStock < 0) {
        errors.push({
          row: rowNum,
          name: rawName,
          error: 'จำนวนสต็อกต้องเป็นตัวเลขจำนวนเต็มที่มากกว่าหรือเท่ากับ 0'
        });
        continue;
      }

      // Validate minStock
      const parsedMinStock = raw.minStock !== undefined && raw.minStock !== null && raw.minStock !== ''
        ? (typeof raw.minStock === 'number' ? Math.floor(raw.minStock) : parseInt(raw.minStock.toString(), 10))
        : 10;
      if (isNaN(parsedMinStock) || parsedMinStock < 0) {
        errors.push({
          row: rowNum,
          name: rawName,
          error: 'สต็อกขั้นต่ำต้องเป็นตัวเลขจำนวนเต็มที่มากกว่าหรือเท่ากับ 0'
        });
        continue;
      }

      const categoryName = raw.category?.toString().trim() || null;
      const isPinned = Boolean(raw.isPinned === true || raw.isPinned === 'true' || raw.isPinned === 1);

      validItems.push({
        name: rawName,
        barcode: rawBarcode || null,
        categoryName,
        cost: parsedCost,
        price: parsedPrice,
        stock: parsedStock,
        minStock: parsedMinStock,
        isPinned,
      });
    }

    // 3. Execute bulk insert inside a transaction
    if (validItems.length > 0) {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const item of validItems) {
          await tx.product.create({
            data: {
              name: item.name,
              barcode: item.barcode,
              category: item.categoryName ? {
                connectOrCreate: {
                  where: { name: item.categoryName },
                  create: { name: item.categoryName }
                }
              } : undefined,
              cost: item.cost,
              price: item.price,
              stock: item.stock,
              minStock: item.minStock,
              isPinned: item.isPinned,
            }
          });
        }
      });
    }

    return NextResponse.json({
      successCount: validItems.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Failed to import products bulk:', error);
    return NextResponse.json({
      error: 'เกิดข้อผิดพลาดในการนำเข้าสินค้าแบบกลุ่ม'
    }, { status: 500 });
  }
}
