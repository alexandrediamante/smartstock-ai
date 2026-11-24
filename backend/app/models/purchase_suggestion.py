from sqlalchemy import Column, Integer, Numeric, String, DateTime, ForeignKey, Enum as SQLEnum, func
import enum
from app.core.database import Base


class SuggestionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ORDERED = "ordered"


class PurchaseSuggestion(Base):
    __tablename__ = "purchase_suggestions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_quantity = Column(Numeric(12, 3), nullable=False, default=0)
    reason = Column(String(500), nullable=False)
    status = Column(SQLEnum(SuggestionStatus), default=SuggestionStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<PurchaseSuggestion(id={self.id}, product_id={self.product_id}, qty={self.suggested_quantity}, status={self.status})>"