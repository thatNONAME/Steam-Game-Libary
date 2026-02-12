# 🚀 Railway Deployment - 5 Minuten Setup

**Railway ist der EINFACHSTE Weg deine App live zu bringen!**

---

## Schritt 1: Account erstellen

1. Gehe zu https://railway.app
2. Klicke **"Login with GitHub"**
3. Authentifiziere dich

---

## Schritt 2: Projekt erstellen

1. Im Railway Dashboard: **New Project**
2. Wähle: **GitHub Repo**
3. Suche: **Steam-Game-Libary**
4. Klicke **Deploy**

Railway liest automatisch deine `docker-compose.yml`! ✨

---

## Schritt 3: Environment Variables setzen

Im Railway Dashboard:

**Dein Projekt → Variables → Raw Editor**

Kopiere hier rein:

```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=steam_library
STEAM_API_KEY=your-steam-api-key-from-steamcommunity
JWT_SECRET=generate-mit-openssl-rand--hex-32
APP_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
REACT_APP_BACKEND_URL=https://yourdomain.com
```

**Speichern!**

---

## Schritt 4: Domain verbinden

### Option A: Railway Domain (kostenlos, aber lang)
- War automatisch gemacht
- Sieht aus wie: `steam-game-libary-production.up.railway.app`

### Option B: Deine eigene Domain (BESSER)

1. **Domain registrieren** bei:
   - Namecheap.com
   - GoDaddy.com
   - Bluehost.com
   - (Kosten: €5-15/Jahr)

2. **DNS einrichten:**
   - Domain → DNS Settings
   - Neue CNAME Einstellung:
     ```
     CNAME: yourdomain.com → yourrailway.up.railway.app
     ```

3. **In Railway ändern:**
   - Project → Settings → Domain
   - Deine Domain eintragen

---

## Schritt 5: MongoDB hinzufügen

Railway hat gratis **MongoDB Addon**:

1. Im Dashboard: **Add Service**
2. Wähle: **MongoDB**
3. Railway verbindet es automatisch zu `MONGO_URL`

---

## Schritt 6: SSL automatisch

Railway macht **HTTPS automatisch** kostenlos! 🔒

Deine URL wird automatisch:
- ❌ http://yourdomain.com
- ✅ https://yourdomain.com

---

## Schritt 7: Testen

Nach 2-3 Minuten sollte deine App live sein!

### Test 1: Backend
```bash
curl https://yourdomain.com/api/health
```

Sollte antworten:
```json
{"status":"ok","steam_key_configured":true}
```

### Test 2: Frontend
Öffne im Browser:
```
https://yourdomain.com
```

Sollte deine App anzeigen!

### Test 3: Steam Login
1. Klicke "Login with Steam"
2. Melde dich an
3. Profil sollte angezeigt werden

---

## 💰 Kosten

| Item | Kosten |
|------|--------|
| Railway Pro | €5-15/Mo |
| MongoDB (on Railway) | Kostenlos (sehr klein) |
| Domain (z.B. .com) | €5-15/Jahr |
| **GESAMT** | **€5-30/Mo** |

---

## 🆘 Häufige Fehler

### App startet nicht
→ Logs anschauen:
- Railway Dashboard → Project → Logs
- Scroll down für Fehler

### Steam Login funktioniert nicht
→ `APP_URL` ist falsch in Variables

### Games zeigen nicht
→ `STEAM_API_KEY` ist falsch
→ Oder MongoDB verbunden nicht

### Langsam oder zeitouts
→ Railway Dyno upgraden
- Project → Settings → Upgrade Plan

---

## 📊 Nach dem Deployment

### Logs überwachen
```
Railway → Logs → Filter für "error"
```

### Umgebung updaten
```bash
git push origin main
# Railway deployed automatisch!
```

### Datenbank Backup
```bash
# In Railway MongoDB → Backup
```

---

## ✅ Deployment Checklist

- [ ] GitHub Account & Repo
- [ ] Railway Account
- [ ] Projekt deployed ("up.railway.app" URL sichtbar)
- [ ] Variables gesetzt (alle 7)
- [ ] MongoDB hinzugefügt
- [ ] Domain verbunden (optional aber empfohlen)
- [ ] /api/health antwortet gut
- [ ] Frontend lädt ohne Fehler
- [ ] Steam Login funktioniert
- [ ] Game Search funktioniert

---

**Das wars! Deine App ist jetzt LIVE für die ganze Welt! 🎉**

Brauchst du Hilfe? → Schau die [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
