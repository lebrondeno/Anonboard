import { useState } from 'react'

export type Sticker = {
  id: string
  emoji: string
  label: string
}

const PACKS: { name: string; icon: string; stickers: Sticker[] }[] = [
  {
    name: 'Vibes',
    icon: '✨',
    stickers: [
      { id: 'v1',  emoji: '🔥', label: 'fire' },
      { id: 'v2',  emoji: '💯', label: '100' },
      { id: 'v3',  emoji: '✨', label: 'sparkles' },
      { id: 'v4',  emoji: '🎉', label: 'party' },
      { id: 'v5',  emoji: '🥳', label: 'celebration' },
      { id: 'v6',  emoji: '😎', label: 'cool' },
      { id: 'v7',  emoji: '💪', label: 'strong' },
      { id: 'v8',  emoji: '👑', label: 'crown' },
      { id: 'v9',  emoji: '🚀', label: 'rocket' },
      { id: 'v10', emoji: '⚡', label: 'lightning' },
      { id: 'v11', emoji: '🌟', label: 'star' },
      { id: 'v12', emoji: '🏆', label: 'trophy' },
    ],
  },
  {
    name: 'Feelings',
    icon: '😂',
    stickers: [
      { id: 'f1',  emoji: '😂', label: 'lmao' },
      { id: 'f2',  emoji: '🥹', label: 'touched' },
      { id: 'f3',  emoji: '😭', label: 'crying' },
      { id: 'f4',  emoji: '😩', label: 'exhausted' },
      { id: 'f5',  emoji: '🤩', label: 'excited' },
      { id: 'f6',  emoji: '😏', label: 'smirk' },
      { id: 'f7',  emoji: '🤭', label: 'shh' },
      { id: 'f8',  emoji: '😤', label: 'annoyed' },
      { id: 'f9',  emoji: '🥴', label: 'woozy' },
      { id: 'f10', emoji: '😴', label: 'asleep' },
      { id: 'f11', emoji: '🤯', label: 'mindblow' },
      { id: 'f12', emoji: '🫠', label: 'melting' },
    ],
  },
  {
    name: 'Love',
    icon: '❤️',
    stickers: [
      { id: 'l1',  emoji: '❤️',  label: 'love' },
      { id: 'l2',  emoji: '🧡', label: 'orange heart' },
      { id: 'l3',  emoji: '💛', label: 'yellow heart' },
      { id: 'l4',  emoji: '💚', label: 'green heart' },
      { id: 'l5',  emoji: '💙', label: 'blue heart' },
      { id: 'l6',  emoji: '💜', label: 'purple heart' },
      { id: 'l7',  emoji: '🤍', label: 'white heart' },
      { id: 'l8',  emoji: '💖', label: 'sparkle heart' },
      { id: 'l9',  emoji: '💘', label: 'arrow heart' },
      { id: 'l10', emoji: '🫶', label: 'heart hands' },
      { id: 'l11', emoji: '💌', label: 'love letter' },
      { id: 'l12', emoji: '😘', label: 'kiss' },
    ],
  },
  {
    name: 'Fun',
    icon: '🎮',
    stickers: [
      { id: 'g1',  emoji: '🎮', label: 'gaming' },
      { id: 'g2',  emoji: '🎵', label: 'music' },
      { id: 'g3',  emoji: '🍕', label: 'pizza' },
      { id: 'g4',  emoji: '🍔', label: 'burger' },
      { id: 'g5',  emoji: '🧋', label: 'boba' },
      { id: 'g6',  emoji: '🍿', label: 'popcorn' },
      { id: 'g7',  emoji: '🎬', label: 'movie' },
      { id: 'g8',  emoji: '⚽', label: 'soccer' },
      { id: 'g9',  emoji: '🏀', label: 'basketball' },
      { id: 'g10', emoji: '🎯', label: 'target' },
      { id: 'g11', emoji: '🎲', label: 'dice' },
      { id: 'g12', emoji: '🎸', label: 'guitar' },
    ],
  },
  {
    name: 'Animals',
    icon: '🐾',
    stickers: [
      { id: 'a1',  emoji: '🦊', label: 'fox' },
      { id: 'a2',  emoji: '🐼', label: 'panda' },
      { id: 'a3',  emoji: '🐨', label: 'koala' },
      { id: 'a4',  emoji: '🦁', label: 'lion' },
      { id: 'a5',  emoji: '🐯', label: 'tiger' },
      { id: 'a6',  emoji: '🦋', label: 'butterfly' },
      { id: 'a7',  emoji: '🐧', label: 'penguin' },
      { id: 'a8',  emoji: '🦄', label: 'unicorn' },
      { id: 'a9',  emoji: '🐸', label: 'frog' },
      { id: 'a10', emoji: '🦩', label: 'flamingo' },
      { id: 'a11', emoji: '🐙', label: 'octopus' },
      { id: 'a12', emoji: '🦅', label: 'eagle' },
    ],
  },
  {
    name: 'Gestures',
    icon: '👋',
    stickers: [
      { id: 'h1',  emoji: '👋', label: 'wave' },
      { id: 'h2',  emoji: '🙌', label: 'raised hands' },
      { id: 'h3',  emoji: '👏', label: 'clap' },
      { id: 'h4',  emoji: '🤝', label: 'handshake' },
      { id: 'h5',  emoji: '🤜', label: 'fist bump' },
      { id: 'h6',  emoji: '🫡', label: 'salute' },
      { id: 'h7',  emoji: '🤞', label: 'fingers crossed' },
      { id: 'h8',  emoji: '✌️', label: 'peace' },
      { id: 'h9',  emoji: '🫂', label: 'hug' },
      { id: 'h10', emoji: '🙏', label: 'pray' },
      { id: 'h11', emoji: '👀', label: 'eyes' },
      { id: 'h12', emoji: '🫣', label: 'peek' },
    ],
  },
]

