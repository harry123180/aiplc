"""Skill retrieval service -- loads design skills from markdown files."""
import os
import re
from pathlib import Path
from dataclasses import dataclass

SKILLS_DIR = Path(__file__).resolve().parents[1] / "skills"

@dataclass
class Skill:
    name: str
    description: str
    triggers: list[str]
    content: str  # full markdown content after frontmatter

def _parse_skill(path: Path) -> Skill | None:
    """Parse a skill markdown file with YAML-like frontmatter."""
    text = path.read_text(encoding="utf-8")

    # Extract frontmatter between --- markers
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', text, re.DOTALL)
    if not match:
        return None

    frontmatter, content = match.groups()

    # Simple YAML-like parsing (no pyyaml dependency)
    name = ""
    description = ""
    triggers: list[str] = []
    in_triggers = False

    for line in frontmatter.split('\n'):
        line = line.strip()
        if line.startswith('name:'):
            name = line.split(':', 1)[1].strip()
        elif line.startswith('description:'):
            description = line.split(':', 1)[1].strip()
        elif line.startswith('triggers:'):
            in_triggers = True
        elif in_triggers and line.startswith('- '):
            triggers.append(line[2:].strip())
        elif in_triggers and not line.startswith('-'):
            in_triggers = False

    if not name:
        return None

    return Skill(name=name, description=description, triggers=triggers, content=content.strip())

def _load_all_skills() -> list[Skill]:
    """Load all skill files from the skills directory."""
    skills: list[Skill] = []
    if not SKILLS_DIR.exists():
        return skills
    for path in sorted(SKILLS_DIR.glob("*.md")):
        skill = _parse_skill(path)
        if skill:
            skills.append(skill)
    return skills

# Cache skills on first load
_skills_cache: list[Skill] | None = None

def _get_skills() -> list[Skill]:
    global _skills_cache
    if _skills_cache is None:
        _skills_cache = _load_all_skills()
    return _skills_cache

def reload_skills() -> int:
    """Force reload skills from disk. Returns count."""
    global _skills_cache
    _skills_cache = _load_all_skills()
    return len(_skills_cache)

def search_skills(query: str) -> list[dict]:
    """Search skills by matching query against triggers and descriptions.
    Returns list of {name, description, content} sorted by relevance."""
    query_lower = query.lower()
    results = []

    for skill in _get_skills():
        score = 0
        # Check triggers
        for trigger in skill.triggers:
            if trigger.lower() in query_lower or query_lower in trigger.lower():
                score += 10
        # Check name
        if query_lower in skill.name.lower():
            score += 5
        # Check description
        if query_lower in skill.description.lower():
            score += 3

        if score > 0:
            results.append({
                "name": skill.name,
                "description": skill.description,
                "content": skill.content,
                "score": score,
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results

def list_skills() -> list[dict]:
    """List all available skills (name + description only, no content)."""
    return [{"name": s.name, "description": s.description, "triggers": s.triggers} for s in _get_skills()]
