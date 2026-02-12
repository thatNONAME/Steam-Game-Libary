# 🚀 Deployment-Anleitung für Private Domain

Dieses Projekt wurde von Emergent.sh-Abhängigkeiten befreit und kann jetzt auf jeder beliebigen Domain gehostet werden.

## ✅ Was wurde geändert

1. ❌ **Entfernt**: `emergentintegrations` Package aus requirements.txt
2. ❌ **Entfernt**: Emergent.sh Scripts aus index.html
3. ❌ **Entfernt**: Emergent.sh Branding/Badge
4. ✅ **Angepasst**: CORS-Konfiguration für deine Domain
5. ✅ **Angepasst**: Umgebungsvariablen

---

## 🏗️ Schritt-für-Schritt Deployment

### 1️⃣ Server vorbereiten (Linux/Ubuntu)

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js & npm installieren (für Frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.10+ installieren
sudo apt install -y python3.10 python3.10-venv python3-pip

# Git installieren
sudo apt install -y git

# MongoDB installieren (oder verwende MongoDB Atlas Cloud)
sudo apt install -y mongodb

# Nginx installieren (für Reverse Proxy)
sudo apt install -y nginx
```

### 2️⃣ Projekt klonen und Setup

```bash
# Projekt klonen
git clone https://github.com/dein-username/Steam-Game-LibaryRepo.git your-domain
cd your-domain

# Backend vorbereiten
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Backend .env erstellen
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=steam_library
STEAM_API_KEY=dein-steam-api-key-hier
JWT_SECRET=generate-mit-openssl-rand--hex-32
APP_URL=https://deine-domain.com
CORS_ORIGINS=https://deine-domain.com,https://www.deine-domain.com
EOF

# Steam API Key generieren von: https://steamcommunity.com/dev/apikey

# Frontend vorbereiten
cd ../frontend
npm install
npm run build
```

### 3️⃣ Nginx als Reverse Proxy konfigurieren

Erstelle `/etc/nginx/sites-available/steam-library`:

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    listen [::]:80;
    server_name deine-domain.com www.deine-domain.com;

    # Weiterleitung zu HTTPS (nach SSL Setup)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name deine-domain.com www.deine-domain.com;

    # SSL Zertifikate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/deine-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deine-domain.com/privkey.pem;

    # SSL Sicherheitsoptionen
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root für Frontend
    root /home/ubuntu/steam-library/frontend/build;
    index index.html;

    # API Requests zum Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket Support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Fallback auf index.html für React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Aktiviere die Konfiguration:
```bash
sudo ln -s /etc/nginx/sites-available/steam-library /etc/nginx/sites-enabled/
sudo nginx -t  # Test
sudo systemctl restart nginx
```

### 4️⃣ Backend mit Systemd starten

Erstelle `/etc/systemd/system/steam-library-backend.service`:

```ini
[Unit]
Description=Steam Library Backend
After=network.target

[Service]
Type=notify
User=ubuntu
WorkingDirectory=/home/ubuntu/steam-library/backend
Environment="PATH=/home/ubuntu/steam-library/backend/venv/bin"
ExecStart=/home/ubuntu/steam-library/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Starten:
```bash
sudo systemctl enable steam-library-backend.service
sudo systemctl start steam-library-backend.service
```

### 5️⃣ SSL-Zertifikat mit Let's Encrypt

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# Zertifikat ausstellen
sudo certbot certonly --nginx -d deine-domain.com -d www.deine-domain.com

# Auto-Renewal aktivieren
sudo systemctl enable certbot.timer
```

### 6️⃣ MongoDB Setup (lokal oder Cloud)

**Lokal:**
```bash
sudo systemctl enable mongodb
sudo systemctl start mongodb
```

**Oder MongoDB Atlas Cloud (empfohlen):**
1. Registriere dich auf https://www.mongodb.com/cloud/atlas
2. Erstelle einen Cluster
3. Generiere Connection String
4. Setze `MONGO_URL` in `.env`

---

## 🌍 Umgebungsvariablen (.env)

```
# MongoDB
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=steam_library

# Steam API
STEAM_API_KEY=your-steam-api-key

# JWT Secret (generiert: openssl rand -hex 32)
JWT_SECRET=your-random-jwt-secret

# Deine Domain
APP_URL=https://deine-domain.com
CORS_ORIGINS=https://deine-domain.com,https://www.deine-domain.com
```

---

## 🧪 Test nach Deployment

```bash
# Backend Health Check
curl https://deine-domain.com/api/health

# Frontend laden
curl https://deine-domain.com
```

---

## 🆘 Troubleshooting

**Logs prüfen:**
```bash
# Backend Logs
sudo journalctl -u steam-library-backend.service -f

# Nginx Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

**MongoDB Verbindung testen:**
```bash
mongostat --uri "$MONGO_URL"
```

---

## 📦 Hosting-Optionen (kostenlos/günstig)

| Provider | Kosten | Notizen |
|----------|--------|---------|
| **Render** | ~$7/mo | Einfach, automati deployment |
| **Railway** | ~$5/mo | Gutes UI, einfache Skalierung |
| **DigitalOcean** | ~$5/mo | VPS, volle Kontrolle |
| **Hetzner** | ~€3/mo | Europäisch, sehr günstig |
| **AWS EC2** | $5-20/mo | Free tier verfügbar |
| **Linode** | $5/mo | Zuverlässig |

Empfehlung für Anfänger: **Railway** oder **Render** (Push to Deploy)

---

## 🔐 Sicherheit

✅ SSL/TLS aktiviert  
✅ CORS eingeschränkt auf deine Domain  
✅ Firewall richtig konfiguriert  
✅ Regelmäßige Backups von MongoDB  
✅ JWT Token mit geheimem Schlüssel  

---

## 📞 Support

Fragen? Schau dir folgende Ressourcen an:
- [FastAPI Dokumentation](https://fastapi.tiangolo.com/)
- [React Dokumentation](https://react.dev)
- [MongoDB Dokumentation](https://docs.mongodb.com/)
- [Nginx Dokumentation](https://nginx.org/en/docs/)
