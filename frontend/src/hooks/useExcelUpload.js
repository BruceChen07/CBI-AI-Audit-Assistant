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

export const useExcelUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      logger.info('User selected file', { fileName: selectedFile.name, fileSize: selectedFile.size });
      
      // Check file type
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        const errorMsg = 'Please upload an Excel file (.xlsx or .xls format)';
        logger.warn('Unsupported file format', { fileName: selectedFile.name });
        setError(errorMsg);
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setData(null); // Reset data state, need to re-upload
      logger.debug('File set to state', { fileName: selectedFile.name });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    logger.info('User submitted form');
    
    if (!file) {
      const errorMsg = 'Please select a file';
      logger.warn(errorMsg);
      setError(errorMsg);
      return;
    }

    logger.info('Starting file upload', { fileName: file.name, fileSize: file.size });
    setLoading(true);
    setError('');
    setData(null);

    const formData = new FormData();
    formData.append('file', file);
    
    const startTime = Date.now();
    try {
      // Use correct API path
      const apiUrl = 'http://localhost:8000/upload/';
      logger.debug('Sending request to backend', { url: apiUrl });
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Server returned error', { status: response.status, error: errorData });
        throw new Error(errorData.detail || 'Upload failed');
      }

      const result = await response.json();
      logger.info('File uploaded successfully', { 
        fileName: file.name, 
        recordCount: result.data.length,
        responseTime: Date.now() - startTime
      });
      setData(result.data);
    } catch (err) {
      const errorMsg = err.message || 'Error occurred during upload';
      logger.error('File upload failed', { error: errorMsg, fileName: file.name });
      setError(errorMsg);
    } finally {
      setLoading(false);
      logger.debug('Upload state reset to not loading');
    }
  };

  return {
    file,
    loading,
    error,
    data,
    handleFileChange,
    handleSubmit,
    setData
  };
};