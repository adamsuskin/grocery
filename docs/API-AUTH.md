# Authentication API Documentation

This document provides comprehensive documentation for all authentication endpoints in the Grocery application.

## Table of Contents

- [Overview](#overview)
- [Authentication Flow](#authentication-flow)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [POST /api/auth/register](#post-apiauthregister)
  - [POST /api/auth/login](#post-apiauthlogin)
  - [POST /api/auth/refresh](#post-apiauthrefresh)
  - [POST /api/auth/logout](#post-apiauthlogout)
  - [GET /api/auth/me](#get-apiauthme)

---

## Overview

The authentication system uses JWT (JSON Web Tokens) with a dual-token approach:

- **Access Token**: Short-lived token (15 minutes) used for authenticating API requests
- **Refresh Token**: Long-lived token (7 days) used to obtain new access tokens

All protected endpoints require a valid access token in the Authorization header.

### Base URL

```
http://localhost:3001/api/auth
```

### Token Configuration

- **Access Token Expiry**: 15 minutes
- **Refresh Token Expiry**: 7 days
- **Algorithm**: HS256
- **Password Hashing**: bcrypt with 10 rounds

---

## Authentication Flow

1. **Registration/Login**: Client receives both access and refresh tokens
2. **API Requests**: Client includes access token in Authorization header
3. **Token Expiry**: When access token expires, use refresh token to get new tokens
4. **Logout**: Client deletes tokens from storage

### Authorization Header Format

```
Authorization: Bearer <access_token>
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

### Strict Limits (Registration & Login)
- **Window**: 15 minutes
- **Max Requests**: 5 per IP
- **Applies To**: `/register`, `/login`

### General Limits
- **Window**: 15 minutes
- **Max Requests**: 20 per IP
- **Applies To**: `/refresh`, `/logout`, other auth endpoints

### Rate Limit Response

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later."
}
```

---

## Error Handling

All endpoints return consistent error responses:

### Error Response Format

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {}
}
```

### Common Error Types

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| Validation error | 400 | Invalid or missing request data |
| Invalid credentials | 401 | Wrong email or password |
| Authentication required | 401 | Missing or invalid token |
| Authentication failed | 401 | Token verification failed |
| User not found | 404 | User does not exist |
| User already exists | 409 | Email already registered |
| Too many requests | 429 | Rate limit exceeded |
| Internal server error | 500 | Server-side error |

---

## Endpoints

## POST /api/auth/register

Register a new user account.

### URL
```
POST /api/auth/register
```

### Access
Public (no authentication required)

### Rate Limiting
5 requests per 15 minutes per IP

### Request Headers

```
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| email | string | Yes | Valid email format, unique |
| password | string | Yes | Min 8 chars, 1 uppercase, 1 lowercase, 1 number |
| name | string | Yes | Min 2 characters |

#### Example Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

### Success Response

**Status Code**: `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Email, password, and name are required"
}
```

#### 400 Bad Request - Invalid Email

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid email format"
}
```

#### 400 Bad Request - Weak Password

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Password must contain at least one uppercase letter"
}
```

#### 400 Bad Request - Short Name

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Name must be at least 2 characters long"
}
```

#### 409 Conflict - User Exists

```json
{
  "success": false,
  "error": "User already exists",
  "message": "An account with this email already exists"
}
```

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later."
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to register user"
}
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Example cURL Request

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

### Security Notes

- Passwords are hashed using bcrypt with 10 rounds
- Email addresses are stored in lowercase
- Names are trimmed of whitespace
- Strict rate limiting prevents brute force attacks

---

## POST /api/auth/login

Authenticate a user and receive JWT tokens.

### URL
```
POST /api/auth/login
```

### Access
Public (no authentication required)

### Rate Limiting
5 requests per 15 minutes per IP

### Request Headers

```
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

#### Example Request

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Email and password are required"
}
```

#### 401 Unauthorized - Invalid Credentials

```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Invalid email or password"
}
```

Note: The same error message is returned whether the email doesn't exist or the password is wrong. This prevents user enumeration attacks.

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later."
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to login"
}
```

### Example cURL Request

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Example JavaScript (Fetch)

```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});

const data = await response.json();

if (data.success) {
  // Store tokens securely
  localStorage.setItem('accessToken', data.data.accessToken);
  localStorage.setItem('refreshToken', data.data.refreshToken);
}
```

### Security Notes

- Generic error messages prevent user enumeration
- Rate limiting protects against brute force attacks
- Last login time is updated on successful authentication
- Passwords are never logged or returned in responses

---

## POST /api/auth/refresh

Refresh an expired access token using a valid refresh token.

### URL
```
POST /api/auth/refresh
```

### Access
Public (no authentication required, but requires valid refresh token)

### Rate Limiting
20 requests per 15 minutes per IP

### Request Headers

```
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token from login/register |

#### Example Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Success Response

**Status Code**: `200 OK`

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

Note: Both tokens are regenerated to implement token rotation for enhanced security.

### Error Responses

#### 400 Bad Request - Missing Token

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Refresh token is required"
}
```

#### 401 Unauthorized - Invalid Token

```json
{
  "success": false,
  "error": "Invalid refresh token",
  "message": "Invalid refresh token"
}
```

#### 401 Unauthorized - Expired Token

```json
{
  "success": false,
  "error": "Invalid refresh token",
  "message": "Refresh token expired"
}
```

#### 401 Unauthorized - User Not Found

```json
{
  "success": false,
  "error": "User not found",
  "message": "User associated with token does not exist"
}
```

This can occur if the user account was deleted after the token was issued.

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many requests. Please try again later."
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to refresh token"
}
```

### Example cURL Request

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Example JavaScript Implementation

```javascript
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    // Redirect to login
    window.location.href = '/login';
    return null;
  }

  try {
    const response = await fetch('http://localhost:3001/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (data.success) {
      // Update stored tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data.accessToken;
    } else {
      // Invalid refresh token, redirect to login
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

// Automatic token refresh on 401 errors
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('accessToken');

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });

  // If access token expired, refresh and retry
  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        }
      });
    }
  }

  return response;
}
```

### Security Notes

- Token rotation: Both tokens are regenerated on each refresh
- Old refresh tokens become invalid after use
- Expired refresh tokens cannot be used
- User must exist in database for token refresh to succeed

---

## POST /api/auth/logout

Logout the current user (client-side token deletion).

### URL
```
POST /api/auth/logout
```

### Access
Public (no authentication required)

### Rate Limiting
20 requests per 15 minutes per IP

### Request Headers

None required

### Request Body

No body required (empty object or no body)

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "message": "Please delete tokens from client storage"
  }
}
```

