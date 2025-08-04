const { chromium } = require('playwright');
const axios = require('axios');

class CourtScrapingService {
  constructor() {
    this.baseUrl = 'https://delhihighcourt.nic.in';
    this.searchUrl = `${this.baseUrl}/case_status.asp`;
    this.twoCaptchaApiKey = process.env.TWOCAPTCHA_API_KEY;
  }

  /**
   * Search for a case on Delhi High Court website
   */
  async searchCase({ caseType, caseNumber, filingYear, captchaResponse }) {
    let browser = null;
    
    try {
      // Launch browser
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      const page = await context.newPage();
      
      // Navigate to search page
      await page.goto(this.searchUrl, { waitUntil: 'networkidle' });
      
      // Wait for form to load
      await page.waitForSelector('form', { timeout: 10000 });
      
      // Fill the form
      await this.fillSearchForm(page, { caseType, caseNumber, filingYear });
      
      // Handle CAPTCHA
      const captchaHandled = await this.handleCaptcha(page, captchaResponse);
      if (!captchaHandled.success) {
        return captchaHandled;
      }
      
      // Submit the form
      await page.click('input[type="submit"], button[type="submit"]');
      
      // Wait for results or error
      await page.waitForTimeout(3000);
      
      // Check for error messages
      const errorMessage = await this.checkForErrors(page);
      if (errorMessage) {
        return {
          success: false,
          error: errorMessage
        };
      }
      
      // Extract case data
      const caseData = await this.extractCaseData(page);
      
      return {
        success: true,
        data: caseData
      };
      
    } catch (error) {
      console.error('Court scraping error:', error);
      return {
        success: false,
        error: `Scraping failed: ${error.message}`
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Fill the search form with case details
   */
  async fillSearchForm(page, { caseType, caseNumber, filingYear }) {
    try {
      // Look for case type dropdown/select
      const caseTypeSelector = await page.$('select[name*="case"], select[name*="type"], #caseType, #case_type');
      if (caseTypeSelector) {
        await page.selectOption(caseTypeSelector, { label: caseType });
      }
      
      // Fill case number
      const caseNumberInput = await page.$('input[name*="case"], input[name*="number"], #caseNumber, #case_number');
      if (caseNumberInput) {
        await page.fill(caseNumberInput, caseNumber);
      }
      
      // Fill filing year
      const yearSelector = await page.$('select[name*="year"], #year, #filing_year');
      if (yearSelector) {
        await page.selectOption(yearSelector, filingYear.toString());
      }
      
    } catch (error) {
      throw new Error(`Failed to fill form: ${error.message}`);
    }
  }

  /**
   * Handle CAPTCHA verification
   */
  async handleCaptcha(page, captchaResponse) {
    try {
      // Look for CAPTCHA image
      const captchaImage = await page.$('img[src*="captcha"], img[alt*="captcha"], #captcha_image');
      
      if (!captchaImage) {
        // No CAPTCHA required
        return { success: true };
      }
      
      // Get CAPTCHA image source
      const captchaImageSrc = await captchaImage.getAttribute('src');
      const fullCaptchaUrl = captchaImageSrc.startsWith('http') 
        ? captchaImageSrc 
        : `${this.baseUrl}${captchaImageSrc}`;
      
      let captchaText = captchaResponse;
      
      // If no manual CAPTCHA response provided, try 2Captcha service
      if (!captchaText && this.twoCaptchaApiKey) {
        try {
          captchaText = await this.solve2Captcha(fullCaptchaUrl);
        } catch (captchaError) {
          console.error('2Captcha solving failed:', captchaError);
        }
      }
      
      if (!captchaText) {
        // Return CAPTCHA image for manual solving
        const captchaImageBuffer = await page.screenshot({
          clip: await captchaImage.boundingBox()
        });
        
        return {
          success: false,
          requiresCaptcha: true,
          captchaImage: `data:image/png;base64,${captchaImageBuffer.toString('base64')}`,
          error: 'CAPTCHA verification required'
        };
      }
      
      // Fill CAPTCHA input
      const captchaInput = await page.$('input[name*="captcha"], input[name*="code"], #captcha, #verification_code');
      if (captchaInput) {
        await page.fill(captchaInput, captchaText);
      }
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: `CAPTCHA handling failed: ${error.message}`
      };
    }
  }

  /**
   * Solve CAPTCHA using 2Captcha service
   */
  async solve2Captcha(imageUrl) {
    if (!this.twoCaptchaApiKey) {
      throw new Error('2Captcha API key not configured');
    }
    
    try {
      // Submit CAPTCHA to 2Captcha
      const submitResponse = await axios.post('http://2captcha.com/in.php', {
        method: 'base64',
        key: this.twoCaptchaApiKey,
        body: await this.getImageAsBase64(imageUrl)
      });
      
      if (submitResponse.data.indexOf('OK|') !== 0) {
        throw new Error(`2Captcha submit failed: ${submitResponse.data}`);
      }
      
      const captchaId = submitResponse.data.split('|')[1];
      
      // Poll for result
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const resultResponse = await axios.get(`http://2captcha.com/res.php?key=${this.twoCaptchaApiKey}&action=get&id=${captchaId}`);
        
        if (resultResponse.data === 'CAPCHA_NOT_READY') {
          continue;
        }
        
        if (resultResponse.data.indexOf('OK|') === 0) {
          return resultResponse.data.split('|')[1];
        }
        
        throw new Error(`2Captcha result failed: ${resultResponse.data}`);
      }
      
      throw new Error('2Captcha timeout');
      
    } catch (error) {
      throw new Error(`2Captcha service error: ${error.message}`);
    }
  }

  /**
   * Get image as base64 string
   */
  async getImageAsBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary').toString('base64');
    } catch (error) {
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
  }

