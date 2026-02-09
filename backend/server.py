from fastapi import FastAPI, APIRouter, Request, Query, Header, Depends
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import logging
import jwt
import httpx
import re
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlencode

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Config
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
STEAM_API_KEY = os.environ.get('STEAM_API_KEY', '')
APP_URL = os.environ.get('APP_URL', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret')

# MongoDB
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# 30 predefined categories
CATEGORIES = [
    "Action", "Adventure", "RPG", "Strategy", "Simulation",
    "Sports", "Racing", "Puzzle", "Horror", "Shooter",
    "Platformer", "Fighting", "Survival", "Open World", "Indie",
    "Multiplayer", "Co-op", "MMO", "Story Rich", "Sandbox",
    "Roguelike", "Tower Defense", "City Builder", "Card Game", "Visual Novel",
    "Battle Royale", "Stealth", "Rhythm", "Casual", "Arcade"
]

STEAM_GENRE_MAP = {
    "Action": "Action", "Adventure": "Adventure", "RPG": "RPG",
    "Strategy": "Strategy", "Simulation": "Simulation", "Sports": "Sports",
    "Racing": "Racing", "Indie": "Indie", "Casual": "Casual",
    "Massively Multiplayer": "MMO", "Free to Play": "Casual",
    "Early Access": "Indie",
}

STEAM_CAT_MAP = {
    "Multi-player": "Multiplayer", "Online Multi-Player": "Multiplayer",
    "Co-op": "Co-op", "Online Co-op": "Co-op", "Local Co-op": "Co-op",
    "Online PvP": "Multiplayer", "MMO": "MMO",
    "Shared/Split Screen Co-op": "Co-op", "Shared/Split Screen PvP": "Multiplayer",
}

# ============ Models ============

class GameAdd(BaseModel):
    app_id: int
    name: str = ""

class GameUpdate(BaseModel):
    categories: List[str] = []

class GameAddByUrl(BaseModel):
    url: str

# ============ Auth Helpers ============

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token_str = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token_str, JWT_SECRET, algorithms=["HS256"])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def map_steam_categories(game_data):
    if not game_data:
        return []
    mapped = set()
    for genre in game_data.get('genres', []):
        desc = genre.get('description', '')
        if desc in STEAM_GENRE_MAP and STEAM_GENRE_MAP[desc]:
            mapped.add(STEAM_GENRE_MAP[desc])
        elif desc in CATEGORIES:
            mapped.add(desc)
    for cat in game_data.get('categories', []):
        desc = cat.get('description', '')
        if desc in STEAM_CAT_MAP and STEAM_CAT_MAP[desc]:
            mapped.add(STEAM_CAT_MAP[desc])
    tag_names = [g.get('description', '').lower() for g in game_data.get('genres', [])]
    desc_lower = game_data.get('short_description', '').lower()
    for keyword, category in [
        ('horror', 'Horror'), ('puzzle', 'Puzzle'), ('shooter', 'Shooter'),
        ('platformer', 'Platformer'), ('fighting', 'Fighting'), ('survival', 'Survival'),
        ('roguelike', 'Roguelike'), ('roguelite', 'Roguelike'), ('tower defense', 'Tower Defense'),
        ('city build', 'City Builder'), ('card game', 'Card Game'), ('visual novel', 'Visual Novel'),
        ('battle royale', 'Battle Royale'), ('stealth', 'Stealth'), ('rhythm', 'Rhythm'),
        ('sandbox', 'Sandbox'), ('open world', 'Open World'), ('story', 'Story Rich'),
    ]:
        if any(keyword in t for t in tag_names) or keyword in desc_lower:
            mapped.add(category)
    return list(mapped)

async def fetch_steam_app_details(app_id: int):
    async with httpx.AsyncClient() as http_client:
        try:
            resp = await http_client.get(
                'https://store.steampowered.com/api/appdetails',
                params={'appids': app_id},
                timeout=10.0
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            app_data = data.get(str(app_id), {})
            if not app_data.get('success'):
                return None
            return app_data.get('data')
        except Exception:
            return None

def extract_app_id_from_url(url: str) -> Optional[int]:
    match = re.search(r'/app/(\d+)', url)
    if match:
        return int(match.group(1))
    match = re.search(r'store/(\d+)', url)
    if match:
        return int(match.group(1))
    return None

async def _add_game_to_library(app_id: int, name: str, user_id: str, is_wishlist: bool = False):
    existing = await db.user_games.find_one(
        {'user_id': user_id, 'app_id': app_id}, {'_id': 0}
    )
    if existing:
        return existing, "already_exists"

    game_data = await fetch_steam_app_details(app_id)

    doc = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'app_id': app_id,
        'name': game_data.get('name', name) if game_data else name,
        'header_image': game_data.get('header_image', '') if game_data else f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/header.jpg",
        'capsule_image': f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/library_600x900.jpg",
        'screenshots': [s.get('path_full', '') for s in game_data.get('screenshots', [])[:6]] if game_data else [],
        'categories': map_steam_categories(game_data) if game_data else [],
        'genres': [g.get('description', '') for g in game_data.get('genres', [])] if game_data else [],
        'steam_url': f"https://store.steampowered.com/app/{app_id}",
        'release_date': game_data.get('release_date', {}).get('date', '') if game_data else '',
        'short_description': game_data.get('short_description', '') if game_data else '',
        'developers': game_data.get('developers', []) if game_data else [],
        'publishers': game_data.get('publishers', []) if game_data else [],
        'is_from_wishlist': is_wishlist,
        'added_at': datetime.now(timezone.utc).isoformat()
    }

    await db.user_games.insert_one(doc)
    doc.pop('_id', None)
    return doc, None

