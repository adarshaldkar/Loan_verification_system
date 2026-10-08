import sys

with open('lib/verificationProfiles.ts', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'code:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*category:\s*"([^"]+)"', text)
for i, (code, name, cat) in enumerate(matches, 1):
    sys.stdout.buffer.write(f"{i}. Code: {code} | Name: {name} | Category: {cat}\n".encode('utf-8'))
