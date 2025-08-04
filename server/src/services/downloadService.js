const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DownloadService {
  constructor() {
    this.downloadTimeout = 30000; // 30 seconds
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
  }

  /**
   * Download a PDF document with proper error handling and validation
   */
  async downloadPDF(url, options = {}) {
    try {
      console.log(`Starting PDF download from: ${url}`);
      
      const config = {
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: options.timeout || this.downloadTimeout,
        maxContentLength: options.maxSize || this.maxFileSize,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/pdf,application/octet-stream,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      };

      const response = await axios(config);
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = Buffer.from(response.data);
      
      // Validate PDF content
      await this.validatePDF(buffer);
      
      console.log(`PDF download successful - Size: ${buffer.length} bytes`);
      return buffer;
      
    } catch (error) {
      console.error('PDF download error:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Download timeout - The file is taking too long to download');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Network error - Unable to reach the download server');
      } else if (error.response?.status === 404) {
        throw new Error('File not found - The document may have been moved or deleted');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied - You may not have permission to download this file');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - The download server is currently unavailable');
      } else {
        throw new Error(`Download failed: ${error.message}`);
      }
    }
  }

  /**
   * Validate that the downloaded content is a valid PDF
   */
  async validatePDF(buffer) {
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file received');
    }

    // Check minimum PDF size (should be at least a few hundred bytes)
    if (buffer.length < 100) {
      throw new Error('File too small to be a valid PDF');
    }

    // Check PDF magic number
    const header = buffer.slice(0, 8).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid PDF format - File is not a valid PDF document');
    }

    // Check for PDF trailer
    const trailer = buffer.slice(-1024).toString('ascii');
    if (!trailer.includes('%%EOF')) {
      throw new Error('Corrupted PDF - File appears to be incomplete');
    }

    return true;
  }

  /**
   * Generate a mock PDF for testing purposes
   */
  async generateMockPDF(document) {
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 300
>>
stream
BT
/F1 16 Tf
50 750 Td
(DELHI HIGH COURT) Tj
0 -30 Td
/F1 12 Tf
(${document.title || 'Court Document'}) Tj
0 -25 Td
(Document ID: ${document.id || 'N/A'}) Tj
0 -25 Td
(Generated: ${new Date().toLocaleString()}) Tj
0 -40 Td
(This is a mock PDF document for testing purposes.) Tj
0 -20 Td
(In production, this would contain the actual court document.) Tj
0 -20 Td
(The document would include orders, judgments, notices, etc.) Tj
0 -40 Td
(Status: Available for Download) Tj
0 -20 Td
(File Size: ${Math.floor(Math.random() * 1000 + 100)} KB) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000624 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
721
%%EOF`;

    const buffer = Buffer.from(pdfContent, 'utf8');
    
    // Validate the generated PDF
    await this.validatePDF(buffer);
    
    return buffer;
  }

  /**
   * Get file information without downloading the entire file
   */
  async getFileInfo(url) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      return {
        size: parseInt(response.headers['content-length']) || 0,
        type: response.headers['content-type'] || 'application/octet-stream',
        lastModified: response.headers['last-modified'] || null,
        available: response.status === 200
      };
    } catch (error) {
      return {
        size: 0,
        type: 'unknown',
        lastModified: null,
        available: false,
        error: error.message
      };
    }
  }
}

module.exports = new DownloadService();
