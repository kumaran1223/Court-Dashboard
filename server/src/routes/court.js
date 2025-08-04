const express = require('express');
const Joi = require('joi');
const { createClient } = require('@supabase/supabase-js');
const courtScrapingService = require('../services/courtScraping');
const downloadService = require('../services/downloadService');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mock PDF generation function for testing
async function generateMockPDF(document) {
  // Create a simple PDF buffer for testing
  // In production, this would fetch the actual PDF from the court website
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
/Length 200
>>
stream
BT
/F1 12 Tf
100 700 Td
(${document.title}) Tj
0 -20 Td
(Document ID: ${document.id}) Tj
0 -20 Td
(Generated: ${new Date().toISOString()}) Tj
0 -40 Td
(This is a mock PDF document for testing purposes.) Tj
0 -20 Td
(In production, this would be the actual court document.) Tj
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
0000000524 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
621
%%EOF`;

  return Buffer.from(pdfContent, 'utf8');
}

// Validation schema for court query
const courtQuerySchema = Joi.object({
  caseType: Joi.string().valid(
    'Civil',
    'Criminal',
    'Writ Petition',
    'Company Petition',
    'Arbitration Petition',
    'Execution Petition',
    'Contempt Petition',
    'Miscellaneous'
  ).required(),
  caseNumber: Joi.string().pattern(/^[A-Za-z0-9\/\-\s]+$/).min(1).max(50).required(),
  filingYear: Joi.number().integer().min(2000).max(2025).required(),
  captchaResponse: Joi.string().optional()
});

// Search court cases endpoint
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { error: validationError, value } = courtQuerySchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationError.details[0].message,
        details: validationError.details
      });
    }

    const { caseType, caseNumber, filingYear, captchaResponse } = value;
    const userId = req.user.id;

    // Log the query attempt
    const queryLog = {
      user_id: userId,
      case_type: caseType,
      case_number: caseNumber,
      filing_year: filingYear,
      query_timestamp: new Date().toISOString(),
      status: 'initiated'
    };

    const { data: logData, error: logError } = await supabase
      .from('case_queries')
      .insert(queryLog)
      .select()
      .single();

    if (logError) {
      console.error('Failed to log query:', logError);
    }

    // Perform the court website scraping
    const scrapingResult = await courtScrapingService.searchCase({
      caseType,
      caseNumber,
      filingYear,
      captchaResponse
    });

    // Update the query log with results
    if (logData) {
      await supabase
        .from('case_queries')
        .update({
          status: scrapingResult.success ? 'completed' : 'failed',
          raw_response: JSON.stringify(scrapingResult),
          error_message: scrapingResult.error || null
        })
        .eq('id', logData.id);
    }

    if (!scrapingResult.success) {
      return res.status(400).json({
        error: 'Scraping Error',
        message: scrapingResult.error,
        requiresCaptcha: scrapingResult.requiresCaptcha,
        captchaImage: scrapingResult.captchaImage
      });
    }

    res.status(200).json({
      success: true,
      data: scrapingResult.data,
      queryId: logData?.id
    });

  } catch (error) {
    console.error('Court search error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search court records'
    });
  }
});

// Get case details by query ID
router.get('/case/:queryId', authMiddleware, async (req, res) => {
  try {
    const queryId = req.params.queryId;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('case_queries')
      .select('*')
      .eq('id', queryId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Query not found or access denied'
      });
    }

    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(data.raw_response || '{}');
    } catch (parseError) {
      console.error('Failed to parse raw response:', parseError);
    }

    res.status(200).json({
      query: {
        id: data.id,
        caseType: data.case_type,
        caseNumber: data.case_number,
        filingYear: data.filing_year,
        timestamp: data.query_timestamp,
        status: data.status
      },
      result: parsedResponse
    });

  } catch (error) {
    console.error('Get case details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve case details'
    });
  }
});

// Download PDF endpoint with enhanced error handling and streaming
router.get('/download/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    console.log(`PDF download request - User: ${userId}, Document: ${documentId}`);

    // For demo purposes, we'll create a mock PDF document
    // In production, this would fetch from the actual court website
    const mockDocument = {
      id: documentId,
      title: `Court Document ${documentId}`,
      downloadUrl: `https://example.com/documents/${documentId}.pdf`
    };

    try {
      // Generate a mock PDF for demonstration using the download service
      const pdfBuffer = await downloadService.generateMockPDF(mockDocument);

      // Set proper headers for PDF download
      const filename = `${mockDocument.title.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');

      console.log(`PDF download successful - Size: ${pdfBuffer.length} bytes, Filename: ${filename}`);
      res.send(pdfBuffer);

    } catch (downloadError) {
      console.error('PDF generation error:', downloadError);
      return res.status(503).json({
        error: 'Download Failed',
        message: downloadError.message || 'PDF generation failed. Please try again later.',
        details: downloadError.stack,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to download document',
      details: error.message
    });
  }
});

// Retry failed query
router.post('/retry/:queryId', authMiddleware, async (req, res) => {
  try {
    const queryId = req.params.queryId;
    const userId = req.user.id;
    const { captchaResponse } = req.body;

    // Get the original query
    const { data: originalQuery, error: queryError } = await supabase
      .from('case_queries')
      .select('*')
      .eq('id', queryId)
      .eq('user_id', userId)
      .single();

    if (queryError || !originalQuery) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Query not found or access denied'
      });
    }

    // Retry the scraping
    const scrapingResult = await courtScrapingService.searchCase({
      caseType: originalQuery.case_type,
      caseNumber: originalQuery.case_number,
      filingYear: originalQuery.filing_year,
      captchaResponse
    });

    // Update the query log
    await supabase
      .from('case_queries')
      .update({
        status: scrapingResult.success ? 'completed' : 'failed',
        raw_response: JSON.stringify(scrapingResult),
        error_message: scrapingResult.error || null,
        query_timestamp: new Date().toISOString()
      })
      .eq('id', queryId);

    if (!scrapingResult.success) {
      return res.status(400).json({
        error: 'Scraping Error',
        message: scrapingResult.error,
        requiresCaptcha: scrapingResult.requiresCaptcha,
        captchaImage: scrapingResult.captchaImage
      });
    }

    res.status(200).json({
      success: true,
      data: scrapingResult.data,
      queryId: queryId
    });

  } catch (error) {
    console.error('Retry query error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retry query'
    });
  }
});

// Check file availability endpoint
router.get('/file-info/:documentId', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    console.log(`File info request - User: ${userId}, Document: ${documentId}`);

    // For demo purposes, return mock file info
    const mockFileInfo = {
      id: documentId,
      available: true,
      size: Math.floor(Math.random() * 2000000 + 100000), // Random size between 100KB and 2MB
      type: 'application/pdf',
      lastModified: new Date().toISOString(),
      downloadUrl: `/api/court/download/${documentId}`
    };

    res.json({
      success: true,
      data: mockFileInfo
    });

  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get file information'
    });
  }
});

// Test endpoints (no auth required) - for development/testing only
if (process.env.NODE_ENV === 'development') {
  // Test download endpoint without authentication
  router.get('/test/download/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;

      console.log(`Test PDF download request - Document: ${documentId}`);

      const mockDocument = {
        id: documentId,
        title: `Test Court Document ${documentId}`,
        downloadUrl: `https://example.com/documents/${documentId}.pdf`
      };

      try {
        const pdfBuffer = await downloadService.generateMockPDF(mockDocument);

        const filename = `${mockDocument.title.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length');

        console.log(`Test PDF download successful - Size: ${pdfBuffer.length} bytes, Filename: ${filename}`);
        res.send(pdfBuffer);

      } catch (downloadError) {
        console.error('Test PDF generation error:', downloadError);
        return res.status(503).json({
          error: 'Download Failed',
          message: downloadError.message || 'PDF generation failed. Please try again later.',
          details: downloadError.stack,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Test download PDF error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to download document',
        details: error.message
      });
    }
  });

  // Test file info endpoint without authentication
  router.get('/test/file-info/:documentId', async (req, res) => {
    try {
      const { documentId } = req.params;

      console.log(`Test file info request - Document: ${documentId}`);

      const mockFileInfo = {
        id: documentId,
        available: true,
        size: Math.floor(Math.random() * 2000000 + 100000),
        type: 'application/pdf',
        lastModified: new Date().toISOString(),
        downloadUrl: `/api/court/test/download/${documentId}`
      };

      res.json({
        success: true,
        data: mockFileInfo
      });

    } catch (error) {
      console.error('Test file info error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get file information'
      });
    }
  });
}

module.exports = router;
