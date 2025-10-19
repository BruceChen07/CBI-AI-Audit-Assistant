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

import React from 'react';
import { useRetryFailed } from '../hooks/useRetryFailed';

const FailedRecordsRetry = ({ 
  failedRecords, 
  data, 
  onDataChange, 
  onFailedRecordsChange, 
  onBatchCompleteChange 
}) => {
  const {
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
  } = useRetryFailed();

  const handleRetryClick = () => {
    handleRetryFailed(
      data, 
      onDataChange, 
      failedRecords, 
      onFailedRecordsChange, 
      onBatchCompleteChange
    );
  };

  const handleToggleSelectAll = () => {
    toggleSelectAllFailedRecords(failedRecords);
  };

  if (!failedRecords || failedRecords.length === 0) {
    return null;
  }

  return (
    <div className="failed-records-section">
      <div className="failed-records-header">
        <span className="failed-count">⚠️ Found {failedRecords.length} failed records</span>
        <button 
          className="toggle-failed-records-button"
          onClick={() => setShowFailedRecords(!showFailedRecords)}
        >
          {showFailedRecords ? 'Hide Failed Records' : 'View Failed Records'}
        </button>
      </div>
      
      {showFailedRecords && (
        <div className="failed-records-list">
          <div className="failed-records-controls">
            <button 
              className="select-all-button"
              onClick={handleToggleSelectAll}
            >
              {selectedFailedIndexes.length === failedRecords.length ? 'Deselect All' : 'Select All'}
            </button>
            <button 
              className="retry-button"
              onClick={handleRetryClick}
              disabled={retryLoading || selectedFailedIndexes.length === 0}
            >
              {retryLoading ? 'Retrying...' : `Retry Selected ${selectedFailedIndexes.length} Records`}
            </button>
            {retryCanStop && (
              <button 
                className="stop-retry-button"
                onClick={handleStopRetry}
                style={{marginLeft: '10px', backgroundColor: '#ff4444', color: 'white'}}
              >
                Stop Retry
              </button>
            )}
          </div>
          
          {retryLoading && (
            <div className="retry-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${retryProgress}%`}}></div>
              </div>
              <div className="progress-text">
                {currentRetryRound > 0 && `Round ${currentRetryRound} Retry - `}
                Retry Progress: {Math.round(retryProgress)}%
              </div>
            </div>
          )}
          
          <div className="failed-records-items">
            {failedRecords.map((index) => (
              <div key={index} className="failed-record-item">
                <input 
                  type="checkbox"
                  checked={selectedFailedIndexes.includes(index)}
                  onChange={() => toggleFailedRecordSelection(index)}
                />
                <span className="record-index">Record #{index + 1}</span>
                <span className="record-content">
                  {data[index] && (data[index]['Hint'] || data[index]['AET'] || 'Unknown content')}
                </span>
                {data[index] && data[index]['Error Message'] && (
                  <span className="error-message">
                    Error: {data[index]['Error Message']}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedRecordsRetry;