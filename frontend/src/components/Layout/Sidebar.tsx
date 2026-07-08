import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '../../services/api'
import { ChatSession } from '../../types'
import { motion } from 'framer-motion'

export default function Sidebar() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const res = await chatApi.getSessions()
      setSessions(res.data)
    } catch (err) {
      console.error('Failed to load sessions')
    }
  }

  const handleNewChat = () => {
    setActiveId(null)
    navigate('/')
    window.location.reload()
  }

  const handleSessionClick = (id: number) => {
    setActiveId(id)
    navigate('/', { state: { sessionId: id } })
  }

  const handleDeleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatApi.deleteSession(id)
      setSessions(sessions.filter(s => s.id !== id))
      if (activeId === id) {
        setActiveId(null)
      }
    } catch (err) {
      console.error('Failed to delete session')
    }
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewChat}
          className="w-full py-3 px-4 bg-primary-500 text-white rounded-xl font-medium btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новый чат
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2">
          Сегодня
        </div>
        {sessions
          .filter(s => new Date(s.created_at).toDateString() === new Date().toDateString())
          .map(session => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={activeId === session.id}
              onClick={() => handleSessionClick(session.id)}
              onDelete={(e) => handleDeleteSession(session.id, e)}
            />
          ))}
        
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 py-2 mt-4">
          Ранее
        </div>
        {sessions
          .filter(s => new Date(s.created_at).toDateString() !== new Date().toDateString())
          .map(session => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={activeId === session.id}
              onClick={() => handleSessionClick(session.id)}
              onDelete={(e) => handleDeleteSession(session.id, e)}
            />
          ))}
      </div>
    </aside>
  )
}

function SessionItem({ 
  session, 
  isActive, 
  onClick, 
  onDelete 
}: { 
  session: ChatSession
  isActive: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
        isActive 
          ? 'bg-primary-50 text-primary-700' 
          : 'hover:bg-gray-100 text-gray-700'
      }`}
      onClick={onClick}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
      <span className="flex-1 truncate text-sm">
        {session.title || 'Новый чат'}
      </span>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}
