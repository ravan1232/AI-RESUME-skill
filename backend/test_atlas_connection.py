import asyncio
import sys
import os
import certifi
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

async def verify_atlas(connection_url: str = None):
    url = connection_url or os.getenv("MONGODB_URL")
    if not url or url.startswith("mongodb://localhost"):
        print("\n❌ Error: No MongoDB Atlas URL provided.")
        print("Usage: python test_atlas_connection.py \"mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority\"")
        print("Or set MONGODB_URL in backend/.env")
        return False

    # Mask password for display
    masked = url
    if "@" in url:
        prefix = url.split("@")[0].split(":")[0] + ":****@"
        masked = prefix + url.split("@")[1]
    
    print(f"\n[1/3] Testing connection to MongoDB Atlas...")
    print(f"Target: {masked}")

    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(
            url,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=8000,
            connectTimeoutMS=8000
        )
        print("[2/3] Sending ping command...")
        ping_res = await asyncio.wait_for(client.admin.command('ping'), timeout=8.0)
        print(f" -> Ping successful! Response: {ping_res}")

        print("[3/3] Testing database read/write permissions on 'skillbridge_db'...")
        db = client["skillbridge_db"]
        test_col = db["_connectivity_check"]
        insert_res = await test_col.insert_one({"status": "connected", "timestamp": "now"})
        doc = await test_col.find_one({"_id": insert_res.inserted_id})
        await test_col.delete_one({"_id": insert_res.inserted_id})
        print(f" -> Write and Read verified successfully! Test doc id: {doc['_id']}")

        print("\n=======================================================")
        print("  SUCCESS! MongoDB Atlas is fully configured and ready! ")
        print("=======================================================\n")
        client.close()
        return True
    except Exception as e:
        print(f"\n❌ Connection Failed: {type(e).__name__} - {e}")
        print("\nTroubleshooting Checklist:")
        print("1. Network Access: In MongoDB Atlas -> Network Access -> Add IP Address -> '0.0.0.0/0' (Allow Access From Anywhere).")
        print("2. Database User: In MongoDB Atlas -> Database Access -> ensure user has 'Read and write to any database' role.")
        print("3. Password: Ensure special characters in password are URL encoded (e.g., @ as %40) or use an alphanumeric password.")
        print("4. Connection String: Ensure the string starts with 'mongodb+srv://'.")
        return False

if __name__ == "__main__":
    uri = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(verify_atlas(uri))
