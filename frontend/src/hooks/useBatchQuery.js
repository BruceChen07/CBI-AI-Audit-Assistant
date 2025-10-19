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

import { useState } from 'react';
import logger from '../utils/logger';

export const useBatchQuery = () => {
  const [batchQueryLoading, setBatchQueryLoading] = useState(false);
  const [batchQueryProgress, setBatchQueryProgress] = useState(0);
  const [batchQueryError, setBatchQueryError] = useState('');
  const [completedQuestionsCount, setCompletedQuestionsCount] = useState(0);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [batchQueryCompleted, setBatchQueryCompleted] = useState(false);
  const [batchQueryStats, setBatchQueryStats] = useState({ total: 0, success: 0, failed: 0 });
  const [failedRecords, setFailedRecords] = useState([]);
  const [sessionId, setSessionId] = useState(null); // Added: store session_id

  const handleBatchQuery = async (data, callback) => {
    if (!data || data.length === 0) {
      setBatchQueryError('No data available for query');
      return;
    }

    logger.info('Starting batch AI query', { rowCount: data.length });
    setBatchQueryLoading(true);
    setBatchQueryError('');
    setBatchQueryProgress(0);
    setCompletedQuestionsCount(0);
    setTotalQuestionsCount(data.length);
    setBatchQueryCompleted(false);
    setBatchQueryStats({ total: 0, success: 0, failed: 0 });
    setSessionId(null); // Reset session_id
    
    try {
      // Use a streaming API to receive real-time progress
      const apiUrl = 'http://localhost:8000/batch-query-stream/';
      logger.debug('Sending streaming batch query request to backend', { url: apiUrl });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              
              if (jsonData.type === 'progress') {
                // Update progress in real time
                setBatchQueryProgress(jsonData.percentage);
                setCompletedQuestionsCount(jsonData.completed);
                setTotalQuestionsCount(jsonData.total);
                logger.debug('Received progress update', { 
                  completed: jsonData.completed, 
                  total: jsonData.total, 
                  percentage: jsonData.percentage 
                });
              } else if (jsonData.type === 'complete') {
                // Processing completed
                setBatchQueryProgress(100);
                setCompletedQuestionsCount(jsonData.data.length);
                
                // Retrieve and store session_id
                if (jsonData.session_id) {
                  setSessionId(jsonData.session_id);
                  logger.info('Received session_id for download', { session_id: jsonData.session_id });
                }
                
                // Invoke callback with processed data
                if (callback && typeof callback === 'function') {
                  callback(jsonData.data);
                }
                
                setBatchQueryCompleted(true);
                
                // Handle statistics
                const statistics = jsonData.statistics || {};
                const failedCount = statistics.failed || 0;
                const failedIndices = statistics.failed_indices || [];
                const successCount = statistics.success || 0;
                const totalCount = statistics.total || jsonData.data.length;
                
                setBatchQueryStats({
                  total: totalCount,
                  success: successCount,
                  failed: failedCount
                });
                
                if (failedCount > 0) {
                  setFailedRecords(failedIndices);
                } else {
                  setFailedRecords([]);
                }
                
                logger.info('Batch AI query completed', { 
                  totalRows: totalCount,
                  successCount: successCount,
                  failedCount: failedCount,
                  session_id: jsonData.session_id
                });
              }
            } catch (parseError) {
              logger.warn('Failed to parse streaming data', { error: parseError.message });
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Error occurred during batch query';
      logger.error('Batch query failed', { error: errorMsg });
      setBatchQueryError(errorMsg);
      setBatchQueryProgress(0);
      setCompletedQuestionsCount(0);
      setTotalQuestionsCount(0);
    } finally {
      setBatchQueryLoading(false);
    }
  };

  return {
    batchQueryLoading,
    batchQueryProgress,
    batchQueryError,
    completedQuestionsCount,
    totalQuestionsCount,
    batchQueryCompleted,
    batchQueryStats,
    failedRecords,
    sessionId, // Added: return session_id
    handleBatchQuery,
    setFailedRecords,
    setBatchQueryCompleted
  };
};