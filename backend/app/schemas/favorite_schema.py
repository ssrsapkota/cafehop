from pydantic import BaseModel, ConfigDict


class FavoriteBase(BaseModel):
    cafe_id: int


class FavoriteOut(FavoriteBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)
