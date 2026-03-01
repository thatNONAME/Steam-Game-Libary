# Game Library - Steam Game Library App

## Problem Statement
Full-stack web application for managing and displaying a personal library of Steam games, with social features, collections, role management, and discoverability.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + MongoDB + Steam Web API
- **Auth**: Steam OpenID 2.0 (optional), JWT sessions

## Core Features
- Add Steam games (search, URL, drag)
- Display game cover art, click to Steam store page
- Search games, filter by 30 categories
- Sort by: A-Z, Z-A, Popular, Price, Release Date (unreleased at bottom)
- Guest mode (localStorage, max 10 games)
- Steam login via OpenID, wishlist sync
- 8 themes (Deep Dive, Liquid Metal, Zen Garden, Frost Glass, Deep Space, Sakura, Ember, Arctic)

## What's Been Implemented

### Iteration 1 - Core MVP
- Steam API integration, OpenID login, guest mode
- 30 categories, 3 themes, game grid, mobile responsive

### Iteration 2 - Major Update
- Wishlist sync (IWishlistService API)
- Collections (create, edit, delete, share)
- Profile customization (name, bio, avatar, banner, privacy)
- User search, 5+ themes, sorting, shared collection view

### Iteration 3 - Social & Discovery (Feb 2026)
- **FIX**: Unreleased games now sort to bottom of all sorted lists
- **FIX**: Collection cards are directly clickable (removed View button)
- **NEW**: Role system (Creator, Admin, Moderator, Tester) with colored badges
- **NEW**: Admin panel for role management (owner-only, Steam ID 76561199491242446)
- **NEW**: Follow/unfollow system with follower/following counts
- **NEW**: Followers/Following list page (/profile/:userId/followers)
- **NEW**: Comment system with profanity filter on profiles and collections
- **NEW**: File upload for profile pictures and banners
- **NEW**: Discover feed with Collections and Users tabs
- **NEW**: Role badges shown in user search, profiles, comments, discover
- **NEW**: Admin link in navbar (visible to owner only)
- **NEW**: Clickable follower count on profiles → followers page

## Key Technical Details
- Creator Steam ID: 76561199491242446
- Steam API Key: configured in backend/.env
- MongoDB: users, user_games, collections, comments

## Backlog
### P1
- Feed of content from followed users
- Game detail modal with full screenshots

### P2
- Enrichment of wishlist games (async details fetch)
- Import localStorage games on login
- Custom collection thumbnails
