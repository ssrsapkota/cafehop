import base64
import hashlib
import hmac
import json
import urllib.request
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_admin_user
from app.models.bill import Bill
from app.models.user import User
from app.schemas.bill_schema import BillCreate, BillOut

router = APIRouter(prefix="/bills", tags=["bills"])

@router.get("/", response_model=list[BillOut])
def get_all_bills(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """List ALL bills (Admin only)"""
    return db.query(Bill).order_by(Bill.created_at.desc()).all()



from app.models.notification import Notification

@router.post("/", response_model=BillOut, status_code=status.HTTP_201_CREATED)
def create_bill(
    bill_in: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a split bill and notify participants"""
    bill_data = bill_in.model_dump()
    bill_data["creator_id"] = current_user.id

    new_bill = Bill(**bill_data)
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    
    # Notify participants if they are registered users
    if isinstance(new_bill.participants, dict) and "users" in new_bill.participants:
        splits = {s["name"]: s.get("amount", 0) for s in new_bill.participants.get("splits", []) if "name" in s}
        
        for u in new_bill.participants["users"]:
            if u.get("id") and u["id"] != current_user.id:
                user_name = u.get("name")
                amount_owed = splits.get(user_name, 0)
                
                if new_bill.title == "Settlement":
                    message = f"settled a debt with you for Rs. {amount_owed}."
                    notif_type = "payment"
                elif amount_owed > 0:
                    message = f"added you to a split bill. You owe Rs. {amount_owed} for {new_bill.title}"
                    notif_type = "bill"
                else:
                    message = f"added you to a split bill: {new_bill.title}"
                    notif_type = "bill"

                notif = Notification(
                    user_id=u["id"],
                    actor_id=current_user.id,
                    type=notif_type,
                    message=message,
                    is_read=False
                )
                db.add(notif)
        db.commit()
        
    return new_bill


@router.get("/me", response_model=list[BillOut])
def my_bills(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """List user's split bills (newest first)"""
    all_bills = db.query(Bill).order_by(Bill.created_at.desc()).all()
    my_bills_list = []
    
    for b in all_bills:
        if b.creator_id == current_user.id:
            my_bills_list.append(b)
            continue
            
        if isinstance(b.participants, dict):
            users = b.participants.get("users", [])
            if any(u.get("id") == current_user.id for u in users):
                my_bills_list.append(b)
                
    return my_bills_list


@router.get("/{bill_id}", response_model=BillOut)
def get_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single bill by id"""
    bill = (
        db.query(Bill)
        .filter(Bill.id == bill_id, Bill.creator_id == current_user.id)
        .first()
    )
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a bill (Admins can delete any bill)"""
    if current_user.role == "admin":
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
    else:
        bill = db.query(Bill).filter(Bill.id == bill_id, Bill.creator_id == current_user.id).first()
        
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found or insufficient permissions")
    db.delete(bill)
    db.commit()

ESEWA_SECRET_KEY = "8gBm/:&EnhH.1/q"

@router.post("/{bill_id}/esewa/signature")
def get_esewa_signature(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate eSewa signature for frontend to submit form"""
    bill = db.query(Bill).filter(Bill.id == bill_id, Bill.creator_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    transaction_uuid = f"CH-BILL-{bill.id}"
    total_amount = str(bill.total_amount)
    product_code = "EPAYTEST"
    
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    
    hmac_sha256 = hmac.new(
        ESEWA_SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).digest()
    
    signature = base64.b64encode(hmac_sha256).decode()
    
    return {
        "amount": total_amount,
        "tax_amount": "0",
        "total_amount": total_amount,
        "transaction_uuid": transaction_uuid,
        "product_code": product_code,
        "product_service_charge": "0",
        "product_delivery_charge": "0",
        "signature": signature,
        "signed_field_names": "total_amount,transaction_uuid,product_code"
    }

@router.get("/esewa/verify")
def verify_esewa_payment(
    q: str,
    db: Session = Depends(get_db)
):
    """Verify eSewa payment using the Base64 data returned on success callback"""
    try:
        decoded_data = base64.b64decode(q).decode('utf-8')
        data = json.loads(decoded_data)
        
        transaction_uuid = data.get("transaction_uuid")
        if not transaction_uuid or not transaction_uuid.startswith("CH-BILL-"):
            raise HTTPException(status_code=400, detail="Invalid Transaction ID")
            
        bill_id = int(transaction_uuid.replace("CH-BILL-", ""))
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")
            
        # Verify transaction with eSewa API directly
        url = f"https://rc-epay.esewa.com.np/api/epay/transaction/status/?product_code=EPAYTEST&total_amount={bill.total_amount}&transaction_uuid={transaction_uuid}"
        
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            
        if result.get("status") == "COMPLETE":
            # Update bill info via json payload workaround to avoid SQLite migration
            participants = dict(bill.participants) if bill.participants else {}
            participants["payment_status"] = "esewa_verified"
            bill.participants = participants
            
            # Notify the creator and participants
            if "users" in participants:
                for u in participants["users"]:
                    user_id = u.get("id")
                    if user_id:
                        if user_id == bill.creator_id:
                            # Creator gets told their payment succeeded
                            message = f"Your eSewa payment for the bill '{bill.title}' was successfully verified."
                            actor_id = None # Makes it a system message
                        else:
                            # Participants get told the creator paid it via eSewa
                            message = f"completed the eSewa payment for the split bill: '{bill.title}'"
                            actor_id = bill.creator_id

                        notif = Notification(
                            user_id=user_id,
                            actor_id=actor_id,
                            type="payment",
                            message=message,
                            is_read=False
                        )
                        db.add(notif)
            
            db.commit()
            return {"status": "success", "message": "Payment verified", "bill_id": bill.id}
        else:
            raise HTTPException(status_code=400, detail="Payment verification failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification error: {str(e)}")

