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

// Token & role storage helpers

const TOKEN_KEY = "auth_token";
const ROLE_KEY = "auth_role";
const USERNAME_KEY = "auth_username";

// Simple auth event system
const listeners = new Set();
function notifyAuthChange(event, payload) {
  for (const cb of Array.from(listeners)) {
    try {
      cb(event, payload);
    } catch (e) {
      console.error("auth change listener error:", e);
    }
  }
}

/**
 * Subscribe to auth changes: ('login' | 'logout')
 * Return unsubscribe function.
 */
export function onAuthChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function saveAuth(token, role, username) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (role) localStorage.setItem(ROLE_KEY, role);
    if (username) localStorage.setItem(USERNAME_KEY, username);
  } catch (e) {
    console.error("Failed to persist auth:", e);
  }
  notifyAuthChange("login", { token, role, username });
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function getRole() {
  try {
    return localStorage.getItem(ROLE_KEY) || null;
  } catch {
    return null;
  }
}

export function getUsername() {
  try {
    return localStorage.getItem(USERNAME_KEY) || null;
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return !!getToken();
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USERNAME_KEY);
  } catch {}
  notifyAuthChange("logout", {});
}

// ---- JWT helpers ----
function safeAtob(b64) {
  try {
    return atob(b64);
  } catch {
    try {
      // Node polyfill if needed, but CRA runs in browser so usually not needed
      return Buffer.from(b64, "base64").toString("binary");
    } catch {
      return "";
    }
  }
}

export function parseJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      safeAtob(payloadB64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getTokenPayload() {
  const t = getToken();
  if (!t) return null;
  return parseJwt(t);
}

export function getTokenExpiry() {
  const payload = getTokenPayload();
  if (!payload || typeof payload.exp !== "number") return null;
  return payload.exp; // seconds since epoch
}

export function willExpireSoon(thresholdSec = 60) {
  const exp = getTokenExpiry();
  if (!exp) return false; // unknown, treat as not expiring
  const nowSec = Math.floor(Date.now() / 1000);
  return exp - nowSec <= thresholdSec;
}