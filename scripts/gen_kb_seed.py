#!/usr/bin/env python3
"""Generate the 4E knowledge-base + system-prompt seed migration.

- system prompt: the content inside the ```text fence of ai_system_prompt_4E.md
- knowledge base: split knowledge_base_4E.md on '## ' headings (one doc each),
  category = nearest '# ' group above, chunk sections to ~1000 words (title + parte N),
  skip '## Indice'. Stored globally in ai_training_data (no center_id), data_type
  'knowledge_base', description = category.
"""
import re
import sys

PACK = "aethera_md_pack"
OUT = "supabase/migrations/20260716130000_seed_ai_knowledge_base.sql"
CHUNK_WORDS = 1000

def sql_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"

# ---- system prompt (inside the ```text fence) ----
with open(f"{PACK}/ai_system_prompt_4E.md", encoding="utf-8") as f:
    prompt_md = f.read()
m = re.search(r"```[a-zA-Z]*\n(.*?)```", prompt_md, re.DOTALL)
if not m:
    print("ERROR: no fenced block in system prompt file", file=sys.stderr)
    sys.exit(1)
system_prompt = m.group(1).strip()

# ---- knowledge base ----
with open(f"{PACK}/knowledge_base_4E.md", encoding="utf-8") as f:
    lines = f.read().split("\n")

sections = []          # list of (category, title, body_lines)
current_group = None   # nearest '# ' heading
cur_title = None
cur_body = []

def flush():
    if cur_title is not None and cur_title.strip().lower() != "indice":
        sections.append((current_group, cur_title, cur_body[:]))

for line in lines:
    if re.match(r"^# (?!#)", line):          # '# ' group heading
        flush()
        cur_title = None
        cur_body = []
        current_group = line[2:].strip()
    elif line.startswith("## "):             # '## ' section heading
        flush()
        cur_title = line[3:].strip()
        cur_body = []
    else:
        if cur_title is not None:
            cur_body.append(line)
flush()

def chunk(body_lines):
    """Split body into ~CHUNK_WORDS chunks, breaking on blank lines."""
    text = "\n".join(body_lines).strip()
    blocks = re.split(r"\n\s*\n", text)          # paragraphs
    chunks, cur, cur_words = [], [], 0
    for b in blocks:
        w = len(b.split())
        if cur_words + w > CHUNK_WORDS and cur:
            chunks.append("\n\n".join(cur).strip())
            cur, cur_words = [], 0
        cur.append(b)
        cur_words += w
    if cur:
        chunks.append("\n\n".join(cur).strip())
    return [c for c in chunks if c]

rows = []  # (title, category, content)
for category, title, body in sections:
    parts = chunk(body)
    if len(parts) <= 1:
        content = parts[0] if parts else ""
        if content.strip():
            rows.append((title, category or "", content))
    else:
        for i, part in enumerate(parts, 1):
            rows.append((f"{title} (parte {i})", category or "", part))

# ---- emit migration ----
with open(OUT, "w", encoding="utf-8") as out:
    out.write(
        "-- Seed: 4E system prompt + knowledge base (lexical/full-text retrieval).\n"
        "-- GENERATED from aethera_md_pack/ai_system_prompt_4E.md and knowledge_base_4E.md.\n"
        "-- Knowledge base is GLOBAL (shared, no center_id). Idempotent: the system_prompt\n"
        "-- row is upserted and all knowledge_base rows are replaced on each run.\n\n"
    )
    out.write(
        "INSERT INTO public.ai_system_config (config_key, config_value, description, is_active, sort_order)\n"
        f"VALUES ('system_prompt', {sql_str(system_prompt)}, "
        "'Prompt di sistema base dell''assistente AI 4 Elementi', true, 0)\n"
        "ON CONFLICT (config_key) DO UPDATE\n"
        "  SET config_value = EXCLUDED.config_value,\n"
        "      description = EXCLUDED.description,\n"
        "      is_active = true,\n"
        "      updated_at = now();\n\n"
    )
    out.write("DELETE FROM public.ai_training_data WHERE data_type = 'knowledge_base';\n\n")
    out.write("INSERT INTO public.ai_training_data (title, description, content, data_type, is_active) VALUES\n")
    values = []
    for title, category, content in rows:
        values.append(f"  ({sql_str(title)}, {sql_str(category)}, {sql_str(content)}, 'knowledge_base', true)")
    out.write(",\n".join(values))
    out.write(";\n")

print(f"system prompt: {len(system_prompt)} chars")
print(f"sections (excl. Indice): {len(sections)}")
print(f"knowledge_base rows (chunks): {len(rows)}")
print("categories:", sorted(set(c or '' for _, c, _ in rows)))
print(f"wrote {OUT}")
