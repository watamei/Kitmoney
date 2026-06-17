'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import LoginPage from '@/components/LoginPage';
import { Sidebar } from '@/components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

type Phase = 'splash' | 'login' | 'app';

function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [phase, setPhase] = useState<Phase>('splash');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        setPhase('app');
      } else {
        setPhase('login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    setPhase('app');
  }, []);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      {/* ===== SPLASH SCREEN ===== */}
      <AnimatePresence>
        {phase === 'splash' && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 40%, #1b2838 70%, #0a0a1a 100%)',
              overflow: 'hidden',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,113,227,0.25) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8, type: 'spring', stiffness: 150, damping: 15 }}
              style={{
                width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 60px rgba(0,113,227,0.3), 0 0 120px rgba(0,113,227,0.1)',
                zIndex: 1,
              }}
            >
              <img src="/logo.gif" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
              style={{ color: '#f5f5f7', fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em', marginTop: '1.5rem', zIndex: 1 }}
            >
              KidYa
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              style={{ color: '#86868b', fontSize: '0.9rem', marginTop: '0.5rem', zIndex: 1 }}
            >
              Luxury Pharmacy POS
            </motion.p>
            <motion.div
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: '120px' }}
              transition={{ delay: 1.2, duration: 0.4 }}
              style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', marginTop: '2.5rem', overflow: 'hidden', zIndex: 1 }}
            >
              <motion.div
                initial={{ x: '-100%' }} animate={{ x: '100%' }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
                style={{ width: '60%', height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, transparent, #0071e3, transparent)' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== LOGIN PAGE ===== */}
      <AnimatePresence>
        {phase === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeInOut' }}>
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN APP ===== */}
      <AnimatePresence>
        {phase === 'app' && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="app-layout"
          >
            {/* Mobile hamburger button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>

            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
              {children}
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
