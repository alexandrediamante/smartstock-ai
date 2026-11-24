from sqlalchemy import Column, Integer, String
from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    lead_time_days = Column(Integer, nullable=False, default=7)
    contact_email = Column(String(200), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    is_active = Column(Integer, default=1)

    def __repr__(self):
        return f"<Supplier(id={self.id}, name='{self.name}', lead_time={self.lead_time_days}d)>"