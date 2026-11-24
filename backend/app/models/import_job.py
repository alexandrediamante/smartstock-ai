from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, Text, ForeignKey, func
import enum
from app.core.database import Base


class ImportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # produtos, estoque, lotes, vendas
    status = Column(SQLEnum(ImportStatus), default=ImportStatus.PENDING, nullable=False)
    imported_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_rows = Column(Integer, default=0)
    rejected_rows = Column(Integer, default=0)
    error_summary = Column(Text, nullable=True)

    errors = relationship("ImportError", back_populates="import_job", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ImportJob(id={self.id}, file='{self.filename}', type={self.file_type}, status={self.status})>"


class ImportError(Base):
    __tablename__ = "import_errors"

    id = Column(Integer, primary_key=True, index=True)
    import_job_id = Column(Integer, ForeignKey("import_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    field = Column(String(100), nullable=True)
    message = Column(Text, nullable=False)

    import_job = relationship("ImportJob", back_populates="errors")

    def __repr__(self):
        return f"<ImportError(job_id={self.import_job_id}, row={self.row_number}, field={self.field})>"