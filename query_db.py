import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\Epoly\.local\share\mimocode\mimocode.db')
cursor = conn.cursor()

# Get schema
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print('Tables:', [t[0] for t in tables])

# Get columns for session table
cursor.execute('PRAGMA table_info(session)')
cols = cursor.fetchall()
print('Session cols:', [(c[1], c[2]) for c in cols])

# Get columns for message table
cursor.execute('PRAGMA table_info(message)')
cols = cursor.fetchall()
print('Message cols:', [(c[1], c[2]) for c in cols])

# Get columns for part table
cursor.execute('PRAGMA table_info(part)')
cols = cursor.fetchall()
print('Part cols:', [(c[1], c[2]) for c in cols])

# Get recent sessions
cursor.execute('SELECT * FROM session ORDER BY time_created DESC LIMIT 10')
rows = cursor.fetchall()
print('\n--- Recent Sessions ---')
for row in rows:
    print(f'ID: {row[0]}, time: {row[1]}, data: {str(row[2])[:200] if len(row) > 2 else "N/A"}')

conn.close()
