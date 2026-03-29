from fastapi import HTTPException

class AppException(HTTPException):
    """Базовый класс для всех ошибок приложения."""
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


# ── 400 Bad Request ──────────────────────────────────────────────────────────
class BadRequest(AppException):
    def __init__(self, detail: str = "Некорректный запрос"):
        super().__init__(400, detail)


# ── 401 Unauthorized ─────────────────────────────────────────────────────────
class InvalidToken(AppException):
    def __init__(self):
        super().__init__(401, "Невалидный или истёкший токен")

class InvalidCredentials(AppException):
    def __init__(self):
        super().__init__(401, "Неверный логин или пароль")


# ── 403 Forbidden ────────────────────────────────────────────────────────────
class PermissionDenied(AppException):
    def __init__(self, detail: str = "Нет прав доступа"):
        super().__init__(403, detail)

class UserBanned(AppException):
    def __init__(self, detail: str = "Вы заблокированы"):
        super().__init__(403, detail)


# ── 404 Not Found ────────────────────────────────────────────────────────────
class NotFound(AppException):
    def __init__(self, what: str = "Объект"):
        super().__init__(404, f"{what} не найден")

class GameNotFound(NotFound):
    def __init__(self):
        super().__init__("Игра")

class UserNotFound(NotFound):
    def __init__(self):
        super().__init__("Пользователь")

class ReviewNotFound(NotFound):
    def __init__(self):
        super().__init__("Отзыв")

class CategoryNotFound(NotFound):
    def __init__(self):
        super().__init__("Категория")

class PlatformNotFound(NotFound):
    def __init__(self):
        super().__init__("Платформа")


# ── 409 Conflict ─────────────────────────────────────────────────────────────
class AlreadyExists(AppException):
    def __init__(self, what: str = "Объект"):
        super().__init__(409, f"{what} уже существует")

class EmailTaken(AlreadyExists):
    def __init__(self):
        super().__init__("Email")

class UsernameTaken(AlreadyExists):
    def __init__(self):
        super().__init__("Никнейм")

class AlreadyFavorited(AlreadyExists):
    def __init__(self):
        super().__init__("Игра уже в избранном")

class AlreadyReviewed(AlreadyExists):
    def __init__(self):
        super().__init__("Отзыв на эту игру")


class CategoryNameTaken(AlreadyExists):
    def __init__(self):
        super().__init__("Категория с таким названием")


class PlatformNameTaken(AlreadyExists):
    def __init__(self):
        super().__init__("Платформа с таким названием")
