from sqlalchemy import Column, Integer, Numeric, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("stock_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    sold_at = Column(DateTime(timezone=True), nullable=False, index=True)
    quantity = Column(Numeric(12, 3), nullable=False, default=0)
    unit_price = Column(Numeric(12, 2), nullable=False, default=0)

    # Relationships
    product = relationship("Product", back_populates="sales")
    batch = relationship("StockBatch", back_populates="sales")

    def __repr__(self):
        return f"<Sale(id={self.id}, product_id={self.product_id}, qty={self.quantity}, date={self.sold_at})>"