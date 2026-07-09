"""Парсеры документов для базы знаний."""
import io
from pathlib import Path


def parse_pdf(file_bytes: bytes) -> str:
    """Извлечение текста из PDF."""
    import fitz  # PyMuPDF
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def parse_docx(file_bytes: bytes) -> str:
    """Извлечение текста из DOCX."""
    from docx import Document
    doc = Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs)


def parse_txt(file_bytes: bytes) -> str:
    """Извлечение текста из TXT."""
    return file_bytes.decode("utf-8", errors="ignore")


PARSERS = {
    ".pdf": parse_pdf,
    ".docx": parse_docx,
    ".txt": parse_txt,
    ".md": parse_txt,
}


def parse_document(file_bytes: bytes, filename: str) -> str:
    """Выбор парсера по расширению файла."""
    ext = Path(filename).suffix.lower()
    parser = PARSERS.get(ext)
    if not parser:
        raise ValueError(f"Неподдерживаемый формат: {ext}")
    return parser(file_bytes)
