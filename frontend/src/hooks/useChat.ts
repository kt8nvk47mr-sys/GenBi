import { useState, useCallback } from 'react'
import { api } from '../services/api'
import type { ChatMessage, ChatResponse, ClarificationQuestion } from '../types'

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  clarificationQuestions: ClarificationQuestion[]
  sendMessage: (sessionId: number | null, content: string) => Promise<ChatResponse | null>
  answerClarification: (sessionId: number, answers: Record<string, string>) => Promise<void>
  clearMessages: () => void
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([])

  const sendMessage = useCallback(async (
    sessionId: number | null,
    content: string
  ): Promise<ChatResponse | null> => {
    setIsLoading(true)
    setError(null)
    setClarificationQuestions([])

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      message_type: 'text',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await api.sendMessage(sessionId, content)

      if (response.needs_clarification && response.questions) {
        setClarificationQuestions(response.questions)
        return null
      }

      const assistantMessage: ChatMessage = {
        id: response.message_id,
        role: 'assistant',
        message_type: response.message_type,
        content: response.response,
        metadata: response.metadata,
        model: response.model,
        reasoning: response.reasoning,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMessage])
      return response
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки сообщения')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const answerClarification = useCallback(async (
    sessionId: number,
    answers: Record<string, string>
  ) => {
    setClarificationQuestions([])
    const answerText = Object.values(answers).join(', ')
    await sendMessage(sessionId, answerText)
  }, [sendMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    setClarificationQuestions([])
    setError(null)
  }, [])

  return { messages, isLoading, error, clarificationQuestions, sendMessage, answerClarification, clearMessages }
}
