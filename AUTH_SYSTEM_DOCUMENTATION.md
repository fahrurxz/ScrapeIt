# 🔐 ScrapeIt Authentication System

Sistem autentikasi JWT telah berhasil diimplementasikan untuk extension ScrapeIt. Berikut adalah dokumentasi lengkap untuk penggunaan dan testing.

## 📋 Fitur yang Diimplementasikan

### ✅ Komponen Utama

1. **AuthManager Class** (`modules/authManager.js`)
   - Mengelola token JWT di chrome.storage.local
   - Verifikasi token dengan server authentication
   - UI popup untuk input token
   - Blocking extension jika tidak authenticated

2. **Integration dengan Content Script** (`content.js`)
   - Check authentication saat initialization
   - Block semua fungsi jika tidak authenticated
   - Callback system untuk menjalankan extension setelah auth berhasil

3. **Test System** (`test_auth_system.js`)
   - Testing lengkap untuk semua komponen authentication
   - Manual testing tools di browser console

### ✅ Alur Kerja Authentication

1. **Extension Load**
   ```
   Extension dimuat → AuthManager.init() → Check chrome.storage.local
   ```

2. **Token Ada & Valid**
   ```
   Get token → Verify dengan server → Status 200 → Extension berjalan normal
   ```

3. **Token Tidak Ada**
   ```
   No token → Show popup input → User input token → Save to storage → Verify → Extension berjalan
   ```

4. **Token Tidak Valid**
   ```
   Invalid token → Remove dari storage → Show popup input → User input token baru
   ```

5. **Auth Gagal**
   ```
   Auth failed → Block extension → Show alert → Extension tidak bisa digunakan
   ```

## 🚀 Cara Penggunaan

### 1. Setup Server Authentication Endpoint

Extension akan mengirim POST request ke:
```
https://yourserver.com/api/verify-token
```

**Request Format:**
```json
{
  "token": "jwt-token-here",
  "extension": "ScrapeIt",
  "version": "1.0"
}
```

**Response:**
- `Status 200`: Token valid
- `Status 401/403`: Token tidak valid

### 2. Update Server URL (Opsional)

Jika server authentication berada di URL lain, update di `authManager.js`:

```javascript
// Di constructor AuthManager
this.authServerUrl = 'https://your-auth-server.com/api/verify-token';
```

### 3. Install Extension

1. Buka Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Pilih folder `ScrapeIt`
5. Extension akan auto-load dengan authentication

### 4. Penggunaan Pertama Kali

1. **Buka halaman Shopee** (misal: https://shopee.co.id/search?keyword=tas)
2. **Popup token akan muncul** otomatis jika belum ada token
3. **Input JWT token** yang valid
4. **Click "Verifikasi"**
5. **Extension akan aktif** jika token valid

## 🧪 Testing Authentication

### Manual Testing di Browser Console

1. **Buka Developer Tools** (F12)
2. **Buka Console tab**
3. **Load test script:**
   ```javascript
   // Inject test script manually
   const script = document.createElement('script');
   script.src = chrome.runtime.getURL('test_auth_system.js');
   document.head.appendChild(script);
   ```

4. **Run comprehensive tests:**
   ```javascript
   // Test semua komponen
   window.testAuth.runAll()
   
   // Test individual components
   window.testAuth.tokenInput()      // Test popup input
   window.testAuth.authStatus()      // Check current auth status
   window.testAuth.tokenStorage()    // Test storage operations
   ```

### Debugging Authentication

1. **Check console logs:**
   ```
   🔐 Checking authentication...
   ✅ Authentication successful, initializing extension...
   ✅ Token saved and authenticated
   ```

2. **Check extension status:**
   ```javascript
   window.authManager.getAuthStatus()
   // Returns: { isAuthenticated: true, hasToken: true }
   ```

3. **Check if extension is blocked:**
   ```javascript
   console.log('Extension blocked:', window.EXTENSION_BLOCKED)
   ```

## 🔧 Konfigurasi Lanjutan

### Custom Authentication Logic

Untuk menambah validasi tambahan, edit method `verifyTokenWithServer`:

```javascript
async verifyTokenWithServer(token) {
  try {
    const response = await fetch(this.authServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Extension-ID': 'ScrapeIt',  // Custom header
        'X-User-Agent': navigator.userAgent
      },
      body: JSON.stringify({
        token: token,
        extension: 'ScrapeIt',
        version: '1.0',
        timestamp: Date.now(),  // Tambahan validasi
        domain: window.location.hostname
      })
    });

    // Custom validation logic
    if (response.status === 200) {
      const result = await response.json();
      return result.valid === true;  // Server harus return { valid: true }
    }
    
    return false;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}
```

### Logout Functionality

```javascript
// Manual logout
window.authManager.logout()

// Atau tambahkan tombol logout di UI
```

### Auto-refresh Token

```javascript
// Tambahkan di AuthManager constructor
this.tokenRefreshInterval = setInterval(() => {
  this.checkAuthentication();
}, 30 * 60 * 1000); // Check setiap 30 menit
```

## 🛡️ Security Features

### ✅ Implemented

- ✅ JWT token disimpan di chrome.storage.local (encrypted by Chrome)
- ✅ Token dikirim via HTTPS dengan Authorization header
- ✅ Extension fully blocked jika tidak authenticated
- ✅ Token validation dengan server real-time
- ✅ Secure popup input dengan password field
- ✅ Auto-cleanup token jika tidak valid

### 🔐 Best Practices

1. **Server-side validation** harus implement:
   - JWT signature verification
   - Token expiration check
   - User permission validation
   - Rate limiting

2. **Client-side security**:
   - Token tersimpan secure di chrome.storage
   - No token exposure di console logs
   - HTTPS only communication

## 📝 Troubleshooting

### Problem: Popup tidak muncul
```javascript
// Check manual
window.authManager.showTokenInputPopup()
```

### Problem: Token tidak tersimpan
```javascript
// Check storage permissions di manifest.json
// Test manual storage
chrome.storage.local.set({test: 'value'}, () => console.log('Storage OK'))
```

### Problem: Server tidak bisa diakses
```javascript
// Check CORS headers di server
// Check host_permissions di manifest.json
```

### Problem: Extension masih jalan tanpa token
```javascript
// Check if auth integration proper
console.log('Extension blocked:', window.EXTENSION_BLOCKED)
console.log('Auth status:', window.authManager.getAuthStatus())
```

## 🎯 Summary

Sistem authentication JWT sudah fully implemented dengan:
- ✅ Automatic token management
- ✅ Secure storage di chrome.storage.local  
- ✅ Real-time server verification
- ✅ User-friendly popup input
- ✅ Complete extension blocking jika unauthorized
- ✅ Comprehensive testing tools
- ✅ Production-ready security

Extension ScrapeIt sekarang sepenuhnya protected dengan JWT authentication dan siap untuk production deployment.
