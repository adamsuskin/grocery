# Quick Start - Production Deployment

This guide will get your Grocery application running in production in under 15 minutes.

## Prerequisites

- Linux server with Docker and Docker Compose installed
- Domain name pointing to your server
- Ports 80 and 443 open

## Step 1: Clone Repository

```bash
git clone <repository-url> /opt/grocery
cd /opt/grocery
```

## Step 2: Configure Environment

```bash
# Copy the environment template
cp .env.prod.template .env.prod

# Generate secrets
JWT_ACCESS=$(openssl rand -base64 32)
JWT_REFRESH=$(openssl rand -base64 32)
ZERO_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32)

# Edit .env.prod
nano .env.prod
```

**Required changes in .env.prod:**
```bash
DOMAIN=your-domain.com
CERTBOT_EMAIL=your-email@example.com
DB_PASSWORD=<paste-generated-password>
JWT_ACCESS_SECRET=<paste-generated-secret>
JWT_REFRESH_SECRET=<paste-generated-secret>
ZERO_AUTH_SECRET=<paste-generated-secret>
CORS_ORIGIN=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
VITE_ZERO_SERVER=wss://your-domain.com/zero
```

## Step 3: Set Permissions

```bash
chmod 600 .env.prod
chmod +x deploy.sh
```

## Step 4: Start Services

```bash
# Start base services first
./deploy.sh start --ssl
```

Wait for all services to be healthy (about 30 seconds).

## Step 5: Obtain SSL Certificate

```bash
./deploy.sh ssl-cert --ssl
```

This will:
- Contact Let's Encrypt
- Verify domain ownership
- Install SSL certificate
- Restart nginx

## Step 6: Verify Deployment

```bash
# Check all services are healthy
./deploy.sh health --ssl

# View logs
./deploy.sh logs --ssl | tail -50

# Test the application
curl https://your-domain.com/health
```

Open your browser and navigate to `https://your-domain.com`

## Step 7: Create First Backup

```bash
./deploy.sh backup-db
```

## Done!

Your application is now running in production with:
- ✅ SSL/TLS encryption
- ✅ Automatic certificate renewal
- ✅ All services containerized
- ✅ Health monitoring
- ✅ Resource limits
- ✅ Security hardening

## Next Steps

1. Set up automated backups (add to cron)
2. Configure monitoring
3. Review logs regularly
4. Test all features
5. Run SSL Labs test: https://www.ssllabs.com/ssltest/

## Common Commands

```bash
# View logs
./deploy.sh logs -f --ssl

# Restart all services
./deploy.sh restart --ssl

# Stop all services
./deploy.sh stop

# Backup database
./deploy.sh backup-db

# Update application
./deploy.sh update --ssl

# Check health
./deploy.sh health --ssl
```

## Troubleshooting

### Services won't start
```bash
# Check logs
./deploy.sh logs --ssl

# Check service status
./deploy.sh status
```

### SSL certificate fails
- Verify domain DNS is pointing to server
- Check ports 80 and 443 are open
- Wait for DNS propagation (24-48 hours)

### Can't connect to database
```bash
# Check database logs
docker logs grocery-postgres-prod

# Restart database
docker restart grocery-postgres-prod
```

### Need help?
- Check [SSL_DEPLOYMENT.md](./SSL_DEPLOYMENT.md) for detailed SSL setup
- Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for complete checklist
- Check [DOCKER_DEPLOYMENT_SUMMARY.md](./DOCKER_DEPLOYMENT_SUMMARY.md) for architecture details

## Security Reminders

- Never commit .env.prod to version control
- Use strong, unique passwords for all secrets
- Keep Docker and system packages updated
- Enable firewall and fail2ban
- Regularly backup your database
- Monitor logs for suspicious activity

## Support

For issues or questions:
1. Check the logs: `./deploy.sh logs --ssl`
2. Review documentation in this repository
3. Check Docker and nginx documentation
