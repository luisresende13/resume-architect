# Resume Architect - Subdomain Hosting Guide

This document provides step-by-step instructions for deploying the Resume Architect React application to `resume.octacity.org` using a subdomain approach.

## Why Subdomain Hosting?

Subdomain hosting is the **recommended approach** for React applications because:

- ✅ **No path conflicts** - Assets load from root paths (`/assets/`) without issues
- ✅ **Simple nginx config** - Uses standard `root` directive, no complex `alias` rules
- ✅ **Clean URLs** - `resume.octacity.org` instead of `octacity.org/resume-architect`
- ✅ **Independent SSL** - Separate certificate management
- ✅ **Easy maintenance** - Standard deployment patterns

## Infrastructure Overview

- **Server**: Google Cloud VM (`cpd-niteroi-proxy`)
- **Web Server**: Nginx (managed via systemd)
- **Subdomain**: resume.octacity.org
- **SSL**: Let's Encrypt certificates (automatic renewal)
- **Static Files Location**: `/var/www/resume.octacity.org/`

## Prerequisites

- Access to the Google Cloud VM via `gcloud compute ssh`
- Built React application in the `dist/` folder
- Nginx configuration access
- Certbot installed for SSL certificates

## Deployment Steps

### 1. Build the Application

```bash
# In the project root directory
pnpm build
# or
npm run build
# or
yarn build
```

This creates the production build in the `dist/` folder.

### 2. Upload Files to VM

```bash
# Copy the built files to the VM
gcloud compute scp --recurse ./dist cpd-niteroi-proxy:/tmp/resume-architect-dist
```

### 3. Deploy Files to Subdomain Directory

```bash
# Remove existing directory to ensure a clean deployment
gcloud compute ssh cpd-niteroi-proxy --command="sudo rm -rf /var/www/resume.octacity.org"

# Create a new, empty subdomain directory
gcloud compute ssh cpd-niteroi-proxy --command="sudo mkdir -p /var/www/resume.octacity.org"

# Copy files to subdomain location
gcloud compute ssh cpd-niteroi-proxy --command="sudo cp -r /tmp/resume-architect-dist/* /var/www/resume.octacity.org/"

# Set proper permissions
gcloud compute ssh cpd-niteroi-proxy --command="sudo chown -R www-data:www-data /var/www/resume.octacity.org"

# Clean up temporary files
gcloud compute ssh cpd-niteroi-proxy --command="sudo rm -rf /tmp/resume-architect-dist"
```

### 4. Create Nginx Configuration

Create `/etc/nginx/sites-available/resume.octacity.org`:

```nginx
server {
    server_name resume.octacity.org;
    root /var/www/resume.octacity.org;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    listen 80;
}
```

**Enable the site:**
```bash
gcloud compute ssh cpd-niteroi-proxy --command="sudo ln -sf /etc/nginx/sites-available/resume.octacity.org /etc/nginx/sites-enabled/"
```

### 5. Test and Reload Nginx

```bash
# Test nginx configuration
gcloud compute ssh cpd-niteroi-proxy --command="sudo nginx -t"

# Reload nginx if configuration is valid
gcloud compute ssh cpd-niteroi-proxy --command="sudo systemctl reload nginx"
```

### 6. Enable SSL Certificate

```bash
# Request SSL certificate for subdomain
gcloud compute ssh cpd-niteroi-proxy --command="sudo certbot --nginx -d resume.octacity.org --non-interactive --agree-tos --email admin@octacity.org"
```

Certbot will automatically:
- Request the SSL certificate
- Update the nginx configuration
- Set up automatic renewal

### 7. Verify Deployment

Visit `https://resume.octacity.org` to confirm the application is working correctly.

## Supabase Configuration

### Required Supabase Settings Update

**IMPORTANT**: Before deploying to production, you must update your Supabase project settings:

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **URL Configuration**

2. **Update Site URL**
   - Change from: `http://localhost:3000` (or your dev URL)
   - Change to: `https://resume.octacity.org`

