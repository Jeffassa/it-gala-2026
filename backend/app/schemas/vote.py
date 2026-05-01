from pydantic import BaseModel


class VoteCreate(BaseModel):
    nominee_id: int


class VoteOut(BaseModel):
    id: int
    user_id: int
    category_id: int
    nominee_id: int

    class Config:
        from_attributes = True


class MyVotesItem(BaseModel):
    category_id: int
    nominee_id: int
