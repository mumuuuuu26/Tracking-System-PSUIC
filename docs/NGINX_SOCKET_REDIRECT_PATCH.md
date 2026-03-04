# Nginx Patch: Redirect `/socket.io` -> `/app/socket.io`

Purpose:
- Prevent legacy clients from calling `https://cmdt-uic.psu.ac.th/socket.io/...` and getting `404`.
- Force requests into the app namespace under `/app`.

## Apply (admin with sudo)

```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak.$(date +%Y%m%d%H%M%S)
sudo nano /etc/nginx/sites-available/default
```

Inside the main `server { ... }`, add this block **before generic location handlers**:

```nginx
location /socket.io/ {
    return 301 /app/socket.io/$is_args$args;
}
```

Validate and reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Verify

```bash
curl -i 'https://cmdt-uic.psu.ac.th/socket.io/?EIO=4&transport=polling' | head -n 20
curl -i 'https://cmdt-uic.psu.ac.th/app/socket.io/?EIO=4&transport=polling' | head -n 20
```

Expected:
- First command: `301` redirect to `/app/socket.io/...`
- Second command: `200` with Socket.IO handshake payload
