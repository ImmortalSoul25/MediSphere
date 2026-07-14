import re

with open('src/pages/communications/PregnancyComms.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('.dueDate', '.expected_due_date')
content = content.replace('sortKey === "dueDate"', 'sortKey === "expected_due_date"')
content = content.replace('sortKey="dueDate"', 'sortKey="expected_due_date"')

with open('src/pages/communications/PregnancyComms.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
