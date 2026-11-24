from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.core.database import get_db
from app.models.product import Product
from app.models.stock import Stock

router = APIRouter()


@router.get("/stock/critical")
def get_critical_stock(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get products with stock at or below minimum."""
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.stock)
    ).join(Stock).filter(
        Stock.quantity <= Stock.minimum_quantity,
        Product.is_active == 1
    ).order_by(Stock.quantity / Stock.minimum_quantity)

    total = query.count()
    products = query.offset(skip).limit(limit).all()

    return {
        "items": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "category": p.category.name if p.category else None,
                "quantity": float(p.stock.quantity),
                "minimum_quantity": float(p.stock.minimum_quantity),
                "safety_stock": float(p.stock.safety_stock),
                "deficit": float(p.stock.minimum_quantity - p.stock.quantity),
                "status": "critical" if p.stock.quantity == 0 else "low",
            }
            for p in products
        ],
        "total": total,
    }