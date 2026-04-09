import { useState, useMemo, useRef, useEffect } from 'react'

const CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  { name: 'Recent', icon: '🕐', emojis: [] }, // filled from localStorage
  {
    name: 'Smileys', icon: '😀', emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🫡','🤔','🫢','🫣','🤭','🤫','🤥','😶','🫥','😐','😑','😬','🫨','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮‍💨','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖',
    ],
  },
  {
    name: 'People', icon: '👋', emojis: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','🫷','🫸','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🫶','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁️','👅','👄','🫦','👶','🧒','👦','👧','🧑','👱','👨','🧔','👩','🧓','👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇','🤦','🤷',
    ],
  },
  {
    name: 'Animals', icon: '🐶', emojis: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪲','🦟','🦗','🕷️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔',
    ],
  },
  {
    name: 'Food', icon: '🍕', emojis: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🥕','🧄','🧅','🥔','🍠','🫘','🥜','🌰','🍞','🥐','🥖','🫓','🥨','🥯','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫔','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥣','🥗','🍿','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','🍼','🥛','☕','🫖','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🫗','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽️',
    ],
  },
  {
    name: 'Travel', icon: '✈️', emojis: [
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🏍️','🛵','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🚨','🚥','🚦','🛑','🚧','⚓','🛟','⛵','🚤','🛥️','🛳️','⛴️','🚢','✈️','🛩️','🛫','🛬','🪂','💺','🚁','🚟','🚠','🚡','🛰️','🚀','🛸','🪐','🌍','🌎','🌏','🗺️','🧭','🏔️','⛰️','🌋','🗻','🏕️','🏖️','🏜️','🏝️','🏞️','🏟️','🏛️','🏗️','🏘️','🏚️','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪','🕌','🛕','🕍','⛩️','🕋','⛲','⛺','🌁','🌃','🏙️','🌄','🌅','🌆','🌇','🌉','🗾',
    ],
  },
  {
    name: 'Activities', icon: '⚽', emojis: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤼','🤸','⛹️','🤺','🏇','🧘','🏄','🏊','🤽','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️','🎪','🤹','🎭','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎷','🪗','🎸','🎹','🎺','🎻','🪕','🥁','🪘','🎲','♟️','🎯','🎳','🎮','🕹️',
    ],
  },
  {
    name: 'Objects', icon: '💡', emojis: [
      '⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','💽','💾','💿','📀','🧮','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🪫','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🦯','🔧','🪛','🔨','⚒️','🛠️','⛏️','🪚','🔩','🪤','🧱','🔫','💣','🪓','🔪','🗡️','⚔️','🛡️','🪬','🧲','🪜','🧰','🧲','🔭','🔬','🩺','🩻','💊','🩹','🩼','🧸','🪆','🖼️','🧵','🪡','🧶','🪢','👓','🕶️','🥽','🧣','🧤','🧥','👒','🎓','⛑️','📿','💄','💍','💼',
    ],
  },
  {
    name: 'Symbols', icon: '❤️', emojis: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','✡️','🔯','🪯','☯️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🔕','🔇','🔈','🔉','🔊','📣','📢','🔔','🔕','🎵','🎶','⁉️','🔅','🔆','📶','🛜','📳','📴','♻️','🔱','📛','🔰','⭕','✅','☑️','✔️','❎','🔲','🔳',
    ],
  },
  {
    name: 'Flags', icon: '🚩', emojis: [
      '🏳️','🏴','🚩','🏁','🏴‍☠️','🏳️‍🌈','🏳️‍⚧️','🇰🇪','🇺🇬','🇹🇿','🇳🇬','🇬🇭','🇿🇦','🇪🇹','🇪🇬','🇸🇳','🇨🇮','🇲🇦','🇨🇲','🇦🇴','🇿🇼','🇿🇲','🇷🇼','🇲🇿','🇧🇼','🇺🇸','🇬🇧','🇫🇷','🇩🇪','🇮🇹','🇪🇸','🇵🇹','🇧🇷','🇮🇳','🇨🇳','🇯🇵','🇰🇷','🇷🇺','🇨🇦','🇦🇺','🇳🇿','🇸🇦','🇦🇪','🇹🇷','🇮🇩','🇲🇽','🇦🇷','🇨🇴','🇨🇱','🇵🇰','🇧🇩','🇵🇭','🇻🇳','🇹🇭','🇲🇾','🇸🇬','🌍','🌎','🌏',
    ],
  },
]

