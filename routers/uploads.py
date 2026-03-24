import uuid
from fastapi import APIRouter, UploadFile, File, Depends, Request
from core.dependencies import get_current_user
from core.exceptions import BadRequest
from core.limiter import limiter
from core.logging_config import get_logger

router = APIRouter(prefix="/uploads", tags=["Uploads"])
logger = get_logger(__name__)

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_SIZE = 5 * 1024 * 1024


@router.post("/image")
@limiter.limit("30/hour")  # не больше 30 загрузок в час
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise BadRequest("Только JPEG, PNG, WEBP")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise BadRequest("Файл больше 5MB")

    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    filepath = f"static/images/{filename}"

    with open(filepath, "wb") as f:
        f.write(contents)

    logger.info(f"Загружено изображение: {filename} by={current_user.username}")
    return {"url": f"/static/images/{filename}"}