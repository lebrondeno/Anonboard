import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export type SessionType = 'openfloor' | 'qa' | 'feedback' | 'poll' | 'survey' | 'catchup'

export type QuestionType = 'short' | 'long' | 'choice' | 'rating' | 'yesno'
export type FramingMode = 'ideas' | 'suggestions' | 'discussion'
export type SuggestionStatus = 'open' | 'considering' | 'done' | 'not-now'

export type SurveyQuestion = {
  id: string
  text: string
  type: QuestionType
  options?: string[]   // for choice type
  required: boolean
}

export type Session = {
  id: string
  user_id?: string
  title: string
  description: string
  type: SessionType
  categories: string[]
  poll_options: string[]
  survey_questions: SurveyQuestion[]
  admin_token: string
  allow_reactions: boolean
  allow_replies: boolean
  cover_image: string
  is_closed: boolean
  expires_at: string | null
  max_responses: number | null
  slug: string | null
  pin: string | null
  member_theme: 'auto' | 'light' | 'dark'
  framing_mode: string
  created_at: string
}

export type Response = {
  id: string
  session_id: string
  text: string
  category: string
  poll_choice: string
  survey_answers: Record<string, string>  // questionId -> answer
  reactions: Record<string, number>
  created_at: string
}

export type ResponseReply = {
  id: string
  response_id: string
  session_id: string
  text: string
  anon_name: string
  anon_color: string
  created_at: string
}

export type AdminNote = {
  id: string
  response_id: string
  note: string
  created_at: string
}

export type ChatMessage = {
  id: string
  session_id: string
  anon_id: string
  anon_name: string
  anon_color: string
  text: string
  reply_to: string | null
  reply_preview: string
  reply_name: string
  reactions: Record<string, number>
  reactor_ids: Record<string, string[]>
  is_pinned: boolean
  created_at: string
}

export const SESSION_TYPES: Record<SessionType, { label: string; icon: string; desc: string; placeholder: string; color: string }> = {
  openfloor: { label: 'Open Floor', icon: '💬', desc: 'Ideas, suggestions or open discussion', placeholder: "Say what's on your mind...", color: 'tag-blue' },
  qa:        { label: 'Q&A',        icon: '🙋', desc: 'Ask questions, get real answers',       placeholder: 'Ask your question...',         color: 'tag-purple' },
  feedback:  { label: 'Feedback',   icon: '⭐', desc: 'Honest ratings and reviews',            placeholder: 'Share your honest feedback...', color: 'tag-pink' },
  poll:      { label: 'Poll',       icon: '📊', desc: 'Structured vote on clear options',      placeholder: '',                              color: 'tag-amber' },
  survey:    { label: 'Survey',     icon: '📋', desc: 'Multi-question form, one submission',   placeholder: '',                              color: 'tag-teal' },
  catchup:   { label: 'Catch Up',   icon: '🎉', desc: 'Live anonymous group chat',             placeholder: 'Say something...',              color: 'tag-green' },
}

export const FRAMING_MODES: Record<string, { label: string; desc: string; placeholder: string; icon: string }> = {
  ideas:       { label: 'Ideas',       icon: '💡', desc: 'Collect creative ideas from your group',       placeholder: "Drop your idea here. The stranger the better." },
  suggestions: { label: 'Suggestions', icon: '📝', desc: 'Gather what people would change or improve',   placeholder: 'What would you change or improve?' },
  discussion:  { label: 'Discussion',  icon: '🔥', desc: 'Open topic — people share their thoughts',     placeholder: 'What do you think?' },
}

export const REACTIONS = ['❤️', '😂', '🔥', '👍', '😮', '😢']

const ADJECTIVES = ['Purple','Teal','Amber','Coral','Indigo','Crimson','Jade','Azure','Violet','Emerald','Scarlet','Golden','Silver','Cobalt','Magenta']
const ANIMALS    = ['Fox','Bear','Wolf','Eagle','Tiger','Panda','Hawk','Lynx','Otter','Crane','Viper','Raven','Bison','Koala','Gecko']
const COLORS     = ['#4F46E5','#059669','#D97706','#DC2626','#7C3AED','#0891B2','#065F46','#92400E','#1D4ED8','#9D174D','#1E40AF','#047857','#B45309','#991B1B','#6D28D9']

export function getAnonIdentity(sessionId: string): { anon_id: string; anon_name: string; anon_color: string } {
  const key = `anon_${sessionId}`
  const saved = localStorage.getItem(key)
  if (saved) return JSON.parse(saved)
  const idx = Math.floor(Math.random() * 15)
  const idx2 = Math.floor(Math.random() * 15)
  const identity = {
    anon_id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    anon_name: `${ADJECTIVES[idx]} ${ANIMALS[idx2]}`,
    anon_color: COLORS[idx],
  }
  localStorage.setItem(key, JSON.stringify(identity))
  return identity
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── Anonymous auth for cross-browser duplicate prevention ──
export async function getOrCreateAnonSession(): Promise<string | null> {
  try {
    // Check if already have a session
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id

    // Create anonymous session — persists via httpOnly cookie
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.user) return null
    return data.user.id
  } catch {
    return null
  }
}

export async function getAnonUserId(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

// Check if this anon user already submitted to this session
export async function hasAnonSubmitted(sessionId: string, anonUserId: string): Promise<boolean> {
  const { data } = await supabase
    .from('responses')
    .select('id')
    .eq('session_id', sessionId)
    .eq('anon_user_id', anonUserId)
    .limit(1)
  return (data?.length ?? 0) > 0
}
