import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

export default function StatCard({ icon, value, label, color = 'var(--accent-blue)', trend, trendLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }}
      className="glass stat"
      style={{
        background: `linear-gradient(135deg, var(--glass) 0%, rgba(${color === 'var(--accent-red)' ? '239,68,68' : color === 'var(--accent-amber)' ? '245,158,11' : color === 'var(--accent-green)' ? '34,197,94' : color === 'var(--accent-purple)' ? '139,92,246' : '59,130,246'},0.06) 100%)`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="stat-val" style={{ color }}>{value}</div>
          <div className="stat-label">{label}</div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: '1.1rem',
        }}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.72rem', fontWeight: 600,
          color: trend >= 0 ? '#4ade80' : '#f87171',
        }}>
          {trend >= 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
          {trend >= 0 ? '+' : ''}{trend}% {trendLabel || ''}
        </div>
      )}
    </motion.div>
  );
}
