// Demo Auth Server untuk ScrapeIt Extension
// Ini adalah contoh implementasi server authentication endpoint

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['https://shopee.co.id', 'chrome-extension://*'],
  credentials: true
}));

// Secret key untuk JWT (gunakan environment variable di production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';

// Database simulasi untuk user yang authorized
const authorizedUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@yourcompany.com',
    permissions: ['scrapeIt.use', 'scrapeIt.admin']
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@yourcompany.com',
    permissions: ['scrapeIt.use']
  }
];

// Helper function untuk generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

// Endpoint untuk login dan generate token
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simulasi validasi user (di production, check database dan hash password)
  const user = authorizedUsers.find(u => u.username === username);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
  
  // Di production, validate password hash
  if (password !== 'demo123') {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
  
  const token = generateToken(user);
  
  res.json({
    success: true,
    token: token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      permissions: user.permissions
    },
    expiresIn: '24h'
  });
});

// Main endpoint untuk verify token dari extension
app.post('/api/verify-token', (req, res) => {
  try {
    const { token, extension, version } = req.body;
    const authHeader = req.headers.authorization;
    
    // Get token dari body atau Authorization header
    let tokenToVerify = token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokenToVerify = authHeader.substring(7);
    }
    
    if (!tokenToVerify) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(tokenToVerify, JWT_SECRET);
    
    // Check if user still exists and has permissions
    const user = authorizedUsers.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or deactivated'
      });
    }
    
    // Check specific permission untuk ScrapeIt extension
    if (extension === 'ScrapeIt' && !user.permissions.includes('scrapeIt.use')) {
      return res.status(403).json({
        success: false,
        message: 'User does not have permission to use ScrapeIt extension'
      });
    }
    
    // Log successful verification
    console.log(`✅ Token verified for user: ${user.username} (${user.email}) - Extension: ${extension} v${version}`);
    
    // Return success dengan user info
    res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        permissions: user.permissions
      },
      extension: extension,
      version: version,
      verifiedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
});

// Endpoint untuk refresh token
app.post('/api/refresh-token', (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify existing token (meski expired)
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    
    // Check if user still exists
    const user = authorizedUsers.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate new token
    const newToken = generateToken(user);
    
    res.json({
      success: true,
      token: newToken,
      expiresIn: '24h'
    });
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
});

// Endpoint untuk revoke token / logout
app.post('/api/logout', (req, res) => {
  // Di production, tambahkan token ke blacklist
  res.json({
    success: true,
    message: 'Token revoked successfully'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ScrapeIt Auth Server',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 ScrapeIt Auth Server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/login - Login and get token`);
  console.log(`   POST /api/verify-token - Verify extension token`);
  console.log(`   POST /api/refresh-token - Refresh expired token`);
  console.log(`   POST /api/logout - Revoke token`);
  console.log(`   GET /api/health - Health check`);
  console.log(`\n🔑 Demo credentials:`);
  console.log(`   Username: admin, Password: demo123`);
  console.log(`   Username: user1, Password: demo123`);
});

// Export untuk testing
module.exports = app;
