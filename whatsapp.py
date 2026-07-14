# whatsapp.py

from datetime import date

from whatsapp_service import send_text


def calculate_pregnancy_week(due_date_str: str) -> int | None:
    """
    Given a due date (YYYY-MM-DD), return the current pregnancy week (1-40).
    Returns None if the date is invalid or outside range.
    """
    if not due_date_str:
        return None
    try:
        due = date.fromisoformat(due_date_str)
        today = date.today()
        days_remaining = (due - today).days
        weeks_remaining = round(days_remaining / 7)
        week = 40 - weeks_remaining
        if week < 1 or week > 40:
            return None
        return week
    except (ValueError, TypeError):
        return None


def format_message(patient_name: str, week: int, message: str, yt_link: str = "") -> str:
    lines = [
        f"Hello {patient_name} 👋",
        f"*Pregnancy Update - Week {week}*",
        "",
        message.strip(),
    ]
    if yt_link and yt_link.strip():
        lines += ["", f"Watch this week's video: {yt_link.strip()}"]
    lines += ["", "- Your Care Team"]
    return "\n".join(lines)


async def send_whatsapp_message(to_number: str, body: str) -> dict:
    return await send_text(to_number, body)