# ============ AUTH ROUTES ============

@api_router.get("/auth/steam/login")
async def steam_login():
    callback_url = f"{APP_URL}/api/auth/steam/callback"
    params = {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': callback_url,
        'openid.realm': APP_URL + '/',
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    }
    steam_url = f"https://steamcommunity.com/openid/login?{urlencode(params)}"
    return RedirectResponse(url=steam_url)

@api_router.get("/auth/steam/callback")
async def steam_callback(request: Request):
    params = dict(request.query_params)

    validation_params = dict(params)
    validation_params['openid.mode'] = 'check_authentication'

    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.post(
                'https://steamcommunity.com/openid/login',
                data=validation_params,
                timeout=15.0
            )
        if 'is_valid:true' not in resp.text:
            logger.error(f"Steam validation failed: {resp.text}")
            return RedirectResponse(url=f"{APP_URL}/?auth_error=validation_failed")
    except Exception as e:
        logger.error(f"Steam callback error: {e}")
        return RedirectResponse(url=f"{APP_URL}/?auth_error=connection_error")

    claimed_id = params.get('openid.claimed_id', '')
    steam_id_match = re.search(r'/openid/id/(\d+)', claimed_id)
    if not steam_id_match:
        return RedirectResponse(url=f"{APP_URL}/?auth_error=no_steam_id")

    steam_id = steam_id_match.group(1)

    try:
        async with httpx.AsyncClient() as http_client:
            player_resp = await http_client.get(
                'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
                params={'key': STEAM_API_KEY, 'steamids': steam_id},
                timeout=10.0
            )
        player_data = player_resp.json()
        players = player_data.get('response', {}).get('players', [])
    except Exception as e:
        logger.error(f"Player fetch error: {e}")
        players = []

    player = players[0] if players else {}
    username = player.get('personaname', f'User_{steam_id[-4:]}')
    avatar = player.get('avatarfull', '')

    user_data = {
        'steam_id': steam_id,
        'username': username,
        'avatar_url': avatar,
        'avatar_medium': player.get('avatarmedium', ''),
        'profile_url': player.get('profileurl', ''),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }

    existing_user = await db.users.find_one({'steam_id': steam_id}, {'_id': 0})
    if existing_user:
        await db.users.update_one({'steam_id': steam_id}, {'$set': user_data})
        user_id = existing_user['id']
    else:
        user_id = str(uuid.uuid4())
        user_data['id'] = user_id
        user_data['created_at'] = datetime.now(timezone.utc).isoformat()
        await db.users.insert_one(user_data)

    token = jwt.encode({
        'user_id': user_id,
        'steam_id': steam_id,
        'username': username,
        'avatar_url': avatar,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }, JWT_SECRET, algorithm='HS256')

    return RedirectResponse(url=f"{APP_URL}/auth/callback?token={token}")

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    user_data = await db.users.find_one({'steam_id': user['steam_id']}, {'_id': 0})
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    return user_data

@api_router.post("/auth/logout")
async def logout():
    return {"message": "Logged out"}

# ============ GAME ROUTES ============

@api_router.get("/games")
async def get_games(
    category: Optional[str] = None,
    search: Optional[str] = None,
    user=Depends(get_current_user)
):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    query = {'user_id': user['user_id']}
    if category:
        query['categories'] = category
    if search:
        query['name'] = {'$regex': search, '$options': 'i'}
    games = await db.user_games.find(query, {'_id': 0}).sort('added_at', -1).to_list(1000)
    return games

