from fastapi import FastAPI, APIRouter, Request, Query, Header, Depends, UploadFile, File
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
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
import aiofiles
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlencode, urlparse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']
STEAM_API_KEY = os.environ.get('STEAM_API_KEY', '')
APP_URL = os.environ.get('APP_URL', '')
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret')

# Owner Steam ID - only this account can manage roles
OWNER_STEAM_ID = "76561199491242446"

VALID_ROLES = ["Creator", "Admin", "Moderator", "Tester"]

# Bad word filter - only truly offensive slurs/profanity
BAD_WORDS = set([
    "nigger", "nigga", "faggot", "retard", "kike", "spic", "chink", "wetback",
    "tranny", "cunt", "twat", "wanker",
    "n1gger", "n1gga", "f4ggot", "r3tard",
])

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

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
    "Massively Multiplayer": "MMO", "Free to Play": "Casual", "Early Access": "Indie",
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

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    custom_avatar: Optional[str] = None
    banner_image: Optional[str] = None
    is_library_public: Optional[bool] = None
    is_collections_public: Optional[bool] = None

class CollectionCreate(BaseModel):
    name: str
    description: str = ""
    is_public: bool = True
    game_ids: List[str] = []

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    game_ids: Optional[List[str]] = None

class RoleAssign(BaseModel):
    target_user_id: str
    role: str

class RoleRemove(BaseModel):
    target_user_id: str
    role: str

class CommentCreate(BaseModel):
    content: str
    target_type: str  # "profile" or "collection"
    target_id: str

class CommentModerate(BaseModel):
    action: str  # "delete" or "approve"

# ============ Helpers ============

def contains_bad_words(text: str) -> bool:
    words = re.findall(r'[a-zA-Z0-9]+', text.lower())
    for w in words:
        if w in BAD_WORDS:
            return True
    return False

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token_str = authorization.replace("Bearer ", "")
    try:
        payload = jwt.decode(token_str, JWT_SECRET, algorithms=["HS256"])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

async def is_owner(user) -> bool:
    if not user:
        return False
    return user.get('steam_id') == OWNER_STEAM_ID

async def is_moderator_or_above(user) -> bool:
    if not user:
        return False
    if user.get('steam_id') == OWNER_STEAM_ID:
        return True
    user_data = await db.users.find_one({'steam_id': user['steam_id']}, {'_id': 0, 'roles': 1})
    if not user_data:
        return False
    roles = user_data.get('roles', [])
    return any(r in roles for r in ['Creator', 'Admin', 'Moderator'])

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
                params={'appids': app_id}, timeout=10.0
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

def is_unreleased_game(game):
    rd = (game.get('release_date') or '').strip().lower()
    if not rd:
        return True
    return any(kw in rd for kw in ['coming soon', 'to be announced', 'tbd', 'tba', 'when it'])

def sort_with_unreleased_last(games, sort_field, sort_dir):
    released = [g for g in games if not is_unreleased_game(g)]
    unreleased = [g for g in games if is_unreleased_game(g)]
    reverse = sort_dir == -1
    released.sort(key=lambda g: g.get(sort_field) or '', reverse=reverse)
    return released + unreleased

def extract_app_id_from_url(url: str) -> Optional[int]:
    match = re.search(r'/app/(\d+)', url)
    return int(match.group(1)) if match else None

async def _add_game_to_library(app_id: int, name: str, user_id: str, is_wishlist: bool = False):
    existing = await db.user_games.find_one({'user_id': user_id, 'app_id': app_id}, {'_id': 0})
    if existing:
        return existing, "already_exists"
    game_data = await fetch_steam_app_details(app_id)
    price_data = game_data.get('price_overview', {}) if game_data else {}
    doc = {
        'id': str(uuid.uuid4()), 'user_id': user_id, 'app_id': app_id,
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
        'price_cents': price_data.get('final', 0) if price_data else 0,
        'is_free': game_data.get('is_free', False) if game_data else False,
        'review_score': game_data.get('metacritic', {}).get('score', 0) if game_data else 0,
        'total_reviews': game_data.get('recommendations', {}).get('total', 0) if game_data else 0,
        'is_from_wishlist': is_wishlist,
        'added_at': datetime.now(timezone.utc).isoformat()
    }
    await db.user_games.insert_one(doc)
    doc.pop('_id', None)
    return doc, None

