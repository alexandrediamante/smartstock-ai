from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, func
import enum
from app.core.database import Base


class AlertType(str, enum.Enum):
    EXPIRING_SOON = "expiring_soon"
    LOSS_RISK = "loss_risk"
    BELOW_REORDER = "below_reorder"
    STOCKOUT_RISK = "stockout_risk"
    DEMAND_DROP = "demand_drop"
    IMPORT_ISSUES = "import_issues"


class AlertSeverity(str, enum.Enum):
    CRITICO = "critico"
    ATENCAO = "atencao"
    NORMAL = "normal"


class AlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("stock_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(SQLEnum(AlertType), nullable=False, index=True)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, index=True)
    message = Column(Text, nullable=False)
    status = Column(SQLEnum(AlertStatus), default=AlertStatus.OPEN, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<Alert(id={self.id}, type={self.type}, severity={self.severity}, status={self.status})>"