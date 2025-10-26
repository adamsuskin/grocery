# Deployment Architecture - Grocery List App

This document describes the production deployment architecture, including service topology, network flow, and system design.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Service Topology](#service-topology)
4. [Network Architecture](#network-architecture)
5. [Port Mappings](#port-mappings)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)
8. [Scalability Considerations](#scalability-considerations)
9. [High Availability Setup](#high-availability-setup)
10. [Disaster Recovery](#disaster-recovery)

---

## Architecture Overview

The Grocery List application follows a modern, layered architecture with the following characteristics:

- **Frontend**: React SPA with PWA capabilities
- **Backend**: Node.js/Express REST API with JWT authentication
- **Real-Time**: Zero-cache for collaborative sync
- **Database**: PostgreSQL with logical replication
- **Reverse Proxy**: Nginx for SSL termination and load balancing
- **Deployment**: Docker containers or systemd services

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + TypeScript | User interface |
| Build Tool | Vite | Fast builds and HMR |
| PWA | Service Workers + Workbox | Offline support |
| API Server | Express + TypeScript | REST API endpoints |
| Auth | JWT | Stateless authentication |
| Real-Time | Zero-cache | Collaborative sync |
| Database | PostgreSQL 16 | Persistent data storage |
| Reverse Proxy | Nginx | SSL termination, routing |
| SSL | Let's Encrypt | HTTPS certificates |
| Containerization | Docker + Docker Compose | Service orchestration |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET / USERS                                │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               │ HTTPS (443)
                               │
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                          DNS LAYER                                           │
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  yourdomain.com  │  │ www.yourdomain   │  │ api.yourdomain   │         │
│  │   (A Record)     │  │   (A Record)     │  │  (CNAME)         │         │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘         │
└───────────┼────────────────────┬┼────────────────────┬┼───────────────────┘
            │                    ││                    ││
            └────────────────────┴┼────────────────────┘│
                                  │                     │
┌─────────────────────────────────▼─────────────────────▼─────────────────────┐
│                        SERVER (Ubuntu 22.04 LTS)                             │
│                          IP: YOUR_SERVER_IP                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    NGINX REVERSE PROXY                                 │ │
│  │                   (SSL Termination & Routing)                          │ │
│  │                         Port: 80, 443                                  │ │
│  │                                                                        │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │ │
│  │  │   Main Domain    │  │    WWW Domain    │  │   API Domain     │   │ │
│  │  │  Static Files    │  │  Static Files    │  │  API + Zero      │   │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │ │
│  └───────────┼────────────────────┬┼────────────────────┬┼─────────────┘ │
│              │                    ││                    ││                 │
│              │  Serves            ││  Reverse           ││  Reverse        │
│              │  Static Files      ││  Proxy             ││  Proxy          │
│              │                    ││                    ││                 │
│  ┌───────────▼────────────────────▼▼────────────────────▼▼──────────────┐ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │  │                    FRONTEND LAYER                             │    │ │
│  │  │                                                               │    │ │
│  │  │  ┌────────────────────────────────────────────────────────┐  │    │ │
│  │  │  │         Static Files (nginx or Docker)                 │  │    │ │
│  │  │  │         - HTML, CSS, JavaScript, Assets                │  │    │ │
│  │  │  │         - Service Worker (sw.js)                       │  │    │ │
│  │  │  │         - PWA Manifest                                 │  │    │ │
│  │  │  │         Port: 3000 (internal)                          │  │    │ │
│  │  │  └────────────────────────────────────────────────────────┘  │    │ │
│  │  └──────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │  │                    BACKEND LAYER                              │    │ │
│  │  │                                                               │    │ │
│  │  │  ┌───────────────────────────┐  ┌────────────────────────┐  │    │ │
│  │  │  │   Auth/API Server         │  │   Zero-cache Server    │  │    │ │
│  │  │  │   (Express + TypeScript)  │  │   (Real-time Sync)     │  │    │ │
│  │  │  │                           │  │                        │  │    │ │
│  │  │  │   - REST API              │  │   - WebSocket          │  │    │ │
│  │  │  │   - JWT Auth              │  │   - Replication        │  │    │ │
│  │  │  │   - User Management       │  │   - Local Cache        │  │    │ │
│  │  │  │   - List Management       │  │   - Conflict Resolve   │  │    │ │
│  │  │  │   - Permission Control    │  │                        │  │    │ │
│  │  │  │                           │  │                        │  │    │ │
│  │  │  │   Port: 3001 (internal)   │  │   Port: 4848 (int.)    │  │    │ │
│  │  │  └───────────┬───────────────┘  └────────┬───────────────┘  │    │ │
│  │  └──────────────┼──────────────────────────┬┼──────────────────┘    │ │
│  │                 │                          ││                        │ │
│  │                 │ Database Queries         ││ Logical Replication   │ │
│  │                 │                          ││                        │ │
│  │  ┌──────────────▼──────────────────────────▼▼──────────────────┐    │ │
│  │  │                    DATABASE LAYER                            │    │ │
│  │  │                                                               │    │ │
│  │  │  ┌────────────────────────────────────────────────────────┐  │    │ │
│  │  │  │              PostgreSQL 16                             │  │    │ │
│  │  │  │                                                        │  │    │ │
│  │  │  │  - Primary Database                                   │  │    │ │
│  │  │  │  - Logical Replication (for Zero)                     │  │    │ │
│  │  │  │  - Tables: users, lists, grocery_items, etc.          │  │    │ │
│  │  │  │  - Indexes for performance                            │  │    │ │
│  │  │  │                                                        │  │    │ │
│  │  │  │  Port: 5432 (internal only)                           │  │    │ │
│  │  │  └────────────────────────────────────────────────────────┘  │    │ │
│  │  └──────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │  │                    STORAGE LAYER                              │    │ │
│  │  │                                                               │    │ │
│  │  │  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │    │ │
│  │  │  │  PostgreSQL    │  │   Zero Replica  │  │   Backups    │  │    │ │
│  │  │  │  Data Volume   │  │   Database      │  │   Directory  │  │    │ │
│  │  │  │  (Persistent)  │  │   (Persistent)  │  │              │  │    │ │
│  │  │  └────────────────┘  └─────────────────┘  └──────────────┘  │    │ │
│  │  └──────────────────────────────────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────────────┐
                         │    EXTERNAL SERVICES     │
                         │                          │
                         │  - Let's Encrypt (SSL)   │
                         │  - DNS Provider          │
                         │  - Monitoring Services   │
                         │  - Backup Storage (S3)   │
                         └──────────────────────────┘
```

---

## Service Topology

### Service Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Service Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Edge Layer                                           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Nginx (Reverse Proxy)                               │      │
│  │  - SSL Termination                                   │      │
│  │  - Request Routing                                   │      │
│  │  - Static File Serving                               │      │
│  │  - Load Balancing (if multiple backends)             │      │
│  │  - Compression (gzip)                                │      │
│  │  - Security Headers                                  │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ▼                                     │
│  Layer 2: Application Layer                                    │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Auth/API Server (Port 3001)                         │      │
│  │  - Express Application                               │      │
│  │  - REST API Endpoints                                │      │
│  │  - JWT Authentication                                │      │
│  │  - Request Validation                                │      │
│  │  - Business Logic                                    │      │
│  │  - Permission Enforcement                            │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ▼                                     │
│  Layer 3: Real-Time Layer                                      │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Zero-cache Server (Port 4848)                       │      │
│  │  - WebSocket Server                                  │      │
│  │  - Database Replication Consumer                     │      │
│  │  - Local SQLite Cache                                │      │
│  │  - Conflict Resolution                               │      │
│  │  - Real-time Sync                                    │      │
│  └──────────────────────────────────────────────────────┘      │
│                           ▼                                     │
│  Layer 4: Data Layer                                           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  PostgreSQL (Port 5432)                              │      │
│  │  - Primary Data Store                                │      │
│  │  - Logical Replication Publisher                     │      │
│  │  - ACID Transactions                                 │      │
│  │  - Constraints & Validation                          │      │
│  │  - Indexes for Performance                           │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Docker Compose Service Map

When deployed with Docker:

```yaml
Services:
  ├── postgres
  │   ├── Image: postgres:16
  │   ├── Port: 5432 (internal)
  │   ├── Volume: postgres-data
  │   ├── Health Check: pg_isready
  │   └── Depends: None (base service)
  │
  ├── auth-server
  │   ├── Build: Dockerfile.server
  │   ├── Port: 3001 (internal)
  │   ├── Health Check: /health endpoint
  │   ├── Depends: postgres (healthy)
  │   └── Connects: postgres
  │
  ├── zero-cache
  │   ├── Image: rocicorp/zero-cache
  │   ├── Port: 4848 (internal)
  │   ├── Volume: zero-data
  │   ├── Health Check: /health endpoint
  │   ├── Depends: postgres (healthy)
  │   └── Connects: postgres (logical replication)
  │
  └── frontend
      ├── Build: Dockerfile.frontend
      ├── Port: 3000 (internal)
      ├── Health Check: nginx health
      ├── Depends: auth-server, zero-cache
      └── Connects: auth-server (proxied), zero-cache (proxied)

Volumes:
  ├── postgres-data (persistent database)
  └── zero-data (persistent replica)

Networks:
  └── grocery-network (bridge, 172.20.0.0/16)
```

### Systemd Service Map

When deployed with systemd:

```
Services:
  ├── postgresql.service (system)
  │   └── Data: /var/lib/postgresql/16/main
  │
  ├── nginx.service (system)
  │   ├── Config: /etc/nginx/sites-available/grocery
  │   └── Logs: /var/log/nginx/
  │
  ├── grocery-auth.service (custom)
  │   ├── User: grocery
  │   ├── WorkDir: /home/grocery/grocery
  │   ├── ExecStart: node dist/server/index.js
  │   ├── Depends: postgresql.service
  │   └── Logs: journalctl -u grocery-auth
  │
  └── grocery-zero.service (custom)
      ├── User: grocery
      ├── WorkDir: /home/grocery/grocery
      ├── ExecStart: npx zero-cache
      ├── Depends: postgresql.service
      └── Logs: journalctl -u grocery-zero
```

---

## Network Architecture

### External Network Flow

```
┌──────────────┐
│    Client    │ (Web Browser / Mobile App)
│  (Any IP)    │
└──────┬───────┘
       │
       │ HTTPS Request
       │ DNS Resolution: yourdomain.com → YOUR_SERVER_IP
       │
       ▼
┌─────────────────────────────────────────────┐
│              Firewall (UFW)                 │
│  Allow: 22 (SSH), 80 (HTTP), 443 (HTTPS)   │
│  Deny: All other ports                      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Nginx (Port 443)                    │
│  - SSL Termination (Let's Encrypt)          │
│  - Host-based Routing                       │
│    • yourdomain.com → Static files          │
│    • api.yourdomain.com → Backend           │
└──────┬────────────────────┬─────────────────┘
       │                    │
       │ Static Files       │ API Requests
       │                    │
       ▼                    ▼
┌──────────────┐   ┌──────────────────────────┐
│   Frontend   │   │    Auth Server           │
│  Static Dir  │   │    Port: 3001            │
│              │   │    HTTP (internal)       │
└──────────────┘   └───────┬──────────────────┘
                           │
                           │ Database Queries
                           │
                           ▼
                   ┌──────────────────────────┐
                   │    PostgreSQL            │
                   │    Port: 5432            │
                   │    (localhost only)      │
                   └──────────────────────────┘
```

### Internal Network Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Internal Services                       │
│                  (Docker Bridge Network)                   │
│                     172.20.0.0/16                         │
│                                                            │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │ Auth Server  │◄────►│  PostgreSQL  │                  │
│  │  3001        │      │    5432      │                  │
│  │              │      │              │                  │
│  └──────────────┘      └──────┬───────┘                  │
│                               │                           │
│                               │ Logical Replication       │
│                               │ (WAL streaming)           │
│  ┌──────────────┐             │                           │
│  │  Zero-cache  │◄────────────┘                           │
│  │    4848      │                                         │
│  │              │                                         │
│  └──────────────┘                                         │
│                                                            │
└────────────────────────────────────────────────────────────┘

All services can communicate via service names (Docker DNS)
External access only through Nginx reverse proxy
```

---

## Port Mappings

### External Ports (Public)

| Port | Protocol | Service | Description |
|------|----------|---------|-------------|
| 22   | TCP      | SSH     | Secure shell access (admin only) |
| 80   | TCP      | HTTP    | Redirects to HTTPS |
| 443  | TCP      | HTTPS   | All web traffic (SSL) |

### Internal Ports (Server-only)

| Port | Protocol | Service      | Exposed To | Description |
|------|----------|--------------|------------|-------------|
| 3000 | TCP      | Frontend     | Nginx      | Static files (if separate container) |
| 3001 | TCP      | Auth Server  | Nginx      | REST API endpoints |
| 4848 | TCP      | Zero-cache   | Nginx      | WebSocket real-time sync |
| 5432 | TCP      | PostgreSQL   | Auth, Zero | Database connections |

### Docker Port Mapping

```yaml
Docker Host → Container Mappings:

postgres:
  - "5432:5432"  # Optional, for direct access (not recommended in production)
  - Better: No external port, use Docker network

auth-server:
  - "3001:3001"  # Internal only, accessed via Nginx

zero-cache:
  - "4848:4848"  # Internal only, accessed via Nginx

frontend:
  - "3000:3000"  # Internal only, accessed via Nginx

Production: All services on internal network only
Nginx: Only service with external ports (80, 443)
```

### Nginx Proxy Mapping

```nginx
Client Request → Nginx → Backend Service

https://yourdomain.com/
  → nginx serves /usr/share/nginx/html/index.html
  → or /home/grocery/grocery/dist/index.html

https://yourdomain.com/assets/*
  → nginx serves static files with cache headers

https://api.yourdomain.com/api/auth/*
  → proxy_pass http://localhost:3001/api/auth/*
  → or http://auth-server:3001/api/auth/* (Docker)

https://api.yourdomain.com/zero
  → proxy_pass http://localhost:4848
  → or http://zero-cache:4848 (Docker)
  → WebSocket upgrade enabled
```

---

## Data Flow

### User Registration Flow

```
┌──────────┐                ┌───────────┐              ┌──────────┐
│  Client  │                │   Nginx   │              │ Auth API │
│ (Browser)│                │  (Proxy)  │              │  Server  │
└────┬─────┘                └─────┬─────┘              └────┬─────┘
     │                            │                         │
     │  POST /api/auth/register   │                         │
     │ {email, password, name}    │                         │
     ├───────────────────────────►│                         │
     │                            │  Forward request        │
     │                            ├────────────────────────►│
     │                            │                         │
     │                            │                         │  Validate input
     │                            │                         │  Hash password
     │                            │                         │  ─────────┐
     │                            │                         │           │
     │                            │                         │◄──────────┘
     │                            │                         │
     │                            │                         │  INSERT user
     │                            │                         ├──────────┐
     │                            │                         │          │
     │                            │                         │          ▼
     │                            │                    ┌────┴──────────────┐
     │                            │                    │    PostgreSQL     │
     │                            │                    │   users table     │
     │                            │                    └────┬──────────────┘
     │                            │                         │
     │                            │                         │  User created
     │                            │                         │◄─────────────
     │                            │                         │
     │                            │                         │  Generate JWT
     │                            │                         │  ─────────┐
     │                            │                         │           │
     │                            │                         │◄──────────┘
     │                            │  Return tokens          │
     │                            │◄────────────────────────┤
     │  200 OK                    │                         │
     │ {accessToken, refreshToken}│                         │
     │◄───────────────────────────┤                         │
     │                            │                         │
     │  Store tokens              │                         │
     │  ───────┐                  │                         │
     │         │                  │                         │
     │◄────────┘                  │                         │
     │                            │                         │
```

### Adding Item with Real-Time Sync Flow

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Client A │  │   Nginx  │  │ Auth API │  │PostgreSQL│  │Zero-cache│
│(Device 1)│  │  (Proxy) │  │  Server  │  │          │  │          │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │             │             │
     │  POST /api/lists/:id/items │             │             │
     │  {name, quantity, ...}     │             │             │
     ├────────────►│              │             │             │
     │             │  Proxy       │             │             │
     │             ├─────────────►│             │             │
     │             │              │  Verify JWT │             │
     │             │              │  Check perm │             │
     │             │              │             │             │
     │             │              │  INSERT item│             │
     │             │              ├────────────►│             │
     │             │              │             │             │
     │             │              │             │  Write WAL  │
     │             │              │             │  ─────────┐ │
     │             │              │             │           │ │
     │             │              │             │◄──────────┘ │
     │             │              │  Item saved │             │
     │             │              │◄────────────┤             │
     │             │  200 OK      │             │             │
     │             │  {item}      │             │   Logical   │
     │◄────────────┤◄─────────────┤             │ Replication │
     │             │              │             ├────────────►│
     │             │              │             │   (WAL)     │
     │             │              │             │             │
     │             │              │             │             │  Process WAL
     │             │              │             │             │  Update cache
     │             │              │             │             │  ─────────┐
     │             │              │             │             │           │
     │             │              │             │             │◄──────────┘
     │             │              │             │             │
     │  WebSocket: New item event │             │             │
     │◄────────────────────────────────────────────────────────┤
     │             │              │             │             │
     │  Update UI  │              │             │             │
     │  ─────────┐ │              │             │             │
     │           │ │              │             │             │
     │◄──────────┘ │              │             │             │
     │             │              │             │             │

┌──────────┐                                   ┌──────────┐  │
│ Client B │ (Another device/user)             │Zero-cache│  │
│(Device 2)│                                   │          │  │
└────┬─────┘                                   └────┬─────┘  │
     │                                              │        │
     │  WebSocket: New item event                  │        │
     │◄─────────────────────────────────────────────┤        │
     │                                              │        │
     │  Update UI (sees new item in real-time)     │        │
     │  ─────────┐                                 │        │
     │           │                                 │        │
     │◄──────────┘                                 │        │
     │                                              │        │
```

### Offline to Online Sync Flow

```
┌──────────┐              ┌──────────┐              ┌──────────┐
│  Client  │              │Zero-cache│              │PostgreSQL│
│ (Offline)│              │  Server  │              │          │
└────┬─────┘              └────┬─────┘              └────┬─────┘
     │                         │                         │
     │  Add item (offline)     │                         │
     │  ───────┐               │                         │
     │         │               │                         │
     │◄────────┘               │                         │
     │  Store in IndexedDB     │                         │
     │  Queue for sync         │                         │
     │                         │                         │
     │  Network disconnected   │                         │
     │  ─────────────┐         │                         │
     │               │         │                         │
     │◄──────────────┘         │                         │
     │                         │                         │
     │  Edit item (offline)    │                         │
     │  ───────┐               │                         │
     │         │               │                         │
     │◄────────┘               │                         │
     │  Update IndexedDB       │                         │
     │  Queue for sync         │                         │
     │                         │                         │
     ▼                         │                         │
   (Time passes...)            │                         │
     │                         │                         │
     │  Network reconnected    │                         │
     │  ─────────────┐         │                         │
     │               │         │                         │
     │◄──────────────┘         │                         │
     │                         │                         │
     │  Service Worker:        │                         │
     │  Background Sync        │                         │
     │  ─────────┐             │                         │
     │           │             │                         │
     │◄──────────┘             │                         │
     │                         │                         │
     │  Sync queued changes    │                         │
     ├────────────────────────►│                         │
     │                         │  Process mutations      │
     │                         │  ─────────┐             │
     │                         │           │             │
     │                         │◄──────────┘             │
     │                         │                         │
     │                         │  Write to database      │
     │                         ├────────────────────────►│
     │                         │                         │
     │                         │  Committed              │
     │                         │◄────────────────────────┤
     │  Sync complete          │                         │
     │◄────────────────────────┤                         │
     │                         │                         │
     │  Clear IndexedDB queue  │                         │
     │  ─────────┐             │                         │
     │           │             │                         │
     │◄──────────┘             │                         │
     │                         │                         │
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layer 1: Network                    │
│  - Firewall (UFW): Only 22, 80, 443 open                       │
│  - Fail2ban: Brute-force protection                             │
│  - DDoS Protection (optional): Cloudflare, AWS Shield           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    Security Layer 2: Transport                  │
│  - SSL/TLS 1.2+ only                                            │
│  - Strong cipher suites                                         │
│  - HSTS enabled                                                 │
│  - Certificate from Let's Encrypt                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    Security Layer 3: Application                │
│  - CORS restrictions                                            │
│  - Rate limiting                                                │
│  - Input validation                                             │
│  - SQL injection prevention (parameterized queries)             │
│  - XSS prevention (React escaping + CSP)                        │
│  - Security headers                                             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    Security Layer 4: Authentication             │
│  - JWT-based authentication                                     │
│  - Access tokens (short-lived: 15m)                             │
│  - Refresh tokens (longer-lived: 7d)                            │
│  - Token rotation                                               │
│  - bcrypt password hashing (12 rounds)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    Security Layer 5: Authorization              │
│  - Role-based access control (Owner, Editor, Viewer)            │
│  - Permission enforcement at API level                          │
│  - Row-level security considerations                            │
│  - List membership validation                                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                    Security Layer 6: Data                       │
│  - Database credentials secured                                 │
│  - Database not exposed to internet                             │
│  - Environment variables file permissions (600)                 │
│  - Secrets rotation policy                                      │
│  - Encrypted backups (optional)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User Login                                                  │
│     Client sends: {email, password}                             │
│     ─────────────────────────────────────────┐                 │
│                                               ▼                 │
│  2. Password Verification                                       │
│     Server: bcrypt.compare(password, hash)                      │
│     ─────────────────────────────────────────┐                 │
│                                               ▼                 │
│  3. Token Generation                                            │
│     accessToken = jwt.sign({userId}, secret, {expiresIn: 15m}) │
│     refreshToken = jwt.sign({userId}, secret, {expiresIn: 7d}) │
│     ─────────────────────────────────────────┐                 │
│                                               ▼                 │
│  4. Store Refresh Token                                         │
│     INSERT INTO refresh_tokens (user_id, token_hash, ...)      │
│     ─────────────────────────────────────────┐                 │
│                                               ▼                 │
│  5. Return Tokens to Client                                     │
│     Response: {accessToken, refreshToken, user}                 │
│     ─────────────────────────────────────────┐                 │
│                                               ▼                 │
│  6. Client Stores Tokens                                        │
│     localStorage or secure cookie                               │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Subsequent Requests:                                           │
│     Headers: {Authorization: "Bearer <accessToken>"}            │
│     Server validates JWT signature and expiration               │
│     Extracts userId from token payload                          │
│     Attaches userId to request object                           │
│                                                                 │
│  Token Refresh (when accessToken expires):                      │
│     Client sends refreshToken                                   │
│     Server validates refreshToken                               │
│     Issues new accessToken                                      │
│     Optionally rotates refreshToken                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Vertical Scaling

```
Current Setup (Single Server):
  - 2 CPU cores
  - 4GB RAM
  - 40GB SSD

Scaling Up:
  - 4+ CPU cores
  - 8-16GB RAM
  - 100GB+ SSD
  - Better network bandwidth

Benefits:
  - Simpler to manage
  - No architectural changes
  - Good for small to medium traffic

Limitations:
  - Single point of failure
  - Hardware ceiling
  - Downtime for upgrades
```

### Horizontal Scaling (Future)

```
┌───────────────────────────────────────────────────────────────┐
│                    Load Balancer                              │
│                  (Nginx / HAProxy)                            │
└────┬──────────────┬──────────────┬──────────────┬─────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Server1 │    │ Server2 │    │ Server3 │    │ ServerN │
│         │    │         │    │         │    │         │
│ Auth    │    │ Auth    │    │ Auth    │    │ Auth    │
│ Zero    │    │ Zero    │    │ Zero    │    │ Zero    │
└───┬─────┘    └───┬─────┘    └───┬─────┘    └───┬─────┘
    │              │              │              │
    └──────────────┴──────────────┴──────────────┘
                   │
                   ▼
          ┌─────────────────┐
          │   PostgreSQL    │
          │   (Primary)     │
          └────────┬────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │ Replica1 │      │ Replica2 │
    │(Read-only)      │(Read-only)
    └──────────┘      └──────────┘

Benefits:
  - High availability
  - Better performance
  - No single point of failure

Considerations:
  - Session management (sticky sessions or shared store)
  - Database replication setup
  - Shared file storage (if needed)
  - More complex deployment
```

### Database Scaling

```
Read Replicas:
  ┌──────────────┐
  │   Primary    │  (Writes)
  │  PostgreSQL  │
  └──────┬───────┘
         │ Streaming Replication
         ├───────────┬───────────┐
         ▼           ▼           ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │Replica1│  │Replica2│  │Replica3│  (Reads)
    └────────┘  └────────┘  └────────┘

Connection Pooling:
  - PgBouncer in front of PostgreSQL
  - Efficient connection reuse
  - Reduced connection overhead

Caching Layer:
  - Redis for session storage
  - Redis for frequently accessed data
  - Reduce database load
```

### Content Delivery

```
Current: Static files served by Nginx
Scaled:
  ┌─────────────────────────────────────────┐
  │              CDN (CloudFront)           │
  │  - Distribute static assets globally    │
  │  - Cache at edge locations              │
  │  - Reduce origin server load            │
  └────────────────┬────────────────────────┘
                   │ Origin requests
                   ▼
          ┌─────────────────┐
          │  Origin Server  │
          │   (Your App)    │
          └─────────────────┘

Benefits:
  - Faster load times globally
  - Reduced bandwidth costs
  - Better DDoS protection
```

---

## High Availability Setup

### Basic HA Configuration

```
┌────────────────────────────────────────────────────────────────┐
│                    Load Balancer (Primary)                     │
│                         (Active)                               │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          │ Heartbeat
                          │
┌─────────────────────────▼──────────────────────────────────────┐
│                  Load Balancer (Secondary)                     │
│                       (Standby)                                │
└────────────────────────────────────────────────────────────────┘

                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  App Server │   │  App Server │   │  App Server │
│     #1      │   │     #2      │   │     #3      │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │   PostgreSQL       │
              │   (Primary)        │
              └──────────┬─────────┘
                         │ Streaming Replication
                         │
              ┌──────────▼─────────┐
              │   PostgreSQL       │
              │   (Standby)        │
              │   + Auto-failover  │
              └────────────────────┘
```

### Failover Strategy

```
Component Failure Handling:

1. App Server Failure:
   - Load balancer health check detects
   - Traffic routed to healthy servers
   - Failed server automatically removed
   - No user impact

2. Database Primary Failure:
   - Streaming replication standby promoted
   - Connection strings updated (automatic with pgpool)
   - Minimal downtime (30-60 seconds)

3. Load Balancer Failure:
   - Secondary takes over via VRRP
   - Floating IP moves to secondary
   - Near-instant failover

4. Zero-cache Failure:
   - Clients automatically reconnect
   - Local IndexedDB cache maintains functionality
   - Sync resumes when service restored
```

---

## Disaster Recovery

### Backup Strategy

```
Backup Tiers:

Tier 1: Local Backups (Daily)
  - Location: Same server (/home/grocery/backups)
  - Retention: 7 days
  - Purpose: Quick recovery from human error
  - RPO: 24 hours
  - RTO: 15 minutes

Tier 2: Off-Site Backups (Daily)
  - Location: S3 or similar cloud storage
  - Retention: 30 days
  - Purpose: Disaster recovery
  - RPO: 24 hours
  - RTO: 1-2 hours

Tier 3: Archive Backups (Monthly)
  - Location: Glacier or tape
  - Retention: 1 year+
  - Purpose: Compliance, long-term recovery
  - RPO: 30 days
  - RTO: 24 hours

Backup Components:
  1. PostgreSQL database dump
  2. Zero replica database
  3. Environment configuration
  4. Application code (git tag)
  5. User-uploaded files (if any)
```

### Recovery Procedures

```
Scenario 1: Database Corruption
  1. Stop services
  2. Restore database from latest backup
  3. Verify data integrity
  4. Start services
  5. Monitor logs

Scenario 2: Complete Server Loss
  1. Provision new server
  2. Install dependencies
  3. Restore from off-site backup
  4. Update DNS (if IP changed)
  5. Verify functionality
  6. Monitor closely

Scenario 3: Partial Data Loss (last few hours)
  1. Identify affected data range
  2. Restore to separate database
  3. Export missing data
  4. Import to production
  5. Verify with users
```

### Business Continuity

```
RTO (Recovery Time Objective): 4 hours
  - Maximum acceptable downtime

RPO (Recovery Point Objective): 24 hours
  - Maximum acceptable data loss

Disaster Recovery Plan:
  1. Maintain up-to-date documentation
  2. Test recovery procedures quarterly
  3. Keep backup of environment configs
  4. Document all custom configurations
  5. Maintain emergency contact list
  6. Regular backup verification
```

---

## Monitoring and Observability

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Application                            │
│  - Custom metrics via /metrics endpoint                     │
│  - Structured logging (JSON)                                │
│  - Error tracking                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Metrics & Logs
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Prometheus                               │
│  - Metrics collection                                       │
│  - Time-series database                                     │
│  - Alerting rules                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Query & Visualize
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                     Grafana                                 │
│  - Dashboards                                               │
│  - Visualizations                                           │
│  - Alert management                                         │
└─────────────────────────────────────────────────────────────┘

External Services:
  - UptimeRobot (uptime monitoring)
  - Sentry (error tracking)
  - LogRocket (session replay)
```

### Key Metrics to Monitor

```
System Metrics:
  - CPU usage (%)
  - Memory usage (%)
  - Disk usage (%)
  - Network I/O
  - Disk I/O

Application Metrics:
  - Request rate (req/sec)
  - Response time (p50, p95, p99)
  - Error rate (%)
  - Active users
  - WebSocket connections

Database Metrics:
  - Connection count
  - Query time
  - Slow query count
  - Replication lag
  - Cache hit ratio

Business Metrics:
  - User registrations
  - Active lists
  - Items created
  - Shares created
  - Real-time sync events
```

---

## Summary

This architecture provides:

1. **Scalability**: Can handle growing user base with vertical or horizontal scaling
2. **Reliability**: Multiple layers of redundancy and failover
3. **Security**: Defense-in-depth approach with multiple security layers
4. **Performance**: Optimized for fast response times and real-time updates
5. **Maintainability**: Clear separation of concerns and well-documented components
6. **Observability**: Comprehensive monitoring and logging for troubleshooting

For production deployments, refer to:
- **DEPLOYMENT_GUIDE.md** for step-by-step deployment instructions
- **PRODUCTION_CHECKLIST.md** for comprehensive deployment checklists
- **README.md** for application features and development setup
