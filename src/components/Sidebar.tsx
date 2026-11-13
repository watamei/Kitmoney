'use client';

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { ShoppingCart, Package, Tags, BarChart3, Languages, History, LogOut, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useAuth();

  const navLinks = [
    { href: '/', icon: ShoppingCart, label: t('pos') },
    { href: '/inventory', icon: Package, label: t('inventory') },
    { href: '/categories', icon: Tags, label: t('categories') },
    { href: '/reports', icon: BarChart3, label: t('reports') },
    { href: '/history', icon: History, label: t('sales_history') },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        {/* Close button (mobile only) */}
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.gif" alt="Logo" className="logo-icon" />
          </div>
          <div>
            <h2>{t('kitmoney')}</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('premium_pos')}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="nav-link" onClick={onClose}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <Languages size={16} />
            {language === 'th' ? 'EN' : 'TH'}
          </button>
          <ThemeToggle />
          <button
            onClick={logout}
            title="ออกจากระบบ"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255,59,48,0.1)',
              border: '1px solid rgba(255,59,48,0.2)',
              color: 'var(--danger-color)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
