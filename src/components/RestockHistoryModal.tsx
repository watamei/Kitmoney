'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, PackageOpen, PackagePlus } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

type RestockItem = {
  id: number;
  product: { name: string; barcode: string | null };
  quantity: number;
  unitCost: number;
  subtotal: number;
};

type Restock = {
  id: number;
  totalCost: number;
  supplier: string | null;
  createdAt: string;
  items: RestockItem[];
};

export default function RestockHistoryModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const [history, setHistory] = useState<Restock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestock, setSelectedRestock] = useState<Restock | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setSelectedRestock(null);
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/restock');
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal"
        onClick={e => e.stopPropagation()}
        style={{ width: '90%', maxWidth: selectedRestock ? '1000px' : '800px', height: '80vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', transition: 'max-width 0.3s ease' }}
      >
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
            <PackageOpen size={28} color="var(--primary-color)" />
            {t('restock_history')}
          </h2>
          <button onClick={onClose} className="icon-btn" style={{ background: 'var(--bg-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main List */}
          <div style={{ width: selectedRestock ? '40%' : '100%', flexShrink: 0, overflowY: 'auto', borderRight: '1px solid var(--border-color)', transition: 'width 0.3s ease', padding: '1rem' }}>
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('loading')}</div>
            ) : history.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <PackageOpen size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                <p>{t('no_history')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.map(restock => (
                  <div 
                    key={restock.id} 
                    onClick={() => setSelectedRestock(restock)}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: selectedRestock?.id === restock.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      background: selectedRestock?.id === restock.id ? 'var(--primary-light)' : 'var(--bg-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>#{restock.id.toString().padStart(4, '0')}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(restock.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {restock.supplier || 'No Supplier'} • {restock.items.length} items
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                        ฿{restock.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          {selectedRestock && (
            <div style={{ width: '60%', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.5rem', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{t('restock_items')} #{selectedRestock.id.toString().padStart(4, '0')}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {formatDate(selectedRestock.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t('investment_cost')}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>฿{selectedRestock.totalCost.toFixed(2)}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '1rem', fontWeight: 600 }}>{t('name')}</th>
                        <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>{t('qty_received')}</th>
                        <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>{t('unit_cost')}</th>
                        <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>{t('total_amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRestock.items.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 500 }}>{item.product?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.product?.barcode || '-'}</div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                            +{item.quantity}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            ฿{item.unitCost.toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: 'var(--primary-color)' }}>
                            ฿{item.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
