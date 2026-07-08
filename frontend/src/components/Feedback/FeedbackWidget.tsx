import { useState } from 'react'
import { feedbackApi } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  messageId: number
}

export default function FeedbackWidget({ messageId }: Props) {
  const [rating, setRating] = useState<'like' | 'dislike' | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const categories = [
    'Некорректные данные',
    'Неполный ответ',
    'Неверная интерпретация',
    'Ошибка в расчётах',
    'График не отображается',
    'Другое'
  ]

  const handleRating = async (r: 'like' | 'dislike') => {
    setRating(r)
    if (r === 'like') {
      try {
        await feedbackApi.create({
          message_id: messageId,
          rating: r,
          is_data_accurate: true
        })
        setSubmitted(true)
      } catch (err) {
        console.error('Failed to submit feedback')
      }
    } else {
      setShowForm(true)
    }
  }

  const handleSubmitDislike = async () => {
    try {
      await feedbackApi.create({
        message_id: messageId,
        rating: 'dislike',
        category,
        comment
      })
      setShowForm(false)
      setSubmitted(true)
    } catch (err) {
      console.error('Failed to submit feedback')
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-gray-400 mt-2"
      >
        Спасибо за оценку!
      </motion.div>
    )
  }

  return (
    <div className="mt-2">
      {!showForm ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Был ли ответ полезен?</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleRating('like')}
            className={`p-1 rounded transition-colors ${
              rating === 'like' ? 'text-green-500' : 'hover:text-green-500'
            }`}
          >
            <svg className="w-5 h-5" fill={rating === 'like' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleRating('dislike')}
            className={`p-1 rounded transition-colors ${
              rating === 'dislike' ? 'text-red-500' : 'hover:text-red-500'
            }`}
          >
            <svg className="w-5 h-5" fill={rating === 'dislike' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          </motion.button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200"
          >
            <div className="text-sm font-medium text-gray-700 mb-2">
              Что не так с ответом?
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-1 text-xs rounded-lg transition-all ${
                    category === cat
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="w-full text-sm p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary-300"
              rows={2}
            />
            
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitDislike}
                disabled={!category}
                className="px-3 py-1 text-sm bg-primary-500 text-white rounded-lg disabled:opacity-50 btn-primary"
              >
                Отправить
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
