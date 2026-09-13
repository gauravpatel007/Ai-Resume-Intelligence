import asyncio
# pyrefly: ignore [missing-import]
import aiohttp
import time

async def run_semantic_search(session):
    start = time.time()
    print("Starting semantic search...")
    # Using the token for admin or just failing with 403, it still does work?
    # Wait, semantic_search requires admin login. We need to login first.
    pass

async def main():
    async with aiohttp.ClientSession() as session:
        # Login as admin
        resp = await session.post("http://localhost:8080/api/auth/login", data={"username": "admin@airesume.com", "password": "adminpassword"}) # Guessing admin credentials or we can register one
        print("Login status:", resp.status)
        if resp.status == 200:
            data = await resp.json()
            token = data["access_token"]
        else:
            print(await resp.text())
            return
            
        # Launch semantic search
        print("Launching semantic search...")
        task1 = asyncio.create_task(
            session.post("http://localhost:8080/api/search/semantic", 
                         headers={"Authorization": f"Bearer {token}"},
                         json={"job_description": "We need a software engineer with Python and React.", "required_skills": ["Python", "React"], "method": "semantic", "top_k": 5})
        )
        
        # Wait 1 second
        await asyncio.sleep(1)
        
        # Try to login again
        print("Attempting concurrent login...")
        start_login = time.time()
        resp2 = await session.post("http://localhost:8080/api/auth/login", data={"username": "admin@airesume.com", "password": "adminpassword"})
        end_login = time.time()
        
        print(f"Concurrent login status: {resp2.status}")
        print(f"Concurrent login took {end_login - start_login:.2f} seconds")
        
        res1 = await task1
        print("Semantic search status:", res1.status)

if __name__ == "__main__":
    asyncio.run(main())
