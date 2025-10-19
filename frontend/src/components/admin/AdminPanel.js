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

import React, { useEffect, useMemo, useState } from "react";
import { isLoggedIn, getRole, onAuthChange } from "../../utils/auth";
import AdminUsersPage from "./AdminUsersPage";
import AdminConfigPage from "./AdminConfigPage";
import AdminMetricsPage from "./AdminMetricsPage";

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const panel = {
  background: "#2d3748",
  color: "#fff",
  width: "90%",
  maxWidth: 1100,
  maxHeight: "90vh",
  borderRadius: 10,
  boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
  display: "flex",
  flexDirection: "column",
};

const header = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  borderBottom: "1px solid #4a5568",
};

const tabs = {
  display: "flex",
  gap: 8,
  padding: "8px 16px",
  borderBottom: "1px solid #4a5568",
};

const content = {
  padding: 16,
  overflow: "auto",
  flex: 1,
};

export default function AdminPanel({ onClose }) {
  const [tick, setTick] = useState(0);
  const [tab, setTab] = useState(() => {
    // Restore last tab when opening the panel
    return localStorage.getItem("admin_tab") || "users";
  }); // users | settings | metrics

  useEffect(() => {
    // Refresh when login status/role changes (e.g., 401 auto logout)
    const unsub = onAuthChange(() => setTick((v) => v + 1));
    return unsub;
  }, []);

  const session = {
    logged: isLoggedIn(),
    role: getRole(),
  };

  const isAdmin = session.logged && session.role === "admin";

  const switchTab = (next) => {
    setTab(next);
    try {
      localStorage.setItem("admin_tab", next);
    } catch (_) {}
  };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <strong>Admin Panel</strong>
          <button onClick={onClose}>Close</button>
        </div>

        {!isAdmin ? (
          <div style={{ padding: 20 }}>
            <div style={{ color: "#ff6b6b", marginBottom: 8 }}>
              You are not authorized. Please login as admin.
            </div>
            <button onClick={onClose}>OK</button>
          </div>
        ) : (
          <>
            <div style={tabs}>
              <button
                onClick={() => switchTab("users")}
                style={{ background: tab === "users" ? "#4a5568" : "#718096" }}
              >
                Users
              </button>
              <button
                onClick={() => switchTab("settings")}
                style={{ background: tab === "settings" ? "#4a5568" : "#718096" }}
              >
                Settings
              </button>
              <button
                onClick={() => switchTab("metrics")}
                style={{ background: tab === "metrics" ? "#4a5568" : "#718096" }}
              >
                Metrics
              </button>
            </div>
            <div style={content}>
              {tab === "users" && <AdminUsersPage />}
              {tab === "settings" && <AdminConfigPage />}
              {tab === "metrics" && <AdminMetricsPage />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}