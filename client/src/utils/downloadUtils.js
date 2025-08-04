import toast from 'react-hot-toast'

/**
 * Download a PDF file with progress tracking and error handling
 */
export const downloadPDF = async (documentId, filename, onProgress = null) => {
  const toastId = `download-${documentId}`
  
  try {
    // Show initial loading toast
    toast.loading(`Preparing download for ${filename}...`, { id: toastId })
    
    // Get auth token - for development, we'll use test endpoints if no token
    const token = localStorage.getItem('token')
    const isDevelopment = import.meta.env.DEV

    // Use test endpoints in development if no token available
    const useTestEndpoints = isDevelopment && !token

    // Check file availability first
    const fileInfoUrl = useTestEndpoints
      ? `/api/court/test/file-info/${documentId}`
      : `/api/court/file-info/${documentId}`

    const fileInfoHeaders = {
      'Content-Type': 'application/json'
    }

    if (token) {
      fileInfoHeaders['Authorization'] = `Bearer ${token}`
    }

    const fileInfoResponse = await fetch(fileInfoUrl, {
      headers: fileInfoHeaders
    })

    if (!fileInfoResponse.ok) {
      const errorData = await fileInfoResponse.json()
      throw new Error(errorData.message || 'Failed to check file availability')
    }

    const fileInfo = await fileInfoResponse.json()
    
    if (!fileInfo.data.available) {
      throw new Error('File is not available for download')
    }

    // Update toast with file size info
    const fileSizeText = formatFileSize(fileInfo.data.size)
    toast.loading(`Downloading ${filename} (${fileSizeText})...`, { id: toastId })

    // Start the actual download
    const downloadUrl = useTestEndpoints
      ? `/api/court/test/download/${documentId}`
      : `/api/court/download/${documentId}`

    const downloadHeaders = {
      'Accept': 'application/pdf'
    }

    if (token) {
      downloadHeaders['Authorization'] = `Bearer ${token}`
    }

    const downloadResponse = await fetch(downloadUrl, {
      method: 'GET',
      headers: downloadHeaders
    })

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text()
      let errorMessage = 'Download failed'
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = downloadResponse.statusText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    // Check if response is actually a PDF
    const contentType = downloadResponse.headers.get('content-type')
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Invalid file format received')
    }

    // Get the blob
    const blob = await downloadResponse.blob()
    
    if (blob.size === 0) {
      throw new Error('Empty file received')
    }

    // Validate PDF content
    const arrayBuffer = await blob.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const header = new TextDecoder().decode(uint8Array.slice(0, 8))
    
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid PDF file format')
    }

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // Success toast
    toast.success(`${filename} downloaded successfully!`, { id: toastId })
    
    return {
      success: true,
      filename: link.download,
      size: blob.size
    }
    
  } catch (error) {
    console.error('Download error:', error)
    
    // Show error toast with specific message
    let errorMessage = error.message
    
    if (error.message.includes('Authentication')) {
      errorMessage = 'Please log in to download files'
    } else if (error.message.includes('Network')) {
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error.message.includes('not available')) {
      errorMessage = 'This document is temporarily unavailable. Please try again later.'
    } else if (error.message.includes('Invalid file format')) {
      errorMessage = 'The file format is not supported or the file is corrupted.'
    }
    
    toast.error(errorMessage, { id: toastId })
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Format file size in human readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Check if a file is downloadable
 */
export const checkFileAvailability = async (documentId) => {
  try {
    const token = localStorage.getItem('token')
    const isDevelopment = import.meta.env.DEV
    const useTestEndpoints = isDevelopment && !token

    const fileInfoUrl = useTestEndpoints
      ? `/api/court/test/file-info/${documentId}`
      : `/api/court/file-info/${documentId}`

    const headers = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(fileInfoUrl, {
      headers
    })

    if (!response.ok) {
      return { available: false, error: 'Failed to check file availability' }
    }

    const data = await response.json()
    return {
      available: data.data.available,
      size: data.data.size,
      type: data.data.type,
      lastModified: data.data.lastModified
    }
    
  } catch (error) {
    return { available: false, error: error.message }
  }
}

/**
 * Retry download with exponential backoff
 */
export const retryDownload = async (documentId, filename, maxRetries = 3) => {
  let lastError = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await downloadPDF(documentId, filename)
      if (result.success) {
        return result
      }
      lastError = result.error
    } catch (error) {
      lastError = error.message
    }
    
    if (attempt < maxRetries) {
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      
      toast.loading(`Retrying download... (Attempt ${attempt + 1}/${maxRetries})`, {
        id: `retry-${documentId}`
      })
    }
  }
  
  toast.error(`Download failed after ${maxRetries} attempts: ${lastError}`, {
    id: `retry-${documentId}`
  })
  
  return { success: false, error: lastError }
}
