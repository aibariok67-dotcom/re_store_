"""Helpers for SQLAlchemy IntegrityError (unique vs other constraints)."""

from sqlalchemy.exc import IntegrityError


def is_unique_violation(exc: IntegrityError) -> bool:
    orig = getattr(exc, "orig", None)
    if orig is not None:
        sqlstate = getattr(orig, "sqlstate", None) or getattr(orig, "pgcode", None)
        if sqlstate == "23505":
            return True
    text = str(orig if orig is not None else exc).lower()
    return (
        "unique constraint" in text
        or "unique violation" in text
        or "duplicate entry" in text
    )
