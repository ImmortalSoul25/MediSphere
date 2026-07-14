import os
import httpx
import asyncio
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
# Let's check where the env is loaded. It seems the main script is at the root.
env_path = os.path.join(BASE_DIR, "atlas-credentials.env")
if os.path.exists(env_path):
    load_dotenv(env_path)
load_dotenv() # Load from .env as well

WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN")
WHATSAPP_PHONE_NUMBER_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
META_GRAPH_API_VERSION = os.getenv("META_GRAPH_API_VERSION", "v23.0")

BASE_URL = f"https://graph.facebook.com/{META_GRAPH_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages"

async def _send_request(payload: dict) -> dict:
    if not WHATSAPP_ACCESS_TOKEN or not WHATSAPP_PHONE_NUMBER_ID:
        return {"ok": False, "error": "WhatsApp credentials not configured."}
    
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(BASE_URL, json=payload, headers=headers, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            return {"ok": True, "response": data}
        except httpx.HTTPStatusError as exc:
            error_details = exc.response.text
            print(f"Graph API Error: {error_details}")
            from database import whatsapp_logs_collection
            import datetime
            await whatsapp_logs_collection.insert_one({
                "type": "API_ERROR",
                "error": str(exc.response.status_code),
                "details": error_details,
                "payload": payload,
                "loggedAt": datetime.datetime.now().isoformat()
            })
            return {"ok": False, "error": f"HTTP {exc.response.status_code}", "details": error_details}
        except Exception as exc:
            print(f"WhatsApp Request Failed: {str(exc)}")
            return {"ok": False, "error": str(exc)}

async def send_text(phone: str, message: str) -> dict:
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message
        }
    }
    return await _send_request(payload)

async def send_interactive_buttons(phone: str, body_text: str, buttons: list[dict]) -> dict:
    """
    buttons: [{'id': 'btn_1', 'title': 'Button 1'}, ...]
    Max 3 buttons.
    """
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": body_text
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {
                            "id": str(btn["id"]),
                            "title": str(btn["title"])[:20]
                        }
                    } for btn in buttons[:3]
                ]
            }
        }
    }
    return await _send_request(payload)

async def send_interactive_list(phone: str, body_text: str, button_text: str, sections: list[dict]) -> dict:
    """
    sections: [{'title': 'Section Title', 'rows': [{'id': 'row_1', 'title': 'Row 1', 'description': '...'}]}]
    """
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {
                "text": body_text
            },
            "action": {
                "button": button_text[:20],
                "sections": sections
            }
        }
    }
    return await _send_request(payload)

async def send_interactive_flow(phone: str, body_text: str, flow_id: str, flow_token: str, flow_cta: str = "Fill Form", screen: str = "APPOINTMENT_REQUEST_SCREEN") -> dict:
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "flow",
            "body": {
                "text": body_text
            },
            "action": {
                "name": "flow",
                "parameters": {
                    "flow_message_version": "3",
                    "flow_token": flow_token,
                    "flow_id": flow_id,
                    "flow_cta": flow_cta,
                    "flow_action": "navigate",
                    "flow_action_payload": {
                        "screen": screen
                    }
                }
            }
        }
    }
    return await _send_request(payload)

async def send_template(phone: str, template_name: str, language_code: str = "en_US", components: list[dict] = None) -> dict:
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code
            },
            "components": components or []
        }
    }
    return await _send_request(payload)

async def send_image(phone: str, image_url: str, caption: str = "") -> dict:
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "image",
        "image": {
            "link": image_url,
            "caption": caption
        }
    }
    return await _send_request(payload)

async def send_document(phone: str, document_url: str, caption: str = "", filename: str = "document.pdf") -> dict:
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "document",
        "document": {
            "link": document_url,
            "caption": caption,
            "filename": filename
        }
    }
    return await _send_request(payload)