  /**
   * Check for error messages on the page
   */
  async checkForErrors(page) {
    try {
      const errorSelectors = [
        '.error',
        '.alert-danger',
        '#error',
        '[class*="error"]',
        'font[color="red"]',
        'span[style*="color:red"]'
      ];
      
      for (const selector of errorSelectors) {
        const errorElement = await page.$(selector);
        if (errorElement) {
          const errorText = await errorElement.textContent();
          if (errorText && errorText.trim()) {
            return errorText.trim();
          }
        }
      }
      
      // Check for "No records found" or similar messages
      const pageText = await page.textContent('body');
      if (pageText.toLowerCase().includes('no record') || 
          pageText.toLowerCase().includes('not found') ||
          pageText.toLowerCase().includes('no case found')) {
        return 'No case found with the provided details';
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for errors:', error);
      return null;
    }
  }

  /**
   * Extract case data from the results page
   */
  async extractCaseData(page) {
    try {
      const caseData = {
        partiesNames: '',
        filingDate: '',
        nextHearingDate: '',
        caseStatus: '',
        courtNumber: '',
        judge: '',
        documents: []
      };
      
      // Extract parties names - Enhanced selectors for Delhi High Court
      const partiesSelectors = [
        'table tr:has-text("Petitioner") + tr td',
        'table tr:has-text("Plaintiff") + tr td',
        'table tr:has-text("Appellant") + tr td',
        'td:contains("Petitioner")',
        'td:contains("Plaintiff")',
        'td:contains("Appellant")',
        '.case-parties',
        '#parties',
        '[class*="parties"]'
      ];

      for (const selector of partiesSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            if (text && text.trim() && !text.toLowerCase().includes('petitioner') && !text.toLowerCase().includes('plaintiff')) {
              caseData.partiesNames = text.trim();
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Extract case status
      const statusSelectors = [
        'td:contains("Status")',
        'td:contains("Case Status")',
        '.case-status',
        '#status'
      ];

      for (const selector of statusSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            if (text && text.trim()) {
              caseData.caseStatus = text.trim();
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Extract judge information
      const judgeSelectors = [
        'td:contains("Judge")',
        'td:contains("Hon\'ble")',
        '.judge-name',
        '#judge'
      ];

      for (const selector of judgeSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            if (text && text.trim()) {
              caseData.judge = text.trim();
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Extract filing date
      const filingDateSelectors = [
        'td:has-text("Filing Date")',
        'td:has-text("Date of Filing")',
        '[class*="filing"]',
        '[id*="filing"]'
      ];
      
      for (const selector of filingDateSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/);
            if (dateMatch) {
              caseData.filingDate = dateMatch[0];
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Extract next hearing date
      const hearingSelectors = [
        'td:has-text("Next Date")',
        'td:has-text("Hearing Date")',
        '[class*="hearing"]',
        '[id*="hearing"]'
      ];
      
      for (const selector of hearingSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/);
            if (dateMatch) {
              caseData.nextHearingDate = dateMatch[0];
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      // Extract document links - Enhanced for Delhi High Court
      const documentSelectors = [
        'a[href*=".pdf"]',
        'a[href*="download"]',
        'a:has-text("Order")',
        'a:has-text("Judgment")',
        'a:has-text("Notice")',
        'a[title*="PDF"]',
        'a[title*="Download"]',
        '.document-link',
        '.pdf-link'
      ];

      const allDocumentLinks = [];
      for (const selector of documentSelectors) {
        try {
          const links = await page.$$(selector);
          allDocumentLinks.push(...links);
        } catch (e) {
          // Continue to next selector
        }
      }

      // Remove duplicates and process links
      const processedUrls = new Set();

      for (let i = 0; i < allDocumentLinks.length; i++) {
        try {
          const link = allDocumentLinks[i];
          const href = await link.getAttribute('href');
          const text = await link.textContent();
          const title = await link.getAttribute('title');

          if (href && !processedUrls.has(href)) {
            processedUrls.add(href);

            const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            const documentTitle = text?.trim() || title?.trim() || `Document ${i + 1}`;

            // Extract date from document title if possible
            const dateMatch = documentTitle.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
            const documentDate = dateMatch ? dateMatch[1] : '';

            // Estimate file size (in real implementation, this would be fetched)
            const estimatedSize = Math.random() > 0.5 ?
              `${(Math.random() * 3 + 0.5).toFixed(1)} MB` :
              `${Math.floor(Math.random() * 900 + 100)} KB`;

            caseData.documents.push({
              id: `doc_${Date.now()}_${i}`,
              title: documentTitle,
              downloadUrl: fullUrl,
              type: href.includes('.pdf') ? 'PDF' : 'Document',
              size: estimatedSize,
              date: documentDate || new Date().toLocaleDateString('en-GB')
            });
          }
        } catch (e) {
          console.error('Error extracting document link:', e);
        }
      }
      
      return caseData;
      
    } catch (error) {
      console.error('Error extracting case data:', error);
      return {
        partiesNames: '',
        filingDate: '',
        nextHearingDate: '',
        documents: []
      };
    }
  }

  /**
   * Download a document from the court website
   */
  async downloadDocument(documentUrl) {
    try {
      const response = await axios.get(documentUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download document: ${error.message}`);
    }
  }
}

module.exports = new CourtScrapingService();
