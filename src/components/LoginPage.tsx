'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthProvider';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [greetingPhrase, setGreetingPhrase] = useState('กำลังเข้าสู่ระบบ...');

  const phrases = [
    "วันนี้พร้อมรับออเดอร์ปังๆ หรือยัง?",
    "ดื่มกาแฟสักแก้วก่อนเริ่มงานไหม?",
    "วันนี้เป้าหมายยอดขายเท่าไหร่ดี?",
    "พร้อมจะรวยหรือยัง?",
    "พักผ่อนเพียงพอไหมเมื่อคืน?",
    "วันนี้มีสินค้าตัวไหนน่าเชียร์เป็นพิเศษไหม?",
    "เหนื่อยไหม สู้ๆ นะ!",
    "วันนี้อากาศดีนะ พร้อมลุยหรือยัง?",
    "เตรียมตัวรับทรัพย์รัวๆ หรือยัง?",
    "วันนี้ลูกค้าเยอะแน่ๆ พร้อมไหม?"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    setIsLoggingIn(true);

    // Small delay for feel
    await new Promise(r => setTimeout(r, 600));

    const success = await login(username, password);
    if (success) {
      setGreetingPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
      setShowSuccess(true);
      // Show welcome screen for a comfortable moment
      await new Promise(r => setTimeout(r, 2500));
      onLoginSuccess();
    } else {
      setError('ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง');
      setIsLoggingIn(false);
    }
  };

  // Floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 30%, #1b2838 60%, #0a0a1a 100%)',
      overflow: 'hidden',
    }}>
      {/* Animated gradient orbs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -80, 60, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,113,227,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 100, -60, 0],
            scale: [1, 0.8, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <motion.div
          animate={{
            x: [0, 60, -90, 0],
            y: [0, -50, 80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '50%',
            right: '30%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Floating particles */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            animate={{
              y: [p.y + '%', (p.y - 30) + '%', p.y + '%'],
              x: [p.x + '%', (p.x + 10) + '%', p.x + '%'],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: p.size + 'px',
              height: p.size + 'px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      {/* Success animation overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)',
            }}
          >
            {/* Expanding ring */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 3, 6], opacity: [1, 0.5, 0] }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '3px solid rgba(0,113,227,0.5)',
              }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 3, 6], opacity: [1, 0.5, 0] }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
              style={{
                position: 'absolute',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '2px solid rgba(52,199,89,0.4)',
              }}
            />

            {/* Logo reveal */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: [0, 1.2, 1], rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,113,227,0.4)',
                marginBottom: '2rem',
                border: '4px solid #fff',
              }}
            >
              <img src="/logo.gif" alt="KidYa Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                color: '#f5f5f7',
                fontSize: '1.5rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              ยินดีต้อนรับ!
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              style={{
                color: '#86868b',
                fontSize: '1rem',
                marginTop: '0.5rem',
              }}
            >
              {greetingPhrase}
            </motion.p>

            {/* Loading dots */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '2rem' }}>
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -12, 0],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: 'easeInOut',
                  }}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0071e3, #2997ff)',
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '420px',
          padding: '0 1.5rem',
        }}
      >
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '3rem 2.5rem',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,113,227,0.3)',
              marginBottom: '1.25rem',
              border: '3px solid rgba(255,255,255,0.8)',
              display: 'inline-block',
            }}>
              <img src="/logo.gif" alt="KidYa Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#f5f5f7',
              margin: 0,
              letterSpacing: '-0.03em',
              fontFamily: 'var(--font-outfit)',
            }}>
              KidYa
            </h1>
            <p style={{
              color: '#86868b',
              fontSize: '0.9rem',
              marginTop: '0.5rem',
            }}>
              Luxury Pharmacy POS
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{ marginBottom: '1.25rem' }}
            >
              <label style={{
                display: 'block',
                color: '#86868b',
                fontSize: '0.8rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                ชื่อผู้ใช้
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#86868b',
                  pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  placeholder="Username"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    color: '#f5f5f7',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(0,113,227,0.5)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(0,113,227,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{ marginBottom: '1.75rem' }}
            >
              <label style={{
                display: 'block',
                color: '#86868b',
                fontSize: '0.8rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                รหัสผ่าน
              </label>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  color: '#86868b',
                  pointerEvents: 'none',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 44px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    color: '#f5f5f7',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(0,113,227,0.5)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(0,113,227,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#86868b',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255,59,48,0.1)',
                    border: '1px solid rgba(255,59,48,0.2)',
                    borderRadius: '12px',
                    color: '#ff453a',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <AlertCircle size={16} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,113,227,0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                padding: '15px',
                background: isLoggingIn
                  ? 'linear-gradient(135deg, #0071e3, #2997ff)'
                  : 'linear-gradient(135deg, #0071e3, #2997ff)',
                border: 'none',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: 600,
                cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 20px rgba(0,113,227,0.3)',
                transition: 'all 0.3s ease',
                opacity: isLoggingIn ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {isLoggingIn ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                    }}
                  />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  เข้าสู่ระบบ
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '0.8rem',
            marginTop: '2rem',
          }}
        >
          © 2026 KidYa · Pharmacy POS System
        </motion.p>
      </motion.div>
    </div>
  );
}
