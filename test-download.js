const axios = require('axios');
const fs = require('fs');

async function testDownload() {
  try {
    console.log('Testing PDF download functionality...');
    
    // Test the download endpoint directly (using test endpoint)
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:3001/api/court/test/download/test-doc-1',
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Length:', response.headers['content-length']);
    
    if (response.status === 200) {
      const buffer = Buffer.from(response.data);
      console.log('PDF buffer size:', buffer.length, 'bytes');
      
      // Check PDF header
      const header = buffer.slice(0, 8).toString('ascii');
      console.log('PDF header:', header);
      
      if (header.startsWith('%PDF-')) {
        console.log('✅ Valid PDF file received');
        
        // Save to file for verification
        fs.writeFileSync('test-download.pdf', buffer);
        console.log('✅ PDF saved as test-download.pdf');
        
        return true;
      } else {
        console.log('❌ Invalid PDF format');
        return false;
      }
    } else {
      console.log('❌ Download failed with status:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Download test failed:', error.message);
    
    if (error.response) {
      console.log('Error status:', error.response.status);
      console.log('Error data:', error.response.data);
    }
    
    return false;
  }
}

// Test file info endpoint
async function testFileInfo() {
  try {
    console.log('\nTesting file info endpoint...');
    
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:3001/api/court/test/file-info/test-doc-1',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('File info response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.available) {
      console.log('✅ File info endpoint working correctly');
      return true;
    } else {
      console.log('❌ File info indicates file not available');
      return false;
    }
    
  } catch (error) {
    console.error('❌ File info test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting PDF download tests...\n');
  
  const fileInfoResult = await testFileInfo();
  const downloadResult = await testDownload();
  
  console.log('\n📊 Test Results:');
  console.log('File Info:', fileInfoResult ? '✅ PASS' : '❌ FAIL');
  console.log('PDF Download:', downloadResult ? '✅ PASS' : '❌ FAIL');
  
  if (fileInfoResult && downloadResult) {
    console.log('\n🎉 All tests passed! PDF download functionality is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
  }
}

runTests();
