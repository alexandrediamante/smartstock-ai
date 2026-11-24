from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ImportErrorResponse(BaseModel):
    row_number: int
    field: Optional[str] = None
    message: str

    class Config:
        from_attributes = True


class ImportResponse(BaseModel):
    job_id: int
    accepted: int
    rejected: int
    errors: List[ImportErrorResponse] = []


class ImportJobResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    status: str
    imported_at: datetime
    accepted_rows: int
    rejected_rows: int
    error_summary: Optional[str] = None

    class Config:
        from_attributes = True