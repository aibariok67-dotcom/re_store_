import cloudinary
import cloudinary.uploader
import uuid

from fastapi import APIRouter, UploadFile, File, Depends, Request
from core.dependencies import get_current_user
from models.user import User
from core.exceptions import BadRequest
from core.limiter import limiter
from core.logging_config import get_logger
from core.config import settings
from cloudinary import CloudinaryImage

router = APIRouter(prefix="/uploads", tags=["Uploads"])
logger = get_logger(__name__)

# настройка cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_SIZE = 5 * 1024 * 1024


@router.post("/image")
@limiter.limit("30/hour")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise BadRequest("Только JPEG, PNG, WEBP")

    contents = await file.read()

    if len(contents) > MAX_SIZE:
        raise BadRequest("Файл больше 5MB")

    # загрузка в cloudinary
    result = cloudinary.uploader.upload(
        contents,
        public_id=str(uuid.uuid4()),
        folder="re_store",
    )

    optimized_url = CloudinaryImage(result["public_id"]).build_url(
        secure=True,
        fetch_format="auto",
        quality="auto",
        width=1200,
        crop="limit",
    )

    logger.info(
        f"Загружено изображение в cloudinary: {optimized_url} by={current_user.username}"
    )

    return {"url": optimized_url}