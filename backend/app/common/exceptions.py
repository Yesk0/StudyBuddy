"""Domain errors raised by services; app.main turns them into HTTP responses."""

from fastapi import status


class AppError(Exception):
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT


class InvalidDataError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class TooManyRequestsError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


class ExternalServiceError(AppError):
    status_code = status.HTTP_502_BAD_GATEWAY
