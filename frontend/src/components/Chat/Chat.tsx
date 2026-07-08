import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { chatApi } from '../../services/api'
import { ChatMessage, ChatSession } from '../../types'
import ChatMessageComponent from './ChatMessage'
import ChatInput from './ChatInput'
import ClarificationPanel from './ClarificationPanel'
import ExportMenu from './ExportMenu'
import { motion, AnimatePresence } from 'framer-motion'

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [clarification, setClarification] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const state = location.state as { sessionId?: number } | null
    if (state?.sessionId) {
      setSessionId(state.sessionId)
      loadMessages(state.sessionId)
    }
  }, [location.state])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async (sid: number) => {
    try {
      const res = await chatApi.getMessages(sid)
      setMessages(res.data)
    } catch (err) {
      console.error('Failed to load messages')
    }
  }

  const handleSend = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      message_type: 'text',
      content: message,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setClarification(null)

    try {
      const res = await chatApi.send(message, sessionId || undefined)
      setSessionId(res.data.session_id)

      if (res.data.message_type === 'clarification') {
        setClarification({
          sessionId: res.data.session_id,
          questions: res.data.metadata?.questions || []
        })
        setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      } else {
        const assistantMessage: ChatMessage = {
          id: res.data.message_id,
          role: 'assistant',
          message_type: res.data.message_type,
          content: res.data.response,
          metadata: res.data.metadata,
          model: res.data.model,
          reasoning: res.data.reasoning,
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (err) {
      console.error('Failed to send message')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const handleClarificationAnswer = async (answers: Record<string, string>) => {
    if (!sessionId) return

    const answerText = Object.entries(answers)
      .map(([field, value]) => `${field}: ${value}`)
      .join(', ')

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      message_type: 'text',
      content: answerText,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setClarification(null)

    try {
      const res = await chatApi.clarify(answerText, sessionId)
      
      if (res.data.needs_clarification) {
        setClarification({
          sessionId: res.data.session_id,
          questions: res.data.questions
        })
      } else {
        const assistantMessage: ChatMessage = {
          id: res.data.message_id,
          role: 'assistant',
          message_type: 'text',
          content: res.data.answer || '',
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (err) {
      console.error('Failed to send clarification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !clarification ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-2xl"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                GenBI Аналитика
              </h1>
              <p className="text-lg text-gray-500 mb-8">
                Задайте вопрос об аналитике сырьевых рынков
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Как себя вела котировка алюминия за Q1?',
                  'Сравни курсы USD/RUB за полгода',
                  'Какие макрофакторы повлияли на LME?',
                  'Посчитай стоимость закупки глинозёма'
                ].map((suggestion, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    onClick={() => handleSend(suggestion)}
                    className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all text-sm text-gray-700"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.length > 0 && (
              <div className="flex justify-end">
                <ExportMenu messages={messages} sessionTitle="GenBI Аналитика" />
              </div>
            )}

            <div id="chat-messages">
              <AnimatePresence>
                {messages.map((msg) => (
                  <ChatMessageComponent key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
            </div>
            
            {clarification && (
              <ClarificationPanel
                questions={clarification.questions}
                onAnswer={handleClarificationAnswer}
              />
            )}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 p-4"
              >
                <div className="w-8 h-8 bg-aluminum-100 rounded-full flex items-center justify-center">
                  <span className="text-aluminum-600">AI</span>
                </div>
                <div className="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  )
}
