interface Props {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: Props) {
  return (
    <div style={{
      width, height,
      borderRadius,
      background: 'var(--surface3)',
      animation: 'skeletonPulse 1.6s ease-in-out infinite',
      ...style,
    }} />
  )
}

// Pre-built skeleton layouts for common screens
export function ResponseCardSkeleton() {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.1rem 1.25rem', marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <Skeleton width={60} height={22} borderRadius={20} />
        <Skeleton width={50} height={14} />
      </div>
      <Skeleton height={16} style={{ marginBottom:6 }} />
      <Skeleton height={16} width="80%" style={{ marginBottom:6 }} />
      <Skeleton height={16} width="60%" />
    </div>
  )
}

export function SessionCardSkeleton() {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem 1.5rem', marginBottom:10 }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <Skeleton width={42} height={42} borderRadius={12} />
        <div style={{ flex:1 }}>
          <Skeleton height={14} width={60} style={{ marginBottom:8 }} />
          <Skeleton height={18} style={{ marginBottom:6 }} />
          <Skeleton height={14} width="70%" />
        </div>
        <div style={{ textAlign:'right' }}>
          <Skeleton width={32} height={28} />
          <Skeleton width={32} height={12} style={{ marginTop:4 }} />
        </div>
      </div>
    </div>
  )
}

export function AdminHeaderSkeleton() {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem 1.5rem', marginBottom:14 }}>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <div style={{ flex:1 }}>
          <Skeleton height={12} width={50} style={{ marginBottom:8 }} />
          <Skeleton height={20} style={{ marginBottom:6 }} />
          <Skeleton height={14} width="60%" />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <Skeleton height={72} borderRadius={10} />
        <Skeleton height={72} borderRadius={10} />
      </div>
      <Skeleton height={44} borderRadius={8} />
    </div>
  )
}
