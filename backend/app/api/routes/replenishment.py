from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, timedelta

from app.core.database import get_db
from app.models.product import Product
from app.models.stock import Stock
from app.models.sale import Sale
from app.models.supplier import Supplier
from app.core.config import get_settings

router = APIRouter()


@router.get("/replenishment")
def get_replenishment_suggestions(db: Session = Depends(get_db)):
    """Get purchase suggestions based on reorder point calculation."""
    settings = get_settings()
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Get all active products with stock
    products = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.supplier),
        joinedload(Product.stock)
    ).join(Stock).filter(Product.is_active == 1).all()

    # Calculate sales averages (7d and 30d)
    sales_7d = db.query(
        Sale.product_id,
        func.sum(Sale.quantity).label("total")
    ).filter(Sale.sold_at >= week_ago).group_by(Sale.product_id).all()

    sales_30d = db.query(
        Sale.product_id,
        func.sum(Sale.quantity).label("total")
    ).filter(Sale.sold_at >= month_ago).group_by(Sale.product_id).all()

    sales_7d_map = {pid: float(total) / 7 for pid, total in sales_7d}
    sales_30d_map = {pid: float(total) / 30 for pid, total in sales_30d}

    results = []
    for product in products:
        stock = product.stock
        if not stock:
            continue

        daily_sales_7d = sales_7d_map.get(product.id, 0)
        daily_sales_30d = sales_30d_map.get(product.id, 0)

        # Use 30-day average if available, otherwise 7-day
        daily_sales = daily_sales_30d if daily_sales_30d > 0 else daily_sales_7d

        # Lead time
        lead_time = product.supplier.lead_time_days if product.supplier else settings.default_lead_time_days
        lead_time_defaulted = product.supplier is None

        # Safety stock
        safety_stock = float(stock.safety_stock) if stock.safety_stock > 0 else daily_sales * settings.default_safety_stock_days
        safety_stock_defaulted = stock.safety_stock == 0

        # Reorder Point
        reorder_point = (daily_sales * lead_time) + safety_stock

        # Projected stock (available - demand during lead time)
        demand_during_lead = daily_sales * lead_time
        projected_stock = float(stock.quantity) - demand_during_lead

        # Desired stock (reorder point + safety buffer)
        desired_stock = reorder_point + safety_stock

        # Suggested purchase
        suggested_qty = max(0, desired_stock - projected_stock)

        # Only suggest if below reorder point or projected stock is low
        if float(stock.quantity) <= reorder_point or projected_stock <= safety_stock:
            results.append({
                "productId": product.id,
                "sku": product.sku,
                "name": product.name,
                "category": product.category.name if product.category else None,
                "currentStock": float(stock.quantity),
                "minimumQuantity": float(stock.minimum_quantity),
                "dailySales7d": round(daily_sales_7d, 2),
                "dailySales30d": round(daily_sales_30d, 2),
                "dailySalesUsed": round(daily_sales, 2),
                "leadTimeDays": lead_time,
                "leadTimeDefaulted": lead_time_defaulted,
                "safetyStock": round(safety_stock, 2),
                "safetyStockDefaulted": safety_stock_defaulted,
                "reorderPoint": round(reorder_point, 2),
                "projectedStock": round(projected_stock, 2),
                "desiredStock": round(desired_stock, 2),
                "suggestedQuantity": round(suggested_qty, 2),
                "supplier": product.supplier.name if product.supplier else "Não definido",
                "unitCost": str(product.cost_price),
                "estimatedCost": round(suggested_qty * float(product.cost_price), 2),
            })

    # Sort by urgency (most negative projected stock first)
    results.sort(key=lambda x: x["projectedStock"])

    return {"items": results, "total": len(results)}