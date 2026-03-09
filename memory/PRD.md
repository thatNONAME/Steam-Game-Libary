# Game Library - Steam Game Library App

## Problem Statement
Full-stack web application for managing and displaying a personal library of Steam games, with social features, collections, role management, ban/appeal system, support tickets, moderation tools, and discoverability.

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + MongoDB + Steam Web API
- **Auth**: Steam OpenID 2.0 (optional), JWT sessions
- **DB collections**: users, user_games, collections, comments, support_tickets, notifications, appeals, moderation_log

## What's Been Implemented

### Iteration 1-2: Core MVP
- Steam API integration, OpenID login, guest mode
- Game library, search, 30 categories, sorting, collections
- Profile customization, user search, wishlist sync, themes

### Iteration 3: Social & Discovery
- Role system (Creator/Admin/Moderator/Tester), follow system
- Comment system, file upload, discover feed, role badges

### Iteration 4: Support System
- Support tickets, notifications, remove games from collections

### Iteration 5: Role Permissions & Ban System
- Admin=Creator access, Moderator can reply tickets+ban
- Ban system (hidden profile, no comments, can still browse)
- Notification bell with mark-as-read

### Iteration 6: Major Feature Expansion (current)
- **Navbar restored**: Gamepad2 controller icon next to "Game Library" + "Library"
- **Profile bug fixed**: Steam ID fallback lookup, self-view when banned
- **Drag & drop**: Drop Steam store links on homepage to instantly add games
- **Custom collection pictures**: Upload cover images for collections
- **Rules page**: 10 community guidelines at /rules
- **Unban appeal system**: Banned users can submit appeals, staff reviews/approves/denies
- **Moderation log**: Tracks all bans/unbans/role changes, staff-only view
- **Discover Trending Games**: Live trending games from Steam Charts API
- **Collection pictures**: Shown on collection cards and discover

## Role Hierarchy
- **Creator** (Steam ID 76561199491242446): Full access to everything
- **Admin**: Same as Creator (admin panel, roles, tickets, bans)
- **Moderator**: Reply to tickets, ban/unban users, view modlog
- **Tester**: Normal user, no special rights

## Backlog
### P1
- Feed of content from followed users
- Game detail modal with full screenshots
- Achievement Showcase on profiles

### P2
- Custom collection thumbnails
- Game ratings (1-5 stars)
- Price alerts for Steam sales
