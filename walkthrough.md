# CrisisBeacon — Build Walkthrough

**"When seconds matter, every signal counts."**

A real-time crisis detection and response coordination platform for hospitality venues.

---

## Architecture

```
CrisisBeacon/
├── backend/                          # Node.js + Express + Socket.io
│   ├── server.js                    # Entry point (REST + WebSocket)
│   ├── store.js                     # In-memory data store + analytics
│   ├── seed.js                      # 8 demo staff + venue config
│   ├── engine/
│   │   ├── triage.js                # Smart severity classifier
│   │   └── assignment.js            # Staff auto-assignment (role + floor)
│   └── routes/
│       ├── crises.js                # Crisis CRUD + lifecycle
│       ├── staff.js                 # Staff management + venue
│       └── analytics.js             # Aggregated metrics
│
└── frontend/                         # React 19 + Vite + Tailwind + Recharts
    └── src/
        ├── App.jsx                  # Router + Socket.io + toast alerts
        ├── index.css                # Dark command center design system
        ├── hooks/useSocket.js       # Socket.io React hook
        ├── services/api.js          # Axios REST client
        ├── components/
        │   ├── Navbar.jsx           # Sticky nav with LIVE indicator
        │   ├── CrisisCard.jsx       # Crisis card with pulse animation
        │   ├── SeverityBadge.jsx    # CRITICAL/HIGH/MEDIUM/LOW badges
        │   ├── StatCard.jsx         # Stats with color gradients
        │   ├── StaffBadge.jsx       # Staff member with status
        │   └── VenueMap.jsx         # Interactive SVG floor plan
        └── pages/
            ├── CommandCenter.jsx    # Main dashboard
            ├── GuestSOS.jsx         # Emergency report form
            ├── StaffView.jsx        # Staff roster + actions
            ├── CrisisDetail.jsx     # Timeline + protocols
            ├── Analytics.jsx        # Charts + leaderboard
            └── NotFound.jsx         # 404 page
```

---

## Pages Built

### 1. 🖥️ Command Center (Dashboard)

The main dashboard with:
- **6 stat cards** — Active Crises, Critical count, Resolved, Staff Available, Avg Response, Total Incidents
- **Filtered crisis feed** — All, Active, Critical, High, Medium, Low, Resolved
- **Interactive SVG venue map** — 7 floors with crisis markers (pulsing red for critical) and staff dots (green/amber)
- **Recent activity timeline** — Click to drill into any crisis

![Command Center - Empty](C:/Users/ASHIQ RAHMAN/.gemini/antigravity/brain/115af45f-9494-43dd-a009-c1499f493635/dashboard.png)

![Command Center - With Crisis](C:/Users/ASHIQ RAHMAN/.gemini/antigravity/brain/115af45f-9494-43dd-a009-c1499f493635/dashboard_with_crisis.png)

### 2. 🚨 Guest SOS Portal

Zero-friction emergency reporting:
- **Big pulsing SOS button** with ring animation
- **12 crisis type grid** — Fire, Medical, Security, Gas Leak, Flood, Active Threat, etc.
- **Floor/room selection** — pre-fillable via QR code URL params
- **Description and reporter info** — optional for fastest possible reporting
- **Success screen** — "Help Is On The Way" with auto-redirect

![Guest SOS](C:/Users/ASHIQ RAHMAN/.gemini/antigravity/brain/115af45f-9494-43dd-a009-c1499f493635/sos.png)

![SOS Confirmation](C:/Users/ASHIQ RAHMAN/.gemini/antigravity/brain/115af45f-9494-43dd-a009-c1499f493635/sos_confirm.png)

### 3. 👷 Staff Board

Staff management with full crisis workflow:
- **8 staff members** with role icons, floor, status badges, crises handled count
- **Role filters** — All, Security, Medical, Maintenance, Management
- **Inline crisis actions** — Acknowledge → Responding → Resolve buttons appear for assigned staff
- **Resolution modal** — with notes field

![Staff Board](C:/Users/ASHIQ RAHMAN/.gemini/antigravity/brain/115af45f-9494-43dd-a009-c1499f493635/staff.png)

### 4. 📋 Crisis Detail

Full crisis timeline and context:
- **Header** — Type icon, severity/status badges, action buttons
- **Metadata grid** — Floor, room, reporter, timestamp, assigned staff, response time
- **Timeline** — Color-coded events (blue for human, red for system)
- **Response protocols** — Numbered checklist based on crisis type
- **Resolution notes** — if resolved

![Crisis Detail](C:/Users/ASHIQ RAHMAN/.gemini/antigravity/brain/115af45f-9494-43dd-a009-c1499f493635/detail.png)

### 5. 📊 Analytics

Performance metrics and insights:
- **6 stat cards** — Total, Active, Resolved, Avg Response, Avg Resolution, Staff Ready
- **Bar chart** — Crises by type
- **Donut chart** — Severity breakdown with legend
- **Horizontal bar chart** — Incident hotspots by floor
- **Area chart** — Response time trend
- **Staff leaderboard** — Ranked by crises handled with 🥇🥈🥉 medals

![Analytics](C:/Users/ASHIQ RAHMAN/.gemini/antigravity/brain/115af45f-9494-43dd-a009-c1499f493635/analytics.png)

---

## Key Features

| Feature | Implementation |
|---------|---------------|
| **Real-time updates** | Socket.io — crises appear instantly on all connected dashboards |
| **Smart triage** | Auto-classifies severity from type + keywords + cluster detection |
| **Auto-assignment** | Matches best staff by role, floor proximity, and experience |
| **Toast notifications** | react-hot-toast for crisis alerts (top-right) |
| **Alert sounds** | WebAudio API beep on critical crises |
| **Pulse animations** | CSS animation on critical crisis cards and venue map markers |
| **SVG venue map** | 7-floor hotel layout with live crisis/staff markers |
| **Full lifecycle** | Reported → Assigned → Acknowledged → Responding → Resolved |

---

## How to Run

```bash
# Terminal 1 — Backend (port 3001)
cd CrisisBeacon/backend
npm install
node server.js

# Terminal 2 — Frontend (port 5173)
cd CrisisBeacon/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Flow (60 seconds)

1. Open **Command Center** on main screen — "All clear, 8/8 staff available"
2. Open **Guest SOS** (simulates phone scan) → tap 🔥 Fire → Floor 3, Room 302
3. Hit **Report Emergency** → See "Help Is On The Way" confirmation
4. Switch to **Command Center** — Fire crisis card appears with CRITICAL badge, venue map lights up Floor 3
5. Go to **Staff Board** — Sunita Reddy shows "RESPONDING" with action buttons
6. Click **Acknowledge** → **Responding** → **Resolve** with notes
7. Check **Analytics** — 1 incident, severity chart, response time logged

---

## Tested & Verified

- ✅ Command Center renders with stats, crisis feed, venue map
- ✅ Guest SOS submits crisis → auto-triage → auto-assignment
- ✅ Real-time Socket.io updates across pages
- ✅ Staff Board shows assignments with action buttons
- ✅ Crisis Detail page with timeline + protocols
- ✅ Analytics renders charts (Recharts bar, pie, area)
- ✅ Toast notifications appear on new/resolved crises
- ✅ Full crisis lifecycle: report → assign → acknowledge → respond → resolve
