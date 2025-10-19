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


const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level, can be dynamically adjusted based on environment variables or configuration
let currentLogLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

// Array to store logs, can be used to send logs to server
const logHistory = [];
const MAX_LOG_HISTORY = 1000; // Maximum number of logs to store

// Format date and time
const formatDate = () => {
  const now = new Date();
  return now.toISOString();
};

// Add log to history
const addToHistory = (level, message, data) => {
  const logEntry = {
    timestamp: formatDate(),
    level,
    message,
    data: data || null
  };
  
  logHistory.push(logEntry);
  
  // If log history exceeds maximum limit, remove oldest log
  if (logHistory.length > MAX_LOG_HISTORY) {
    logHistory.shift();
  }
  
  return logEntry;
};

// Send logs to server
const sendLogsToServer = async (url) => {
  if (logHistory.length === 0) return;
  
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logs: logHistory })
    });
    
    // Clear sent logs
    logHistory.length = 0;
  } catch (error) {
    console.error('Failed to send logs to server:', error);
  }
};

// Set log level
const setLogLevel = (level) => {
  if (Object.values(LogLevel).includes(level)) {
    currentLogLevel = level;
  }
};

// Get current log level
const getLogLevel = () => currentLogLevel;

// Get log history
const getLogHistory = () => [...logHistory];

// Clear log history
const clearLogHistory = () => {
  logHistory.length = 0;
};

// Log functions
const debug = (message, data) => {
  if (currentLogLevel <= LogLevel.DEBUG) {
    const logEntry = addToHistory('debug', message, data);
    console.debug(`[DEBUG] ${logEntry.timestamp} - ${message}`, data || '');
  }
};

const info = (message, data) => {
  if (currentLogLevel <= LogLevel.INFO) {
    const logEntry = addToHistory('info', message, data);
    console.info(`[INFO] ${logEntry.timestamp} - ${message}`, data || '');
  }
};

const warn = (message, data) => {
  if (currentLogLevel <= LogLevel.WARN) {
    const logEntry = addToHistory('warn', message, data);
    console.warn(`[WARN] ${logEntry.timestamp} - ${message}`, data || '');
  }
};

const error = (message, data) => {
  if (currentLogLevel <= LogLevel.ERROR) {
    const logEntry = addToHistory('error', message, data);
    console.error(`[ERROR] ${logEntry.timestamp} - ${message}`, data || '');
  }
};

// Export logging utility
const logger = {
  LogLevel,
  setLogLevel,
  getLogLevel,
  getLogHistory,
  clearLogHistory,
  sendLogsToServer,
  debug,
  info,
  warn,
  error
};

export default logger;