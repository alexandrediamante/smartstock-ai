from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import Dict, Any, List

from app.models.product import Product
from app.models.stock import Stock
from app.models.stock_batch import StockBatch
from app.models.sale import Sale
from app.models.alert import Alert, AlertStatus


def build_context(db: Session) -> Dict[str, Any]:
    """Build context for AI assistant from current database state."""
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Expiration risks
    expiration_risks = get_expiration_risks(db, today)

    # Replenishment suggestions
    replenishment = get_replenishment_suggestions(db, today, week_ago, month_ago)

    # Active alerts
    active_alerts = db.query(Alert).filter(Alert.status == AlertStatus.OPEN).all()

    # Dashboard totals
    totals = get_dashboard_totals(db, today, week_ago)

    return {
        "expiration_risks": expiration_risks,
        "replenishment": replenishment,
        "active_alerts": [
            {
                "type": a.type.value,
                "severity": a.severity.value,
                "message": a.message,
                "product_id": a.product_id,
                "batch_id": a.batch_id,
            }
            for a in active_alerts
        ],
        "totals": totals,
        "references": build_references(expiration_risks, replenishment, active_alerts),
    }


def get_expiration_risks(db: Session, today: date) -> List[Dict[str, Any]]:
    """Get expiration risks with FEFO analysis."""
    cutoff_date = today + timedelta(days=30)

    batches = db.query(StockBatch).join(Product).filter(
        StockBatch.expiration_date <= cutoff_date,
        StockBatch.expiration_date >= today,
        StockBatch.quantity > 0,
        Product.is_active == 1
    ).order_by(StockBatch.expiration_date).all()

    # Daily sales (7-day average)
    week_ago = today - timedelta(days=7)
    sales_data = db.query(
        Sale.product_id,
        func.sum(Sale.quantity).label("total")
    ).filter(Sale.sold_at >= week_ago).group_by(Sale.product_id).all()

    daily_sales_map = {pid: float(total) / 7 for pid, total in sales_data}

    results = []
    for batch in batches:
        daily_sales = daily_sales_map.get(batch.product_id, 0)
        days_remaining = (batch.expiration_date - today).days

        if days_remaining <= 0:
            continue

        estimated_sales = daily_sales * days_remaining
        excess = max(0, float(batch.quantity) - estimated_sales)
        exposure = excess * float(batch.unit_cost)

        if days_remaining <= 3 or exposure >= 10000:
            sev = "critico"
        elif days_remaining <= 7 or exposure >= 5000:
            sev = "atencao"
        else:
            sev = "normal"

        results.append({
            "batchId": batch.id,
            "productId": batch.product_id,
            "productName": batch.product.name,
            "productSku": batch.product.sku,
            "batchCode": batch.batch_code,
            "quantity": float(batch.quantity),
            "expirationDate": str(batch.expiration_date),
            "daysRemaining": days_remaining,
            "dailySales": round(daily_sales, 2),
            "estimatedSales": round(estimated_sales, 2),
            "excess": round(excess, 2),
            "exposure": round(exposure, 2),
            "severity": sev,
        })

    return results


def get_replenishment_suggestions(db: Session, today: date, week_ago: date, month_ago: date) -> List[Dict[str, Any]]:
    """Get replenishment suggestions."""
    from app.core.config import get_settings
    settings = get_settings()

    products = db.query(Product).join(Stock).filter(Product.is_active == 1).all()

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
        daily_sales = daily_sales_30d if daily_sales_30d > 0 else daily_sales_7d

        lead_time = product.supplier.lead_time_days if product.supplier else settings.default_lead_time_days
        safety_stock = float(stock.safety_stock) if stock.safety_stock > 0 else daily_sales * settings.default_safety_stock_days

        reorder_point = (daily_sales * lead_time) + safety_stock
        projected_stock = float(stock.quantity) - (daily_sales * lead_time)
        desired_stock = reorder_point + safety_stock
        suggested_qty = max(0, desired_stock - projected_stock)

        if float(stock.quantity) <= reorder_point or projected_stock <= safety_stock:
            results.append({
                "productId": product.id,
                "name": product.name,
                "sku": product.sku,
                "currentStock": float(stock.quantity),
                "dailySalesUsed": round(daily_sales, 2),
                "leadTimeDays": lead_time,
                "safetyStock": round(safety_stock, 2),
                "reorderPoint": round(reorder_point, 2),
                "projectedStock": round(projected_stock, 2),
                "desiredStock": round(desired_stock, 2),
                "suggestedQuantity": round(suggested_qty, 2),
                "supplier": product.supplier.name if product.supplier else "Não definido",
                "unitCost": str(product.cost_price),
                "estimatedCost": round(suggested_qty * float(product.cost_price), 2),
            })

    results.sort(key=lambda x: x["projectedStock"])
    return results


def get_dashboard_totals(db: Session, today: date, week_ago: date) -> Dict[str, Any]:
    """Get dashboard totals for context."""
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == 1).scalar() or 0
    critical_stock = db.query(func.count(Stock.product_id)).join(Product).filter(
        Stock.quantity <= Stock.minimum_quantity, Product.is_active == 1
    ).scalar() or 0
    near_expiration = db.query(func.count(StockBatch.id)).filter(
        StockBatch.expiration_date <= today + timedelta(days=7),
        StockBatch.expiration_date >= today,
        StockBatch.quantity > 0
    ).scalar() or 0

    return {
        "products": total_products,
        "criticalStock": critical_stock,
        "nearExpiration": near_expiration,
    }


def build_references(risks: List[Dict], replen: List[Dict], alerts: List) -> List[Dict[str, str]]:
    """Build reference list for AI response."""
    refs = []
    for r in risks[:5]:
        refs.append({"type": "batch", "id": str(r["batchId"]), "label": f"{r['productName']} (lote {r['batchCode']})"})
    for r in replen[:5]:
        refs.append({"type": "product", "id": str(r["productId"]), "label": f"{r['name']} (compra: {r['suggestedQuantity']:.0f})"})
    return refs