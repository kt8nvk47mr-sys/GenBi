import { useState } from 'react'
import { ClarificationQuestion } from '../../types'
import { motion } from 'framer-motion'

interface Props {
  questions: ClarificationQuestion[]
  onAnswer: (answers: Record<string, string>) => void
}

export default function ClarificationPanel({ questions, onAnswer }: Props) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})

  const handleSelect = (field: string, value: string) => {
    setSelectedAnswers(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (Object.keys(selectedAnswers).length > 0) {
      onAnswer(selectedAnswers)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 bg-aluminum-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-aluminum-700">AI</span>
      </div>
      
      <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4">
        <div className="text-sm text-gray-500 mb-3">
          Уточните параметры для точного ответа:
        </div>
        
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i}>
              <div className="text-sm font-medium text-gray-700 mb-2">
                {q.question}
              </div>
              <div className="flex flex-wrap gap-2">
                {q.options.map((option, j) => (
                  <motion.button
                    key={j}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(q.field, option)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedAnswers[q.field] === option
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {Object.keys(selectedAnswers).length > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium btn-primary"
          >
            Продолжить
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
