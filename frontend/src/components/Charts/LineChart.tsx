import React from 'react'
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface LineChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  title?: string
  colors?: string[]
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKeys,
  title,
  colors = ['#1A73E8', '#0D652D', '#D93025', '#E8710A'],
}) => {
  return (
    <div className="w-full h-80">
      {title && <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  )
}
