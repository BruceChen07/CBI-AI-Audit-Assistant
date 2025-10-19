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
import React, { useEffect } from 'react';
import { useBatchQuery } from '../hooks/useBatchQuery';

const BatchProcessing = ({ data, pdfUploaded, onReadyForDownload, onDataChange, onSessionIdChange, onBatchQueryStatsChange }) => {
  const {
    batchQueryLoading,
    batchQueryProgress,
    batchQueryError,
    completedQuestionsCount,
    totalQuestionsCount,
    batchQueryCompleted,
    batchQueryStats,
    sessionId,
    handleBatchQuery,
  } = useBatchQuery();

  // Listen for sessionId changes and notify the parent component
  useEffect(() => {
    if (sessionId && onSessionIdChange) {
      console.log('BatchProcessing - sessionId updated:', sessionId);
      onSessionIdChange(sessionId);
    }
  }, [sessionId, onSessionIdChange]);

  // Listen for batchQueryStats changes and notify the parent component
  useEffect(() => {
    if (batchQueryStats && onBatchQueryStatsChange) {
      console.log('BatchProcessing - batchQueryStats updated:', batchQueryStats);
      onBatchQueryStatsChange(batchQueryStats);
    }
  }, [batchQueryStats, onBatchQueryStatsChange]);

  // Listen for batch query completion status
  useEffect(() => {
    if (batchQueryCompleted && onReadyForDownload) {
      console.log('BatchProcessing - Batch query completed, setting ready for download');
      setTimeout(() => {
        onReadyForDownload(true);
      }, 100);
    }
  }, [batchQueryCompleted, onReadyForDownload]);

  const handleStartProcessing = async () => {
    if (!data || data.length === 0) {
      alert('Please upload an Excel file first');
      return;
    }
    
    if (!pdfUploaded) {
      alert('Please upload a PDF file first');
      return;
    }
    
    await handleBatchQuery(data, (newData) => {
      console.log('Batch query completed with data:', newData);
      
      // Pass a source flag to prevent the parent from resetting sessionId
      if (onDataChange) {
        onDataChange(newData, { fromBatch: true });
      }
    });
  };

  return (
    <div className="batch-process-section">
      <button 
        className="batch-process-button"
        onClick={handleStartProcessing}
        disabled={batchQueryLoading || !data || data.length === 0 || !pdfUploaded}
      >
        {batchQueryLoading ? 'In batch processing...' : 'Start batch AI processing'}
      </button>
      
      {/* Progress bar display */}
      {batchQueryLoading && (
        <div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width: `${batchQueryProgress}%`}}></div>
          </div>
          <div className="progress-text">
            Batch processing progress: {completedQuestionsCount}/{totalQuestionsCount} records ({Math.round(batchQueryProgress)}%)
            {batchQueryProgress === 100 && ' - Processing completed!'}
          </div>
        </div>
      )}
      
      {/* Error message display */}
      {batchQueryError && <div className="error-message">{batchQueryError}</div>}
      
      {/* Ready for processing information */}
      {data && data.length > 0 && pdfUploaded && !batchQueryLoading && !batchQueryCompleted && (
        <div className="ready-message">
          ✅ Data is ready for batch processing, {data.length} records available for AI query
        </div>
      )}
      
      {/* Complete status display */}
      {batchQueryCompleted && batchQueryStats && (
        <div className="completion-message">
          📊 Batch processing completed! Processed {batchQueryStats.total} records, {batchQueryStats.success} successful, {batchQueryStats.failed} failed
        </div>
      )}
    </div>
  );
};

export default BatchProcessing;