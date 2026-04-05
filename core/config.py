from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    CORS_ORIGINS: str = "http://localhost:5173"
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    OPENAI_API_KEY: str = ""
    AI_REVIEWS_API_URL: str = "https://api.openai.com/v1/chat/completions"
    AI_REVIEWS_MODEL: str = "gpt-4o-mini"
    AI_REVIEWS_MIN_COUNT: int = 3
    AI_REVIEWS_MAX_FETCH: int = 40
    AI_REVIEWS_MAX_CONTEXT_CHARS: int = 12000
    AI_REVIEWS_PER_REVIEW_MAX_CHARS: int = 800
    AI_REVIEWS_TIMEOUT_SEC: float = 60.0

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()