import React from 'react'
import type { SessionType } from '../lib/supabase'

interface IconProps { size?: number; color?: string; strokeWidth?: number }

export const OpenFloorIcon = ({ size=24, color='currentColor', strokeWidth=2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 6a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 3v-3H5a2 2 0 01-2-2V6z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 8h2a2 2 0 012 2v5a2 2 0 01-2 2h-1v2.5L15.5 17H13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8" cy="9" r="1" fill={color}/><circle cx="12" cy="9" r="1" fill={color}/>
  </svg>
)

export const QAIcon = ({ size=24, color='currentColor', strokeWidth=2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth}/>
    <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-1.5 2-2.5 2.5V13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="17" r="1" fill={color}/>
  </svg>
)

export const FeedbackIcon = ({ size=24, color='currentColor', strokeWidth=2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const PollIcon = ({ size=24, color='currentColor', strokeWidth=2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3"  y="12" width="4" height="9" rx="1" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <rect x="10" y="7"  width="4" height="14" rx="1" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <rect x="17" y="3"  width="4" height="18" rx="1" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"/>
  </svg>
)

export const SurveyIcon = ({ size=24, color='currentColor', strokeWidth=2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <circle cx="7.5" cy="9"  r="1.5" stroke={color} strokeWidth={1.5}/>
    <circle cx="7.5" cy="13" r="1.5" stroke={color} strokeWidth={1.5}/>
    <circle cx="7.5" cy="17" r="1.5" stroke={color} strokeWidth={1.5}/>
    <path d="M11 9h6M11 13h4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <path d="M14 16l1.5 1.5L18 15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export const CatchUpIcon = ({ size=24, color='currentColor', strokeWidth=2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 4h12a2 2 0 012 2v7a2 2 0 01-2 2H8l-4 3V6a2 2 0 012-2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="8.5"  cy="10.5" r="1" fill={color}/>
    <circle cx="12"   cy="10.5" r="1" fill={color}/>
    <circle cx="15.5" cy="10.5" r="1" fill={color}/>
  </svg>
)

export const SESSION_ICONS: Record<SessionType, React.FC<IconProps>> = {
  openfloor: OpenFloorIcon,
  qa:        QAIcon,
  feedback:  FeedbackIcon,
  poll:      PollIcon,
  survey:    SurveyIcon,
  catchup:   CatchUpIcon,
}

const TYPE_COLORS: Record<SessionType, { bg: string; icon: string; glow: string }> = {
  openfloor: { bg:'#EFF6FF', icon:'#2563EB', glow:'rgba(37,99,235,0.15)'  },
  qa:        { bg:'#F5F3FF', icon:'#7C3AED', glow:'rgba(124,58,237,0.15)' },
  feedback:  { bg:'#FDF2F8', icon:'#DB2777', glow:'rgba(219,39,119,0.15)' },
  poll:      { bg:'#FFFBEB', icon:'#D97706', glow:'rgba(217,119,6,0.15)'  },
  survey:    { bg:'#F0FDFA', icon:'#0891B2', glow:'rgba(8,145,178,0.15)'  },
  catchup:   { bg:'#ECFDF5', icon:'#059669', glow:'rgba(5,150,105,0.15)'  },
}

const TYPE_COLORS_DARK: Record<SessionType, { bg: string; icon: string; glow: string }> = {
  openfloor: { bg:'rgba(37,99,235,0.12)',   icon:'#93C5FD', glow:'rgba(37,99,235,0.22)'   },
  qa:        { bg:'rgba(124,58,237,0.12)',  icon:'#C4B5FD', glow:'rgba(124,58,237,0.22)'  },
  feedback:  { bg:'rgba(219,39,119,0.12)',  icon:'#F9A8D4', glow:'rgba(219,39,119,0.22)'  },
  poll:      { bg:'rgba(217,119,6,0.12)',   icon:'#FDE68A', glow:'rgba(217,119,6,0.22)'   },
  survey:    { bg:'rgba(8,145,178,0.12)',   icon:'#A5F3FC', glow:'rgba(8,145,178,0.22)'   },
  catchup:   { bg:'rgba(5,150,105,0.12)',   icon:'#6EE7B7', glow:'rgba(5,150,105,0.22)'   },
}

export const TYPE_ACCENT: Record<SessionType, string> = {
  openfloor: '#2563EB', qa: '#7C3AED', feedback: '#DB2777',
  poll: '#D97706', survey: '#0891B2', catchup: '#059669',
}

export function getTypeColors(type: SessionType, isDark = false) {
  return isDark ? TYPE_COLORS_DARK[type] : TYPE_COLORS[type]
}

export function IconPill({ type, size = 40 }: { type: SessionType; size?: number }) {
  const Icon = SESSION_ICONS[type]
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const colors = isDark ? TYPE_COLORS_DARK[type] : TYPE_COLORS[type]
  const iconSize = Math.round(size * 0.52)
  return (
    <div style={{ width:size, height:size, borderRadius:Math.round(size*.26), background:colors.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 0 1px ${colors.glow},0 4px 12px ${colors.glow}`, transition:'all .2s' }}>
      <Icon size={iconSize} color={colors.icon} strokeWidth={2} />
    </div>
  )
}
