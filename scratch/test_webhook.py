import httpx
import asyncio
import json

payload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1534456811454604",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "1234",
              "phone_number_id": "1095276790345684"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Test User"
                },
                "wa_id": "919999999999"
              }
            ],
            "messages": [
              {
                "from": "919999999999",
                "id": "wamid.TEST",
                "timestamp": "1602320622",
                "type": "text",
                "text": {
                  "body": "hi"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}

async def main():
    async with httpx.AsyncClient() as client:
        res = await client.post("http://localhost:8000/whatsapp/webhook", json=payload)
        print("Status Code:", res.status_code)
        print("Response:", res.text)

asyncio.run(main())
