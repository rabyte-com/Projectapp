from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
import shutil
import logging
import json
from datetime import datetime, date
import pandas as pd
import hashlib
import jwt
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("edi_platform.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Excel to EDI Automation Platform")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://192.168.0.106:3000"
    ],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-in-production"

# Create directories
os.makedirs("uploads", exist_ok=True)
os.makedirs("edi-files", exist_ok=True)
os.makedirs("logs", exist_ok=True)

# Predefined users (in production, use a proper database)
USERS = {
    "admin@company.com": {"password": "admin123", "name": "Admin User"},
    "user1@company.com": {"password": "user123", "name": "User One"},
    "user2@company.com": {"password": "user123", "name": "User Two"},
    "user3@company.com": {"password": "user123", "name": "User Three"},
    "user4@company.com": {"password": "user123", "name": "User Four"},
}


# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user_name: str


class EDIRequest(BaseModel):
    make_company: str
    edi_type: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


# Helper functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password


def create_access_token(email: str) -> str:
    return jwt.encode({"email": email}, SECRET_KEY, algorithm="HS256")


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        email = payload.get("email")
        if email not in USERS:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def log_session_activity(user_email: str, action: str, details: dict = None):
    """Log user activity to individual session files"""
    timestamp = datetime.now().isoformat()
    log_entry = {
        "timestamp": timestamp,
        "user": user_email,
        "action": action,
        "details": details or {},
    }

    # Create user-specific log file
    log_file = f"logs/{user_email.replace('@', '_').replace('.', '_')}_session.log"
    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

    logger.info(f"User {user_email}: {action}")


