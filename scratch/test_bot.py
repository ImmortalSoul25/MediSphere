import asyncio
from whatsapp_bot import handle_incoming_message

async def main():
    try:
        res = await handle_incoming_message("919819817885", "Hi")
        print("Bot Result:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
