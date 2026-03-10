from pydantic import BaseModel

class PlatformBase(BaseModel):
    name: str

class PlatformCreate(PlatformBase):
    pass

class PlatformUpdate(PlatformBase):
    pass

class PlatformResponse(PlatformBase):
    id: int

    class Config:
        from_attributes = True