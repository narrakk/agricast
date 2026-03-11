import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import CropReport from './pages/CropReport';

const NAV = [
  { id: 'dashboard', icon: '⚡', label: 'Dashboard' },
  { id: 'map',       icon: '🗺',  label: 'Weather Map' },
  { id: 'crop',      icon: '🌱',  label: 'Crop Planner' },
];

export default function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 'var(--sidebar-w)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 20,
        gap: 8,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.7)',
        boxShadow: '4px 0 24px rgba(60,120,90,0.06)',
      }}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            width: 44, height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #2ECC8A, #48B8E8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 16px rgba(46,204,138,0.35)',
            marginBottom: 12,
            cursor: 'default'
          }}
        >
          🌱
        </motion.div>

        {/* Nav items */}
        {NAV.map((item, i) => (
          <motion.button
            key={item.id}
            className={`nav-icon ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            title={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            whileTap={{ scale: 0.92 }}
            style={{ position: 'relative' }}
          >
            {item.icon}
            {page === item.id && (
              <motion.div
                layoutId="activeIndicator"
                style={{
                  position: 'absolute',
                  left: -2,
                  width: 4, height: 28,
                  background: 'linear-gradient(180deg, #2ECC8A, #48B8E8)',
                  borderRadius: '0 4px 4px 0',
                  top: '50%', transform: 'translateY(-50%)',
                }}
              />
            )}
          </motion.button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Settings icon */}
        <motion.button
          className="nav-icon"
          title="Settings"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          ⚙️
        </motion.button>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        marginLeft: 'var(--sidebar-w)',
        padding: '24px 28px',
        minHeight: '100vh',
        maxWidth: 'calc(100vw - var(--sidebar-w))',
        overflow: 'hidden',
      }}>
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 style={{ fontFamily: 'Nunito', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
              {NAV.find(n => n.id === page)?.label}
            </h1>
          </div>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.9)',
            borderRadius: 16, padding: '9px 16px',
            boxShadow: '0 2px 12px rgba(60,120,90,0.08)',
            minWidth: 220,
          }}>
            <span style={{ fontSize: 16, opacity: 0.6 }}>🔍</span>
            <input
              placeholder="Search location..."
              style={{
                border: 'none', outline: 'none',
                background: 'transparent',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13, color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>

          {/* Action icons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['📅', '🔔', '👤'].map((icon, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(255,255,255,0.7)',
                  border: '1.5px solid rgba(255,255,255,0.9)',
                  cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(60,120,90,0.06)',
                }}
              >
                {icon}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Page content with animated transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.34, 1.12, 0.64, 1] }}
          >
            {page === 'dashboard' && <Dashboard />}
            {page === 'map'       && <MapPage />}
            {page === 'crop'      && <CropReport />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
