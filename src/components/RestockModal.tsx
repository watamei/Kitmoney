'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Trash2, PackagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  cost: number;
  price: number;
  stock: number;
};

type RestockItem = Product & {
  addQuantity: number;
  newUnitCost: number;
};

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[]; // Pass products for searching
}

export default function RestockModal({ isOpen, onClose, onSuccess, products }: RestockModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<RestockItem[]>([]);
  const [supplier, setSupplier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setCart([]);
      setSearchQuery('');
      setSupplier('');
    }
  }, [isOpen]);

  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  ).slice(0, 5); // Show top 5 matches

  const addToRestock = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, addQuantity: item.addQuantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, addQuantity: 1, newUnitCost: product.cost }]);
    }
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      const exactMatch = products.find(p => p.barcode === searchQuery.trim());
      if (exactMatch) {
        addToRestock(exactMatch);
      }
    }
  };

  const updateItem = (id: number, field: 'addQuantity' | 'newUnitCost', value: number) => {
    if (value < 0) value = 0;
    setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalInvestment = cart.reduce((sum, item) => sum + (item.addQuantity * item.newUnitCost), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    
    try {
      const payload = {
        supplier: supplier.trim() || null,
        totalCost: totalInvestment,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.addQuantity,
          unitCost: item.newUnitCost,
          subtotal: item.addQuantity * item.newUnitCost
        }))
      };

      const res = await fetch('/api/inventory/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Restock failed');
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(t('failed_to_restock'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: 0 }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
            <PackagePlus size={28} color="var(--primary-color)" />
            {t('restock')}
          </h2>
          <button onClick={onClose} className="icon-btn" style={{ background: 'var(--bg-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Panel: Search */}
          <div style={{ width: '35%', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
            <div style={{ padding: '1.5rem' }}>
              <div className="search-bar" style={{ marginBottom: '1rem', background: 'var(--bg-color)', border: '2px solid var(--primary-color)' }}>
                <Search size={20} color="var(--primary-color)" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('scan_or_enter')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  style={{ background: 'transparent' }}
                  autoFocus
                />
              </div>

              {searchQuery.trim() !== '' && (
                <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <div 
                        key={product.id}
                        onClick={() => addToRestock(product)}
                        style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{product.barcode || t('no_barcode_avail')} • {t('stock')}: {product.stock}</div>
                        </div>
                        <button className="icon-btn" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                          <Plus size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {t('product_not_found')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Cart */}
          <div style={{ width: '65%', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {cart.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <PackagePlus size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                  <h3>{t('empty_cart')}</h3>
                  <p>{t('search_inventory')} {t('add_to_restock')}</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '0.75rem 0', textAlign: 'left', width: '40%' }}>{t('name')}</th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'center', width: '20%' }}>{t('qty_received')}</th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'right', width: '20%' }}>{t('unit_cost')}</th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'right', width: '15%' }}>{t('total_amount')}</th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'center', width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem 0' }}>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t('stock')}: {item.stock} &rarr; <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>{item.stock + item.addQuantity}</span></div>
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                          <input 
                            type="number" 
                            min="1"
                            value={item.addQuantity || ''}
                            onChange={(e) => updateItem(item.id, 'addQuantity', parseInt(e.target.value) || 0)}
                            className="input-field"
                            style={{ width: '80px', textAlign: 'center', padding: '0.5rem' }}
                          />
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                          <input 
                            type="number" 
                            min="0"
                            step="0.01"
                            value={item.newUnitCost || ''}
                            onChange={(e) => updateItem(item.id, 'newUnitCost', parseFloat(e.target.value) || 0)}
                            className="input-field"
                            style={{ width: '100px', textAlign: 'right', padding: '0.5rem' }}
                          />
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 600 }}>
                          ฿{(item.addQuantity * item.newUnitCost).toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                          <button onClick={() => removeItem(item.id)} className="icon-btn" style={{ color: 'var(--danger-color)', background: 'transparent' }}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer Summary */}
            <div style={{ padding: '1.5rem 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {t('supplier')}
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="e.g. PharmaCorp"
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('investment_cost')}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>฿{totalInvestment.toFixed(2)}</div>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || isSubmitting}
                  style={{ padding: '1rem 2rem', fontSize: '1.1rem', height: '100%' }}
                >
                  {isSubmitting ? <span className="spinner" style={{ width: 24, height: 24, borderTopColor: 'white' }}></span> : <CheckCircle2 size={24} className="mr-2" />}
                  {t('restock_confirm')}
                </button>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
