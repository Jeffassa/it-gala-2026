from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentImportResult, StudentOut, StudentUpdate
from app.services.students_import import import_students_from_xlsx

router = APIRouter(prefix="/students", tags=["students"], dependencies=[Depends(require_admin)])


@router.get("", response_model=list[StudentOut])
def list_students(
    db: Session = Depends(get_db),
    q: str | None = Query(None),
    promotion: str | None = Query(None),
    limit: int = Query(500, le=2000),
) -> list[StudentOut]:
    stmt = select(Student).order_by(Student.full_name).limit(limit)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(
            Student.full_name.ilike(like),
            Student.matricule.ilike(like),
            Student.email.ilike(like),
        ))
    if promotion:
        stmt = stmt.where(Student.promotion == promotion)
    return [StudentOut.model_validate(s) for s in db.scalars(stmt).all()]


@router.get("/promotions", response_model=list[str])
def list_promotions(db: Session = Depends(get_db)) -> list[str]:
    rows = db.execute(select(Student.promotion).distinct().order_by(Student.promotion)).all()
    return [r[0] for r in rows if r[0]]


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)) -> StudentOut:
    if db.scalar(select(Student).where(Student.matricule == payload.matricule)):
        raise HTTPException(status_code=400, detail="Matricule déjà enregistré")
    s = Student(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return StudentOut.model_validate(s)


@router.patch("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)) -> StudentOut:
    s = db.get(Student, student_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return StudentOut.model_validate(s)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)) -> None:
    s = db.get(Student, student_id)
    if s is None:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")
    db.delete(s)
    db.commit()


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete_all(db: Session = Depends(get_db), promotion: str | None = Query(None)) -> None:
    """Bulk delete — optionally filtered by promotion."""
    stmt = select(Student)
    if promotion:
        stmt = stmt.where(Student.promotion == promotion)
    for s in db.scalars(stmt).all():
        db.delete(s)
    db.commit()


@router.post("/import", response_model=StudentImportResult)
async def import_students(
    file: UploadFile = File(...),
    promotion: str | None = Query(None, description="Promotion par défaut si la colonne est absente du fichier"),
    db: Session = Depends(get_db),
) -> StudentImportResult:
    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Format non supporté — uploadez un fichier .xlsx")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (>10 Mo)")
    try:
        result = import_students_from_xlsx(db, content, default_promotion=promotion)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Erreur de lecture : {exc}")
    return StudentImportResult(**result)
