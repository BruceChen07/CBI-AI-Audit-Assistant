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
const debugLegacy = (message, data) => {
  if (currentLogLevel <= LogLevel.DEBUG) {
    const logEntry = addToHistory('debug', message, data);
    console.debug(`[DEBUG] ${logEntry.timestamp} - ${message}`, data || '');
  }
};

const infoLegacy = (message, data) => {
  if (currentLogLevel <= LogLevel.INFO) {
    const logEntry = addToHistory('info', message, data);
    console.info(`[INFO] ${logEntry.timestamp} - ${message}`, data || '');
  }
};

const warnLegacy = (message, data) => {
  if (currentLogLevel <= LogLevel.WARN) {
    const logEntry = addToHistory('warn', message, data);
    console.warn(`[WARN] ${logEntry.timestamp} - ${message}`, data || '');
  }
};

const errorLegacy = (message, data) => {
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
  debug: debugLegacy,
  info: infoLegacy,
  warn: warnLegacy,
  error: errorLegacy
};

export default logger;

// 简易前端日志模块：支持级别、HTTP请求事件、持久化到 localStorage

const MAX_EVENTS = 300;
let level = "debug"; // debug | info | warn | error
let persist = true;
const events = [];

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return String(Date.now());
  }
}

function should(levelName) {
  const order = ["debug", "info", "warn", "error"];
  return order.indexOf(levelName) >= order.indexOf(level);
}

function push(event) {
  events.push(event);
  while (events.length > MAX_EVENTS) events.shift();

  if (persist) {
    try {
      localStorage.setItem("app_logs", JSON.stringify(events));
    } catch {}
  }

  try {
    const head = `[${event.ts}] ${event.level.toUpperCase()} ${event.type}: ${event.message}`;
    const data = event.data || {};
    if (event.level === "error") console.error(head, data);
    else if (event.level === "warn") console.warn(head, data);
    else console.log(head, data);
  } catch {}
}

export function setLevel(lvl) {
  if (["debug", "info", "warn", "error"].includes(lvl)) level = lvl;
}

export function setPersist(on) {
  persist = !!on;
}

export function emit(type, lvl, msg, data) {
  if (!should(lvl)) return;
  push({ ts: nowIso(), type, level: lvl, message: msg, data });
}

export function debug(msg, data) { emit("log", "debug", msg, data); }
export function info(msg, data) { emit("log", "info", msg, data); }
export function warn(msg, data) { emit("log", "warn", msg, data); }
export function error(msg, data) { emit("log", "error", msg, data); }

export function httpStart(info) {
  const t0 = (typeof performance !== "undefined" ? performance.now() : Date.now());
  emit("http", "debug", "HTTP request start", info);
  return { t0, info };
}

export function httpEnd(ctx, res) {
  const t1 = (typeof performance !== "undefined" ? performance.now() : Date.now());
  const durationMs = Math.round(t1 - ctx.t0);
  emit("http", "info", "HTTP request end", { ...ctx.info, ...res, durationMs });
}

export function httpError(ctx, err) {
  const t1 = (typeof performance !== "undefined" ? performance.now() : Date.now());
  const durationMs = Math.round(t1 - ctx.t0);
  emit("http", "error", "HTTP request error", {
    ...ctx.info,
    error: err?.message || String(err),
    durationMs,
  });
}

export function getEvents() { return [...events]; }
export function clearEvents() {
  events.length = 0;
  try { localStorage.removeItem("app_logs"); } catch {}
}

export function loadPersisted() {
  try {
    const raw = localStorage.getItem("app_logs");
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      events.splice(0, events.length, ...arr.slice(-MAX_EVENTS));
    }
  } catch {}
}

// 初始化：加载历史日志（刷新后也能看）
loadPersisted();