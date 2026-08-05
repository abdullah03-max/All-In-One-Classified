from pathlib import Path
import re

root = Path('d:/marketplace')
const_path = root / 'src' / 'utils' / 'constants.ts'
msql_path = root / 'src' / 'supabase' / 'migrations.sql'

# Extract subcategory slug->id map from constants.ts
text = const_path.read_text(encoding='utf-8')
subcat_map = {}
pattern = re.compile(r"\{\s*id:\s*'(?P<id>[^']+)'\s*,\s*name:\s*'(?P<name>[^']+)'\s*,\s*slug:\s*'(?P<slug>[^']+)'\s*,")
for m in pattern.finditer(text):
    sid = m.group('id')
    slug = m.group('slug')
    # skip top-level categories when parent_id absent? We only need all ids for mapping
    subcat_map[slug] = sid

if not subcat_map:
    raise SystemExit('No subcategory ids found in constants.ts')

msql_text = msql_path.read_text(encoding='utf-8')
lines = msql_text.splitlines()
out_lines = []
inside_insert = False
insert_columns_line = "INSERT INTO public.categories (name, slug, icon, parent_id, color) VALUES"
for line in lines:
    stripped = line.strip()
    if stripped == insert_columns_line:
        inside_insert = True
        out_lines.append("INSERT INTO public.categories (id, name, slug, icon, parent_id, color) VALUES")
        continue

    if inside_insert:
        if stripped.startswith('ON CONFLICT'):
            inside_insert = False
            out_lines.append(line)
            continue
        # match tuple rows with 5 values
        tuple_match = re.match(r"^(\s*)\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)(,?)$", line)
        if tuple_match:
            indent, name, slug, icon, parent_id, color, comma = tuple_match.groups()
            if slug not in subcat_map:
                raise SystemExit(f"Slug '{slug}' not found in constants.ts mapping")
            sid = subcat_map[slug]
            out_lines.append(f"{indent}('{sid}', '{name}', '{slug}', '{icon}', '{parent_id}', '{color}'){comma}")
            continue
    out_lines.append(line)

msql_path.write_text('\n'.join(out_lines) + ('\n' if msql_text.endswith('\n') else ''), encoding='utf-8')
print(f'Patched migrations.sql with {len(subcat_map)} explicit subcategory ids')
