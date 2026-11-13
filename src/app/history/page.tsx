'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/LanguageProvider';
import { History, Receipt, X, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';

type Product = {
  id: number;
  name: string;
  barcode: string | null;
};

type SaleItem = {
  id: number;
  quantity: number;
  priceAtSale: number;
  subtotal: number;
  product: Product | null;
};

type Sale = {
  id: number;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
};

export default function SalesHistoryPage() {
  const { t, language } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const paginatedSales = sales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
    fetchHistory();
  }, [period, startDate, endDate]);

  async function fetchHistory() {
    try {
      setLoading(true);
      const url = new URL('/api/sales/history', window.location.origin);
      url.searchParams.set('period', period);
      if (period === 'custom') {
        url.searchParams.set('startDate', startDate);
        url.searchParams.set('endDate', endDate);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Failed to fetch sales history:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'th' ? 'th-TH' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <History size={32} color="var(--primary-color)" /> {t('sales_history')}
        </h1>
        
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--card-bg)', borderRadius: 'var(--radius-md)', padding: '0.25rem', border: '1px solid var(--border-color)' }}>
            {[
              { id: 'daily', label: t('today') },
              { id: 'last7days', label: t('last_7_days') },
              { id: 'last30days', label: t('last_30_days') },
              { id: 'monthly', label: t('this_month') },
              { id: 'yearly', label: t('this_year') },
              { id: 'custom', label: t('custom_range') }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: period === p.id ? 'var(--primary-color)' : 'transparent',
                  color: period === p.id ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: period === p.id ? 600 : 400,
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          
          <AnimatePresence>
            {period === 'custom' && (
              <motion.div
                initial={{ opacity: 0, width: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, width: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, width: 0, overflow: 'hidden' }}
                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              >
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--card-bg)', 
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{t('to')}</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-color)', 
                    background: 'var(--card-bg)', 
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem'
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('receipt_no')}</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('date')}</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('time')}</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('payment_method')}</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>{t('total_amount')}</th>
                <th style={{ padding: '1.2rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>{t('transaction_details')}</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
              {loading && sales.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {t('loading')}
                  </td>
                </tr>
              ) : !loading && sales.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <PackageOpen size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                    <p style={{ fontSize: '1.1rem' }}>{t('no_history')}</p>
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <motion.tr 
                    key={sale.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ backgroundColor: 'var(--bg-color)' }}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: 500 }}>
                      #{sale.id.toString().padStart(5, '0')}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>{formatDate(sale.createdAt)}</td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>{formatTime(sale.createdAt)}</td>
                    <td style={{ padding: '1.2rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.3rem 0.8rem', 
                        borderRadius: 'var(--radius-full)', 
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        backgroundColor: sale.paymentMethod === 'CASH' ? 'var(--success-color)' : 'var(--primary-color)',
                        color: 'white',
                        opacity: 0.9
                      }}>
                        {sale.paymentMethod === 'CASH' ? t('cash') : (sale.paymentMethod === 'TRANSFER' ? t('transfer') : sale.paymentMethod)}
                      </span>
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', fontWeight: 700, color: 'var(--primary-color)', textAlign: 'right' }}>
                      ฿{sale.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="btn" 
                        style={{ padding: '0.5rem 1rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      >
                        <Receipt size={16} className="mr-2" /> {t('view_details')}
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center" style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
              {t('showing_entries', { start: (currentPage - 1) * itemsPerPage + 1, end: Math.min(currentPage * itemsPerPage, sales.length), total: sales.length })}
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

      {/* Sale Details Modal */}
      <AnimatePresence>
        {selectedSale && (
          <div className="modal-backdrop" onClick={() => setSelectedSale(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '600px', width: '90%' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Receipt size={24} color="var(--primary-color)" /> {t('transaction_details')}
                </h2>
                <button onClick={() => setSelectedSale(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div className="flex justify-between mb-2">
                  <span className="text-secondary">{t('receipt_no')}</span>
                  <strong>#{selectedSale.id.toString().padStart(5, '0')}</strong>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-secondary">{t('date')} / {t('time')}</span>
                  <span>{formatDate(selectedSale.createdAt)} {formatTime(selectedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">{t('payment_method')}</span>
                  <span style={{ fontWeight: 600 }}>{selectedSale.paymentMethod === 'CASH' ? t('cash') : (selectedSale.paymentMethod === 'TRANSFER' ? t('transfer') : selectedSale.paymentMethod)}</span>
                </div>
              </div>

              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>{t('items_purchased')}</h3>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                {selectedSale.items.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center" style={{ padding: '0.8rem 0', borderBottom: index < selectedSale.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{item.product?.name || 'Unknown Product'}</p>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.quantity} x ฿{item.priceAtSale.toFixed(2)}
                      </p>
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      ฿{item.subtotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '1.5rem 0 0 0', borderTop: '2px dashed var(--border-color)' }}>
                <div className="flex justify-between items-center" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                  <span>{t('total')}</span>
                  <span>฿{selectedSale.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button onClick={() => setSelectedSale(null)} className="btn" style={{ padding: '0.8rem 2rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
