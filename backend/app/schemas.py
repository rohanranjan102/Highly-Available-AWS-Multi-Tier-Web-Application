from pydantic import BaseModel


class StudentCreate(BaseModel):
    name: str
    student_class: str
    subject: str


class StudentResponse(BaseModel):
    id: int
    name: str
    student_class: str
    subject: str

    class Config:
        from_attributes = True
