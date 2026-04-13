import React from 'react';

const FLOOR_LAYOUT = [
  { id: 'Rooftop', label: 'Rooftop', y: 20, color: '#8b5cf6' },
  { id: 'Floor 5', label: 'Floor 5', y: 70, color: '#6366f1' },
  { id: 'Floor 4', label: 'Floor 4', y: 120, color: '#3b82f6' },
  { id: 'Floor 3', label: 'Floor 3', y: 170, color: '#06b6d4' },
  { id: 'Floor 2', label: 'Floor 2', y: 220, color: '#14b8a6' },
  { id: 'Floor 1', label: 'Floor 1', y: 270, color: '#22c55e' },
  { id: 'Lobby', label: 'Lobby', y: 320, color: '#f59e0b' },
];

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#22c55e',
};

export default function VenueMap({ crises = [], staff = [], onCrisisClick }) {
  // Group crises by floor
  const crisesByFloor = {};
  let isEvacuationActive = false;
  let criticalFloors = new Set();

  crises.forEach(c => {
    const floor = c.floor || 'Unknown';
    if (!crisesByFloor[floor]) crisesByFloor[floor] = [];
    crisesByFloor[floor].push(c);
    if (c.severity === 'critical' && ['reported', 'assigned', 'acknowledged', 'responding'].includes(c.status)) {
      isEvacuationActive = true;
      criticalFloors.add(floor);
    }
  });

  const staffByFloor = {};
  staff.forEach(s => {
    const floor = s.floor || 'Unknown';
    if (!staffByFloor[floor]) staffByFloor[floor] = [];
    staffByFloor[floor].push(s);
  });

  // Calculate paths for active critical crises
  const paths = [];
  if (isEvacuationActive) {
    criticalFloors.forEach(floorId => {
      const floorIdx = FLOOR_LAYOUT.findIndex(f => f.id === floorId);
      if (floorIdx >= 0 && floorIdx < FLOOR_LAYOUT.length - 1) { // Not lobby
        const startY = FLOOR_LAYOUT[floorIdx].y + 19;
        const endY = FLOOR_LAYOUT[FLOOR_LAYOUT.length - 1].y + 19; // Lobby
        
        // Path to left stairwell
        paths.push(`M 140 ${startY} L 55 ${startY} L 55 ${endY} L 100 ${endY}`);
        // Path to right stairwell
        paths.push(`M 460 ${startY} L 545 ${startY} L 545 ${endY} L 500 ${endY}`);
      }
    });
  }

  return (
    <div className="glass anim-up" style={{ padding: '20px', overflow: 'hidden', position: 'relative' }}>
      
      {isEvacuationActive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, 
          background: 'rgba(239, 68, 68, 0.9)', 
          color: '#fff', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, padding: 4, letterSpacing: 1, zIndex: 10,
          animation: 'pulse-bg 2s infinite'
        }}>
          🚨 CRITICAL EVACUATION PROTOCOL ACTIVE 🚨
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: isEvacuationActive ? 16 : 0 }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>🏨 Venue Map</h3>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.68rem', color: 'var(--text-dim)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} /> Crisis
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Staff
          </span>
        </div>
      </div>

      <style>{`
        @keyframes dashflow {
          to { stroke-dashoffset: -40; }
        }
        @keyframes pulse-bg {
          0%, 100% { background-color: rgba(239, 68, 68, 0.8); }
          50% { background-color: rgba(220, 38, 38, 1); }
        }
      `}</style>

      <svg viewBox="0 0 600 370" style={{ width: '100%', height: 'auto' }}>
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke={isEvacuationActive ? "rgba(239,68,68,0.05)" : "rgba(75,85,99,0.1)"} strokeWidth="0.5" />
          </pattern>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width="600" height="370" fill="url(#grid)" rx="8" />

        {/* Render Evacuation Paths */}
        {paths.map((d, i) => (
          <path
            key={`path-${i}`}
            d={d}
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeDasharray="8 6"
            filter="url(#glow)"
            style={{ animation: 'dashflow 1.5s linear infinite' }}
          />
        ))}

        {FLOOR_LAYOUT.map((floor) => {
          const floorCrises = crisesByFloor[floor.id] || [];
          const floorStaff = staffByFloor[floor.id] || [];
          const hasActive = floorCrises.some(c => ['reported', 'assigned', 'acknowledged', 'responding'].includes(c.status));
          const isCriticalFloor = criticalFloors.has(floor.id);
          
          const floorFill = isCriticalFloor ? 'rgba(239,68,68,0.15)' : 
                            hasActive ? 'rgba(239,68,68,0.06)' : 
                            isEvacuationActive ? 'rgba(0,0,0,0.4)' : 'rgba(75,85,99,0.06)';
          
          const floorStroke = isCriticalFloor ? 'rgba(239,68,68,0.6)' : 
                              hasActive ? 'rgba(239,68,68,0.25)' : 
                              isEvacuationActive ? 'rgba(75,85,99,0.05)' : 'rgba(75,85,99,0.15)';

          return (
            <g key={floor.id} style={{ opacity: isEvacuationActive && !isCriticalFloor && floor.id !== 'Lobby' && !hasActive ? 0.4 : 1 }}>
              {/* Floor rectangle */}
              <rect
                x={70} y={floor.y} width={460} height={38} rx={6}
                fill={floorFill}
                stroke={floorStroke}
                strokeWidth={isCriticalFloor ? 2 : 1}
              />

              {/* Floor label */}
              <text x={50} y={floor.y + 24} fill={isCriticalFloor ? '#ef4444' : "var(--text-muted)"} fontSize={10} fontWeight={600} textAnchor="end" fontFamily="Inter, sans-serif">
                {floor.label}
              </text>

              {/* Room segments */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <rect
                  key={i}
                  x={80 + i * 55} y={floor.y + 4} width={45} height={30} rx={3}
                  fill={isEvacuationActive && !isCriticalFloor ? "rgba(0,0,0,0.2)" : "rgba(75,85,99,0.08)"}
                  stroke={isEvacuationActive ? "rgba(255,255,255,0.02)" : "rgba(75,85,99,0.1)"}
                  strokeWidth={0.5}
                />
              ))}

              {/* Crisis markers */}
              {floorCrises.map((crisis, i) => {
                const isActive = ['reported', 'assigned', 'acknowledged', 'responding'].includes(crisis.status);
                const cx = 100 + i * 60 + Math.random() * 20;
                const cy = floor.y + 19;
                return (
                  <g key={crisis.id} style={{ cursor: 'pointer' }} onClick={() => onCrisisClick?.(crisis)}>
                    {isActive && crisis.severity === 'critical' && (
                      <circle cx={cx} cy={cy} r={14} fill="none" stroke="rgba(239,68,68,0.5)" strokeWidth={2}>
                        <animate attributeName="r" values="10;24;10" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle
                      cx={cx} cy={cy} r={7}
                      fill={SEVERITY_COLORS[crisis.severity] || '#3b82f6'}
                      stroke={isActive && crisis.severity === 'critical' ? '#fff' : "rgba(0,0,0,0.3)"}
                      strokeWidth={isActive && crisis.severity === 'critical' ? 1.5 : 1}
                    />
                    <text x={cx} y={cy + 3} fill="#fff" fontSize={7} textAnchor="middle" fontWeight={700}>
                      {crisis.type === 'fire' ? '🔥' : crisis.type === 'medical' ? '🏥' : crisis.type === 'security' ? '🔒' : '⚠'}
                    </text>
                  </g>
                );
              })}

              {/* Staff dots */}
              {floorStaff.map((member, i) => {
                const cx = 440 - i * 20;
                const cy = floor.y + 19;
                const color = member.status === 'available' ? '#22c55e' : member.status === 'responding' ? '#f59e0b' : '#64748b';
                return (
                  <g key={member.id}>
                    <circle cx={cx} cy={cy} r={6} fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
                    <title>{member.name} ({member.role}) - {member.status}</title>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Building outline */}
        <rect x={68} y={16} width={465} height={348} rx={8} fill="none" stroke={isEvacuationActive ? "rgba(239,68,68,0.3)" : "rgba(75,85,99,0.2)"} strokeWidth={isEvacuationActive ? 2 : 1} strokeDasharray="4,4" />

        {/* Building name */}
        <text x={300} y={362} fill={isEvacuationActive ? "rgba(239,68,68,0.8)" : "var(--text-dim)"} fontSize={8} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={isEvacuationActive ? 700 : 400}>
          Grand Horizon Hotel & Convention Center
        </text>
      </svg>
    </div>
  );
}
