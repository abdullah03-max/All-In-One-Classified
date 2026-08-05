from pathlib import Path
import re

root = Path('d:/marketplace')
const_path = root / 'src' / 'utils' / 'constants.ts'

text = const_path.read_text(encoding='utf-8')
lines = text.splitlines()
new_lines = []
next_id = 101
pattern = re.compile(r"^(\s*)\{\s*id:\s*''\s*,")
for line in lines:
    m = pattern.match(line)
    if m:
        ident = f"c1000000-0000-0000-0000-{next_id:012d}"
        new_lines.append(line.replace("id: ''", f"id: '{ident}'", 1))
        next_id += 1
    else:
        new_lines.append(line)
const_path.write_text('\n'.join(new_lines) + ('\n' if text.endswith('\n') else ''), encoding='utf-8')
print(f'Patched {next_id - 101} subcategory ids in {const_path}')
