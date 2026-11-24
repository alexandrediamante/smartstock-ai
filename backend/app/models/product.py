from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    unit = Column(String(20), default="un")  # un, kg, l, cx
    cost_price = Column(Numeric(12, 2), nullable=False, default=0)
    sale_price = Column(Numeric(12, 2), nullable=False, default=0)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive

    # Relationships
    category = relationship("Category", backref="products")
    supplier = relationship("Supplier", backref="products")
    stock = relationship("Stock", back_populates="product", uselist=False)
    batches = relationship("StockBatch", back_populates="product", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="product")

    def __repr__(self):
        return f"<Product(id={self.id}, sku='{self.sku}', name='{self.name}')>"