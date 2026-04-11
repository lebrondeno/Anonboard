import React from 'react'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

// All icons: 24x24 viewBox, consistent 2px stroke, rounded caps/joins, no fill

export const IdeasIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21h6M10 18h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 9.5c0-1.66 1.34-3 3-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.5"/>
  </svg>
)

export const SuggestionsIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 8h8M8 12h8M8 16h5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <path d="M16 15l2 2 3-3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const DiscussionIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V6z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8h2a2 2 0 012 2v5a2 2 0 01-2 2h-1v2.5L15.5 17H13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="9" r="1" fill={color}/>
    <circle cx="12" cy="9" r="1" fill={color}/>
  </svg>
)

export const PollIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="12" width="4" height="9" rx="1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="10" y="7" width="4" height="14" rx="1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="17" y="3" width="4" height="18" rx="1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const AMAIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth}/>
    <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-1.5 2-2.5 2.5V13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="17" r="1" fill={color}/>
  </svg>
)

export const FeedbackIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CatchUpIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4h12a2 2 0 012 2v7a2 2 0 01-2 2H8l-4 3V6a2 2 0 012-2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5" cy="10.5" r="1" fill={color}/>
    <circle cx="12" cy="10.5" r="1" fill={color}/>
    <circle cx="15.5" cy="10.5" r="1" fill={color}/>
  </svg>
)

export const SurveyIcon = ({ size = 24, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 9h2M7 13h2M7 17h2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <circle cx="7" cy="9" r="1" stroke={color} strokeWidth={1.5}/>
    <circle cx="7" cy="13" r="1" stroke={color} strokeWidth={1.5}/>
    <circle cx="7" cy="17" r="1" stroke={color} strokeWidth={1.5}/>
    <path d="M11 9h6M11 13h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <path d="M14 16l1.5 1.5L18 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// Map session type to icon component
import type { SessionType } from '../lib/supabase'

export const SESSION_ICONS: Record<SessionType, React.FC<IconProps>> = {
  ideas:       IdeasIcon,
  suggestions: SuggestionsIcon,
  discussion:  DiscussionIcon,
  poll:        PollIcon,
  ama:         AMAIcon,
  feedback:    FeedbackIcon,
  catchup:     CatchUpIcon,
  survey:      SurveyIcon,
}

const TYPE_COLORS: Record<SessionType, { bg: string; icon: string; glow: string }> = {
  ideas:       { bg: '#EFF6FF', icon: '#2563EB', glow: 'rgba(37,99,235,0.15)'   },
  suggestions: { bg: '#ECFDF5', icon: '#059669', glow: 'rgba(5,150,105,0.15)'   },
  discussion:  { bg: '#F5F3FF', icon: '#7C3AED', glow: 'rgba(124,58,237,0.15)'  },
  poll:        { bg: '#FFFBEB', icon: '#D97706', glow: 'rgba(217,119,6,0.15)'   },
  ama:         { bg: '#F9FAFB', icon: '#4B5563', glow: 'rgba(75,85,99,0.15)'    },
  feedback:    { bg: '#FDF2F8', icon: '#DB2777', glow: 'rgba(219,39,119,0.15)'  },
  catchup:     { bg: '#EEF2FF', icon: '#4F46E5', glow: 'rgba(79,70,229,0.15)'   },
  survey:      { bg: '#F0F9FF', icon: '#0284C7', glow: 'rgba(2,132,199,0.15)'   },
}

const TYPE_COLORS_DARK: Record<SessionType, { bg: string; icon: string; glow: string }> = {
  ideas:       { bg: 'rgba(37,99,235,0.12)',   icon: '#60A5FA', glow: 'rgba(37,99,235,0.2)'   },
  suggestions: { bg: 'rgba(5,150,105,0.12)',   icon: '#34D399', glow: 'rgba(5,150,105,0.2)'   },
  discussion:  { bg: 'rgba(124,58,237,0.12)',  icon: '#A78BFA', glow: 'rgba(124,58,237,0.2)'  },
  poll:        { bg: 'rgba(217,119,6,0.12)',   icon: '#FCD34D', glow: 'rgba(217,119,6,0.2)'   },
  ama:         { bg: 'rgba(75,85,99,0.15)',    icon: '#9CA3AF', glow: 'rgba(75,85,99,0.2)'    },
  feedback:    { bg: 'rgba(219,39,119,0.12)',  icon: '#F472B6', glow: 'rgba(219,39,119,0.2)'  },
  catchup:     { bg: 'rgba(79,70,229,0.12)',   icon: '#818CF8', glow: 'rgba(79,70,229,0.2)'   },
  survey:      { bg: 'rgba(2,132,199,0.12)',   icon: '#38BDF8', glow: 'rgba(2,132,199,0.2)'   },
}

export function IconPill({ type, size = 40 }: { type: SessionType; size?: number }) {
  const Icon = SESSION_ICONS[type]
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const colors = isDark ? TYPE_COLORS_DARK[type] : TYPE_COLORS[type]
  const iconSize = Math.round(size * 0.55)

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.28),
      background: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 0 0 1px ${colors.glow}, 0 4px 12px ${colors.glow}`,
      transition: 'all 0.2s',
    }}>
      <Icon size={iconSize} color={colors.icon} strokeWidth={2} />
    </div>
  )
}

export function getTypeColors(type: SessionType, isDark = false) {
  return isDark ? TYPE_COLORS_DARK[type] : TYPE_COLORS[type]
}
