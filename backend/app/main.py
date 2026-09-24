from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import Student
from app.schemas import StudentCreate, StudentResponse


app = FastAPI()
Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:4200",
    "http://localhost:8080",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a database session
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Student Backend is running!"}


@app.post("/students", response_model=StudentResponse)
def add_student(student: StudentCreate, db: Session = Depends(get_db)):

    new_student = Student(
        name=student.name,
        student_class=student.student_class,
        subject=student.subject
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return new_student


@app.get("/students", response_model=list[StudentResponse])
def get_students(db: Session = Depends(get_db)):

    students = db.query(Student).all()

    return students
