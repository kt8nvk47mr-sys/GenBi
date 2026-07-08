import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\Epoly\.local\share\mimocode\mimocode.db')
cursor = conn.cursor()

# Get sessions from last 30 days (approximate timestamp)
# June 8 2026 = 1780828800000 (approx)
cutoff_ms = 1749388800000  # June 8 2026

# Query repeated tool usage
print("=== Repeated Tool Usage ===")
cursor.execute("""
SELECT json_extract(p.data, '$.tool') as tool,
       substr(json_extract(p.data, '$.state.input'), 1, 200) as input_preview,
       count(*) as n
FROM message m
JOIN part p ON p.message_id = m.id
WHERE json_extract(m.data, '$.role') = 'assistant'
  AND json_extract(p.data, '$.type') = 'tool'
  AND m.time_created > ?
GROUP BY tool, input_preview
ORDER BY n DESC
LIMIT 50
""", (cutoff_ms,))
rows = cursor.fetchall()
for row in rows:
    print(f'  {row[2]}x {row[0]}: {row[1][:150] if row[1] else "N/A"}')

# Query user messages for repeated keywords
print("\n=== User Message Keywords ===")
cursor.execute("""
SELECT data FROM message
WHERE json_extract(data, '$.role') = 'user'
  AND time_created > ?
ORDER BY time_created DESC
LIMIT 100
""", (cutoff_ms,))
rows = cursor.fetchall()
keywords = {}
for row in rows:
    try:
        data = json.loads(row[0])
        text = data.get('content', '')[:500]
        for kw in ['again', 'every time', 'like last time', 'the usual', 'repeat', 'same as before', 'продолжай', 'сделай', 'запусти', 'исправь', 'тест', 'аудит', 'критик', 'дайджест', 'миграция', 'redesign']:
            if kw.lower() in text.lower():
                keywords[kw] = keywords.get(kw, 0) + 1
    except:
        pass

for kw, count in sorted(keywords.items(), key=lambda x: -x[1]):
    print(f'  {count}x "{kw}"')

# Query for repeated file paths in tool calls
print("\n=== Repeated File Paths ===")
cursor.execute("""
SELECT substr(json_extract(p.data, '$.state.input'), 1, 300) as input_preview,
       count(*) as n
FROM message m
JOIN part p ON p.message_id = m.id
WHERE json_extract(m.data, '$.role') = 'assistant'
  AND json_extract(p.data, '$.type') = 'tool'
  AND json_extract(p.data, '$.tool') IN ('Edit', 'Read', 'Write')
  AND m.time_created > ?
GROUP BY input_preview
HAVING n > 1
ORDER BY n DESC
LIMIT 30
""", (cutoff_ms,))
rows = cursor.fetchall()
for row in rows:
    print(f'  {row[1]}x: {row[0][:200] if row[0] else "N/A"}')

conn.close()
