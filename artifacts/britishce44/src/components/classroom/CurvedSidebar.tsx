import { useState } from 'react'

type NavItem = 'Board' | 'Grid' | 'Resources' | 'Chat' | 'Participants' | 'Polls' | 'Breakout' | 'Settings'

interface CurvedSidebarProps {
  activeItem: NavItem
  onNavigate: (item: NavItem) => void
  dir?: 'ltr' | 'rtl'
}

const NAV_ITEMS: NavItem[] = ['Board', 'Grid', 'Resources', 'Chat', 'Participants', 'Polls', 'Breakout', 'Settings']

const NAV_ICONS: Record<NavItem, string> = {
  Board: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  Grid: 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4z',
  Resources: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
  Chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z',
  Participants: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  Polls: 'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z',
  Breakout: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM9 11H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z',
  Settings: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.07.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
}

export function CurvedSidebar({ activeItem, onNavigate, dir = 'ltr' }: CurvedSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<NavItem | null>(null)

  return (
    <div
      dir={dir}
      className="relative flex flex-col justify-between"
      style={{
        width: '220px',
        minWidth: 180,
        height: 'calc(100vh - 12px)',
        margin: '6px',
        background: 'linear-gradient(180deg, #022080 0%, #082d96 45%, #031861 100%)',
        borderRadius: '28px 45px 28px 28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(2, 32, 128, 0.35)',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* S-Curved Wave Outer Border with Gold Accent */}
      <svg
        className="absolute right-0 top-0 h-full"
        width="36"
        height="100%"
        viewBox="0 0 36 800"
        preserveAspectRatio="none"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3e092" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#8a6713" />
          </linearGradient>
        </defs>
        <path
          d="M36 0 C -10 160, 45 320, 5 480 C -20 620, 36 720, 36 800 L 36 0 Z"
          fill="url(#goldGradient)"
          opacity="0.85"
        />
        <path
          d="M32 0 C -12 160, 41 320, 1 480 C -24 620, 32 720, 32 800 L 36 0 Z"
          fill="#022080"
        />
      </svg>

      {/* Floating Gold Ring Icon Header */}
      <div className="relative flex flex-col items-center pt-6 pb-2 z-10">
        <div
          className="relative flex items-center justify-center transition-transform hover:scale-105"
          style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #0933a8, #021a69)',
            border: '2.5px solid #d4af37',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.25)',
          }}
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" />
          </svg>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="relative flex-1 flex flex-col items-center gap-1.5 px-3 py-4 z-10 overflow-y-auto custom-scroll">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item
          const isHovered = hoveredItem === item

          return (
            <button
              key={item}
              onClick={() => onNavigate(item)}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
              style={{
                background: isActive
                  ? '#FFFDF7'
                  : isHovered
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'transparent',
                color: isActive ? '#022080' : '#FFFFFF',
                boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.2)' : 'none',
                border: isActive ? '1px solid #d4af37' : '1px solid transparent',
              }}
              title={item}
            >
              <svg
                className="flex-shrink-0"
                style={{ width: 20, height: 20 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={NAV_ICONS[item]} />
              </svg>
              <span className={`text-[14px] font-semibold truncate ${isActive ? 'text-[#022080]' : 'text-white'}`}>
                {item}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Bottom Styled Button (Matches 'Continue' button from reference) */}
      <div className="relative px-3 pb-5 pt-2 z-10 flex justify-center">
        <button
          className="w-full py-2.5 rounded-2xl font-bold text-white text-sm transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(180deg, #093abf 0%, #031b70 100%)',
            border: '2px solid #d4af37',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
