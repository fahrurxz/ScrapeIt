// Background service worker untuk intercept API calls
class ShopeeAPIInterceptor {
  constructor() {
    this.apiData = {};
    this.init();
  }

  init() {
    // Listen for web requests to Shopee API
    chrome.webRequest.onBeforeRequest.addListener(
      this.handleAPIRequest.bind(this),
      {
        urls: ["https://shopee.co.id/api/v4/*"]
      },
      ["requestBody"]
    );

    chrome.webRequest.onCompleted.addListener(
      this.handleAPIResponse.bind(this),
      {
        urls: ["https://shopee.co.id/api/v4/*"]
      },
      ["responseHeaders"]
    );

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  handleAPIRequest(details) {
    console.log('API Request intercepted:', details.url);
    
    // Store request details
    this.apiData[details.requestId] = {
      url: details.url,
      method: details.method,
      timestamp: Date.now(),
      requestBody: details.requestBody
    };
  }

  handleAPIResponse(details) {
    console.log('API Response intercepted:', details.url);
    
    if (this.apiData[details.requestId]) {
      this.apiData[details.requestId].statusCode = details.statusCode;
      this.apiData[details.requestId].responseHeaders = details.responseHeaders;
      
      // Send data to content script if it's relevant
      this.sendDataToContentScript(details.tabId, this.apiData[details.requestId]);
    }
  }

  async sendDataToContentScript(tabId, apiData) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'API_DATA',
        data: apiData
      });
    } catch (error) {
      console.log('Could not send message to content script:', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    if (request.type === 'GET_API_DATA') {
      sendResponse({
        success: true,
        data: this.apiData
      });
    }
    return true;
  }
}

// Initialize the interceptor
new ShopeeAPIInterceptor();
