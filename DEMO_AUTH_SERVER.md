# 🚀 Demo Auth Server untuk ScrapeIt Extension

File `demo_auth_server.js` adalah contoh implementasi server authentication yang bisa digunakan untuk testing extension ScrapeIt dengan sistem JWT authentication.

## 📋 Cara Menjalankan Demo Server

### 1. Install Dependencies

```bash
npm install express jsonwebtoken cors
```

### 2. Jalankan Server

```bash
node demo_auth_server.js
```

Atau menggunakan npm script:
```bash
npm run start-auth-server
```

Server akan berjalan di `http://localhost:3000`

### 3. Update URL di Extension

Edit file `modules/authManager.js`, ubah URL server:

```javascript
// Ganti dari:
this.authServerUrl = 'https://yourserver.com/api/verify-token';

// Menjadi:
this.authServerUrl = 'http://localhost:3000/api/verify-token';
```

## 🔑 Demo Credentials

Server demo memiliki 2 user yang bisa digunakan:

| Username | Password | Permissions |
|----------|----------|-------------|
| `admin`  | `demo123` | `scrapeIt.use`, `scrapeIt.admin` |
| `user1`  | `demo123` | `scrapeIt.use` |

## 📡 Available Endpoints

### 1. Login dan Generate Token
```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "demo123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@yourcompany.com",
    "permissions": ["scrapeIt.use", "scrapeIt.admin"]
  },
  "expiresIn": "24h"
}
```

### 2. Verify Token (Used by Extension)
```http
POST /api/verify-token
Content-Type: application/json
Authorization: Bearer <token>

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "extension": "ScrapeIt",
  "version": "1.0"
}
```

**Response (Success):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@yourcompany.com",
    "permissions": ["scrapeIt.use", "scrapeIt.admin"]
  },
  "extension": "ScrapeIt",
  "version": "1.0",
  "verifiedAt": "2025-07-11T10:30:00.000Z"
}
```

### 3. Health Check
```http
GET /api/health
```

## 🧪 Testing Flow

### 1. Generate Token via cURL

```bash
# Login dan dapatkan token
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "demo123"
  }'
```

### 2. Test Token Verification

```bash
# Verify token
curl -X POST http://localhost:3000/api/verify-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "extension": "ScrapeIt",
    "version": "1.0"
  }'
```

### 3. Test dengan Extension

1. **Start demo server:** `node demo_auth_server.js`
2. **Update authManager.js** dengan localhost URL
3. **Load extension** di Chrome
4. **Buka Shopee page**
5. **Input token** dari login response
6. **Extension akan verified** dengan demo server

## 🔧 Customization

### Menambah User Baru

Edit array `authorizedUsers` di `demo_auth_server.js`:

```javascript
const authorizedUsers = [
  // ...existing users...
  {
    id: 3,
    username: 'newuser',
    email: 'newuser@company.com',
    permissions: ['scrapeIt.use']
  }
];
```

### Mengubah JWT Secret

```bash
# Set environment variable
export JWT_SECRET="your-super-secret-production-key"

# Atau edit langsung di file
const JWT_SECRET = 'your-new-secret-key';
```

### Custom Token Expiration

```javascript
// Di function generateToken, ubah exp claim
exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
```

## 🛡️ Production Considerations

⚠️ **Untuk production environment, pastikan:**

1. **Use HTTPS only**
2. **Strong JWT secret** dari environment variable
3. **Real database** untuk user management
4. **Password hashing** dengan bcrypt/argon2
5. **Rate limiting** untuk login attempts
6. **Token blacklisting** untuk logout
7. **CORS** configuration yang proper
8. **Input validation** dan sanitization
9. **Logging** untuk security monitoring
10. **Error handling** yang tidak expose sensitive info

## 🔍 Debugging

### Server Logs

Server akan log semua verification attempts:
```
✅ Token verified for user: admin (admin@yourcompany.com) - Extension: ScrapeIt v1.0
```

### Extension Console

Check browser console untuk debugging:
```javascript
// Check auth status
window.authManager.getAuthStatus()

// Manual verification test
window.authManager.verifyTokenWithServer('your-token-here')
```

Demo server ini memberikan foundation yang solid untuk testing dan development sistem authentication ScrapeIt extension.
