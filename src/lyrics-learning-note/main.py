from fastapi import FastAPI, APIRouter

app = FastAPI()

api_router = APIRouter(prefix="/api")

@api_router.post("/songs")
async def new_song():
    return {"message": "WIP"}

@api_router.put("/songs/{song_id}")
async def update_song(song_id: str):
    return {"message": f"{song_id} WIP"}

@api_router.get("/songs/{song_id}")
async def get_song(song_id: str):
    return {"message": f"{song_id} WIP"}

@api_router.post("/translate")
async def translate_text():
    return {"message": "WIP"}

@api_router.post("/explain")
async def explain_lyrics():
    return {"message": "WIP"}

@api_router.post("/tts")
async def process_tts():
    return {"message": "WIP"}

@api_router.post("/lyrics")
async def get_lyrics():
    return {"message": "WIP"}

@api_router.post("/lyrics/search")
async def search_lyrics():
    return {"message": "WIP"}

app.include_router(api_router)

print("Server is starting to run")


# uvicorn main:app --port 3000