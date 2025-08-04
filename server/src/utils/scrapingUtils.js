const { chromium } = require('playwright');

class ScrapingUtils {
  constructor() {
    this.defaultTimeout = 30000;
    this.defaultUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Create a browser instance with optimal settings
   */
  async createBrowser(options = {}) {
    const defaultOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };

    const browserOptions = { ...defaultOptions, ...options };
    
    try {
      const browser = await chromium.launch(browserOptions);
      return browser;
    } catch (error) {
      throw new Error(`Failed to launch browser: ${error.message}`);
    }
  }

  /**
   * Create a page with stealth settings
   */
  async createStealthPage(browser) {
    const context = await browser.newContext({
      userAgent: this.defaultUserAgent,
      viewport: { width: 1366, height: 768 },
      locale: 'en-US',
      timezoneId: 'Asia/Kolkata',
      permissions: [],
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const page = await context.newPage();

    // Add stealth scripts
    await page.addInitScript(() => {
      // Remove webdriver property
      delete navigator.__proto__.webdriver;
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    return page;
  }

  /**
   * Navigate to URL with retry logic
   */
  async navigateWithRetry(page, url, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: this.defaultTimeout
        });
        return true;
      } catch (error) {
        lastError = error;
        console.warn(`Navigation attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await this.sleep(2000 * attempt); // Exponential backoff
        }
      }
    }
    
    throw new Error(`Failed to navigate after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Wait for element with multiple selectors
   */
  async waitForAnySelector(page, selectors, timeout = this.defaultTimeout) {
    const promises = selectors.map(selector => 
      page.waitForSelector(selector, { timeout }).catch(() => null)
    );
    
    const results = await Promise.allSettled(promises);
    const successfulResult = results.find(result => 
      result.status === 'fulfilled' && result.value !== null
    );
    
    if (successfulResult) {
      return successfulResult.value;
    }
    
    throw new Error(`None of the selectors found: ${selectors.join(', ')}`);
  }

  /**
   * Extract text content safely
   */
  async extractText(page, selector, defaultValue = '') {
    try {
      const element = await page.$(selector);
      if (element) {
        const text = await element.textContent();
        return text ? text.trim() : defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.warn(`Failed to extract text from ${selector}:`, error.message);
      return defaultValue;
    }
  }

  /**
   * Extract attribute safely
   */
  async extractAttribute(page, selector, attribute, defaultValue = '') {
    try {
      const element = await page.$(selector);
      if (element) {
        const value = await element.getAttribute(attribute);
        return value || defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.warn(`Failed to extract ${attribute} from ${selector}:`, error.message);
      return defaultValue;
    }
  }

  /**
   * Fill form field safely
   */
  async fillField(page, selector, value, options = {}) {
    try {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // Clear existing value
      await element.fill('');
      
      // Add human-like typing delay
      if (options.humanLike) {
        await element.type(value, { delay: this.getRandomDelay(50, 150) });
      } else {
        await element.fill(value);
      }
      
      return true;
    } catch (error) {
      console.warn(`Failed to fill field ${selector}:`, error.message);
      return false;
    }
  }

  /**
   * Select option safely
   */
  async selectOption(page, selector, value, options = {}) {
    try {
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Select element not found: ${selector}`);
      }

      // Try different selection methods
      if (options.byLabel) {
        await page.selectOption(selector, { label: value });
      } else if (options.byValue) {
        await page.selectOption(selector, { value: value });
      } else {
        // Try both label and value
        try {
          await page.selectOption(selector, { label: value });
        } catch (e) {
          await page.selectOption(selector, { value: value });
        }
      }
      
      return true;
    } catch (error) {
      console.warn(`Failed to select option ${value} in ${selector}:`, error.message);
      return false;
    }
  }

  /**
   * Click element safely with retry
   */
  async clickElement(page, selector, options = {}) {
    const maxRetries = options.maxRetries || 3;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const element = await page.$(selector);
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }

        // Scroll into view
        await element.scrollIntoViewIfNeeded();
        
        // Wait for element to be stable
        await page.waitForTimeout(500);
        
        // Click the element
        await element.click();
        
        return true;
      } catch (error) {
        lastError = error;
        console.warn(`Click attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          await this.sleep(1000);
        }
      }
    }
    
    throw new Error(`Failed to click after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Extract all links matching pattern
   */
  async extractLinks(page, pattern = null) {
    try {
      const links = await page.$$eval('a[href]', (elements) => 
        elements.map(el => ({
          text: el.textContent.trim(),
          href: el.href,
          title: el.title || ''
        }))
      );
      
      if (pattern) {
        const regex = new RegExp(pattern, 'i');
        return links.filter(link => 
          regex.test(link.href) || regex.test(link.text)
        );
      }
      
      return links;
    } catch (error) {
      console.warn('Failed to extract links:', error.message);
      return [];
    }
  }

  /**
   * Check if page contains error indicators
   */
  async checkForErrors(page) {
    const errorIndicators = [
      { selector: '.error', type: 'class' },
      { selector: '.alert-danger', type: 'class' },
      { selector: '#error', type: 'id' },
      { selector: '[class*="error"]', type: 'attribute' },
      { selector: 'font[color="red"]', type: 'element' },
      { selector: '[style*="color:red"]', type: 'style' }
    ];
    
    for (const indicator of errorIndicators) {
      try {
        const element = await page.$(indicator.selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim()) {
            return {
              found: true,
              message: text.trim(),
              type: indicator.type
            };
          }
        }
      } catch (e) {
        // Continue checking other indicators
      }
    }
    
    // Check for common error phrases in page content
    const pageText = await page.textContent('body');
    const errorPhrases = [
      'no record found',
      'not found',
      'no case found',
      'invalid',
      'error occurred',
      'server error',
      'access denied'
    ];
    
    for (const phrase of errorPhrases) {
      if (pageText.toLowerCase().includes(phrase)) {
        return {
          found: true,
          message: `Page contains error indicator: ${phrase}`,
          type: 'content'
        };
      }
    }
    
    return { found: false };
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(page, filename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = filename || `debug-${timestamp}.png`;
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      
      console.log(`Debug screenshot saved: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      console.warn('Failed to take debug screenshot:', error.message);
      return null;
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get random delay for human-like behavior
   */
  getRandomDelay(min = 100, max = 500) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Clean up browser resources
   */
  async cleanup(browser) {
    try {
      if (browser) {
        await browser.close();
      }
    } catch (error) {
      console.warn('Error during browser cleanup:', error.message);
    }
  }
}

module.exports = new ScrapingUtils();
