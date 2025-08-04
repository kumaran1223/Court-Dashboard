const axios = require('axios');

class CaptchaUtils {
  constructor() {
    this.twoCaptchaApiKey = process.env.TWOCAPTCHA_API_KEY;
    this.twoCaptchaBaseUrl = 'http://2captcha.com';
  }

  /**
   * Solve CAPTCHA using 2Captcha service
   */
  async solve2Captcha(imageBase64) {
    if (!this.twoCaptchaApiKey) {
      throw new Error('2Captcha API key not configured');
    }

    try {
      // Submit CAPTCHA to 2Captcha
      const submitResponse = await axios.post(`${this.twoCaptchaBaseUrl}/in.php`, {
        method: 'base64',
        key: this.twoCaptchaApiKey,
        body: imageBase64,
        json: 1
      });

      if (submitResponse.data.status !== 1) {
        throw new Error(`2Captcha submit failed: ${submitResponse.data.error_text || 'Unknown error'}`);
      }

      const captchaId = submitResponse.data.request;

      // Poll for result
      const maxAttempts = 30;
      const pollInterval = 5000; // 5 seconds

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await this.sleep(pollInterval);

        const resultResponse = await axios.get(`${this.twoCaptchaBaseUrl}/res.php`, {
          params: {
            key: this.twoCaptchaApiKey,
            action: 'get',
            id: captchaId,
            json: 1
          }
        });

        if (resultResponse.data.status === 0) {
          if (resultResponse.data.error_text === 'CAPCHA_NOT_READY') {
            continue; // Keep polling
          } else {
            throw new Error(`2Captcha result failed: ${resultResponse.data.error_text}`);
          }
        }

        if (resultResponse.data.status === 1) {
          return resultResponse.data.request;
        }
      }

      throw new Error('2Captcha timeout - no result after maximum attempts');

    } catch (error) {
      if (error.response) {
        throw new Error(`2Captcha API error: ${error.response.status} - ${error.response.data}`);
      }
      throw new Error(`2Captcha service error: ${error.message}`);
    }
  }

  /**
   * Get account balance from 2Captcha
   */
  async getBalance() {
    if (!this.twoCaptchaApiKey) {
      throw new Error('2Captcha API key not configured');
    }

    try {
      const response = await axios.get(`${this.twoCaptchaBaseUrl}/res.php`, {
        params: {
          key: this.twoCaptchaApiKey,
          action: 'getbalance',
          json: 1
        }
      });

      if (response.data.status === 1) {
        return parseFloat(response.data.request);
      } else {
        throw new Error(`Failed to get balance: ${response.data.error_text}`);
      }
    } catch (error) {
      throw new Error(`Balance check failed: ${error.message}`);
    }
  }

  /**
   * Report bad CAPTCHA solution
   */
  async reportBad(captchaId) {
    if (!this.twoCaptchaApiKey || !captchaId) {
      return false;
    }

    try {
      const response = await axios.get(`${this.twoCaptchaBaseUrl}/res.php`, {
        params: {
          key: this.twoCaptchaApiKey,
          action: 'reportbad',
          id: captchaId,
          json: 1
        }
      });

      return response.data.status === 1;
    } catch (error) {
      console.error('Failed to report bad CAPTCHA:', error.message);
      return false;
    }
  }

  /**
   * Validate CAPTCHA response format
   */
  validateCaptchaResponse(response) {
    if (!response || typeof response !== 'string') {
      return false;
    }

    // Basic validation - adjust based on actual CAPTCHA format
    const trimmed = response.trim();
    
    // Check if it's not empty and has reasonable length
    if (trimmed.length < 3 || trimmed.length > 10) {
      return false;
    }

    // Check if it contains only alphanumeric characters
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(trimmed);
  }

  /**
   * Extract CAPTCHA image from page
   */
  async extractCaptchaImage(page) {
    try {
      // Common CAPTCHA image selectors
      const captchaSelectors = [
        'img[src*="captcha"]',
        'img[alt*="captcha"]',
        'img[id*="captcha"]',
        'img[class*="captcha"]',
        '#captcha_image',
        '.captcha-image',
        'img[src*="verification"]',
        'img[src*="code"]'
      ];

      let captchaElement = null;
      
      for (const selector of captchaSelectors) {
        try {
          captchaElement = await page.$(selector);
          if (captchaElement) {
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!captchaElement) {
        return null;
      }

      // Get the bounding box and take a screenshot
      const boundingBox = await captchaElement.boundingBox();
      if (!boundingBox) {
        return null;
      }

      const screenshot = await page.screenshot({
        clip: boundingBox,
        type: 'png'
      });

      return {
        image: screenshot.toString('base64'),
        element: captchaElement,
        boundingBox: boundingBox
      };

    } catch (error) {
      console.error('Error extracting CAPTCHA image:', error);
      return null;
    }
  }

  /**
   * Find CAPTCHA input field
   */
  async findCaptchaInput(page) {
    const inputSelectors = [
      'input[name*="captcha"]',
      'input[name*="code"]',
      'input[name*="verification"]',
      'input[id*="captcha"]',
      'input[id*="code"]',
      'input[class*="captcha"]',
      '#captcha',
      '#verification_code',
      '#security_code'
    ];

    for (const selector of inputSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          return element;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    return null;
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random delay to avoid detection
   */
  getRandomDelay(min = 1000, max = 3000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Check if 2Captcha service is available
   */
  async isServiceAvailable() {
    if (!this.twoCaptchaApiKey) {
      return false;
    }

    try {
      const balance = await this.getBalance();
      return balance > 0;
    } catch (error) {
      console.error('2Captcha service check failed:', error.message);
      return false;
    }
  }

  /**
   * Get service status and information
   */
  async getServiceInfo() {
    try {
      const isAvailable = await this.isServiceAvailable();
      let balance = null;

      if (isAvailable) {
        balance = await this.getBalance();
      }

      return {
        available: isAvailable,
        balance: balance,
        configured: !!this.twoCaptchaApiKey
      };
    } catch (error) {
      return {
        available: false,
        balance: null,
        configured: !!this.twoCaptchaApiKey,
        error: error.message
      };
    }
  }
}

module.exports = new CaptchaUtils();
