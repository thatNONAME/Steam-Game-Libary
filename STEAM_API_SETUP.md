# 🎮 Steam API Setup Guide

## Schritt 1: Steam Account vorbereiten

1. Gehe zu https://steamcommunity.com/
2. **Melde dich an** mit deinem Steam Account
3. Stelle sicher, dass dein Account **Level 2+** ist (ein Game gekauft)
   - Wenn nicht: Kaufe z.B. ein kostenloses Game

---

## Schritt 2: API Key anfordern

1. Gehe zu: https://steamcommunity.com/dev/apikey
2. Lese die **WebAPI ToS** und stimme zu
3. Im Feld "Domain Name" schreibe: **deine-domain.com**
4. Klicke **"Register"**

Du bekommst sofort deinen API Key! 

**Beispiel:**
```
ABCDEF0123456789ABCDEF0123456789
```

---

## Schritt 3: API Key speichern

### Lokal (Entwicklung):
```bash
# backend/.env
STEAM_API_KEY=ABCDEF0123456789ABCDEF0123456789
```

### Production (Railway/Render):
- Gehe zu deinem Projekt
- Environment Variables → Add
- Name: `STEAM_API_KEY`
- Value: Dein Key

---

## Schritt 4: Funktionen testen

### Test 1: Backend Health Check
```bash
curl https://yourdomain.com/api/health
```

Response sollte sein:
```json
{"status":"ok","steam_key_configured":true}
```

### Test 2: Steam Search
Gehe zu Browser:
```
https://yourdomain.com/api/steam/search?term=Portal
```

Sollte Steam Games zeigen!

### Test 3: Steam Login
1. Öffne https://yourdomain.com
2. Klicke "Login with Steam"
3. Du wirst zu Steam weitergeleitet
4. Nach Login: Dein Profil wird angezeigt

---

## 🛑 Häufige Probleme

### ❌ "steam_key_configured": false
→ STEAM_API_KEY ist nicht gesetzt oder falsch

**Lösung:**
```bash
# Prüfe .env
cat backend/.env | grep STEAM_API_KEY

# Muss etwas wie das hier zeigen:
STEAM_API_KEY=ABCDEF0123456789ABCDEF0123456789
```

### ❌ "Invalid API Key"
→ API Key ist ungültig

**Lösung:**
1. Gehe zu https://steamcommunity.com/dev/apikey
2. Kopiere den Key nochmal (korrekt)
3. Setze in `.env`

### ❌ Steam Login schlug fehl
→ Domain ist falsch in Environment

**Lösung:**
```bash
# In Railway/Render prüfen:
APP_URL=https://yourdomain.com  # Muss HTTPS sein!

# Später nach Login sollte umleiten zu:
https://yourdomain.com/auth/callback?token=...
```

### ❌ Games werden nicht angezeigt
→ API zu langsam oder Limit erreicht

**Lösung:**
- Versuche später nochmal
- Prüfe ob Profile ist public
- Warte 5 Sekunden und versuche nochmal

---

## ✅ Checkliste für Production

- [ ] Steam Account Level 2+ gemacht
- [ ] API Key von https://steamcommunity.com/dev/apikey geholt
- [ ] API Key in Railway/Render Environment gespeichert
- [ ] APP_URL auf deine Domain gesetzt
- [ ] Backend Health Check: steam_key_configured = true
- [ ] Steam Search funktioniert
- [ ] Steam Login funktioniert
- [ ] Profil wird angezeigt

---

## 📚 Weitere Ressourcen

- **Steam WebAPI Docs:** https://developer.steamgames.com/webapi
- **Steam ID Finder:** https://steamid.xyz/
- **Steam Community:** https://steamcommunity.com/

---

**Wenn alles funktioniert → Deine App ist live! 🎉**
