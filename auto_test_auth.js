// Auto Test Script untuk ScrapeIt Authentication System
// Script ini akan otomatis test semua komponen authentication

(function() {
  'use strict';
  
  console.log('🚀 Starting automated ScrapeIt Authentication Tests...');
  
  // Test configuration
  const TEST_CONFIG = {
    serverUrl: 'http://localhost:3000',
    testCredentials: {
      username: 'admin',
      password: 'demo123'
    },
    extensionInfo: {
      name: 'ScrapeIt',
      version: '1.0'
    }
  };
  
  // Test results storage
  let testResults = {
    passed: 0,
    failed: 0,
    details: []
  };
  
  // Helper function untuk logging test results
  function logTest(testName, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}${details ? ': ' + details : ''}`);
    
    testResults.details.push({
      test: testName,
      passed: passed,
      details: details,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
  }
  
  // Test 1: Check if AuthManager is available
  function testAuthManagerAvailability() {
    const testName = 'AuthManager Availability';
    
    try {
      if (window.authManager && typeof window.authManager.init === 'function') {
        logTest(testName, true, 'AuthManager class loaded successfully');
        return true;
      } else {
        logTest(testName, false, 'AuthManager not found or incomplete');
        return false;
      }
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Test 2: Test storage operations
  async function testStorageOperations() {
    const testName = 'Storage Operations';
    
    try {
      const testToken = 'test-jwt-token-' + Date.now();
      
      // Test save
      await window.authManager.saveTokenToStorage(testToken);
      
      // Test retrieve
      const retrieved = await window.authManager.getTokenFromStorage();
      
      if (retrieved !== testToken) {
        throw new Error('Token retrieval mismatch');
      }
      
      // Test remove
      await window.authManager.removeTokenFromStorage();
      const afterRemove = await window.authManager.getTokenFromStorage();
      
      if (afterRemove) {
        throw new Error('Token not properly removed');
      }
      
      logTest(testName, true, 'Save, retrieve, and remove operations successful');
      return true;
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Test 3: Test server connectivity
  async function testServerConnectivity() {
    const testName = 'Server Connectivity';
    
    try {
      const response = await fetch(`${TEST_CONFIG.serverUrl}/api/health`);
      
      if (response.ok) {
        const data = await response.json();
        logTest(testName, true, `Server responding: ${data.status}`);
        return true;
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      logTest(testName, false, `Cannot connect to server: ${error.message}`);
      return false;
    }
  }
  
  // Test 4: Test login and token generation
  async function testLoginAndTokenGeneration() {
    const testName = 'Login & Token Generation';
    
    try {
      const response = await fetch(`${TEST_CONFIG.serverUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TEST_CONFIG.testCredentials)
      });
      
      if (!response.ok) {
        throw new Error(`Login failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.token) {
        throw new Error('Login response missing token');
      }
      
      // Store token for next tests
      window.testToken = data.token;
      
      logTest(testName, true, `Token generated successfully (${data.token.substring(0, 20)}...)`);
      return true;
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Test 5: Test token verification with server
  async function testTokenVerification() {
    const testName = 'Token Verification';
    
    if (!window.testToken) {
      logTest(testName, false, 'No test token available');
      return false;
    }
    
    try {
      const response = await fetch(`${TEST_CONFIG.serverUrl}/api/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.testToken}`
        },
        body: JSON.stringify({
          token: window.testToken,
          extension: TEST_CONFIG.extensionInfo.name,
          version: TEST_CONFIG.extensionInfo.version
        })
      });
      
      if (response.status === 200) {
        const data = await response.json();
        if (data.success && data.valid) {
          logTest(testName, true, `Token verified for user: ${data.user.username}`);
          return true;
        } else {
          throw new Error('Server returned invalid token response');
        }
      } else {
        throw new Error(`Verification failed with status: ${response.status}`);
      }
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Test 6: Test AuthManager token verification method
  async function testAuthManagerVerification() {
    const testName = 'AuthManager Token Verification';
    
    if (!window.testToken) {
      logTest(testName, false, 'No test token available');
      return false;
    }
    
    try {
      // Temporarily update auth server URL untuk testing
      const originalUrl = window.authManager.authServerUrl;
      window.authManager.setAuthServerUrl(`${TEST_CONFIG.serverUrl}/api/verify-token`);
      
      const isValid = await window.authManager.verifyTokenWithServer(window.testToken);
      
      // Restore original URL
      window.authManager.setAuthServerUrl(originalUrl);
      
      if (isValid) {
        logTest(testName, true, 'AuthManager verification method working correctly');
        return true;
      } else {
        throw new Error('AuthManager returned false for valid token');
      }
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Test 7: Test invalid token handling
  async function testInvalidTokenHandling() {
    const testName = 'Invalid Token Handling';
    
    try {
      const invalidToken = 'invalid-token-12345';
      
      // Temporarily update auth server URL
      const originalUrl = window.authManager.authServerUrl;
      window.authManager.setAuthServerUrl(`${TEST_CONFIG.serverUrl}/api/verify-token`);
      
      const isValid = await window.authManager.verifyTokenWithServer(invalidToken);
      
      // Restore original URL
      window.authManager.setAuthServerUrl(originalUrl);
      
      if (!isValid) {
        logTest(testName, true, 'Invalid token correctly rejected');
        return true;
      } else {
        throw new Error('Invalid token was accepted as valid');
      }
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Test 8: Test extension blocking functionality
  function testExtensionBlocking() {
    const testName = 'Extension Blocking';
    
    try {
      const originalState = window.EXTENSION_BLOCKED;
      const originalAuth = window.authManager.isAuthenticated;
      
      // Test blocking
      window.authManager.blockExtensionFunctions();
      
      if (window.EXTENSION_BLOCKED === true && window.authManager.isAuthenticated === false) {
        // Restore state
        window.EXTENSION_BLOCKED = originalState;
        window.authManager.isAuthenticated = originalAuth;
        
        logTest(testName, true, 'Extension blocking functionality working');
        return true;
      } else {
        throw new Error('Extension blocking did not set correct states');
      }
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Test 9: Test authentication callbacks
  function testAuthenticationCallbacks() {
    const testName = 'Authentication Callbacks';
    
    return new Promise((resolve) => {
      try {
        let callbackExecuted = false;
        
        // Register callback
        window.authManager.onAuthenticated(() => {
          callbackExecuted = true;
        });
        
        // Simulate authentication success
        const originalAuth = window.authManager.isAuthenticated;
        window.authManager.isAuthenticated = true;
        window.authManager.executeAuthCallbacks();
        
        // Check if callback was executed
        setTimeout(() => {
          // Restore state
          window.authManager.isAuthenticated = originalAuth;
          
          if (callbackExecuted) {
            logTest(testName, true, 'Authentication callback system working');
            resolve(true);
          } else {
            logTest(testName, false, 'Callback was not executed');
            resolve(false);
          }
        }, 100);
      } catch (error) {
        logTest(testName, false, error.message);
        resolve(false);
      }
    });
  }
  
  // Test 10: Test full authentication flow
  async function testFullAuthenticationFlow() {
    const testName = 'Full Authentication Flow';
    
    try {
      // Clear any existing token
      await window.authManager.removeTokenFromStorage();
      
      // Reset auth state
      window.authManager.isAuthenticated = false;
      window.authManager.authToken = null;
      window.EXTENSION_BLOCKED = false;
      
      // Set test server URL
      const originalUrl = window.authManager.authServerUrl;
      window.authManager.setAuthServerUrl(`${TEST_CONFIG.serverUrl}/api/verify-token`);
      
      // Save test token
      await window.authManager.saveTokenToStorage(window.testToken);
      
      // Run authentication check
      await window.authManager.checkAuthentication();
      
      // Restore original URL
      window.authManager.setAuthServerUrl(originalUrl);
      
      if (window.authManager.isAuthenticated && !window.EXTENSION_BLOCKED) {
        logTest(testName, true, 'Full authentication flow completed successfully');
        return true;
      } else {
        throw new Error(`Auth flow failed: authenticated=${window.authManager.isAuthenticated}, blocked=${window.EXTENSION_BLOCKED}`);
      }
    } catch (error) {
      logTest(testName, false, error.message);
      return false;
    }
  }
  
  // Main test runner
  async function runAllTests() {
    console.log('\n🧪 Running comprehensive authentication tests...\n');
    
    const startTime = Date.now();
    
    // Run tests sequentially
    const tests = [
      testAuthManagerAvailability,
      testStorageOperations,
      testServerConnectivity,
      testLoginAndTokenGeneration,
      testTokenVerification,
      testAuthManagerVerification,
      testInvalidTokenHandling,
      testExtensionBlocking,
      testAuthenticationCallbacks,
      testFullAuthenticationFlow
    ];
    
    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error(`Unexpected error in test: ${error.message}`);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.details
        .filter(t => !t.passed)
        .forEach(t => console.log(`   - ${t.test}: ${t.details}`));
    }
    
    console.log('\n📋 Detailed Results:');
    console.table(testResults.details.map(t => ({
      Test: t.test,
      Status: t.passed ? 'PASS' : 'FAIL',
      Details: t.details || 'N/A'
    })));
    
    // Cleanup
    if (window.testToken) {
      delete window.testToken;
    }
    
    return testResults;
  }
  
  // Auto-run tests if script is loaded directly
  if (window.location.hostname === 'shopee.co.id') {
    console.log('🎯 ScrapeIt Authentication Auto-Test detected Shopee domain');
    console.log('💡 To run tests manually: window.runAuthTests()');
    
    // Wait a bit for extension to load, then auto-run
    setTimeout(() => {
      if (window.authManager) {
        console.log('🚀 Auto-running authentication tests...');
        runAllTests();
      } else {
        console.log('⚠️ AuthManager not found. Extension may not be loaded yet.');
        console.log('💡 Try running: window.runAuthTests() manually');
      }
    }, 2000);
  }
  
  // Export test runner to global scope
  window.runAuthTests = runAllTests;
  window.authTestConfig = TEST_CONFIG;
  
  console.log('🎯 Authentication auto-test script loaded');
  console.log('🚀 Run window.runAuthTests() to execute all tests');
  
})();
