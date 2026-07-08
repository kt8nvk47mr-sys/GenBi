export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = String(row[h] ?? '')
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportTableToCSV(headers: string[], rows: any[][], filename: string) {
  const data = rows.map(row => {
    const obj: Record<string, any> = {}
    headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
    return obj
  })
  exportToCSV(data, filename)
}
