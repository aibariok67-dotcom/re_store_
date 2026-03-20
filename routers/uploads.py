import uuid
import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from core.dependencies import get_current_user

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
MAX_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    # Проверяем тип файла
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Только JPEG, PNG, WEBP")

    # Читаем файл и проверяем размер
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Файл больше 5MB")

    # Генерируем уникальное имя файла
    extension = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{extension}"
    filepath = f"static/images/{filename}"

    # Сохраняем на диск
    with open(filepath, "wb") as f:
        f.write(contents)

    # Возвращаем URL по которому можно получить картинку
    return {"url": f"/static/images/{filename}"}