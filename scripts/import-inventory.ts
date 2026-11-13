import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';
import prisma from '../src/lib/prisma';
import { Prisma } from '@prisma/client';

interface ConvertedProduct {
  excelRow: number;
  barcode: string | null;
  name: string;
  unit?: string | null;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  categoryName: string;
  action?: 'create' | 'update';
}

interface RowError {
  excelRow: number;
  name?: string;
  barcode?: string | null;
  reason: string;
}

interface RowWarning {
  excelRow: number;
  name: string;
  barcode?: string | null;
  reason: string;
}

interface OnlyInSheet4Item {
  excelRow: number;
  name: string;
  unit?: string | null;
  cost?: number | null;
  price?: number | null;
}

interface ImportReport {
  timestamp: string;
  mode: 'dry-run' | 'commit';
  mockDataToDelete: {
    product: number;
    sale: number;
    saleItem: number;
    restock: number;
    restockItem: number;
    expense: number;
    total: number;
  };
  summary: {
    totalExcelRowsScanned: number;
    validProducts: number;
    toCreate: number;
    toUpdate: number;
    skippedEmptyName: number;
    errorsCount: number;
    warningsCount: number;
    onlyInSheet4Count: number;
  };
  errors: RowError[];
  warnings: RowWarning[];
  onlyInSheet4: OnlyInSheet4Item[];
  sampleFirst10: ConvertedProduct[];
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function isValidEan13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[12], 10);
}

function parseBarcodeCell(cell: XLSX.CellObject | undefined): string | null {
  if (!cell || cell.v === undefined || cell.v === null) return null;
  let str = '';
  // Check formatted text first
  if (typeof cell.w === 'string' && cell.w.trim() !== '' && !cell.w.includes('E+') && !cell.w.includes('e+')) {
    str = cell.w.trim();
  } else if (typeof cell.v === 'number') {
    // Prevent scientific notation and retain integer string
    str = BigInt(Math.round(cell.v)).toString();
  } else {
    str = String(cell.v).trim();
  }
  return str === '' ? null : str;
}

function parseNumber(value: unknown, fieldName: string, excelRow: number): { val: number; error?: string } {
  if (value === undefined || value === null || value === '') {
    return { val: 0 };
  }
  const str = String(value).replace(/,/g, '').trim();
  if (str === '') return { val: 0 };
  const num = Number(str);
  if (isNaN(num)) {
    return { val: 0, error: `แถวที่ ${excelRow}: ${fieldName} ไม่ใช่ตัวเลข ('${value}')` };
  }
  if (num < 0) {
    return { val: 0, error: `แถวที่ ${excelRow}: ${fieldName} มีค่าติดลบ (${num})` };
  }
  return { val: num };
}

