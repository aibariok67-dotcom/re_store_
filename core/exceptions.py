from fastapi import HTTPException

class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class BadRequest(AppException):
    def __init__(self, detail: str = "Некорректный запрос"):
        super().__init__(400, detail)


class PayloadTooLarge(AppException):
    def __init__(self, detail: str = "Файл слишком большой"):
        super().__init__(413, detail)


class UploadFailed(AppException):
    def __init__(self, detail: str = "Не удалось загрузить файл. Попробуйте позже"):
        super().__init__(503, detail)


class InvalidToken(AppException):
    def __init__(self):
        super().__init__(401, "Невалидный или истёкший токен")

class InvalidCredentials(AppException):
    def __init__(self):
        super().__init__(401, "Неверный логин или пароль")


class PermissionDenied(AppException):
    def __init__(self, detail: str = "Нет прав доступа"):
        super().__init__(403, detail)

class UserBanned(AppException):
    def __init__(self, detail: str = "Вы заблокированы"):
        super().__init__(403, detail)


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


class TooFewReviews(BadRequest):
    def __init__(self, detail: str):
        super().__init__(detail=detail)


class AIServiceError(AppException):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(status_code=status_code, detail=detail)


class CategoryNameTaken(AlreadyExists):
    def __init__(self):
        super().__init__("Категория с таким названием")


class PlatformNameTaken(AlreadyExists):
    def __init__(self):
        super().__init__("Платформа с таким названием")
