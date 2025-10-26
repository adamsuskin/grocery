# Authentication API Documentation

A secure, production-ready authentication service for the Grocery List application built with Node.js, Express, TypeScript, PostgreSQL, and JWT.

## Features

- User registration with email/password
- Secure login with JWT token generation
- Token refresh mechanism
- Password hashing with bcrypt (12 salt rounds)
- JWT-based authentication middleware
- Rate limiting to prevent brute force attacks
- Input validation with express-validator
- Comprehensive error handling
- TypeScript for type safety
- PostgreSQL for data persistence
- CORS support for cross-origin requests
- Security headers and best practices

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Register New User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Validation error (invalid email, weak password, missing fields)
- `409` - User already exists
- `500` - Internal server error

---

#### 2. Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Invalid credentials
- `500` - Internal server error

---

#### 3. Refresh Token
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `400` - Validation error (missing refresh token)
- `401` - Invalid or expired refresh token
- `500` - Internal server error

---

#### 4. Logout
```
POST /api/auth/logout
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "message": "Please delete tokens from client storage"
  }
}
```

**Note:** In a JWT-based system, logout is primarily handled on the client side by deleting the stored tokens.

---

### Protected Endpoints (Authentication Required)

All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

#### 5. Get Current User
```
GET /api/auth/me
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Authentication required (missing or invalid token)
- `404` - User not found
- `500` - Internal server error

---

#### 6. Update Profile
```
PATCH /api/auth/profile
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "newemail@example.com"
}
```

**Note:** Both fields are optional. Provide only the fields you want to update.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newemail@example.com",
      "name": "Jane Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Authentication required
- `409` - Email already exists
- `500` - Internal server error

---

#### 7. Change Password
```
POST /api/auth/change-password
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Authentication required or current password incorrect
- `500` - Internal server error

---

#### 8. Health Check
```
GET /api/auth/health
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Auth service is healthy",
  "timestamp": "2025-10-26T00:00:00.000Z"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Registration/Login:** 5 requests per 15 minutes per IP
- **General Auth Operations:** 20 requests per 15 minutes per IP

When rate limit is exceeded, the API returns:
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later."
}
```

---

## Setup and Installation

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Important Environment Variables:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=grocery

# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Start PostgreSQL Database
```bash
pnpm db:up
```

### 4. Initialize Database Schema
```bash
pnpm db:init
```

Or manually run the schema:
```bash
psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
pnpm server:dev
```

**Production mode:**
```bash
# Build first
pnpm server:build

# Then start
pnpm server:start
```

**Start everything (database + zero-cache + auth server + frontend):**
```bash
pnpm dev:all
```

The server will be available at `http://localhost:3001`

---

## Project Structure

```
server/
├── auth/
│   ├── controller.ts      # Request handlers for auth endpoints
│   ├── middleware.ts      # JWT verification and auth middleware
│   ├── routes.ts          # Route definitions with validation
│   └── utils.ts           # JWT and password utilities
├── db/
│   ├── pool.ts            # PostgreSQL connection pool
│   └── schema.sql         # Database schema with users table
├── types/
│   └── index.ts           # TypeScript type definitions
├── index.ts               # Main Express server entry point
└── README.md              # This file
```

---

## Security Features

1. **Password Security**
   - Bcrypt hashing with 12 salt rounds
   - Password strength validation
   - Secure comparison to prevent timing attacks

2. **JWT Security**
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days)
   - Signed with HS256 algorithm
   - Token verification on all protected routes

3. **Rate Limiting**
   - IP-based rate limiting
   - Different limits for sensitive operations
   - Prevents brute force attacks

4. **Input Validation**
   - Express-validator for request validation
   - Email format validation
   - Password strength requirements
   - SQL injection prevention via parameterized queries

5. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection
   - Strict-Transport-Security

6. **CORS Configuration**
   - Configured allowed origins
   - Credentials support
   - Prevents unauthorized cross-origin requests

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` - Fast email lookups
- `idx_users_created_at` - Sorting by registration date

**Triggers:**
- Auto-update `updated_at` on user modifications

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {} // Optional, only in development
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required or failed)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Production Deployment Checklist

- [ ] Change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong, random values
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all connections
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Enable PostgreSQL SSL connections
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Implement token blacklisting for logout (optional)
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up rate limiting at proxy level
- [ ] Enable database connection pooling
- [ ] Review and adjust rate limits based on usage
- [ ] Implement email verification for registration
- [ ] Add password reset functionality
- [ ] Set up automated security scanning
- [ ] Configure firewall rules
- [ ] Enable database query logging for auditing
- [ ] Implement refresh token rotation
- [ ] Add two-factor authentication (2FA) support

---

## Common Issues and Troubleshooting

### Database Connection Failed
**Error:** `Database connection failed`
**Solution:**
- Ensure PostgreSQL is running: `pnpm db:up`
- Check credentials in `.env` match `docker-compose.yml`
- Verify database exists: `psql -h localhost -U grocery -d grocery_db -c "SELECT 1"`

### Token Verification Failed
**Error:** `Invalid token` or `Token expired`
**Solution:**
- Check token is being sent in Authorization header
- Ensure token format is `Bearer <token>`
- Verify JWT_SECRET matches between token generation and verification
- For expired tokens, use refresh token endpoint

### Rate Limit Exceeded
**Error:** `Too many requests`
**Solution:**
- Wait 15 minutes or adjust rate limits in `server/auth/routes.ts`
- In development, you can temporarily increase limits

### Port Already in Use
**Error:** `Port 3001 already in use`
**Solution:**
- Change PORT in `.env`
- Or kill process using port: `lsof -ti:3001 | xargs kill -9`

---

## Development Tips

1. **Hot Reload:** Changes to server files automatically reload with nodemon
2. **Type Safety:** TypeScript catches errors at compile time
3. **Testing:** Use tools like Postman, Insomnia, or cURL for API testing
4. **Debugging:** Check console logs for detailed error information
5. **Database:** Use pgAdmin or psql for database inspection

---

## Future Enhancements

- [ ] Email verification on registration
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] OAuth integration (Google, GitHub)
- [ ] Account deletion
- [ ] Session management UI
- [ ] Audit logging
- [ ] Token blacklisting/revocation
- [ ] Account lockout after failed attempts
- [ ] Email change verification
- [ ] User roles and permissions
- [ ] API versioning

---

## License

MIT

---

## Support

For issues or questions, please open an issue in the repository.
