import { useState, useRef, useEffect } from 'react'
import { ChatMessage } from '../../types'
import { exportToCSV, exportTableToCSV } from '../../utils/export'
import { exportToPDF } from '../../utils/exportPDF'

interface Props {
  messages: ChatMessage[]
  sessionTitle: string
}

export default function ExportMenu({ messages, sessionTitle }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleCSVChart = () => {
    const chartMsg = [...messages].reverse().find(m => m.metadata?.chart?.data)
    if (chartMsg) {
      exportToCSV(chartMsg.metadata.chart.data, chartMsg.metadata.chart.chartTitle || 'chart')
    }
    setOpen(false)
  }

  const handleCSVTable = () => {
    const tableMsg = [...messages].reverse().find(m => m.metadata?.table)
    if (tableMsg) {
      const { headers, rows } = tableMsg.metadata.table
      exportTableToCSV(headers, rows, 'table')
    }
    setOpen(false)
  }

  const handlePDF = async () => {
    await exportToPDF('chat-messages', sessionTitle || 'genbi-report')
    setOpen(false)
  }

  const hasChart = messages.some(m => m.metadata?.chart?.data)
  const hasTable = messages.some(m => m.metadata?.table)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Экспорт
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
          <button
            onClick={handlePDF}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Скачать PDF
          </button>

          {hasChart && (
            <button
              onClick={handleCSVChart}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Данные графика (CSV)
            </button>
          )}

          {hasTable && (
            <button
              onClick={handleCSVTable}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Таблица (CSV)
            </button>
          )}
        </div>
      )}
    </div>
  )
}
