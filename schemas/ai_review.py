from pydantic import BaseModel, Field


class GameReviewsAISummaryResponse(BaseModel):
    game_id: int
    summary: str = Field(..., min_length=1, max_length=2000)
    positives: list[str] = Field(default_factory=list, max_length=30)
    negatives: list[str] = Field(default_factory=list, max_length=30)
    conclusion: str = Field(..., min_length=1, max_length=2000)


class _LLMReviewAnalysisShape(BaseModel):
    summary: str = Field(..., min_length=1, max_length=2000)
    positives: list[str] = Field(default_factory=list, max_length=30)
    negatives: list[str] = Field(default_factory=list, max_length=30)
    conclusion: str = Field(..., min_length=1, max_length=2000)

    @classmethod
    def normalize_lists(cls, data: dict) -> dict:
        out = dict(data)
        for key in ("positives", "negatives"):
            raw = out.get(key) or []
            if not isinstance(raw, list):
                raw = []
            cleaned: list[str] = []
            for item in raw:
                if isinstance(item, str):
                    s = item.strip()
                    if s:
                        cleaned.append(s[:200])
                elif item is not None:
                    s = str(item).strip()
                    if s:
                        cleaned.append(s[:200])
            out[key] = cleaned[:30]
        return out
