"""Разбиение текста на чанки для индексации."""


def chunk_text(
    text: str,
    chunk_size: int = 800,
    chunk_overlap: int = 100
) -> list[str]:
    """Разбиение текста на перекрывающиеся чанки."""
    if not text:
        return []

    chunks = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = start + chunk_size
        chunk = text[start:end]

        # Пытаемся разбить по предложению/абзацу
        if end < text_len:
            last_period = chunk.rfind(".")
            last_newline = chunk.rfind("\n")
            break_point = max(last_period, last_newline)
            if break_point > chunk_size // 2:
                chunk = text[start:start + break_point + 1]
                end = start + break_point + 1

        chunks.append(chunk.strip())
        start = end - chunk_overlap

    return [c for c in chunks if c]
