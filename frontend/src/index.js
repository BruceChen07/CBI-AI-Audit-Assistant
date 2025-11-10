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
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setTokenRefresher, apiFetch } from "./utils/api";
import { isLoggedIn } from "./utils/auth";
import AdminLoginPage from "./components/AdminLoginPage";
import AdminPanelPage from "./components/admin/AdminPanelPage";

function Root() {
  // 初始哈希：优先用当前哈希，其次用最近一次访问的哈希，最后回到 "#/"
  const [hash, setHash] = React.useState(
    window.location.hash || localStorage.getItem("last_route") || "#/"
  );

  React.useEffect(() => {
    const onHashChange = () => {
      const newHash = window.location.hash || "#/";
      setHash(newHash);
      try {
        localStorage.setItem("last_route", newHash);
      } catch {}
    };
    window.addEventListener("hashchange", onHashChange);
    // 进入时也记录一次（处理刷新场景）
    try {
      localStorage.setItem("last_route", window.location.hash || "#/");
    } catch {}
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (hash.startsWith("#/admin-login")) {
    return <AdminLoginPage />;
  }
  if (hash.startsWith("#/admin-panel")) {
    // If not logged in, redirect to login with a redirect parameter
    if (!isLoggedIn()) {
      const redirect = encodeURIComponent(hash.slice(1)); // e.g., "/admin-panel?section=config"
      window.location.hash = `#/admin-login?redirect=${redirect}`;
      return <AdminLoginPage />;
    }
    return <AdminPanelPage />;
  }
  // Home page requires login
  if (!isLoggedIn()) {
    const redirect = encodeURIComponent("/"); // Return to home after login
    window.location.hash = `#/admin-login?redirect=${redirect}`;
    return <AdminLoginPage />;
  }
  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register refresher (requires backend to provide /auth/refresh)
setTokenRefresher(async (oldToken) => {
  const data = await apiFetch(
    "/auth/refresh",
    { method: "POST", headers: { Authorization: `Bearer ${oldToken}` } },
    /* attachAuth */ false
  );
  return data?.access_token ?? null;
});
