from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import date, timedelta

from app.core.database import get_db
from app.models.product import Product
from app.models.stock_batch import StockBatch
from app.models.sale import Sale
from app.core.config import get_settings

router = APIRouter()


@router.get("/expiration/risks")
def get_expiration_risks(
    days_ahead: int = Query(30, ge=1, le=365),
    severity: str = Query(None),  # critico, atencao, normal
    db: Session = Depends(get_db),
):
    """Get batches at risk of expiration with FEFO analysis."""
    settings = get_settings()
    today = date.today()
    cutoff_date = today + timedelta(days=days_ahead)

    # Get active batches within the window
    batches = db.query(StockBatch).options(
        joinedload(StockBatch.product).joinedload(Product.category)
    ).filter(
        StockBatch.expiration_date <= cutoff_date,
        StockBatch.expiration_date >= today,
        StockBatch.quantity > 0
    ).order_by(StockBatch.expiration_date).all()

    # Calculate daily sales for each product (7-day moving average)
    week_ago = today - timedelta(days=7)
    sales_data = db.query(
        Sale.product_id,
        func.sum(Sale.quantity).label("total_qty")
    ).filter(
        Sale.sold_at >= week_ago
    ).group_by(Sale.product_id).all()

    daily_sales_map = {pid: float(total) / 7 for pid, total in sales_data}

    results = []
    for batch in batches:
        daily_sales = daily_sales_map.get(batch.product_id, 0)
        days_remaining = (batch.expiration_date - today).days

        if days_remaining <= 0:
            continue  # Skip expired

        estimated_sales = daily_sales * days_remaining
        excess = max(0, float(batch.quantity) - estimated_sales)
        exposure = excess * float(batch.unit_cost)

        # Determine severity
        if days_remaining <= settings.alert_expiration_critical_days or exposure >= settings.alert_financial_exposure_critical:
            sev = "critico"
        elif days_remaining <= settings.alert_expiration_warning_days or exposure >= settings.alert_financial_exposure_warning:
            sev = "atencao"
        else:
            sev = "normal"

        if severity and sev != severity:
            continue

        results.append({
            "batchId": batch.id,
            "productId": batch.product_id,
            "productName": batch.product.name,
            "productSku": batch.product.sku,
            "category": batch.product.category.name if batch.product.category else None,
            "batchCode": batch.batch_code,
            "quantity": float(batch.quantity),
            "expirationDate": str(batch.expiration_date),
            "daysRemaining": days_remaining,
            "dailySales": round(daily_sales, 2),
            "estimatedSales": round(estimated_sales, 2),
            "excess": round(excess, 2),
            "exposure": round(exposure, 2),
            "unitCost": str(batch.unit_cost),
            "severity": sev,
        })

    # Sort by severity (critico first), then by expiration date
    severity_order = {"critico": 0, "atencao": 1, "normal": 2}
    results.sort(key=lambda x: (severity_order.get(x["severity"], 3), x["expirationDate"]))

    return {"items": results, "total": len(results)}