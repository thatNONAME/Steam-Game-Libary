#!/bin/bash

# 🚀 Steam Game Library - Quick Setup Script
# Dieses Skript setzt dein Projekt schnell auf für lokale Entwicklung

set -e

echo "========================================="
echo "🎮 Steam Game Library - Setup"
echo "========================================="
echo ""

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backend vorbereiten
echo -e "${BLUE}[1/4]${NC} Backend vorbereiten..."
cd backend

if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "  Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

# .env prüfen
if [ ! -f ".env" ]; then
    echo "  Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}  ⚠️  WICHTIG: Bitte .env bearbeiten und deine Werte eintragen!${NC}"
    echo "     - STEAM_API_KEY: https://steamcommunity.com/dev/apikey"
    echo "     - JWT_SECRET: openssl rand -hex 32"
fi

cd ..

# 2. Frontend vorbereiten
echo ""
echo -e "${BLUE}[2/4]${NC} Frontend vorbereiten..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install > /dev/null 2>&1
else
    echo "  npm modules already installed"
fi

cd ..

# 3. MongoDB prüfen
echo ""
echo -e "${BLUE}[3/4]${NC} MongoDB prüfen..."
if command -v mongod &> /dev/null; then
    echo "  ✅ MongoDB installiert"
    if pgrep mongod > /dev/null; then
        echo "  ✅ MongoDB läuft"
    else
        echo -e "${YELLOW}  ⚠️  MongoDB nicht laufen${NC}"
        echo "     Starte mit: mongod"
    fi
else
    echo -e "${YELLOW}  ⚠️  MongoDB nicht installiert${NC}"
    echo "     Installiere mit: sudo apt install -y mongodb"
    echo "     Oder verwende MongoDB Atlas Cloud"
fi

# 4. Zusammenfassung
echo ""
echo -e "${BLUE}[4/4]${NC} Zusammenfassung"
echo ""
echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo "Nächste Schritte:"
echo ""
echo "1️⃣  Backend starten (Terminal 1):"
echo -e "   ${BLUE}source backend/venv/bin/activate${NC}"
echo -e "   ${BLUE}cd backend && uvicorn server:app --reload${NC}"
echo ""
echo "2️⃣  Frontend starten (Terminal 2):"
echo -e "   ${BLUE}cd frontend && npm start${NC}"
echo ""
echo "3️⃣  Öffne im Browser:"
echo -e "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "📖 Deployment-Anleitung:"
echo -e "   ${BLUE}cat DEPLOYMENT_GUIDE_DE.md${NC}"
echo ""
echo "========================================="
