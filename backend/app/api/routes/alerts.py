from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional
from datetime import date, timedelta

from app.core.database import get_db
from app.models.alert import Alert, AlertType, AlertSeverity, AlertStatus
from app.models.product import Product
from app.models.stock_batch import StockBatch
from app.core.config import get_settings

router = APIRouter()


@router.get("/alerts")
def get_alerts(
    status: Optional[str] = Query(None),  # open, acknowledged, resolved, dismissed
    severity: Optional[str] = Query(None),  # critico, atencao, normal
    type: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get alerts with filters."""
    query = db.query(Alert).options(
        joinedload(Alert.product),
        joinedload(Alert.batch)
    )

    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    if type:
        query = query.filter(Alert.type == type)

    total = query.count()
    alerts = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "items": [
            {
                "id": a.id,
                "type": a.type.value,
                "severity": a.severity.value,
                "message": a.message,
                "status": a.status.value,
                "productId": a.product_id,
                "productName": a.product.name if a.product else None,
                "productSku": a.product.sku if a.product else None,
                "batchId": a.batch_id,
                "batchCode": a.batch.batch_code if a.batch else None,
                "createdAt": a.created_at.isoformat() if a.created_at else None,
                "resolvedAt": a.resolved_at.isoformat() if a.resolved_at else None,
            }
            for a in alerts
        ],
        "total": total,
    }


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """Acknowledge an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}

    alert.status = AlertStatus.ACKNOWLEDGED
    db.commit()
    return {"success": True, "alert_id": alert_id}


@router.post("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    """Resolve an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}

    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = func.now()
    db.commit()
    return {"success": True, "alert_id": alert_id}