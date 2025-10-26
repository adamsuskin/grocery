# Zero Development Environment Setup

This guide explains how to set up and run the grocery list application with Zero for real-time sync.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and pnpm installed
- Zero Cache CLI (installed via npx)

## Getting Started

### 1. Start PostgreSQL

Start the PostgreSQL database using Docker Compose:

```bash
docker-compose up -d
```

This will start PostgreSQL 16 with:
- Database: `grocery_db`
- User: `grocery`
- Password: `grocery`
- Port: `5432`
- WAL level configured for logical replication (required by Zero)

To verify PostgreSQL is running:

```bash
docker-compose ps
```

To view PostgreSQL logs:

```bash
docker-compose logs -f postgres
```

To stop PostgreSQL:

```bash
docker-compose down
```

### 2. Start Zero Cache

Start the Zero Cache server in development mode:

```bash
npx zero-cache-dev
```

This will start the Zero Cache server on port `4848`. The server will:
- Connect to the PostgreSQL database specified in `ZERO_UPSTREAM_DB`
- Create a local replica file at `ZERO_REPLICA_FILE`
- Enable real-time sync between the database and connected clients

### 3. Start the Application

In a separate terminal, start the Vite development server:

```bash
pnpm dev
```

This will start the application on port `5173` (default Vite port).

## Port Configuration

The application uses the following ports:

- **5432**: PostgreSQL database
- **4848**: Zero Cache server
- **5173**: Vite development server

Make sure these ports are available before starting the services.

## Environment Variables

The application uses the following environment variables (configured in `.env`):

- `VITE_ZERO_SERVER`: URL of the Zero Cache server (default: `http://localhost:4848`)
- `ZERO_UPSTREAM_DB`: PostgreSQL connection string
- `ZERO_REPLICA_FILE`: Path to the local Zero replica file
- `ZERO_AUTH_SECRET`: Secret key for Zero authentication

See `.env.example` for the template configuration.

## Troubleshooting

### PostgreSQL connection issues

If you can't connect to PostgreSQL:
1. Check that the container is running: `docker-compose ps`
2. Check the logs: `docker-compose logs postgres`
3. Verify the port is not in use: `lsof -i :5432`

### Zero Cache connection issues

If Zero Cache fails to start:
1. Verify PostgreSQL is running and accessible
2. Check that the `ZERO_UPSTREAM_DB` connection string is correct
3. Ensure port 4848 is available

### Application not connecting to Zero

If the app can't connect to Zero Cache:
1. Verify Zero Cache is running on port 4848
2. Check the `VITE_ZERO_SERVER` environment variable
3. Check browser console for connection errors

## Stopping Everything

To stop all services:

1. Stop the Vite dev server: Press `Ctrl+C` in the terminal
2. Stop Zero Cache: Press `Ctrl+C` in the terminal
3. Stop PostgreSQL: `docker-compose down`

To completely remove PostgreSQL data:

```bash
docker-compose down -v
```

This will delete the `postgres-data` volume and all database contents.