### Error Responses

#### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many requests. Please try again later."
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to logout"
}
```

### Example cURL Request

```bash
curl -X POST http://localhost:3001/api/auth/logout
```

### Example JavaScript Implementation

```javascript
async function logout() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (data.success) {
      // Clear tokens from storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Redirect to login page
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear tokens even if server request fails
    localStorage.clear();
  }
}
```

### Implementation Notes

This endpoint primarily serves as a convenience for the client. In a JWT-based authentication system:

- **Client-side**: Tokens are stored in browser storage (localStorage, sessionStorage, or cookies)
- **Server-side**: Tokens are stateless and not tracked (no session database)
- **Logout process**: Client deletes tokens from storage

#### Future Enhancements

In a production system, you may want to implement:

1. **Token Blacklisting**: Track revoked tokens in a database or cache (Redis)
2. **Refresh Token Table**: Store refresh tokens server-side for revocation
3. **Session Management**: Track active sessions per user
4. **Device Management**: Allow users to logout from specific devices

### Security Notes

- Tokens remain valid until expiry even after logout
- Client is responsible for secure token deletion
- Consider implementing token blacklisting for sensitive applications
- Clear all auth-related data from browser storage on logout

---

## GET /api/auth/me

Get the current authenticated user's information.

### URL
```
GET /api/auth/me
```

### Access
Private (requires authentication)

### Rate Limiting
None (standard Express default applies)

### Request Headers

```
Authorization: Bearer <access_token>
```

### Request Body

No body required

### Success Response

**Status Code**: `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T10:30:00.000Z"
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique user identifier |
| email | string | User's email address |
| name | string | User's display name |
| created_at | string (ISO 8601) | Account creation timestamp |

