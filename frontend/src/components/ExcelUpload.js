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
import { useExcelUpload } from '../hooks/useExcelUpload';

const ExcelUpload = ({ onDataChange }) => {
  const {
    file,
    loading,
    error,
    data,
    handleFileChange,
    handleSubmit
  } = useExcelUpload();

  // Notify parent component when data changes
  React.useEffect(() => {
    if (onDataChange) {
      onDataChange(data);
    }
  }, [data, onDataChange]);

  return (
    <div className="upload-section excel-section">
      <h3>1. Select Audit Template Excel File</h3>
      <form onSubmit={handleSubmit}>
        <div className="file-input-container">
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept=".xlsx,.xls"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="file-label">
            {file ? file.name : 'Select Excel File'}
          </label>
        </div>
        <button type="submit" disabled={loading || !file} className="upload-button">
          {loading ? 'Processing...' : 'Upload'}
        </button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {data && (
        <div className="success-message">
          ✅ Excel file uploaded successfully! Read {data.length} data records.
        </div>
      )}
    </div>
  );
};

export default ExcelUpload;