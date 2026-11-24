from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Stock(Base):
    __tablename__ = "stock"

    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    quantity = Column(Numeric(12, 3), nullable=False, default=0)
    minimum_quantity = Column(Numeric(12, 3), nullable=False, default=0)
    safety_stock = Column(Numeric(12, 3), nullable=False, default=0)

    # Relationship
    product = relationship("Product", back_populates="stock")

    def __repr__(self):
        return f"<Stock(product_id={self.product_id}, qty={self.quantity}, min={self.minimum_quantity})>"