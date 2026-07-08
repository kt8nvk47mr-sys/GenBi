import { useState, useEffect } from 'react'
import { settingsApi } from '../../services/api'
import { motion, AnimatePresence } from 'framer-motion'

interface LLMSettings {
  primary_model: string
  fast_model: string
  clarification_model: string
  temperature: number
  max_tokens: number
}

interface DatabaseSettings {
  host: string
  port: number
  database: string
  user: string
  password: string
}

interface EmbeddingSettings {
  provider: string
  model: string
  dimensions: number
}

interface LiteLLMSettings {
  url: string
}

interface AppSettings {
  llm: LLMSettings
  database: DatabaseSettings
  embedding: EmbeddingSettings
  litellm: LiteLLMSettings
}

interface TestResult {
  success: boolean
  message: string
  latency_ms?: number
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [testDB, setTestDB] = useState<{ loading: boolean; result: TestResult | null }>({ loading: false, result: null })
  const [testLLM, setTestLLM] = useState<{ loading: boolean; result: TestResult | null }>({ loading: false, result: null })
  const [testLiteLLM, setTestLiteLLM] = useState<{ loading: boolean; result: TestResult | null }>({ loading: false, result: null })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get()
      setSettings(res.data)
    } catch (err) {
      showToast('error', 'Не удалось загрузить настройки')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await settingsApi.update(settings)
      setSettings(res.data)
      showToast('success', 'Настройки сохранены')
    } catch (err) {
      showToast('error', 'Ошибка сохранения настроек')
    } finally {
      setSaving(false)
    }
  }

  const handleTestDB = async () => {
    if (!settings) return
    setTestDB({ loading: true, result: null })
    try {
      const res = await settingsApi.testDB(settings.database)
      setTestDB({ loading: false, result: res.data })
    } catch (err: any) {
      setTestDB({ loading: false, result: { success: false, message: err.response?.data?.detail || 'Ошибка запроса' } })
    }
  }

  const handleTestLLM = async () => {
    setTestLLM({ loading: true, result: null })
    try {
      const res = await settingsApi.testLLM()
      setTestLLM({ loading: false, result: res.data })
    } catch (err: any) {
      setTestLLM({ loading: false, result: { success: false, message: err.response?.data?.detail || 'Ошибка запроса' } })
    }
  }

  const handleTestLiteLLM = async () => {
    if (!settings) return
    setTestLiteLLM({ loading: true, result: null })
    try {
      const res = await settingsApi.testLiteLLM(settings.litellm)
      setTestLiteLLM({ loading: false, result: res.data })
    } catch (err: any) {
      setTestLiteLLM({ loading: false, result: { success: false, message: err.response?.data?.detail || 'Ошибка запроса' } })
    }
  }

  const updateLLM = (field: keyof LLMSettings, value: string | number) => {
    if (!settings) return
    setSettings({ ...settings, llm: { ...settings.llm, [field]: value } })
  }

  const updateDB = (field: keyof DatabaseSettings, value: string | number) => {
    if (!settings) return
    setSettings({ ...settings, database: { ...settings.database, [field]: value } })
  }

  const updateEmbedding = (field: keyof EmbeddingSettings, value: string | number) => {
    if (!settings) return
    setSettings({ ...settings, embedding: { ...settings.embedding, [field]: value } })
  }

  const updateLiteLLM = (field: keyof LiteLLMSettings, value: string) => {
    if (!settings) return
    setSettings({ ...settings, litellm: { ...settings.litellm, [field]: value } })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Ошибка загрузки настроек
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Настройки приложения</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium btn-primary disabled:opacity-50 transition-all"
        >
          {saving ? (
            <span className="thinking-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          ) : (
            'Сохранить'
          )}
        </button>
      </div>

      {/* LLM Models */}
      <SettingsCard title="LLM модели и параметры">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Основная модель"
            value={settings.llm.primary_model}
            onChange={(v) => updateLLM('primary_model', v)}
            placeholder="gpt-4o"
          />
          <InputField
            label="Быстрая модель"
            value={settings.llm.fast_model}
            onChange={(v) => updateLLM('fast_model', v)}
            placeholder="gpt-4o-mini"
          />
          <InputField
            label="Модель уточнений"
            value={settings.llm.clarification_model}
            onChange={(v) => updateLLM('clarification_model', v)}
            placeholder="gpt-4o-mini"
          />
          <NumberField
            label="Temperature"
            value={settings.llm.temperature}
            onChange={(v) => updateLLM('temperature', v)}
            min={0}
            max={2}
            step={0.1}
          />
          <NumberField
            label="Max tokens"
            value={settings.llm.max_tokens}
            onChange={(v) => updateLLM('max_tokens', v)}
            min={100}
            max={32768}
            step={256}
          />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <TestButton
            loading={testLLM.loading}
            onClick={handleTestLLM}
            label="Проверить модель"
          />
          <TestResultBadge result={testLLM.result} />
        </div>
      </SettingsCard>

      {/* Database */}
      <SettingsCard title="Подключение к БД">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Хост"
            value={settings.database.host}
            onChange={(v) => updateDB('host', v)}
            placeholder="localhost"
          />
          <NumberField
            label="Порт"
            value={settings.database.port}
            onChange={(v) => updateDB('port', v)}
            min={1}
            max={65535}
          />
          <InputField
            label="База данных"
            value={settings.database.database}
            onChange={(v) => updateDB('database', v)}
            placeholder="genbi"
          />
          <InputField
            label="Пользователь"
            value={settings.database.user}
            onChange={(v) => updateDB('user', v)}
            placeholder="gpadmin"
          />
          <InputField
            label="Пароль"
            value={settings.database.password}
            onChange={(v) => updateDB('password', v)}
            type="password"
            placeholder="••••••••"
          />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <TestButton
            loading={testDB.loading}
            onClick={handleTestDB}
            label="Проверить подключение"
          />
          <TestResultBadge result={testDB.result} />
        </div>
      </SettingsCard>

      {/* Embeddings */}
      <SettingsCard title="Эмбеддинги">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Провайдер"
            value={settings.embedding.provider}
            onChange={(v) => updateEmbedding('provider', v)}
            placeholder="openai"
          />
          <InputField
            label="Модель"
            value={settings.embedding.model}
            onChange={(v) => updateEmbedding('model', v)}
            placeholder="text-embedding-3-small"
          />
          <NumberField
            label="Размерность"
            value={settings.embedding.dimensions}
            onChange={(v) => updateEmbedding('dimensions', v)}
            min={1}
            max={4096}
          />
        </div>
      </SettingsCard>

      {/* LiteLLM */}
      <SettingsCard title="LiteLLM">
        <div className="max-w-md">
          <InputField
            label="URL прокси"
            value={settings.litellm.url}
            onChange={(v) => updateLiteLLM('url', v)}
            placeholder="http://localhost:4000"
          />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
          <TestButton
            loading={testLiteLLM.loading}
            onClick={handleTestLiteLLM}
            label="Проверить LiteLLM"
          />
          <TestResultBadge result={testLiteLLM.result} />
        </div>
      </SettingsCard>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg text-white font-medium ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </motion.div>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
      />
    </div>
  )
}

function TestButton({ loading, onClick, label }: { loading: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-all flex items-center gap-2"
    >
      {loading ? (
        <span className="thinking-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {label}
    </button>
  )
}

function TestResultBadge({ result }: { result: TestResult | null }) {
  if (!result) return null
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
        result.success
          ? 'bg-green-50 text-green-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {result.success ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {result.message}
      {result.latency_ms !== undefined && (
        <span className="text-gray-400 ml-1">({result.latency_ms}ms)</span>
      )}
    </motion.span>
  )
}