### Why This Is Required

- **Authentication Flow**: Supabase needs to know which domains are allowed for authentication
- **OAuth Providers**: Google/LinkedIn OAuth requires registered redirect URLs

### Verification Steps

After updating Supabase settings:

1. **Test Authentication**: Try logging in at `https://resume.octacity.org`
2. **Test OAuth**: Verify Google/LinkedIn login works
3. **Test Password Reset**: Ensure email links work correctly
4. **Check Console**: Look for any CORS or authentication errors

## Environment Variables

The application uses the following environment variables (configured during build):

- `GEMINI_API_KEY` - Google Gemini API key
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

These are embedded in the build during the `vite build` process.

## File Structure After Deployment

```
/var/www/resume.octacity.org/
├── index.html          # Main HTML file
├── assets/
│   ├── index-*.js      # Bundled JavaScript files
│   └── *.css           # Bundled CSS files
└── favicon.svg         # Favicon
```

## Nginx Configuration Details

### Key Configuration Elements

1. **Server Block**: Dedicated server block for `resume.octacity.org`
2. **Root Directive**: Points to `/var/www/resume.octacity.org`
3. **Try Files**: Handles React Router (SPA) routing
4. **Asset Caching**: Optimizes static asset delivery
5. **SSL**: Automatic HTTPS with Let's Encrypt

### Final Configuration (After Certbot)

Certbot automatically updates the configuration to include SSL:

```nginx
server {
    server_name resume.octacity.org;
    root /var/www/resume.octacity.org;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/resume.octacity.org/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/resume.octacity.org/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = resume.octacity.org) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name resume.octacity.org;
    return 404; # managed by Certbot
}
```

## Troubleshooting

### Common Issues

1. **404 Errors**: Check file permissions and nginx configuration
2. **SSL Issues**: Verify certificate is valid and nginx is reloaded
3. **Asset Loading**: Ensure assets are in the correct directory

### Useful Commands

```bash
# Check nginx status
gcloud compute ssh cpd-niteroi-proxy --command="sudo systemctl status nginx"

# View nginx error logs
gcloud compute ssh cpd-niteroi-proxy --command="sudo tail -f /var/log/nginx/error.log"

# Check file permissions
gcloud compute ssh cpd-niteroi-proxy --command="ls -la /var/www/resume.octacity.org/"

# Test nginx configuration
gcloud compute ssh cpd-niteroi-proxy --command="sudo nginx -t"

# Check SSL certificate
gcloud compute ssh cpd-niteroi-proxy --command="sudo certbot certificates"
```

## Updates and Maintenance

### Updating the Application

1. Make changes to the code
2. Run `pnpm build` to create new build
3. Follow steps 2-3 above to deploy the update
4. Test the updated application

### Monitoring

- Check nginx access logs: `/var/log/nginx/access.log`
- Monitor application performance via browser dev tools
- SSL certificate renewal is automatic via Certbot

## DNS Configuration

Ensure your DNS provider has an A record pointing `resume.octacity.org` to your server's IP address:

```
Type: A
Name: resume
Value: [YOUR_SERVER_IP]
TTL: 300 (or default)
```

## Security Considerations

- Files served with proper permissions (`www-data:www-data`)
- SSL/TLS encryption enabled
- Static files only - no server-side code execution
- API keys embedded in build (ensure build environment is secure)
- Automatic SSL certificate renewal

## Advantages of This Approach

1. **Simplicity**: Standard nginx configuration patterns
2. **Reliability**: No complex path resolution issues
3. **Performance**: Optimized asset caching
4. **Security**: Independent SSL certificate management
5. **Scalability**: Easy to add more subdomains
6. **Maintenance**: Standard deployment procedures

---

**Last Updated**: October 2024  
**Application Version**: 0.0.0  
**Build Tool**: Vite 6.2.0  
**Hosting Method**: Subdomain with Nginx + Let's Encrypt SSL
