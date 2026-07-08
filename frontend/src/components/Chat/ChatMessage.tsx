import { useState } from 'react'
import { ChatMessage as ChatMessageType } from '../../types'
import { feedbackApi } from '../../services/api'
import FeedbackWidget from '../Feedback/FeedbackWidget'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts'
import { exportToCSV, exportTableToCSV } from '../../utils/export'

interface Props {
  message: ChatMessageType
}

function getYDomain(data: any[], yKey: string): [number, number] {
  if (!data || data.length === 0) return [0, 100]
  const values = data.map(d => d[yKey]).filter(v => typeof v === 'number')
  if (values.length === 0) return [0, 100]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  // Если разброс мал (< 20% от max) — начинаем от min с padding
  if (range < max * 0.2 && min > 0) {
    const padding = range * 0.15 || max * 0.03
    return [Math.max(0, min - padding), max + padding]
  }
  // Иначе — стандартный padding 10%
  const padding = (range || max) * 0.1
  return [Math.max(0, min - padding), max + padding]
}

function ChartRenderer({ chart }: { chart: any }) {
  if (!chart?.data) return null

  const chartType = chart.chartType || 'line'
  const yDomain = getYDomain(chart.data, chart.yKey)

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
      {chart.chartTitle && (
        <div className="text-sm font-medium text-gray-700 mb-3">{chart.chartTitle}</div>
      )}
      <div className="h-64 bg-white rounded-lg border border-gray-200 p-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'scatter' ? (
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chart.xKey} type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey={chart.yKey} type="number" domain={yDomain} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Scatter data={chart.data} fill="#1A73E8" />
            </ScatterChart>
          ) : chartType === 'bar' ? (
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey={chart.yKey} fill="#1A73E8" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
              <YAxis domain={yDomain} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={chart.yKey}
                stroke="#1A73E8"
                strokeWidth={2}
                dot={{ fill: '#1A73E8', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />')
  }

  return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
}

function ReasoningBlock({ reasoning }: { reasoning: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Рассуждение ИИ
      </button>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
        >
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{reasoning}</pre>
        </motion.div>
      )}
    </div>
  )
}

export default function ChatMessageComponent({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-aluminum-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-aluminum-700">AI</span>
        </div>
      )}

      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`p-4 rounded-2xl ${
            isUser
              ? 'bg-primary-500 text-white rounded-tr-sm'
              : 'bg-white border border-gray-200 rounded-tl-sm'
          }`}
        >
          {message.message_type === 'clarification' ? null : (
            <div className="whitespace-pre-wrap">
              {isUser ? message.content : <MarkdownRenderer content={message.content} />}
            </div>
          )}

          {message.metadata?.chart && (
            <>
              <ChartRenderer chart={message.metadata.chart} />
              <button
                onClick={() => exportToCSV(message.metadata.chart.data, message.metadata.chart.chartTitle || 'chart')}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Скачать CSV
              </button>
            </>
          )}

          {message.metadata?.table && (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {message.metadata.table.headers?.map((h: string, i: number) => (
                        <th key={i} className="text-left py-2 px-3 font-medium text-gray-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {message.metadata.table.rows?.map((row: any[], i: number) => (
                      <tr key={i} className="border-b border-gray-100">
                        {row.map((cell, j) => (
                          <td key={j} className="py-2 px-3 text-gray-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => exportTableToCSV(message.metadata.table.headers, message.metadata.table.rows, 'table')}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Скачать CSV
              </button>
            </>
          )}
        </div>

        {!isUser && (
          <div className="mt-1 flex items-center gap-3">
            <FeedbackWidget messageId={message.id} />
            {message.model && (
              <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                {message.model}
              </span>
            )}
          </div>
        )}

        {!isUser && message.reasoning && (
          <ReasoningBlock reasoning={message.reasoning} />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary-700">You</span>
        </div>
      )}
    </motion.div>
  )
}
