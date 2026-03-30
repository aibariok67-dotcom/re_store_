"""Порционное чтение upload и определение типа изображения по магическим байтам."""

from __future__ import annotations

from fastapi import UploadFile

from core.exceptions import BadRequest, PayloadTooLarge

MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

READ_CHUNK_SIZE = 256 * 1024

ALLOWED_IMAGE_MIMES = frozenset({"image/jpeg", "image/png", "image/webp"})


def sniff_image_mime(data: bytes) -> str | None:
    """
    Определяет MIME по сигнатурам файла (не по заголовку Content-Type клиента).
    Возвращает image/jpeg | image/png | image/webp или None.
    """
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


async def read_upload_with_byte_limit(file: UploadFile, max_bytes: int) -> bytes:
    """
    Читает тело файла чанками; если суммарный размер превышает max_bytes,
    выбрасывает PayloadTooLarge, не накапливая лишние данные сверх лимита.
    """
    if max_bytes < 0:
        raise ValueError("max_bytes must be non-negative")

    parts: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(READ_CHUNK_SIZE)
        if not chunk:
            break
        if total + len(chunk) > max_bytes:
            raise PayloadTooLarge(
                f"Файл больше допустимого размера ({max_bytes // (1024 * 1024)} МБ)"
            )
        total += len(chunk)
        parts.append(chunk)

    body = b"".join(parts)
    if not body:
        raise BadRequest("Пустой файл")
    return body


def ensure_allowed_image(body: bytes) -> str:
    """
    Проверяет, что содержимое — JPEG, PNG или WebP по сигнатуре.
    Возвращает определённый MIME.
    """
    mime = sniff_image_mime(body)
    if mime is None or mime not in ALLOWED_IMAGE_MIMES:
        raise BadRequest("Допустимы только изображения JPEG, PNG или WebP")
    return mime