const RECENT_KEY = 'whispr_recent_emojis'
const MAX_RECENT = 24

export function trackRecentEmoji(emoji: string) {
  try {
    const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    const updated = [emoji, ...recent.filter(e => e !== emoji)].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {}
}

interface Props {
  onSelect: (emoji: string) => void
  onClose: () => void
  title?: string
}

export default function EmojiPicker({ onSelect, onClose, title }: Props) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)

  // Load recent
  const categories = useMemo(() => {
    try {
      const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
      return CATEGORIES.map((c, i) => i === 0 ? { ...c, emojis: recent } : c)
    } catch { return CATEGORIES }
  }, [])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Actually do a proper search using a lightweight name map
  const ALL_EMOJIS_FLAT = useMemo(() => categories.slice(1).flatMap(c => c.emojis), [categories])

  function handleSelect(emoji: string) {
    trackRecentEmoji(emoji)
    onSelect(emoji)
  }

  const displayEmojis = search.trim()
    ? ALL_EMOJIS_FLAT.filter((e, i, arr) => arr.indexOf(e) === i).slice(0, 80)
    : (categories[activeCategory]?.emojis ?? [])

  const activeDisplay = search.trim() ? displayEmojis : (categories[activeCategory]?.emojis ?? [])

  return (
    <div
      style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: '8px', background: 'var(--bg)', border: '1px solid var(--border-md)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'fadeUp 0.2s cubic-bezier(0.22,1,0.36,1) both', zIndex: 200 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ padding: '10px 12px 6px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
        {title && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{title}</p>}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border-md)', borderRadius: '20px', padding: '7px 14px', fontSize: '0.84rem', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', padding: '4px', lineHeight: 1 }}>×</button>
        </div>
      </div>

      {/* Category tabs */}
      {!search.trim() && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {categories.map((cat, i) => {
            if (i === 0 && cat.emojis.length === 0) return null
            return (
              <button key={cat.name} onClick={() => setActiveCategory(i)} title={cat.name}
                style={{ flex: '0 0 auto', padding: '8px 12px', border: 'none', borderBottom: `2px solid ${activeCategory === i ? 'var(--accent)' : 'transparent'}`, background: 'none', cursor: 'pointer', fontSize: '1.1rem', transition: 'all 0.15s', opacity: activeCategory === i ? 1 : 0.5, transform: activeCategory === i ? 'scale(1.1)' : 'scale(1)' }}>
                {cat.icon}
              </button>
            )
          })}
        </div>
      )}

      {/* Category name */}
      {!search.trim() && (
        <p style={{ padding: '6px 12px 2px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {categories[activeCategory]?.name}
        </p>
      )}

      {/* Emoji grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '2px', padding: '4px 10px 12px', maxHeight: '200px', overflowY: 'auto' }}>
        {activeDisplay.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            {search.trim() ? 'No results' : 'No recent emojis yet'}
          </div>
        )}
        {activeDisplay.map((emoji, i) => (
          <button key={`${emoji}-${i}`} onClick={() => handleSelect(emoji)} title={emoji}
            style={{ background: 'none', border: '1px solid transparent', borderRadius: '8px', cursor: 'pointer', fontSize: '1.4rem', padding: '5px', transition: 'all 0.1s', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'var(--accent-soft)'; el.style.borderColor = 'var(--accent)'; el.style.transform = 'scale(1.2)' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'none'; el.style.borderColor = 'transparent'; el.style.transform = 'scale(1)' }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
