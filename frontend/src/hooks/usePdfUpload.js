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

export const usePdfUpload = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfUploaded, setPdfUploaded] = useState(false);

  const handlePdfFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      logger.info('User selected PDF file', { fileName: selectedFile.name, fileSize: selectedFile.size });
      
      // Check file type
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        const errorMsg = 'Please upload a PDF file (.pdf format)';
        logger.warn('Unsupported PDF file format', { fileName: selectedFile.name });
        setPdfError(errorMsg);
        setPdfFile(null);
        return;
      }
      setPdfFile(selectedFile);
      setPdfError('');
      setPdfUploaded(false); // Reset upload state, need to re-upload
      logger.debug('PDF file set to state', { fileName: selectedFile.name });
    }
  };

  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    logger.info('User submitted PDF upload form');
    
    if (!pdfFile) {
      const errorMsg = 'Please select a PDF file';
      logger.warn(errorMsg);
      setPdfError(errorMsg);
      return;
    }

    logger.info('Starting PDF file upload', { fileName: pdfFile.name });
    setPdfLoading(true);
    setPdfError('');

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('query', 'PDF document upload'); // Placeholder query
    
    const startTime = Date.now();
    try {
      const apiUrl = 'http://localhost:8000/upload-pdf/';
      logger.debug('Sending PDF upload request to backend', { url: apiUrl });
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('PDF server returned error', { status: response.status, error: errorData });
        throw new Error(errorData.detail || 'PDF upload failed');
      }

      const result = await response.json();
      logger.info('PDF uploaded successfully', { 
        fileName: pdfFile.name, 
        success: result.success,
        responseTime: Date.now() - startTime
      });
      setPdfUploaded(true); // Mark PDF as successfully uploaded
    } catch (err) {
      const errorMsg = err.message || 'Error occurred during PDF upload';
      logger.error('PDF upload failed', { error: errorMsg, fileName: pdfFile.name });
      setPdfError(errorMsg);
    } finally {
      setPdfLoading(false);
      logger.debug('PDF upload state reset to not loading');
    }
  };

  return {
    pdfFile,
    pdfLoading,
    pdfError,
    pdfUploaded,
    handlePdfFileChange,
    handlePdfSubmit
  };
};