# ============ AUTH ROUTES ============

@api_router.get("/auth/steam/login")
async def steam_login(request: Request):
    origin = request.headers.get('referer', APP_URL).rstrip('/')
    if origin.endswith('/'):
        origin = origin[:-1]
    parsed = urlparse(origin)
    base_url = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else APP_URL
    callback_url = f"{base_url}/api/auth/steam/callback"
    params = {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': callback_url,
        'openid.realm': base_url + '/',
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    }
    return RedirectResponse(url=f"https://steamcommunity.com/openid/login?{urlencode(params)}")

@api_router.get("/auth/steam/callback")
async def steam_callback(request: Request):
    params = dict(request.query_params)
    return_to = params.get('openid.return_to', '')
    parsed = urlparse(return_to)
    base_url = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else APP_URL

    validation_params = dict(params)
    validation_params['openid.mode'] = 'check_authentication'
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.post('https://steamcommunity.com/openid/login', data=validation_params, timeout=15.0)
        if 'is_valid:true' not in resp.text:
            return RedirectResponse(url=f"{base_url}/?auth_error=validation_failed")
    except Exception:
        return RedirectResponse(url=f"{base_url}/?auth_error=connection_error")

    claimed_id = params.get('openid.claimed_id', '')
    steam_id_match = re.search(r'/openid/id/(\d+)', claimed_id)
    if not steam_id_match:
        return RedirectResponse(url=f"{base_url}/?auth_error=no_steam_id")
    steam_id = steam_id_match.group(1)

    try:
        async with httpx.AsyncClient() as http_client:
            player_resp = await http_client.get(
                'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
                params={'key': STEAM_API_KEY, 'steamids': steam_id}, timeout=10.0)
        players = player_resp.json().get('response', {}).get('players', [])
    except Exception:
        players = []

    player = players[0] if players else {}
    username = player.get('personaname', f'User_{steam_id[-4:]}')
    avatar = player.get('avatarfull', '')

    user_data = {
        'steam_id': steam_id, 'username': username, 'avatar_url': avatar,
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
        user_data.update({
            'id': user_id, 'display_name': username, 'bio': '',
            'custom_avatar': '', 'banner_image': '',
            'is_library_public': True, 'is_collections_public': True,
            'roles': ['Creator'] if steam_id == OWNER_STEAM_ID else [],
            'followers': [], 'following': [],
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        await db.users.insert_one(user_data)

    # Ensure owner always has Creator role
    if steam_id == OWNER_STEAM_ID:
        await db.users.update_one({'steam_id': steam_id}, {'$addToSet': {'roles': 'Creator'}})

    token = jwt.encode({
        'user_id': user_id, 'steam_id': steam_id,
        'username': username, 'avatar_url': avatar,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }, JWT_SECRET, algorithm='HS256')
    return RedirectResponse(url=f"{base_url}/auth/callback?token={token}")

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    user_data = await db.users.find_one({'steam_id': user['steam_id']}, {'_id': 0})
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    user_data['is_owner'] = user.get('steam_id') == OWNER_STEAM_ID
    return user_data

@api_router.post("/auth/logout")
async def logout():
    return {"message": "Logged out"}

# ============ FILE UPLOAD ============

@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    allowed = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
    if file.content_type not in allowed:
        return JSONResponse(status_code=400, content={"error": "Only JPEG, PNG, WebP, GIF allowed"})
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        return JSONResponse(status_code=400, content={"error": "File too large (max 5MB)"})
    ext = file.filename.rsplit('.', 1)[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = UPLOAD_DIR / filename
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(contents)
    url = f"/api/uploads/{filename}"
    return {"url": url, "filename": filename}

# ============ ROLE MANAGEMENT (Owner Only) ============

@api_router.post("/roles/assign")
async def assign_role(body: RoleAssign, user=Depends(get_current_user)):
    if not await is_owner(user):
        return JSONResponse(status_code=403, content={"error": "Only the site owner can manage roles"})
    if body.role not in VALID_ROLES:
        return JSONResponse(status_code=400, content={"error": f"Invalid role. Valid: {VALID_ROLES}"})
    result = await db.users.update_one({'id': body.target_user_id}, {'$addToSet': {'roles': body.role}})
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    updated = await db.users.find_one({'id': body.target_user_id}, {'_id': 0, 'id': 1, 'username': 1, 'roles': 1})
    return updated

@api_router.post("/roles/remove")
async def remove_role(body: RoleRemove, user=Depends(get_current_user)):
    if not await is_owner(user):
        return JSONResponse(status_code=403, content={"error": "Only the site owner can manage roles"})
    if body.role not in VALID_ROLES:
        return JSONResponse(status_code=400, content={"error": f"Invalid role. Valid: {VALID_ROLES}"})
    await db.users.update_one({'id': body.target_user_id}, {'$pull': {'roles': body.role}})
    updated = await db.users.find_one({'id': body.target_user_id}, {'_id': 0, 'id': 1, 'username': 1, 'roles': 1})
    return updated

@api_router.get("/roles/users")
async def list_users_with_roles(user=Depends(get_current_user)):
    if not await is_owner(user):
        return JSONResponse(status_code=403, content={"error": "Only the owner can view this"})
    users = await db.users.find(
        {}, {'_id': 0, 'id': 1, 'username': 1, 'display_name': 1, 'avatar_url': 1, 'custom_avatar': 1, 'roles': 1, 'steam_id': 1}
    ).to_list(500)
    return users

# ============ FOLLOW SYSTEM ============

@api_router.post("/follow/{target_user_id}")
async def follow_user(target_user_id: str, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    if target_user_id == user['user_id']:
        return JSONResponse(status_code=400, content={"error": "Cannot follow yourself"})
    target = await db.users.find_one({'id': target_user_id}, {'_id': 0, 'id': 1})
    if not target:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    await db.users.update_one({'id': user['user_id']}, {'$addToSet': {'following': target_user_id}})
    await db.users.update_one({'id': target_user_id}, {'$addToSet': {'followers': user['user_id']}})
    return {"message": "Followed", "following": True}

@api_router.delete("/follow/{target_user_id}")
async def unfollow_user(target_user_id: str, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    await db.users.update_one({'id': user['user_id']}, {'$pull': {'following': target_user_id}})
    await db.users.update_one({'id': target_user_id}, {'$pull': {'followers': user['user_id']}})
    return {"message": "Unfollowed", "following": False}

# ============ COMMENTS ============

@api_router.post("/comments")
async def create_comment(body: CommentCreate, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    if not body.content.strip():
        return JSONResponse(status_code=400, content={"error": "Comment cannot be empty"})
    if len(body.content) > 500:
        return JSONResponse(status_code=400, content={"error": "Comment too long (max 500 chars)"})
    if contains_bad_words(body.content):
        return JSONResponse(status_code=400, content={"error": "Comment contains inappropriate language"})
    if body.target_type not in ("profile", "collection"):
        return JSONResponse(status_code=400, content={"error": "Invalid target type"})
    doc = {
        'id': str(uuid.uuid4()),
        'user_id': user['user_id'],
        'username': user['username'],
        'avatar_url': user.get('avatar_url', ''),
        'content': body.content.strip(),
        'target_type': body.target_type,
        'target_id': body.target_id,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'is_hidden': False,
    }
    await db.comments.insert_one(doc)
    doc.pop('_id', None)
    # Refetch author info for display
    author = await db.users.find_one({'id': user['user_id']}, {'_id': 0, 'id': 1, 'username': 1, 'display_name': 1, 'avatar_url': 1, 'custom_avatar': 1, 'roles': 1})
    if author:
        doc['author'] = author
    return doc

@api_router.get("/comments")
async def get_comments(target_type: str = Query(...), target_id: str = Query(...)):
    comments = await db.comments.find(
        {'target_type': target_type, 'target_id': target_id, 'is_hidden': False},
        {'_id': 0}
    ).sort('created_at', -1).limit(100).to_list(100)
    if comments:
        author_ids = list(set(c['user_id'] for c in comments))
        authors = await db.users.find(
            {'id': {'$in': author_ids}},
            {'_id': 0, 'id': 1, 'username': 1, 'display_name': 1, 'avatar_url': 1, 'custom_avatar': 1, 'roles': 1}
        ).to_list(100)
        author_map = {a['id']: a for a in authors}
        for c in comments:
            c['author'] = author_map.get(c['user_id'], {})
    return comments

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    comment = await db.comments.find_one({'id': comment_id}, {'_id': 0})
    if not comment:
        return JSONResponse(status_code=404, content={"error": "Comment not found"})
    can_delete = comment['user_id'] == user['user_id'] or await is_moderator_or_above(user)
    if not can_delete:
        return JSONResponse(status_code=403, content={"error": "Not authorized to delete"})
    await db.comments.update_one({'id': comment_id}, {'$set': {'is_hidden': True}})
    return {"message": "Comment deleted"}

# ============ PROFILE ROUTES ============

@api_router.put("/profile")
async def update_profile(update: ProfileUpdate, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        return JSONResponse(status_code=400, content={"error": "Nothing to update"})
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({'id': user['user_id']}, {'$set': update_dict})
    updated = await db.users.find_one({'id': user['user_id']}, {'_id': 0})
    return updated

@api_router.get("/profile/{user_id}")
async def get_public_profile(user_id: str):
    user_data = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    follower_count = len(user_data.get('followers', []))
    following_count = len(user_data.get('following', []))
    return {
        'id': user_data['id'],
        'display_name': user_data.get('display_name', user_data.get('username', '')),
        'username': user_data.get('username', ''),
        'avatar_url': user_data.get('custom_avatar') or user_data.get('avatar_url', ''),
        'banner_image': user_data.get('banner_image', ''),
        'bio': user_data.get('bio', ''),
        'steam_id': user_data.get('steam_id', ''),
        'roles': user_data.get('roles', []),
        'is_library_public': user_data.get('is_library_public', True),
        'is_collections_public': user_data.get('is_collections_public', True),
        'followers': user_data.get('followers', []),
        'following': user_data.get('following', []),
        'follower_count': follower_count,
        'following_count': following_count,
        'created_at': user_data.get('created_at', ''),
    }

@api_router.get("/profile/{user_id}/games")
async def get_public_games(user_id: str):
    user_data = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    if not user_data.get('is_library_public', True):
        return JSONResponse(status_code=403, content={"error": "Library is private"})
    return await db.user_games.find({'user_id': user_id}, {'_id': 0}).sort('added_at', -1).to_list(1000)

@api_router.get("/profile/{user_id}/collections")
async def get_public_collections(user_id: str):
    user_data = await db.users.find_one({'id': user_id}, {'_id': 0})
    if not user_data:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    if not user_data.get('is_collections_public', True):
        return JSONResponse(status_code=403, content={"error": "Collections are private"})
    collections = await db.collections.find({'user_id': user_id, 'is_public': True}, {'_id': 0}).to_list(100)
    all_gids = []
    for c in collections:
        all_gids.extend(c.get('game_ids', []))
    if all_gids:
        games = await db.user_games.find({'id': {'$in': list(set(all_gids))}}, {'_id': 0, 'id': 1, 'name': 1, 'app_id': 1, 'capsule_image': 1, 'header_image': 1}).to_list(500)
        gmap = {g['id']: g for g in games}
    else:
        gmap = {}
    for c in collections:
        c['games'] = [gmap[gid] for gid in c.get('game_ids', []) if gid in gmap]
    return collections

# ============ USER SEARCH ============

@api_router.get("/users/search")
async def search_users(q: str = Query(..., min_length=1)):
    users = await db.users.find(
        {'$or': [{'username': {'$regex': q, '$options': 'i'}}, {'display_name': {'$regex': q, '$options': 'i'}}]},
        {'_id': 0, 'id': 1, 'username': 1, 'display_name': 1, 'avatar_url': 1, 'custom_avatar': 1, 'is_library_public': 1, 'roles': 1, 'followers': 1}
    ).limit(20).to_list(20)
    if users:
        user_ids = [u['id'] for u in users]
        counts = await db.user_games.aggregate([
            {'$match': {'user_id': {'$in': user_ids}}},
            {'$group': {'_id': '$user_id', 'count': {'$sum': 1}}}
        ]).to_list(100)
        count_map = {c['_id']: c['count'] for c in counts}
        for u in users:
            u['avatar_url'] = u.get('custom_avatar') or u.get('avatar_url', '')
            u['game_count'] = count_map.get(u['id'], 0)
            u['follower_count'] = len(u.get('followers', []))
            u.pop('followers', None)
    return users

# ============ GAME ROUTES ============

@api_router.get("/games")
async def get_games(category: Optional[str] = None, search: Optional[str] = None,
                    sort_by: Optional[str] = None, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    query = {'user_id': user['user_id']}
    if category:
        query['categories'] = category
    if search:
        query['name'] = {'$regex': search, '$options': 'i'}
    sort_field, sort_dir = 'added_at', -1
    if sort_by == 'name_asc': sort_field, sort_dir = 'name', 1
    elif sort_by == 'name_desc': sort_field, sort_dir = 'name', -1
    elif sort_by == 'price_asc': sort_field, sort_dir = 'price_cents', 1
    elif sort_by == 'price_desc': sort_field, sort_dir = 'price_cents', -1
    elif sort_by == 'reviews_desc': sort_field, sort_dir = 'total_reviews', -1
    elif sort_by == 'release_desc': sort_field, sort_dir = 'release_date', -1
    elif sort_by == 'release_asc': sort_field, sort_dir = 'release_date', 1
    games = await db.user_games.find(query, {'_id': 0}).sort(sort_field, sort_dir).to_list(1000)
    # Push unreleased games to the bottom of all sorted lists
    if sort_by and sort_by != 'added':
        games = sort_with_unreleased_last(games, sort_field, sort_dir)
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
        return JSONResponse(status_code=400, content={"error": "Invalid Steam URL"})
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
        {'id': game_id, 'user_id': user['user_id']}, {'$set': {'categories': update.categories}})
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    return await db.user_games.find_one({'id': game_id}, {'_id': 0})

# ============ COLLECTIONS ============

@api_router.get("/collections")
async def get_collections(user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    collections = await db.collections.find({'user_id': user['user_id']}, {'_id': 0}).to_list(100)
    all_gids = []
    for c in collections:
        all_gids.extend(c.get('game_ids', []))
    if all_gids:
        games = await db.user_games.find({'id': {'$in': list(set(all_gids))}}, {'_id': 0, 'id': 1, 'name': 1, 'app_id': 1, 'capsule_image': 1, 'header_image': 1}).to_list(500)
        gmap = {g['id']: g for g in games}
    else:
        gmap = {}
    for c in collections:
        c['games'] = [gmap[gid] for gid in c.get('game_ids', []) if gid in gmap]
    return collections

@api_router.post("/collections")
async def create_collection(body: CollectionCreate, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    doc = {
        'id': str(uuid.uuid4()), 'user_id': user['user_id'],
        'name': body.name, 'description': body.description,
        'is_public': body.is_public, 'game_ids': body.game_ids,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.collections.insert_one(doc)
    doc.pop('_id', None)
    doc['games'] = []
    return doc

@api_router.put("/collections/{collection_id}")
async def update_collection(collection_id: str, body: CollectionUpdate, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    update_dict = {k: v for k, v in body.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.collections.update_one({'id': collection_id, 'user_id': user['user_id']}, {'$set': update_dict})
    if result.matched_count == 0:
        return JSONResponse(status_code=404, content={"error": "Collection not found"})
    return await db.collections.find_one({'id': collection_id}, {'_id': 0})

@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, user=Depends(get_current_user)):
    if not user:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    result = await db.collections.delete_one({'id': collection_id, 'user_id': user['user_id']})
    if result.deleted_count == 0:
        return JSONResponse(status_code=404, content={"error": "Collection not found"})
    return {"message": "Collection deleted"}

@api_router.get("/collections/{collection_id}/share")
async def get_shared_collection(collection_id: str):
    col = await db.collections.find_one({'id': collection_id, 'is_public': True}, {'_id': 0})
    if not col:
        return JSONResponse(status_code=404, content={"error": "Collection not found or private"})
    gids = col.get('game_ids', [])
    if gids:
        games = await db.user_games.find({'id': {'$in': gids}}, {'_id': 0}).to_list(100)
        col['games'] = games
    else:
        col['games'] = []
    owner = await db.users.find_one({'id': col['user_id']}, {'_id': 0, 'id': 1, 'username': 1, 'display_name': 1, 'avatar_url': 1, 'roles': 1})
    col['owner'] = owner
    return col

# ============ STEAM PROXY ============

@api_router.get("/steam/search")
async def steam_search(term: str = Query(..., min_length=1)):
    async with httpx.AsyncClient() as http_client:
        try:
            resp = await http_client.get('https://store.steampowered.com/api/storesearch/',
                params={'term': term, 'l': 'english', 'cc': 'US'}, timeout=10.0)
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
    wishlist_items = []
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get('https://api.steampowered.com/IWishlistService/GetWishlist/v1/',
                params={'steamid': steam_id, 'key': STEAM_API_KEY}, timeout=15.0)
            if resp.status_code == 200:
                wishlist_items = resp.json().get('response', {}).get('items', [])
    except Exception as e:
        logger.error(f"Wishlist fetch error: {e}")

    if not wishlist_items:
        return {"message": "No wishlist items found. Profile or wishlist may be private.", "added_count": 0}

    added_count = 0
    for item in wishlist_items:
        app_id = item.get('appid')
        if not app_id:
            continue
        existing = await db.user_games.find_one({'user_id': user['user_id'], 'app_id': app_id})
        if existing:
            continue
        doc = {
            'id': str(uuid.uuid4()), 'user_id': user['user_id'], 'app_id': app_id,
            'name': f'Game {app_id}',
            'header_image': f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/header.jpg",
            'capsule_image': f"https://cdn.akamai.steamstatic.com/steam/apps/{app_id}/library_600x900.jpg",
            'screenshots': [], 'categories': [], 'genres': [],
            'steam_url': f"https://store.steampowered.com/app/{app_id}",
            'release_date': '', 'short_description': '', 'developers': [], 'publishers': [],
            'price_cents': 0, 'is_free': False, 'review_score': 0, 'total_reviews': 0,
            'is_from_wishlist': True, 'added_at': datetime.now(timezone.utc).isoformat()
        }
        await db.user_games.insert_one(doc)
        added_count += 1

    games_to_enrich = await db.user_games.find(
        {'user_id': user['user_id'], 'name': {'$regex': '^Game \\d+$'}}, {'_id': 0}
    ).limit(50).to_list(50)
    enriched = 0
    for game in games_to_enrich:
        try:
            details = await fetch_steam_app_details(game['app_id'])
            if details:
                price_data = details.get('price_overview', {})
                await db.user_games.update_one({'id': game['id']}, {'$set': {
                    'name': details.get('name', game['name']),
                    'categories': map_steam_categories(details),
                    'genres': [g.get('description', '') for g in details.get('genres', [])],
                    'short_description': details.get('short_description', ''),
                    'developers': details.get('developers', []),
                    'publishers': details.get('publishers', []),
                    'release_date': details.get('release_date', {}).get('date', ''),
                    'screenshots': [s.get('path_full', '') for s in details.get('screenshots', [])[:6]],
                    'price_cents': price_data.get('final', 0) if price_data else 0,
                    'is_free': details.get('is_free', False),
                    'total_reviews': details.get('recommendations', {}).get('total', 0),
                }})
                enriched += 1
            await asyncio.sleep(0.2)
        except Exception:
            continue
    return {"message": f"Synced {added_count} new games. Enriched {enriched} with details.", "added_count": added_count}

# ============ CATEGORIES & HEALTH ============

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

@api_router.get("/health")
async def health():
    return {"status": "ok", "steam_key_configured": bool(STEAM_API_KEY)}

# ============ SETUP ============

app.include_router(api_router)

# Serve uploaded files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
