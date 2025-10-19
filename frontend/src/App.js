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

import React, { useState, useEffect } from 'react';
import './App.css';
import logger from './utils/logger';
import ExcelUpload from './components/ExcelUpload';
import PdfUpload from './components/PdfUpload';
import BatchProcessing from './components/BatchProcessing';
import DownloadResults from './components/DownloadResults';
import logo from './logo.png';
import AdminMenu from './components/AdminMenu';
import AdminPanel from './components/admin/AdminPanel';
import { getRole, onAuthChange } from './utils/auth';

function App() {
  const [data, setData] = useState(null);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [readyForDownload, setReadyForDownload] = useState(false);
  const [sessionId, setSessionId] = useState(null); // manage sessionId state
  const [batchQueryStats, setBatchQueryStats] = useState({ total: 0, success: 0, failed: 0 }); // manage statistics state
  const [showAdminPanel, setShowAdminPanel] = useState(false); // control admin panel
  const [role, setRole] = useState(getRole() || null);

  useEffect(() => {
    const unsub = onAuthChange(() => {
      setRole(getRole() || null);
    });
    return unsub;
  }, []);

  // event handler callbacks for child components; fix undefined error
  const handleDataChange = React.useCallback((newData) => {
    logger.info("handleDataChange", newData);
    setData(newData || null);
    // Reset download-ready state after data changes
    setReadyForDownload(false);
  }, []);

  const handlePdfUploadStatusChange = React.useCallback((uploaded) => {
    logger.info("handlePdfUploadStatusChange", uploaded);
    setPdfUploaded(!!uploaded);
  }, []);

  const handleReadyForDownload = React.useCallback((ready) => {
    logger.info("handleReadyForDownload", ready);
    setReadyForDownload(!!ready);
  }, []);

  const handleSessionIdChange = React.useCallback((id) => {
    logger.info("handleSessionIdChange", id);
    setSessionId(id || null);
  }, []);

  const handleBatchQueryStatsChange = React.useCallback((stats) => {
    logger.info("handleBatchQueryStatsChange", stats);
    setBatchQueryStats(stats || { total: 0, success: 0, failed: 0 });
  }, []);

  // when the panel is open, auto-close if role is not admin
  useEffect(() => {
    if (showAdminPanel && role !== 'admin') {
      setShowAdminPanel(false);
    }
  }, [showAdminPanel, role]);

  return (
    <div className="App">
      <header className="App-header">
        {/* Top-right Admin menu */}
        <AdminMenu />

        <div className="logo-container">
          <img src={logo} alt="AI Audit Assistant Logo" className="app-logo" />
        </div>
        <h1>AI Audit Assistant</h1>
        {/* Optionally show a placeholder for Admin Panel in future steps */}
        {/* Admin Panel entry guard */}
        {showAdminPanel && (
          role === 'admin' ? (
            <AdminPanel onClose={() => setShowAdminPanel(false)} />
          ) : (
            <NoAccess onClose={() => setShowAdminPanel(false)} />
          )
        )}

        {/* Two-column layout */}
        <div className="two-column-layout">
          <ExcelUpload onDataChange={handleDataChange} />
          <PdfUpload onUploadStatusChange={handlePdfUploadStatusChange} />
        </div>

        <BatchProcessing 
          data={data}
          pdfUploaded={pdfUploaded}
          onReadyForDownload={handleReadyForDownload}
          onDataChange={handleDataChange}
          onSessionIdChange={handleSessionIdChange}
          onBatchQueryStatsChange={handleBatchQueryStatsChange}
        />

        {/* Download section - using new architecture */}
        {readyForDownload && data && sessionId && (
          <div className="upload-success-container">
            <DownloadResults 
              data={data}
              batchQueryStats={batchQueryStats}
              batchQueryCompleted={readyForDownload}
              sessionId={sessionId}
            />
          </div>
        )}
      </header>
    </div>
  );
}

// No-access panel (inline)
function NoAccess({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{ background: "#2d3748", padding: 16, borderRadius: 8, minWidth: 320 }}>
        <h3 style={{ marginTop: 0 }}>No permission</h3>
        <p>You need admin role to access Admin Panel.</p>
        <div style={{ textAlign: "right" }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default App;
