// Test Authentication System for ScrapeIt Extension
// This test can be run in browser console on Shopee pages



// Test 1: Check if AuthManager is loaded
function testAuthManagerLoaded() {
  
  
  if (window.authManager) {
    
    return true;
  } else {
    
    return false;
  }
}

// Test 2: Check authentication status
async function testAuthStatus() {
  
  
  const status = window.authManager.getAuthStatus();
  
  
  if (status.isAuthenticated) {
    
  } else {
    
  }
  
  return status;
}

// Test 3: Test token storage operations
async function testTokenStorage() {
  
  
  // Test save token
  const testToken = 'test-jwt-token-12345';
  await window.authManager.saveTokenToStorage(testToken);
  
  
  // Test get token
  const retrievedToken = await window.authManager.getTokenFromStorage();
  if (retrievedToken === testToken) {
    
  } else {
    
  }
  
  // Test remove token
  await window.authManager.removeTokenFromStorage();
  const removedToken = await window.authManager.getTokenFromStorage();
  if (!removedToken) {
    
  } else {
    
  }
}

// Test 4: Test manual token input (will show popup)
function testTokenInput() {
  
  
  
  window.authManager.showTokenInputPopup();
}

// Test 5: Test server verification with mock
async function testServerVerification() {
  
  
  // Mock the server verification for testing
  const originalVerify = window.authManager.verifyTokenWithServer;
  
  // Test with valid token
  window.authManager.verifyTokenWithServer = async (token) => {
    
    if (token === 'valid-token') {
      
      return true;
    } else {
      
      return false;
    }
  };
  
  const validResult = await window.authManager.verifyTokenWithServer('valid-token');
  const invalidResult = await window.authManager.verifyTokenWithServer('invalid-token');
  
  
  
  
  // Restore original function
  window.authManager.verifyTokenWithServer = originalVerify;
}

// Test 6: Test extension blocking
function testExtensionBlocking() {
  
  
  const originalBlocked = window.EXTENSION_BLOCKED;
  
  window.authManager.blockExtensionFunctions();
  
  if (window.EXTENSION_BLOCKED) {
    
  } else {
    
  }
  
  // Restore original state
  window.EXTENSION_BLOCKED = originalBlocked;
}

// Test 7: Test authentication callbacks
function testAuthCallbacks() {
  
  
  let callbackExecuted = false;
  
  window.authManager.onAuthenticated(() => {
    callbackExecuted = true;
    
  });
  
  // Simulate authentication
  window.authManager.isAuthenticated = true;
  window.authManager.executeAuthCallbacks();
  
  if (callbackExecuted) {
    
  } else {
    
  }
}

// Run all tests
async function runAllTests() {
  
  
  try {
    const results = {
      authManagerLoaded: testAuthManagerLoaded(),
      authStatus: await testAuthStatus(),
      tokenStorage: await testTokenStorage(),
      serverVerification: await testServerVerification(),
      extensionBlocking: testExtensionBlocking(),
      authCallbacks: testAuthCallbacks()
    };
    
    
    console.table(results);
    
    
    
    
    return results;
  } catch (error) {
  }
}

// Export test functions to global scope
window.testAuth = {
  runAll: runAllTests,
  authManagerLoaded: testAuthManagerLoaded,
  authStatus: testAuthStatus,
  tokenStorage: testTokenStorage,
  tokenInput: testTokenInput,
  serverVerification: testServerVerification,
  extensionBlocking: testExtensionBlocking,
  authCallbacks: testAuthCallbacks
};