interface Props {
  onSelect: (sticker: Sticker) => void
  onClose: () => void
}

export default function StickerPicker({ onSelect, onClose }: Props) {
  const [activePack, setActivePack] = useState(0)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: '8px',
        background: 'var(--surface)',
        border: '1px solid var(--border-md)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: 'fadeUp 0.2s cubic-bezier(0.22,1,0.36,1) both',
        zIndex: 200,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Pack tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {PACKS.map((pack, i) => (
          <button
            key={pack.name}
            onClick={() => setActivePack(i)}
            title={pack.name}
            style={{
              flex: '0 0 auto',
              padding: '10px 14px',
              border: 'none',
              borderBottom: `2px solid ${activePack === i ? 'var(--accent)' : 'transparent'}`,
              background: 'none',
              cursor: 'pointer',
              fontSize: '1.2rem',
              transition: 'all 0.15s',
              opacity: activePack === i ? 1 : 0.55,
              transform: activePack === i ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {pack.icon}
          </button>
        ))}
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            padding: '10px 14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: '1.1rem',
            flexShrink: 0,
          }}
        >×</button>
      </div>

      {/* Pack name */}
      <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {PACKS[activePack].name}
        </span>
      </div>

      {/* Sticker grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '4px',
        padding: '4px 10px 12px',
        maxHeight: '160px',
        overflowY: 'auto',
      }}>
        {PACKS[activePack].stickers.map(sticker => (
          <button
            key={sticker.id}
            onClick={() => onSelect(sticker)}
            title={sticker.label}
            style={{
              background: 'none',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '1.7rem',
              padding: '6px',
              transition: 'all 0.12s',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.background = 'var(--accent-soft)'
              el.style.borderColor = 'var(--accent)'
              el.style.transform = 'scale(1.25)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.background = 'none'
              el.style.borderColor = 'transparent'
              el.style.transform = 'scale(1)'
            }}
          >
            {sticker.emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
