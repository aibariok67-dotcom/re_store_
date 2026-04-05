from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.dependencies import get_current_user
from core.limiter import limiter
from core.logging_config import get_logger
from models.user import User
from schemas.ai_review import GameReviewsAISummaryResponse
from services import ai_service

router = APIRouter(prefix="/ai", tags=["AI"])
logger = get_logger(__name__)


@router.post(
    "/games/{game_id}/reviews-summary",
    response_model=GameReviewsAISummaryResponse,
    summary="Сводка отзывов (AI)",
)
@limiter.limit("30/hour")
async def post_game_reviews_ai_summary(
    request: Request,
    game_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    out = await ai_service.summarize_game_reviews(db, game_id)
    logger.info("AI reviews summary: game_id=%s user=%s", game_id, current_user.username)
    return out
