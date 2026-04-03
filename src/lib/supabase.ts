import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export type SessionType = 'ideas' | 'suggestions' | 'discussion' | 'poll' | 'ama' | 'feedback'

export type Session = {
  id: string
  user_id?: string
  title: string
  description: string
  type: SessionType
  categories: string[]
  poll_options: string[]       // for poll type
  admin_token: string
  allow_reactions: boolean
  allow_replies: boolean
  cover_image: string
  created_at: string
}

export type Response = {
  id: string
  session_id: string
  text: string
  category: string
  poll_choice: string          // for poll type
  reactions: Record<string, number>
  created_at: string
}

export const SESSION_TYPES: Record<SessionType, { label: string; icon: string; desc: string; placeholder: string; color: string }> = {
  ideas:       { label: 'Ideas',       icon: '💡', desc: 'Collect creative ideas',        placeholder: 'Share your idea...',                color: 'tag-blue'   },
  suggestions: { label: 'Suggestions', icon: '📝', desc: 'Gather suggestions & feedback', placeholder: 'Write your suggestion...',           color: 'tag-green'  },
  discussion:  { label: 'Discussion',  icon: '💬', desc: 'Open-ended discussion topic',   placeholder: 'Share your thoughts...',             color: 'tag-purple' },
  poll:        { label: 'Poll',        icon: '📊', desc: 'Structured vote on options',    placeholder: '',                                   color: 'tag-amber'  },
  ama:         { label: 'Q&A / AMA',   icon: '🙋', desc: 'Questions & answers',           placeholder: 'Ask your question anonymously...',   color: 'tag-gray'   },
  feedback:    { label: 'Feedback',    icon: '⭐', desc: 'Rate or review something',      placeholder: 'Share your feedback...',             color: 'tag-pink'   },
}

export const REACTIONS = ['👍', '❤️', '🔥', '🤔', '👏']

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
