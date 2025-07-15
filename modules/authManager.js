// Authentication Manager for ScrapeIt Extension
class AuthManager {
  constructor() {
    this.authServerUrl = 'https://b374k.site/api/verify-token';
    this.isAuthenticated = false;
    this.authToken = null;
    this.authCallbacks = [];
    this.hasRefreshedAfterAuth = false; // Flag untuk mencegah refresh berulang
  }

  // Initialize authentication check
  async init() {
    try {
      // Add retry mechanism for initialization
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await this.checkAuthentication();
          return this.isAuthenticated;
        } catch (error) {
          retryCount++;
          console.log(`⏳ Auth initialization attempt ${retryCount}/${maxRetries} failed:`, error.message);
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          } else {
            throw error;
          }
        }
      }
      
      return this.isAuthenticated;
    } catch (error) {
      console.error('Auth initialization failed after all retries:', error);
      this.blockExtensionFunctions();
      return false;
    }
  }

  // Main authentication check function
  async checkAuthentication() {
    try {
      // Ensure DOM is ready before proceeding
      await this.waitForDOM();
      
      // Get token from chrome storage
      const token = await this.getTokenFromStorage();
      
      if (!token) {
        // No token found, show input popup
        await this.showTokenInputPopup();
        return;
      }

      // Verify token with server
      const isValid = await this.verifyTokenWithServer(token);
      
      if (isValid) {
        this.authToken = token;
        this.isAuthenticated = true;
        console.log('✅ Authentication successful');
        this.executeAuthCallbacks();
        
        // Refresh halaman hanya jika belum pernah refresh setelah auth
        // if (!this.hasRefreshedAfterAuth) {
        //   this.hasRefreshedAfterAuth = true;
        //   setTimeout(() => {
        //     console.log('🔄 Refreshing page after successful authentication...');
        //     window.location.reload();
        //   }, 1000);
        // }
      } else {
        // Invalid token, remove from storage and show popup
        await this.removeTokenFromStorage();
        await this.showTokenInputPopup();
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // If DOM related error, try again after delay
      if (error.message.includes('appendChild') || error.message.includes('Cannot read properties of null')) {
        console.log('⏳ DOM not ready, retrying authentication in 1 second...');
        setTimeout(() => {
          this.checkAuthentication();
        }, 1000);
      } else {
        this.blockExtensionFunctions();
      }
    }
  }

  // Get JWT token from chrome.storage.local
  async getTokenFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['jwtToken'], (result) => {
        resolve(result.jwtToken || null);
      });
    });
  }

  // Save JWT token to chrome.storage.local
  async saveTokenToStorage(token) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ jwtToken: token }, () => {
        resolve();
      });
    });
  }

  // Remove JWT token from chrome.storage.local
  async removeTokenFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['jwtToken'], () => {
        resolve();
      });
    });
  }

  // Show popup for token input
  async showTokenInputPopup() {
    // Wait for DOM to be ready
    await this.waitForDOM();
    
    const modal = this.createTokenInputModal();
    
    // Safety check for document.body
    const targetElement = document.body || document.documentElement;
    if (!targetElement) {
      console.error('Cannot find DOM element to append modal');
      this.blockExtensionFunctions();
      return;
    }
    
    targetElement.appendChild(modal);
    
    return new Promise((resolve) => {
      const handleSubmit = async (token) => {
        if (!token || token.trim() === '') {
          this.showError('Token tidak boleh kosong!');
          return;
        }

        // Verify token with server
        const isValid = await this.verifyTokenWithServer(token);
        
        if (isValid) {
          await this.saveTokenToStorage(token);
          this.authToken = token;
          this.isAuthenticated = true;
          modal.remove();
          console.log('✅ Token saved and authenticated');
          this.executeAuthCallbacks();
          
          // Refresh halaman setelah token berhasil disimpan dan diverifikasi
          // Set flag untuk mencegah refresh berulang
          this.hasRefreshedAfterAuth = true;
          setTimeout(() => {
            console.log('🔄 Refreshing page after successful token verification...');
            window.location.reload();
          }, 500);
          
          resolve();
        } else {
          this.showError('Token tidak valid! Silakan coba lagi.');
        }
      };

      const handleCancel = () => {
        modal.remove();
        this.blockExtensionFunctions();
        resolve();
      };

      // Set up event listeners
      const submitBtn = modal.querySelector('#auth-submit-btn');
      const cancelBtn = modal.querySelector('#auth-cancel-btn');
      const tokenInput = modal.querySelector('#auth-token-input');

      submitBtn.addEventListener('click', () => {
        handleSubmit(tokenInput.value);
      });

      cancelBtn.addEventListener('click', handleCancel);

      // Submit on Enter key
      tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSubmit(tokenInput.value);
        }
      });

      // Focus on input
      setTimeout(() => tokenInput.focus(), 100);
    });
  }

  // Create token input modal
  createTokenInputModal() {
    const modal = document.createElement('div');
    modal.id = 'auth-token-modal';
    modal.innerHTML = `
      <div class="auth-modal-overlay">
        <div class="auth-modal-content">
          <div class="auth-modal-header">
            <h3>🔐 ScrapeIt Authentication</h3>
            <p>Masukkan Token untuk menggunakan extension ini:</p>
          </div>
          <div class="auth-modal-body">
            <input type="password" id="auth-token-input" placeholder="Masukkan Token..." />
            <div id="auth-error-message" class="auth-error-message" style="display: none;"></div>
          </div>
          <div class="auth-modal-footer">
            <button id="auth-cancel-btn" class="auth-btn auth-btn-cancel">Batal</button>
            <button id="auth-submit-btn" class="auth-btn auth-btn-submit">Verifikasi</button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #auth-token-modal .auth-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        font-family: Arial, sans-serif;
      }

      #auth-token-modal .auth-modal-content {
        background: white;
        border-radius: 12px;
        padding: 24px;
        min-width: 400px;
        max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: authModalSlideIn 0.3s ease-out;
      }

      @keyframes authModalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      #auth-token-modal .auth-modal-header h3 {
        margin: 0 0 8px 0;
        color: #333;
        font-size: 20px;
      }

      #auth-token-modal .auth-modal-header p {
        margin: 0 0 20px 0;
        color: #666;
        font-size: 14px;
      }

      #auth-token-modal .auth-modal-body {
        margin-bottom: 20px;
      }

      #auth-token-modal #auth-token-input {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        box-sizing: border-box;
        transition: border-color 0.3s;
      }

      #auth-token-modal #auth-token-input:focus {
        outline: none;
        border-color: #007bff;
      }

      #auth-token-modal .auth-error-message {
        color: #dc3545;
        font-size: 12px;
        margin-top: 8px;
        padding: 8px;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
      }

      #auth-token-modal .auth-modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      #auth-token-modal .auth-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s;
      }

      #auth-token-modal .auth-btn-cancel {
        background: #6c757d;
        color: white;
      }

      #auth-token-modal .auth-btn-cancel:hover {
        background: #5a6268;
      }

      #auth-token-modal .auth-btn-submit {
        background: #007bff;
        color: white;
      }

      #auth-token-modal .auth-btn-submit:hover {
        background: #0056b3;
      }
    `;
    
    modal.appendChild(style);
    return modal;
  }

  // Show error message in modal
  showError(message) {
    const errorElement = document.querySelector('#auth-error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  // Verify token with server
  async verifyTokenWithServer(token) {
    try {
      const response = await fetch(this.authServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          token: token,
          extension: 'ScrapeIt',
          version: '1.0'
        })
      });

      return response.status === 200;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  // Block all extension functions
  blockExtensionFunctions() {
    this.isAuthenticated = false;
    
    // Show alert only if window is available
    if (typeof window !== 'undefined' && window.alert) {
      alert('❌ Autentikasi gagal! Extension ScrapeIt tidak dapat digunakan tanpa token yang valid.');
    }
    
    // Stop all extension functionality
    window.EXTENSION_BLOCKED = true;
    
    // Clear any existing UI (with safety check)
    try {
      const existingUI = document.querySelector('#shopee-analytics-ui');
      if (existingUI && existingUI.parentNode) {
        existingUI.remove();
      }
    } catch (error) {
      console.log('Note: Could not remove existing UI (DOM not ready)');
    }

    console.log('🚫 Extension functions blocked due to authentication failure');
  }

  // Add callback to execute after successful authentication
  onAuthenticated(callback) {
    if (this.isAuthenticated) {
      callback();
    } else {
      this.authCallbacks.push(callback);
    }
  }

  // Execute all registered auth callbacks
  executeAuthCallbacks() {
    this.authCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Auth callback error:', error);
      }
    });
    this.authCallbacks = [];
  }

  // Get current authentication status
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      hasToken: !!this.authToken
    };
  }

  // Logout function
  async logout() {
    await this.removeTokenFromStorage();
    this.authToken = null;
    this.isAuthenticated = false;
    this.hasRefreshedAfterAuth = false; // Reset flag saat logout
    window.EXTENSION_BLOCKED = true;
    
    // Clear UI (with safety check)
    try {
      const existingUI = document.querySelector('#shopee-analytics-ui');
      if (existingUI && existingUI.parentNode) {
        existingUI.remove();
      }
    } catch (error) {
      console.log('Note: Could not remove UI during logout (DOM not ready)');
    }
    
    console.log('🔓 User logged out');
  }

  // Update auth server URL
  setAuthServerUrl(url) {
    this.authServerUrl = url;
  }

  // Wait for DOM to be ready
  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }
}

// Global auth manager instance
window.authManager = new AuthManager();
