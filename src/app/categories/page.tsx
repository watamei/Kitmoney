'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tags, Plus, Tag, Edit2, Trash2, Check, X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface CategoryItem {
  id: number;
  name: string;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.ok) {
        setNewCategory('');
        fetchCategories();
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.error || t('add_category_failed'));
      }
    } catch (error) {
      console.error('Error adding category', error);
      alert(t('add_category_failed'));
    }
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (id: number) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.ok) {
        setEditingId(null);
        setEditName('');
        fetchCategories();
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.error || t('update_category_failed'));
      }
    } catch (error) {
      console.error('Error updating category', error);
      alert(t('update_category_failed'));
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!confirm(t('confirm_delete_category'))) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCategories();
      } else {
        const errorData = await res.json().catch(() => null);
        alert(errorData?.error || t('delete_category_failed'));
      }
    } catch (error) {
      console.error('Error deleting category', error);
      alert(t('delete_category_failed'));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <h1 className="mb-6" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Tags size={32} /> {t('categories')}
      </h1>

      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={24} /> {t('add_category')}
          </h2>
          <form onSubmit={handleAddCategory} className="flex gap-4 mt-6" style={{ flexDirection: 'column' }}>
            <input
              type="text"
              required
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder={t('enter_category_name')}
              style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)' }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn btn-primary"
              style={{ padding: '1rem' }}
            >
              {t('add_category')}
            </motion.button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={24} /> {t('existing_categories')}
          </h2>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {t('loading')}
            </div>
          ) : (
            <ul className="mt-4" style={{ listStyle: 'none', padding: 0 }}>
              <AnimatePresence>
                {categories.map((cat) => (
                  <motion.li
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    key={cat.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {editingId === cat.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-field"
                          style={{ flex: 1, padding: '0.4rem 0.75rem' }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(cat.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="icon-btn"
                          style={{ color: 'var(--success-color)' }}
                          title={t('save')}
                        >
                          <Check size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="icon-btn"
                          style={{ color: 'var(--text-secondary)' }}
                          title={t('cancel')}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--primary-color)',
                            }}
                          />
                          <span>{cat.name}</span>
                          {cat._count?.products !== undefined && (
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-secondary)',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-full)',
                              }}
                            >
                              {cat._count.products}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="icon-btn"
                            title={t('edit')}
                            style={{ padding: '0.35rem' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="icon-btn"
                            title={t('delete')}
                            style={{ color: 'var(--danger-color)', padding: '0.35rem' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
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
