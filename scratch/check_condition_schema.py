import asyncio
import pprint
from database import conditions_config_collection

async def main():
    docs = await conditions_config_collection.find().to_list(1)
    pprint.pprint(docs)

if __name__ == "__main__":
    asyncio.run(main())
