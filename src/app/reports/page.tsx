'use client';

import { useState, useEffect } from 'react';

type ReportData = {
  date: string;
  totalRevenue: number;
  totalCost: number;
  totalExpense: number;
  totalRestockCost: number;
  netProfit: number;
  netCashFlow: number;
  salesCount: number;
  startDate: string;
  endDate: string;
  sales: { createdAt: string; totalAmount: number; items: { product: { cost: number } | null; quantity: number }[] }[];
  expenses: { expenseDate: string; amount: number }[];
  restocks: { createdAt: string; totalCost: number }[];
};

import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ReceiptText, Calendar, PackagePlus, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/components/LanguageProvider';

export default function ReportsPage() {
  const { t, language } = useLanguage();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});
  const [focusedSeries, setFocusedSeries] = useState<string | null>(null);
  
  const [period, setPeriod] = useState('daily');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  async function fetchReport() {
    try {
      setLoading(true);
      const url = new URL('/api/reports', window.location.origin);
      url.searchParams.set('period', period);
      if (period === 'custom') {
        url.searchParams.set('startDate', startDate);
        url.searchParams.set('endDate', endDate);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line
    fetchReport();
  }, [period, startDate, endDate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const prepareChartData = () => {
    if (!report) return [];
    
    // Group by Date string based on period
    const grouped: Record<string, { name: string, Revenue: number, Cost: number, Expenses: number, Restock: number, NetProfit: number, CashFlow: number }> = {};

    const formatKey = (dateString: string) => {
      const d = new Date(dateString);
      if (period === 'daily') {
        return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      } else if (period === 'yearly') {
        return d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
      }
      return d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
    };

    report.sales.forEach(sale => {
      const key = formatKey(sale.createdAt);
      if (!grouped[key]) grouped[key] = { name: key, Revenue: 0, Cost: 0, Expenses: 0, Restock: 0, NetProfit: 0, CashFlow: 0 };
      grouped[key].Revenue += sale.totalAmount;
      
      let cost = 0;
      for (const item of sale.items) {
        if (item.product) cost += item.product.cost * item.quantity;
      }
      grouped[key].Cost += cost;
    });

    report.expenses.forEach(exp => {
      const key = formatKey(exp.expenseDate);
      if (!grouped[key]) grouped[key] = { name: key, Revenue: 0, Cost: 0, Expenses: 0, Restock: 0, NetProfit: 0, CashFlow: 0 };
      grouped[key].Expenses += exp.amount;
    });

    report.restocks.forEach(restock => {
      const key = formatKey(restock.createdAt);
      if (!grouped[key]) grouped[key] = { name: key, Revenue: 0, Cost: 0, Expenses: 0, Restock: 0, NetProfit: 0, CashFlow: 0 };
      grouped[key].Restock += restock.totalCost;
    });

    return Object.values(grouped).map(g => {
      g.NetProfit = g.Revenue - g.Cost - g.Expenses;
      g.CashFlow = g.Revenue - g.Restock - g.Expenses;
      return g;
    });
  };

  const toggleSeries = (dataKey: string) => {
    setHiddenSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  const handleCardClick = (series: string) => {
    setFocusedSeries(prev => prev === series ? null : series);
  };

  const getLineProps = (dataKey: string, defaultColor: string) => {
    const isFocused = focusedSeries === dataKey;
    const isOthersFocused = focusedSeries !== null && focusedSeries !== dataKey;

    return {
      type: "monotone" as const,
      dataKey,
      stroke: defaultColor,
      strokeWidth: isFocused ? 4 : isOthersFocused ? 2 : 3,
      strokeDasharray: isOthersFocused ? "5 5" : undefined,
      opacity: isOthersFocused ? 0.4 : 1,
      dot: { r: isFocused ? 6 : 4, fill: defaultColor, fillOpacity: isOthersFocused ? 0.4 : 1 },
      activeDot: { r: isFocused ? 8 : 6 },
      hide: hiddenSeries[dataKey]
    };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="animate-fade-in">
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <BarChart3 size={32} /> {t('reports_dashboard')}
          </h1>
          {report && (
            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {t('data_date')} {new Date(report.startDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })} 
              {new Date(report.startDate).toDateString() !== new Date(report.endDate).toDateString() && ` - ${new Date(report.endDate).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          )}
        </div>
        
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
      
      {loading && !report ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('loading_dashboard')}</div>
      ) : report ? (
        <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
          <motion.div 
            className="grid" 
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
          
          {/* Revenue Card */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick('Revenue')}
            className="card" 
            style={{ 
              borderTop: '4px solid var(--primary-color)', 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: focusedSeries === 'Revenue' ? '0 0 0 2px var(--primary-color)' : undefined
            }}
          >
            <DollarSign size={80} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: 'var(--primary-color)' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="var(--primary-color)" /> {t('total_revenue')}
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-primary)' }}>
              ฿{report.totalRevenue.toFixed(2)}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('from_transactions', { count: report.salesCount })}
            </p>
          </motion.div>

          {/* Cost Card */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick('Cost')}
            className="card" 
            style={{ 
              borderTop: '4px solid var(--warning-color)', 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: focusedSeries === 'Cost' ? '0 0 0 2px var(--warning-color)' : undefined
            }}
          >
            <ReceiptText size={80} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: 'var(--warning-color)' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={16} color="var(--warning-color)" /> {t('total_cost')}
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-primary)' }}>
              ฿{report.totalCost.toFixed(2)}
            </p>
          </motion.div>

          {/* Expense Card */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick('Expenses')}
            className="card" 
            style={{ 
              borderTop: '4px solid var(--danger-color)', 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: focusedSeries === 'Expenses' ? '0 0 0 2px var(--danger-color)' : undefined
            }}
          >
            <TrendingDown size={80} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: 'var(--danger-color)' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingDown size={16} color="var(--danger-color)" /> {t('other_expenses')}
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-primary)' }}>
              ฿{report.totalExpense.toFixed(2)}
            </p>
          </motion.div>

          {/* Restock Card */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick('Restock')}
            className="card" 
            style={{ 
              borderTop: '4px solid #8b5cf6', 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: focusedSeries === 'Restock' ? '0 0 0 2px #8b5cf6' : undefined
            }}
          >
            <PackagePlus size={80} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: '#8b5cf6' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PackagePlus size={16} color="#8b5cf6" /> {t('restock_investment')}
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--text-primary)' }}>
              ฿{report.totalRestockCost.toFixed(2)}
            </p>
          </motion.div>

          {/* Profit Card */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick('NetProfit')}
            className="card" 
            style={{ 
              borderTop: '4px solid var(--success-color)', 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: focusedSeries === 'NetProfit' ? '0 0 0 2px var(--success-color)' : undefined
            }}
          >
            <TrendingUp size={80} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: 'var(--success-color)' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="var(--success-color)" /> {t('net_profit')}
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0', color: report.netProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
              ฿{report.netProfit.toFixed(2)}
            </p>
          </motion.div>

          {/* Cash Flow Card */}
          <motion.div 
            variants={itemVariants} 
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick('CashFlow')}
            className="card" 
            style={{ 
              borderTop: '4px solid #0ea5e9', 
              position: 'relative', 
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: focusedSeries === 'CashFlow' ? '0 0 0 2px #0ea5e9' : undefined
            }}
          >
            <Wallet size={80} style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05, color: '#0ea5e9' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={16} color="#0ea5e9" /> {t('net_cash_flow')}
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0.5rem 0', color: report.netCashFlow >= 0 ? '#0ea5e9' : 'var(--danger-color)' }}>
              ฿{report.netCashFlow.toFixed(2)}
            </p>
          </motion.div>

        </motion.div>
        
        {report.sales.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card" style={{ overflowX: 'auto', marginTop: '2.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <BarChart3 size={20} /> {t('graph_overview')}
          </h3>
          <div style={{ width: '100%', height: 400, minWidth: '600px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prepareChartData()} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={(val) => `฿${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }} 
                  onClick={(e) => toggleSeries(e.dataKey as string)} 
                />
                <Line {...getLineProps('Revenue', 'var(--primary-color)')} />
                <Line {...getLineProps('Cost', 'var(--warning-color)')} />
                <Line {...getLineProps('Expenses', 'var(--danger-color)')} />
                <Line {...getLineProps('Restock', '#8b5cf6')} />
                <Line {...getLineProps('NetProfit', 'var(--success-color)')} />
                <Line {...getLineProps('CashFlow', '#0ea5e9')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ marginTop: '2.5rem' }}>
        <p className="card" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)', border: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>💡</span> 
          <span><strong>{t('formula')}</strong></span>
        </p>
      </motion.div>
        </div>
      ) : null}
    </motion.div>
  );
}
