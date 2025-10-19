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

import React, { useState } from "react";
import { saveAuth } from "../utils/auth";
import { apiFetch } from "../utils/api";

const pageStyle = {
  minHeight: "100vh",
  background: "#1a202c",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const cardStyle = {
  background: "#2d3748",
  padding: 24,
  borderRadius: 10,
  width: 360,
  boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
};

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const resp = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      // resp: { access_token, token_type, role }
      saveAuth(resp.access_token, resp.role, username);

      // After login, navigate to the redirect target (more robust redirect handling)
      const curHash = window.location.hash || "";
      const qs = curHash.includes("?") ? curHash.split("?")[1] : "";
      const params = new URLSearchParams(qs);
      let redirect = params.get("redirect") || "/";      // Default: go back to the home page
      if (!redirect.startsWith("/")) redirect = "/";      // Fallback: invalid value redirects to home
      const targetHash = `#${redirect}`;

      // 1) Use replace to avoid navigating back to the login page
      const fullUrl = `${window.location.origin}${window.location.pathname}${targetHash}`;
      window.location.replace(fullUrl);

      // 2) Fallback for rare cases: ensure a hashchange is triggered
      setTimeout(() => {
        if (window.location.hash !== targetHash) {
          window.location.hash = targetHash;
        } else {
          window.dispatchEvent(new HashChangeEvent("hashchange"));
        }
      }, 0);
    } catch (err) {
      const msg = String(err?.message || "");
      if (err?.status === 401 || err?.status === 403) {
        setError("You do not have permission or the username/password is incorrect");
      } else {
        setError(msg || "Login failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12, textAlign: "left" }}>
            <label>Username</label>
            <input
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                borderRadius: "4px",
                border: "1px solid #4a5568",
                background: "#4a5568",
                color: "#fff",
              }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 12, textAlign: "left" }}>
            <label>Password</label>
            <input
              type="password"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "4px",
                borderRadius: "4px",
                border: "1px solid #4a5568",
                background: "#4a5568",
                color: "#fff",
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div style={{ color: "#ff6b6b", marginBottom: 10, textAlign: "left" }}>
              {error}
            </div>
          )}
          <button disabled={busy} type="submit" style={{ width: "100%", padding: 10 }}>
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>
        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
          After successful login, you will be redirected to the Admin panel page
        </div>
      </div>
    </div>
  );
}