@api_router.post("/games")
async def add_game(game: GameAdd, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    doc, err = await _add_game_to_library(game.app_id, game.name, user['user_id'])
    if err == "already_exists":
        return JSONResponse(status_code=400, content={"error": "Game already in library"})
    return doc

@api_router.post("/games/from-url")
async def add_game_from_url(body: GameAddByUrl, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    app_id = extract_app_id_from_url(body.url)
    if not app_id:
        return JSONResponse(status_code=400, content={"error": "Invalid Steam URL. Expected format: https://store.steampowered.com/app/12345"})
    doc, err = await _add_game_to_library(app_id, "", user['user_id'])
    if err == "already_exists":
        return JSONResponse(status_code=400, content={"error": "Game already in library"})
    return doc

@api_router.delete("/games/{game_id}")
async def delete_game(game_id: str, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    result = await db.user_games.delete_one({'id': game_id, 'user_id': user['user_id']})
    if result.deleted_count == 0:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    return {"message": "Game removed"}

@api_router.put("/games/{game_id}/categories")
async def update_game_categories(game_id: str, update: GameUpdate, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    result = await db.user_games.update_one(
        {'id': game_id, 'user_id': user['user_id']},
        {'$set': {'categories': update.categories}}
    )
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    game = await db.user_games.find_one({'id': game_id}, {'_id': 0})
    return game

# ============ STEAM PROXY ROUTES (PUBLIC) ============

@api_router.get("/steam/search")
async def steam_search(term: str = Query(..., min_length=1)):
    async with httpx.AsyncClient() as http_client:
        try:
            resp = await http_client.get(
                'https://store.steampowered.com/api/storesearch/',
                params={'term': term, 'l': 'english', 'cc': 'US'},
                timeout=10.0
            )
            if resp.status_code != 200:
                return JSONResponse(status_code=502, content={"error": "Steam API error"})
            return resp.json()
        except Exception:
            return JSONResponse(status_code=502, content={"error": "Failed to reach Steam"})

@api_router.get("/steam/app/{app_id}")
async def steam_app_details(app_id: int):
    data = await fetch_steam_app_details(app_id)
    if not data:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    return data

@api_router.post("/steam/sync-wishlist")
async def sync_wishlist(user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})

    steam_id = user['steam_id']
    all_items = {}

    async with httpx.AsyncClient() as http_client:
        for page in range(10):
            try:
                resp = await http_client.get(
                    f'https://store.steampowered.com/wishlist/profiles/{steam_id}/wishlistdata/',
                    params={'p': page},
                    timeout=15.0
                )
                if resp.status_code != 200:
                    break
                data = resp.json()
                if not data or isinstance(data, list):
                    break
                all_items.update(data)
            except Exception:
                break

    if not all_items:
        return {"message": "No wishlist items found. Your Steam profile or wishlist may be private.", "added_count": 0}

    added_count = 0
    for app_id_str, item_data in all_items.items():
        try:
            app_id = int(app_id_str)
        except ValueError:
            continue

        existing = await db.user_games.find_one({'user_id': user['user_id'], 'app_id': app_id})
        if existing:
            continue

        screenshots = item_data.get('screenshots', [])
        if not isinstance(screenshots, list):
            screenshots = []

        doc = {
            'id': str(uuid.uuid4()),
            'user_id': user['user_id'],
            'app_id': app_id,
            'name': item_data.get('name', 'Unknown'),
            'header_image': f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/header.jpg",
            'capsule_image': f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/library_600x900.jpg",
            'screenshots': screenshots[:6],
            'categories': [],
            'genres': [],
            'steam_url': f"https://store.steampowered.com/app/{app_id}",
            'release_date': item_data.get('release_string', ''),
            'short_description': '',
            'developers': [],
            'publishers': [],
            'is_from_wishlist': True,
            'added_at': datetime.now(timezone.utc).isoformat()
        }
        await db.user_games.insert_one(doc)
        added_count += 1

    # Enrich first batch with full details
    games_to_enrich = await db.user_games.find(
        {'user_id': user['user_id'], 'categories': [], 'is_from_wishlist': True},
        {'_id': 0}
    ).limit(15).to_list(15)

    for game in games_to_enrich:
        try:
            details = await fetch_steam_app_details(game['app_id'])
            if details:
                await db.user_games.update_one(
                    {'id': game['id']},
                    {'$set': {
                        'categories': map_steam_categories(details),
                        'genres': [g.get('description', '') for g in details.get('genres', [])],
                        'short_description': details.get('short_description', ''),
                        'developers': details.get('developers', []),
                        'publishers': details.get('publishers', []),
                    }}
                )
            await asyncio.sleep(0.25)
        except Exception:
            continue

    return {"message": f"Synced {added_count} games from wishlist", "added_count": added_count}

# ============ CATEGORIES ============

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

# ============ HEALTH ============

@api_router.get("/health")
async def health():
    return {"status": "ok", "steam_key_configured": bool(STEAM_API_KEY)}

# ============ SETUP ============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
