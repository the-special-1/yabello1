# Automated Deployment Setup

This guide explains how to set up automated deployments for both the client and server components using GitHub Actions.

## Prerequisites

1. Your code is hosted on GitHub
2. You have SSH access to your Ubuntu server
3. You have a user with appropriate permissions on the server

## Setup Steps

### 1. Add GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `HOST`: Your server IP address or domain (e.g., `123.456.789.0` or `example.com`)
   - `USERNAME`: SSH username for your server
   - `SSH_PRIVATE_KEY`: Your private SSH key (the content of your `id_rsa` file)

To generate an SSH key (if you don't have one):
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

Then add the public key to your server's `~/.ssh/authorized_keys` file.

### 2. Update the Workflow File

Edit the `.github/workflows/deploy.yml` file to update the following:

1. Change the branch name if needed (currently set to `main`)
2. Update the Node.js version if needed
3. Update these paths in the workflow file:
   - `/path/to/your/nginx/html/directory` → Your actual Nginx web root directory
   - `/path/to/your/server/directory` → Your actual server directory
   - `your-app-name` → Your PM2 application name

### 3. Server Setup

Make sure your server has the following:

1. **PM2** installed globally:
   ```bash
   npm install -g pm2
   ```

2. **Nginx** configured to serve your React app and proxy API requests:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # React app
       location / {
           root /path/to/your/nginx/html/directory;
           try_files $uri $uri/ /index.html;
       }

       # API proxy
       location /api/ {
           proxy_pass http://localhost:5001/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **PM2** configured to run your Node.js server:
   ```bash
   cd /path/to/your/server/directory
   pm2 start server.js --name your-app-name
   pm2 save
   ```

## How It Works

When you push changes to your main branch:

1. GitHub Actions will automatically:
   - Build your React app
   - Deploy the built files to your Nginx directory
   - Deploy your server files to your server directory
   - Restart your Node.js server using PM2

2. Your changes will be live on your production server without manual intervention.

## Troubleshooting

If deployments fail, check:

1. GitHub Actions logs for error messages
2. Server logs:
   - Nginx logs: `/var/log/nginx/error.log`
   - PM2 logs: `pm2 logs your-app-name`

## Manual Deployment (if needed)

If you need to deploy manually:

### Client:
```bash
cd client
npm run build
scp -r build/* username@your-server:/path/to/your/nginx/html/directory/
```

### Server:
```bash
scp -r server/* username@your-server:/path/to/your/server/directory/
ssh username@your-server "cd /path/to/your/server/directory && npm ci --production && pm2 restart your-app-name"
```
