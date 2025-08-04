const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get query history with pagination and filters
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 10,
      caseType,
      filingYear,
      status,
      sortBy = 'query_timestamp',
      sortOrder = 'desc'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    let query = supabase
      .from('case_queries')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (caseType) {
      query = query.eq('case_type', caseType);
    }
    if (filingYear) {
      query = query.eq('filing_year', parseInt(filingYear));
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Query history error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve query history'
      });
    }

    // Parse raw responses for summary data
    const processedData = data.map(query => {
      let summary = null;
      try {
        const rawResponse = JSON.parse(query.raw_response || '{}');
        if (rawResponse.data) {
          summary = {
            partiesNames: rawResponse.data.partiesNames,
            filingDate: rawResponse.data.filingDate,
            nextHearingDate: rawResponse.data.nextHearingDate,
            documentsCount: rawResponse.data.documents?.length || 0
          };
        }
      } catch (parseError) {
        console.error('Failed to parse raw response:', parseError);
      }

      return {
        id: query.id,
        caseType: query.case_type,
        caseNumber: query.case_number,
        filingYear: query.filing_year,
        timestamp: query.query_timestamp,
        status: query.status,
        errorMessage: query.error_message,
        summary
      };
    });

    res.status(200).json({
      queries: processedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get query history error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve query history'
    });
  }
});

// Get query statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total queries count
    const { count: totalQueries } = await supabase
      .from('case_queries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get successful queries count
    const { count: successfulQueries } = await supabase
      .from('case_queries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get queries by case type
    const { data: caseTypeStats } = await supabase
      .from('case_queries')
      .select('case_type')
      .eq('user_id', userId);

    const caseTypeCount = caseTypeStats.reduce((acc, query) => {
      acc[query.case_type] = (acc[query.case_type] || 0) + 1;
      return acc;
    }, {});

    // Get queries by year
    const { data: yearStats } = await supabase
      .from('case_queries')
      .select('filing_year')
      .eq('user_id', userId);

    const yearCount = yearStats.reduce((acc, query) => {
      acc[query.filing_year] = (acc[query.filing_year] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentQueries } = await supabase
      .from('case_queries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('query_timestamp', thirtyDaysAgo.toISOString());

    res.status(200).json({
      totalQueries: totalQueries || 0,
      successfulQueries: successfulQueries || 0,
      successRate: totalQueries > 0 ? ((successfulQueries || 0) / totalQueries * 100).toFixed(1) : 0,
      recentQueries: recentQueries || 0,
      caseTypeDistribution: caseTypeCount,
      yearDistribution: yearCount
    });

  } catch (error) {
    console.error('Get query stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve query statistics'
    });
  }
});

// Export query history as CSV
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { caseType, filingYear, status } = req.query;

    // Build query
    let query = supabase
      .from('case_queries')
      .select('*')
      .eq('user_id', userId);

    // Apply filters
    if (caseType) {
      query = query.eq('case_type', caseType);
    }
    if (filingYear) {
      query = query.eq('filing_year', parseInt(filingYear));
    }
    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('query_timestamp', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Export query error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve data for export'
      });
    }

    // Prepare CSV data
    const csvData = data.map(query => {
      let partiesNames = '';
      let filingDate = '';
      let nextHearingDate = '';
      let documentsCount = 0;

      try {
        const rawResponse = JSON.parse(query.raw_response || '{}');
        if (rawResponse.data) {
          partiesNames = rawResponse.data.partiesNames || '';
          filingDate = rawResponse.data.filingDate || '';
          nextHearingDate = rawResponse.data.nextHearingDate || '';
          documentsCount = rawResponse.data.documents?.length || 0;
        }
      } catch (parseError) {
        console.error('Failed to parse raw response for export:', parseError);
      }

      return {
        id: query.id,
        caseType: query.case_type,
        caseNumber: query.case_number,
        filingYear: query.filing_year,
        queryTimestamp: query.query_timestamp,
        status: query.status,
        partiesNames,
        filingDate,
        nextHearingDate,
        documentsCount,
        errorMessage: query.error_message || ''
      };
    });

    // Create temporary CSV file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `court-queries-${timestamp}.csv`;
    const filepath = path.join(__dirname, '../../temp', filename);

    // Ensure temp directory exists
    const tempDir = path.dirname(filepath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const csvWriter = createCsvWriter({
      path: filepath,
      header: [
        { id: 'id', title: 'Query ID' },
        { id: 'caseType', title: 'Case Type' },
        { id: 'caseNumber', title: 'Case Number' },
        { id: 'filingYear', title: 'Filing Year' },
        { id: 'queryTimestamp', title: 'Query Timestamp' },
        { id: 'status', title: 'Status' },
        { id: 'partiesNames', title: 'Parties Names' },
        { id: 'filingDate', title: 'Filing Date' },
        { id: 'nextHearingDate', title: 'Next Hearing Date' },
        { id: 'documentsCount', title: 'Documents Count' },
        { id: 'errorMessage', title: 'Error Message' }
      ]
    });

    await csvWriter.writeRecords(csvData);

    // Send file and clean up
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up temporary file
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Failed to delete temporary file:', unlinkErr);
        }
      });
    });

  } catch (error) {
    console.error('Export queries error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to export query history'
    });
  }
});

// Delete query
router.delete('/:queryId', authMiddleware, async (req, res) => {
  try {
    const queryId = req.params.queryId;
    const userId = req.user.id;

    const { error } = await supabase
      .from('case_queries')
      .delete()
      .eq('id', queryId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete query error:', error);
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to delete query'
      });
    }

    res.status(200).json({
      message: 'Query deleted successfully'
    });

  } catch (error) {
    console.error('Delete query error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete query'
    });
  }
});

module.exports = router;
