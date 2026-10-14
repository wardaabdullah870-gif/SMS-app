
from contextlib import contextmanager
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr


# Create the FastAPI application
app = FastAPI(title="Student Management API")


# Allow the React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Keep the database beside this Python file
DATABASE = Path(__file__).resolve().parent / "students.db"


# Open and safely close database connections
@contextmanager
def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row

    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


# Create the table and upgrade existing databases safely
def create_table():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                course TEXT NOT NULL
            )
        """)

        existing_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(students)"
            ).fetchall()
        }

        new_columns = {
            "phone": "TEXT NOT NULL DEFAULT ''",
            "date_of_birth": "TEXT NOT NULL DEFAULT ''",
            "enrollment_date": "TEXT NOT NULL DEFAULT ''",
            "status": "TEXT NOT NULL DEFAULT 'Active'",
        }

        for column, definition in new_columns.items():
            if column not in existing_columns:
                connection.execute(
                    f"ALTER TABLE students ADD COLUMN {column} {definition}"
                )


# Student data accepted by the API
class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    course: str
    phone: str = ""
    date_of_birth: str = ""
    enrollment_date: str = ""
    status: str = "Active"


# Student data returned by the API
class StudentResponse(StudentCreate):
    id: int


# The fields returned for each student
STUDENT_FIELDS = """
    id, name, email, course, phone,
    date_of_birth, enrollment_date, status
"""


# Create or upgrade the database when the application starts
create_table()


@app.get("/")
def home():
    return {"message": "Student Management API is running"}


# Get all students
@app.get("/students", response_model=list[StudentResponse])
def get_students():
    with get_connection() as connection:
        rows = connection.execute(
            f"""
            SELECT {STUDENT_FIELDS}
            FROM students
            ORDER BY id DESC
            """
        ).fetchall()

        return [dict(row) for row in rows]


# Add a student
@app.post(
    "/students",
    response_model=StudentResponse,
    status_code=201,
)
def add_student(student: StudentCreate):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO students (
                    name, email, course, phone,
                    date_of_birth, enrollment_date, status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    student.name,
                    str(student.email),
                    student.course,
                    student.phone,
                    student.date_of_birth,
                    student.enrollment_date,
                    student.status,
                ),
            )

            row = connection.execute(
                f"""
                SELECT {STUDENT_FIELDS}
                FROM students
                WHERE id = ?
                """,
                (cursor.lastrowid,),
            ).fetchone()

            return dict(row)

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered",
        )


# Edit a student
@app.put("/students/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student: StudentCreate):
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                UPDATE students
                SET name = ?,
                    email = ?,
                    course = ?,
                    phone = ?,
                    date_of_birth = ?,
                    enrollment_date = ?,
                    status = ?
                WHERE id = ?
                """,
                (
                    student.name,
                    str(student.email),
                    student.course,
                    student.phone,
                    student.date_of_birth,
                    student.enrollment_date,
                    student.status,
                    student_id,
                ),
            )

            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Student not found",
                )

            row = connection.execute(
                f"""
                SELECT {STUDENT_FIELDS}
                FROM students
                WHERE id = ?
                """,
                (student_id,),
            ).fetchone()

            return dict(row)

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered",
        )


# Delete a student
@app.delete("/students/{student_id}")
def delete_student(student_id: int):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM students WHERE id = ?",
            (student_id,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Student not found",
            )

    return {"message": "Student deleted successfully"}
