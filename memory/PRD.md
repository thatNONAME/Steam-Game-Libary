# Game Library - Steam Game Library App

## Problem Statement
Full-stack web application for managing and displaying a personal library of Steam games, with social features, collections, role management, support system, and discoverability.

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
- Unreleased games sort to bottom of all sorted lists
- Collection cards directly clickable (no View button)
- Role system (Creator, Admin, Moderator, Tester) with colored badges
- Admin panel for role management (owner-only)
- Follow/unfollow system, followers/following list page
- Comment system with profanity filter
- File upload for profile pictures and banners
- Discover feed with Collections and Users tabs
- Role badges in user search, profiles, comments, discover

### Iteration 4 - Support System & Collection Management (Feb 2026)
- **NEW**: Support ticket system — users submit tickets with categories (Bug, Account, Feature, General)
- **NEW**: Support admin page — owner views all tickets, replies to users, closes tickets
- **NEW**: Notification system — users get notified when owner replies to their ticket, bell icon in navbar with unread count
- **NEW**: Remove games from collections — X button on hover in collection view (owner only)
- **NEW**: Discover users sorted by roles — users with special roles (Creator, Admin, etc.) always appear first
- **NEW**: Support email shown: suportgamelibary@gmail.com

## Key Technical Details
- Creator Steam ID: 76561199491242446
- Steam API Key: configured in backend/.env
- MongoDB collections: users, user_games, collections, comments, support_tickets, notifications
- Support email: suportgamelibary@gmail.com

## Backlog
### P1
- Feed of content from followed users
- Game detail modal with full screenshots

### P2
- Enrichment of wishlist games (async details fetch)
- Import localStorage games on login
- Custom collection thumbnails
