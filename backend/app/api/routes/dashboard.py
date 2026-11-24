from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List
from datetime import date, timedelta

from app.core.database import get_db
from app.models.product import Product
from app.models.stock import Stock
from app.models.stock_batch import StockBatch
from app.models.sale import Sale
from app.models.alert import Alert, AlertSeverity

router = APIRouter()


@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    """Get executive dashboard KPIs and chart data."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Total products
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == 1).scalar() or 0

    # Critical stock (quantity <= minimum_quantity)
    critical_stock = db.query(func.count(Stock.product_id)).join(Product).filter(
        Stock.quantity <= Stock.minimum_quantity,
        Product.is_active == 1
    ).scalar() or 0

    # Near expiration batches (within 7 days)
    near_expiration = db.query(func.count(StockBatch.id)).filter(
        StockBatch.expiration_date <= today + timedelta(days=7),
        StockBatch.expiration_date >= today,
        StockBatch.quantity > 0
    ).scalar() or 0

    # Stockout risk (simplified: products with low stock and no recent orders)
    stockout_risk = db.query(func.count(Stock.product_id)).join(Product).filter(
        Stock.quantity <= Stock.minimum_quantity * 1.5,
        Product.is_active == 1
    ).scalar() or 0

    # Total inventory value
    inventory_value = db.query(func.sum(Stock.quantity * Product.cost_price)).join(Product).filter(
        Product.is_active == 1
    ).scalar() or 0

    # Financial exposure (simplified - will be calculated by expiration engine)
    financial_exposure = 0  # TODO: calculate from expiration engine

    # Charts data
    # By category
    by_category = db.query(
        Product.category_id,
        func.count(Product.id).label("count")
    ).filter(Product.is_active == 1).group_by(Product.category_id).all()

    # Sales trend (last 30 days)
    sales_trend = db.query(
        func.date(Sale.sold_at).label("date"),
        func.sum(Sale.quantity).label("quantity")
    ).filter(
        Sale.sold_at >= month_ago
    ).group_by(func.date(Sale.sold_at)).order_by(func.date(Sale.sold_at)).all()

    # Risk distribution
    risk_dist = db.query(
        Alert.severity,
        func.count(Alert.id).label("count")
    ).filter(Alert.status == "open").group_by(Alert.severity).all()

    return {
        "totals": {
            "products": total_products,
            "criticalStock": critical_stock,
            "nearExpiration": near_expiration,
            "stockoutRisk": stockout_risk,
            "inventoryValue": str(inventory_value),
            "financialExposure": str(financial_exposure),
        },
        "charts": {
            "byCategory": [
                {"category": cat_id or "Sem categoria", "value": count}
                for cat_id, count in by_category
            ],
            "salesTrend": [
                {"date": str(d), "quantity": float(q or 0)}
                for d, q in sales_trend
            ],
            "riskDistribution": [
                {"severity": sev.value, "count": count}
                for sev, count in risk_dist
            ],
        },
        "replenishment": []  # TODO: from replenishment engine
    }