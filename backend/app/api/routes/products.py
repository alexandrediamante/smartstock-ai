from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, timedelta

from app.core.database import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.stock import Stock
from app.models.stock_batch import StockBatch
from app.models.sale import Sale

router = APIRouter()


@router.get("/products")
def list_products(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    status: Optional[str] = None,  # "critical", "low", "ok"
    db: Session = Depends(get_db),
):
    """List products with filters and pagination."""
    query = db.query(Product).options(joinedload(Product.category), joinedload(Product.stock))

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))

    if category_id:
        query = query.filter(Product.category_id == category_id)

    if status == "critical":
        query = query.join(Stock).filter(Stock.quantity <= Stock.minimum_quantity)
    elif status == "low":
        query = query.join(Stock).filter(Stock.quantity <= Stock.minimum_quantity * 1.5, Stock.quantity > Stock.minimum_quantity)
    elif status == "ok":
        query = query.join(Stock).filter(Stock.quantity > Stock.minimum_quantity * 1.5)

    total = query.count()
    products = query.order_by(Product.name).offset(skip).limit(limit).all()

    return {
        "items": [
            {
                "id": p.id,
                "sku": p.sku,
                "name": p.name,
                "category": p.category.name if p.category else None,
                "unit": p.unit,
                "cost_price": str(p.cost_price),
                "sale_price": str(p.sale_price),
                "stock_quantity": float(p.stock.quantity) if p.stock else 0,
                "minimum_quantity": float(p.stock.minimum_quantity) if p.stock else 0,
                "is_active": p.is_active == 1,
            }
            for p in products
        ],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get product detail with batches and recent sales."""
    product = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.supplier),
        joinedload(Product.stock),
        joinedload(Product.batches),
    ).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Recent sales (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_sales = db.query(Sale).filter(
        Sale.product_id == product_id,
        Sale.sold_at >= thirty_days_ago
    ).order_by(Sale.sold_at.desc()).limit(10).all()

    return {
        "id": product.id,
        "sku": product.sku,
        "name": product.name,
        "category": product.category.name if product.category else None,
        "unit": product.unit,
        "cost_price": str(product.cost_price),
        "sale_price": str(product.sale_price),
        "supplier": product.supplier.name if product.supplier else None,
        "lead_time_days": product.supplier.lead_time_days if product.supplier else None,
        "stock": {
            "quantity": float(product.stock.quantity) if product.stock else 0,
            "minimum_quantity": float(product.stock.minimum_quantity) if product.stock else 0,
            "safety_stock": float(product.stock.safety_stock) if product.stock else 0,
        },
        "batches": [
            {
                "id": b.id,
                "batch_code": b.batch_code,
                "quantity": float(b.quantity),
                "expiration_date": str(b.expiration_date),
                "unit_cost": str(b.unit_cost),
            }
            for b in product.batches
        ],
        "recent_sales": [
            {
                "date": str(s.sold_at.date()),
                "quantity": float(s.quantity),
                "unit_price": str(s.unit_price),
            }
            for s in recent_sales
        ],
    }


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    """List all categories."""
    categories = db.query(Category).order_by(Category.name).all()
    return [{"id": c.id, "name": c.name} for c in categories]