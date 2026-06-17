'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Edit2, Trash2, Search, FileUp, Filter, AlertTriangle, ChevronLeft, ChevronRight, PackageX, Printer, Image as ImageIcon, Star } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import Barcode from 'react-barcode';
import html2canvas from 'html2canvas';
import RestockModal from '@/components/RestockModal';
import RestockHistoryModal from '@/components/RestockHistoryModal';
import { PackageOpen, PackagePlus } from 'lucide-react';

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  category: string | null;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  isPinned?: boolean;
};

import * as XLSX from 'xlsx';

export default function InventoryPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isRestockHistoryOpen, setIsRestockHistoryOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [printingProduct, setPrintingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All'); // 'All' | 'Low' | 'Out'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    cost: '',
    price: '',
    stock: '',
    minStock: '10',
    isPinned: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Ensure data is imported sequentially or parallel
        for (const row of data as Record<string, string | number>[]) {
          await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              barcode: row.barcode?.toString() || '',
              name: row.name || 'Unnamed',
              category: row.category || '',
              cost: row.cost || 0,
              price: row.price || 0,
              stock: row.stock || 0,
              minStock: row.minStock || 10,
              isPinned: row.isPinned || false,
            })
          });
        }
        alert('Import successful!');
        fetchProducts();
      } catch (error) {
        console.error('Error importing Excel', error);
        alert('Failed to import Excel file.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        barcode: product.barcode || '',
        name: product.name,
        category: product.category || '',
        cost: product.cost.toString(),
        price: product.price.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        isPinned: product.isPinned || false,
      });
    } else {
      setEditingId(null);
      setFormData({
        barcode: '',
        name: '',
        category: '',
        cost: '',
        price: '',
        stock: '',
        minStock: '10',
        isPinned: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        await fetchProducts();
        await fetchCategories();
        handleCloseModal();
      } else {
        const errorText = await res.text();
        alert(`Failed to save product: ${errorText}`);
      }
    } catch (error) {
      console.error('Failed to save product', error);
      alert('Failed to save product: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product', error);
    }
  };

  const handleTogglePin = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          isPinned: !product.isPinned
        })
      });
      if (res.ok) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Failed to toggle pin', error);
    }
  };

  const generateBarcode = () => {
    // Generate a simple random 13 digit barcode
    const randomBarcode = Math.floor(Math.random() * 9000000000000) + 1000000000000;
    setFormData({ ...formData, barcode: randomBarcode.toString() });
  };

  // Derived Stats
  const totalProducts = products.length;
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= p.minStock).length, [products]);
  const outOfStockCount = useMemo(() => products.filter(p => p.stock === 0).length, [products]);

  // Filtering Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.barcode && p.barcode.includes(searchQuery));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesStock = stockFilter === 'All' 
                           ? true 
                           : stockFilter === 'Low' 
                             ? p.stock > 0 && p.stock <= p.minStock 
                             : stockFilter === 'Out'
                               ? p.stock === 0
                               : true;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}><FileUp size={28} /> {t('inventory')}</h1>
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => fileInputRef.current?.click()} className="btn" style={{ border: '1px solid var(--border-color)', background: 'var(--card-bg)', boxShadow: 'var(--shadow-sm)' }}>
            <Download size={18} /> {t('import_excel')}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsRestockHistoryOpen(true)} className="btn" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
            <PackageOpen size={18} /> {t('restock_history')}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsRestockOpen(true)} className="btn" style={{ background: 'var(--success-color)', color: 'white', border: 'none' }}>
            <PackagePlus size={18} /> {t('restock')}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus size={18} /> {t('add_product')}
          </motion.button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <motion.div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('total_products')}</p>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>{totalProducts}</h2>
        </motion.div>
        <motion.div className="card" style={{ borderTop: '4px solid var(--warning-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={16} color="var(--warning-color)" /> {t('low_stock')}</p>
          <h2 style={{ fontSize: '2rem', margin: 0, color: lowStockCount > 0 ? 'var(--warning-color)' : 'var(--text-primary)' }}>{lowStockCount}</h2>
        </motion.div>
        <motion.div className="card" style={{ borderTop: '4px solid var(--danger-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PackageX size={16} color="var(--danger-color)" /> {t('out_of_stock_item')}</p>
          <h2 style={{ fontSize: '2rem', margin: 0, color: outOfStockCount > 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>{outOfStockCount}</h2>
        </motion.div>
      </div>

      {/* Smart Toolbar */}
      <div className="card mb-6 flex" style={{ gap: '1rem', flexWrap: 'wrap', alignItems: 'center', padding: '1rem 1.5rem' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder={t('search_inventory')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
          />
        </div>
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--text-secondary)" />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}
            >
              <option value="All">{t('all_categories')}</option>
              {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select 
              value={stockFilter} 
              onChange={e => setStockFilter(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}
            >
              <option value="All">{t('all_stock_status')}</option>
              <option value="Low">{t('low_stock')}</option>
              <option value="Out">{t('out_of_stock_item')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: '1rem' }}>
              <Search size={32} opacity={0.5} />
            </motion.div>
            <p>{t('loading_inventory')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '1rem' }}>{t('barcode')}</th>
                  <th style={{ padding: '1rem' }}>{t('name')}</th>
                  <th style={{ padding: '1rem' }}>{t('category')}</th>
                  <th style={{ padding: '1rem' }}>{t('cost')}</th>
                  <th style={{ padding: '1rem' }}>{t('price')}</th>
                  <th style={{ padding: '1rem' }}>{t('stock')}</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>★</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {paginatedProducts.map(product => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      key={product.id} 
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}
                      whileHover={{ backgroundColor: 'var(--primary-light)' }}
                    >
                      <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{product.barcode || '-'}</td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{product.name}</td>
                      <td style={{ padding: '1rem' }}>
                        {product.category ? <span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem' }}>{product.category}</span> : '-'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>฿{product.cost.toFixed(2)}</td>
                      <td className="price" style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>฿{product.price.toFixed(2)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          color: product.stock === 0 ? 'var(--danger-color)' : product.stock <= product.minStock ? 'var(--warning-color)' : 'var(--text-primary)',
                          background: product.stock === 0 ? 'rgba(255, 59, 48, 0.1)' : product.stock <= product.minStock ? 'rgba(255, 149, 0, 0.1)' : 'transparent',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: product.stock <= product.minStock ? '600' : 'normal',
                          fontSize: '0.9rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {product.stock === 0 && <PackageX size={14} />}
                          {product.stock > 0 && product.stock <= product.minStock && <AlertTriangle size={14} />}
                          {product.stock}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <motion.button 
                          whileHover={{ scale: 1.2 }} 
                          whileTap={{ scale: 0.8 }} 
                          onClick={() => handleTogglePin(product)} 
                          style={{ color: product.isPinned ? '#f59e0b' : 'var(--text-secondary)', padding: '0.5rem', opacity: product.isPinned ? 1 : 0.3 }}
                          title={product.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Star size={20} fill={product.isPinned ? '#f59e0b' : 'none'} />
                        </motion.button>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          onClick={() => setPrintingProduct(product)} 
                          style={{ color: 'var(--text-secondary)', marginRight: '0.75rem', padding: '0.5rem' }}
                          title="Print Barcode"
                        >
                          <Printer size={18} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          onClick={() => handleOpenModal(product)} 
                          style={{ color: 'var(--primary-color)', marginRight: '0.75rem', padding: '0.5rem' }}
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }} 
                          whileTap={{ scale: 0.9 }} 
                          onClick={() => handleDelete(product.id)} 
                          style={{ color: 'var(--danger-color)', padding: '0.5rem' }}
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                  {paginatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FileUp size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                        <p>{t('no_products')}</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '1rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              {t('showing_entries', { start: (currentPage - 1) * itemsPerPage + 1, end: Math.min(currentPage * itemsPerPage, filteredProducts.length), total: filteredProducts.length })}
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn"
                style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: currentPage === 1 ? 'transparent' : 'var(--card-bg)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={18} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontWeight: 500 }}>
                {currentPage} / {totalPages}
              </div>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn"
                style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: currentPage === totalPages ? 'transparent' : 'var(--card-bg)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ margin: 0 }}>{editingId ? t('edit_product') : t('add_product')}</h2>
              <button onClick={handleCloseModal} style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('barcode')}</label>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={formData.barcode} 
                    onChange={e => setFormData({...formData, barcode: e.target.value})}
                    style={{ flex: 1 }}
                    placeholder={t('scan_or_enter')}
                  />
                  <button type="button" onClick={generateBarcode} className="btn" style={{ border: '1px solid var(--border-color)' }}>
                    {t('generate')}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('name')} *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('category')}</label>
                <input 
                  type="text" 
                  list="category-options"
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  style={{ width: '100%' }}
                  placeholder=""
                />
                <datalist id="category-options">
                  {categories.map((cat, i) => (
                    <option key={i} value={cat} />
                  ))}
                </datalist>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('cost')}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.cost} 
                    onChange={e => setFormData({...formData, cost: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('price')} *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('stock')}</label>
                  <input 
                    type="number" 
                    required
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('min_stock_alert')}</label>
                  <input 
                    type="number" 
                    required
                    value={formData.minStock} 
                    onChange={e => setFormData({...formData, minStock: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="mb-6">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.isPinned}
                    onChange={e => setFormData({...formData, isPinned: e.target.checked})}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                  />
                  <span className="font-medium">Pin this product (Show at top of POS)</span>
                </label>
              </div>
              <div className="flex justify-between items-center mt-4">
                <button type="button" onClick={handleCloseModal} className="btn" style={{ color: 'var(--text-secondary)' }}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('save_product')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Barcode Modal */}
      {printingProduct && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 style={{ margin: 0 }}>{t('print_sticker')}</h2>
              <button onClick={() => setPrintingProduct(null)} style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
            </div>
            
            <div id="print-sticker-area" style={{ 
              background: 'white', 
              color: 'black', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              border: '1px dashed #ccc',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'sans-serif' }}>{printingProduct.name}</h3>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>฿{printingProduct.price.toFixed(2)}</p>
              {printingProduct.barcode ? (
                <Barcode value={printingProduct.barcode} format="CODE128" width={2} height={50} fontSize={14} />
              ) : (
                <div style={{ padding: '2rem', border: '1px solid #eee', color: '#888' }}>{t('no_barcode_avail')}</div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setPrintingProduct(null)} className="btn" style={{ color: 'var(--text-secondary)' }}>{t('cancel')}</button>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  disabled={!printingProduct.barcode}
                  onClick={async () => {
                    const element = document.getElementById('print-sticker-area');
                    if (!element) return;
                    try {
                      const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' });
                      const dataUrl = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = `sticker_${printingProduct.barcode || printingProduct.name}.png`;
                      link.href = dataUrl;
                      link.click();
                    } catch (err) {
                      console.error('Failed to save PNG', err);
                      alert('Failed to save PNG');
                    }
                  }} 
                  className="btn"
                  style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--primary-color)', color: 'var(--primary-color)' }}
                >
                  <ImageIcon size={18} /> {t('save_png')}
                </button>
                <button 
                  type="button" 
                  disabled={!printingProduct.barcode}
                  onClick={() => {
                    const printContent = document.getElementById('print-sticker-area')?.innerHTML;
                    if (!printContent) return;
                    const printWindow = window.open('', '', 'height=600,width=800');
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Print Barcode Sticker</title>
                            <style>
                              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                              .sticker { text-align: center; border: 1px solid #ccc; padding: 10px; width: 250px; }
                              h3 { margin: 0 0 5px 0; font-size: 16px; }
                              p { margin: 0 0 10px 0; font-size: 14px; font-weight: bold; }
                            </style>
                          </head>
                          <body>
                            <div class="sticker">
                              ${printContent}
                            </div>
                            <script>
                              window.onload = () => {
                                window.print();
                                window.close();
                              }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }} 
                  className="btn btn-primary"
                  style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                >
                  <Printer size={18} /> {t('print_now')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modals */}
      <AnimatePresence>
        {isRestockOpen && (
          <RestockModal 
            key="restock-modal"
            isOpen={isRestockOpen} 
            onClose={() => setIsRestockOpen(false)} 
            products={products}
            onSuccess={() => {
              fetchProducts();
              alert(t('restock_completed'));
            }}
          />
        )}
        {isRestockHistoryOpen && (
          <RestockHistoryModal 
            key="restock-history-modal"
            isOpen={isRestockHistoryOpen} 
            onClose={() => setIsRestockHistoryOpen(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
