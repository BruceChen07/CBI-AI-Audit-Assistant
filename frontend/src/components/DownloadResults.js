/*
 * Author: Bruce Chen <bruce.chen@effem.com>
 * Date: 2025-08-29
 * 
 * Copyright (c) 2025 Mars Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import React, { useState } from 'react';
import logger from '../utils/logger';

const DownloadResults = ({ data, batchQueryStats, batchQueryCompleted, sessionId }) => {
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Use the new download architecture: download directly from backend cache via session_id
  const handleDownload = async () => {
    if (!sessionId) {
      alert('Session ID not available, please retry the batch query');
      return;
    }
  
    if (!batchQueryCompleted) {
      alert('Batch query not completed yet');
      return;
    }
    
    try {
      setDownloadLoading(true);
      
      console.log('Downloading Excel file using session_id:', sessionId);
      logger.info('Starting Excel download with session_id', { session_id: sessionId });
      
      // Use the new download endpoint: download directly via session_id
      const response = await fetch(`http://localhost:8000/download-excel/${sessionId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session data not found or expired, please retry the batch query');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'audit_results.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Get file blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Excel file downloaded successfully:', filename);
      logger.info('Excel download completed successfully', { filename, session_id: sessionId });
    } catch (error) {
      console.error('Download failed:', error);
      logger.error('Excel download failed', { error: error.message, session_id: sessionId });
      alert(`Download failed: ${error.message}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Always render the download section; disable the button based on state
  const disabled = !batchQueryCompleted || !sessionId || downloadLoading;
  const title = !batchQueryCompleted
    ? 'AI processing in progress...'
    : (!sessionId ? 'Waiting for session to be ready...' : 'Download Excel file with AI processing results');

  return (
    <div className="download-section">
      <div className="results-info">
        <p>📊 Data {data && data.length ? `ready: ${data.length} records` : 'not ready yet'}</p>
        {!batchQueryCompleted && <p>⌛ AI processing in progress, please wait...</p>}
        {batchQueryCompleted && !sessionId && <p>⚠️ Session is preparing, please wait...</p>}
        {batchQueryCompleted && sessionId && <p>✅ AI processing completed, click to download Excel file</p>}
      </div>
      <button 
        className="download-button"
        onClick={handleDownload}
        disabled={disabled}
        title={title}
      >
        {downloadLoading ? '🔄 Downloading...' : '📥 Download Results'}
      </button>
    </div>
  );
};

export default DownloadResults;