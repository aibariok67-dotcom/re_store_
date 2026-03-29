import uuid

import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage
from fastapi import APIRouter, Depends, File, Request, UploadFile
from starlette.concurrency import run_in_threadpool

from core.config import settings
from core.dependencies import get_current_user
from core.exceptions import BadRequest, UploadFailed
from core.limiter import limiter
from core.logging_config import get_logger
from core.upload_utils import MAX_IMAGE_UPLOAD_BYTES, ensure_allowed_image, read_upload_with_byte_limit
from models.user import User

router = APIRouter(prefix="/uploads", tags=["Uploads"])
logger = get_logger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)


def _cloudinary_upload_image(contents: bytes, public_id: str) -> dict:
    """Синхронный вызов Cloudinary — выполнять через run_in_threadpool."""
    return cloudinary.uploader.upload(
        contents,
        public_id=public_id,
        folder="re_store",
    )


@router.post("/image")
@limiter.limit("30/hour")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    # Content-Type — лишь подсказка; решение по типу — по сигнатуре после чтения.
    if file.content_type and not file.content_type.startswith("image/"):
        raise BadRequest("Ожидается файл изображения")

    contents = await read_upload_with_byte_limit(file, MAX_IMAGE_UPLOAD_BYTES)
    detected_mime = ensure_allowed_image(contents)

    if file.content_type and file.content_type != detected_mime:
        logger.debug(
            "upload content_type mismatch: declared=%s detected=%s user=%s",
            file.content_type,
            detected_mime,
            current_user.username,
        )

    try:
        result = await run_in_threadpool(
            _cloudinary_upload_image,
            contents,
            str(uuid.uuid4()),
        )
    except Exception as exc:
        logger.exception("Ошибка загрузки в Cloudinary: %s", exc)
        raise UploadFailed() from exc

    optimized_url = CloudinaryImage(result["public_id"]).build_url(
        secure=True,
        fetch_format="auto",
        quality="auto",
        width=1200,
        crop="limit",
    )

    logger.info(
        "Загружено изображение в cloudinary: %s by=%s",
        optimized_url,
        current_user.username,
    )

    return {"url": optimized_url}
