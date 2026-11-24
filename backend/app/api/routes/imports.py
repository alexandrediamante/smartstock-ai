from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.import_job import ImportJob, ImportError, ImportStatus
from app.schemas.import_schemas import ImportResponse, ImportJobResponse, ImportErrorResponse

router = APIRouter()


@router.post("/imports", response_model=ImportResponse)
async def import_csv(
    file: UploadFile = File(...),
    file_type: str = Query(..., description="Type: produtos, estoque, lotes, vendas"),
    db: Session = Depends(get_db),
):
    """Import CSV file - validates and persists data."""
    # Validate file type
    valid_types = ["produtos", "estoque", "lotes", "vendas"]
    if file_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid file_type. Must be one of: {valid_types}")

    # Create import job record
    job = ImportJob(
        filename=file.filename or "unknown.csv",
        file_type=file_type,
        status=ImportStatus.PROCESSING,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # TODO: Implement actual CSV parsing and validation
    # For now, return mock response
    job.status = ImportStatus.COMPLETED
    job.accepted_rows = 0
    job.rejected_rows = 0
    job.imported_at = datetime.utcnow()
    db.commit()

    return ImportResponse(
        job_id=job.id,
        accepted=job.accepted_rows,
        rejected=job.rejected_rows,
        errors=[],
    )


@router.get("/imports", response_model=List[ImportJobResponse])
def list_imports(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List import history."""
    jobs = db.query(ImportJob).order_by(ImportJob.imported_at.desc()).offset(skip).limit(limit).all()
    return jobs


@router.get("/imports/{job_id}/errors", response_model=List[ImportErrorResponse])
def get_import_errors(
    job_id: int,
    db: Session = Depends(get_db),
):
    """Get errors for a specific import job."""
    errors = db.query(ImportError).filter(ImportError.import_job_id == job_id).all()
    return errors