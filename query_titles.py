import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\Epoly\.local\share\mimocode\mimocode.db')
cursor = conn.cursor()

# Get session titles and topics
print("=== Session Titles (recent) ===")
cursor.execute("""
SELECT id, title, time_created
FROM session
WHERE time_created > 1749388800000
  AND title IS NOT NULL
  AND title != ''
ORDER BY time_created DESC
LIMIT 30
""")
rows = cursor.fetchall()
for row in rows:
    print(f'  {row[0]}: {row[1]} (time: {row[2]})')

# Get user messages with keywords
print("\n=== User Messages (recent, filtered) ===")
cursor.execute("""
SELECT json_extract(data, '$.content') as content, time_created
FROM message
WHERE json_extract(data, '$.role') = 'user'
  AND time_created > 1749388800000
ORDER BY time_created DESC
LIMIT 50
""")
rows = cursor.fetchall()
for row in rows:
    content = row[0] if row[0] else 'N/A'
    print(f'  [{row[1]}] {content[:200]}')

# Query for Playwright usage patterns
print("\n=== Playwright Tool Usage ===")
cursor.execute("""
SELECT json_extract(p.data, '$.tool') as tool,
       json_extract(p.data, '$.state.input') as input_data,
       count(*) as n
FROM message m
JOIN part p ON p.message_id = m.id
WHERE json_extract(m.data, '$.role') = 'assistant'
  AND json_extract(p.data, '$.type') = 'tool'
  AND json_extract(p.data, '$.tool') LIKE 'playwright%'
  AND m.time_created > 1749388800000
GROUP BY tool
ORDER BY n DESC
""")
rows = cursor.fetchall()
for row in rows:
    print(f'  {row[2]}x {row[0]}')

# Query for git operations
print("\n=== Git Operations ===")
cursor.execute("""
SELECT substr(json_extract(p.data, '$.state.input'), 1, 200) as input_preview,
       count(*) as n
FROM message m
JOIN part p ON p.message_id = m.id
WHERE json_extract(m.data, '$.role') = 'assistant'
  AND json_extract(p.data, '$.type') = 'tool'
  AND json_extract(p.data, '$.tool') = 'bash'
  AND json_extract(p.data, '$.state.input') LIKE '%git%'
  AND m.time_created > 1749388800000
GROUP BY input_preview
HAVING n > 1
ORDER BY n DESC
LIMIT 20
""")
rows = cursor.fetchall()
for row in rows:
    print(f'  {row[1]}x: {row[0][:150] if row[0] else "N/A"}')

conn.close()
