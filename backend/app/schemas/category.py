from pydantic import BaseModel


class CategoryBase(BaseModel):
    gala_id: int
    name: str
    description: str | None = None
    icon: str | None = None
    order_index: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    icon: str | None = None
    order_index: int | None = None


class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True


class CategoryWithStats(CategoryOut):
    total_votes: int = 0
    nominees_count: int = 0
