from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get("/quotes")
def get_quotes(
    metal: str = None,
    exchange: str = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = "SELECT * FROM quotes WHERE 1=1"
    params = {}
    
    if metal:
        query += " AND metal = :metal"
        params["metal"] = metal
    if exchange:
        query += " AND exchange = :exchange"
        params["exchange"] = exchange
    if start_date:
        query += " AND quote_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND quote_date <= :end_date"
        params["end_date"] = end_date
    
    query += f" ORDER BY quote_date DESC LIMIT {limit}"
    
    result = db.execute(text(query), params)
    return [dict(row) for row in result]


@router.get("/currencies")
def get_currencies(
    pair: str = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = "SELECT * FROM currencies WHERE 1=1"
    params = {}
    
    if pair:
        query += " AND currency_pair = :pair"
        params["pair"] = pair
    if start_date:
        query += " AND rate_date >= :start_date"
        params["start_date"] = start_date
    if end_date:
        query += " AND rate_date <= :end_date"
        params["end_date"] = end_date
    
    query += f" ORDER BY rate_date DESC LIMIT {limit}"
    
    result = db.execute(text(query), params)
    return [dict(row) for row in result]


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quotes_count = db.execute(text("SELECT COUNT(*) FROM quotes")).scalar()
    currencies_count = db.execute(text("SELECT COUNT(*) FROM currencies")).scalar()
    commodities_count = db.execute(text("SELECT COUNT(*) FROM commodities")).fetchone()[0]
    purchases_count = db.execute(text("SELECT COUNT(*) FROM purchases")).scalar()
    
    latest_al = db.execute(text(
        "SELECT close_price FROM quotes WHERE metal = 'AL' ORDER BY quote_date DESC LIMIT 1"
    )).scalar()
    
    latest_usd = db.execute(text(
        "SELECT rate FROM currencies WHERE currency_pair = 'USD/RUB' ORDER BY rate_date DESC LIMIT 1"
    )).scalar()
    
    return {
        "quotes_count": quotes_count,
        "currencies_count": currencies_count,
        "commodities_count": commodities_count,
        "purchases_count": purchases_count,
        "latest_al_price": latest_al,
        "latest_usd_rate": latest_usd
    }
