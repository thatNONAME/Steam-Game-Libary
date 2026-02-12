# 🎮 Steam Game Library - Unabhängig gehostet

✅ **Dieses Projekt wurde erfolgreich von Emergent.sh befreit!**

Alle Abhängigkeiten zu `app.emergent.sh` wurden entfernt und der Code kann jetzt auf **jeder beliebigen Domain** gehostet werden.

---

## 📋 Was wurde geändert?

### 1. Backend (Python/FastAPI)
- ✅ `emergentintegrations` Package aus `requirements.txt` entfernt
- ✅ Keine Abhängigkeiten zu Emergent.sh mehr

### 2. Frontend (React)
- ✅ Alle Emergent.sh Scripts aus `index.html` entfernt
- ✅ `emergent-main.js` Script entfernt
- ✅ `debug-monitor.js` Script entfernt  
- ✅ Emergent Badge/Branding entfernt
- ✅ Meta-Tags angepasst

### 3. Konfiguration
- ✅ CORS eingeschränkt auf deine Domain (statt emergent.sh)
- ✅ Backend-Test-URLs aktualisiert
- ✅ `.env.example` hinzugefügt

---

## 🚀 Schnell Starten

### Lokal entwickeln:

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env erstellen
cp .env.example .env
# .env bearbeiten mit deinen Werten

# Backend starten
uvicorn server:app --reload

# In separatem Terminal - Frontend
cd ../frontend
npm install
npm start
```

Öffne: http://localhost:3000

### Auf Production-Server deployen:

👉 **Siehe [DEPLOYMENT_GUIDE_DE.md](./DEPLOYMENT_GUIDE_DE.md) für Schritt-für-Schritt Anleitung**

Key Punkte:
- Nginx als Reverse Proxy
- Backend mit Systemd
- SSL mit Let's Encrypt
- MongoDB lokal oder Cloud (Atlas)

---

## 🔧 Umgebungsvariablen

```env
MONGO_URL=mongodb://localhost:27017          # oder MongoDB Atlas
DB_NAME=steam_library
STEAM_API_KEY=xxxxx                          # von https://steamcommunity.com/dev/apikey
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxx             # 32+ Zeichen
APP_URL=https://yourdomain.com              # deine Domain
CORS_ORIGINS=https://yourdomain.com         # CORS erlaubo origins
```

---

## 📦 Tech Stack

- **Backend**: FastAPI + Motor (async MongoDB)
- **Frontend**: React 19 + React Router
- **Database**: MongoDB
- **Deployment**: Nginx + Systemd + Let's Encrypt

---

## ✨ Features

✅ Steam OAuth Login  
✅ Steam Game Library Integration  
✅ User Collections  
✅ Öffentliche Profile  
✅ User Follow System  
✅ Comments & Moderation  
✅ File Upload (Profile Pictures)  
✅ Role Management (Admin/Moderator)  

---

## 🆘 Fragen?

Schau dir die ausführliche Deployment-Anleitung an:
→ [DEPLOYMENT_GUIDE_DE.md](./DEPLOYMENT_GUIDE_DE.md)

---

## 📄 Lizenz

Dieses Projekt ist frei zu verwenden und zu modifizieren.

**Froh zu helfen! 🎉**
