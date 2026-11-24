from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class StockBatch(Base):
    __tablename__ = "stock_batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_code = Column(String(50), nullable=False, index=True)
    quantity = Column(Numeric(12, 3), nullable=False, default=0)
    expiration_date = Column(Date, nullable=False, index=True)
    unit_cost = Column(Numeric(12, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    product = relationship("Product", back_populates="batches")
    sales = relationship("Sale", back_populates="batch")

    def __repr__(self):
        return f"<StockBatch(id={self.id}, product_id={self.product_id}, batch='{self.batch_code}', exp={self.expiration_date})>"