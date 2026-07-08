export interface User {
  id: number
  username: string
  role: string
}

export interface ChatSession {
  id: number
  title: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  message_type: string
  content: string
  metadata?: any
  model?: string
  reasoning?: string
  created_at: string
}

export interface ChatResponse {
  session_id: number
  message_id: number
  response: string
  message_type: string
  metadata?: any
  sources?: { name: string; url: string }[]
  model?: string
  reasoning?: string
}

export interface ClarificationQuestion {
  field: string
  question: string
  options: string[]
}

export interface ClarificationResponse {
  session_id: number
  message_id: number
  needs_clarification: boolean
  questions?: ClarificationQuestion[]
  answer?: string
}

export interface Feedback {
  id: number
  message_id: number
  user_id: number
  rating: 'like' | 'dislike'
  category?: string
  comment?: string
  corrected_answer?: string
  is_data_accurate?: boolean
  created_at: string
}

export interface FeedbackStats {
  total: number
  likes: number
  dislikes: number
  categories: Record<string, number>
}
