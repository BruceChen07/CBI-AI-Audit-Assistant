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

// Minimal API wrapper that attaches Authorization header automatically
// Added: token auto-refresh hooks and 401 interception

import { getToken, saveAuth, logout, willExpireSoon, getTokenPayload } from "./auth";
import * as logger from "./logger";

const DEFAULT_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

let tokenRefresher = null; // (oldToken) => Promise<newToken|null>
let refreshInFlight = null; // Promise<string|null>


    // Register a token refresher.
    // Make sure to pass the current token via Authorization header and disable attachAuth to avoid recursion
    setTokenRefresher(async (oldToken) => {
      const data = await apiFetch(
        "/auth/refresh",
        { method: "POST", headers: { Authorization: `Bearer ${oldToken}` } },
        /* attachAuth */ false
      );
      return data?.access_token ?? null;
    });

export function setTokenRefresher(fn) {
  tokenRefresher = typeof fn === "function" ? fn : null;
}

async function runRefresherOnce(oldToken) {
  if (!tokenRefresher) return null;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const newToken = await tokenRefresher(oldToken);
        if (newToken) {
          const payload = getTokenPayload(newToken) || {};
          const role = payload.role || null;
          const username = payload.sub || null;
          saveAuth(newToken, role, username);
          return newToken;
        }
        return null;
      } catch {
        return null;
      } finally {
        // small delay to reduce chance of thundering herd retries
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      }
    })();
  }
  return refreshInFlight;
}

/**
 * Core API fetch
 * @param {string} path
 * @param {RequestInit} options
 * @param {boolean} attachAuth - whether to auto attach Authorization header (default true)
 */
export async function apiFetch(path, options = {}, attachAuth = true) {
  const base = DEFAULT_BASE.replace(/\/+$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const method = String(options.method || "GET").toUpperCase();

  let headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const isRefreshEndpoint =
    path === "/auth/refresh" || String(path).endsWith("/auth/refresh");
  let token = getToken();
  if (attachAuth && token && !isRefreshEndpoint) {
    if (willExpireSoon(60)) {
      logger.info("Token close to expiry, attempting refresh preflight", { path, method });
      const refreshed = await runRefresherOnce(token);
      if (refreshed) token = refreshed;
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const ctx = logger.httpStart({
    url,
    path,
    method,
    attachAuth,
    hasAuthHeader: headers.has("Authorization"),
    tokenPresent: !!token,
  });

  const doFetch = async () => {
    const resp = await fetch(url, { ...options, headers });
    const text = await resp.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { resp, data };
  };

  let { resp, data } = await doFetch();

  if (resp.status === 401 && attachAuth && !isRefreshEndpoint) {
    logger.warn("Received 401, trying token refresh and retry", { path, method });
    const old = token;
    const refreshed = await runRefresherOnce(old);
    if (refreshed) {
      headers.set("Authorization", `Bearer ${refreshed}`);
      ({ resp, data } = await doFetch());
    }
  }

  if (!resp.ok) {
    if (resp.status === 401) {
      if (attachAuth && !isRefreshEndpoint) {
        logout();
        logger.warn("Unauthorized, performed hard logout", { path, method });
      }
      const message =
        (data && (data.detail || data.message)) ||
        "Unauthorized. Please login again.";
      const err = new Error(message);
      err.status = resp.status;
      err.data = data;
      logger.httpError(ctx, err);
      throw err;
    }
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${resp.status}`;
    const err = new Error(message);
    err.status = resp.status;
    err.data = data;
    logger.httpError(ctx, err);
    throw err;
  }

  logger.httpEnd(ctx, { status: resp.status, ok: true });
  return data;
}