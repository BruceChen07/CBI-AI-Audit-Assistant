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

export const useRetryFailed = () => {
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryProgress, setRetryProgress] = useState(0);
  const [currentRetryRound, setCurrentRetryRound] = useState(0);
  const [retryCanStop, setRetryCanStop] = useState(false);
  const [showFailedRecords, setShowFailedRecords] = useState(false);
  const [selectedFailedIndexes, setSelectedFailedIndexes] = useState([]);

  const handleStopRetry = async () => {
    try {
      const response = await fetch('http://localhost:8000/stop-retry/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        logger.info('Requested to stop retry');
        setRetryCanStop(false);
      }
    } catch (error) {
      logger.error('Stop retry request failed', { error: error.message });
    }
  };

  const handleRetryFailed = async (data, setData, failedRecords, setFailedRecords, setBatchQueryCompleted) => {
    if (selectedFailedIndexes.length === 0) {
      alert('Please select failed records to retry first');
      return;
    }

    logger.info('Starting retry of failed records', { selectedIndexes: selectedFailedIndexes });
    setRetryLoading(true);
    setRetryProgress(0);
    setCurrentRetryRound(0);
    setRetryCanStop(true);

    try {
      const retryData = selectedFailedIndexes.map(index => data[index]);
      const apiUrl = 'http://localhost:8000/retry-failed-stream/';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          failed_indices: selectedFailedIndexes,
          data: retryData,
          max_retry_rounds: 10,
          auto_retry: true
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
                setRetryProgress(jsonData.percentage);
                if (jsonData.round) {
                  setCurrentRetryRound(jsonData.round);
                }
                logger.debug('Retry progress update', { 
                  round: jsonData.round,
                  completed: jsonData.completed, 
                  total: jsonData.total, 
                  percentage: jsonData.percentage 
                });
              } else if (jsonData.type === 'round_completed') {
                logger.info(`Round ${jsonData.round} retry completed`, {
                  round: jsonData.round,
                  successCount: jsonData.success_count,
                  failedCount: jsonData.failed_count,
                  successIndices: jsonData.success_indices,
                  failedIndices: jsonData.failed_indices
                });
                setRetryProgress(0); // Reset progress bar for next round
              } else if (jsonData.type === 'complete') {
                setRetryProgress(100);
                
                // Update retry results in original data
                const updatedData = [...data];
                selectedFailedIndexes.forEach((originalIndex, i) => {
                  if (jsonData.data[i]) {
                    updatedData[originalIndex] = jsonData.data[i];
                  }
                });
                setData(updatedData);
                
                // Update failed records list
                const retryStats = jsonData.retry_statistics || {};
                if (retryStats.still_failed_indices && retryStats.still_failed_indices.length > 0) {
                  setFailedRecords(retryStats.still_failed_indices);
                  logger.info('Multi-round retry completed with remaining failed records', {
                    totalRounds: jsonData.total_rounds,
                    stopReason: jsonData.stop_reason,
                    retrySuccess: retryStats.retry_success,
                    stillFailed: retryStats.still_failed,
                    skipped: retryStats.skipped || 0,
                    stillFailedIndices: retryStats.still_failed_indices,
                    skippedIndices: retryStats.skipped_indices || []
                  });
                } else {
                  setFailedRecords([]);
                  logger.info('Multi-round retry completed, all fixed successfully', { 
                    totalRounds: jsonData.total_rounds,
                    stopReason: jsonData.stop_reason,
                    retrySuccess: retryStats.retry_success,
                    skipped: retryStats.skipped || 0
                  });
                }
                
                setSelectedFailedIndexes([]);
                setCurrentRetryRound(0);
                setRetryCanStop(false);
                setBatchQueryCompleted(true);
                setTimeout(() => {
                  setRetryProgress(0);
                }, 2000);
                break;
              } else if (jsonData.type === 'error') {
                throw new Error(jsonData.error || 'Retry failed');
              }
            } catch (parseError) {
              logger.warn('Error parsing retry response', { error: parseError.message, line });
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Error occurred during retry';
      logger.error('Retry failed', { error: errorMsg });
      alert(`Retry failed: ${errorMsg}`);
      setRetryProgress(0);
      setCurrentRetryRound(0);
      setRetryCanStop(false);
    } finally {
      setRetryLoading(false);
    }
  };

  const toggleFailedRecordSelection = (index) => {
    setSelectedFailedIndexes(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const toggleSelectAllFailedRecords = (failedRecords) => {
    if (selectedFailedIndexes.length === failedRecords.length) {
      setSelectedFailedIndexes([]);
    } else {
      setSelectedFailedIndexes([...failedRecords]);
    }
  };

  return {
    retryLoading,
    retryProgress,
    currentRetryRound,
    retryCanStop,
    showFailedRecords,
    selectedFailedIndexes,
    handleStopRetry,
    handleRetryFailed,
    toggleFailedRecordSelection,
    toggleSelectAllFailedRecords,
    setShowFailedRecords
  };
};