def process_excel_to_edi(
    file_path: str,
    make_company: str,
    edi_type: str,
    start_date: Optional[date],
    end_date: Optional[date],
) -> str:
    """
    Mock EDI processing function - replace with your actual ETL logic
    """
    try:
        # Read Excel file
        df = pd.read_excel(file_path)

        # Generate EDI content based on parameters
        edi_content = generate_edi_content(
            df, make_company, edi_type, start_date, end_date
        )

        # Create EDI filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        edi_filename = f"{make_company}_{edi_type}_{timestamp}.edi"
        edi_path = os.path.join("edi-files", edi_filename)

        # Write EDI file
        with open(edi_path, "w") as f:
            f.write(edi_content)

        return edi_filename
    except Exception as e:
        logger.error(f"Error processing Excel to EDI: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


def generate_edi_content(
    df: pd.DataFrame,
    make_company: str,
    edi_type: str,
    start_date: Optional[date],
    end_date: Optional[date],
) -> str:
    """
    Generate EDI content based on company and type
    This is a mock implementation - replace with your actual EDI generation logic
    """
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    if make_company.upper() == "RENESAS":
        if edi_type == "PO":
            return f"""ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *{timestamp[:6]}*{timestamp[6:10]}*U*00401*{timestamp}*0*P*>~
GS*PO*SENDER*RECEIVER*{timestamp[:8]}*{timestamp[8:12]}*{timestamp}*X*004010~
ST*850*0001~
BEG*00*SA*PO{timestamp}**{timestamp[:8]}~
REF*DP*Department~
DTM*002*{timestamp[:8]}~
N1*ST*Ship To Location~
N3*123 Main Street~
N4*City*ST*12345~
PO1*001*{len(df)}*EA*10.00**BP*PART001*VP*VENDOR001~
CTT*1~
SE*9*0001~
GE*1*{timestamp}~
IEA*1*{timestamp}~"""
        elif edi_type == "CLAIM":
            return f"""ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *{timestamp[:6]}*{timestamp[6:10]}*U*00401*{timestamp}*0*P*>~
GS*CM*SENDER*RECEIVER*{timestamp[:8]}*{timestamp[8:12]}*{timestamp}*X*004010~
ST*180*0001~
BGN*11*CLAIM{timestamp}*{timestamp[:8]}~
REF*2I*{timestamp}~
N1*41*Claimant Name~
CLM*CLAIM001*100.00***11:B:1~
DTP*454*D8*{timestamp[:8]}~
PWK*09*FT*AC***AC~
SE*8*0001~
GE*1*{timestamp}~
IEA*1*{timestamp}~"""

    elif make_company.upper() == "OSRAM":
        if edi_type == "POS":
            return f"""UNB+UNOC:3+SENDER:14+RECEIVER:14+{timestamp[:8]}:{timestamp[8:12]}+{timestamp}++ORDERS'
UNH+1+ORDERS:D:03B:UN:EAN008'
BGM+220+POS{timestamp}+9'
DTM+137:{timestamp[:8]}:102'
RFF+ON:ORDER{timestamp}'
NAD+BY+BUYER::91'
NAD+SU+SUPPLIER::91'
LIN+1++PRODUCT001:EN'
QTY+21:{len(df)}'
PRI+AAA:15.00:CA'
UNS+S'
CNT+2:{len(df)}'
UNT+12+1'
UNZ+1+{timestamp}'"""

    # Default generic EDI structure
    return f"""ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *{timestamp[:6]}*{timestamp[6:10]}*U*00401*{timestamp}*0*P*>~
GS*{edi_type[:2]}*SENDER*RECEIVER*{timestamp[:8]}*{timestamp[8:12]}*{timestamp}*X*004010~
ST*850*0001~
BEG*00*SA*{edi_type}{timestamp}**{timestamp[:8]}~
N1*ST*{make_company}~
PO1*001*{len(df)}*EA*10.00**BP*GENERIC001~
SE*6*0001~
GE*1*{timestamp}~
IEA*1*{timestamp}~"""


# API Routes
@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    if request.email not in USERS:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = USERS[request.email]
    if not verify_password(request.password, hash_password(user["password"])):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(request.email)
    log_session_activity(request.email, "LOGIN", {"success": True})

    return LoginResponse(token=token, user_name=user["name"])


@app.post("/upload-and-process")
async def upload_and_process(
    file: UploadFile = File(...),
    make_company: str = Form(...),
    edi_type: str = Form(...),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    current_user: str = Depends(verify_token),
):
    # Validate file type
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="Only Excel files (.xlsx, .xls) are allowed"
        )

    try:
        # Save uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{current_user.replace('@', '_').replace('.', '_')}_{timestamp}_{file.filename}"
        file_path = os.path.join("uploads", filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        log_session_activity(
            current_user,
            "FILE_UPLOADED",
            {
                "filename": file.filename,
                "saved_as": filename,
                "size": os.path.getsize(file_path),
            },
        )

        # Parse dates if provided
        parsed_start_date = None
        parsed_end_date = None
        if start_date:
            parsed_start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            parsed_end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        log_session_activity(
            current_user,
            "PROCESSING_STARTED",
            {
                "make_company": make_company,
                "edi_type": edi_type,
                "start_date": start_date,
                "end_date": end_date,
            },
        )

        # Process Excel to EDI
        edi_filename = process_excel_to_edi(
            file_path, make_company, edi_type, parsed_start_date, parsed_end_date
        )

        log_session_activity(
            current_user, "EDI_GENERATED", {"edi_filename": edi_filename}
        )

        return {
            "message": "EDI file generated successfully",
            "edi_filename": edi_filename,
        }

    except Exception as e:
        log_session_activity(current_user, "ERROR", {"error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download-edi/{filename}")
async def download_edi(filename: str, current_user: str = Depends(verify_token)):
    file_path = os.path.join("edi-files", filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="EDI file not found")

    log_session_activity(current_user, "FILE_DOWNLOADED", {"filename": filename})

    return FileResponse(
        path=file_path, filename=filename, media_type="application/octet-stream"
    )


@app.get("/user-logs")
async def get_user_logs(current_user: str = Depends(verify_token)):
    """Get current user's session logs"""
    log_file = f"logs/{current_user.replace('@', '_').replace('.', '_')}_session.log"

    if not os.path.exists(log_file):
        return {"logs": []}

    logs = []
    with open(log_file, "r") as f:
        for line in f:
            try:
                logs.append(json.loads(line.strip()))
            except json.JSONDecodeError:
                continue

    return {"logs": logs[-50:]}  # Return last 50 log entries


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
