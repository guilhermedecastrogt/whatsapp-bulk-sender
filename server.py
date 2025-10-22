import re
import threading
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from browserCtrl import Web

app = FastAPI(title="WhatsApp Sender API")

# Allow local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_COUNTRY_CODE = "55"  # Brazil


def normalize_brazil_number(raw: str, area_code: str = DEFAULT_COUNTRY_CODE) -> Optional[str]:
    """Normalize a Brazilian number to full international format starting with country code.
    Accepts inputs like 62996141781 or +55 62 996141781 and outputs 5562996141781.
    """
    if not raw:
        return None
    s = re.sub(r"\D", "", raw)
    if not s:
        return None

    # Strip leading zeros
    s = s.lstrip("0")

    # If already starts with country code, keep it
    if s.startswith(DEFAULT_COUNTRY_CODE):
        return s

    # If includes a 2-digit area code (e.g., 62) + 8 or 9 digits
    if len(s) in (10, 11):
        return DEFAULT_COUNTRY_CODE + s

    # If local 8 or 9-digit number was given, we can't infer area code reliably
    # Reject to avoid sending wrong contact
    if len(s) in (8, 9):
        return None

    # Fallback: accept numbers between 10 and 13 digits by prefixing country code when missing
    if 10 <= len(s) <= 13:
        if not s.startswith(DEFAULT_COUNTRY_CODE):
            return DEFAULT_COUNTRY_CODE + s
        return s

    return None


class SendTextBody(BaseModel):
    numbers: List[str]
    text: str
    area_code: str = DEFAULT_COUNTRY_CODE
    remember: bool = True
    sleepMin: int = 3
    sleepMax: int = 6


@app.post("/send-text")
def send_text(body: SendTextBody):
    # Normalize and filter numbers
    normalized = []
    for n in body.numbers:
        nn = normalize_brazil_number(n, body.area_code)
        if nn:
            normalized.append(nn)
    if not normalized:
        return {"status": "error", "message": "No valid numbers after normalization."}

    # Start sending in background thread to keep API responsive
    def _run():
        web = Web(counter_start=0, step='M', numList=normalized,
                  sleepMin=body.sleepMin, sleepMax=body.sleepMax,
                  text=body.text, Remember=body.remember)
        # Call the method directly so we don't need Qt's thread start
        web.SendTEXT()

    t = threading.Thread(target=_run, daemon=True)
    t.start()

    return {"status": "started", "count": len(normalized)}


@app.post("/send-text-file")
async def send_text_file(file: UploadFile = File(...), text: str = "", area_code: str = DEFAULT_COUNTRY_CODE):
    import io
    import pandas as pd

    data = await file.read()
    buf = io.BytesIO(data)

    numbers: List[str] = []

    # Determine file type by extension
    filename = (file.filename or "").lower()
    if filename.endswith('.csv'):
        import csv
        buf.seek(0)
        reader = csv.reader(io.TextIOWrapper(buf, encoding='utf-8'))
        for row in reader:
            if row:
                numbers.append(row[0])
    else:
        # Assume xlsx
        df = pd.read_excel(buf)
        # Use first column named 'Number' or first column
        col = 'Number' if 'Number' in df.columns else df.columns[0]
        for v in df[col].astype(str).tolist():
            numbers.append(v)

    # Normalize
    normalized = []
    for n in numbers:
        nn = normalize_brazil_number(n, area_code)
        if nn:
            normalized.append(nn)

    if not normalized:
        return {"status": "error", "message": "No valid numbers after normalization."}

    # Background send
    def _run():
        web = Web(counter_start=0, step='M', numList=normalized,
                  sleepMin=3, sleepMax=6, text=text, Remember=True)
        web.SendTEXT()

    t = threading.Thread(target=_run, daemon=True)
    t.start()

    return {"status": "started", "count": len(normalized)}


@app.get("/health")
def health():
    return {"status": "ok"}