import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const isConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export type SessionType = 'ideas' | 'suggestions' | 'discussion' | 'poll' | 'ama' | 'feedback'

export type Session = {
  id: string
  title: string
  description: string
  type: SessionType
  categories: string[]
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
  reactions: Record<string, number>
  created_at: string
}

export const SESSION_TYPES: Record<SessionType, { label: string; icon: string; desc: string; placeholder: string; tagColor: string }> = {
  ideas:      { label: 'Ideas',       icon: '💡', desc: 'Collect creative ideas',         placeholder: 'Share your idea...',               tagColor: 'tag-blue'   },
  suggestions:{ label: 'Suggestions', icon: '📝', desc: 'Gather suggestions & feedback',  placeholder: 'Write your suggestion...',          tagColor: 'tag-green'  },
  discussion: { label: 'Discussion',  icon: '💬', desc: 'Open-ended discussion topic',    placeholder: 'Share your thoughts...',            tagColor: 'tag-purple' },
  poll:       { label: 'Poll',        icon: '📊', desc: 'Quick vote or opinion',          placeholder: 'Give your vote or opinion...',      tagColor: 'tag-amber'  },
  ama:        { label: 'Q&A / AMA',   icon: '🙋', desc: 'Questions & answers',            placeholder: 'Ask your question anonymously...', tagColor: 'tag-gray'   },
  feedback:   { label: 'Feedback',    icon: '⭐', desc: 'Rate or review something',       placeholder: 'Share your feedback...',            tagColor: 'tag-amber'  },
}

export const REACTIONS = ['👍', '❤️', '🔥', '🤔', '👏']

// Auth helpers
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
