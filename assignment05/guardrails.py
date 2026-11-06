# guardrails, werden im code geprüft und nicht nur im prompt

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

LOG_FILE = Path(__file__).parent / "logs" / "audit.jsonl"
STOP_FILE = Path(__file__).parent / "STOP"

# GUARDRAILS=0 zum vergleich, freigabe/schrittlimit/notaus/protokoll bleiben aktiv
ACTIVE = os.environ.get("GUARDRAILS", "1") != "0"

MAX_TOOL_CALLS = 20
MAX_VERIFY_ATTEMPTS = 3


class GuardrailError(Exception):
    pass


# zuständigkeit

OTHER_REQUEST_PATTERNS = {
    "Löschung (Art. 17)": r"lösch|art\.?\s*17\b",
    "Berichtigung (Art. 16)": r"berichtig|art\.?\s*16\b",
    "Widerspruch (Art. 21)": r"widersp|art\.?\s*21\b",
    "Kündigung": r"kündig",
}


def detect_other_requests(text: str) -> list[str]:
    # gemischte anfragen gehen auch an einen menschen
    return [name for name, pattern in OTHER_REQUEST_PATTERNS.items() if re.search(pattern, text, re.IGNORECASE)]


# prompt injection

INJECTION_PATTERNS = [
    r"ignorier\w*\s+(alle\s+)?(bisherigen|vorherigen|obigen)",
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"systemanweisung|system\s*prompt|anweisung an (den|das) (ki|assistent)",
    r"du bist (jetzt|nun)",
    r"freigabe\s+.{0,30}nicht\s+(nötig|notwendig|erforderlich)",
    r"(schick|send)\w*\s+.{0,60}\ban\s+\S+@\S+",
]


def detect_injection(text: str) -> list[str]:
    hits = []
    for pattern in INJECTION_PATTERNS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            hits.append(m.group(0))
    return hits


# fremde daten im entwurf

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")  # ohne punkt am ende
PHONE_RE = re.compile(r"(?:\+\d{1,3}|\b0)\s?\d[\d /]{5,}\d")
IBAN_RE = re.compile(r"\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}\b")


def redact_foreign_data(text: str, customer: dict, all_customers: list[dict]) -> tuple[str, list[str]]:
    # entfernt mails, nummern, ibans und namen die nicht zur person gehören
    removed = []
    own_email = customer["email"].lower()
    own_phone = re.sub(r"\D", "", customer["telefon"])

    def email_sub(m):
        if m.group(0).lower() == own_email:
            return m.group(0)
        removed.append(m.group(0))
        return "[entfernt]"

    def phone_sub(m):
        if re.sub(r"\D", "", m.group(0)) == own_phone:
            return m.group(0)
        removed.append(m.group(0))
        return "[entfernt]"

    def iban_sub(m):
        removed.append(m.group(0))
        return "[entfernt]"

    text = EMAIL_RE.sub(email_sub, text)
    text = PHONE_RE.sub(phone_sub, text)
    text = IBAN_RE.sub(iban_sub, text)
    for other in all_customers:
        if other["kundennummer"] != customer["kundennummer"] and other["name"] in text:
            removed.append(other["name"])
            text = text.replace(other["name"], "[entfernt]")
    return text, removed


def redact_third_parties(text: str, names: list[str]) -> str:
    # daten dritter schwärzen, art. 15 abs. 4
    for name in names:
        text = text.replace(name, "[geschwärzt]")
    return text


# human in the loop

def ask_human(question: str) -> bool:
    # ohne eingabe = abgelehnt
    try:
        answer = input(f"\n{question} [j/N] ").strip().lower()
    except EOFError:
        answer = ""
    if not sys.stdin.isatty():
        print(answer)  # damit die antwort in den beispielläufen sichtbar ist
    return answer in ("j", "ja", "y", "yes")


# notaus

def emergency_stop() -> bool:
    # datei STOP im ordner = abbruch
    return STOP_FILE.exists()


# protokoll

def audit(event: str, **data):
    LOG_FILE.parent.mkdir(exist_ok=True)
    entry = {"zeit": datetime.now().isoformat(timespec="seconds"), "ereignis": event, **data}
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
