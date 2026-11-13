'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type Language = 'th' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Sidebar
    'kitmoney': 'KidYa',
    'premium_pos': 'Premium POS',
    'pos': 'POS',
    'inventory': 'Inventory',
    'categories': 'Categories',
    'reports': 'Reports',
    'sales_history': 'Sales History',
    
    // Reports
    'reports_dashboard': 'Reports Dashboard',
    'today': 'Today',
    'this_month': 'This Month',
    'this_year': 'This Year',
    'last_7_days': 'Last 7 Days',
    'last_30_days': 'Last 30 Days',
    'custom_range': 'Custom Range',
    'to': 'to',
    'data_date': 'Data as of:',
    'total_revenue': 'Total Revenue',
    'total_cost': 'Total Cost (COGS)',
    'other_expenses': 'Other Expenses',
    'net_profit': 'Net Profit',
    'restock_investment': 'Restock Investment',
    'net_cash_flow': 'Net Cash Flow',
    'from_transactions': 'From {count} sales',
    'graph_overview': 'Graph Overview',
    'loading_dashboard': 'Loading Dashboard...',
    'formula': 'Accounting: Net Profit = Revenue - COGS - Expenses | Cash Flow = Revenue - Restock - Expenses',

    // POS
    'products': 'Products',
    'search_products': 'Search products...',
    'search_or_scan_placeholder': 'Scan barcode or search medicine name...',
    'scan_barcode_box': 'Scan Barcode (Auto-fixes Thai keyboard)...',
    'search_product_box': 'Search medicine name...',
    'pin_action': 'Star as Best Seller',
    'unpin_action': 'Remove Star',
    'all_items': 'All Items',
    'pinned_items': 'Pinned / Quick Items',
    'showing_pos_items': 'Showing {start} - {end} of {total} products',
    'page_info': 'Page {current} of {total}',
    'prev_page': 'Prev',
    'next_page': 'Next',
    'no_search_results': 'No matching products found.',
    'exact_amount': 'Exact',
    'transfer_prompt': 'Please transfer or scan QR code, then confirm payment.',
    'processing_payment': 'Processing...',
    'all_categories': 'All Categories',
    'current_order': 'Current Order',
    'clear': 'Clear',
    'empty_cart': 'Cart is empty. Add products to start selling.',
    'subtotal': 'Subtotal',
    'discount': 'Discount',
    'total': 'Total',
    'checkout': 'Checkout',
    'payment': 'Payment',
    'cash': 'Cash',
    'transfer': 'Transfer',
    'amount_received': 'Amount Received',
    'change': 'Change',
    'confirm_payment': 'Confirm Payment',
    'cancel': 'Cancel',
    'sales_completed': 'Sale Completed!',
    'receipt_prompt': 'Do you want to print a receipt?',
    'print_receipt': 'Print Receipt',
    'close': 'Close',
    'out_of_stock': 'Out of stock!',
    'product_not_found': 'Product not found!',
    'max_stock_reached': 'Cannot add more than available stock!',

    // Inventory
    'import_excel': 'Import Excel',
    'add_product': 'Add Product',
    'total_products': 'Total Products',
    'low_stock': 'Low Stock',
    'out_of_stock_item': 'Out of Stock',
    'search_inventory': 'Search by name or barcode...',
    'all_stock_status': 'All Stock Status',
    'barcode': 'Barcode',
    'name': 'Name',
    'category': 'Category',
    'cost': 'Cost',
    'price': 'Price',
    'stock': 'Stock',
    'actions': 'Actions',
    'print_barcode': 'Print Barcode',
    'edit': 'Edit',
    'delete': 'Delete',
    'no_products': 'No products found. Add some to get started!',
    'showing_entries': 'Showing {start} to {end} of {total} entries',
    'print_sticker': 'Print Sticker',
    'no_barcode_avail': 'No Barcode Available',
    'save_png': 'Save PNG',
    'print_now': 'Print Now',
    'edit_product': 'Edit Product',
    'save_product': 'Save Product',
    'generate': 'Generate',
    'min_stock_alert': 'Min. Stock Alert',
    'scan_or_enter': 'Scan or enter barcode',
    'loading_inventory': 'Loading Inventory...',

    // Categories
    'add_category': 'Add Category',
    'existing_categories': 'Existing Categories',
    'enter_category_name': 'Enter Category Name',
    'no_categories': 'No categories found. Add one above!',
    
    // Restock
    'restock': 'Restock',
    'restock_history': 'Restock History',
    'restock_items': 'Restock Items',
    'restock_confirm': 'Confirm Restock',
    'add_to_restock': 'Add to Restock',
    'supplier': 'Supplier (Optional)',
    'investment_cost': 'Investment Cost',
    'unit_cost': 'Unit Cost',
    'qty_received': 'Qty Received',
    'restock_completed': 'Restock Completed!',
    
    // History
    'transaction_details': 'Transaction Details',
    'date': 'Date',
    'time': 'Time',
    'receipt_no': 'Receipt No',
    'payment_method': 'Payment Method',
    'total_amount': 'Total Amount',
    'items_purchased': 'Items Purchased',
    'no_history': 'No sales history found.',
    'view_details': 'View Details',
    
    // Global
    'loading': 'Loading...',
    'scan_barcode_placeholder': 'Scan Barcode here...',
    'scanner': 'Scanner',
    'pin_product': 'Pin this product (Show at top of POS)',
    'import_successful': 'Import successful!',
    'import_failed': 'Failed to import Excel file.',
    'amount_less_than_total': 'Amount received is less than total amount!',
    'checkout_failed': 'Checkout failed!',
    'checkout_error': 'Checkout error. Please try again.',
    'confirm_delete_product': 'Are you sure you want to delete this product?',
    'delete_product_failed': 'Failed to delete product',
    'save_product_failed': 'Failed to save product',
    'confirm_delete_category': 'Are you sure you want to delete this category?',
    'delete_category_failed': 'Failed to delete category',
    'update_category_failed': 'Failed to update category',
    'add_category_failed': 'Failed to add category',
    'failed_to_save_png': 'Failed to save PNG',
    'failed_to_restock': 'Failed to restock',
    'receipt': 'Receipt',
    'thank_you': 'Thank you!',
    'save': 'Save',
    'barcode_preview': 'Barcode Preview',
    'price_label': 'Price:',
  },
  th: {
    // Sidebar
    'kitmoney': 'KidYa',
    'premium_pos': 'ระบบพรีเมียม',
    'pos': 'ขายหน้าร้าน (POS)',
    'inventory': 'คลังสินค้า',
    'categories': 'หมวดหมู่',
    'reports': 'รายงานสรุป',
    'sales_history': 'ประวัติการขาย',
    
    // Reports
    'reports_dashboard': 'Reports Dashboard',
    'today': 'วันนี้',
    'this_month': 'เดือนนี้',
    'this_year': 'ปีนี้',
    'last_7_days': '7 วันย้อนหลัง',
    'last_30_days': '30 วันย้อนหลัง',
    'custom_range': 'เลือกช่วงเวลา',
    'to': 'ถึง',
    'data_date': 'ข้อมูลวันที่:',
    'total_revenue': 'รายรับรวม',
    'total_cost': 'ต้นทุนรวม (COGS)',
    'other_expenses': 'ค่าใช้จ่ายอื่นๆ',
    'net_profit': 'กำไรสุทธิ',
    'restock_investment': 'เงินลงทุนเติมของ',
    'net_cash_flow': 'กระแสเงินสด',
    'from_transactions': 'จาก {count} รายการขาย',
    'graph_overview': 'ภาพรวมกราฟ',
    'loading_dashboard': 'กำลังโหลดข้อมูล...',
    'formula': 'สูตรบัญชี: กำไรสุทธิ = รายรับ - ต้นทุนขาย(COGS) - ค่าใช้จ่าย | กระแสเงินสด = รายรับ - เติมของ - ค่าใช้จ่าย',

    // POS
    'products': 'สินค้าทั้งหมด',
    'search_products': 'ค้นหาสินค้า...',
    'search_or_scan_placeholder': 'สแกนบาร์โค้ด หรือ ค้นหาชื่อยา...',
    'scan_barcode_box': 'ยิงบาร์โค้ดที่นี่ (ล็อกตัวเลข / แปลงแป้นไทยให้อัตโนมัติ)...',
    'search_product_box': 'ค้นหาชื่อยา หรือหมวดหมู่...',
    'pin_action': 'ติดดาวสินค้าออกบ่อย',
    'unpin_action': 'ยกเลิกติดดาว',
    'all_items': 'สินค้าทั้งหมด',
    'pinned_items': 'สินค้าขายดี / ปักหมุด',
    'showing_pos_items': 'แสดง {start} - {end} จากทั้งหมด {total} รายการ',
    'page_info': 'หน้า {current} จาก {total}',
    'prev_page': 'ก่อนหน้า',
    'next_page': 'ถัดไป',
    'no_search_results': 'ไม่พบสินค้าที่ตรงกับการค้นหา',
    'exact_amount': 'รับพอดี',
    'transfer_prompt': 'ลูกค้าโอนเงินหรือสแกน QR Code เรียบร้อยแล้วกดยืนยัน',
    'processing_payment': 'กำลังบันทึก...',
    'all_categories': 'ทุกหมวดหมู่',
    'current_order': 'รายการปัจจุบัน',
    'clear': 'ล้าง',
    'empty_cart': 'ยังไม่มีสินค้าในตะกร้า',
    'subtotal': 'ยอดรวม',
    'discount': 'ส่วนลด',
    'total': 'ยอดสุทธิ',
    'checkout': 'ชำระเงิน',
    'payment': 'รับชำระเงิน',
    'cash': 'เงินสด',
    'transfer': 'เงินโอน',
    'amount_received': 'รับเงินมา',
    'change': 'เงินทอน',
    'confirm_payment': 'ยืนยันชำระเงิน',
    'cancel': 'ยกเลิก',
    'sales_completed': 'บันทึกการขายสำเร็จ!',
    'receipt_prompt': 'คุณต้องการพิมพ์ใบเสร็จหรือไม่?',
    'print_receipt': 'พิมพ์ใบเสร็จ',
    'close': 'ปิด',
    'out_of_stock': 'สินค้าหมด!',
    'product_not_found': 'ไม่พบสินค้านี้!',
    'max_stock_reached': 'เพิ่มสินค้าเกินจำนวนในสต๊อกไม่ได้!',

    // Inventory
    'import_excel': 'นำเข้า Excel',
    'add_product': 'เพิ่มสินค้า',
    'total_products': 'สินค้าทั้งหมด',
    'low_stock': 'สินค้าใกล้หมด',
    'out_of_stock_item': 'สินค้าหมดสต๊อก',
    'search_inventory': 'ค้นหาจากชื่อ หรือ บาร์โค้ด...',
    'all_stock_status': 'สถานะสต๊อกทั้งหมด',
    'barcode': 'บาร์โค้ด',
    'name': 'ชื่อสินค้า',
    'category': 'หมวดหมู่',
    'cost': 'ต้นทุน',
    'price': 'ราคาขาย',
    'stock': 'คงเหลือ',
    'actions': 'จัดการ',
    'print_barcode': 'พิมพ์บาร์โค้ด',
    'edit': 'แก้ไข',
    'delete': 'ลบ',
    'no_products': 'ยังไม่มีสินค้า กดเพิ่มสินค้าเพื่อเริ่มต้นใช้งาน!',
    'showing_entries': 'แสดง {start} ถึง {end} จากทั้งหมด {total} รายการ',
    'print_sticker': 'พิมพ์สติ๊กเกอร์',
    'no_barcode_avail': 'ไม่มีข้อมูลบาร์โค้ด',
    'save_png': 'บันทึก PNG',
    'print_now': 'พิมพ์เลย',
    'edit_product': 'แก้ไขสินค้า',
    'save_product': 'บันทึกสินค้า',
    'generate': 'สุ่มเลข',
    'min_stock_alert': 'แจ้งเตือนเมื่อต่ำกว่า',
    'scan_or_enter': 'สแกน หรือ พิมพ์บาร์โค้ด',
    'loading_inventory': 'กำลังโหลดคลังสินค้า...',

    // Categories
    'add_category': 'เพิ่มหมวดหมู่',
    'existing_categories': 'หมวดหมู่ที่มีอยู่',
    'enter_category_name': 'พิมพ์ชื่อหมวดหมู่',
    'no_categories': 'ไม่พบหมวดหมู่ เพิ่มใหม่ด้านบนได้เลย!',
    
    // Restock
    'restock': 'เติมสต๊อก',
    'restock_history': 'ประวัติการสั่งของ',
    'restock_items': 'รายการที่รับเข้า',
    'restock_confirm': 'ยืนยันการรับเข้า',
    'add_to_restock': 'เพิ่มรายการ',
    'supplier': 'ชื่อผู้ขาย (ไม่บังคับ)',
    'investment_cost': 'เงินลงทุนรวม',
    'unit_cost': 'ราคาต้นทุน',
    'qty_received': 'จำนวนรับเข้า',
    'restock_completed': 'รับของเข้าสต๊อกสำเร็จ!',
    
    // History
    'transaction_details': 'รายละเอียดการขาย',
    'date': 'วันที่',
    'time': 'เวลา',
    'receipt_no': 'เลขที่ใบเสร็จ',
    'payment_method': 'วิธีชำระเงิน',
    'total_amount': 'ยอดรวม',
    'items_purchased': 'รายการสินค้า',
    'no_history': 'ไม่พบประวัติการขาย',
    'view_details': 'ดูรายละเอียด',
    
    // Global
    'loading': 'กำลังโหลด...',
    'scan_barcode_placeholder': 'สแกน หรือ พิมพ์บาร์โค้ดที่นี่...',
    'scanner': 'สแกนเนอร์',
    'pin_product': 'ปักหมุดสินค้านี้ (แสดงด้านบนสุดของ POS)',
    'import_successful': 'นำเข้าข้อมูลสำเร็จ!',
    'import_failed': 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel',
    'amount_less_than_total': 'จำนวนเงินที่รับมาน้อยกว่ายอดชำระ!',
    'checkout_failed': 'การชำระเงินไม่สำเร็จ!',
    'checkout_error': 'เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง',
    'confirm_delete_product': 'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?',
    'delete_product_failed': 'ไม่สามารถลบสินค้าได้',
    'save_product_failed': 'ไม่สามารถบันทึกสินค้าได้',
    'confirm_delete_category': 'คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้?',
    'delete_category_failed': 'ไม่สามารถลบหมวดหมู่ได้',
    'update_category_failed': 'ไม่สามารถแก้ไขหมวดหมู่ได้',
    'add_category_failed': 'ไม่สามารถเพิ่มหมวดหมู่ได้',
    'failed_to_save_png': 'บันทึกรูปภาพ PNG ไม่สำเร็จ',
    'failed_to_restock': 'เกิดข้อผิดพลาดในการรับเข้าสินค้า',
    'receipt': 'ใบเสร็จรับเงิน',
    'thank_you': 'ขอบคุณที่ใช้บริการ!',
    'save': 'บันทึก',
    'barcode_preview': 'ดูตัวอย่างบาร์โค้ด',
    'price_label': 'ราคา:',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('th');

  useEffect(() => {
    const saved = localStorage.getItem('app-language');
    if (saved === 'en' || saved === 'th') {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string, variables?: Record<string, string | number>) => {
    let str = translations[language][key] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return a dummy context during SSR if accessed early
    return {
      language: 'th' as Language,
      setLanguage: () => {},
      t: (key: string) => key
    };
  }
  return context;
}