### Error Responses

#### 401 Unauthorized - No Token

```json
{
  "success": false,
  "error": "Authentication required",
  "message": "No token provided"
}
```

#### 401 Unauthorized - Invalid Token

```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid access token"
}
```

#### 401 Unauthorized - Expired Token

```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Access token expired"
}
```

#### 404 Not Found - User Deleted

```json
{
  "success": false,
  "error": "User not found",
  "message": "User does not exist"
}
```

This can occur if the user account was deleted but the token is still valid.

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to get user information"
}
```

### Example cURL Request

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example JavaScript Implementation

```javascript
async function getCurrentUser() {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('No access token found');
  }

  try {
    const response = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const data = await response.json();

    if (data.success) {
      return data.data.user;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to get current user:', error);
    throw error;
  }
}

// Usage
getCurrentUser()
  .then(user => {
    console.log('Current user:', user);
  })
  .catch(error => {
    console.error('Error:', error);
    // Redirect to login if token is invalid
    window.location.href = '/login';
  });
```

### Example React Hook

```javascript
import { useState, useEffect } from 'react';

function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        const data = await response.json();

        if (data.success) {
          setUser(data.data.user);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading, error };
}

// Usage in component
function UserProfile() {
  const { user, loading, error } = useCurrentUser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
    </div>
  );
}
```

### Use Cases

1. **User Profile Display**: Show user information in the UI
2. **Authentication Check**: Verify user is logged in
3. **Route Protection**: Validate access to protected pages
4. **User Context**: Populate application state with user data

### Security Notes

- Always include the Authorization header with Bearer token
- Token is verified on the server before returning user data
- Sensitive fields (password_hash) are never returned
- User data is fetched fresh from database (not from token payload)

---

## Additional Resources

### Token Payload Structure

Access and refresh tokens contain the following payload:

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "iat": 1698765432,
  "exp": 1698766332
}
```

| Field | Type | Description |
|-------|------|-------------|
| userId | string | User's unique identifier |
| email | string | User's email address |
| iat | number | Issued at timestamp (Unix) |
| exp | number | Expiration timestamp (Unix) |

### Best Practices

#### Token Storage

**Browser Applications:**
- Store tokens in `localStorage` or `sessionStorage`
- Consider using `HttpOnly` cookies for enhanced security
- Never store tokens in client-side JavaScript variables only

**Mobile Applications:**
- Use secure storage APIs (iOS Keychain, Android Keystore)
- Never store tokens in plain text files

#### Token Management

1. **Refresh Before Expiry**: Implement proactive token refresh before expiry
2. **Handle 401 Errors**: Automatically attempt token refresh on authentication failures
3. **Logout on Errors**: Clear tokens and redirect to login on refresh failures
4. **Secure Transmission**: Always use HTTPS in production

#### Security Considerations

1. **HTTPS Only**: Never transmit tokens over HTTP
2. **Token Rotation**: Implement refresh token rotation
3. **Short-Lived Access Tokens**: Keep access token lifetime short
4. **Secure Secrets**: Use strong, random JWT secrets in production
5. **Rate Limiting**: Respect rate limits to prevent account lockout

### Environment Variables

Required environment variables for authentication:

```env
# JWT Configuration
JWT_ACCESS_SECRET=your-secret-access-key-here
JWT_REFRESH_SECRET=your-secret-refresh-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Testing

Example test cases for authentication endpoints:

```javascript
describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject weak passwords', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject duplicate emails', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          name: 'Test User'
        });

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          name: 'Another User'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          name: 'Test User'
        });

      // Login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      // Register and get token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPass123',
          name: 'Test User'
        });

      const token = registerResponse.body.data.accessToken;

      // Get user info
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});
```

---

## Support

For issues or questions about the authentication API:

1. Check the error message and status code
2. Verify your token is valid and not expired
3. Ensure proper Authorization header format
4. Review rate limiting constraints
5. Check server logs for detailed error information

## Changelog

### Version 1.0.0
- Initial authentication API implementation
- JWT-based authentication with dual tokens
- Password strength validation
- Rate limiting on sensitive endpoints
- User registration and login
- Token refresh mechanism
- Current user endpoint
