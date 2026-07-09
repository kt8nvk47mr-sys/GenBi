import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '../types'

interface ChatState {
  sessions: ChatSession[]
  currentSessionId: number | null
  messages: ChatMessage[]

  setSessions: (sessions: ChatSession[]) => void
  setCurrentSession: (id: number | null) => void
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  clearCurrent: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],

  setSessions: (sessions) => set({ sessions }),

  setCurrentSession: (id) => set({ currentSessionId: id }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages) => set({ messages }),

  clearCurrent: () =>
    set({ currentSessionId: null, messages: [] }),
}))