async function main() {
  const args = process.argv.slice(2);
  const isCommit = args.includes('--commit');
  const clampNegativeStock = args.includes('--clamp-negative-stock');
  const mode = isCommit ? 'commit' : 'dry-run';

  console.log(`\n======================================================`);
  console.log(`📦 Kitmoney Inventory Import from Excel [${mode.toUpperCase()}]`);
  if (clampNegativeStock) {
    console.log(`⚙️  ตัวเลือกเพิ่มเติม: ปรับสต็อกติดลบให้เป็น 0 (--clamp-negative-stock)`);
  }
  console.log(`======================================================\n`);

  const excelFilePath = path.resolve(process.cwd(), 'โปรแกรมขายยาV1 (1).xlsm');
  if (!fs.existsSync(excelFilePath)) {
    console.error(`❌ ไม่พบไฟล์ Excel: ${excelFilePath}`);
    process.exit(1);
  }

  // 1. Check Mock Data in DB to be deleted
  console.log('🔍 ตรวจสอบข้อมูล Mock ในฐานข้อมูลที่จะถูกลบ...');
  const [productCount, saleCount, saleItemCount, restockCount, restockItemCount, expenseCount] = await Promise.all([
    prisma.product.count(),
    prisma.sale.count(),
    prisma.saleItem.count(),
    prisma.restock.count(),
    prisma.restockItem.count(),
    prisma.expense.count(),
  ]);

  const mockDataToDelete = {
    product: productCount,
    sale: saleCount,
    saleItem: saleItemCount,
    restock: restockCount,
    restockItem: restockItemCount,
    expense: expenseCount,
    total: productCount + saleCount + saleItemCount + restockCount + restockItemCount + expenseCount,
  };

  console.log(`  - Product:     ${productCount} รายการ`);
  console.log(`  - SaleItem:    ${saleItemCount} รายการ`);
  console.log(`  - Sale:        ${saleCount} รายการ`);
  console.log(`  - RestockItem: ${restockItemCount} รายการ`);
  console.log(`  - Restock:     ${restockCount} รายการ`);
  console.log(`  - Expense:     ${expenseCount} รายการ`);
  console.log(`  * รวมข้อมูล mock ที่จะลบ: ${mockDataToDelete.total} รายการ (User และ Category ไม่ถูกลบ)\n`);

  // 2. Read Excel file
  console.log(`📖 กำลังอ่านข้อมูลจากไฟล์ Excel: ${path.basename(excelFilePath)}...`);
  const wb = XLSX.readFile(excelFilePath, { cellFormula: false, cellHTML: false, cellText: false });

  // 3. Process Supplementary Sheet: Sheet4
  console.log('📑 กำลังประมวลผลข้อมูลเสริมจากชีต Sheet4...');
  const sheet4 = wb.Sheets['Sheet4'];
  const sheet4Map = new Map<string, { unit?: string | null; cost?: number; price?: number; excelRow: number }>();
  const allSheet4Items: Array<{ name: string; unit?: string | null; cost?: number; price?: number; excelRow: number }> = [];

  if (sheet4) {
    const s4Rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet4, { header: 1 });
    // Row 1 is header: ['Name', 'Unit', 'Cost', 'Price', 'min', 'max']
    for (let r = 1; r < s4Rows.length; r++) {
      const row = s4Rows[r] as unknown as unknown[];
      if (!row || !row[0]) continue;
      const rawName = String(row[0]).trim();
      if (!rawName) continue;
      const norm = normalizeName(rawName);
      const unit = row[1] ? String(row[1]).trim() : null;
      const cost = row[2] !== undefined ? Number(row[2]) : undefined;
      const price = row[3] !== undefined ? Number(row[3]) : undefined;
      const item = { name: rawName, unit, cost, price, excelRow: r + 1 };
      allSheet4Items.push(item);
      if (!sheet4Map.has(norm)) {
        sheet4Map.set(norm, item);
      }
    }
    console.log(`  - พบสินค้าใน Sheet4 ทั้งหมด: ${allSheet4Items.length} รายการ`);
  }

  // 4. Process Primary Sheet: Inventory
  console.log('📋 กำลังประมวลผลข้อมูลหลักจากชีต Inventory...');
  const invSheet = wb.Sheets['Inventory'];
  if (!invSheet) {
    console.error('❌ ไม่พบชีต Inventory ในไฟล์ Excel');
    process.exit(1);
  }

  const errors: RowError[] = [];
  const warnings: RowWarning[] = [];
  const validProducts: ConvertedProduct[] = [];
  const seenBarcodes = new Map<string, number>(); // barcode -> excelRow
  const inventoryNormalizedNames = new Set<string>();

  // Determine row range from invSheet['!ref']
  const range = XLSX.utils.decode_range(invSheet['!ref'] || 'A1:U1736');
  let scannedRows = 0;
  let skippedEmptyName = 0;

  // Header is at row index 3 (Excel row 4), data starts at row index 4 (Excel row 5)
  for (let r = 4; r <= range.e.r; r++) {
    const excelRow = r + 1;
    scannedRows++;

    const cellB = invSheet[XLSX.utils.encode_cell({ r, c: 1 })]; // Barcode
    const cellC = invSheet[XLSX.utils.encode_cell({ r, c: 2 })]; // Name
    const cellD = invSheet[XLSX.utils.encode_cell({ r, c: 3 })]; // Unit
    const cellE = invSheet[XLSX.utils.encode_cell({ r, c: 4 })]; // Price
    const cellI = invSheet[XLSX.utils.encode_cell({ r, c: 8 })]; // Balance -> stock
    const cellK = invSheet[XLSX.utils.encode_cell({ r, c: 10 })]; // Min stock -> minStock
    const cellM = invSheet[XLSX.utils.encode_cell({ r, c: 12 })]; // Cost

    // 2. Trim name & skip if empty
    const rawName = cellC?.v !== undefined && cellC?.v !== null ? String(cellC.v).trim() : '';
    if (!rawName) {
      skippedEmptyName++;
      continue;
    }

    // 1. Barcode parsing & validation
    const barcode = parseBarcodeCell(cellB);
    if (barcode) {
      // Check duplicate in file
      if (seenBarcodes.has(barcode)) {
        const firstRow = seenBarcodes.get(barcode)!;
        warnings.push({
          excelRow,
          name: rawName,
          barcode,
          reason: `บาร์โค้ด '${barcode}' ซ้ำกับแถวที่ ${firstRow} (ข้ามแถวที่ ${excelRow})`
        });
        continue; // Rule 5: use first row
      }
      seenBarcodes.set(barcode, excelRow);

      // Check EAN-13 checksum
      if (/^\d{13}$/.test(barcode) && !isValidEan13(barcode)) {
        warnings.push({
          excelRow,
          name: rawName,
          barcode,
          reason: `EAN-13 Checksum ไม่ถูกต้องสำหรับบาร์โค้ด '${barcode}' (ยังนำเข้าตามกฎ)`
        });
      }
    }

    // 3. Price, cost, stock, minStock parsing
    const pRes = parseNumber(cellE?.v, 'Price (ราคาขาย)', excelRow);
    const cRes = parseNumber(cellM?.v, 'Cost (ต้นทุน)', excelRow);
    let sRes = parseNumber(cellI?.v, 'Balance (สต็อกคงเหลือ)', excelRow);
    let mRes = parseNumber(cellK?.v, 'Min stock (สต็อกขั้นต่ำ)', excelRow);

    if (clampNegativeStock) {
      if (sRes.error && sRes.error.includes('มีค่าติดลบ')) {
        warnings.push({
          excelRow,
          name: rawName,
          barcode,
          reason: `สต็อกติดลบ (${cellI?.v}) ถูกปรับเป็น 0`
        });
        sRes = { val: 0 };
      }
      if (mRes.error && mRes.error.includes('มีค่าติดลบ')) {
        warnings.push({
          excelRow,
          name: rawName,
          barcode,
          reason: `สต็อกขั้นต่ำติดลบ (${cellK?.v}) ถูกปรับเป็น 0`
        });
        mRes = { val: 0 };
      }
    }

    const rowErrors = [pRes.error, cRes.error, sRes.error, mRes.error].filter(Boolean);
    if (rowErrors.length > 0) {
      errors.push({
        excelRow,
        name: rawName,
        barcode,
        reason: rowErrors.join('; ')
      });
      continue; // Rule 3: skip on error
    }

    const price = pRes.val;
    const cost = cRes.val;
    const stock = Math.floor(sRes.val);
    const minStock = Math.floor(mRes.val);

    // 4. Warning: cost > price
    if (cost > price) {
      warnings.push({
        excelRow,
        name: rawName,
        barcode,
        reason: `ต้นทุน (${cost}) สูงกว่าราคาขาย (${price})`
      });
    }

    // Supplementary match from Sheet4 for unit
    const normName = normalizeName(rawName);
    inventoryNormalizedNames.add(normName);
    let unit = cellD?.v !== undefined && cellD?.v !== null ? String(cellD.v).trim() : null;
    if (!unit && sheet4Map.has(normName)) {
      unit = sheet4Map.get(normName)?.unit || null;
    }

    validProducts.push({
      excelRow,
      barcode,
      name: rawName,
      unit,
      cost,
      price,
      stock,
      minStock,
      categoryName: 'ยาทั่วไป',
    });
  }

  // 5. Items present only in Sheet4
  const onlyInSheet4: OnlyInSheet4Item[] = [];
  for (const item of allSheet4Items) {
    const norm = normalizeName(item.name);
    if (!inventoryNormalizedNames.has(norm)) {
      onlyInSheet4.push({
        excelRow: item.excelRow,
        name: item.name,
        unit: item.unit,
        cost: item.cost,
        price: item.price,
      });
    }
  }

  // 6. Check existing products in DB to determine create vs update
  const existingProducts = await prisma.product.findMany({
    select: { id: true, barcode: true, name: true }
  });
  const existingByBarcode = new Map<string, number>();
  const existingByName = new Map<string, number>();
  for (const ep of existingProducts) {
    if (ep.barcode) existingByBarcode.set(ep.barcode, ep.id);
    existingByName.set(normalizeName(ep.name), ep.id);
  }

  let toCreateCount = 0;
  let toUpdateCount = 0;
  for (const prod of validProducts) {
    let exists = false;
    if (prod.barcode && existingByBarcode.has(prod.barcode)) {
      exists = true;
    } else if (existingByName.has(normalizeName(prod.name))) {
      exists = true;
    }
    prod.action = exists ? 'update' : 'create';
    if (exists) toUpdateCount++;
    else toCreateCount++;
  }

  const report: ImportReport = {
    timestamp: new Date().toISOString(),
    mode,
    mockDataToDelete,
    summary: {
      totalExcelRowsScanned: scannedRows,
      validProducts: validProducts.length,
      toCreate: toCreateCount,
      toUpdate: toUpdateCount,
      skippedEmptyName,
      errorsCount: errors.length,
      warningsCount: warnings.length,
      onlyInSheet4Count: onlyInSheet4.length,
    },
    errors,
    warnings,
    onlyInSheet4,
    sampleFirst10: validProducts.slice(0, 10),
  };

  // 7. Write report to scripts/import-report.json
  const reportPath = path.resolve(process.cwd(), 'scripts/import-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`📝 บันทึกรายงานการตรวจสอบลงไฟล์: ${reportPath}\n`);

  // 8. Print Summary
  console.log(`------------------------------------------------------`);
  console.log(`📊 สรุปผลการตรวจสอบข้อมูล (Dry-run Summary):`);
  console.log(`------------------------------------------------------`);
  console.log(`• จำนวนแถวทั้งหมดในชีต Inventory ที่ตรวจสอบ: ${scannedRows.toLocaleString()} แถว`);
  console.log(`• ข้ามแถวที่ไม่มีชื่อสินค้า:               ${skippedEmptyName.toLocaleString()} แถว`);
  console.log(`• แถวที่มี Error (ถูกข้าม):               ${errors.length.toLocaleString()} แถว`);
  console.log(`• คำเตือน (Warnings - ยังนำเข้า):          ${warnings.length.toLocaleString()} รายการ`);
  console.log(`• สินค้าที่ผ่านเกณฑ์พร้อมนำเข้า:           ${validProducts.length.toLocaleString()} รายการ`);
  console.log(`    - สร้างรายการใหม่ (Create):            ${toCreateCount.toLocaleString()} รายการ`);
  console.log(`    - อัปเดตรายการเดิม (Update):          ${toUpdateCount.toLocaleString()} รายการ`);
  console.log(`• รายการที่มีเฉพาะใน Sheet4 (แยกรายงานไว้):  ${onlyInSheet4.length.toLocaleString()} รายการ\n`);

  // 9. If Commit Mode: Execute Database Operations
  if (isCommit) {
    console.log(`⚡ กำลังดำเนินการบันทึกข้อมูลเข้าฐานข้อมูลจริงภายใน Transaction เดียว...`);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Step A: Ensure default category "ยาทั่วไป" exists
      const defaultCategory = await tx.category.upsert({
        where: { name: 'ยาทั่วไป' },
        create: { name: 'ยาทั่วไป' },
        update: {},
      });

      // Step B: Delete Mock Data if requested
      console.log('  1. กำลังลบข้อมูล mock เก่า...');
      await tx.saleItem.deleteMany();
      await tx.sale.deleteMany();
      await tx.restockItem.deleteMany();
      await tx.restock.deleteMany();
      await tx.expense.deleteMany();
      await tx.product.deleteMany();
      console.log('  2. ลบข้อมูล mock เก่าเรียบร้อยแล้ว');

      // Step C: Insert / Upsert valid products
      console.log(`  3. กำลังนำเข้าสินค้า ${validProducts.length.toLocaleString()} รายการ...`);
      for (const p of validProducts) {
        if (p.barcode) {
          await tx.product.upsert({
            where: { barcode: p.barcode },
            create: {
              barcode: p.barcode,
              name: p.name,
              price: p.price,
              cost: p.cost,
              stock: p.stock,
              minStock: p.minStock,
              categoryId: defaultCategory.id,
            },
            update: {
              name: p.name,
              price: p.price,
              cost: p.cost,
              stock: p.stock,
              minStock: p.minStock,
            },
          });
        } else {
          // If no barcode, find by name
          const existing = await tx.product.findFirst({
            where: { name: p.name },
          });

          if (existing) {
            await tx.product.update({
              where: { id: existing.id },
              data: {
                price: p.price,
                cost: p.cost,
                stock: p.stock,
                minStock: p.minStock,
              },
            });
          } else {
            await tx.product.create({
              data: {
                barcode: null,
                name: p.name,
                price: p.price,
                cost: p.cost,
                stock: p.stock,
                minStock: p.minStock,
                categoryId: defaultCategory.id,
              },
            });
          }
        }
      }
      console.log('  4. นำเข้าข้อมูลสินค้าทั้งหมดสำเร็จเรียบร้อย!');
    }, {
      timeout: 120000, // 2 minutes timeout for large batch
    });

    console.log(`\n🎉 การนำเข้าเสร็จสมบูรณ์เรียบร้อยแล้ว!`);
  } else {
    console.log(`💡 ขณะนี้รันอยู่ในโหมด DRY-RUN (ยังไม่มีการเปลี่ยนแปลงฐานข้อมูลจริง)`);
    console.log(`   หากต้องการนำเข้าจริง ให้รันด้วยคำสั่ง: npx tsx scripts/import-inventory.ts --commit\n`);
  }

  // Print first 10 converted items
  console.log(`------------------------------------------------------`);
  console.log(`🔍 ตัวอย่าง 10 แถวแรกหลังแปลงข้อมูล (First 10 Converted):`);
  console.log(`------------------------------------------------------`);
  validProducts.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}. [แถว ${item.excelRow}] ${item.name}`);
    console.log(`   บาร์โค้ด: ${item.barcode || '(ไม่มี)'} | ราคา: ฿${item.price} | ต้นทุน: ฿${item.cost} | สต็อก: ${item.stock} | สต็อกขั้นต่ำ: ${item.minStock} | หมวด: ${item.categoryName}`);
  });
  console.log(`------------------------------------------------------\n`);
}

main().catch(err => {
  console.error('\n❌ Fatal error during execution:', err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
