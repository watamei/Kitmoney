'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Search, Plus, Minus, Trash2, ShoppingCart, X, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

type Product = {
  id: number;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
  minStock?: number;
  isPinned?: boolean;
  category?: string | null;
};

type CartItem = Product & {
  quantity: number;
};

const ITEMS_PER_PAGE = 24;

export default function POSPage() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
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

  const searchInputRef = useRef<HTMLInputElement>(null);
  const productsRef = useRef<Product[]>([]);
  const lastScanRef = useRef<{ barcode: string; time: number }>({ barcode: '', time: 0 });

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const addToCart = useCallback((product: Product) => {
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
  }, [t]);

  const addToCartRef = useRef(addToCart);
  useEffect(() => {
    addToCartRef.current = addToCart;
  }, [addToCart]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [fetchProducts]);

  // Camera Barcode Scanner
  useEffect(() => {
    if (isCameraScannerOpen) {
      const scanner = new Html5QrcodeScanner("reader", { qrbox: { width: 250, height: 250 }, fps: 5 }, false);
      scanner.render((decodedText) => {
        const now = Date.now();
        if (lastScanRef.current.barcode === decodedText && now - lastScanRef.current.time < 1000) {
          return; // debounce ~1 second per same barcode
        }
        lastScanRef.current = { barcode: decodedText, time: now };

        scanner.clear();
        setIsCameraScannerOpen(false);
        
        const product = productsRef.current.find(p => p.barcode === decodedText);
        if (product) {
          addToCartRef.current(product);
          setSearchQuery('');
        } else {
          alert(`${t('product_not_found')}: ${decodedText}`);
        }
      }, () => {});

      return () => {
        scanner.clear().catch(e => console.error(e));
      };
    }
  }, [isCameraScannerOpen, t]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Pinned products
  const pinnedProducts = useMemo(() => {
    return products.filter(p => p.isPinned);
  }, [products]);

  // Filtering products
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All'
        ? true
        : selectedCategory === 'pinned'
        ? p.isPinned
        : p.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!query) return true;
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(query) : false;
      return matchesName || matchesBarcode;
    });
  }, [products, searchQuery, selectedCategory]);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Handle Smart Search & Barcode Submit (Scanner gun or Enter)
  const handleSmartSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // 1. Exact barcode match
    const exactBarcodeMatch = productsRef.current.find(p => p.barcode === query);
    if (exactBarcodeMatch) {
      addToCart(exactBarcodeMatch);
      setSearchQuery('');
      return;
    }

    // 2. Exactly one search result
    if (filteredProducts.length === 1) {
      addToCart(filteredProducts[0]);
      setSearchQuery('');
      return;
    }

    // 3. Not found
    if (filteredProducts.length === 0) {
      alert(t('product_not_found'));
    }
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
      alert(t('amount_less_than_total'));
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
        const errorData = await res.json().catch(() => null);
        alert(errorData?.error || t('checkout_failed'));
        fetchProducts();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(t('checkout_error'));
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

  const renderCartContent = () => (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: isMobile ? '80vh' : 'auto' }}>
      <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={20} color="var(--primary-color)" />
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{t('current_order')}</h2>
          {cart.length > 0 && (
            <span style={{ fontSize: '0.8rem', background: 'var(--primary-color)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '0.1rem 0.5rem', fontWeight: 700 }}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button onClick={() => setCart([])} className="btn" style={{ color: 'var(--danger-color)', fontSize: '0.85rem', padding: '0.25rem 0.5rem' }}>
            {t('clear')}
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: '180px', paddingRight: '0.25rem' }}>
        <AnimatePresence>
          {cart.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3.5rem' }}>
              <ShoppingCart size={48} style={{ opacity: 0.15, margin: '0 auto 1rem auto' }} />
              <p style={{ fontSize: '0.95rem' }}>{t('empty_cart')}</p>
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
                style={{ marginBottom: '0.85rem', paddingBottom: '0.85rem', borderBottom: '1px dashed var(--border-color)' }}
              >
                <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3 }}>{item.name}</h4>
                  <p style={{ margin: 0, color: 'var(--primary-color)', fontWeight: '700', fontSize: '0.95rem' }}>฿{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', padding: '0.15rem 0.35rem', gap: '0.35rem' }}>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeQuantity(item.id, -1)} style={{ padding: '0.3rem', borderRadius: '50%', background: 'transparent' }}><Minus size={12} /></motion.button>
                    <span style={{ fontWeight: 600, width: '22px', textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeQuantity(item.id, 1)} style={{ padding: '0.3rem', borderRadius: '50%', background: 'transparent' }}><Plus size={12} /></motion.button>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, color: 'var(--danger-color)' }} onClick={() => removeFromCart(item.id)} style={{ color: 'var(--text-secondary)', background: 'transparent', padding: '0.25rem' }}>
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {cart.length > 0 && (
        <div style={{ marginTop: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div className="flex justify-between mb-2 text-secondary" style={{ fontSize: '0.9rem' }}>
            <span>{t('subtotal')}</span>
            <span>฿{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-3 text-secondary" style={{ fontSize: '0.9rem' }}>
            <span>{t('discount')}</span>
            <span>฿0.00</span>
          </div>
          <div className="flex justify-between mb-5" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-color)' }}>
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
            style={{ width: '100%', padding: '0.9rem', fontSize: '1.05rem', fontWeight: 600 }}
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
      style={{ gridTemplateColumns: isMobile ? '1fr' : '2fr 1.1fr', minHeight: isMobile ? 'auto' : 'calc(100vh - 4.5rem)' }}
    >
      <div className="flex" style={{ flexDirection: 'column', gap: '1rem' }}>
        {/* Unified Smart Search & Scanner Bar */}
        <motion.div className="card" style={{ padding: '0.75rem 1rem' }} whileHover={{ boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSmartSearchSubmit} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder={t('search_or_scan_placeholder')} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  padding: '0.75rem 2.25rem 0.75rem 2.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)',
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '0.85rem', background: 'transparent', color: 'var(--text-secondary)', padding: '0.2rem' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" style={{ display: 'none' }}>Submit</button>

            <motion.button 
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn" 
              style={{
                background: isCameraScannerOpen ? 'var(--primary-color)' : 'var(--bg-secondary)',
                color: isCameraScannerOpen ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                padding: '0.75rem 1.15rem',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
              }}
              onClick={() => setIsCameraScannerOpen(!isCameraScannerOpen)}
            >
              <Camera size={18} />
              <span>{t('scanner')}</span>
            </motion.button>
          </form>
        </motion.div>

        {/* Camera Scanner View */}
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

        {/* Category Pills Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className="btn"
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-full)',
              background: selectedCategory === 'All' ? 'var(--primary-color)' : 'var(--card-bg)',
              color: selectedCategory === 'All' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              whiteSpace: 'nowrap',
              fontWeight: selectedCategory === 'All' ? 600 : 400,
            }}
          >
            {t('all_items')} ({products.length})
          </button>

          {pinnedProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedCategory('pinned')}
              className="btn"
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                background: selectedCategory === 'pinned' ? 'var(--primary-color)' : 'var(--card-bg)',
                color: selectedCategory === 'pinned' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: selectedCategory === 'pinned' ? 600 : 400,
              }}
            >
              <Star size={13} fill={selectedCategory === 'pinned' ? '#fff' : '#f5a623'} color={selectedCategory === 'pinned' ? '#fff' : '#f5a623'} />
              {t('pinned_items')} ({pinnedProducts.length})
            </button>
          )}

          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className="btn"
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                background: selectedCategory === cat ? 'var(--primary-color)' : 'var(--card-bg)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                whiteSpace: 'nowrap',
                fontWeight: selectedCategory === cat ? 600 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Catalog Grid Container */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 1.25rem' }}>
          {/* Header count info */}
          <div className="flex justify-between items-center mb-3">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('showing_pos_items', {
                start: filteredProducts.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0,
                end: Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length),
                total: filteredProducts.length,
              })}
            </span>
            {searchQuery && (
              <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600 }}>
                ค้นหา: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {/* Clean Grid */}
          <div style={{ flex: 1, minHeight: '320px' }}>
            {paginatedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 1rem' }}>
                <Search size={40} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>{t('no_search_results')}</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="btn" style={{ fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
                    {t('clear')}
                  </button>
                )}
              </div>
            ) : (
              <div 
                className="grid gap-3" 
                style={{ 
                  gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(180px, 1fr))',
                  alignContent: 'start',
                }}
              >
                {paginatedProducts.map(product => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = !isOutOfStock && product.stock <= (product.minStock ?? 5);

                  return (
                    <motion.div 
                      key={product.id}
                      whileHover={{ scale: 1.02, y: -2, boxShadow: 'var(--shadow-md)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(product)}
                      className="card"
                      style={{
                        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                        padding: '0.85rem',
                        border: product.isPinned ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '105px',
                        background: product.isPinned ? 'rgba(0,113,227,0.02)' : 'var(--card-bg)',
                        opacity: isOutOfStock ? 0.6 : 1,
                        transition: 'border-color 0.15s ease',
                      }}
                      title={product.name}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.35rem' }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {product.name}
                        </h4>
                        {product.isPinned && (
                          <Star size={14} fill="#f5a623" color="#f5a623" style={{ flexShrink: 0, marginTop: '2px' }} />
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.75rem' }}>
                        <span style={{ color: 'var(--primary-color)', fontSize: '1.15rem', fontWeight: 700 }}>
                          ฿{product.price.toFixed(2)}
                        </span>

                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 600,
                          background: isOutOfStock 
                            ? 'rgba(255, 59, 48, 0.12)' 
                            : isLowStock 
                            ? 'rgba(255, 149, 0, 0.12)' 
                            : 'var(--bg-secondary)',
                          color: isOutOfStock 
                            ? 'var(--danger-color)' 
                            : isLowStock 
                            ? 'var(--warning-color)' 
                            : 'var(--text-secondary)',
                        }}>
                          {isOutOfStock ? 'หมด' : isLowStock ? `ใกล้หมด (${product.stock})` : `${product.stock}`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clean Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t('page_info', { current: currentPage, total: totalPages })}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="btn"
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-color)',
                    background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)',
                    opacity: currentPage === 1 ? 0.35 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <ChevronLeft size={16} /> {t('prev_page')}
                </button>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="btn"
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-color)',
                    background: currentPage === totalPages ? 'transparent' : 'var(--bg-secondary)',
                    opacity: currentPage === totalPages ? 0.35 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  {t('next_page')} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Inline Cart */}
      {!isMobile && (
        <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column' }}>
          {renderCartContent()}
        </div>
      )}

      {/* Payment Modal */}
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

            {paymentMethod === 'CASH' && (
              <div className="mb-6">
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{t('amount_received')}</label>
                <input 
                  type="number" 
                  value={amountReceived}
                  onChange={e => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', fontSize: '1.25rem', padding: '0.8rem', borderRadius: 'var(--radius-md)' }}
                  autoFocus
                />
                {amountReceived && parseFloat(amountReceived) >= totalAmount && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--success-color)', fontWeight: 600 }}>
                    {t('change')}: ฿{changeAmount.toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <button 
                onClick={() => setPaymentMethod('')} 
                className="btn" 
                style={{ flex: 1, border: '1px solid var(--border-color)' }}
              >
                {t('cancel')}
              </button>
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
          <p style={{ textAlign: 'center', margin: '0 0 5px 0', fontSize: '12px' }}>{t('receipt')}</p>
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
            <span>{t('total')}:</span>
            <span>฿{totalAmount.toFixed(2)}</span>
          </div>
          {paymentMethod === 'CASH' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>{t('cash')}:</span>
                <span>฿{parseFloat(amountReceived || '0').toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>{t('change')}:</span>
                <span>฿{changeAmount.toFixed(2)}</span>
              </div>
            </>
          )}
          <p style={{ textAlign: 'center', margin: '20px 0 0 0', fontSize: '12px' }}>{t('thank_you')}</p>
        </div>
      </div>

      {/* Print Choice Modal */}
      {showPrintModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ textAlign: 'center' }}>
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
            style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} />
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} {t('items_purchased')}</span>
            </div>
            <span style={{ fontWeight: 700 }}>฿{totalAmount.toFixed(2)}</span>
          </button>
        </motion.div>
      )}

      {/* Mobile Cart Drawer/Modal */}
      {isMobile && isMobileCartOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            style={{ width: '100%', maxHeight: '85vh', background: 'var(--surface-color)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0 }}>{t('current_order')}</h3>
              <button onClick={() => setIsMobileCartOpen(false)} style={{ background: 'transparent' }}><X size={24} /></button>
            </div>
            {renderCartContent()}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
