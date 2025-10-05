import os
from datetime import datetime
from typing import List

from django.utils import timezone

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except Exception:  # optional dependency at runtime
    service_account = None
    build = None


def _get_service():
    creds_path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    calendar_id = os.environ.get("GOOGLE_CALENDAR_ID")
    if not (creds_path and calendar_id and service_account and build):
        return None, None
    scopes = ["https://www.googleapis.com/auth/calendar"]
    creds = service_account.Credentials.from_service_account_file(creds_path, scopes=scopes)
    service = build("calendar", "v3", credentials=creds, cache_discovery=False)
    return service, calendar_id


def upsert_events(events: List[dict]) -> dict:
    service, calendar_id = _get_service()
    if not service:
        return {"synced": 0, "note": "Google Calendar not configured"}
    synced = 0
    for ev in events:
        body = {
            "summary": ev["summary"],
            "description": ev.get("description", ""),
            "start": {"dateTime": ev["start"], "timeZone": timezone.get_current_timezone_name()},
            "end": {"dateTime": ev["end"], "timeZone": timezone.get_current_timezone_name()},
            "location": ev.get("location", ""),
        }
        service.events().insert(calendarId=calendar_id, body=body).execute()
        synced += 1
    return {"synced": synced}


