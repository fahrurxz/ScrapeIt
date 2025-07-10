// Test Authentication System for ScrapeIt Extension
// This test can be run in browser console on Shopee pages

console.log('🧪 Testing ScrapeIt Authentication System...');

// Test 1: Check if AuthManager is loaded
function testAuthManagerLoaded() {
  console.log('\n1️⃣ Testing AuthManager availability...');
  
  if (window.authManager) {
    console.log('✅ AuthManager is loaded');
    return true;
  } else {
    console.log('❌ AuthManager is not loaded');
    return false;
  }
}

// Test 2: Check authentication status
async function testAuthStatus() {
  console.log('\n2️⃣ Testing authentication status...');
  
  const status = window.authManager.getAuthStatus();
  console.log('Auth Status:', status);
  
  if (status.isAuthenticated) {
    console.log('✅ User is authenticated');
  } else {
    console.log('❌ User is not authenticated');
  }
  
  return status;
}

// Test 3: Test token storage operations
async function testTokenStorage() {
  console.log('\n3️⃣ Testing token storage operations...');
  
  // Test save token
  const testToken = 'test-jwt-token-12345';
  await window.authManager.saveTokenToStorage(testToken);
  console.log('✅ Test token saved');
  
  // Test get token
  const retrievedToken = await window.authManager.getTokenFromStorage();
  if (retrievedToken === testToken) {
    console.log('✅ Token retrieved successfully');
  } else {
    console.log('❌ Token retrieval failed');
  }
  
  // Test remove token
  await window.authManager.removeTokenFromStorage();
  const removedToken = await window.authManager.getTokenFromStorage();
  if (!removedToken) {
    console.log('✅ Token removed successfully');
  } else {
    console.log('❌ Token removal failed');
  }
}

// Test 4: Test manual token input (will show popup)
function testTokenInput() {
  console.log('\n4️⃣ Testing token input popup...');
  console.log('This will show the token input modal');
  
  window.authManager.showTokenInputPopup();
}

// Test 5: Test server verification with mock
async function testServerVerification() {
  console.log('\n5️⃣ Testing server verification (with mock)...');
  
  // Mock the server verification for testing
  const originalVerify = window.authManager.verifyTokenWithServer;
  
  // Test with valid token
  window.authManager.verifyTokenWithServer = async (token) => {
    console.log('🔄 Mock server call with token:', token);
    if (token === 'valid-token') {
      console.log('✅ Mock server: Token is valid');
      return true;
    } else {
      console.log('❌ Mock server: Token is invalid');
      return false;
    }
  };
  
  const validResult = await window.authManager.verifyTokenWithServer('valid-token');
  const invalidResult = await window.authManager.verifyTokenWithServer('invalid-token');
  
  console.log('Valid token result:', validResult);
  console.log('Invalid token result:', invalidResult);
  
  // Restore original function
  window.authManager.verifyTokenWithServer = originalVerify;
}

// Test 6: Test extension blocking
function testExtensionBlocking() {
  console.log('\n6️⃣ Testing extension blocking...');
  
  const originalBlocked = window.EXTENSION_BLOCKED;
  
  window.authManager.blockExtensionFunctions();
  
  if (window.EXTENSION_BLOCKED) {
    console.log('✅ Extension successfully blocked');
  } else {
    console.log('❌ Extension blocking failed');
  }
  
  // Restore original state
  window.EXTENSION_BLOCKED = originalBlocked;
}

// Test 7: Test authentication callbacks
function testAuthCallbacks() {
  console.log('\n7️⃣ Testing authentication callbacks...');
  
  let callbackExecuted = false;
  
  window.authManager.onAuthenticated(() => {
    callbackExecuted = true;
    console.log('✅ Authentication callback executed');
  });
  
  // Simulate authentication
  window.authManager.isAuthenticated = true;
  window.authManager.executeAuthCallbacks();
  
  if (callbackExecuted) {
    console.log('✅ Callback system working');
  } else {
    console.log('❌ Callback system failed');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive authentication tests...');
  
  try {
    const results = {
      authManagerLoaded: testAuthManagerLoaded(),
      authStatus: await testAuthStatus(),
      tokenStorage: await testTokenStorage(),
      serverVerification: await testServerVerification(),
      extensionBlocking: testExtensionBlocking(),
      authCallbacks: testAuthCallbacks()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.table(results);
    
    console.log('\n💡 To test token input popup manually, run: testTokenInput()');
    console.log('💡 To test full authentication flow, run: window.authManager.checkAuthentication()');
    
    return results;
  } catch (error) {
    console.error('❌ Test execution failed:', error);
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

console.log('🎯 Authentication tests loaded. Run window.testAuth.runAll() to test everything.');
console.log('🎯 Or run individual tests: window.testAuth.tokenInput(), etc.');
