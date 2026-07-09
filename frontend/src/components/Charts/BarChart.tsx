import React from 'react'
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  yKeys: string[]
  title?: string
  colors?: string[]
}

export const BarChart: React.FC<BarChartProps> = ({
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
        <RechartsBar data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  )
}
