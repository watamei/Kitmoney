'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tags, Plus, Tag } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      });
      
      if (res.ok) {
        setNewCategory('');
        fetchCategories();
      } else {
        const err = await res.text();
        alert('Failed to add category: ' + err);
      }
    } catch (error) {
      console.error('Error adding category', error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <h1 className="mb-6" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Tags size={32} /> {t('categories')}</h1>
      
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={24} /> {t('add_category')}</h2>
          <form onSubmit={handleAddCategory} className="flex gap-4 mt-6" style={{ flexDirection: 'column' }}>
            <input
              type="text"
              required
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t('enter_category_name')}
              style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)' }}
            />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary" style={{ padding: '1rem' }}>
              {t('add_category')}
            </motion.button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={24} /> {t('existing_categories')}</h2>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('loading')}</div>
          ) : (
            <ul className="mt-4" style={{ listStyle: 'none', padding: 0 }}>
              <AnimatePresence>
                {categories.map((cat, i) => (
                  <motion.li 
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={cat} 
                    style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontWeight: 500
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)' }}></div>
                    {cat}
                  </motion.li>
                ))}
                {categories.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {t('no_categories')}
                  </div>
                )}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
