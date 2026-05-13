server {
    if ($host = rmm.talay.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name rmm.talay.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name rmm.talay.com;

    # Certbot Sertifika Yolları
    ssl_certificate /etc/letsencrypt/live/rmm.talay.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/rmm.talay.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Güncelleme sırasında 502/503/504 yerine bakım sayfası göster
    error_page 502 503 504 /maintenance.html;
    location = /maintenance.html {
        root /var/www/html;
        internal;
        add_header Cache-Control "no-cache, no-store";
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
