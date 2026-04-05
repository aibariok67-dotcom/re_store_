import json
import re
from typing import Any

import httpx
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.exceptions import AIServiceError, GameNotFound, TooFewReviews
from core.logging_config import get_logger
from models.game import Game
from schemas.ai_review import GameReviewsAISummaryResponse, _LLMReviewAnalysisShape
from services import review_service

logger = get_logger(__name__)


def _openai_api_key() -> str:
    key = (settings.OPENAI_API_KEY or "").strip()
    placeholder_markers = ("your_", "your-", "test", "example", "твой")
    lowered = key.lower()
    if not key or any(lowered.startswith(marker) for marker in placeholder_markers):
        return ""
    return key


def _build_reviews_context(
    rows: list[tuple[float, str]],
    max_total_chars: int,
    per_review_max_chars: int,
) -> str:
    parts: list[str] = []
    total = 0
    for i, (rating, text) in enumerate(rows, start=1):
        t = (text or "").strip()
        if len(t) > per_review_max_chars:
            t = t[: per_review_max_chars - 1].rstrip() + "…"
        block = f"Отзыв {i} (оценка {rating}/10):\n{t}\n\n"
        if total + len(block) > max_total_chars:
            break
        parts.append(block)
        total += len(block)
    return "".join(parts).strip()


def _extract_json_text(raw: str) -> str:
    s = raw.strip()
    fence = re.match(r"^```(?:json)?\s*\n?", s, re.IGNORECASE)
    if fence:
        s = s[fence.end() :]
        if s.rstrip().endswith("```"):
            s = s.rstrip()[:-3].rstrip()
    return s.strip()


def _parse_llm_payload(content: str) -> _LLMReviewAnalysisShape:
    try:
        text = _extract_json_text(content)
        data: Any = json.loads(text)
    except json.JSONDecodeError as e:
        logger.warning("AI reviews summary: JSON decode failed: %s", e)
        raise AIServiceError("Не удалось разобрать ответ нейросети (невалидный JSON).") from e

    if not isinstance(data, dict):
        raise AIServiceError("Ответ нейросети имеет неверный формат.")

    try:
        normalized = _LLMReviewAnalysisShape.normalize_lists(data)
        return _LLMReviewAnalysisShape.model_validate(normalized)
    except ValidationError as e:
        logger.warning("AI reviews summary: Pydantic validation failed: %s", e)
        raise AIServiceError("Ответ нейросети не прошёл проверку структуры.") from e


def _system_prompt() -> str:
    return (
        "Ты аналитик отзывов о видеоиграх. По приведённым ниже отзывам пользователей "
        "сделай обобщение на русском языке. Не выдумывай факты, которых нет в отзывах. "
        "Если мнений мало, формулируй осторожно. "
        "Поля positives и negatives — короткие фразы или слова (до нескольких слов каждая), без дубликатов."
    )


def _user_prompt(game_title: str, context: str) -> str:
    return (
        f"Игра: {game_title}\n\n"
        "Ниже отзывы (только они — источник правды):\n\n"
        f"{context}\n\n"
        "Верни один JSON-объект со строго такими ключами и типами:\n"
        '- "summary": string — 2–4 предложения, общая картина по отзывам;\n'
        '- "positives": array of strings — основные плюсы (3–8 пунктов, можно меньше если отзывов мало);\n'
        '- "negatives": array of strings — основные минусы (3–8 пунктов, можно меньше);\n'
        '- "conclusion": string — короткий вывод для потенциального покупателя (1–3 предложения).\n\n'
        "Не добавляй других ключей. Не используй markdown, только чистый JSON."
    )


async def _ensure_game_exists(db: AsyncSession, game_id: int) -> str:
    row = await db.execute(select(Game.title).where(Game.id == game_id))
    title = row.scalar_one_or_none()
    if title is None:
        raise GameNotFound()
    return str(title)


async def summarize_game_reviews(db: AsyncSession, game_id: int) -> GameReviewsAISummaryResponse:
    api_key = _openai_api_key()
    if not api_key:
        raise AIServiceError(
            "AI-анализ не настроен: задайте реальный OPENAI_API_KEY в окружении. "
            "Строки-заглушки вроде 'твой_ключ' не подойдут.",
            status_code=503,
        )

    title = await _ensure_game_exists(db, game_id)

    total = await review_service.count_reviews_for_game(db, game_id)
    if total < settings.AI_REVIEWS_MIN_COUNT:
        raise TooFewReviews(
            f"Недостаточно отзывов для анализа: сейчас {total}, нужно минимум {settings.AI_REVIEWS_MIN_COUNT}."
        )

    rows = await review_service.get_reviews_for_ai_context(db, game_id, settings.AI_REVIEWS_MAX_FETCH)
    if not rows:
        raise TooFewReviews(
            f"Недостаточно отзывов для анализа: сейчас 0, нужно минимум {settings.AI_REVIEWS_MIN_COUNT}."
        )

    context = _build_reviews_context(
        rows,
        max_total_chars=settings.AI_REVIEWS_MAX_CONTEXT_CHARS,
        per_review_max_chars=settings.AI_REVIEWS_PER_REVIEW_MAX_CHARS,
    )
    if not context:
        raise AIServiceError("Не удалось подготовить текст отзывов для анализа.")

    payload = {
        "model": settings.AI_REVIEWS_MODEL,
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": _user_prompt(title, context)},
        ],
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.AI_REVIEWS_TIMEOUT_SEC) as client:
            resp = await client.post(settings.AI_REVIEWS_API_URL, json=payload, headers=headers)
    except httpx.TimeoutException as e:
        logger.warning("AI reviews summary: timeout")
        raise AIServiceError("Превышено время ожидания ответа от AI-сервиса.") from e
    except httpx.RequestError as e:
        logger.warning("AI reviews summary: request error: %s", e)
        raise AIServiceError("Не удалось связаться с AI-сервисом.") from e

    if resp.status_code == 401:
        raise AIServiceError("Неверный или просроченный API-ключ AI.", status_code=503)
    if resp.status_code >= 400:
        logger.warning(
            "AI reviews summary: HTTP %s body=%s",
            resp.status_code,
            resp.text[:500],
        )
        raise AIServiceError("AI-сервис вернул ошибку. Попробуйте позже.")

    try:
        body = resp.json()
        content = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError) as e:
        logger.warning("AI reviews summary: unexpected response shape")
        raise AIServiceError("Неожиданный формат ответа AI-сервиса.") from e

    if not isinstance(content, str) or not content.strip():
        raise AIServiceError("Пустой ответ от AI-сервиса.")

    parsed = _parse_llm_payload(content)
    return GameReviewsAISummaryResponse(
        game_id=game_id,
        summary=parsed.summary.strip(),
        positives=parsed.positives,
        negatives=parsed.negatives,
        conclusion=parsed.conclusion.strip(),
    )
