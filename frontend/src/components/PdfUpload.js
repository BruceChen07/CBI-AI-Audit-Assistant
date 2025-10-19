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
import { usePdfUpload } from '../hooks/usePdfUpload';

const PdfUpload = ({ onUploadStatusChange }) => {
  const {
    pdfFile,
    pdfLoading,
    pdfError,
    pdfUploaded,
    handlePdfFileChange,
    handlePdfSubmit
  } = usePdfUpload();

  // Notify parent component when upload status changes
  React.useEffect(() => {
    if (onUploadStatusChange) {
      onUploadStatusChange(pdfUploaded);
    }
  }, [pdfUploaded, onUploadStatusChange]);

  return (
    <div className="upload-section pdf-section">
      <h3>2. Select Supplier Report</h3>
      <form onSubmit={handlePdfSubmit}>
        <div className="file-input-container">
          <input 
            type="file" 
            onChange={handlePdfFileChange} 
            accept=".pdf"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="file-label">
            {pdfFile ? pdfFile.name : 'Select PDF File'}
          </label>
        </div>
        <button type="submit" disabled={pdfLoading || !pdfFile} className="upload-button">
          {pdfLoading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {pdfError && <div className="error-message">{pdfError}</div>}
      {pdfUploaded && (
        <div className="success-message">
          ✅ PDF file uploaded successfully! You can now start AI queries.
        </div>
      )}
    </div>
  );
};

export default PdfUpload;