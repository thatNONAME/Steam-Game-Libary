# 🚀 PRODUCTION DEPLOYMENT - Kompletter Guide

## 🎯 Was wird benötigt:

1. ✅ **Domain** (deine-domain.com)
2. ✅ **Server** (wo die App läuft)
3. ✅ **MongoDB** (Datenbank für User/Games)
4. ✅ **Steam API Key** (für Steam OAuth & Game info)
5. ✅ **SSL Zertifikat** (HTTPS)

---

## 🌐 BEST Server-Provider (für dein Projekt):

### **⭐ TOP EMPFEHLUNG: Railway (€5-20/Mo)**
- ✅ **Einfachstes Deployment** (Git → Auto Deploy)
- ✅ **Docker Support** (wir haben `docker-compose.yml`)
- ✅ **MongoDB Addon** verfügbar
- ✅ **SSL automatisch**
- ✅ Deutsche Community

### **Alternative: Render (€7/Mo)**
- ✅ Kostenlos 750h/Mo (≈ Gratis!)
- ✅ Sehr einfach
- ✅ Auto Deploy von GitHub

### **Alternative: DigitalOcean (€5/Mo)**
- ✅ Volle Kontrolle
- ✅ More kompliziert aber stabiler

---

## 📋 SCHRITT-FÜR-SCHRITT: Mit Railway

### **1. Railway Account erstellen**
- Gehe zu: https://railway.app
- Klicke "Login with GitHub"
- Verbinde dein GitHub

### **2. Neues Projekt erstellen**
```
New Project → GitHub Repo → Steam-Game-Libary
```

### **3. Environment Variables setzen**

In Railway → Project → Variables:

```env
# Backend
MONGO_URL=<Von Railway MongoDB>
DB_NAME=steam_library
STEAM_API_KEY=<Dein Steam API Key>
JWT_SECRET=<openssl rand -hex 32>
APP_URL=https://deine-domain.com
CORS_ORIGINS=https://deine-domain.com,https://www.deine-domain.com

# Frontend
REACT_APP_BACKEND_URL=https://deine-domain.com/api
```

### **4. MongoDB hinzufügen**
- Railway Dashboard → Add Service → MongoDB
- Auto verbunden zur `MONGO_URL`

### **5. Domain verbinden**
- Railway → Project Settings → Domain
- Oder: Deine Domain → DNS → CNAME zu Railway

---

## 🎮 STEAM FUNKTIONEN einrichten

### **Schritt 1: Steam API Key holen**

1. Gehe zu: https://steamcommunity.com/dev/apikey
2. Melde dich mit deinem Steam Account an
3. Akzeptiere die WebAPI Terms
4. Du bekommst einen **API Key**
5. Kopiere den Key in `.env`:

```env
STEAM_API_KEY=ABC123DEF456IJKLM789...
```

### **Schritt 2: Steam OAuth konfigurieren**

Backend braucht diese Values:

```env
STEAM_API_KEY=dein-key
APP_URL=https://deine-domain.com
```

Das reicht! Der Backend handled alles automatisch.

### **Funktionen die dann arbeiten:**

✅ **Steam Login** - User können sich mit Steam einloggen  
✅ **Game Library** - Alle Steam Games der User werden geladen  
✅ **Game Search** - User können nach Games suchen + hinzufügen  
✅ **Steam Wishlist Sync** - Automatisches Importieren der Wishlist  
✅ **Game Details** - Name, Bilder, Preis, Reviews werden von Steam geholt

---

## 👥 USER SEARCH & ONLINE FUNKTIONEN

Diese funktionieren automatisch sobald:

✅ **MongoDB läuft** - Benutzer werden gespeichert  
✅ **Backend läuft** - User Search & Profile APIs arbeiten  
✅ **Frontend connected** - Mit korrektem `REACT_APP_BACKEND_URL`

---

## 📺 ÖFFENTLICHE PROFILE

Benutzer können Profile einsehen wenn:

1. User logged sich mit Steam OAuth ein
2. Profile wird auto in MongoDB gespeichert
3. Andere User können es unter `/profile/:user_id` sehen
4. Einstellung: "Is Library Public" (standardmäßig JA)

---

## 🔐 SICHERHEIT für Production

Diese sind bereits im Code:

✅ JWT Token Authentication  
✅ Password Hashing (bcrypt)  
✅ CORS eingeschränkt auf deine Domain  
✅ Input Validation  
✅ Bad Word Filter in Comments

---

## 💻 Deployment Checklist

- [ ] Domain registriert (z.B. bei Bluehost, Namecheap, GoDaddy)
- [ ] Railway Account
- [ ] GitHub Repo mit Docker Files
- [ ] Steam API Key in Umgebungsvariablen
- [ ] MongoDB Atlas Account (oder Railway MongoDB)
- [ ] SSL Zertifikat (Railway macht automatisch)
- [ ] CORS_ORIGINS auf deine Domain gesetzt
- [ ] Test: http://deine-domain.com/api/health
- [ ] Test: Login mit Steam
- [ ] Test: Game Search funktioniert

---

## 🚀 QUICK DEPLOY mit Railway:

```bash
# 1. Repo zu GitHub pushen
git add .
git commit -m "Production ready"
git push origin main

# 2. Railway -> Connect GitHub Repo
# 3. Railway -> Add Variables (oben)
# 4. Railway -> Add MongoDB
# 5. Railway -> Connect Domain

# FERTIG! 🎉
```

---

## 🆘 Häufige Probleme bei Production:

### **Steam Login funktioniert nicht:**
→ Check `APP_URL` in `.env` ist korrekt  
→ Check `STEAM_API_KEY` ist gültig

### **Games zeigen nicht:**
→ Check `STEAM_API_KEY` valid ist  
→ Check `MONGO_URL` is reachbar

### **User Profile nicht sichtbar:**
→ Check MongoDB läuft  
→ Check User ist in Datenbank (user hat sich eingeloggt)

### **API Errors:**
```bash
# Backend Logs ansehen (in Railway):
Logs → Filter "error"
```

---

## 📞 KONTAKT INFOS

- **Railway Support:** https://railway.app/support
- **Steam API Docs:** https://developer.steamgames.com/
- **MongoDB Docs:** https://docs.mongodb.com/

---

**DEINE NÄCHSTEN STEPS:**

1. Entscheide: Railway oder Render?
2. Registriere dich dort
3. Hole deinen Steam API Key
4. Pushe Code zu GitHub
5. Connect Railway zu GitHub
6. Set Environment Variables
7. Add MongoDB
8. Test!

Brauchst du Hilfe bei einem dieser Schritte?** 🚀
