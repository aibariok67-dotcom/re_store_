import uuid
import os
import aiofiles

from fastapi import APIRouter, UploadFile, File, Depends, Request
from core.dependencies import get_current_user
from core.exceptions import BadRequest
from core.limiter import limiter
from core.logging_config import get_logger
from core.config import settings

router = APIRouter(prefix="/uploads", tags=["Uploads"])
logger = get_logger(__name__)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_SIZE = 5 * 1024 * 1024


@router.post("/image")
@limiter.limit("30/hour")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise BadRequest("Только JPEG, PNG, WEBP")

    # создаем папку если нет
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    size = 0

    async with aiofiles.open(filepath, "wb") as f:
        while chunk := await file.read(1024 * 1024):  # читаем по 1MB
            size += len(chunk)
            if size > MAX_SIZE:
                raise BadRequest("Файл больше 5MB")
            await f.write(chunk)

    logger.info(f"Загружено изображение: {filename} by={current_user.username}")

    return {"url": f"/uploads/{filename}"}