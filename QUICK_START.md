# 🎮 Steam Game Library - Vollständig Unabhängig

**Die Anwendung ist jetzt komplett unabhängig von Emergent.sh und kann auf jeder beliebigen Domain gehostet werden!**

---

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|-------------|
| **[RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)** | 🚀 **EMPFOHLEN** - 5 Min Production Deploy |
| **[STEAM_API_SETUP.md](./STEAM_API_SETUP.md)** | 🎮 Steam API Konfiguration |
| **[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)** | 📖 Kompletter Production Guide |
| **[DEPLOYMENT_GUIDE_DE.md](./DEPLOYMENT_GUIDE_DE.md)** | 🏗️ Manual Server Setup (Advanced) |
| **[CHANGES.md](./CHANGES.md)** | ✅ Was wurde geändert? |

---

## 🚀 Schnellstart (3 Varianten)

### 1️⃣ **Lokal entwickeln** (Einfach)
```bash
./setup.sh          # Automatisches Setup
cd backend && source venv/bin/activate && uvicorn server:app --reload
# In neuem Terminal:
cd frontend && npm start
```
→ http://localhost:3000

---

### 2️⃣ **Mit Docker** (Empfohlen für Anfänger)
```bash
cp .env.docker.example .env
docker-compose up
```
→ http://localhost:3000

---

### 3️⃣ **Auf Server** (Production)
```bash
# Siehe DEPLOYMENT_GUIDE_DE.md für:
# ✅ Nginx Konfiguration
# ✅ SSL mit Let's Encrypt
# ✅ Systemd Service
# ✅ MongoDB Setup
```

---

## 🔧 Konfiguration

**Backend `.env`:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=steam_library
STEAM_API_KEY=your-key-from-steamcommunity.com/dev
JWT_SECRET=generate-with-openssl-rand--hex-32
APP_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
```

**Frontend** nutzt `REACT_APP_API_URL` Environment Variable.

---

## 🗑️ Was wurde entfernt?

❌ `emergentintegrations` Package  
❌ Emergent.sh Scripts  
❌ Emergent Branding/Badge  
❌ CORS Beschränkungen auf emergent.sh  

✅ **Reiner, sauberer, unabhängiger Code**

---

## 📋 Tech Stack

- **Backend**: FastAPI (Python) + Motor (Async MongoDB)
- **Frontend**: React 19 + React Router + TailwindCSS
- **Database**: MongoDB
- **Deployment**: Nginx + Systemd + Docker (optional)
- **SSL**: Let's Encrypt (kostenlos)

---

## 🎯 Features

✅ Steam OAuth Login  
✅ Steam Spielbibliothek Integration  
✅ Benutzer Collections  
✅ Öffentliche Profile  
✅ Follow System  
✅ Comments & Moderation  
✅ Admin/Moderator Rollen  
✅ Dateiupload  

---

## 💾 Deployment-Optionen

| Provider | Kosten | Notizen |
|----------|--------|---------|
| **Railway** | ~$5/mo | ⭐ Empfohlen - Einfachstes Setup |
| **Render** | ~$7/mo | Kostenlos für 750h/mo |
| **Vercel** (Frontend) | Kostenlos | Nur Frontend |
| **DigitalOcean** | $5/mo | Volle Kontrolle |
| **Hetzner** | €3/mo | Europäisch, günstig |

**Mit Docker: Railway oder Render einfach `docker-compose.yml` pushen → Fertig!**

---

## 🔒 Sicherheit

✅ HTTPS/SSL Verschlüsselung  
✅ CORS auf deine Domain beschränkt  
✅ JWT Token Authentifizierung  
✅ Password Hashing (bcrypt)  
✅ Input Validation  

---

## 📞 Fragen oder Probleme?

1. **Schau [DEPLOYMENT_GUIDE_DE.md](./DEPLOYMENT_GUIDE_DE.md)**
2. **Check die Logs**: `sudo journalctl -u steam-library-backend.service -f`
3. **MongoDB Verbindung**: `mongostat --uri "$MONGO_URL"`
4. **Nginx testen**: `sudo nginx -t`

---

## 📄 Lizenz

Kostenlos zu verwenden & modifizieren

---

**🎉 Viel Erfolg beim Hosting auf deiner eigenen Domain!**
