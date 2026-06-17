'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, Plus, Minus, Trash2, ShoppingCart, X, Star } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
  isPinned?: boolean;
};

type CartItem = Product & {
  quantity: number;
};

export default function POSPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  }

  const handleBarcodeScannerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeInput(e.target.value);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => p.barcode === barcodeInput.trim());
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      alert(t('product_not_found'));
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(t('out_of_stock'));
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(t('max_stock_reached'));
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const changeQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) {
          return { ...item, quantity: newQty };
        }
        return item;
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const changeAmount = paymentMethod === 'CASH' && amountReceived ? parseFloat(amountReceived) - totalAmount : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && (!amountReceived || parseFloat(amountReceived) < totalAmount)) {
      alert('Amount received is less than total amount!');
      return;
    }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          totalAmount,
          paymentMethod
        })
      });

      if (res.ok) {
        setShowPrintModal(true);
        fetchProducts();
      } else {
        alert('Checkout failed!');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handlePrintChoice = (shouldPrint: boolean) => {
    if (shouldPrint) {
      window.print();
    }
    setCart([]);
    setAmountReceived('');
    setShowPrintModal(false);
  };

  useEffect(() => {
    if (isCameraScannerOpen) {
      const scanner = new Html5QrcodeScanner("reader", { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
      scanner.render((decodedText) => {
        setBarcodeInput(decodedText);
        scanner.clear();
        setIsCameraScannerOpen(false);
        
        const product = products.find(p => p.barcode === decodedText);
        if (product) {
          addToCart(product);
          setBarcodeInput('');
        } else {
          alert('Product not found: ' + decodedText);
        }
      }, () => {});

      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [isCameraScannerOpen, products]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const pinnedProducts = filteredProducts.filter(p => p.isPinned);
  const regularProducts = filteredProducts.filter(p => !p.isPinned);

  const renderCartContent = () => (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: isMobile ? '80vh' : 'auto' }}>
      <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t('current_order')}</h2>
        {cart.length > 0 && (
          <button onClick={() => setCart([])} style={{ color: 'var(--danger-color)', fontSize: '0.9rem', fontWeight: 500 }}>
            {t('clear')}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: '150px' }}>
        <AnimatePresence>
          {cart.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>
              <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
              <p>{t('empty_cart')}</p>
            </motion.div>
          ) : (
            cart.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id} 
                className="flex justify-between items-center" 
                style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed var(--border-color)' }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '1.05rem' }}>{item.name}</h4>
                  <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: 'bold' }}>฿{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center" style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-full)', padding: '0.2rem', gap: '0.5rem' }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeQuantity(item.id, -1)} style={{ padding: '0.4rem', borderRadius: '50%' }}><Minus size={14} /></motion.button>
                    <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeQuantity(item.id, 1)} style={{ padding: '0.4rem', borderRadius: '50%' }}><Plus size={14} /></motion.button>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, color: 'var(--danger-color)' }} onClick={() => removeFromCart(item.id)} style={{ color: 'var(--text-secondary)' }}>
                    <Trash2 size={20} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {cart.length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div className="flex justify-between mb-2 text-secondary">
            <span>{t('subtotal')}</span>
            <span>฿{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4 text-secondary">
            <span>{t('discount')}</span>
            <span>฿0.00</span>
          </div>
          <div className="flex justify-between mb-6" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            <span>{t('total')}</span>
            <span>฿{totalAmount.toFixed(2)}</span>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (isMobileCartOpen) setIsMobileCartOpen(false);
              setPaymentMethod('CASH');
            }}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
          >
            {t('checkout')}
          </motion.button>
        </div>
      )}
    </div>
  );

  return (
    <motion.div 
      className="grid gap-6 animate-fade-in" 
      style={{ gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', minHeight: isMobile ? 'auto' : 'calc(100vh - 4rem)' }}
    >
      <div className="flex" style={{ flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div className="card flex items-center justify-between gap-4" whileHover={{ boxShadow: 'var(--shadow-lg)' }}>
          <form onSubmit={handleBarcodeSubmit} style={{ flex: 1, display: 'flex', gap: '1rem', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              ref={barcodeInputRef}
              type="text" 
              placeholder="Scan Barcode here..." 
              value={barcodeInput}
              onChange={handleBarcodeScannerInput}
              style={{ flex: 1, fontSize: isMobile ? '1rem' : '1.1rem', padding: isMobile ? '0.85rem 0.85rem 0.85rem 2.75rem' : '1rem 1rem 1rem 3rem', borderRadius: 'var(--radius-full)' }}
              autoFocus
            />
            <button type="submit" style={{ display: 'none' }}>Enter</button>
          </form>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn" 
            style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '1rem 1.5rem' }}
            onClick={() => setIsCameraScannerOpen(!isCameraScannerOpen)}
          >
            <Camera size={20} className="mr-2" /> Scanner
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {isCameraScannerOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card overflow-hidden" 
              style={{ padding: '1rem' }}
            >
              <div id="reader" style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}></div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            <AnimatePresence>
              {pinnedProducts.map(product => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02, y: -4, boxShadow: 'var(--shadow-glow)' }}
                  key={product.id} 
                  className="card" 
                  style={{ cursor: 'pointer', padding: '1.2rem', border: '1px solid var(--primary-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(0,113,227,0.03)' }}
                  onClick={() => addToCart(product)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{product.name}</h3>
                    <Star size={16} fill="var(--primary-color)" color="var(--primary-color)" style={{ flexShrink: 0 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '700' }}>฿{product.price.toFixed(2)}</p>
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>{t('stock')}: {product.stock}</span>
                  </div>
                </motion.div>
              ))}
              
              {regularProducts.map(product => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02, y: -4, boxShadow: 'var(--shadow-glow)' }}
                  key={product.id} 
                  className="card" 
                  style={{ cursor: 'pointer', padding: '1.2rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  onClick={() => addToCart(product)}
                >
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{product.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--primary-color)', fontSize: '1.25rem', fontWeight: '700' }}>฿{product.price.toFixed(2)}</p>
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'var(--bg-color)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>{t('stock')}: {product.stock}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desktop Inline Cart */}
      {!isMobile && (
        <div style={{ flex: '0 0 380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {renderCartContent()}
        </div>
      )}

      {paymentMethod && cart.length > 0 && !showPrintModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '1rem' : 0 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card" style={{ width: '100%', maxWidth: '400px', padding: isMobile ? '1rem' : undefined }}>
            <h2 className="mb-6">{t('payment')}</h2>
            
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setPaymentMethod('CASH')}
                className={`btn ${paymentMethod === 'CASH' ? 'btn-primary' : ''}`}
                style={{ flex: 1, border: paymentMethod !== 'CASH' ? '1px solid var(--border-color)' : 'none' }}
              >
                {t('cash')}
              </button>
              <button 
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`btn ${paymentMethod === 'TRANSFER' ? 'btn-primary' : ''}`}
                style={{ flex: 1, border: paymentMethod !== 'TRANSFER' ? '1px solid var(--border-color)' : 'none' }}
              >
                {t('transfer')}
              </button>
            </div>

            <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{t('total')}</p>
              <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>฿{totalAmount.toFixed(2)}</h1>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="mb-6">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('amount_received')}</label>
                <input 
                  type="number" 
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  style={{ width: '100%', fontSize: '1.25rem', padding: '1rem' }}
                  placeholder="฿0.00"
                  autoFocus
                />
              </div>
            )}

            {paymentMethod === 'CASH' && amountReceived && parseFloat(amountReceived) >= totalAmount && (
              <div className="mb-6 p-4" style={{ background: 'rgba(52, 199, 89, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success-color)' }}>
                <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>{t('change')}:</span>
                  <span style={{ fontSize: '1.25rem' }}>฿{changeAmount.toFixed(2)}</span>
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setPaymentMethod('')} className="btn" style={{ flex: 1, background: 'var(--bg-color)' }}>{t('cancel')}</button>
              <button 
                onClick={handleCheckout} 
                disabled={paymentMethod === 'CASH' && (!amountReceived || parseFloat(amountReceived) < totalAmount)}
                className="btn btn-success" 
                style={{ flex: 2 }}
              >
                {t('confirm_payment')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hidden Receipt for Printing */}
      <div id="print-receipt" style={{ display: 'none' }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #print-receipt, #print-receipt * { visibility: visible; }
            #print-receipt { position: absolute; left: 0; top: 0; width: 100%; font-family: monospace; }
            /* Default 58mm style */
            .receipt-container { width: 58mm; margin: 0 auto; padding: 5mm; }
          }
        `}</style>
        <div className="receipt-container">
          <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>KidYa POS</h2>
          <p style={{ textAlign: 'center', margin: '0 0 5px 0', fontSize: '12px' }}>Receipt</p>
          <p style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '12px' }}>
            {new Date().toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} {new Date().toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }}></div>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
              <div style={{ flex: 1 }}>{item.name} x{item.quantity}</div>
              <div>{(item.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
          <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total:</span>
            <span>฿{totalAmount.toFixed(2)}</span>
          </div>
          {paymentMethod === 'CASH' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Cash:</span>
                <span>฿{parseFloat(amountReceived || '0').toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Change:</span>
                <span>฿{changeAmount.toFixed(2)}</span>
              </div>
            </>
          )}
          <p style={{ textAlign: 'center', margin: '20px 0 0 0', fontSize: '12px' }}>Thank you!</p>
        </div>
      </div>

      {/* Print Choice Modal */}
      {showPrintModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>✅ {t('sales_completed')}</h2>
            <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>{t('receipt_prompt')}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn" 
                onClick={() => handlePrintChoice(false)}
                style={{ flex: 1 }}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handlePrintChoice(true)}
                style={{ flex: 1 }}
              >
                {t('print_receipt')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Cart Button */}
      {isMobile && cart.length > 0 && !isMobileCartOpen && !paymentMethod && !showPrintModal && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{ position: 'fixed', bottom: '1.5rem', left: '1rem', right: '1rem', zIndex: 50 }}
        >
          <button 
            onClick={() => setIsMobileCartOpen(true)}
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', boxShadow: '0 10px 25px rgba(0,113,227,0.4)' }}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.1rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.9rem' }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </span>
            <span style={{ fontWeight: 700 }}>
              {t('checkout')} • ฿{totalAmount.toFixed(2)}
            </span>
          </button>
        </motion.div>
      )}

      {/* Mobile Cart Modal */}
      <AnimatePresence>
        {isMobile && isMobileCartOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ background: 'var(--bg-color)', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '1.5rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}
            >
              <div style={{ width: '40px', height: '5px', background: 'var(--border-color)', borderRadius: '10px', margin: '0 auto 1.5rem auto' }} />
              <button 
                onClick={() => setIsMobileCartOpen(false)}
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--card-bg)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
              
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {renderCartContent()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
